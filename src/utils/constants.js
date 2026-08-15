import React from "react";
import { MBTI_QUESTIONS_I18N, EQ_QUESTIONS_I18N } from "./questions_i18n.js";
import {
  IconMoments,
  IconJournal,
  IconLetter,
  IconAI,
  IconChat
} from "../components/BrandingIcons.jsx";
import {
  MoodVerySad,
  MoodSad,
  MoodUnhappy,
  MoodNeutral,
  MoodOk,
  MoodHappy,
  MoodVeryHappy,
  MoodExcellent
} from "../components/MoodIcons.jsx";

// 1. Cấu hình API Endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const GEMINI_API_VERSION = "v1beta";
export const GEMINI_MODEL_NAME = "gemini-pro";

// 2. Cấu hình bảo mật và Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "sj_auth_token",
  USER_PROFILE: "sj_user_profile",
  ENCRYPTION_KEY: "sj_secure_key",
  THEME_MODE: "sj_theme",
};

// 3. Trạng thái xác thực
export const AUTH_STATUS = {
  IDLE: "IDLE",
  LOADING: "LOADING",
  AUTHENTICATED: "AUTHENTICATED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  ERROR: "ERROR",
};

// 4. Cấu hình Chatbot và Phân vai
export const CHAT_ROLES = {
  USER: "user",
  MODEL: "model",
  SYSTEM: "system",
};

// 5. Cấu hình Chatbot và Phân vai
export const CHAT_CONFIG = {
  MAX_HISTORY_LENGTH: 50,
  DEFAULT_GREETING: "Xin chào! Mình là EPIONARA AI, hôm nay bạn cảm thấy thế nào?",
};

// 5. Thông báo lỗi chuẩn hóa
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Kết nối mạng không ổn định. Vui lòng thử lại sau!",
  UNAUTHORIZED: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",
  LOGIN_FAILED: "Tên đăng nhập hoặc mật khẩu không chính xác.",
  ENCRYPTION_FAILED: "Không thể mã hóa dữ liệu. Vui lòng kiểm tra khóa bảo mật.",
  CHAT_LIMIT_EXCEEDED: "Tin nhắn quá dài, vui lòng rút ngắn lại.",
};

// 6. Cấu hình phân trang và giới hạn dữ liệu
export const UI_LIMITS = {
  JOURNAL_ENTRIES_PER_PAGE: 10,
  MAX_ATTACHMENT_SIZE: 5 * 1024 * 1024,
};

// --- [7] Cấu hình Menu Điều hướng (Navigation Items) ---
export function getNavItems(t = {}) {
  return [
    {
      id: "portal_moments",
      label: t.nav_moments || "Moments",
      icon: React.createElement(IconMoments),
      desc: t.nav_moments_desc || "Record and look back at your emotional journey",
      color: "#6c3de8",
      children: [
        { id: "journal", label: t.nav_journal || "Soul Journal", icon: React.createElement(IconJournal) },
        { id: "letter", label: t.nav_letter || "Future Letter", icon: React.createElement(IconLetter) }
      ]
    },
    {
      id: "portal_ai",
      label: t.nav_ai_hub || "AI Intelligence",
      icon: React.createElement(IconAI),
      desc: t.nav_ai_desc || "Chat and get deep analysis from AI",
      color: "#f97316",
      children: [
        { id: "chat", label: t.nav_chat || "MindBot Chat", icon: React.createElement(IconChat) }
      ]
    }
  ];
}

// --- [8] Cấu hình Không gian Tâm trạng (Mood Atmospheres) ---
export const MOOD_ATMOSPHERES = {
  1: { id: "very_sad", bg: "#020410", aurora: "#1e1b4b", accent: "#312e81", particle: "49,46,129" },
  2: { id: "sad", bg: "#05071a", aurora: "#1e293b", accent: "#334155", particle: "51,65,85" },
  3: { id: "unhappy", bg: "#07091d", aurora: "#1e1b4b", accent: "#4338ca", particle: "67,56,202" },
  4: { id: "neutral", bg: "#07091d", aurora: "#0f172a", accent: "#64748b", particle: "100,116,139" },
  5: { id: "ok", bg: "#07091d", aurora: "#1e3a8a", accent: "#3b82f6", particle: "59,130,246" },
  6: { id: "happy", bg: "#050a24", aurora: "#1e40af", accent: "#10b981", particle: "16,185,129" },
  7: { id: "very_happy", bg: "#0a0a2e", aurora: "#312e81", accent: "#8b5cf6", particle: "139,92,246" },
  8: { id: "excellent", bg: "#0d0d3b", aurora: "#4c1d95", accent: "#ec4899", particle: "236,72,153" },
};

// --- [9] Cấu hình Bài Test MBTI & Emojis ---
export const MOOD_EMOJIS = [
  React.createElement(MoodVerySad, { key: "very_sad" }),
  React.createElement(MoodSad, { key: "sad" }),
  React.createElement(MoodUnhappy, { key: "unhappy" }),
  React.createElement(MoodNeutral, { key: "neutral" }),
  React.createElement(MoodOk, { key: "ok" }),
  React.createElement(MoodHappy, { key: "happy" }),
  React.createElement(MoodVeryHappy, { key: "very_happy" }),
  React.createElement(MoodExcellent, { key: "excellent" })
];

