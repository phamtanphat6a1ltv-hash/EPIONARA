importScripts('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js');

faceapi.env.monkeyPatch({
  Canvas: OffscreenCanvas,
  createCanvasElement: () => new OffscreenCanvas(1, 1)
});

let initialized = false;

// Geometric distance calculation helper
function dist(p1, p2) {
  if (!p1 || !p2) return 0;
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

// Calculate Eye Aspect Ratio (EAR)
function calcEAR(eye) {
  if (!eye || eye.length < 6) return 0.25;
  const vertical1 = dist(eye[1], eye[5]);
  const vertical2 = dist(eye[2], eye[4]);
  const horizontal = dist(eye[0], eye[3]);
  return (vertical1 + vertical2) / (2.0 * Math.max(1, horizontal));
}

// Calculate Mouth Aspect Ratio (MAR)
function calcMAR(mouth) {
  if (!mouth || mouth.length < 10) return 0.1;
  const vertical = dist(mouth[3], mouth[9] || mouth[7]);
  const horizontal = dist(mouth[0], mouth[6]);
  return vertical / Math.max(1, horizontal);
}

// Calculate Smile Curvature Ratio
function calcSmileRatio(mouth) {
  if (!mouth || mouth.length < 7) return 0;
  const leftCorner = mouth[0];
  const rightCorner = mouth[6];
  const lipTop = mouth[3];
  const mouthWidth = dist(leftCorner, rightCorner);
  const avgCornerY = (leftCorner.y + rightCorner.y) / 2;
  // Positive when corners are lifted higher than top lip center
  return (lipTop.y - avgCornerY) / Math.max(1, mouthWidth);
}

self.onmessage = async (e) => {
  if (e.data.type === 'INIT') {
    try {
      // Force CPU backend to avoid WebGL hangs on OffscreenCanvas in worker
      await faceapi.tf.setBackend('cpu');
      await faceapi.tf.ready();
      
      const modelUri = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelUri);
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelUri);
      await faceapi.nets.faceExpressionNet.loadFromUri(modelUri);
      
      initialized = true;
      self.postMessage({ type: 'INIT_DONE' });
    } catch (err) {
      self.postMessage({ type: 'ERROR', error: err.message });
    }
  } else if (e.data.type === 'DETECT') {
    if (!initialized) return;
    try {
      const { imgData } = e.data;
      const tensor = faceapi.tf.tensor3d(Uint8Array.from(imgData.data), [imgData.height, imgData.width, 4], 'int32').slice([0, 0, 0], [-1, -1, 3]);
      
      // Detect faces with 68 MediaPipe facial landmarks and expressions
      const detections = await faceapi
        .detectAllFaces(tensor, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
        .withFaceLandmarks(true)
        .withFaceExpressions();
        
      tensor.dispose();
      
      const plainDetections = detections.map(d => {
        const exps = { ...(d.expressions || {}) };
        const rawLandmarks = d.landmarks?.positions || [];
        const landmarks = rawLandmarks.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));

        // Calibrate expressions using MediaPipe landmark metrics if available
        if (landmarks.length >= 68) {
          const leftEye = landmarks.slice(36, 42);
          const rightEye = landmarks.slice(42, 48);
          const mouthOuter = landmarks.slice(48, 60);
          const leftBrow = landmarks.slice(17, 22);
          const rightBrow = landmarks.slice(22, 27);

          const leftEAR = calcEAR(leftEye);
          const rightEAR = calcEAR(rightEye);
          const avgEAR = (leftEAR + rightEAR) / 2;
          const mar = calcMAR(mouthOuter);
          const smileRatio = calcSmileRatio(mouthOuter);

          const browDist = dist(leftBrow[4], rightBrow[0]);
          const eyeDist = dist(leftEye[3], rightEye[0]);
          const browFurrowRatio = browDist / Math.max(1, eyeDist);

          // Normalized MediaPipe Smile Detection: mouth_width / face_width ratio
          const mouthWidth = dist(landmarks[48], landmarks[54]);
          const faceWidth = dist(landmarks[0], landmarks[16]) + 1e-6;
          const normalizedSmileRatio = mouthWidth / faceWidth;
          const SMILE_RATIO_THRESHOLD = 0.35;

          // Calibrate Happy (smile ratio > threshold)
          if (normalizedSmileRatio > SMILE_RATIO_THRESHOLD || smileRatio > 0.02) {
            const boost = Math.max(0.3, (normalizedSmileRatio - SMILE_RATIO_THRESHOLD) * 3.0);
            exps.happy = Math.min(1.0, (exps.happy || 0) * 1.5 + boost);
          }
          // Calibrate Surprise (wide open eyes + open mouth)
          if (avgEAR > 0.30 && mar > 0.35) {
            exps.surprised = Math.max(exps.surprised || 0, 0.85);
          }
          // Calibrate Angry (eyebrows pulled together and downward)
          if (browFurrowRatio < 0.65 && mar < 0.25) {
            exps.angry = Math.min(1.0, (exps.angry || 0) * 1.3 + 0.3);
          }
          // Calibrate Sad (mouth corners down + inner brows raised)
          if (smileRatio < -0.05 && mar < 0.2) {
            exps.sad = Math.min(1.0, (exps.sad || 0) * 1.3 + 0.25);
          }
        }

        return {
          expressions: {
            neutral: exps.neutral || 0,
            happy: exps.happy || 0,
            sad: exps.sad || 0,
            angry: exps.angry || 0,
            fearful: exps.fearful || 0,
            disgusted: exps.disgusted || 0,
            surprised: exps.surprised || 0
          },
          landmarks: landmarks,
          detection: {
            box: { 
              x: Math.round(d.detection.box.x), 
              y: Math.round(d.detection.box.y), 
              width: Math.round(d.detection.box.width), 
              height: Math.round(d.detection.box.height) 
            },
            score: d.detection.score
          }
        };
      });
      
      self.postMessage({ type: 'RESULT', detections: plainDetections });
    } catch (err) {
      self.postMessage({ type: 'ERROR', error: err.message });
    }
  }
};
