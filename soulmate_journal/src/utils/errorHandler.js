import { useCallback } from "react";
import { useToast } from "../hooks/useToast.js";

/**
 * Standard Application Error
 */
export class AppError extends Error {
  /**
   * @param {string} message - User-friendly message in Vietnamese
   * @param {string} code - Error code identifier
   * @param {'low' | 'medium' | 'critical'} [severity='medium'] - Impact level of the error
   */
  constructor(message, code, severity = "medium") {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.severity = severity;
  }
}

/**
 * Maps Gemini API exceptions to user-friendly AppError.
 * @param {Error} err - Caught exception
 * @returns {AppError}
 */
export function handleGeminiError(err) {
  const message = err.message || "";
  const lang = (typeof localStorage !== "undefined" ? localStorage.getItem("sj_lang") : "vi") || "vi";

  if (message.includes("PROXY_404_NO_KEY") || message.includes("404")) {
    return new AppError(
      lang === "en"
        ? "AI service is not configured locally. Please set VITE_GEMINI_API_KEY in the .env file, run the project with 'vercel dev', or enter your personal API key on the Profile page."
        : "Dịch vụ AI chưa được cấu hình cục bộ. Vui lòng thiết lập VITE_GEMINI_API_KEY trong tệp .env, chạy dự án bằng lệnh 'vercel dev', hoặc nhập API key cá nhân của bạn trong trang Hồ Sơ.",
      "AI_PROXY_404_NO_KEY",
      "medium"
    );
  }
  if (
    message.includes("RATE_LIMIT") ||
    message.includes("429") ||
    message.toLowerCase().includes("quota") ||
    message.toLowerCase().includes("limit exceeded") ||
    message.toLowerCase().includes("exceeded")
  ) {
    return new AppError(
      lang === "en"
        ? "Your AI account has exceeded the free trial limit (quota) or sent requests too quickly. Please check your API key quota or wait a moment and try again."
        : "Tài khoản AI của bạn đã vượt quá giới hạn lượt dùng thử miễn phí (quota) hoặc gửi yêu cầu quá nhanh. Vui lòng kiểm tra lại hạn ngạch API key hoặc chờ một lát rồi thử lại.",
      "AI_RATE_LIMIT",
      "low"
    );
  }
  if (
    message.includes("NO_KEY") ||
    message.includes("API_KEY") ||
    message.includes("401") ||
    message.includes("403")
  ) {
    return new AppError(
      lang === "en"
        ? "Invalid or unconfigured Gemini API key. Please check your settings."
        : "Gemini API key không hợp lệ hoặc chưa được cấu hình. Vui lòng kiểm tra lại cài đặt.",
      "AI_AUTH_ERROR",
      "medium"
    );
  }
  if (message.includes("safety_block")) {
    return new AppError(
      lang === "en"
        ? "Request blocked by the AI's content safety policy."
        : "Yêu cầu bị từ chối do chính sách an toàn nội dung của AI.",
      "AI_SAFETY_BLOCK",
      "low"
    );
  }
  if (message.includes("empty_response")) {
    return new AppError(
      lang === "en"
        ? "No response received from the AI. Please try again with different content."
        : "Không nhận được phản hồi từ AI. Vui lòng thử lại với nội dung khác.",
      "AI_EMPTY_RESPONSE",
      "low"
    );
  }
  if (message.includes("NETWORK_ERROR") || message.includes("Failed to fetch")) {
    return new AppError(
      lang === "en"
        ? "Unstable network connection. Please check your connection and try again."
        : "Kết nối mạng không ổn định. Vui lòng kiểm tra đường truyền và thử lại.",
      "AI_NETWORK_ERROR",
      "medium"
    );
  }
  return new AppError(
    lang === "en"
      ? `AI service error: ${message || "An unknown error occurred"}`
      : `Lỗi dịch vụ AI: ${message || "Đã xảy ra lỗi không xác định"}`,
    "AI_UNKNOWN_ERROR",
    "medium"
  );
}

/**
 * Maps storage exceptions to user-friendly AppError.
 * @param {Error} err - Caught exception
 * @returns {AppError}
 */
export function handleStorageError(err) {
  const name = err.name || "";
  const lang = (typeof localStorage !== "undefined" ? localStorage.getItem("sj_lang") : "vi") || "vi";

  if (name === "QuotaExceededError" || err.code === 22 || name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return new AppError(
      lang === "en"
        ? "Browser local storage is full. Please clear some data to save new content."
        : "Bộ nhớ tạm của trình duyệt đã đầy. Vui lòng dọn dẹp bớt dữ liệu để lưu nội dung mới.",
      "STORAGE_QUOTA_EXCEEDED",
      "medium"
    );
  }
  return new AppError(
    lang === "en"
      ? `Data storage error: ${err.message || "Unable to access storage"}`
      : `Lỗi lưu trữ dữ liệu: ${err.message || "Không thể truy cập bộ nhớ"}`,
    "STORAGE_ERROR",
    "medium"
  );
}

/**
 * Custom hook to handle application errors globally.
 * Displays toast alerts and logs errors based on severity.
 * @returns {{handleError: (function(any, string=): AppError)}}
 */
export function useErrorHandler() {
  const { error: toastError, warning: toastWarning } = useToast();

  const handleError = useCallback(
    (err, context = "") => {
      let appError;

      if (err instanceof AppError) {
        appError = err;
      } else if (err?.name === "QuotaExceededError" || err?.code === 22) {
        appError = handleStorageError(err);
      } else if (
        context === "gemini" ||
        context === "ai" ||
        context === "chatbot" ||
        (err?.message && (err.message.includes("RATE_LIMIT") || err.message.includes("HTTP")))
      ) {
        appError = handleGeminiError(err);
      } else {
        const lang = (typeof localStorage !== "undefined" ? localStorage.getItem("sj_lang") : "vi") || "vi";
        const fallbackMsg = lang === "en" ? "A system error occurred" : "Đã xảy ra lỗi hệ thống";
        appError = new AppError(err?.message || fallbackMsg, "UNKNOWN_ERROR", "medium");
      }

      // Logging and alerting based on severity
      if (appError.severity === "critical") {
        console.error(`[CRITICAL ERROR] [${appError.code}] ${appError.message}`, err);
        toastError(appError.message);
      } else if (appError.severity === "medium") {
        console.warn(`[WARNING] [${appError.code}] ${appError.message}`, err);
        toastError(appError.message);
      } else {
        console.info(`[INFO] [${appError.code}] ${appError.message}`, err);
        toastWarning(appError.message);
      }

      return appError;
    },
    [toastError, toastWarning]
  );

  return { handleError };
}