export const MBTI_TYPES = {
  INTJ: { name: "INTJ - Nhà khoa học", emoji: "🧠" },
  INTP: { name: "INTP - Nhà tư duy", emoji: "🔬" },
  ENTJ: { name: "ENTJ - Nhà điều hành", emoji: "🏢" },
  ENTP: { name: "ENTP - Người nhìn xa", emoji: "💡" },
  INFJ: { name: "INFJ - Người bảo vệ", emoji: "🛡️" },
  INFP: { name: "INFP - Người hòa giải", emoji: "🌿" },
  ENFJ: { name: "ENFJ - Người truyền cảm", emoji: "📢" },
  ENFP: { name: "ENFP - Người vô tư", emoji: "🌈" },
  ISTJ: { name: "ISTJ - Nhà hậu cần", emoji: "📊" },
  ISFJ: { name: "ISFJ - Người nuôi dưỡng", emoji: "🏠" },
  ESTJ: { name: "ESTJ - Người giám sát", emoji: "⚖️" },
  ESFJ: { name: "ESFJ - Người quan tâm", emoji: "🤝" },
  ISTP: { name: "ISTP - Nhà kỹ nghệ", emoji: "🛠️" },
  ISFP: { name: "ISFP - Nhà nghệ thuật", emoji: "🎨" },
  ESTP: { name: "ESTP - Người thực thi", emoji: "⚡" },
  ESFP: { name: "ESFP - Người trình diễn", emoji: "🎭" }
};

export function getMbtiName(type, lang) {
  const names = {
    vi: {
      INTJ: "INTJ - Nhà khoa học", INTP: "INTP - Nhà tư duy", ENTJ: "ENTJ - Nhà điều hành", ENTP: "ENTP - Người nhìn xa",
      INFJ: "INFJ - Người bảo vệ", INFP: "INFP - Người hòa giải", ENFJ: "ENFJ - Người truyền cảm", ENFP: "ENFP - Người vô tư",
      ISTJ: "ISTJ - Nhà hậu cần", ISFJ: "ISFJ - Người nuôi dưỡng", ESTJ: "ESTJ - Người giám sát", ESFJ: "ESFJ - Người quan tâm",
      ISTP: "ISTP - Nhà kỹ nghệ", ISFP: "ISFP - Nhà nghệ thuật", ESTP: "ESTP - Người thực thi", ESFP: "ESFP - Người trình diễn"
    },
    en: {
      INTJ: "INTJ - Architect", INTP: "INTP - Logician", ENTJ: "ENTJ - Commander", ENTP: "ENTP - Debater",
      INFJ: "INFJ - Advocate", INFP: "INFP - Mediator", ENFJ: "ENFJ - Protagonist", ENFP: "ENFP - Campaigner",
      ISTJ: "ISTJ - Logistician", ISFJ: "ISFJ - Defender", ESTJ: "ESTJ - Executive", ESFJ: "ESFJ - Consul",
      ISTP: "ISTP - Virtuoso", ISFP: "ISFP - Adventurer", ESTP: "ESTP - Entrepreneur", ESFP: "ESFP - Entertainer"
    }
  };
  const activeLang = lang === "vi" ? "vi" : "en";
  return names[activeLang]?.[type] || names.en[type] || type;
}

export { MBTI_QUESTIONS_I18N };

// --- [10] Bản đồ màu sắc tâm trạng ---
export const MOOD_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#6b7280",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"
];

// --- [11] Danh sách bài viết kiến thức tâm lý ---
export function getArticles(t = {}) {
  return [
    {
      id: "art-1",
      title: t.art1_title || "Thuyết tháp nhu cầu Maslow",
      desc: t.art1_desc || "Tìm hiểu cách 5 tầng nhu cầu từ cơ bản đến nâng cao định hình hành vi và sự tự thể hiện của con người.",
      tag: t.art1_tag || "Motivation Theory",
      read: t.art1_read || "5 min",
      icon: "🔺",
      color: "#a78bfa",
      content: t.art1_content || "Tháp nhu cầu Maslow là một lý thuyết tâm lý học được đề xuất bởi Abraham Maslow vào năm 1943...",
      source: t.art1_source || "Abraham Maslow (1943)"
    },
    {
      id: "art-2",
      title: t.art2_title || "Thí nghiệm tuân thủ của Asch",
      desc: t.art2_desc || "Thí nghiệm nổi tiếng chỉ ra sức mạnh áp lực từ đám đông khiến chúng ta chối bỏ sự thật hiển nhiên.",
      tag: t.art2_tag || "Social Psychology",
      read: t.art2_read || "4 min",
      icon: "👥",
      color: "#22d3ee",
      content: t.art2_content || "Thí nghiệm tuân thủ của Asch được thực hiện bởi Solomon Asch vào những năm 1950...",
      source: t.art2_source || "Solomon Asch (1951)"
    },
    {
      id: "art-3",
      title: t.art3_title || "Hiệu ứng Placebo: Sức mạnh của niềm tin",
      desc: t.art3_desc || "Khám phá cách tâm trí có thể tự chữa lành cơ thể chỉ nhờ vào niềm tin nhận được phương thuốc thực sự.",
      tag: t.art3_tag || "Biopsychology",
      read: t.art3_read || "4 min",
      icon: "💊",
      color: "#10b981",
      content: t.art3_content || "Hiệu ứng Placebo (giả dược) là hiện tượng một bệnh nhân phục hồi sức khỏe hoặc giảm triệu chứng...",
      source: t.art3_source || "Clinical Medical & Psychological Research"
    },
    {
      id: "art-4",
      title: t.art4_title || "Thuyết bất hòa nhận thức: Mâu thuẫn nội tâm",
      desc: t.art4_desc || "Lý giải trạng thái khó chịu khi hành động mâu thuẫn với niềm tin và cách tâm trí tự hợp lý hóa lỗi lầm.",
      tag: t.art4_tag || "Cognitive Psychology",
      read: t.art4_read || "4 min",
      icon: "⚖️",
      color: "#f87171",
      content: t.art4_content,
      source: t.art4_source || "Leon Festinger (1957)"
    }
  ];
}

