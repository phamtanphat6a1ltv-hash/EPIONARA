import asyncio
import base64
import json
import logging
import time
from typing import List, Optional

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("FaceEmotionBackend")

# Try importing DeepFace & MediaPipe for high-accuracy emotion detection & facial landmarks
DEEPFACE_AVAILABLE = False
MEDIAPIPE_AVAILABLE = False

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
    logger.info("DeepFace library loaded successfully!")
except ImportError:
    logger.warning("DeepFace not found. Backend will use MediaPipe & lightweight fallback.")

try:
    import mediapipe as mp
    mp_face_mesh = mp.solutions.face_mesh
    mp_face_detection = mp.solutions.face_detection
    MEDIAPIPE_AVAILABLE = True
    logger.info("MediaPipe library loaded successfully!")
except ImportError:
    logger.warning("MediaPipe library not found in Python backend environment.")

app = FastAPI(title="Real-time Face Emotion Recognition API")

# CORS middleware config for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    """Manages active WebSocket connections."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Active connections: {len(self.active_connections)}")

manager = ConnectionManager()

import math
import config

def _dist(a, b):
    return math.hypot(a.x - b.x, a.y - b.y)

# ==========================================
# BIỂU CẢM KHUÔN MẶT (MediaPipe Face Mesh)
# ==========================================
# Các chỉ số landmark quan trọng trên Face Mesh (468 điểm):
#   61, 291   : khoé miệng trái/phải
#   13, 14    : môi trên/dưới (giữa)
#   234, 454  : má trái/phải (dùng để chuẩn hoá theo độ rộng mặt)
#   159, 145  : mí mắt trên/dưới - mắt trái
#   386, 374  : mí mắt trên/dưới - mắt phải
#   33, 133   : khoé mắt trái (ngoài/trong) - dùng chuẩn hoá độ mở mắt

def detect_smile(face_landmarks) -> bool:
    if not face_landmarks:
        return False
    lm = face_landmarks.landmark
    mouth_width = _dist(lm[61], lm[291])
    face_width = _dist(lm[234], lm[454]) + 1e-6
    ratio = mouth_width / face_width
    return ratio > config.SMILE_RATIO_THRESHOLD

# Fallback emotion detector — works without CascadeClassifier (removed in OpenCV 5.0)
# Uses HSV skin-color detection to check for a face-like region, then generates
# simulated emotion scores based on frame brightness/contrast for consistent output.
class FallbackEmotionDetector:
    def __init__(self):
        self.emotions = ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral']
        # Weight mapping: brighter frames → happier; darker → sadder
        self._brightness_emotion_order = ['sad', 'fearful', 'angry', 'neutral', 'surprised', 'happy', 'disgusted']

    def _detect_skin(self, frame) -> float:
        """Returns the ratio of skin-colored pixels in the frame (0.0-1.0)."""
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        # Typical skin tone range in HSV
        lower_skin = np.array([0, 30, 60], dtype=np.uint8)
        upper_skin = np.array([25, 170, 255], dtype=np.uint8)
        mask = cv2.inRange(hsv, lower_skin, upper_skin)
        skin_ratio = float(np.count_nonzero(mask)) / (mask.shape[0] * mask.shape[1])
        return skin_ratio

    def detect(self, frame) -> dict:
        """Lightweight face-presence check + simulated emotion output."""
        skin_ratio = self._detect_skin(frame)

        # If less than 5% skin pixels → probably no face in frame
        if skin_ratio < 0.05:
            return {"face_detected": False, "emotion": "neutral", "confidence": 0, "all_emotions": {}}

        # Use frame brightness to pick a deterministic (but varied) emotion
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))  # 0-255
        # Map brightness (typically 60-200) into an emotion index
        idx = int((brightness / 255.0) * (len(self._brightness_emotion_order) - 1))
        idx = max(0, min(idx, len(self._brightness_emotion_order) - 1))
        dominant_emotion = self._brightness_emotion_order[idx]

        # Generate a confidence score from contrast (std dev of gray values)
        contrast = float(np.std(gray))
        confidence = min(95.0, max(55.0, 50.0 + contrast * 0.6))

        # Build all-emotion scores
        all_emotions = {}
        remaining = 100.0 - confidence
        for e in self.emotions:
            if e == dominant_emotion:
                all_emotions[e] = round(confidence / 100.0, 3)
            else:
                share = remaining / max(1, len(self.emotions) - 1)
                all_emotions[e] = round(share / 100.0, 3)

        return {
            "face_detected": True,
            "emotion": dominant_emotion,
            "confidence": round(confidence, 1),
            "all_emotions": all_emotions
        }

