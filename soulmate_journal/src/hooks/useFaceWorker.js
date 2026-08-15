import { useEffect, useRef, useState, useCallback } from 'react';

export function useFaceWorker(onResult, onError) {
  const workerRef = useRef(null);
  const isWorkerBusyRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const initWorker = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (workerRef.current) {
        resolve();
        return;
      }

      setLoadProgress(10);
      
      // Simulate loading progress for UX
      progressIntervalRef.current = setInterval(() => {
        setLoadProgress(p => {
          if (p >= 90) {
            clearInterval(progressIntervalRef.current);
            return 90;
          }
          return p + 10;
        });
      }, 200);

      try {
        const worker = new Worker('/face-worker.js');
        workerRef.current = worker;

        worker.onmessage = (e) => {
          if (e.data.type === 'INIT_DONE') {
            clearInterval(progressIntervalRef.current);
            setLoadProgress(100);
            setIsLoaded(true);
            resolve();
          } else if (e.data.type === 'RESULT') {
            isWorkerBusyRef.current = false; // Mark worker as free
            if (onResult) {
              onResult(e.data.detections);
            }
          } else if (e.data.type === 'ERROR') {
            isWorkerBusyRef.current = false;
            clearInterval(progressIntervalRef.current);
            if (onError) onError(new Error(e.data.error));
            reject(new Error(e.data.error));
          }
        };

        worker.onerror = (err) => {
          isWorkerBusyRef.current = false;
          clearInterval(progressIntervalRef.current);
          if (onError) onError(err);
          reject(err);
        };

        worker.postMessage({ type: 'INIT' });

      } catch (e) {
        clearInterval(progressIntervalRef.current);
        reject(e);
      }
    });
  }, [onResult, onError]);

  const processImage = useCallback((imgData) => {
    // Drop frame if worker is busy to avoid queue buildup and latency
    if (!workerRef.current || isWorkerBusyRef.current) {
      return false; 
    }

    isWorkerBusyRef.current = true;
    try {
      workerRef.current.postMessage({ type: 'DETECT', imgData });
      return true;
    } catch (e) {
      isWorkerBusyRef.current = false;
      console.warn("Error posting message to worker", e);
      return false;
    }
  }, []);

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsLoaded(false);
      setLoadProgress(0);
      isWorkerBusyRef.current = false;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  }, []);

  return {
    isLoaded,
    loadProgress,
    initWorker,
    processImage,
    terminateWorker
  };
}
