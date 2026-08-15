import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEmotionStabilizer } from '../src/hooks/useEmotionStabilizer.js';
import { EMOTION_CONFIG } from '../src/components/face/constants.js';

describe('useEmotionStabilizer', () => {
  let hook;
  
  beforeEach(() => {
    const { result } = renderHook(() => useEmotionStabilizer());
    hook = result;
  });

  const runFrames = (frames) => {
    let lastResult = null;
    act(() => {
      for (const frame of frames) {
        lastResult = hook.current.processFrame(
          frame.scores, 
          frame.box !== undefined ? frame.box : { x: 100, y: 100, width: 200, height: 200 }, 
          640, 480
        );
      }
    });
    return lastResult;
  };

  it('neutral -> happy rõ ràng (Clear transition)', () => {
    const result = runFrames([
      { scores: { neutral: 0.9, happy: 0.1 } },
      { scores: { neutral: 0.9, happy: 0.1 } },
      { scores: { neutral: 0.1, happy: 0.9 } },
      { scores: { neutral: 0.1, happy: 0.9 } },
      { scores: { neutral: 0.1, happy: 0.9 } }
    ]);
    expect(result.emotion).toBe('happy');
    expect(result.confidence).toBeGreaterThan(60);
  });

  it('happy và neutral dao động sát nhau (Oscillation near threshold)', () => {
    const result = runFrames([
      { scores: { happy: 0.9 } },
      { scores: { happy: 0.9 } },
      { scores: { happy: 0.9 } },
      { scores: { happy: 0.6, neutral: 0.55 } },
      { scores: { happy: 0.55, neutral: 0.6 } },
      { scores: { happy: 0.6, neutral: 0.55 } },
      { scores: { happy: 0.55, neutral: 0.6 } },
      { scores: { happy: 0.6, neutral: 0.55 } },
      { scores: { happy: 0.55, neutral: 0.6 } },
      { scores: { happy: 0.6, neutral: 0.55 } },
      { scores: { happy: 0.55, neutral: 0.6 } },
    ]);
    expect(result.emotion).toBe('uncertain');
    expect(result.reason).toBe('Biểu cảm đang dao động');
  });

  it('một frame angry sai lệch giữa nhiều frame happy (Noise rejection)', () => {
    runFrames([
      { scores: { happy: 0.9 } },
      { scores: { happy: 0.9 } },
      { scores: { happy: 0.9 } },
      { scores: { happy: 0.9 } }, // Add one more to solidify EMA > 0.8
    ]);
    
    const noisyResult = runFrames([
      { scores: { angry: 0.9, happy: 0.1 } }
    ]);
    
    expect(noisyResult.emotion).toBe('happy');
  });

  it('mất khuôn mặt tạm thời (Temporary face loss)', () => {
    const result = runFrames([
      { scores: { happy: 0.9 } },
      { scores: {}, box: null }   
    ]);
    expect(result.emotion).toBe('uncertain');
    expect(result.reason).toBe('Không nhìn thấy rõ khuôn mặt');
    expect(result.faceQuality).toBe(0);
  });

  it('confidence thấp kéo dài (Sustained low confidence)', () => {
    const result = runFrames([
      { scores: { happy: 0.3, sad: 0.2, neutral: 0.3 } },
      { scores: { happy: 0.3, sad: 0.2, neutral: 0.3 } },
      { scores: { happy: 0.3, sad: 0.2, neutral: 0.3 } },
    ]);
    expect(result.emotion).toBe('uncertain');
    expect(result.reason).toBe('Chưa xác định rõ biểu cảm');
  });

  it('khuôn mặt không ở giữa (Face not centered - Quality drop)', () => {
    const result = runFrames([
      { 
        scores: { happy: 0.9 }, 
        // Box at edge but size is okay (area ~ 0.13), centerScore drops
        box: { x: 0, y: 0, width: 200, height: 200 } 
      }
    ]);
    expect(result.emotion).toBe('uncertain');
    expect(result.reason).toContain('Đưa khuôn mặt vào giữa');
    expect(result.faceQuality).toBeLessThan(EMOTION_CONFIG.minimumFaceQuality);
  });
});
