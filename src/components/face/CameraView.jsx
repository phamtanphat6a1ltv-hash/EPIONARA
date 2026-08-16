import { useState, useEffect, useRef, useCallback } from "react";
import { useFaceWorker } from "../../hooks/useFaceWorker.js";
import { useEmotionStabilizer } from "../../hooks/useEmotionStabilizer.js";
import { EMOTION_CONFIG } from "./constants.js";

export default function CameraView({ onDetected, onStop, detected, t }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [status, setStatus] = useState("idle"); // idle | loading | running | error
  const [supported, setSupported] = useState(true);
  const [stream, setStream] = useState(null);
  
  const animationFrameRef = useRef(null);
  const lastInferenceTimeRef = useRef(0);

  const { stabilizedResult, processFrame, reset: resetStabilizer } = useEmotionStabilizer();
  
  // Callback when worker returns a detection
  const handleWorkerResult = useCallback((detections) => {
    if (detections && detections.length > 0 && videoRef.current) {
      // Pick the main face (first one or largest)
      const mainFace = detections[0];
      const video = videoRef.current;
      
      const result = processFrame(
        mainFace.expressions, 
        mainFace.detection.box, 
        video.videoWidth, 
        video.videoHeight,
        mainFace.age
      );
      
      onDetected(result);

      // Draw MediaPipe Bounding Box & 68 Landmark Mesh
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const mainColor = result?.color || "#38bdf8";
        const box = mainFace.detection.box;

        // 1. Draw glowing Bounding Box
        ctx.save();
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = mainColor;
        ctx.shadowBlur = 8;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.restore();

        // 2. Draw 68 MediaPipe Facial Landmark Dots & Mesh Contours
        const lm = mainFace.landmarks;
        if (lm && lm.length >= 68) {
          ctx.save();
          
          // Draw Landmark contours (Eyebrows, Eyes, Lips, Nose)
          const drawContour = (pts, close = false, color = "rgba(56, 189, 248, 0.6)") => {
            if (pts.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
              ctx.lineTo(pts[i].x, pts[i].y);
            }
            if (close) ctx.closePath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          };

          // Jawline (0..16)
          drawContour(lm.slice(0, 17), false, "rgba(255, 255, 255, 0.3)");
          // Left Eyebrow (17..21), Right Eyebrow (22..26)
          drawContour(lm.slice(17, 22), false, "rgba(52, 211, 153, 0.8)");
          drawContour(lm.slice(22, 27), false, "rgba(52, 211, 153, 0.8)");
          // Nose Bridge (27..30), Nostrils (31..35)
          drawContour(lm.slice(27, 31), false, "rgba(56, 189, 248, 0.6)");
          drawContour(lm.slice(31, 36), false, "rgba(56, 189, 248, 0.6)");
          // Left Eye (36..41), Right Eye (42..47)
          drawContour(lm.slice(36, 42), true, "rgba(251, 191, 36, 0.85)");
          drawContour(lm.slice(42, 48), true, "rgba(251, 191, 36, 0.85)");
          // Outer Lips (48..59), Inner Lips (60..67)
          drawContour(lm.slice(48, 60), true, "rgba(244, 114, 182, 0.85)");
          drawContour(lm.slice(60, 68), true, "rgba(244, 114, 182, 0.5)");

          // Draw Glowing Dots for each MediaPipe Landmark point
          lm.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.8, 0, 2 * Math.PI);
            ctx.fillStyle = "#38bdf8";
            ctx.fill();
          });

          ctx.restore();
        }
      }
    } else {
      // No face detected, send empty box to let stabilizer know (quality drops)
      const result = processFrame({}, null, videoRef.current?.videoWidth, videoRef.current?.videoHeight);
      onDetected(result);
      
      // Clear bounding box
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [processFrame, onDetected]);

  const handleWorkerError = useCallback((err) => {
    console.error("[CameraView] Face Worker Error:", err);
    setStatus("error");
  }, []);

  const { isLoaded, loadProgress, initWorker, processImage, terminateWorker } = useFaceWorker(handleWorkerResult, handleWorkerError);

  // The main rendering and processing loop
  const loop = useCallback(() => {
    if (!videoRef.current || status !== "running") return;
    const video = videoRef.current;
    if (video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(loop);
      return;
    }

    const now = Date.now();
    const timeSinceLastInference = now - lastInferenceTimeRef.current;
    
    // Throttle inference to `inferenceFps`
    if (timeSinceLastInference >= 1000 / EMOTION_CONFIG.inferenceFps) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const accepted = processImage(imgData);
        if (accepted) {
          lastInferenceTimeRef.current = now;
        }
      } catch (e) {
        console.warn("[CameraView] Frame capture error:", e.message);
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(loop);
  }, [isLoaded, status, processImage]);

  // Start loop when running
  useEffect(() => {
    if (status === "running") {
      animationFrameRef.current = requestAnimationFrame(loop);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [status, loop]);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setSupported(false); return; }
    setStatus("loading");
    resetStabilizer();

    try {
      // 1. Get Camera Stream
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      setStream(s);
      
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.onloadedmetadata = () => videoRef.current.play().catch(() => {});
      }

      // 2. Load Worker
      await initWorker();
      
      // 3. Start running
      setStatus("running");

    } catch (e) {
      console.error("[CameraView] Camera/Worker error:", e.message);
      if (e.name === "NotAllowedError") {
        setStatus("error");
      } else if (!isLoaded) {
        setStatus("error");
      } else {
        setSupported(false);
      }
    }
  };

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setStatus("idle");
    onStop();
    
    if (videoRef.current) videoRef.current.srcObject = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    terminateWorker();
    resetStabilizer();
  }, [stream, onStop, terminateWorker, resetStabilizer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (videoRef.current?.srcObject) {
        const currentStream = videoRef.current.srcObject;
        currentStream.getTracks().forEach(t => t.stop());
      }
      terminateWorker();
    };
  }, [terminateWorker]);

  const isRunning = status === "running";

  if (!supported) {
    return (
      <div style={{
        textAlign: "center", padding: 40,
        background: "rgba(239,68,68,0.08)", borderRadius: 20,
        border: "1px solid rgba(239,68,68,0.2)",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
        <p style={{ color: "#f87171", fontSize: 14 }}>
          {t.face_no_support || "Webcam không khả dụng hoặc bị từ chối quyền"}
        </p>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 8 }}>
          {t.face_allow_camera || "Vui lòng cho phép truy cập camera trong cài đặt trình duyệt"}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--glass-bg)",
      border: `2.5px solid ${detected?.color || "var(--border2)"}`,
      borderRadius: 20, overflow: "hidden",
      transition: "border-color 0.5s",
      boxShadow: detected ? `0 0 30px ${detected.color}33` : "none",
      position: "relative",
    }}>
      <div style={{ position: "relative", minHeight: 240, background: "#000" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label="Camera feed for emotion detection"
          style={{
            width: "100%", display: "block",
            transform: "scaleX(-1)",
            objectFit: "cover",
          }}
        />
        {/* Canvas overlay for face detection boxes */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            transform: "scaleX(-1)",
            pointerEvents: "none",
          }}
        />
        {/* Loading overlay */}
        {status === "loading" && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "rgba(7,9,29,0.85)",
            zIndex: 10,
          }}>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-secondary)" }}>
              {t.face_loading || "Đang tải mô hình AI..."}
            </div>
            <div style={{ width: 200, height: 4, background: "var(--border2)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${loadProgress}%`,
                background: "linear-gradient(90deg,#6c3de8,#ec4899)",
                borderRadius: 99, transition: "width 0.1s linear",
              }} />
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 11, marginTop: 8 }}>
              {loadProgress}%
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isRunning && (
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "#22c55e", animation: "pulse 1.2s ease infinite",
              }} />
              <span style={{ color: "#22c55e", fontSize: 12 }}>Live Edge AI</span>
            </div>
          )}
          {isRunning && (
            <span style={{
              fontSize: 10, color: "#38bdf8",
              background: "rgba(56,189,248,0.15)",
              border: "1px solid rgba(56,189,248,0.3)",
              padding: "2px 8px", borderRadius: 99,
              display: "inline-flex", alignItems: "center", gap: 4
            }}>
              <span>✦</span> MediaPipe 68 Mesh ({EMOTION_CONFIG.inferenceFps} FPS)
            </span>
          )}
        </div>
        <button
          onClick={isRunning ? stopCamera : startCamera}
          disabled={status === "loading"}
          aria-label={isRunning ? (t.face_stop || "Stop Camera") : (t.face_start || "Start Camera")}
          style={{
            padding: "8px 20px",
            background: isRunning
              ? "rgba(239,68,68,0.15)"
              : "linear-gradient(135deg,#6c3de8,#ec4899)",
            border: isRunning ? "1px solid rgba(239,68,68,0.3)" : "none",
            color: isRunning ? "#f87171" : "white",
            borderRadius: 99, cursor: status === "loading" ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 600,
            fontFamily: "inherit",
            opacity: status === "loading" ? 0.6 : 1,
          }}
        >
          {isRunning ? (t.face_stop || "⏹ Tắt Camera") : (t.face_start || "📷 Bật Camera")}
        </button>
      </div>
    </div>
  );
}