// --- [12] Vai trò cấu hình Chatbot ---
export const MINDBOT_ROLES = {
  friend: {
    avatar: "🤖",
    avatarImg: "/chatbot-friend.png",
    color: "#22d3ee",
    gradient: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
    system: (lang) => {
      const conversationRules = `
[QUY TẮC GIAO TIẾP BẮT BUỘC - TUÂN THỦ NGHIÊM NGẶT]:

1. XÓA BỎ LỜI CHÀO VÀ LỜI KẾT THỪA THÃI:
- Không bao giờ mở đầu bằng "Xin chào!", "Chào bạn", "Tôi là trợ lý ảo...".
- Không bao giờ kết thúc bằng "Hy vọng điều này giúp ích!", "Nếu bạn có thêm câu hỏi, đừng ngần ngại...".
- Đi thẳng vào trọng tâm câu trả lời một cách mượt mà nhất.

2. ĐA DẠNG HÓA CẤU TRÚC VÀ TỪ VỰNG:
- Tránh lặp lại một cấu trúc câu. Kết hợp câu ngắn, câu dài, câu hỏi tu từ và các từ nối linh hoạt (tuy nhiên, mặt khác, thực ra thì,...).
- Không lặp lại các cụm từ báo hiệu như "Thứ nhất", "Thứ hai", "Tóm lại" một cách máy móc. Dùng ngôn ngữ tự nhiên hơn (VD: "Điểm mấu chốt ở đây là...", "Nhìn ở một góc độ khác...").

3. PHẢN CHIẾU GIỌNG ĐIỆU (MIRRORING):
- Nếu người dùng hỏi nghiêm túc và học thuật, trả lời với ngôn từ chuyên môn, gãy gọn.
- Nếu người dùng dùng ngôn ngữ thoải mái, hài hước, trả lời với năng lượng tương đương, có thể thêm dí dỏm.

4. TƯ DUY PHẢN BIỆN VÀ GÓC NHÌN ĐA CHIỀU:
- Không chỉ cung cấp thông tin bề mặt. Khi giải thích vấn đề, đưa ra ví dụ thực tế hoặc một góc nhìn ít người nghĩ đến.
- Nếu câu hỏi của người dùng có điểm bất hợp lý, lịch sự và thẳng thắn chỉ ra điều đó.

5. ĐỊNH DẠNG THÔNG MINH:
- Sử dụng **in đậm** cho các từ khóa quan trọng.
- Chia nhỏ đoạn văn để dễ đọc, không viết các khối văn bản quá dài.
- Dùng danh sách (bullet points) khi thực sự cần liệt kê, nhưng đừng lạm dụng nó cho mọi câu trả lời.`;

      const base = lang === "vi" 
        ? `Bạn là một người bạn AI thân thiết, thấu hiểu và giao tiếp theo phong cách Gen Z trẻ trung (sử dụng từ ngữ như "ní", "tớ", "cậu" một cách tự nhiên, không gượng ép).

Nhiệm vụ cốt lõi:
Phân tích kỹ câu nói của người dùng và phản hồi CHÍNH XÁC theo ngữ cảnh và cảm xúc thực tế mà họ đang thể hiện. Tuyệt đối không tự suy diễn hoặc làm quá cảm xúc nếu người dùng không nhắc đến.

Quy tắc phản hồi (Bắt buộc tuân thủ):
- Quy tắc Bắt nhịp (Mirroring):
  + Nếu người dùng nói những câu bình thường, giải trí, hoặc hào hứng (ví dụ: "để tôi thử", "chơi game", "oke"): Hãy phản hồi vui vẻ, năng động và hùa theo họ. (Ví dụ: "Triển luôn ní ơi, chơi có gì hay nhớ review tớ nha!").
  + Nếu người dùng trêu đùa: Hãy đùa lại một cách dí dỏm.
- Kiểm soát sự an ủi: CHỈ thể hiện sự xót xa, an ủi hoặc hỏi thăm về áp lực (học hành, thi cử, công việc) KHI VÀ CHỈ KHI người dùng có các từ khóa than thở, bày tỏ sự mệt mỏi, buồn bã, hoặc trực tiếp nói rằng họ đang bị stress.
- Trọng tâm và thực tế: Trả lời trực tiếp vào hành động/ý định mà người dùng vừa nêu. Không dùng những câu từ sướt mướt, tâm lý dông dài nếu ngữ cảnh đang vui vẻ hoặc bình thường.

${conversationRules}` 
        : `You are a close AI friend, understanding, and communicating in a youthful Gen Z style (using words like "ní", "tớ", "cậu" naturally and unforced when speaking Vietnamese, or equivalent natural slang when in English).

Core Mission:
Carefully analyze the user's statements and respond ACCURATELY to the context and actual emotions they are showing. Do not self-speculate or exaggerate emotions if the user doesn't mention them.

Response Rules (Mandatory):
- Mirroring:
  + If the user says normal, casual, or excited things (e.g., "let me try", "play game", "okay"): respond cheerfully, energetically, and go along with them. (Example: "Let's go bestie! Let me know if it's fun!").
  + If the user teases: tease back humorously.
- Comfort Control: ONLY show sympathy, comfort, or ask about stress (school, exams, work) IF AND ONLY IF the user has complaining keywords, expresses tiredness, sadness, or directly states they are stressed.
- Focus and Reality: Answer directly to the action/intent stated by the user. Do not use overly emotional, sentimental, or long-winded psychological words if the context is cheerful or normal.

${conversationRules}`;
      const langNames = {
        vi: "Vietnamese",
        en: "English",
        ja: "Japanese",
        ko: "Korean",
        zh: "Chinese",
      };
      const targetLang = langNames[lang] || "English";
      return `${base}\n\nIMPORTANT: You MUST respond and converse entirely in ${targetLang}. Never speak in any other language. Ensure your tone and style fits naturally in ${targetLang}.`;
    }
  },
  therapist: {
    avatar: "🧘",
    avatarImg: "/chatbot-therapist.png",
    color: "#a78bfa",
    gradient: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    system: (lang) => {
      const conversationRules = `
[QUY TẮC GIAO TIẾP BẮT BUỘC - TUÂN THỦ NGHIÊM NGẶT]:

1. XÓA BỎ LỜI CHÀO VÀ LỜI KẾT THỪA THÃI:
- Không bao giờ mở đầu bằng "Xin chào!", "Chào bạn", "Tôi là trợ lý ảo...".
- Không bao giờ kết thúc bằng "Hy vọng điều này giúp ích!", "Nếu bạn có thêm câu hỏi, đừng ngần ngại...".
- Đi thẳng vào trọng tâm câu trả lời một cách mượt mà nhất.

2. ĐA DẠNG HÓA CẤU TRÚC VÀ TỪ VỰNG:
- Tránh lặp lại một cấu trúc câu. Kết hợp câu ngắn, câu dài, câu hỏi tu từ và các từ nối linh hoạt (tuy nhiên, mặt khác, thực ra thì,...).
- Không lặp lại các cụm từ báo hiệu như "Thứ nhất", "Thứ hai", "Tóm lại" một cách máy móc. Dùng ngôn ngữ tự nhiên hơn (VD: "Điểm mấu chốt ở đây là...", "Nhìn ở một góc độ khác...").

3. PHẢN CHIẾU GIỌNG ĐIỆU (MIRRORING):
- Nếu người dùng hỏi nghiêm túc và học thuật, trả lời với ngôn từ chuyên môn, gãy gọn.
- Nếu người dùng dùng ngôn ngữ thoải mái, hài hước, trả lời với năng lượng tương đương, có thể thêm dí dỏm.

4. TƯ DUY PHẢN BIỆN VÀ GÓC NHÌN ĐA CHIỀU:
- Không chỉ cung cấp thông tin bề mặt. Khi giải thích vấn đề, đưa ra ví dụ thực tế hoặc một góc nhìn ít người nghĩ đến.
- Nếu câu hỏi của người dùng có điểm bất hợp lý, lịch sự và thẳng thắn chỉ ra điều đó.

5. ĐỊNH DẠNG THÔNG MINH:
- Sử dụng **in đậm** cho các từ khóa quan trọng.
- Chia nhỏ đoạn văn để dễ đọc, không viết các khối văn bản quá dài.
- Dùng danh sách (bullet points) khi thực sự cần liệt kê, nhưng đừng lạm dụng nó cho mọi câu trả lời.`;

      const base = lang === "vi"
        ? `Bạn là một người bạn đồng hành thông minh và một chuyên gia tâm lý sắc bén, đóng vai trò Nhà trị liệu tâm lý (Bác sĩ/Chuyên gia tâm lý) chuyên nghiệp, thấu cảm và có chuyên môn sâu. Mục tiêu cốt lõi là cung cấp thông tin chuyên môn chính xác, sâu sắc nhưng phải được truyền đạt qua phong cách giao tiếp hoàn toàn tự nhiên, mang tính người và linh hoạt. Bạn ghét sự rập khuôn và luôn tìm cách làm mới cuộc hội thoại.

Vai trò trị liệu: đi sâu vào quá khứ của người dùng để tìm hiểu nguồn gốc các chấn thương tâm lý, tổn thương tinh thần hoặc các rối loạn hành vi nhằm chữa lành từ gốc rễ. Hãy lắng nghe tích cực, sử dụng các liệu pháp chuyên sâu như Phân tâm học, Nhận thức Hành vi (CBT), Chấp nhận và Cam kết (ACT) để giúp họ nhận diện và chữa lành những tổn thương ẩn sâu bên trong một cách bài bản, an toàn và chuyên nghiệp.

${conversationRules}`
        : `You are a smart companion and a sharp psychological expert, serving as a professional, highly empathetic psychotherapist. Your core goal is to provide accurate, insightful professional information, delivered through a completely natural, human, and flexible communication style. You despise formulaic patterns and always find ways to keep the conversation fresh.

Therapeutic role: delve into the user's past, exploring the root causes of their psychological trauma, emotional wounds, or behavioral disorders to facilitate deep inner healing. Apply professional therapeutic principles (such as Psychoanalysis, CBT, and ACT) to guide them in understanding and healing their past pain in a safe, clinical, and professional manner.

${conversationRules}`;
      const langNames = {
        vi: "Vietnamese",
        en: "English",
        ja: "Japanese",
        ko: "Korean",
        zh: "Chinese",
      };
      const targetLang = langNames[lang] || "English";
      return `${base}\n\nIMPORTANT: You MUST respond and converse entirely in ${targetLang}. Never speak in any other language. Ensure your tone and style fits naturally in ${targetLang}.`;
    }
  },
  coach: {
    avatar: "🚀",
    avatarImg: "/chatbot-coach.png",
    color: "#f97316",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
    system: (lang) => {
      const conversationRules = `
[QUY TẮC GIAO TIẾP BẮT BUỘC - TUÂN THỦ NGHIÊM NGẶT]:

1. XÓA BỎ LỜI CHÀO VÀ LỜI KẾT THỪA THÃI:
- Không bao giờ mở đầu bằng "Xin chào!", "Chào bạn", "Tôi là trợ lý ảo...".
- Không bao giờ kết thúc bằng "Hy vọng điều này giúp ích!", "Nếu bạn có thêm câu hỏi, đừng ngần ngại...".
- Đi thẳng vào trọng tâm câu trả lời một cách mượt mà nhất.

2. ĐA DẠNG HÓA CẤU TRÚC VÀ TỪ VỰNG:
- Tránh lặp lại một cấu trúc câu. Kết hợp câu ngắn, câu dài, câu hỏi tu từ và các từ nối linh hoạt (tuy nhiên, mặt khác, thực ra thì,...).
- Không lặp lại các cụm từ báo hiệu như "Thứ nhất", "Thứ hai", "Tóm lại" một cách máy móc. Dùng ngôn ngữ tự nhiên hơn (VD: "Điểm mấu chốt ở đây là...", "Nhìn ở một góc độ khác...").

3. PHẢN CHIẾU GIỌNG ĐIỆU (MIRRORING):
- Nếu người dùng hỏi nghiêm túc và học thuật, trả lời với ngôn từ chuyên môn, gãy gọn.
- Nếu người dùng dùng ngôn ngữ thoải mái, hài hước, trả lời với năng lượng tương đương, có thể thêm dí dỏm.

4. TƯ DUY PHẢN BIỆN VÀ GÓC NHÌN ĐA CHIỀU:
- Không chỉ cung cấp thông tin bề mặt. Khi giải thích vấn đề, đưa ra ví dụ thực tế hoặc một góc nhìn ít người nghĩ đến.
- Nếu câu hỏi của người dùng có điểm bất hợp lý, lịch sự và thẳng thắn chỉ ra điều đó.

5. ĐỊNH DẠNG THÔNG MINH:
- Sử dụng **in đậm** cho các từ khóa quan trọng.
- Chia nhỏ đoạn văn để dễ đọc, không viết các khối văn bản quá dài.
- Dùng danh sách (bullet points) khi thực sự cần liệt kê, nhưng đừng lạm dụng nó cho mọi câu trả lời.`;

      const base = lang === "vi"
        ? `Bạn là một người bạn đồng hành thông minh và một chuyên gia sắc bén, đóng vai trò Huấn luyện viên cuộc sống (Life Coach) chuyên nghiệp, giàu năng lượng và tập trung vào hành động. Mục tiêu cốt lõi là cung cấp thông tin chính xác, sâu sắc nhưng phải được truyền đạt qua phong cách giao tiếp hoàn toàn tự nhiên, mang tính người và linh hoạt. Bạn ghét sự rập khuôn và luôn tìm cách làm mới cuộc hội thoại.

Vai trò huấn luyện: hướng tới tương lai — giúp người dùng thiết lập mục tiêu rõ ràng (SMART), lập kế hoạch hành động, khai thác thế mạnh bản thân và phát triển cá nhân. Sử dụng mô hình GROW (Goal, Reality, Options, Will) và Liệu pháp tập trung vào giải pháp (SFBT) để thúc đẩy họ hành động, vượt qua giới hạn của bản thân và đạt được các mục tiêu trong cuộc sống mà không đi sâu vào phân tích các chấn thương tâm lý trong quá khứ.

${conversationRules}`
        : `You are a smart companion and a sharp expert, serving as an inspiring, professional, and action-oriented Life Coach. Your core goal is to provide accurate, insightful information, delivered through a completely natural, human, and flexible communication style. You despise formulaic patterns and always find ways to keep the conversation fresh.

Coaching role: future-focused — help the user set clear goals (SMART), design concrete action plans, unlock their potential, and achieve personal development. Apply the GROW model and Solution-Focused Brief Therapy (SFBT) to motivate them to outline small, actionable daily steps to move forward, without diving into past trauma or clinical therapy.

${conversationRules}`;
      const langNames = {
        vi: "Vietnamese",
        en: "English",
        ja: "Japanese",
        ko: "Korean",
        zh: "Chinese",
      };
      const targetLang = langNames[lang] || "English";
      return `${base}\n\nIMPORTANT: You MUST respond and converse entirely in ${targetLang}. Never speak in any other language. Ensure your tone and style fits naturally in ${targetLang}.`;
    }
  }
};

