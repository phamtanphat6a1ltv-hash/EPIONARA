import { useState, useEffect, useRef } from "react";
import { useToast } from "../../hooks/useToast.js";
import GlassCard from "../GlassCard.jsx";

export default function WebcamPPG({ onComplete, t }) {
  const { warning, success } = useToast();
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [bpm, setBpm] = useState(null);
  const [signalQuality, setSignalQuality] = useState(0); // 0 to 100
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [statusText, setStatusText] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null); // Để vẽ biểu đồ sóng
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Khai báo các biến xử lý tín hiệu
  const signalBuffer = useRef([]); // Lưu trữ chuỗi màu đỏ trung bình
  const timeBuffer = useRef([]); // Lưu trữ nhãn thời gian tương ứng
  const lastBpmValues = useRef([]); // Lưu trữ 5 giá trị BPM gần nhất để lọc nhiễu

  const maxBufferSize = 300; // ~10 giây dữ liệu ở mức 30fps

  const startMeasurement = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsMeasuring(true);
      setBpm(null);
      setProgress(0);
      setSignalQuality(0);
      signalBuffer.current = [];
      timeBuffer.current = [];
      lastBpmValues.current = [];
      setStatusText(t?.ppg_status_initializing || "Đang khởi tạo camera...");
      success(t?.ppg_toast_started || "Đã bật camera. Vui lòng giữ yên khuôn mặt trước màn hình.");
    } catch (err) {
      console.error("Lỗi truy cập camera cho PPG:", err);
      warning(t?.ppg_err_camera || "Không thể truy cập camera. Vui lòng kiểm tra quyền thiết bị.");
    }
  };

  const stopMeasurement = () => {
    setIsMeasuring(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setStatusText("");
  };

  useEffect(() => {
    return () => stopMeasurement();
  }, []);

  // Vòng lặp xử lý từng khung hình video
  useEffect(() => {
    if (!isMeasuring) return;

    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = 64;
    offscreenCanvas.height = 64;
    const ctxOff = offscreenCanvas.getContext("2d");

    const processFrame = () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // 1. Trích xuất khung hình từ trung tâm video
      ctxOff.drawImage(
        videoRef.current,
        videoRef.current.videoWidth / 2 - 32,
        videoRef.current.videoHeight / 2 - 32,
        64, 64, // Cắt ô 64x64 ở giữa
        0, 0, 64, 64
      );

      const imgData = ctxOff.getImageData(0, 0, 64, 64);
      const data = imgData.data;

      // 2. Tính giá trị đỏ trung bình
      let redSum = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        // Lấy kênh đỏ và xanh lá
        // Kênh đỏ nhạy cảm nhất với độ phản xạ ánh sáng của huyết sắc tố
        redSum += data[i];
        count++;
      }
      const avgRed = redSum / count;

      const now = Date.now();
      signalBuffer.current.push(avgRed);
      timeBuffer.current.push(now);

      if (signalBuffer.current.length > maxBufferSize) {
        signalBuffer.current.shift();
        timeBuffer.current.shift();
      }

      // Cập nhật thanh tiến trình tích lũy tín hiệu (cần ít nhất 5 giây ~ 150 frames để ước lượng)
      const currentFrames = signalBuffer.current.length;
      const percent = Math.min(Math.round((currentFrames / 150) * 100), 100);
      setProgress(percent);

      if (percent < 100) {
        setStatusText(`${t?.ppg_status_analyzing || "Đang phân tích tín hiệu... "}${percent}%`);
      } else {
        setStatusText(t?.ppg_status_ready || "Kết quả đo nhịp tim ổn định");
      }

      // 3. Phân tích tín hiệu & tính nhịp tim
      if (currentFrames >= 100 && currentFrames % 15 === 0) { // Cứ 15 khung hình (~0.5s) tính lại nhịp tim
        calculateHeartRate();
      }

      // 4. Vẽ biểu đồ nhịp tim trực quan
      drawPulseChart();

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isMeasuring]);

  // Vẽ biểu đồ xung sóng lên canvas
  const drawPulseChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || signalBuffer.current.length < 2) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Lấy 100 giá trị cuối cùng để vẽ sóng
    const drawLimit = 100;
    const rawSignal = signalBuffer.current.slice(-drawLimit);
    if (rawSignal.length < 2) return;

    // Loại bỏ thành phần một chiều (mean removal) để căn giữa sóng
    const mean = rawSignal.reduce((a, b) => a + b, 0) / rawSignal.length;
    const centered = rawSignal.map(v => v - mean);

    // Tìm cực đại/cực tiểu để tự động co giãn sóng (auto-scaling)
    let max = Math.max(...centered);
    let min = Math.min(...centered);
    
    // Tránh chia cho 0
    if (max === min) {
      max = 1;
      min = -1;
    }

    const range = max - min;

    // Thiết kế nét vẽ dạng đồ thị nhịp tim y tế cực đẹp
    ctx.beginPath();
    ctx.strokeStyle = "#ec4899"; // Màu hồng neon cực đẹp
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Tạo gradient cho sóng
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, "rgba(236, 72, 153, 0.2)");
    grad.addColorStop(0.5, "rgba(167, 139, 250, 1)");
    grad.addColorStop(1, "rgba(236, 72, 153, 1)");
    ctx.strokeStyle = grad;

    for (let i = 0; i < centered.length; i++) {
      const x = (i / (drawLimit - 1)) * width;
      // Chuẩn hóa y vào khoảng [5, height - 5]
      const y = height - 5 - ((centered[i] - min) / range) * (height - 10);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  };

  // Tính nhịp tim (BPM) bằng cách đếm đỉnh sóng
  const calculateHeartRate = () => {
    const rawSignal = signalBuffer.current;
    const timestamps = timeBuffer.current;
    const n = rawSignal.length;

    // 1. Áp dụng bộ lọc di động đơn giản để làm mịn tín hiệu
    const filtered = [];
    const windowSize = 5; // Lọc trung bình trượt 5 mẫu
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const sub = rawSignal.slice(start, i + 1);
      const avg = sub.reduce((a, b) => a + b, 0) / sub.length;
      filtered.push(avg);
    }

    // 2. Tìm các điểm cực đại cục bộ (đỉnh nhịp tim)
    const peakIndices = [];
    const minPeakDistance = 12; // Nhịp tim tối đa ~150 BPM ở mức 30fps

    for (let i = 2; i < n - 2; i++) {
      const val = filtered[i];
      // Điểm i là đỉnh nếu nó lớn hơn 2 mẫu lân cận trước và sau
      if (val > filtered[i - 1] && val > filtered[i - 2] && val > filtered[i + 1] && val > filtered[i + 2]) {
        // Kiểm tra khoảng cách với đỉnh gần nhất để tránh đếm trùng
        if (peakIndices.length === 0 || (i - peakIndices[peakIndices.length - 1]) >= minPeakDistance) {
          peakIndices.push(i);
        }
      }
    }

    // 3. Tính khoảng cách thời gian trung bình giữa các đỉnh để suy ra BPM
    if (peakIndices.length < 2) return;

    const intervals = [];
    for (let i = 1; i < peakIndices.length; i++) {
      const t1 = timestamps[peakIndices[i - 1]];
      const t2 = timestamps[peakIndices[i]];
      const diffMs = t2 - t1;
      
      // Khoảng thời gian hợp lệ giữa các nhịp: 400ms (150 BPM) đến 1500ms (40 BPM)
      if (diffMs >= 400 && diffMs <= 1500) {
        intervals.push(diffMs);
      }
    }

    if (intervals.length === 0) return;

    const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    let computedBpm = Math.round(60000 / avgIntervalMs);

    // Giới hạn giá trị nhịp tim sinh lý thông thường: 55 - 120
    if (computedBpm < 50 || computedBpm > 140) return;

    // 4. Lọc thông thấp các giá trị nhịp tim vừa đo để làm mượt kết quả hiển thị
    lastBpmValues.current.push(computedBpm);
    if (lastBpmValues.current.length > 5) lastBpmValues.current.shift();

    const smoothBpm = Math.round(lastBpmValues.current.reduce((a, b) => a + b, 0) / lastBpmValues.current.length);
    setBpm(smoothBpm);

    // Tính độ ổn định (chất lượng tín hiệu) dựa trên độ lệch chuẩn của các khoảng beat-to-beat
    const meanInterval = avgIntervalMs;
    const variance = intervals.reduce((s, x) => s + Math.pow(x - meanInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    // Độ lệch chuẩn càng nhỏ (nhịp tim đập đều), tín hiệu càng tốt
    const quality = Math.max(0, Math.min(100, Math.round(100 - (stdDev / 10))));
    setSignalQuality(quality);
  };

  const handleSave = () => {
    if (bpm) {
      stopMeasurement();
      if (onComplete) onComplete(bpm);
      success(`${t?.ppg_toast_saved || "Đã ghi nhận nhịp tim: "} ${bpm} BPM`);
    }
  };

  return (
    <GlassCard style={{
      borderRadius: "28px",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "20px",
      maxWidth: "400px",
      margin: "0 auto",
    }}>
      <h3 style={{
        margin: 0,
        fontSize: "18px",
        fontWeight: 700,
        background: "linear-gradient(to right, #ec4899, #a78bfa)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        ❤️ {t?.ppg_title || "Phản hồi sinh học: Nhịp tim (PPG)"}
      </h3>

      <div style={{
        position: "relative",
        width: "180px",
        height: "180px",
        borderRadius: "50%",
        overflow: "hidden",
        border: `3px solid ${isMeasuring ? "#ec4899" : "var(--border2)"}`,
        boxShadow: isMeasuring ? "0 0 20px rgba(236,72,153,0.3)" : "none",
        transition: "all 0.5s ease"
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)" // Gương lật
          }}
        />
        {!isMeasuring && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(7,9,29,0.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.75)",
            fontSize: "13px",
            textAlign: "center",
            padding: "16px",
            cursor: "pointer"
          }} onClick={startMeasurement}>
            <span style={{ fontSize: "32px", marginBottom: "8px" }}>📷</span>
            <span>{t?.ppg_click_to_start || "Nhấp để bật camera & bắt đầu đo"}</span>
          </div>
        )}
        
        {isMeasuring && (
          <div style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            border: "2px solid rgba(255,255,255,0.3)",
            borderRadius: "50%",
            animation: "pulse 2s infinite"
          }} />
        )}
      </div>

      {isMeasuring && (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Thanh tiến trình phân tích */}
          <div style={{
            width: "100%",
            height: "6px",
            background: "var(--border2)",
            borderRadius: "10px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(to right, #ec4899, #a78bfa)",
              transition: "width 0.3s ease"
            }} />
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "var(--text-secondary)"
          }}>
            <span>{statusText}</span>
            {signalQuality > 0 && (
              <span>
                {t?.ppg_quality || "Chất lượng sóng:"} {signalQuality}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sóng đồ thị nhịp tim */}
      <canvas
        ref={canvasRef}
        width="340"
        height="80"
        style={{
          width: "100%",
          height: "80px",
          background: "var(--bg0)",
          borderRadius: "16px",
          border: "1.5px solid var(--border2)"
        }}
      />

      {/* Kết quả nhịp tim */}
      {bpm !== null && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: "6px"
          }}>
            <span style={{
              fontSize: "42px",
              fontWeight: 800,
              color: "#f472b6",
              animation: isMeasuring ? "heartBeat 1s infinite" : "none",
              display: "inline-block"
            }}>
              {bpm}
            </span>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 600 }}>BPM</span>
          </div>
          <span style={{
            fontSize: "12px",
            color: bpm < 60 ? "#93c5fd" : bpm > 100 ? "#fca5a5" : "#34d399",
            fontWeight: 500
          }}>
            {bpm < 60 
              ? (t?.ppg_rate_low || "Nhịp tim nghỉ ngơi thấp (Relaxed)") 
              : bpm > 100 
                ? (t?.ppg_rate_high || "Nhịp tim hơi cao (Excited/Stressed)") 
                : (t?.ppg_rate_normal || "Nhịp tim bình thường (Normal)")
            }
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", width: "100%" }}>
        {isMeasuring ? (
          <button
            onClick={stopMeasurement}
            style={{
              flex: 1,
              padding: "12px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            ❌ {t?.ppg_btn_stop || "Dừng đo"}
          </button>
        ) : (
          <button
            onClick={startMeasurement}
            style={{
              flex: 1,
              padding: "12px",
              background: "linear-gradient(135deg, #ec4899 0%, #a78bfa 100%)",
              border: "none",
              color: "white",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 15px rgba(236,72,153,0.2)"
            }}
          >
            ⚡ {t?.ppg_btn_start || "Bắt đầu đo"}
          </button>
        )}

        {bpm !== null && (
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "12px",
              background: "rgba(52, 211, 153, 0.15)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              color: "#34d399",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            💾 {t?.ppg_btn_save || "Lưu kết quả"}
          </button>
        )}
      </div>

      <p style={{
        margin: 0,
        fontSize: "10px",
        color: "var(--text-secondary)",
        textAlign: "center",
        lineHeight: 1.4
      }}>
        ⚠️ *{t?.ppg_medical_disclaimer || "Lưu ý: Tính năng đo này dựa trên quang phổ quang học qua camera, chỉ mang tính chất hỗ trợ thư giãn, không dùng làm kết quả y tế."}
      </p>
    </GlassCard>
  );
}