fallback_detector = FallbackEmotionDetector()

def decode_image(base64_data: str) -> Optional[np.ndarray]:
    """Decodes a base64 encoded string image into an OpenCV frame."""
    if "," in base64_data:
        # Strip header if present
        base64_data = base64_data.split(",")[1]
    
    img_bytes = base64.b64decode(base64_data)
    nparr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return frame

@app.get("/")
def read_root():
    return {
        "status": "online",
        "deepface_available": DEEPFACE_AVAILABLE,
        "device": "CPU"  # DeepFace defaults to CPU unless configured with TF/PyTorch GPU
    }

def analyze_frame(frame: np.ndarray) -> dict:
    """Analyze a single frame for emotions. Runs synchronously (CPU-bound)."""
    start_time = time.time()
    result = None

    # Process with DeepFace if available
    if DEEPFACE_AVAILABLE:
        try:
            analysis = DeepFace.analyze(
                img_path=frame,
                actions=['emotion'],
                enforce_detection=False,
                silent=True
            )

            face_data = None
            if isinstance(analysis, list) and len(analysis) > 0:
                face_data = analysis[0]
            elif isinstance(analysis, dict):
                face_data = analysis

            if isinstance(face_data, dict):
                dominant_emotion = face_data.get("dominant_emotion", "neutral")
                emotion_scores = face_data.get("emotion", {})
                confidence = float(emotion_scores.get(dominant_emotion, 0))

                # Normalize scoring values to 0-1 range
                all_emotions = {k.lower(): round(v / 100, 3) for k, v in emotion_scores.items()}

                # Align naming to match frontend
                emotion_name_map = {
                    "fear": "fearful",
                    "surprise": "surprised"
                }
                aligned_emotion = emotion_name_map.get(dominant_emotion.lower(), dominant_emotion.lower())

                clean_all_emotions = {}
                for k, v in all_emotions.items():
                    clean_all_emotions[emotion_name_map.get(k, k)] = v

                result = {
                    "face_detected": True,
                    "emotion": aligned_emotion,
                    "confidence": round(confidence, 1),
                    "all_emotions": clean_all_emotions,
                    "processing_time_ms": round((time.time() - start_time) * 1000, 1)
                }
        except Exception as e:
            logger.error(f"DeepFace processing error: {e}")

    # Fallback to Haar Cascade + mock if DeepFace fails or is unavailable
    if result is None:
        fallback_result = fallback_detector.detect(frame)
        result = {
            **fallback_result,
            "processing_time_ms": round((time.time() - start_time) * 1000, 1),
            "backend_mode": "fallback_mock"
        }

    return result


@app.websocket("/ws/face-emotion")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    # Use an asyncio.Event to track if a frame is currently being processed.
    # While processing, new incoming frames are stored in `latest_frame` (only the
    # newest one is kept) so the analysis always works on the freshest data.
    processing_lock = asyncio.Lock()
    latest_frame: dict = {"data": None}  # mutable container for latest raw message

    async def process_frame(raw_data: str):
        """Decode, analyze, and send result for a single frame."""
        try:
            message = json.loads(raw_data)
            image_data = message.get("image", "")
            if not image_data:
                return

            frame = decode_image(image_data)
            if frame is None or frame.size == 0:
                return

            # Run CPU-heavy analysis in a thread so we don't block the event loop
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, analyze_frame, frame)

            await websocket.send_text(json.dumps(result))
        except WebSocketDisconnect:
            # Propagate WebSocketDisconnect to exit the connection handler loop immediately
            raise
        except json.JSONDecodeError:
            logger.error("Failed to parse JSON message from client.")
        except Exception as e:
            logger.error(f"Error handling frame: {e}")

    try:
        while True:
            data = await websocket.receive_text()

            if processing_lock.locked():
                # Backend is busy — store the newest frame and skip older ones
                latest_frame["data"] = data
                continue

            async with processing_lock:
                # Process the current frame
                await process_frame(data)

                # After finishing, check if a newer frame arrived while we were busy
                while latest_frame["data"] is not None:
                    newer_data = latest_frame["data"]
                    latest_frame["data"] = None
                    await process_frame(newer_data)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket endpoint exception: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    # Run FastAPI app on local server
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)