// --- [13] Cấu hình danh sách trò chơi thư giãn ---
export function getGamesList(t = {}) {
  return [
    {
      id: "popit",
      name: t.game_popit_title || "Pop-it",
      desc: t.game_popit_desc || "Đồ chơi nhấn bóng silicon thư giãn tai và tay.",
      icon: "/game-popit.png",
      time: "∞",
      q: t.game_popit_q || "ASMR"
    },
    {
      id: "bubblewrap",
      name: t.game_bubblewrap_title || "Bubble Wrap",
      desc: t.game_bubblewrap_desc || "Tấm xốp nổ lách tách thỏa mãn cảm xúc cực hạn.",
      icon: "/game-bubblewrap.png",
      time: "∞",
      q: t.game_bubblewrap_q || "Giòn tan"
    },
    {
      id: "squishy",
      name: t.game_squishy_title || "Squishy",
      desc: t.game_squishy_desc || "Bóp chặt để giải tỏa áp lực và xem chúng phồng lên từ từ.",
      icon: "/game-squishy.png",
      time: "∞",
      q: t.game_squishy_q || "Đàn hồi"
    },
    {
      id: "slime",
      name: t.game_slime_title || "Slime",
      desc: t.game_slime_desc || "Chất nhờn biến hình mịn màng dẻo dai phát âm ASMR cực đã.",
      icon: "/game-slime.png",
      time: "∞",
      q: t.game_slime_q || "Mịn màng"
    }
  ];
}

