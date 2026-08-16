import { useState, useRef, useCallback } from 'react';
import { EMOTION_CONFIG, EMOTION_MAP } from '../components/face/constants.js';

export function useEmotionStabilizer() {
  const [stabilizedResult, setStabilizedResult] = useState(null);

  // EMA state for each emotion
  const emaScoresRef = useRef({});
  // Hysteresis state
  const currentLabelRef = useRef('uncertain');
  const stableFramesCountRef = useRef(0);
  const lastUpdateTimestampRef = useRef(0);
  const emaAgeRef = useRef(25); // Default age

  const processFrame = useCallback((rawScores, boundingBox, videoWidth, videoHeight, rawAge = null) => {
    const now = Date.now();

    // 1. Calculate Face Quality (0 to 1) based on bounding box
    let faceQuality = 0;
    if (boundingBox && videoWidth && videoHeight) {
      const { x, y, width, height } = boundingBox;
      const boxArea = width * height;
      const frameArea = videoWidth * videoHeight;
      const areaRatio = boxArea / frameArea;
      
      let sizeScore = 1;
      if (areaRatio < 0.05) sizeScore = areaRatio / 0.05;
      else if (areaRatio > 0.6) sizeScore = Math.max(0, 1 - (areaRatio - 0.6));

      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const frameCenterX = videoWidth / 2;
      const frameCenterY = videoHeight / 2;
      
      const dx = (centerX - frameCenterX) / frameCenterX;
      const dy = (centerY - frameCenterY) / frameCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const centerScore = Math.max(0, 1 - dist);

      // Adjusted weights so being totally off-center significantly drops quality
      faceQuality = sizeScore * 0.5 + centerScore * 0.5;
    }

    let dynamicAlpha = EMOTION_CONFIG.emaAlpha;
    if (faceQuality < EMOTION_CONFIG.minimumFaceQuality) {
      dynamicAlpha *= 0.1;
    }

    const currentEma = emaScoresRef.current;
    const newEma = {};
    let maxEmaScore = 0;
    let topEmotion = 'uncertain';
    let secondMaxScore = 0;

    Object.keys(EMOTION_MAP).forEach(emotion => {
      if (emotion === 'uncertain') return;
      
      const rawScore = rawScores[emotion] || 0;
      const prevEmaScore = currentEma[emotion] || 0;
      
      const smoothed = prevEmaScore + dynamicAlpha * (rawScore - prevEmaScore);
      newEma[emotion] = smoothed;

      if (smoothed > maxEmaScore) {
        secondMaxScore = maxEmaScore;
        maxEmaScore = smoothed;
        topEmotion = emotion;
      } else if (smoothed > secondMaxScore) {
        secondMaxScore = smoothed;
      }
    });

    emaScoresRef.current = newEma;
    lastUpdateTimestampRef.current = now;

    // 4. Hysteresis / Adaptive Debounce
    let finalLabel = currentLabelRef.current;
    const currentLabelScore = newEma[finalLabel] || 0;

    const isHighConfidence = maxEmaScore >= EMOTION_CONFIG.highConfidenceThreshold;
    const exceedsMargin = (maxEmaScore - currentLabelScore) > EMOTION_CONFIG.switchMargin;
    
    if (topEmotion !== finalLabel) {
      if (isHighConfidence || exceedsMargin) {
        stableFramesCountRef.current += 1;
        if (stableFramesCountRef.current >= EMOTION_CONFIG.minimumStableFrames) {
          finalLabel = topEmotion;
          stableFramesCountRef.current = 0;
        }
      } else {
        stableFramesCountRef.current = 0;
      }
    } else {
      stableFramesCountRef.current = 0;
    }

    // 5. Confidence Calibration & Uncertainty check
    // We base finalConfidence on the smoothed score of the chosen finalLabel
    // This prevents one noisy frame from dropping finalConfidence below threshold if hysteresis held the label.
    let finalConfidence = newEma[finalLabel] || 0;
    let reason = null;

    if (faceQuality < 0.2) {
      finalLabel = 'uncertain';
      reason = "Không nhìn thấy rõ khuôn mặt";
    } else if (faceQuality < EMOTION_CONFIG.minimumFaceQuality) {
      finalLabel = 'uncertain';
      reason = "Đưa khuôn mặt vào giữa khung hình";
    } else if (finalConfidence < EMOTION_CONFIG.minimumConfidence) {
      finalLabel = 'uncertain';
      reason = "Chưa xác định rõ biểu cảm";
    } else if ((maxEmaScore - secondMaxScore) < 0.15 && maxEmaScore < 0.75) {
      finalLabel = 'uncertain';
      reason = "Biểu cảm đang dao động";
    }

    currentLabelRef.current = finalLabel;

    // Map to final UI object
    const mapped = EMOTION_MAP[finalLabel];
    
    // Convert to percentage, cap at 99% unless perfectly 1.0 (to avoid 100% false certainty)
    let displayConfidence = Math.round(finalConfidence * 100);
    if (displayConfidence === 100 && finalConfidence < 0.999) displayConfidence = 99;
    if (finalLabel === 'uncertain') displayConfidence = 0;

    // Calculate EMA for age if provided
    if (rawAge !== null && rawAge > 0) {
      emaAgeRef.current = dynamicAlpha * rawAge + (1 - dynamicAlpha) * emaAgeRef.current;
    }

    const result = {
      emotion: finalLabel,
      confidence: displayConfidence,
      key: mapped.key,
      emoji: mapped.emoji,
      color: mapped.color,
      localizedLabel: mapped.localizedLabel,
      allEmotions: newEma,
      faceQuality: faceQuality,
      timestamp: now,
      reason: reason,
      age: Math.round(emaAgeRef.current)
    };

    setStabilizedResult(result);
    return result;

  }, []);

  const reset = useCallback(() => {
    emaScoresRef.current = {};
    currentLabelRef.current = 'uncertain';
    stableFramesCountRef.current = 0;
    emaAgeRef.current = 25;
    setStabilizedResult(null);
  }, []);

  return { stabilizedResult, processFrame, reset };
}
