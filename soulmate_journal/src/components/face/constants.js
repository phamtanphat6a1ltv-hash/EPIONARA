export const EMOTION_MAP = {
  happy:     { key: "face_mood_happy",     emoji: "😊", color: "#22c55e", localizedLabel: "Vui vẻ" },
  sad:       { key: "face_mood_sad",       emoji: "😢", color: "#3b82f6", localizedLabel: "Buồn" },
  angry:     { key: "face_mood_angry",     emoji: "😡", color: "#ef4444", localizedLabel: "Tức giận" },
  fearful:   { key: "face_mood_fearful",   emoji: "😰", color: "#f97316", localizedLabel: "Sợ hãi" },
  disgusted: { key: "face_mood_disgusted", emoji: "🤢", color: "#84cc16", localizedLabel: "Ghê tởm" },
  surprised: { key: "face_mood_surprised", emoji: "😮", color: "#f59e0b", localizedLabel: "Bất ngờ" },
  neutral:   { key: "face_mood_neutral",   emoji: "😐", color: "#6b7280", localizedLabel: "Bình thường" },
  uncertain: { key: "face_mood_uncertain", emoji: "🤔", color: "#9ca3af", localizedLabel: "Chưa xác định" }
};

export const EMOTION_CONFIG = {
  inferenceFps: 12,              // Tần suất inference tối đa (lần/giây)
  historyDurationMs: 700,        // Thời gian lưu trữ lịch sử để hiển thị hoặc log (ms)
  emaAlpha: 0.35,                // Hệ số làm mượt Exponential Moving Average (càng cao thì càng phản ứng nhanh với nhãn mới)
  minimumConfidence: 0.5,        // Ngưỡng tối thiểu để chấp nhận một nhãn thay vì 'uncertain'
  switchMargin: 0.15,            // Khoảng margin giữa nhãn hiện tại và nhãn mới cần vượt qua để tránh nhấp nháy
  highConfidenceThreshold: 0.85, // Ngưỡng rất cao cho phép chuyển nhãn nhanh hơn (bỏ qua switchMargin nếu nhãn mới vượt ngưỡng này)
  minimumStableFrames: 2,        // Số frame tối thiểu liên tiếp cần thiết để xác nhận chuyển nhãn
  uncertainTimeoutMs: 500,       // Thời gian chờ trước khi chuyển sang trạng thái uncertain nếu dữ liệu không ổn định
  minimumFaceQuality: 0.55,      // Điểm chất lượng khuôn mặt tối thiểu (phụ thuộc vào kích thước và vị trí bounding box)
};