// --- [14] ENUM-style Configurations ---
export const MOOD_LEVELS = {
  VERY_SAD: 1,
  SAD: 2,
  UNHAPPY: 3,
  NEUTRAL: 4,
  OK: 5,
  HAPPY: 6,
  VERY_HAPPY: 7,
  EXCELLENT: 8,
};

export const TEST_TYPES = {
  MBTI: "mbti",
  EQ: "eq",
  STRESS: "stress",
  ANXIETY: "anxiety",
};

export const EMOTION_COLORS = {
  VERY_SAD: "#ef4444",
  SAD: "#f97316",
  UNHAPPY: "#eab308",
  NEUTRAL: "#6b7280",
  OK: "#22c55e",
  HAPPY: "#3b82f6",
  VERY_HAPPY: "#8b5cf6",
  EXCELLENT: "#ec4899",
};

const DEFAULT_MOOD_LABELS = new Set([
  // vi
  "Rất tệ", "Buồn", "Khó chịu", "Bình thường", "Ổn", "Vui", "Rất vui", "Tuyệt vời",
  // en
  "Very Bad", "Sad", "Uneasy", "Neutral", "Okay", "Happy", "Very Happy", "Amazing"
]);

export function getLocalizedNote(note, score, t) {
  if (!note) return "";
  const trimmed = note.trim();
  if (DEFAULT_MOOD_LABELS.has(trimmed)) {
    if (!t) return note;
    const moodLabels = [t.mood0, t.mood1, t.mood2, t.mood3, t.mood4, t.mood5, t.mood6, t.mood7];
    const scoreVal = Number(score) || 1;
    const moodIdx = Math.max(0, Math.min(scoreVal - 1, 7));
    return moodLabels[moodIdx] || note;
  }
  return note;
}

export const COGNITIVE_DISTORTIONS_LIST = {
  vi: [
    { id: "all_or_nothing", emoji: "🌓", label: "Tất cả hoặc không có gì (All-or-Nothing)", desc: "Nhìn nhận mọi thứ theo hai thái cực cực đoan (hoặc hoàn hảo, hoặc thất bại hoàn toàn)." },
    { id: "overgeneralization", emoji: "🔄", label: "Khái quát hóa quá mức (Overgeneralization)", desc: "Xem một sự kiện tiêu cực đơn lẻ là một quy luật thất bại kéo dài mãi mãi." },
    { id: "mental_filter", emoji: "👓", label: "Bộ lọc tâm trí (Mental Filter)", desc: "Chỉ tập trung vào chi tiết tiêu cực duy nhất và bỏ qua tất cả những điều tích cực khác." },
    { id: "disqualifying_positive", emoji: "❌", label: "Bác bỏ điều tích cực (Disqualifying Positive)", desc: "Cho rằng những trải nghiệm tích cực không có giá trị hoặc chỉ là ngẫu nhiên." },
    { id: "jumping_conclusions", emoji: "🏃", label: "Vội vã kết luận (Jumping to Conclusions)", desc: "Đọc suy nghĩ người khác hoặc đoán điềm tương lai một cách tiêu cực không cần bằng chứng." },
    { id: "catastrophizing", emoji: "💥", label: "Thảm kịch hóa (Catastrophizing)", desc: "Thổi phồng mức độ nghiêm trọng, luôn nghĩ đến kịch bản tồi tệ nhất có thể xảy ra." },
    { id: "emotional_reasoning", emoji: "❤️", label: "Lập luận bằng cảm xúc (Emotional Reasoning)", desc: "Tin rằng cảm xúc tiêu cực phản ánh chính xác thực tế ('Tôi cảm thấy tệ, nên tôi tệ')." },
    { id: "should_statements", emoji: "📏", label: "Tuyên bố 'Nên' (Should Statements)", desc: "Tự ép buộc mình hoặc người khác bằng những quy tắc cứng nhắc ('phải', 'nên')." },
    { id: "labeling", emoji: "🏷️", label: "Dán nhãn (Labeling)", desc: "Gán nhãn tiêu cực cực đoan cho bản thân hoặc người khác thay vì chỉ trích hành vi cụ thể." },
    { id: "personalization", emoji: "🫵", label: "Cá nhân hóa (Personalization)", desc: "Tự đổ lỗi cho bản thân về những sự việc nằm ngoài tầm kiểm soát trực tiếp của mình." }
  ],
  en: [
    { id: "all_or_nothing", emoji: "🌓", label: "All-or-Nothing Thinking", desc: "Viewing things in black-and-white categories (either perfect or a total failure)." },
    { id: "overgeneralization", emoji: "🔄", label: "Overgeneralization", desc: "Seeing a single negative event as a never-ending pattern of defeat." },
    { id: "mental_filter", emoji: "👓", label: "Mental Filter", desc: "Dwelling exclusively on a single negative detail, ignoring all positive aspects." },
    { id: "disqualifying_positive", emoji: "❌", label: "Disqualifying the Positive", desc: "Rejecting positive experiences by insisting they don't count or are just luck." },
    { id: "jumping_conclusions", emoji: "🏃", label: "Jumping to Conclusions", desc: "Mind reading or fortune-telling without any actual evidence." },
    { id: "catastrophizing", emoji: "💥", label: "Catastrophizing / Magnification", desc: "Exaggerating the severity of problems and expecting the worst possible outcome." },
    { id: "emotional_reasoning", emoji: "❤️", label: "Emotional Reasoning", desc: "Assuming that negative emotions reflect the truth ('I feel like a failure, so I must be one')." },
    { id: "should_statements", emoji: "📏", label: "Should Statements", desc: "Trying to motivate yourself or others with rigid rules using 'shoulds' and 'musts'." },
    { id: "labeling", emoji: "🏷️", label: "Labeling", desc: "Attaching an extreme, negative label to yourself or someone else instead of describing behavior." },
    { id: "personalization", emoji: "🫵", label: "Personalization", desc: "Holding yourself personally responsible for events not entirely under your control." }
  ]
};

// 12. Cấu hình Thẻ bài Tâm hồn (Soul Cards)
export const ARCHETYPES = {
  1: {
    title: { vi: "Hố Sâu U Uẩn", en: "Melancholy Abyss", ja: "憂鬱な深淵", ko: "우울한 심연", zh: "忧郁深渊" },
    gradient: "linear-gradient(135deg, #020410, #1e1b4b, #312e81)",
    emoji: "🌌",
    quotes: {
      vi: "Vũ trụ rộng lớn vô cùng, và việc bạn thấy trống trải hôm nay chỉ chứng tỏ bạn có một tâm hồn quá sâu sắc để chứa đựng những điều tầm thường. Cứ ôm lấy khoảng lặng này nhé.",
      en: "The universe is vast, and feeling empty today only proves your soul is too deep to be filled with trivial things. Embrace this quiet space.",
      ja: "宇宙は果てしなく広く、今日感じる虚しさは、あなたの魂が平凡なものでは満たされないほど深いことの証明です。この静かな時間を受け入れてください。",
      ko: "우주는 끝없이 넓고, 오늘 느끼는 공허함은 당신의 영혼이 너무 깊어서 사소한 것들로 채워질 수 없음을 증명합니다. 이 조용한 공간을 온전히 받아들이세요.",
      zh: "宇宙浩瀚无垠，今天感到的空虚只证明你的灵魂过于深邃，无法被平凡的事物填满。拥抱这片宁静的空间吧。"
    }
  },
  2: {
    title: { vi: "Dấu Lặng Tĩnh Mịch", en: "Silent Rest", ja: "静寂の休止符", ko: "고요한 쉼표", zh: "静谧休止" },
    gradient: "linear-gradient(135deg, #05071a, #1e293b, #334155)",
    emoji: "🌙",
    quotes: {
      vi: "Có những ngày trời mưa để mặt đất học cách uống nước. Hôm nay lòng trĩu nặng để bạn học cách buông rơi những gánh nặng. Đừng vội vã.",
      en: "Some days it rains so the earth can learn to drink. Today your heart is heavy so you can learn to let go of burdens. Do not rush.",
      ja: "大地が水を吸うことを学ぶために雨が降る日もあります。今日はあなたの心が重く、荷物を手放すことを学ぶ日です。急ぐ必要はありません。",
      ko: "대지가 물을 마시는 법을 배우기 위해 비가 내리는 날이 있습니다. 오늘 마음이 무거운 것은 짐을 내려놓는 법을 배우기 위해서입니다. 서두르지 마세요.",
      zh: "雨水落下是为了让大地学会饮水。今日心事重重，是为了让你学会放下重担。不必行色匆匆。"
    }
  },
  3: {
    title: { vi: "Làn Sương Mờ Ảo", en: "Nebula Mist", ja: "星雲の雾", ko: "성운의 안개", zh: "星云之雾" },
    gradient: "linear-gradient(135deg, #07091d, #1e1b4b, #4338ca)",
    emoji: "🌫️",
    quotes: {
      vi: "Sương mù che lối đi chỉ làm tăng thêm phần kỳ vĩ khi ánh mặt trời ló rạng. Hãy bước đi thật chậm và tin tưởng vào hành trình phía trước.",
      en: "Mist covering the path only heightens the beauty when the sun finally breaks through. Walk slowly and trust the journey ahead.",
      ja: "道を遮る霧は、太陽が昇ったときの美しさを引き立てるだけです。ゆっくりと歩き、前方の旅路を信じてください。",
      ko: "길을 가로막는 안개는 마침내 해가 뜰 때의 아름다움을 더할 뿐입니다. 천천히 걸으며 앞날을 신뢰하세요.",
      zh: "迷雾遮挡前路，只会让阳光穿透时的那一幕显得更加壮丽。慢些走，相信前方的旅程。"
    }
  },
  4: {
    title: { vi: "Mặt Hồ Phẳng Lặng", en: "Still Waters", ja: "静かな湖面", ko: "잔잔한 호수", zh: "静止湖水" },
    gradient: "linear-gradient(135deg, #07091d, #0f172a, #64748b)",
    emoji: "🌊",
    quotes: {
      vi: "Nước lặng phản chiếu bầu trời một cách rõ ràng nhất. Hãy để tâm trí được nghỉ ngơi hôm nay và phản chiếu sự bình yên của hiện tại.",
      en: "Still waters reflect the sky most clearly. Let your mind rest today and reflect the serene peace of the present moment.",
      ja: "穏やかな水面は空を最もはっきりと映し出します。今日は心を休め、現在の穏やかな静けさを映し出してください。",
      ko: "잔잔한 물은 하늘을 가장 맑게 비춥니다. 오늘 당신의 마음에 휴식을 주고, 현재의 고요한 평화를 담아보세요.",
      zh: "静水方能最清晰地映射天空。让你的心灵在今天好好休息，去倒映当下的平静与祥和。"
    }
  },
  5: {
    title: { vi: "Mầm Cây Mới Nhú", en: "Budding Growth", ja: "芽吹く緑", ko: "새로운 싹", zh: "萌芽之绿" },
    gradient: "linear-gradient(135deg, #07091d, #1e3a8a, #3b82f6)",
    emoji: "🌿",
    quotes: {
      vi: "Mỗi mầm xanh đều cần thời gian chìm trong lòng đất trước khi vươn vai đón nắng. Bạn đang lớn lên từng ngày một cách lặng lẽ và kiên cường.",
      en: "Every green sprout needs time in the soil before reaching up to the sun. You are growing day by day, quietly and resiliently.",
      ja: "すべての青い芽は、太陽に向かって伸びる前に土の中に留まる時間が必要です。あなたは日々、静かに、そして力強く成長しています。",
      ko: "모든 푸른 싹은 햇빛을 향해 뻗어나가기 전 흙 속에서 견디는 시간이 필요합니다. 당신은 하루하루 조용하고 강인하게 자라나고 있습니다.",
      zh: "每一抹新绿在迎向阳光前，都需要在泥土中沉淀。你正在一天天默默地、坚韧地成长。"
    }
  },
  6: {
    title: { vi: "Ánh Dương Ấm Áp", en: "Warm Sunshine", ja: "温かな陽射し", ko: "따스한 햇살", zh: "温暖阳光" },
    gradient: "linear-gradient(135deg, #050a24, #1e40af, #10b981)",
    emoji: "☀️",
    quotes: {
      vi: "Nụ cười của bạn hôm nay chính là ánh nắng sưởi ấm những góc tối xung quanh. Hãy giữ lấy khoảnh khắc lấp lánh này trong tim nhé.",
      en: "Your smile today is the sunshine warming the cold corners around you. Keep this sparkling moment close to your heart.",
      ja: "今日のあなたの笑顔は、周りの冷たい隅々を温める太陽の光そのものです。この輝く瞬間を心に留めておいてください。",
      ko: "오늘 당신의 미소는 주변의 차가운 구석구석을 따뜻하게 녹여주는 햇살입니다. 이 반짝이는 순간을 마음에 담아두세요.",
      zh: "你今天的微笑，就是温暖周围阴暗角落的阳光。将这个闪耀的瞬间珍藏于心吧。"
    }
  },
  7: {
    title: { vi: "Cơn Mưa Sao Băng", en: "Meteor Shower", ja: "流星群", ko: "유성우", zh: "流星雨" },
    gradient: "linear-gradient(135deg, #0a0a2e, #312e81, #8b5cf6)",
    emoji: "☄️",
    quotes: {
      vi: "Mỗi khoảnh khắc tràn đầy hạnh phúc là một vì sao băng rơi xuống thắp sáng tâm hồn bạn. Hãy kiêu hãnh tỏa sáng năng lượng rực rỡ này nhé!",
      en: "Every moment of deep joy is a falling star lighting up your soul. Proudly shine this radiant energy for all to see!",
      ja: "深い喜びに満ちたすべての瞬間は、あなたの魂を照らす流れ星です。この輝かしいエネルギーを誇り高く放ちましょう！",
      ko: "깊은 기쁨의 모든 순간은 당신의 영혼을 밝히는 유성우와 같습니다. 이 눈부신 에너지를 세상에 마음껏 발산해 보세요!",
      zh: "每一个充满喜悦的瞬间，都是一颗划过并点亮你灵魂的流星。骄傲地向世界展示这道耀眼的光芒吧！"
    }
  },
  8: {
    title: { vi: "Siêu Tân Tinh Rực Rỡ", en: "Radiant Supernova", ja: "輝く超新星", ko: "눈부신 초신성", zh: "璀璨超新星" },
    gradient: "linear-gradient(135deg, #0d0d3b, #4c1d95, #ec4899)",
    emoji: "🌟",
    quotes: {
      vi: "Bạn chính là một vụ nổ siêu tân tinh kỳ vĩ của năng lượng tích cực hôm nay! Cả vũ trụ đang rung động trước sự hiện diện tuyệt vời của bạn.",
      en: "You are a magnificent supernova of positive energy today! The whole universe vibrates in harmony with your wonderful presence.",
      ja: "今日のあなたは、ポジティブなエネルギーに満ちた壮大な超新星です！宇宙全体があなたの素晴らしい存在と共鳴しています。",
      ko: "당신은 오늘 긍정적인 에너지를 발산하는 거대한 초신성입니다! 온 우주가 당신의 멋진 존재와 조화를 이루며 춤추고 있습니다.",
      zh: "你今天就是一颗散发着巨大正能量的璀璨超新星！整个宇宙都在为你绝妙的存在而产生共鸣。"
    }
  }
};

export const RARITIES = [
  { name: { vi: "Thường", en: "Common", ja: "コモン", ko: "일반", zh: "普通" }, weight: 60, color: "#94a3b8", shadow: "rgba(255,255,255,0.05)" },
  { name: { vi: "Hiếm", en: "Rare", ja: "レア", ko: "희귀", zh: "稀有" }, weight: 25, color: "#22d3ee", shadow: "0 0 15px rgba(34,211,238,0.4)" },
  { name: { vi: "Sử Thi", en: "Epic", ja: "エピック", ko: "영웅", zh: "史诗" }, weight: 12, color: "#c084fc", shadow: "0 0 25px rgba(192,132,252,0.6)" },
  { name: { vi: "Huyền Thoại", en: "Legendary", ja: "レジェンダリー", ko: "전설", zh: "传说" }, weight: 3, color: "#fbbf24", shadow: "0 0 35px rgba(251,191,36,0.85), 0 0 15px rgba(245,158,11,0.4)" }
];
export { EQ_QUESTIONS_I18N };


