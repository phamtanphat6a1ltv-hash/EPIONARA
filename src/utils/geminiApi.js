// =================== GEMINI API HELPER ===================
// Tất cả requests đi qua /api/gemini (Vercel serverless proxy).
// Ngoại lệ: nếu user tự nhập custom API key → gọi thẳng Google (key của họ, acceptable).

import { nativeToast } from "./nativeToast.js";
import { sanitizeText } from "./sanitize";
import { trackAICall } from "./performance.js";
import { GoogleGenAI } from "@google/genai";

const isProduction = import.meta.env?.PROD;

function safeLog(level, message, detail = null) {
  if (isProduction) {
    console[level](`[Gemini] ${message}`);
  } else {
    if (detail) {
      console[level](`[Gemini] ${message}`, detail);
    } else {
      console[level](`[Gemini] ${message}`);
    }
  }
}

// --- Client-side Rate Limiter ---
const RateLimiter = {
  calls: [],
  LIMIT: 10,        // max 10 calls
  WINDOW: 60_000,   // per 60 giây

  check() {
    const now = Date.now();
    this.calls = this.calls.filter(t => now - t < this.WINDOW);
    if (this.calls.length >= this.LIMIT) {
      const oldest = this.calls[0];
      const waitSec = Math.ceil((this.WINDOW - (now - oldest)) / 1000);
      nativeToast(`Bạn đang gọi AI quá nhanh. Vui lòng chờ ${waitSec} giây.`, "warning");
      throw new Error("RATE_LIMIT");
    }
    this.calls.push(now);
  }
};

function toGeminiContents(messages) {
  // Validate format and limits
  let processedMessages = Array.isArray(messages) ? messages : [{ role: "user", content: String(messages) }];
  
  // Security: Limit context to max 20 messages
  if (processedMessages.length > 20) {
    processedMessages = processedMessages.slice(-20);
  }

  // Gemini API requires the conversation to start with a user message.
  const firstUserIdx = processedMessages.findIndex(m => m.role === "user");
  const filtered = firstUserIdx !== -1 ? processedMessages.slice(firstUserIdx) : processedMessages;
  
  return filtered.map(m => {
    // Security: Limit each message to max 4000 chars
    let text = sanitizeText(m.content || "");
    if (text.length > 4000) text = text.substring(0, 4000);
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: text }],
    };
  });
}

// Trả về { apiKey?: string }
function getCallConfig() {
  const customKey = typeof localStorage !== "undefined" ? localStorage.getItem("sj_custom_api_key") : null;
  const envKey = import.meta.env?.VITE_GEMINI_API_KEY;
  let key = (customKey && customKey.trim()) || (envKey && envKey.trim()) || undefined;
  
  // Security: Validate format API key
  if (key && !key.startsWith("AIza")) {
    console.warn("Invalid API Key format detected.");
    key = undefined;
  }
  
  return { apiKey: key };
}

export function isCasualMessage(text) {
  if (!text) return false;
  const clean = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'“”[\]\\]/g, "").trim();
  const socialPhrases = [
    "cảm ơn", "cám ơn", "thanks", "thank you", "cảm ơn bạn", "cám ơn bạn", "ok", "dạ", "ừm", "đúng thế", "đúng vậy", "uh", "uhm",
    "không có gì", "không có j", "ko có gì", "ko có j", "khong co gi", "khong co j", "ko co gi", "ko co j", "không có chi", "khong co chi",
    "không chi", "khong chi", "dạ không có gì", "da khong co gi", "không sao", "khong sao", "ko sao", "không sao đâu", "khong sao dau",
    "no problem", "you are welcome", "youre welcome", "ur welcome", "welcome", "nothing", "nothing much", "nevermind", "never mind",
    "chào", "hello", "hi", "chào bạn", "chào bot", "xin chào", "xin chao", "chao ban", "hi bot", "hey", "greetings"
  ];
  return socialPhrases.includes(clean);
}

/**
 * Invokes the Gemini API with the given messages history and optional system instructions.
 * Supports auto-fallback between proxy and direct Google endpoint if a custom key is present.
 * @param {Object} options
 * @param {string} [options.system] - System prompting instructions for the agent
 * @param {Array<{role: 'user' | 'model' | 'system', content: string}>} options.messages - Conversations messages history
 * @param {number} [options.max_tokens=800] - Max output token limit
 * @param {AbortSignal} [options.signal] - Signal to abort the fetch request
 * @returns {Promise<string>} Core output text response from the AI
 * @throws {Error} If rate limit is hit, network fails, or AI returns safety blocks/empty text
 */
export async function callGeminiAPI({ system, messages, max_tokens = 800, signal }) {
  let lastUserMsg = "";
  if (Array.isArray(messages)) {
    lastUserMsg = messages.filter(m => m.role === "user").slice(-1)[0]?.content || "";
  } else if (typeof messages === "string") {
    lastUserMsg = messages;
  }

  const combinedText = (system || "") + "\n" + (Array.isArray(messages) ? messages.map(m => m.content).join("\n") : messages || "");
  const isJSONRequired = combinedText.toLowerCase().includes("json") || combinedText.toLowerCase().includes("schema");

  if (isCasualMessage(lastUserMsg)) {
    safeLog("info", "Casual message detected. Returning local mock response to save quota.");
    return isJSONRequired ? generateLocalMockJSONResponse(messages, system) : generateLocalMockResponse(messages, system);
  }

  const useMock = import.meta.env?.VITE_DEMO_MODE === "true";
  
  if (useMock) {
    safeLog("info", "Demo Mode is enabled. Returning local mock response.");
    return isJSONRequired ? generateLocalMockJSONResponse(messages, system) : generateLocalMockResponse(messages, system);
  }

  const startTime = performance.now();
  let success = false;
  
  const { apiKey } = getCallConfig();

  try {
    RateLimiter.check();
    const model = "gemini-2.0-flash";

    const safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
    ];

    const body = {
      contents: toGeminiContents(messages),
      generationConfig: { maxOutputTokens: max_tokens, temperature: 0.85 },
      safetySettings,
    };
    if (system) {
      body.systemInstruction = { parts: [{ text: sanitizeText(system) }] };
    }

    let text = "";

    if (apiKey) {
      try {
        safeLog("info", "Sử dụng API key, gọi Google API qua @google/genai...");
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: toGeminiContents(messages),
          config: {
            systemInstruction: system ? sanitizeText(system) : undefined,
            maxOutputTokens: max_tokens,
            temperature: 0.85,
            safetySettings,
          }
        });
        text = response.text || "";
      } catch (sdkErr) {
        safeLog("warn", "Lỗi SDK @google/genai, thử REST fetch trực tiếp: " + sdkErr.message);
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || err?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
    } else {
      safeLog("info", "Không tìm thấy direct key, gọi qua proxy /api/gemini...");
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, stream: false, body }),
        signal,
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("application/json")) {
        throw new Error("PROXY_UNAVAILABLE");
      }

      const data = await res.json();
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (!text) {
      throw new Error("empty_response");
    }

    success = true;
    return text;
  } catch (err) {
    safeLog("warn", "API call failed. Error: " + err.message + ". Falling back to local mock engine.");
    return isJSONRequired ? generateLocalMockJSONResponse(messages, system) : generateLocalMockResponse(messages, system);
  } finally {
    const duration = performance.now() - startTime;
    trackAICall(duration, success);
  }
}

// Streaming helper — dùng SSE thực sự
/**
 * Streams response chunks from the Gemini API using Server-Sent Events (SSE).
 * @param {Object} options
 * @param {string} [options.system] - System prompting instructions for the agent
 * @param {Array<{role: 'user' | 'model' | 'system', content: string}>} options.messages - Conversations messages history
 * @param {number} [options.max_tokens=800] - Max output token limit
 * @param {AbortSignal} [options.signal] - Signal to abort the fetch request
 * @returns {AsyncGenerator<string, void, unknown>} Async generator yielding text chunks
 * @throws {Error} If rate limit is hit, network fails, or status code is incorrect
 */
export async function* streamGeminiAPI({ system, messages, max_tokens = 800, signal }) {
  let lastUserMsg = "";
  if (Array.isArray(messages)) {
    lastUserMsg = messages.filter(m => m.role === "user").slice(-1)[0]?.content || "";
  } else if (typeof messages === "string") {
    lastUserMsg = messages;
  }

  const combinedText = (system || "") + "\n" + (Array.isArray(messages) ? messages.map(m => m.content).join("\n") : messages || "");
  const isJSONRequired = combinedText.toLowerCase().includes("json") || combinedText.toLowerCase().includes("schema");

  if (isCasualMessage(lastUserMsg)) {
    safeLog("info", "Casual message detected. Streaming local mock response to save quota.");
    const mockText = isJSONRequired ? generateLocalMockJSONResponse(messages, system) : generateLocalMockResponse(messages, system);
    yield* streamLocalMockResponse(mockText, signal);
    return;
  }

  const useMock = import.meta.env?.VITE_DEMO_MODE === "true";
  
  if (useMock) {
    safeLog("info", "Demo Mode is enabled. Streaming local mock response.");
    const mockText = isJSONRequired ? generateLocalMockJSONResponse(messages, system) : generateLocalMockResponse(messages, system);
    yield* streamLocalMockResponse(mockText, signal);
    return;
  }

  const startTime = performance.now();
  let success = false;
  let generatorToYield = null;
  
  const { apiKey } = getCallConfig();

  try {
    RateLimiter.check();
    const model = "gemini-2.0-flash";

    const safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
    ];

    const body = {
      contents: toGeminiContents(messages),
      generationConfig: { maxOutputTokens: max_tokens, temperature: 0.85 },
      safetySettings,
    };
    if (system) {
      body.systemInstruction = { parts: [{ text: sanitizeText(system) }] };
    }

    if (apiKey) {
      try {
        safeLog("info", "Sử dụng API key stream, gọi trực tiếp Google API qua @google/genai...");
        const ai = new GoogleGenAI({ apiKey });
        const responseStream = await ai.models.generateContentStream({
          model: "gemini-2.0-flash",
          contents: toGeminiContents(messages),
          config: {
            systemInstruction: system ? sanitizeText(system) : undefined,
            maxOutputTokens: max_tokens,
            temperature: 0.85,
            safetySettings,
          }
        });

        let hasYielded = false;
        for await (const chunk of responseStream) {
          if (signal?.aborted) break;
          if (chunk.text) {
            hasYielded = true;
            yield chunk.text;
          }
        }
        if (hasYielded) {
          success = true;
          return;
        }
      } catch (sdkErr) {
        safeLog("warn", "Lỗi SDK @google/genai stream, thử REST SSE fetch: " + sdkErr.message);
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || err?.message || `HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          if (signal?.aborted) {
            reader.releaseLock();
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]" || !dataStr) continue;

              try {
                const data = JSON.parse(dataStr);
                const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textChunk) yield textChunk;
              } catch {
                safeLog("warn", "Stream chunk parse error");
              }
            }
          }
        }
        success = true;
        return;
      }
    } else {
      safeLog("info", "Không có direct key, gọi stream qua proxy /api/gemini...");
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, stream: true, body }),
        signal,
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || (!contentType.includes("text/event-stream") && !contentType.includes("application/json"))) {
        throw new Error("PROXY_UNAVAILABLE");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        if (signal?.aborted) {
          reader.releaseLock();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]" || !dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textChunk) yield textChunk;
            } catch {
              safeLog("warn", "Stream chunk parse error");
            }
          }
        }
      }
      success = true;
      return;
    }
  } catch (err) {
    safeLog("warn", "Stream API call failed. Error: " + err.message + ". Falling back to local mock engine.");
    const combinedText = (system || "") + "\n" + (Array.isArray(messages) ? messages.map(m => m.content).join("\n") : messages || "");
    const isJSONRequired = combinedText.toLowerCase().includes("json") || combinedText.toLowerCase().includes("schema");
    const mockText = isJSONRequired ? generateLocalMockJSONResponse(messages, system) : generateLocalMockResponse(messages, system);
    generatorToYield = streamLocalMockResponse(mockText, signal);
  } finally {
    const duration = performance.now() - startTime;
    trackAICall(duration, success);
  }

  if (generatorToYield) {
    yield* generatorToYield;
  }
}

// Aliases cho compatibility
export const callAnthropicAPI = callGeminiAPI;
export const streamAnthropicAPI = streamGeminiAPI;

// Hệ thống phản hồi tâm lý dự phòng khi mất kết nối mạng / hết quota (Bilingual Local Heuristics Engine)
const MOCK_DATA = {
  vi: {
    thanks: {
      friend: "Có chi đâu ní ơi! Cực kỳ hân hạnh được đồng hành và chill cùng ní. Thế cậu có muốn flex hay dãi bày thêm về chủ đề nào khác nữa hông? Tớ luôn sẵn sàng ghé tai nghe nè! 🔥",
      therapist: "Tôi trân trọng lòng tin của bạn. Việc chia sẻ và nhìn nhận lại những suy nghĩ này là một bước đi quan trọng trong tiến trình thấu hiểu những tổn thương từ quá khứ. Bạn có muốn đi sâu hơn vào một khía cạnh cụ thể nào khác hoặc những ký ức nào liên quan đến cảm giác này không?",
      coach: "Rất tốt, cảm ơn bạn đã chia sẻ rõ ràng. Chúng ta đã xác định xong hiện trạng của bạn. Bây giờ, bạn có muốn tiếp tục làm rõ mục tiêu tiếp theo hoặc thảo luận thêm về các hành động khác để hướng tới tương lai phát triển không?"
    },
    welcome: {
      friend: "Không có gì đâu nè ní ơi, tớ rất vui vì có thể ở đây để lắng nghe và đồng hành cùng ní. Bạn có muốn tiếp tục tâm sự về chủ đề nào khác không? Tớ luôn sẵn sàng. 💙",
      therapist: "Không có gì đâu bạn, tôi rất vui vì có thể ở đây để lắng nghe và đồng hành trị liệu cùng bạn. Bạn có muốn tiếp tục tìm hiểu thêm về các trải nghiệm khác không? Tôi luôn sẵn sàng.",
      coach: "Không có gì đâu bạn, tôi rất vui vì có thể ở đây để hỗ trợ huấn luyện và đồng hành cùng bạn. Bạn có muốn tiếp tục lập kế hoạch cho mục tiêu tiếp theo không? Tôi luôn sẵn sàng."
    },
    greeting: {
      friend: "Hế lô ní yêu! Lại là tớ - MindBot siêu cấp đáng yêu đây. Hôm nay thế nào rồi ní? Có chuyện gì hot hay có nỗi buồn nào muốn xả ra cho nhẹ lòng không gét go kể tớ nghe đê! 🤖✨",
      therapist: "Xin chào. Tôi là nhà trị liệu tâm lý MindBot của bạn. Hôm nay bạn cảm thấy thế nào trong lòng? Có trải nghiệm hay suy nghĩ nào từ quá khứ đang ảnh hưởng đến trạng thái tinh thần hiện tại mà bạn muốn cùng tôi tìm hiểu không? 🧘💙",
      coach: "Chào bạn! Tôi là Huấn luyện viên cuộc sống MindBot của bạn. Hãy cùng bắt đầu ngày mới bằng việc tập trung vào các mục tiêu phát triển cá nhân của bạn nhé. Hôm nay bạn muốn đạt kết quả gì, và có thử thách nào bạn muốn cùng tôi lên kế hoạch hành động vượt qua không? 🚀💙"
    },
    default: {
      friend: "Cảm ơn bạn đã chia sẻ nha ní ơi! Cảm xúc tụt hay bay bổng thì cũng là chuyện thường tình thế thôi, không việc gì phải xoắn cả! Thế ní có muốn gõ thêm vài dòng kể rõ đầu đuôi ngọn ngành nguyên nhân vì sao lại có cái vibe này không nè?",
      therapist: "Cảm ơn bạn đã tin tưởng giãi bày những suy nghĩ này. Những cảm xúc hiện tại thường là tấm gương phản chiếu những tổn thương hoặc trải nghiệm chưa được giải tỏa từ quá khứ. Bạn có muốn cùng tôi nhìn lại xem cảm xúc này bắt nguồn từ ký ức hoặc sự kiện nào trước đây không?",
      coach: "Cảm ơn bạn đã chia sẻ rõ ràng thực trạng hiện tại. Nhận diện được vấn đề là bước đầu tiên để tiến lên phía trước. Dựa trên tình huống này, mục tiêu cụ thể (SMART goal) mà bạn muốn hướng tới trong những ngày tới là gì, và hành động nhỏ nhất bạn có thể làm hôm nay là gì?"
    },
    categories: [
      {
        id: "STRESS",
        keywords: ["căng thẳng", "áp lực", "stress", "mệt mỏi", "deadline", "thi", "học", "work", "job", "mất ngủ", "overwork"],
        response: {
          friend: "Trùi ui nghe căng thẳng áp lực muốn xỉu luôn đúng hông ní? Deadline với thi cử dí làm ní mệt mỏi gục ngã à? Đừng có cố quá nha ní, gét go vào ngay mục 'Cân bằng' chơi trò Pop-it bóp bong bóng giải stress đi, bao phê bao chill luôn! Nhớ thương bản thân nha ní ơi! 💙",
          therapist: "Tôi nhận thấy bạn đang trải qua sự căng thẳng và áp lực rất lớn. Trạng thái quá tải này thường kích hoạt các phản ứng phòng vệ từ những tổn thương hoặc trải nghiệm trong quá khứ khi bạn phải tự gồng gánh một mình. Hãy cho phép bản thân nghỉ ngơi 2 phút với trò chơi Pop-it ở mục 'Cân bằng' như một bài tập chánh niệm ngắn để làm dịu hệ thần kinh nhé. Bạn xứng đáng được an toàn và bình yên lúc này. 💙",
          coach: "Căng thẳng và mệt mỏi là những phản hồi cho thấy khối lượng công việc hiện tại đang vượt quá năng lượng điều tiết của bạn. Hãy nhìn nhận đây là cơ hội để thiết lập lại ranh giới cá nhân. Bước đầu tiên, hãy dành ra 2 phút chơi Pop-it ở mục 'Cân bằng' để tái tạo năng lượng ngắn. Sau đó, chúng ta sẽ cùng phân tích để phân bổ lại thứ tự ưu tiên cho công việc của bạn nhé. 🚀"
        },
        action: {
          friend: "Tớ khuyên thật lòng là ní nên lướt ngay qua mục 'Cân bằng' rồi đập bành bạch quả Pop-it đi. Âm thanh bóp bong bóng ASMR siêu đã tai giúp ní bay màu stress ngay tức khắc luôn á. Chơi thử luôn hông ní? 💙",
          therapist: "Để hỗ trợ xoa dịu phản ứng căng thẳng của cơ thể lúc này, tôi khuyên bạn nên thử thực hiện một bài tập nhỏ với trò chơi Pop-it ở mục 'Cân bằng'. Sự tập trung vào xúc giác và âm thanh ASMR sẽ giúp điều hòa nhịp tim. Bạn có muốn chúng ta cùng thử thực hiện không? 💙",
          coach: "Để khôi phục hiệu suất và sự tập trung, tôi khuyên bạn nên tạm dừng công việc và chơi Pop-it giải tỏa căng thẳng trong mục 'Cân bằng'. Đây là kỹ thuật ngắt quãng hiệu quả giúp não bộ tái tạo sức sáng tạo. Bạn có muốn thực hiện bước hành động này ngay không? 🚀"
        },
        followUp: {
          friend: "Biết ní đang gánh một núi áp lực nên tớ xót lắm á. Có chuyện gì hot kể cụ thể đầu đuôi vì sao stress thế ní? Học hành, thi cử hay công việc dí quá à? Tớ nghe nè! 💙",
          therapist: "Tôi hiểu bạn đang phải chịu đựng áp lực nặng nề. Hãy cùng tôi nhìn lại xem cảm giác quá tải này có gợi nhắc bạn về những tổn thương hay sự kiện nào trong quá khứ khi phải cố gắng quá sức không? Bạn có sẵn lòng chia sẻ không? 💙",
          coach: "Để vượt qua sự căng thẳng này, mục tiêu cụ thể mà bạn muốn hoàn thành trong ngày hôm nay là gì? Hãy chia nhỏ nó ra và xác định một hành động cốt lõi nhất chúng ta cần thực hiện tiếp theo. 🚀"
        }
      },
      {
        id: "SAD",
        keywords: ["buồn", "khóc", "tệ", "chán", "cô đơn", "tổn thương", "thất bại", "chia tay", "nhớ", "nhạt"],
        response: {
          friend: "Thương ní quá đi mất! Buồn bã, tủi thân hay chán nản khóc lóc cũng hông sao hết á, cứ khóc ra cho nhẹ lòng đi ní. Đừng gồng mình làm chi cho mệt. Ní lướt qua bật tiếng mưa rơi ở mục 'Âm thanh chữa lành' rồi đắp chăn ấm uống cốc trà nóng nha. Có tớ ở đây bao bọc ní qua những ngày giông bão này nè! 🌿",
          therapist: "Cảm ơn bạn đã tin tưởng chia sẻ những nỗi buồn và tổn thương sâu kín này với tôi. Nỗi buồn là một tín hiệu tự nhiên của cơ thể cho thấy bạn cần được chăm sóc và chữa lành những tổn thương từ quá khứ. Hãy ôm lấy cảm xúc này thay vì trốn tránh nó. Bạn có thể mở mục 'Âm thanh chữa lành', lắng nghe tiếng mưa và tập trung vào hơi thở. Tôi ở đây để đồng hành cùng bạn đi qua cơn đau này một cách chánh niệm. 🌿",
          coach: "Nỗi buồn hay sự chán nản là phản hồi cho thấy một nhu cầu hoặc giá trị cốt lõi nào đó của bạn đang bị ảnh hưởng. Hãy chấp nhận trạng thái này và dành cho mình khoảng lặng 5 phút nghe tiếng mưa ở mục 'Âm thanh chữa lành' để lấy lại cân bằng. Sau đó, chúng ta sẽ cùng chuyển trọng tâm sang những điều bạn có thể kiểm soát và hành động để thay đổi tình trạng hiện tại nhé. 🚀"
        },
        action: {
          friend: "Ní ơi, lúc này ní cứ bật ngay tiếng mưa rơi hay nhạc tần số thiền siêu ấm ở mục 'Âm thanh chữa lành' đi nè. Rồi lấy giấy bút hoặc mở mục 'Nhật ký' ra gõ tự do xả hết bực bội trong lòng ra nhé, hiệu nghiệm lắm á! Tớ luôn bên ní! 🌿",
          therapist: "Để xử lý nỗi buồn một cách lành mạnh, tôi khuyên bạn nên sử dụng âm thanh tiếng mưa rơi trong mục 'Âm thanh chữa lành' làm neo chánh niệm. Đồng thời, hãy viết tự do trong phần 'Nhật ký' để gọi tên và biểu đạt các tổn thương từ quá khứ. Điều này rất có ích cho việc trị liệu. 🌿",
          coach: "Để vượt qua trạng thái trì trệ này, bước đầu tiên tôi khuyên bạn nên bật 'Âm thanh chữa lành' để thư giãn đầu óc. Kế tiếp, hãy viết ra 3 điều nhỏ bạn muốn thực hiện ngày hôm nay để lấy lại động lực tiến về phía trước. Bạn sẵn sàng hành động chứ? 🚀"
        },
        followUp: {
          friend: "Tớ vẫn đang ghé tai nghe ní kể nè. Cảm giác chán chường cô đơn này đúng là tệ thật sự, nhưng cứ tự nhiên kể hết cho tớ những gì đang đè nặng trong lòng đi nha ní yêu, tớ làm chỗ dựa an toàn cho ní mà! 🌿",
          therapist: "Tôi vẫn đang lắng nghe bạn. Cảm giác đau buồn này có thể liên quan đến một ký ức, mối quan hệ hay sự mất mát nào trong quá khứ của bạn không? Hãy chia sẻ khi bạn cảm thấy sẵn sàng để cùng trị liệu nhé. 🌿",
          coach: "Chúng ta không thể thay đổi những gì đã xảy ra trong quá khứ, nhưng bạn hoàn toàn có thể lựa chọn cách hành động để định hình tương lai. Mục tiêu nhỏ nhất mà bạn muốn đạt được hôm nay để cải thiện tâm trạng là gì? 🚀"
        }
      },
      {
        id: "HAPPY",
        keywords: ["vui", "hạnh phúc", "tuyệt", "đậu", "thắng", "đạt được", "yêu", "thích", "good", "happy", "nice", "awesome"],
        response: {
          friend: "Trời đất ơi đỉnh chóp ní ơi! Nghe tin vui của ní mà tớ sướng rơn cả người, vui lây luôn á! Đúng là năng lượng xịn đét cháy khét lẹt. Mau mau lướt qua mục 'Nhật ký tâm hồn' viết lại khoảnh khắc vàng ngọc này đi ní ơi, rồi mang niềm vui này đi flex với mọi người xung quanh luôn đê! Mãi mận mãi mận! 🌟",
          therapist: "Thật là một khoảnh khắc tuyệt vời và ý nghĩa. Trải nghiệm niềm vui và sự hạnh phúc trọn vẹn là minh chứng cho thấy những nỗ lực tự chữa lành và nuôi dưỡng bản thân của bạn đang đơm hoa kết trái. Hãy ghi nhận và trân trọng cảm giác này bằng cách viết lại vào 'Nhật ký tâm hồn' như một tài nguyên tinh thần tích cực cho tương lai nhé. Tôi rất mừng cho hành trình tiến bộ của bạn. 🌟",
          coach: "Tuyệt vời! Đây là một thành tựu xứng đáng cho những nỗ lực hành động của bạn. Hãy ăn mừng chiến thắng này! Những cảm xúc tích cực này là đòn bẩy năng lượng cực lớn giúp bạn bứt phá hơn nữa. Hãy viết lại cột mốc này vào 'Nhật ký tâm hồn' để ghi nhận sự tiến bộ của bản thân, rồi chuẩn bị cho những mục tiêu cao hơn tiếp theo nhé. Chúc mừng bạn! 🚀🌟"
        },
        action: {
          friend: "Quá xịn! Ní bay ngay vào mục 'Nhật ký tâm hồn' viết lại dòng kỷ niệm này đi ní, hoặc chia sẻ năng lượng tích cực này với hội bạn thân yêu nhé. Kể cụ thể chi tiết đầu đuôi vì sao ní sướng thế cho tớ hóng hớt với coi! 🌟",
          therapist: "Để củng cố trạng thái tích cực này, tôi khuyên bạn nên viết lại trải nghiệm này vào mục 'Nhật ký tâm hồn' như một bài thực hành lòng biết ơn. Bạn có muốn chia sẻ kỹ hơn điều gì đã khơi dậy niềm hạnh phúc này trong bạn không? 🌟",
          coach: "Đây là cơ hội tuyệt vời để ghi nhận thành quả! Tôi khuyên bạn nên ghi lại cột mốc này vào mục 'Nhật ký tâm hồn' ngay lập tức. Sau đó, bạn muốn thảo luận về việc làm thế nào để duy trì đà chiến thắng này cho các mục tiêu tiếp theo chứ? 🚀"
        },
        followUp: {
          friend: "Năng lượng tích cực ngập tràn vũ trụ luôn rồi ní ơi! Có muốn viết ngay trang nhật ký lưu lại khoảnh khắc đỉnh chóp này hôm nay hông ní yêu? 🌟",
          therapist: "Thật tốt khi thấy tâm trí bạn đang ngập tràn sự bình yên và hạnh phúc. Bạn có muốn lưu giữ cảm xúc trân quý này vào nhật ký để củng cố sức mạnh nội tại không? 🌟",
          coach: "Đà chiến thắng đang ở bên bạn. Hãy tận dụng năng lượng này để đặt ra mục tiêu (SMART goal) tiếp theo của mình. Bạn đã sẵn sàng lập kế hoạch cho bước đi tiếp theo chưa? 🚀"
        }
      }
    ],
    actionDefault: {
      friend: "Ní ơi, ní có thể bắt đầu bằng việc viết một dòng nhật ký ngắn về cảm xúc hiện tại, thực hiện 1 phút hít thở sâu để tĩnh tâm, hoặc nghe một giai điệu cực chill trong mục 'Âm thanh chữa lành' nhé. Tớ luôn sẵn sàng hóng hớt cùng ní. 💙",
      therapist: "Bạn có thể bắt đầu bằng việc viết một dòng nhật ký ngắn về cảm xúc hiện tại, thực hiện bài tập hít thở chánh niệm 1 phút để làm dịu tâm trí, hoặc lắng nghe một âm thanh điều hòa trong mục 'Âm thanh chữa lành'. Tôi luôn sẵn sàng đồng hành hỗ trợ bạn. 💙",
      coach: "Bạn có thể bắt đầu bằng việc viết một dòng nhật ký ngắn ghi nhận thực trạng, thực hiện 1 phút tập trung hít thở sâu để lấy lại sự sáng suốt, hoặc nghe một giai điệu nhẹ nhàng ở mục 'Âm thanh chữa lành'. Tôi luôn sẵn sàng hướng dẫn bạn thiết lập hành động tiếp theo. 🚀💙"
    },
    actionKeywords: ["làm gì", "làm thế nào", "như thế nào", "giúp", "khuyên", "làm sao", "làm cách nào", "hướng dẫn"]
  },
  en: {
    thanks: {
      friend: "No biggie, bestie! Always down to chill and chat with you. Wanna flex or share something else? I'm all ears! I'm here! 💅🔥",
      therapist: "I appreciate your trust. Sharing and reflecting on these thoughts is an important step in understanding past pain. Would you like to explore another specific aspect or any memories associated with this feeling?",
      coach: "Great, thank you for sharing. We have mapped out the reality. Now, would you like to clarify your next goal or discuss further actions to move forward in your personal development?"
    },
    welcome: {
      friend: "You're very welcome, bestie! I'm really glad to be here to listen and accompany you. Would you like to continue chatting about another topic? I'm always here. 💙",
      therapist: "You are very welcome. I'm glad to be here to listen and support you in therapy. Would you like to explore other experiences? I'm always here.",
      coach: "You are very welcome. I'm glad to be here to coach and support you. Would you like to plan your next goal? I'm always here."
    },
    greeting: {
      friend: "Hey bestie! MindBot is in the house. How's it going today? Got some juicy news or feeling a bit low? Spill the tea, I'm here! 🤖💅",
      therapist: "Hello. I am your psychotherapist MindBot. How are you feeling today? Are there any experiences or thoughts from your past that are affecting your current mental state that you'd like to explore together? 🧘💙",
      coach: "Hello! I am your Life Coach MindBot. Let's start by focusing on your goals. What outcomes do you want to achieve today, and what challenges do you want to design a plan to overcome together? 🚀💙"
    },
    default: {
      friend: "Thank you for sharing these thoughts, bestie! Feeling up or down is totally normal, no cap! Wanna type a bit more and tell me what caused this vibe?",
      therapist: "Thank you for sharing these thoughts. Current emotions often reflect unresolved pain or experiences from the past. Would you like to look back with me and see where this feeling originates from in your past?",
      coach: "Thank you for sharing your current reality. Recognizing it is the first step forward. Based on this situation, what is the specific SMART goal you want to target in the coming days, and what is the smallest action you can take today?"
    },
    categories: [
      {
        id: "STRESS",
        keywords: ["stress", "pressure", "tired", "deadline", "exam", "study", "work", "job", "insomnia", "overwhelmed"],
        response: {
          friend: "Omg that sounds so stressful, bestie! Deadlines and exams got you feeling overwhelmed? No cap, you need to chill. Go to the 'Balance' section and play Pop-it right now, it's such a vibe! Take care of yourself! 💙",
          therapist: "I hear the immense pressure and stress you are experiencing. This state of overwhelm often triggers defense mechanisms from past experiences where you had to carry burdens alone. Please allow yourself 2 minutes of rest with the Pop-it game in the 'Balance' section as a brief mindfulness exercise to soothe your nervous system. You deserve to feel safe and at peace right now. 💙",
          coach: "Stress and fatigue are feedback indicators that your current workload exceeds your adaptive energy. Let's view this as an opportunity to reset your boundaries. First, take a 2-minute energy break with the Pop-it game in the 'Balance' section. After that, we will prioritize your tasks and create a structured plan. 🚀"
        },
        action: {
          friend: "No cap, you should run to the 'Balance' section and pop some bubbles on the Pop-it board. The ASMR sound is a whole lifesaver. Wanna try it now? 💙",
          therapist: "To help regulate your body's stress response, I recommend a grounding exercise using the Pop-it game in the 'Balance' section. Focusing on tactile sensations and ASMR sounds can help soothe your nervous system. Would you like to try it? 💙",
          coach: "To restore productivity and focus, I recommend taking a structured break to play Pop-it in the 'Balance' section. This is a highly effective intermission technique to recharge your brain. Shall we take this action now? 🚀"
        },
        followUp: {
          friend: "I know you're carrying a whole mountain of stress, bestie. Spill the tea, why are you so overwhelmed? School, exams, or work? I'm listening! 💙",
          therapist: "I understand you are carrying a heavy burden. Let's look back together: does this feeling of overwhelm remind you of any past trauma or events where you felt unsupported? Feel free to share. 💙",
          coach: "To overcome this stress, what is the specific outcome you want to focus on achieving today? Let's break it down and clarify the single most critical action step to take next. 🚀"
        }
      },
      {
        id: "SAD",
        keywords: ["sad", "cry", "bad", "bored", "lonely", "hurt", "fail", "breakup", "miss", "depressed"],
        response: {
          friend: "Aw, sending you a huge hug bestie! It's okay to feel sad, lonely, or cry it out. No need to act tough around me. Put on some rain sounds in the 'Healing Sounds' section and get cozy. I'm right here with you! 🌿",
          therapist: "Thank you for trusting me with these deep wounds and sadness. Sadness is a natural signal that your psyche needs care and healing from past wounds. Embrace this feeling rather than running from it. You can open the 'Healing Sounds' section, listen to the rain, and focus on your breath. I am here to hold a safe space for you. 🌿",
          coach: "Sadness or disappointment is feedback that one of your core values or needs is currently unmet. Accept this state, and take a 5-minute break in 'Healing Sounds' to re-center. Afterward, we will shift our focus to what you can control and the constructive actions you can take to change this. 🚀"
        },
        action: {
          friend: "Bestie, you should tune in to rain sounds or cozy meditation frequencies in 'Healing Sounds' now. Also, venting in the 'Journal' is a total life hack to release all that heavy energy. I'm with you! 🌿",
          therapist: "To process sadness in a healthy way, I recommend using the rain sound in the 'Healing Sounds' section as a mindfulness anchor. Additionally, try expressive writing in the 'Journal' to articulate and release past pain. This is very beneficial for healing. 🌿",
          coach: "To move past this stagnant state, I recommend listening to 'Healing Sounds' to clear your head. Next, write down 3 tiny actions you want to accomplish today to regain momentum. Are you ready to take action? 🚀"
        },
        followUp: {
          friend: "I'm still here listening, bestie. Feeling empty or sad is a major drag, but don't hesitate to share whatever is weighing you down. I've got your back! 🌿",
          therapist: "I am still listening. Could this sorrow be linked to a past memory, relationship, or loss? Please share when you feel ready to explore this deeper. 🌿",
          coach: "We cannot change what happened, but you can choose your response from now on. What is the smallest goal you want to achieve to improve your mood or situation today? 🚀"
        }
      },
      {
        id: "HAPPY",
        keywords: ["happy", "glad", "joy", "excite", "won", "achieve", "love", "like", "good", "great", "nice", "awesome", "perfect"],
        response: {
          friend: "Omg major win, bestie! I'm so hyped for you, this is absolute goals! Your energy is glowing, no cap. Run to the 'Journal' page and write down this happy moment right now! Slay! 🌟",
          therapist: "What a wonderful and meaningful moment. Experiencing joy and happiness fully is evidence that your efforts in self-care and healing are bearing fruit. Acknowledge and anchor this feeling by writing it in the 'Journal' to serve as a positive mental resource for the future. I am very happy for your growth. 🌟",
          coach: "Fantastic! This is a well-deserved win resulting from your actions. Celebrate this success! Positive emotions are excellent leverage to propel you forward. Document this milestone in the 'Journal' to validate your progress, and let's prepare for your next goals. Congratulations! 🚀🌟"
        },
        action: {
          friend: "So awesome! You should definitely log this on the 'Journal' page or share the good vibes. Tell me more, what made you feel so happy? I want all the details! 🌟",
          therapist: "To reinforce this positive state, I recommend documenting this experience in the 'Journal' as a practice of gratitude. Would you like to share what deep values this happiness connected you with? 🌟",
          coach: "This is a great opportunity to register your success! I recommend writing down this milestone in the 'Journal' immediately. After that, shall we discuss how to maintain this winning momentum for your next objectives? 🚀"
        },
        followUp: {
          friend: "This positive energy is an absolute vibe, bestie! Want to lock in this happy moment in your journal today? 🌟",
          therapist: "It is wonderful to see your mind filled with peace and happiness. Would you like to save this precious emotion in your journal to strengthen your emotional resilience? 🌟",
          coach: "You have momentum on your side. Let's leverage this energy to set your next SMART goal. Are you ready to map out your next move? 🚀"
        }
      }
    ],
    actionDefault: {
      friend: "Bestie! You can start by writing a short entry about your current feelings, taking 1 minute of deep breathing to settle your mind, or listening to a relaxing melody in the 'Healing Sounds' section. I'm always ready to support you. 💙",
      therapist: "You can start by writing a short entry about your current feelings, taking 1 minute of deep breathing to settle your mind, or listening to a relaxing melody in the 'Healing Sounds' section. I'm always ready to support you in therapy. 💙",
      coach: "You can start by writing a short entry about your current feelings, taking 1 minute of deep breathing to settle your mind, or listening to a relaxing melody in the 'Healing Sounds' section. I'm always ready to support you in coaching. 🚀💙"
    },
    actionKeywords: ["should i do", "what to do", "how to", "help", "advise", "guide", "recommend"]
  },
  zh: {
    thanks: {
      friend: "不用客气，好朋友！随时乐意陪伴你聊天。想分享别的事情吗？我一直在听！💅🔥",
      therapist: "感谢您的信任。分享和反思这些想法是理解过去痛苦的重要一步。您想深入探讨另一个具体方面或与此情绪相关的记忆吗？",
      coach: "太棒了，谢谢您的分享。我们已经明确了现状。现在，您想明确下一个目标或讨论进一步的行动以推动个人发展吗？"
    },
    welcome: {
      friend: "不用客气，好朋友！很高兴能在这里聆听并陪伴你。你想继续聊聊其他话题吗？我随时都在。💙",
      therapist: "非常客气。很高兴能在这里聆听并在疗愈中支持您。您想探索其他经历吗？我随时都在。",
      coach: "非常客气。很高兴能在这里指导和支持您。您想规划您的下一个目标吗？我随时都在。"
    },
    greeting: {
      friend: "嗨，好朋友！我是超可爱的 MindBot。今天过得怎么样？有什么新鲜事或心情有点低落吗？快跟我说说，我一直在！🤖💅",
      therapist: "您好。我是您的心理咨询师 MindBot。您今天感觉如何？过去是否有任何经历或想法影响了您目前的精神状态，想一起探讨吗？🧘💙",
      coach: "您好！我是您的个人成长教练 MindBot。让我们先专注于您的目标。您今天想取得什么成果，以及有哪些挑战是您想一起制定计划来克服的？🚀💙"
    },
    default: {
      friend: "谢谢你分享这些想法，好朋友！心情起伏是完全正常的！想再多写一点，告诉我发生什么事了吗？",
      therapist: "感谢您分享这些想法。目前的情绪往往反映了过去未解决的痛苦或经历。您愿意和我一起回顾，看看这种感觉源自您过去的什么经历吗？",
      coach: "感谢您分享目前的真实情况。认识到这一点是向前迈出的第一步。基于这种情况，您在未来几天想针对的特定 SMART 目标是什么，以及您今天可以采取的最小行动是什么？"
    },
    categories: [
      {
        id: "STRESS",
        keywords: ["压力", "紧张", "累", "疲劳", "deadline", "考试", "学习", "工作", "失眠", "崩溃", "焦虑"],
        response: {
          friend: "天哪，听起来压力太大了，我的朋友！Deadline 和考试让你喘不过气了吗？别硬撑，去“心灵平稳”板块玩一下 Pop-it 减压板吧，超解压的！照顾好自己！💙",
          therapist: "我听到了您承受的巨大压力和疲倦。这种超负荷状态往往会触发您过去不得不独自承受重担时的防御机制。请允许自己在“心灵平稳”板块的 Pop-it 游戏中休息 2 分钟，作为短暂的静心练习来抚平神经系统。您现在值得拥有安全与平静。💙",
          coach: "压力和疲劳是反馈指标，表明您当前的工作量超出了您的适应能量。让我们把这看作重置界限的机会。首先，在“心灵平稳”板块进行 2 分钟的 Pop-it 能量休息。之后，我们将确定任务优先级并制定结构化计划。🚀"
        },
        action: {
          friend: "听我的，现在就去“心灵平稳”板块，在 Pop-it 减压板上按几个气泡。ASMR 声音超级治愈。现在想试试吗？💙",
          therapist: "为了帮助调节您身体的压力反应，我建议您使用“心灵平稳”板块中的 Pop-it 游戏进行身体着陆练习。专注于触觉感受和 ASMR 声音有助于抚平神经系统。您想试试吗？💙",
          coach: "为了恢复工作效率和专注力，我建议您去“心灵平稳”板块玩 Pop-it，进行结构化的休息。这是大脑充电的非常高效的方式。我们现在就开始吧？🚀"
        },
        followUp: {
          friend: "我知道你背负着巨大的压力，好朋友。跟我聊聊，为什么这么焦虑？学校、考试还是工作？我一直在听！💙",
          therapist: "我理解您承受着沉重的负担。让我们一起回顾：这种被压垮的感觉是否让您想起过去任何感到孤立无援的经历或事件？欢迎随时分享。💙",
          coach: "为了克服这种压力，您今天想专注于实现的具体成果是什么？让我们将其分解并明确下一步要采取的最关键的单一行动。🚀"
        }
      },
      {
        id: "SAD",
        keywords: ["难过", "哭", "不好", "无聊", "孤单", "受伤", "失败", "分手", "想念", "沮丧", "抑郁", "伤心"],
        response: {
          friend: "乖，给你一个大大的拥抱！难过、孤单或哭出来都完全没关系。在我面前不用硬撑。去“心灵平稳”里的“睡眠/疗愈音乐”听听雨声，让自己舒服一点。我一直陪着你！🌿",
          therapist: "感谢您信任我，向我吐露这些深刻的创伤和悲伤。悲伤是一个自然信号，表明您的心灵需要关怀以及从过去的创伤中痊愈。接纳这种感受，而不是逃避它。您可以打开“睡眠/疗愈音乐”倾听雨声，并专注于呼吸。我在这里为您提供一个安全的空间。🌿",
          coach: "悲伤或失望是您核心需求或价值目前未得到满足的反馈。接纳这个状态，在“睡眠/疗愈音乐”中进行 5 分钟的休息以重新调整。之后，我们将把注意力转向您可以控制的事情，以及您可以采取建设性行动来改变它。🚀"
        },
        action: {
          friend: "朋友，你现在应该去“睡眠/疗愈音乐”听听雨声或舒适的冥想频率。另外，在“情绪日记”中倾诉也是释放沉重能量的绝佳方法。我陪着你！🌿",
          therapist: "为了以健康的方式处理悲伤，我建议您在“睡眠/疗愈音乐”中听雨声作为正念锚点。此外，尝试在“情绪日记”中进行表达性写作，以清晰表达并释放过去的痛苦。这非常有益于愈合。🌿",
          coach: "为了走出这片低迷，我建议听听“睡眠/疗愈音乐”来理清头绪。接下来，写下您今天想完成的 3 个微小行动以重获动力。您准备好行动了吗？🚀"
        },
        followUp: {
          friend: "我一直在听，好朋友。感到空虚或难过确实很难受，但无论什么事让你烦恼，都别犹豫跟我说说。我一直支持你！🌿",
          therapist: "我一直在倾听。这种悲伤是否与过去的记忆、人际关系或失去有关？当您准备好进行更深一步探讨时，欢迎随时分享。🌿",
          coach: "我们无法改变已经发生的事情，但从现在起您可以选择自己的应对方式。您今天想达到什么微小目标以改善您的心情或处境？🚀"
        }
      },
      {
        id: "HAPPY",
        keywords: ["开心", "高兴", "喜悦", "兴奋", "赢", "实现", "爱", "喜欢", "好", "棒", "完美"],
        response: {
          friend: "哇，太棒了，好朋友！我太为你高兴了，这简直是人生目标！你的能量在闪闪发光。快去“情绪日记”页面把这个快乐时刻记录下来！太棒了！🌟",
          therapist: "这真是一个美好且有意义的时刻。充分体验快乐和幸福，证明您在自我关怀和疗愈上的努力正在开花结果。通过将其记录在“情绪日记”中来确认并锚定这种感受，以作为未来的积极精神资源。我为您的成长感到非常高兴。🌟",
          coach: "太棒了！这是您付诸行动所获得的应有收获。庆祝这一成功吧！积极情绪是推动您前进的绝佳杠杆。在“情绪日记”中记录这一里程碑以验证您的进步，让我们为您的下一个目标做好准备。恭喜！🚀🌟"
        },
        action: {
          friend: "太给力了！你一定要记录在“情绪日记”里，或者分享这份好心情。跟我多说说，什么事让你这么开心？我想听所有细节！🌟",
          therapist: "为了强化这一积极状态，我建议您将此经历记录在“情绪日记”中，作为一次感恩练习。您愿意分享这带给您的快乐与什么深层价值相关联吗？🌟",
          coach: "这是记录成功的大好机会！我建议您立即在“情绪日记”中写下这个里程碑。之后，我们要讨论如何保持这股势头来实现下一个目标吗？🚀"
        },
        followUp: {
          friend: "这股正能量太棒了，好朋友！今天想在情绪日记里锁住这个快乐时刻吗？🌟",
          therapist: "看到您的心灵充满平静与喜悦真是太好了。您想把这份珍贵的情感保存在日记中以增强您的情感韧性吗？🌟",
          coach: "势头在您这边。让我们利用这种能量来设定您的下一个 SMART 目标。您准备好规划您的下一步了吗？🚀"
        }
      }
    ],
    actionDefault: {
      friend: "朋友！你可以先写一篇关于目前感受的简短日记，进行 1 分钟深呼吸以平静思绪，或者在“睡眠/疗愈音乐”板块听一段放松的旋律。我随时准备支持你。💙",
      therapist: "您可以先写一篇关于目前感受ರು简短日记，进行 1 分钟深呼吸以平静思绪，或者在“睡眠/疗愈音乐”板块听一段放松的旋律。我随时准备在疗愈中支持您。💙",
      coach: "您可以先写一篇关于目前感受的简短日记，进行 1 分钟深呼吸以平静思绪，或者在“睡眠/疗愈音乐”板块听一段放松的旋律。我随时准备在指导中支持您。🚀💙"
    },
    actionKeywords: ["做什么", "怎么做", "如何", "帮助", "建议", "引导", "推荐"]
  },
  ja: {
    thanks: {
      friend: "どういたしまして、親友！いつでも話を聞くよ。他のこともシェアしたい？何でも聞くからね！💅🔥",
      therapist: "信頼していただきありがとうございます。これらの考えを共有し、振り返ることは、過去の痛みを理解するための重要なステップです。この感情に関連する別の具体的な側面や記憶を探求してみますか？",
      coach: "素晴らしいですね、共有していただきありがとうございます。現状を整理できました。次に、目標を明確にするか、前進するためのさらなる行動について話し合いますか？"
    },
    welcome: {
      friend: "どういたしまして、親友！ここにいて話を聞いたり寄り添ったりできて嬉しいよ。他のトピックについて話し続けたい？いつでもここにいるよ。💙",
      therapist: "どういたしまして。ここであなたのお話を聞き、セラピーでサポートできることを嬉しく思います。他の経験を探求してみたいですか？いつでもここにいます。",
      coach: "どういたしまして。ここでコーチングをしてあなたをサポートできることを嬉しく思います。次の目標を計画したいですか？いつでもここにいます。"
    },
    greeting: {
      friend: "ハロー、親友！超かわいいMindBotだよ。今日はどうだった？何か面白い話や、ちょっと気分が落ち込んでたりする？話してみて、いつでも聞くよ！🤖💅",
      therapist: "こんにちは。あなたの心理療法士のMindBotです。今日の気分はいかがですか？現在の精神状態に影響を与えている過去の経験や考えはありますか？一緒に探求してみましょう。🧘💙",
      coach: "こんにちは！ライフコーチのMindBotです。まずは目標に集中することから始めましょう。今日達成したい成果や、一緒に計画を立てて克服したい課題は何ですか？🚀💙"
    },
    default: {
      friend: "考えを共有してくれてありがとう、親友！気分が上がったり下がったりするのは完全に普通のことだよ！何があったのかもう少し詳しく教えてくれる？",
      therapist: "これらの考えを共有していただきありがとうございます。現在の感情は、過去の未解決の痛みや経験を反映していることがよくあります。過去のどこからこの感情が来ているのか、一緒に振り返ってみませんか？",
      coach: "現在の状況を共有していただきありがとうございます。それを認識することが前進への第一歩です。この状況に基づいて、今後数日間の具体的なSMART目標と、今日できる最小限のアクションは何ですか？"
    },
    categories: [
      {
        id: "STRESS",
        keywords: ["ストレス", "プレッシャー", "疲れた", "締め切り", "試験", "勉強", "仕事", "不眠", "限界", "不安"],
        response: {
          friend: "うわ、それ本当に大変そうだね、親友！締め切りや試験でいっぱいいっぱい？無理しないで、「心のバランス」セクションでPop-it（ポップイット）ゲームをしてみて。すごくすっきりするよ！自分を大切にね！💙",
          therapist: "あなたが感じている多大なプレッシャーと疲労を受け止めています。この過負荷状態は、一人で重荷を背負わなければならなかった過去の防衛メカニズムを引き起こしがちです。「心のバランス」セクションのPop-itゲームで2分間休息し、神経系を落ち着かせるための短いマインドフルネス瞑想を行ってみてください。あなたは今、安全で平和である価値があります。💙",
          coach: "ストレスと疲労は、現在の作業量が適応エネルギーを超えていることを示すフィードバックです。これを境界線を再設定する機会として捉えましょう。まず、「心のバランス」セクションで2分間のエネルギーブレイクを取り、Pop-itでリフレッシュしてください。その後、タスクを優先順位付けし、計画を立てましょう。🚀"
        },
        action: {
          friend: "本気で「心のバランス」セクションに行って、Pop-itボードの泡をプチプチすることをおすすめするよ。ASMRの音が本当に癒やされるよ。今試してみたい？💙",
          therapist: "体のストレス反応を調節するために、「心のバランス」セクションにあるPop-itゲームを使用して、感覚を現在につなぎとめるグラウンディング運動を行うことをお勧めします。触覚とASMR音に集中することで、神経系が落ち着きます。試してみたいですか？💙",
          coach: "生産性と集中力を回復するために、「心のバランス」セクションでPop-itで遊ぶ構造化された休憩を取ることをお勧めします。これは脳を充電するための非常に効果的な手法です。今すぐ始めましょうか？🚀"
        },
        followUp: {
          friend: "山ほどのストレスを抱えているのは分かってるよ、親友。何が原因でそんなにプレッシャーを感じているの？学校、試験、それとも仕事？いつでも聞くよ！💙",
          therapist: "あなたが重い重荷を背负っているのを理解しています。一緒に振り返ってみましょう：この圧倒されるような感覚は、サポートが得られなかった過去の出来事や経験を思い出させますか？いつでも共有してください。💙",
          coach: "このストレスを克服するために、今日集中して達成したい具体的な成果は何ですか？タスクを分解し、次に取るべき最も重要な1つのアクションステップを明確にしましょう。🚀"
        }
      },
      {
        id: "SAD",
        keywords: ["悲しい", "泣く", "つらい", "退屈", "寂しい", "傷つく", "失敗", "失恋", "寂しさ", "鬱", "悲しみ"],
        response: {
          friend: "よしよし、ハグを送るよ親友！悲しかったり、寂しかったり、泣いちゃっても全然大丈夫。私の前で強がる必要はないよ。「睡眠/ヒーリング音楽」セクションで雨の音をかけてリラックスしてね。私はいつでも君のそばにいるよ！🌿",
          therapist: "これらの深い傷と悲しみを私に信頼して打ち明けていただき、ありがとうございます。悲しみは、あなたの心がケアを求め、過去の傷から癒やされる必要があることを示す自然なサインです。その感情を避けるのではなく、抱きしめてください。「睡眠/ヒーリング音楽」を開き、雨の音を聞きながら呼吸に集中してください。私はここにあなたのための安全な空間を用意しています。🌿",
          coach: "悲しみや失望は、あなたのコアバリューやニーズが現在満たされていないというフィードバックです。この状態を受け入れ、「睡眠/ヒーリング音楽」で5分間の休息を取り、心を整えてください。その後、コントロールできることと、それを変えるための建設的な行動に焦点を移します。🚀"
        },
        action: {
          friend: "親友、今すぐ「睡眠/ヒーリング音楽」で雨の音や心地よい瞑想周波数を聞くといいよ。また、「情緒日記」で思いを吐き出すのも、重いエネルギーを解放するライフハックだよ。君と一緒だよ！🌿",
          therapist: "健康的な方法で悲しみを処理するために、「睡眠/ヒーリング音楽」セクションにある雨の音をマインドフルネスのアンカーとして使用することをお勧めします。また、「情緒日記」に表現豊かなライティングを行い、過去の痛みを言葉にして解放してみてください。これは治療に非常に有益です。🌿",
          coach: "この停滞した状態から抜け出すために、「睡眠/ヒーリング音楽」を聞いて頭を整理することをお勧めします。次に、モチベーションを取り戻すために今日達成したい3つの小さな行動を書き留めてください。行動する準備はできていますか？🚀"
        },
        followUp: {
          friend: "いつでも話を聞いているよ、親友。空虚感や悲しさはつらいものだけど、君を悩ませていることは何でもためらわずに話してね。いつでも味方だよ！🌿",
          therapist: "私はまだお話を聞いています。この悲しみは、過去の記憶、人間関係、あるいは喪失に関連している可能性がありますか？探求する準備ができたら、いつでも話してください。🌿",
          coach: "起こってしまった過去を変えることはできませんが、今からどのように反応するかを選択することはできます。今日、気分や状況を改善するために達成したい最も小さな目標は何ですか？🚀"
        }
      },
      {
        id: "HAPPY",
        keywords: ["嬉しい", "幸せ", "楽しい", "合格", "勝った", "達成", "愛", "好き", "最高", "素晴らしい"],
        response: {
          friend: "うわー、やったね親友！私も本当に嬉しいよ、最高だね！君のエネルギーは輝いているよ。今すぐ「情緒日記」ページにこの幸せな瞬間を書き留めよう！最高だよ！🌟",
          therapist: "素晴らしくて有意義な瞬間ですね。喜びや幸せを十分に体験することは、自己ケアと癒やしの努力が実を結んでいる証拠です。この感情を「情緒日記」に記録して確認し、将来のポジティブな精神的リソースとしてアンカーしてください。あなたの成長をとても嬉しく思います。🌟",
          coach: "素晴らしい！これはあなたの行動の結果として得られた、十分に値する勝利です。この成功を祝いましょう！ポジティブな感情は、あなたを前進させる素晴らしいレバレッジになります。「情緒日記」にこのマイルストーンを記録して進捗を検証し、次の目標に備えましょう。おめでとうございます！🚀🌟"
        },
        action: {
          friend: "すごいね！絶対に「情緒日記」ページに記録するか、良い気分をシェアした方がいいよ。もっと教えて、何がそんなに嬉しかったの？詳細を全部聞きたいな！🌟",
          therapist: "このポジティブな状態を強化するために、この経験を感謝の実践として「情緒日記」に記録することをお勧めします。この幸せがどのような深い価値観と結びついているか、詳しく共有していただけますか？🌟",
          coach: "成功を記録する素晴らしい機会です！すぐに「情緒日記」にこのマイルストーンを書き留めることをお勧めします。その後、次の目標に向けてこの勝利の勢いをどのように維持するか話し合いましょうか？🚀"
        },
        followUp: {
          friend: "このポジティブなエネルギーは最高だね、親友！今日、情緒日記にこの幸せな瞬間をロックしたい？🌟",
          therapist: "心に平安と幸福が満ちているのを見るのは素晴らしいことです。感情の回復力を高めるために、この貴重な感情を日記に保存しますか？🌟",
          coach: "勢いはあなたの側にあります。このエネルギーを活用して、次のSMART目標を設定しましょう。次の動きを計画する準備はできましたか？🚀"
        }
      }
    ],
    actionDefault: {
      friend: "親友！まずは現在の気持ちについて短い日記を書くか、1分間の深呼吸をして心を落ち着かせるか、「睡眠/ヒーリング音楽」セクションでリラックスできるメロディを聞くことから始められるよ。いつでも君をサポートする準備ができているよ。💙",
      therapist: "現在の感情について短い日記を書くか、1分間の深呼吸をして心を落ち着かせるか、「睡眠/ヒーリング音楽」セクションでリラックスできるメロディを聞くことから始められます。いつでも治療であなたをサポートする準備ができています。💙",
      coach: "現在の状況について短い日記を書くか、1分間の深呼吸をして心を落ち着かせるか、「睡眠/ヒーリング音楽」セクションでリラックスできるメロディを聞くことから始められます。いつでもコーチングであなたをサポートする準備ができています。🚀💙"
    },
    actionKeywords: ["どうすれば", "何をする", "方法", "助け", "アドバイス", "ガイド", "おすすめ"]
  },
  ko: {
    thanks: {
      friend: "별말씀을요, 친구! 언제든 같이 이야기 나누고 쉬어가요. 더 자랑하고 싶거나 나누고 싶은 이야기가 있나요? 경청하고 있어요! 💅🔥",
      therapist: "당신의 신뢰에 감사드립니다. 이러한 생각을 나누고 되돌아보는 것은 과거의 아픔을 이해하는 중요한 발걸음입니다. 이 감정과 관련된 다른 구체적인 측면이나 기억을 함께 탐색해 보시겠어요?",
      coach: "좋습니다, 공유해 주셔서 감사합니다. 현재의 상황을 정리해 보았습니다. 이제 다음 목표를 명확히 하거나 개인적인 성장을 위한 추가 행동에 대해 논의해 볼까요?"
    },
    welcome: {
      friend: "언제든 환영해요, 친구! 여기에서 이야기를 듣고 동행할 수 있어서 정말 기쁩니다. 다른 주제에 대해 이야기를 계속해 볼까요? 전 언제나 여기 있어요. 💙",
      therapist: "천만에요. 여기에서 이야기를 듣고 치료를 통해 당신을 지원할 수 있어 기쁩니다. 다른 경험을 함께 탐색해 보시겠어요? 전 언제나 여기 있어요.",
      coach: "천만에요. 여기에서 코칭을 통해 당신을 지원할 수 있어 기쁩니다. 다음 목표를 계획해 보시겠어요? 전 언제나 여기 있어요."
    },
    greeting: {
      friend: "안녕 친구! 너무 귀여운 MindBot이 왔어요. 오늘 하루는 어땠나요? 재미있는 일이 있었거나 기분이 좀 가라앉았나요? 편하게 털어놓아 보세요, 다 들어줄게요! 🤖💅",
      therapist: "안녕하세요. 당신의 심리 치료사 MindBot입니다. 오늘 기분은 어떠신가요? 현재 정신 상태에 영향을 미치고 있는 과거의 경험이나 생각이 있나요? 함께 나누어 봅시다. 🧘💙",
      coach: "안녕하세요! 당신의 라이프 코치 MindBot입니다. 목표에 집중하는 것부터 시작해 봅시다. 오늘 달성하고자 하는 결과는 무엇이며, 함께 계획을 세워 극복하고자 하는 과제는 무엇인가요? 🚀💙"
    },
    default: {
      friend: "생각을 나누어 줘서 고마워요, 친구! 기분이 오르락내리락하는 건 지극히 정상이에요! 무슨 일이 있었는지 조금 더 이야기해 줄래요?",
      therapist: "이러한 생각을 공유해 주셔서 감사합니다. 현재의 감정은 종종 과거의 미해결된 아픔이나 경험을 반영합니다. 과거 어디에서 이 감정이 유래했는지 함께 짚어볼까요?",
      coach: "현재의 상황을 정직하게 공유해 주셔서 감사합니다. 인지하는 것이 앞으로 나아가는 첫걸음입니다. 이 상황을 바탕으로 향후 며칠 동안 목표로 삼을 구체적인 SMART 목표는 무엇이며, 오늘 할 수 있는 가장 작은 실천은 무엇인가요?"
    },
    categories: [
      {
        id: "STRESS",
        keywords: ["스트레스", "압박", "피곤", "마감", "시험", "공부", "일", "불면", "한계", "불안"],
        response: {
          friend: "와, 정말 스트레스가 심하겠어요 친구! 마감이랑 시험 때문에 머리가 터질 것 같나요? 너무 무리하지 말고, '마음 안정' 코너에서 Pop-it(팝잇) 푸시팝 보드 게임을 해보세요. 스트레스가 싹 풀릴 거예요! 몸조리 잘해요! 💙",
          therapist: "당신이 겪고 있는 엄청난 압박감과 피로감을 느낍니다. 이러한 과부하 상태는 홀로 무거운 짐을 짊어야 했던 과거의 방어 기제를 자극하곤 합니다. 신경계를 안정시키기 위한 짧은 명상 연습으로 '마음 안정' 코너의 Pop-it 게임을 하며 2분간 휴식을 취해 보세요. 당신은 지금 안전하고 평화로울 자격이 있습니다. 💙",
          coach: "스트레스와 피로는 현재의 업무량이 당신의 적응 에너지를 초과했다는 피드백입니다. 이것을 경계를 재설정하는 기회로 삼읍시다. 우선 '마음 안정' 코너에서 Pop-it으로 2분간 에너지를 재충전하세요. 그 후 업무의 우선순위를 정하고 계획을 세워봅시다. 🚀"
        },
        action: {
          friend: "친구, 지금 당장 '마음 안정' 코너로 가서 Pop-it 보드의 버블을 터뜨려 보세요. ASMR 소리가 정말 힐링돼요. 지금 해볼래요? 💙",
          therapist: "신체의 스트레스 반응을 조절하기 위해 '마음 안정' 코너에 있는 Pop-it 게임을 통해 몸의 감각에 집중하는 그라운딩 운동을 권장합니다. 촉각과 ASMR 소리에 집중하면 신경계가 안정됩니다. 해보시겠어요? 💙",
          coach: "생산성과 집중력을 회복하기 위해 '마음 안정' 코너에서 Pop-it을 하며 구조화된 휴식을 취할 것을 권장합니다. 이것은 두뇌를 재충전하는 매우 효과적인 기법입니다. 지금 시작해 볼까요? 🚀"
        },
        followUp: {
          friend: "스트레스가 산더미처럼 쌓여 있는 걸 보니 제 마음도 아파요 친구. 구체적으로 무엇 때문에 그렇게 힘든가요? 학교, 시험, 아니면 회사 일? 다 들어줄게요! 💙",
          therapist: "무거운 짐을 지고 계신 것을 잘 알고 있습니다. 함께 돌아봅시다. 이 압도당하는 느낌이 과거에 지지를 받지 못하고 애써야 했던 사건이나 기억을 상기시키나요? 편안히 들려주세요. 💙",
          coach: "이 스트레스를 극복하기 위해 오늘 집중하고자 하는 구체적인 결과는 무엇인가요? 태스크를 세분화하고 다음에 해야 할 가장 중요한 한 가지 실행 단계를 명확히 해봅시다. 🚀"
        }
      },
      {
        id: "SAD",
        keywords: ["슬프다", "슬픔", "울다", "눈물", "외롭다", "아프다", "실패", "이별", "그리움", "우울"],
        response: {
          friend: "어휴, 꼬옥 안아줄게요 친구! 슬프고 외롭거나 눈물이 나도 다 괜찮아요. 내 앞에서 억지로 강한 척할 필요 없어요. '수면/힐링 음악' 코너에서 빗소리를 켜고 편안히 쉬어봐요. 언제나 곁에 있어 줄게요! 🌿",
          therapist: "이러한 깊은 상처와 슬픔을 신뢰하고 털어놓아 주셔서 감사합니다. 슬픔은 마음이 보살핌을 원하고 과거의 상처로부터 치유되어야 함을 알리는 자연스러운 신호입니다. 감정을 피하기보다 감싸 안아주세요. '수면/힐링 음악'을 켜고 빗소리를 들으며 호흡에 집중하세요. 여기에 당신을 위한 안전한 공간을 마련해 두었습니다. 🌿",
          coach: "슬픔이나 실망은 당신의 핵심 가치나 욕구가 현재 충족되지 못했다는 피드백입니다. 이 상태를 받아들이고 '수면/힐링 음악'에서 5분간 휴식을 취하며 마음을 비우세요. 그 후 통제 가능한 일과 이를 바꾸기 위한 건설적인 행동에 집중해 봅시다. 🚀"
        },
        action: {
          friend: "친구, 지금 바로 '수면/힐링 음악'에서 빗소리나 편안한 명상 주파수를 들어보세요. 그리고 '감정 일기'에 털어놓는 것도 무거운 에너지를 해소하는 좋은 방법이에요. 함께할게요! 🌿",
          therapist: "건강한 방법으로 슬픔을 해소하기 위해 '수면/힐링 음악' 코너의 빗소리를 정념의 닻으로 활용해 보시길 권장합니다. 아울러 '감정 일기'에 자유롭게 적으며 과거의 상처를 구체적으로 표현하고 비워내 보세요. 치료에 큰 도움이 됩니다. 🌿",
          coach: "정체된 상태에서 벗어나기 위해 우선 '수면/힐링 음악'을 들으며 머리를 식히는 것을 권장합니다. 다음으로 동력을 되찾기 위해 오늘 실천하고 싶은 3가지 작은 행동을 적어보세요. 준비되셨나요? 🚀"
        },
        followUp: {
          friend: "언제나 들을 준비가 되어 있어요 친구. 허전하고 슬픈 마음은 정말 힘들겠지만, 마음을 짓누르는 것이 있다면 무엇이든 편하게 이야기해 주세요. 언제나 당신 편이에요! 🌿",
          therapist: "계속해서 듣고 있습니다. 이 슬픔이 과거의 기억, 관계, 혹은 상실감과 관련이 있을까요? 탐색할 준비가 되었을 때 언제든 편안히 들려주세요. 🌿",
          coach: "이미 지나간 과거를 바꿀 수는 없지만, 지금부터 어떻게 대응할지는 스스로 선택할 수 있습니다. 오늘 당신의 기분이나 상황을 개선하기 위해 실행할 수 있는 가장 작은 목표는 무엇인가요? 🚀"
        }
      },
      {
        id: "HAPPY",
        keywords: ["기쁘다", "행복", "기쁨", "신난다", "우승", "달성", "사랑", "좋다", "최고", "완벽"],
        response: {
          friend: "우와 진짜 대박이에요 친구! 기쁜 소식을 들으니 저도 너무 신나요! 긍정 에너지가 뿜뿜 뿜어져 나오네요. 당장 '감정 일기' 페이지에 이 행복한 순간을 기록해 두세요! 최고예요! 🌟",
          therapist: "참 아름답고 뜻깊은 순간이네요. 기쁨과 행복을 충분히 누리는 것은 당신이 자기 관리와 치유를 위해 노력한 결실입니다. 이 감정을 '감정 일기'에 적어 미래의 긍정적인 정신적 자원으로 삼아보세요. 당신의 성장을 진심으로 기뻐합니다. 🌟",
          coach: "멋집니다! 이것은 당신의 실천을 통해 얻은 값진 성과입니다. 이 성공을 축하하세요! 긍정적인 감정은 앞으로 나아가게 하는 아주 좋은 지렛대입니다. '감정 일기'에 이 이정표를 기록해 성과를 입증하고 다음 목표를 준비합시다. 축하해요! 🚀🌟"
        },
        action: {
          friend: "정말 최고예요! 꼭 '감정 일기' 페이지에 남기거나 이 기쁜 에너지를 나누어 보세요. 무엇 때문에 그렇게 기쁜가요? 자세히 들려주세요! 🌟",
          therapist: "이 긍정적인 상태를 강화하기 위해 이 경험을 감사의 실천으로서 '감정 일기'에 남길 것을 권장합니다. 이 기쁨이 당신의 어떤 깊은 가치와 연결되어 있는지 자세히 들려주실 수 있나요? 🌟",
          coach: "성공을 기록할 훌륭한 기회입니다! 지금 바로 '감정 일기'에 이 실천 이정표를 기록해 보세요. 그 후 다음 목표를 향해 이 상승세를 이어갈 방법에 대해 이야기해 볼까요? 🚀"
        },
        followUp: {
          friend: "긍정적인 에너지가 가득 차 있네요 친구! 오늘 일기에 이 행복한 순간을 콕 저장하고 싶나요? 🌟",
          therapist: "마음에 평화와 행복이 깃든 모습을 보니 참 좋습니다. 정서적 회복탄력성을 키우기 위해 이 소중한 감정을 일기에 보관해 볼까요? 🌟",
          coach: "상승세가 당신 편에 있습니다. 이 에너지를 활용해 다음 SMART 목표를 세워봅시다. 다음 단계를 계획할 준비가 되었나요? 🚀"
        }
      }
    ],
    actionDefault: {
      friend: "친구! 우선 현재 마음에 대해 짧은 일기를 써보거나, 1분간 깊이 호흡하며 마음을 가다듬거나, '수면/힐링 음악' 코너에서 릴랙스되는 멜로디를 들어보는 것부터 시작할 수 있어요. 언제든 도울 준비가 되어 있어요. 💙",
      therapist: "현재의 감정에 대해 짧은 일기를 써보거나, 1분간 깊이 호흡하여 마음을 진정시키거나, '수면/힐링 음악' 코너에서 편안한 멜로디를 들어보는 것부터 시작할 수 있습니다. 언제든 치료로서 당신을 도울 준비가 되어 있습니다. 💙",
      coach: "현재 상황에 대해 짧은 일기를 써보거나, 1분간 깊이 호흡하며 마음을 차분히 하거나, '수면/힐링 음악' 코너에서 편안한 멜로디를 들어보는 것부터 시작할 수 있습니다. 언제든 코칭으로서 당신을 도울 준비가 되어 있습니다. 🚀💙"
    },
    actionKeywords: ["어떻게", "무엇을", "방법", "도움", "조언", "가이드", "추천"]
  }
};

/**
 * Generates local mock JSON responses matching the expected schema for various AI functions.
 * @param {Array<{role: 'user' | 'model', content: string}> | string} messagesOrText
 * @param {string} [systemInstruction=""]
 * @returns {string}
 */
export function generateLocalMockJSONResponse(messagesOrText, systemInstruction = "") {
  let messages = [];
  if (typeof messagesOrText === "string") {
    messages = [{ role: "user", content: messagesOrText }];
  } else if (Array.isArray(messagesOrText)) {
    messages = messagesOrText;
  }
  const lastUserMsg = messages[messages.length - 1]?.content || "";
  const combined = (systemInstruction + "\n" + lastUserMsg).toLowerCase();

  const lang = (typeof localStorage !== "undefined" ? localStorage.getItem("sj_lang") : "vi") || "vi";
  const _isVietnamese = lang === "vi" || combined.includes("vietnamese") || combined.includes("tiếng việt") || combined.includes("vi-vn");


  // 1. CBT distortions scanning (useJournal.js)
  if (combined.includes("distortions") || combined.includes("explanation_vi")) {
    return JSON.stringify({
      distortions: [
        {
          type: "Catastrophizing",
          thought: "Tôi sợ mình sẽ làm hỏng mọi việc mất.",
          explanation_vi: "Phóng đại hậu quả tiêu cực của một sự kiện trước khi nó xảy ra.",
          explanation_en: "Exaggerating the negative consequences of an event before it happens.",
          reframed_vi: "Mọi việc chưa chắc đã tệ như vậy, tôi có thể chuẩn bị kỹ lưỡng để giải quyết.",
          reframed_en: "Things may not go as bad as I fear; I can prepare thoroughly to handle it."
        }
      ]
    });
  }

  // 2. CBT Reframing (CBTPage.jsx)
  if (combined.includes("suggested_distortions") || combined.includes("evidence_for")) {
    return JSON.stringify({
      suggested_distortions: ["overgeneralization", "catastrophizing"],
      evidence_for: "Tôi luôn cảm thấy áp lực và sợ hãi khi đối mặt với thử thách mới.",
      evidence_against: "Nhưng thực tế tôi đã từng vượt qua nhiều kỳ thi và dự án khó khăn trước đây.",
      balanced_thought: "Đây chỉ là cảm giác lo âu tạm thời, tôi hoàn toàn có khả năng hoàn thành tốt công việc này."
    });
  }

  // 3. Personality Growth Map (PersonalityGrowthMap.jsx)
  if (combined.includes("emotional_awareness") || combined.includes("consistency") || combined.includes("growth_tip")) {
    const activeData = {
      vi: {
        level: "Người Khám Phá Tâm Hồn (Inner Explorer)",
        insight: "Bạn có khả năng tự nhận thức cảm xúc rất tốt và luôn tìm cách thấu hiểu nội tâm của mình.",
        growth_tip: "Hãy duy trì việc ghi chép nhật ký mỗi ngày để tạo thói quen theo dõi cảm xúc bền vững.",
        superpower: "Quan sát và thấu hiểu cảm xúc sâu sắc",
        next_milestone: "Duy trì chuỗi ghi chép 7 ngày tiếp theo để thăng cấp."
      },
      en: {
        level: "Inner Explorer",
        insight: "You have excellent emotional self-awareness and always seek to understand your inner self.",
        growth_tip: "Keep a daily journal to build a sustainable habit of emotional tracking.",
        superpower: "Observe and understand deep emotions",
        next_milestone: "Maintain a 7-day writing streak to level up."
      },
      ja: {
        level: "インナーエクスプローラー (Inner Explorer)",
        insight: "あなたは非常に優れた感情的な自己認識を持っており、常に内面を理解しようとしています。",
        growth_tip: "感情を追跡する持続可能な習慣を作るために、毎日のジャーナル記録を続けてください。",
        superpower: "深い感情を観察し理解する力",
        next_milestone: "レベルアップするために、あと7日間のジャーナル記録を維持しましょう。"
      },
      ko: {
        level: "내면의 탐험가 (Inner Explorer)",
        insight: "당신은 뛰어난 감정적 자각 능력을 지니고 있으며, 언제나 내면의 목소리에 귀를 기울입니다.",
        growth_tip: "지속적인 감정 기록 습관을 만들기 위해 매일 일기 쓰는 습관을 유지해 보세요.",
        superpower: "깊은 감정을 관찰하고 이해하는 능력",
        next_milestone: "다음 레벨로 업그레이드하려면 향후 7일간 기록을 계속 이어나가세요."
      },
      zh: {
        level: "心灵探索者 (Inner Explorer)",
        insight: "你具有极佳的情绪自我觉察能力，并总是寻求理解自己真实的内心世界。",
        growth_tip: "建议坚持每日记录日记，以养成持久的情绪追踪习惯。",
        superpower: "细致观察并深刻理解情绪变化",
        next_milestone: "继续保持连续 7 天记录以实现等级提升。"
      }
    };
    const active = activeData[lang] || activeData.en;
    return JSON.stringify({
      scores: {
        emotional_awareness: 78,
        mood_control: 65,
        emotional_iq: 72,
        consistency: 50,
        self_awareness: 82,
        social_connection: 60
      },
      overall: 68,
      level: active.level,
      insight: active.insight,
      growth_tip: active.growth_tip,
      superpower: active.superpower,
      next_milestone: active.next_milestone
    });
  }

  // 4. Mood Prediction (MoodPredictPage.jsx)
  if (combined.includes("predicted_score") || combined.includes("confidence") || combined.includes("predicted_label")) {
    const activeData = {
      vi: {
        predicted_label: "Tích cực",
        trend: "Có xu hướng đi lên nhờ ngủ đủ giấc và duy trì thói quen lành mạnh",
        factors: ["Giấc ngủ chất lượng", "Uống đủ nước", "Luyện tập thể thao"],
        tip: "Hãy tiếp tục duy trì thói quen ngủ sớm và uống đủ nước ngày hôm nay nhé!",
        insight: "Biểu đồ cảm xúc của bạn đang cải thiện rất tích cực trong những ngày gần đây."
      },
      en: {
        predicted_label: "Positive",
        trend: "Trending upwards thanks to adequate sleep and maintaining healthy habits",
        factors: ["Quality Sleep", "Adequate Hydration", "Regular Exercise"],
        tip: "Keep maintaining your habit of early sleep and drinking enough water today!",
        insight: "Your emotional chart has been improving very positively in recent days."
      },
      ja: {
        predicted_label: "ポジティブ",
        trend: "十分な睡眠と健康的な習慣の維持により、上昇傾向にあります",
        factors: ["質の高い睡眠", "十分な水分補給", "定期的な運動"],
        tip: "今日も早寝と十分な水分補給の習慣を維持しましょう！",
        insight: "最近、感情の推移が非常にポジティブに改善しています。"
      },
      ko: {
        predicted_label: "긍정적",
        trend: "충분한 수면과 건강한 습관 유지 덕분에 상승 곡선을 그리고 있습니다",
        factors: ["양질의 수면", "충분한 수분 섭취", "규칙적인 운동"],
        tip: "오늘도 일찍 자고 충분한 물을 마시는 습관을 계속 유지하세요!",
        insight: "최근 감정 상태가 매우 긍정적으로 개선되고 있습니다."
      },
      zh: {
        predicted_label: "积极",
        trend: "得益于充足的睡眠和健康的作息，情绪呈现上升趋势",
        factors: ["优质睡眠", "充足饮水", "规律运动"],
        tip: "今天也要继续保持早睡和多喝水的健康好习惯哦！",
        insight: "近期您的情绪曲线正在呈现出非常积极的改善态势。"
      }
    };
    const active = activeData[lang] || activeData.en;
    return JSON.stringify({
      predicted_score: 6,
      predicted_emoji: "😊",
      predicted_label: active.predicted_label,
      confidence: 85,
      trend: active.trend,
      factors: active.factors,
      tip: active.tip,
      warning: null,
      insight: active.insight
    });
  }

  // 5. Mental Energy Map / Aura (SpecialPage.jsx)
  if (combined.includes("auracolor") || combined.includes("element") || combined.includes("archetype")) {
    const activeData = {
      vi: {
        aura: "Năng Lượng Tím Trực Giác",
        message: "Tâm hồn bạn đang tỏa ra tần số trực giác nhạy bén và khát vọng sáng tạo.",
        affirmation: "Tôi tin tưởng hoàn toàn vào tiếng nói của trực giác.",
        archetype: "Người Tìm Kiếm"
      },
      en: {
        aura: "Intuitive Violet Energy",
        message: "Your soul is emitting a frequency of keen intuition and creative desire.",
        affirmation: "I trust my inner voice and intuition completely.",
        archetype: "The Seeker"
      },
      ja: {
        aura: "直感的なバイオレットエネルギー",
        message: "あなたの魂は、鋭い直感と創造的な渇望の周波数を放っています。",
        affirmation: "私は直感と内なる声を完全に信頼しています。",
        archetype: "探求者"
      },
      ko: {
        aura: "직관적인 보랏빛 에너지",
        message: "당신의 영혼은 예리한 직관과 창조적 열망의 주파수를 뿜어내고 있습니다.",
        affirmation: "나는 내면의 목소리와 직관을 온전히 신뢰합니다.",
        archetype: "탐구자"
      },
      zh: {
        aura: "直觉紫色能量",
        message: "您的心灵正在散发出敏锐的直觉与强烈的创造渴望频率。",
        affirmation: "我完全信任并遵循自己内心的直觉之声。",
        archetype: "探索者"
      }
    };
    const active = activeData[lang] || activeData.en;
    return JSON.stringify({
      aura: active.aura,
      auraColor: "#a78bfa",
      element: "Light",
      message: active.message,
      affirmation: active.affirmation,
      archetype: active.archetype
    });
  }

  // 6. AI Emotion Analysis (useAIAnalysis.js)
  if (combined.includes("radar") || combined.includes("healing") || combined.includes("suggested_game")) {
    let moodType = "neutral";
    const cleanLastLower = lastUserMsg.toLowerCase();
    
    const SAD_KWS = ["buồn", "khóc", "tệ", "chán", "cô đơn", "tổn thương", "thất bại", "chia tay", "nhớ", "nhạt", "sad", "cry", "lonely", "hurt", "depressed"];
    const STRESS_KWS = ["căng thẳng", "áp lực", "stress", "mệt mỏi", "deadline", "thi", "học", "work", "job", "mất ngủ", "overwork", "pressure", "tired", "insomnia", "overwhelmed"];
    const HAPPY_KWS = ["vui", "hạnh phúc", "tuyệt", "đậu", "thắng", "đạt được", "yêu", "thích", "good", "happy", "nice", "awesome", "perfect", "joy", "excite"];

    if (SAD_KWS.some(kw => cleanLastLower.includes(kw))) {
      moodType = "sad";
    } else if (STRESS_KWS.some(kw => cleanLastLower.includes(kw))) {
      moodType = "stress";
    } else if (HAPPY_KWS.some(kw => cleanLastLower.includes(kw))) {
      moodType = "happy";
    }

    const activeData = {
      vi: {
        sad: { emotion: "Buồn bã", analysis: "Bạn đang trải qua nỗi buồn và cảm thấy tổn thương trong lòng. Hãy cho phép bản thân được nghỉ ngơi.", advice: "Hãy thử lắng nghe tiếng mưa rơi trong mục 'Âm thanh chữa lành' và uống một ly nước ấm.", healing: "Nước mắt là những lời nói mà con tim không thể diễn tả thành lời.", tags: ["buồn bã", "suy ngẫm"] },
        stress: { emotion: "Căng thẳng", analysis: "Bạn đang cảm thấy quá tải vì những áp lực và mệt mỏi đè nặng lên tâm trí.", advice: "Hãy lướt qua mục 'Cân bằng' chơi trò Pop-it giải stress để giải tỏa nhanh áp lực nhé.", healing: "Chậm lại một chút. Bình yên chính là một loại sức mạnh nội tại.", tags: ["áp lực", "căng thẳng"] },
        happy: { emotion: "Hạnh phúc", analysis: "Bạn đang tràn ngập niềm vui và năng lượng tích cực! Đây là một khoảnh khắc rất đáng trân trọng.", advice: "Hãy viết ngay một trang nhật ký mới để lưu lại cột mốc cảm xúc tuyệt vời này nhé.", healing: "Niềm vui là tấm lưới tình yêu giúp bạn kết nối sâu sắc hơn với cuộc sống.", tags: ["niềm vui", "hạnh phúc"] },
        neutral: { emotion: "Ổn định", analysis: "Tâm trạng của bạn hôm nay khá ổn định và bình yên.", advice: "Hãy tiếp tục duy trì những thói quen tốt và dành một chút thời gian đi dạo buổi tối nhé.", healing: "Bình yên là kết quả của việc rèn luyện tâm trí chấp nhận mọi thứ như chúng vốn có.", tags: ["bình yên", "ổn định"] }
      },
      en: {
        sad: { emotion: "Sadness", analysis: "You are experiencing sadness and vulnerability. It is okay to feel down and release your tears.", advice: "Try listening to the rain sounds in 'Healing Sounds' and wrap yourself in a cozy blanket.", healing: "Tears are words the mouth can't say nor can the heart explain.", tags: ["sadness", "reflection"] },
        stress: { emotion: "Stressed", analysis: "You feel overwhelmed by pressure and fatigue. Your nervous system is in a high-alert state.", advice: "Go to the 'Balance' section and play with the Pop-it board to relieve some instant tension.", healing: "Slow down. Calm is a superpower.", tags: ["stress", "overwhelm"] },
        happy: { emotion: "Joyful", analysis: "You are glowing with positive energy and happiness! This is an amazing milestone.", advice: "Write a new journal entry to capture this peak memory and share your joy.", healing: "Joy is a net of love by which you can catch souls.", tags: ["joy", "happiness"] },
        neutral: { emotion: "Balanced", analysis: "Your emotions are in a relatively calm and stable state today.", advice: "Maintain your healthy routines and take a short walk in the evening.", healing: "Peace is the result of retraining your mind to process life as it is.", tags: ["peaceful", "stable"] }
      },
      ja: {
        sad: { emotion: "悲しみ", analysis: "あなたは悲しみと脆弱さを感じています。落ち込んで涙を流しても大丈夫です。", advice: "「睡眠/ヒーリング音楽」で雨の音を聞きながら、温かい毛布に包まれてみてください。", healing: "涙は、口が語れず、心も説明できない言葉です。", tags: ["悲しみ", "内省"] },
        stress: { emotion: "ストレス", analysis: "プレッシャーと疲労で圧倒されているように感じます。神経系が緊張状態にあります。", advice: "「心のバランス」セクションに行き、Pop-itボードで遊んで即座の緊張を和らげてください。", healing: "少しペースを落としましょう。落ち着きは内なる強さです。", tags: ["ストレス", "圧倒"] },
        happy: { emotion: "喜び", analysis: "喜びと肯定的なエネルギーに満ちあふれています！これはとても大切な瞬間です。", advice: "この素晴らしい感情のマイルストーンを記録するために、新しい日記を書いてみましょう。", healing: "喜びは、人生とより深くつながるための愛の網です。", tags: ["喜び", "幸せ"] },
        neutral: { emotion: "安定", analysis: "今日のあなたの情緒は比較的穏やかで安定した状態にあります。", advice: "健康的な習慣を維持し、夕方に少し散歩をしてみてください。", healing: "平穏とは、物事をありのままに受け入れるよう心を訓練した結果です。", tags: ["平穏", "安定"] }
      },
      ko: {
        sad: { emotion: "슬픔", analysis: "당신은 현재 슬픔과 취약함을 느끼고 있습니다. 기분이 가라앉거나 눈물을 흘려도 괜찮습니다.", advice: "'수면/힐링 음악'에서 빗소리를 들으며 따뜻한 담요를 덮고 쉬어보세요.", healing: "눈물은 입이 말할 수 없고 가슴이 설명할 수 없는 언어입니다.", tags: ["슬픔", "성찰"] },
        stress: { emotion: "스트레스", analysis: "압박감과 피로감으로 인해 압도당하는 느낌을 받고 있습니다. 신경계가 긴장 상태에 있습니다.", advice: "'마음 안정' 코너로 가서 Pop-it 보드를 누르며 일시적인 긴장을 풀어보세요.", healing: "조금 천천히 가세요. 차분함은 내면의 강력한 힘입니다.", tags: ["스트레스", "압도됨"] },
        happy: { emotion: "기쁨", analysis: "기쁨과 긍정적인 에너지로 가득 차 있습니다! 매우 소중한 순간입니다.", advice: "이 멋진 감정의 이정표를 포착하기 위해 새로운 일기를 작성해 보세요.", healing: "기쁨은 삶과 더 깊이 연결되도록 돕는 사랑의 그물망입니다.", tags: ["기쁨", "행복"] },
        neutral: { emotion: "안정", analysis: "오늘 당신의 감정 상태는 비교적 차분하고 안정된 상태를 유지하고 있습니다.", advice: "좋은 습관을 계속 유지하고 저녁에 가볍게 산책을 해보세요.", healing: "평온함은 모든 것을 있는 그대로 받아들이도록 마음을 훈련한 결과입니다.", tags: ["평온함", "안정됨"] }
      },
      zh: {
        sad: { emotion: "悲伤", analysis: "你正经历着悲伤与脆弱。感到低落并流下眼泪是完全没关系的。", advice: "尝试在“睡眠/疗愈音乐”中听听雨声，并用一条温暖的毛毯包裹自己吧。", healing: "眼泪是嘴无法说出、心也无法解释的言语。", tags: ["悲伤", "内省"] },
        stress: { emotion: "压力", analysis: "你因重重压力和疲劳而感到不堪重负，神经系统正处于高度警觉状态。", advice: "去“心灵平稳”板块玩玩 Pop-it 减压板，以此来缓解即时的紧张情绪吧。", healing: "慢下来。平静是一种内在的超能力。", tags: ["压力", "不堪重负"] },
        happy: { emotion: "喜悦", analysis: "你正沉浸在喜悦与积极的能量中！这是一个非常珍贵且值得纪念的时刻。", advice: "写一篇新日记，以记录下这个情绪里程碑吧。", healing: "喜悦是一张爱之网，能让你与生活建立更深层的联结。", tags: ["喜悦", "幸福"] },
        neutral: { emotion: "稳定", analysis: "你今天的情绪处于相对平静和稳定的状态。", advice: "今天也要继续保持良好的作息习惯，并在傍晚进行一次短暂的散步哦。", healing: "平静是训练大脑去接纳事物本然样貌的结果。", tags: ["平静", "稳定"] }
      }
    };

    const active = (activeData[lang] || activeData.en)[moodType];
    return JSON.stringify({
      emotion: active.emotion,
      positive: moodType === "happy" ? 90 : (moodType === "neutral" ? 65 : (moodType === "stress" ? 30 : 20)),
      intensity: moodType === "happy" ? 85 : (moodType === "neutral" ? 50 : (moodType === "stress" ? 80 : 75)),
      analysis: active.analysis,
      advice: active.advice,
      healing: active.healing,
      tags: active.tags,
      emoji: moodType === "happy" ? "🌟" : (moodType === "neutral" ? "😌" : (moodType === "stress" ? "😫" : "😢")),
      suggested_game: moodType === "sad" ? "rain" : "popit",
      radar: [
        {"subject": "Happiness", "A": moodType === "happy" ? 90 : (moodType === "neutral" ? 60 : 15), "full": 100},
        {"subject": "Anxiety", "A": moodType === "stress" ? 70 : (moodType === "sad" ? 40 : 10), "full": 100},
        {"subject": "Anger", "A": moodType === "stress" ? 20 : 5, "full": 100},
        {"subject": "Sadness", "A": moodType === "sad" ? 75 : 10, "full": 100},
        {"subject": "Peace", "A": moodType === "neutral" ? 65 : 15, "full": 100}
      ]
    });
  }

  // Fallback default JSON
  return JSON.stringify({
    status: "ok",
    message: "Completed"
  });
}

export function generateLocalMockResponse(messagesOrText, systemInstruction = "") {
  let messages = [];
  if (typeof messagesOrText === "string") {
    messages = [{ role: "user", content: messagesOrText }];
  } else if (Array.isArray(messagesOrText)) {
    messages = messagesOrText;
  }

  const lang = (typeof localStorage !== "undefined" ? localStorage.getItem("sj_lang") : "vi") || "vi";
  const t = MOCK_DATA[lang] || MOCK_DATA.vi;

  // Nhận biết vai trò (Role persona detection)
  let role = "friend";
  if (systemInstruction) {
    const sysLower = systemInstruction.toLowerCase();
    if (sysLower.includes("trị liệu") || sysLower.includes("therapist") || sysLower.includes("quá khứ") || sysLower.includes("chấn thương") || sysLower.includes("psychoanalysis")) {
      role = "therapist";
    } else if (sysLower.includes("huấn luyện") || sysLower.includes("coach") || sysLower.includes("grow") || sysLower.includes("tương lai") || sysLower.includes("smart")) {
      role = "coach";
    }
  }

  const getRoleText = (field) => {
    const data = t[field];
    if (data && typeof data === "object" && data[role]) {
      return data[role];
    }
    return data;
  };

  const getCatText = (cat, field) => {
    if (!cat) return "";
    const data = cat[field];
    if (data && typeof data === "object" && data[role]) {
      return data[role];
    }
    return data || "";
  };

  if (messages.length === 0) return getRoleText("default");

  // Lấy tin nhắn cuối cùng của người dùng
  const lastUserMsg = messages[messages.length - 1]?.content || "";
  const cleanLast = lastUserMsg.toLowerCase();

  // 1. Phân tích các phản hồi xã giao thông thường trước (Lời chào, lời cảm ơn)
  const THANKS_KEYWORDS = lang === "vi" 
    ? ["cảm ơn", "cám ơn", "thanks", "thank you", "cám ơn bạn", "cảm ơn bạn", "ok", "dạ", "ừm", "đúng thế", "đúng vậy", "uh", "uhm"]
    : ["thanks", "thank you", "thank", "thx", "ok", "yes", "indeed", "right", "yeah"];
  if (THANKS_KEYWORDS.some(kw => cleanLast === kw || cleanLast.startsWith(kw + " ") || cleanLast.endsWith(" " + kw))) {
    return getRoleText("thanks");
  }

  const WELCOME_KEYWORDS = lang === "vi"
    ? ["không có gì", "không có j", "ko có gì", "ko có j", "khong co gi", "khong co j", "ko co gi", "ko co j", "không sao", "khong sao", "ko sao", "không sao đâu", "khong sao dau"]
    : ["no problem", "welcome", "you're welcome", "anytime", "no worries"];
  if (WELCOME_KEYWORDS.some(kw => cleanLast === kw || cleanLast.startsWith(kw + " ") || cleanLast.endsWith(" " + kw))) {
    return getRoleText("welcome");
  }

  const GREETING_KEYWORDS = lang === "vi"
    ? ["chào", "hello", "hi", "chào bạn", "chào bot", "xin chào"]
    : ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening"];
  if (GREETING_KEYWORDS.some(kw => cleanLast === kw || cleanLast.startsWith(kw + " "))) {
    return getRoleText("greeting");
  }

  // 1.5. Phân tích các phản hồi đồng ý/chấp nhận gợi ý từ tin nhắn trước của Bot (Agreement handler)
  const cleanLastCleaned = cleanLast.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'“”[\]\\]/g, "").trim();
  const AGREEMENT_KEYWORDS = lang === "vi"
    ? ["có", "có chứ", "muốn", "tôi muốn", "mình muốn", "đồng ý", "ok", "được", "chơi luôn", "thử xem", "thử luôn", "uh", "ừ", "ừm", "yup", "yes", "được chứ", "ok luôn"]
    : ["yes", "sure", "ok", "okay", "yeah", "yep", "i want to", "do it", "agree", "let's do it", "let's try", "want to", "want", "i want"];

  if (AGREEMENT_KEYWORDS.includes(cleanLastCleaned)) {
    const lastAssistantMsg = messages.length >= 2
      ? messages[messages.length - 2]?.content || ""
      : "";

    if (lang === "vi") {
      if (lastAssistantMsg.includes("Pop-it") || lastAssistantMsg.includes("trò chơi")) {
        return role === "friend" 
          ? "Tuyệt quá ní ơi! Ní nhấp ngay vào mục 'Cân bằng' dưới màn hình, rồi bem ngay trò Pop-it bóp bong bóng giải stress cực đã nha. Chúc ní chơi vui vẻ slay nha! 💙"
          : "Tuyệt quá! Bạn hãy nhấp vào mục 'Cân bằng' ở thanh điều hướng dưới màn hình, rồi chọn trò chơi Pop-it để xả stress nhé. Chúc bạn chơi vui! 💙";
      }
      if (lastAssistantMsg.includes("Âm thanh chữa lành") || lastAssistantMsg.includes("tiếng mưa rơi")) {
        return role === "friend"
          ? "Tuyệt cú mèo! Ní bật ngay 'Âm thanh chữa lành' bằng biểu tượng đĩa nhạc Zen ở dưới màn hình nha, hoặc gõ một bài tự do tâm sự trong 'Nhật ký' xả giận đi ní. Tớ luôn ở đây cùng ní. 🌿"
          : "Tuyệt vời! Bạn có thể bật ngay 'Âm thanh chữa lành' bằng biểu tượng đĩa nhạc Zen ở góc dưới màn hình, hoặc bắt đầu viết tự do một trang nhật ký để giãi bày tâm tư nhé. Mình luôn ở đây đồng hành cùng bạn. 🌿";
      }
      if (lastAssistantMsg.includes("nhật ký") || lastAssistantMsg.includes("Nhật ký tâm hồn") || lastAssistantMsg.includes("khoảnh khắc hạnh phúc")) {
        return role === "friend"
          ? "Chuẩn đét ní ơi! Nhấp ngay biểu tượng 'Nhật ký' ở thanh dưới để viết lại giây phút đỉnh chóp này đi ní! Chúc ní ngày mới mãi mận và bùng cháy nha! 🌟"
          : "Thật tuyệt vời! Hãy nhấp vào biểu tượng 'Nhật ký' ở thanh điều hướng để ghi lại khoảnh khắc hạnh phúc này ngay nhé. Chúc ngày của bạn luôn tràn ngập niềm vui! 🌟";
      }
      if (lastAssistantMsg.includes("nguyên nhân sâu xa") || lastAssistantMsg.includes("chia sẻ thêm") || lastAssistantMsg.includes("tổn thương")) {
        return role === "friend"
          ? "Kể tớ hóng hớt với ní ơi, chuyện gì làm ní tụt vibe ghê thế? Có gì đè nén cứ xả hết ra đây tớ nghe nè ní yêu! 💙"
          : "Hãy kể cho tôi nghe đi, nguyên nhân hay ký ức sâu xa nào đã khiến bạn cảm thấy như vậy thế? Tôi luôn ở đây để lắng nghe và hỗ trợ bạn trị liệu. 💙";
      }
      if (lastAssistantMsg.includes("chủ đề nào khác") || lastAssistantMsg.includes("mục tiêu")) {
        return role === "friend"
          ? "Tớ luôn sẵn sàng hóng hớt buôn chuyện cùng ní nè. Hôm nay có chuyện gì hot hay tin tức gì thú vị ní kể tớ tiếp đi ní ơi! 💙"
          : "Tôi luôn sẵn sàng lắng nghe bạn đây. Hôm nay bạn còn mục tiêu, kế hoạch hay chia sẻ nào khác muốn cùng tôi thảo luận tiếp không? 💙";
      }
    } else {
      if (lastAssistantMsg.toLowerCase().includes("pop-it") || lastAssistantMsg.toLowerCase().includes("game")) {
        return role === "friend"
          ? "Awesome bestie! Go hit the 'Balance' tab and pop some bubbles on the Pop-it board. Have a blast! 💙"
          : "Great! You can click the 'Balance' section in the bottom navigation bar and select the Pop-it game to relieve stress. Have fun! 💙";
      }
      if (lastAssistantMsg.toLowerCase().includes("healing sounds") || lastAssistantMsg.toLowerCase().includes("rain sounds")) {
        return role === "friend"
          ? "Sweet! Turn on 'Healing Sounds' with that Zen vinyl icon down there, or open your 'Journal' to vent. I'm with you! 🌿"
          : "Wonderful! You can turn on 'Healing Sounds' using the Zen music disc icon at the bottom of the screen, or start writing a free journal to express your thoughts. I'm always here with you. 🌿";
      }
      if (lastAssistantMsg.toLowerCase().includes("journal") || lastAssistantMsg.toLowerCase().includes("happy moment")) {
        return role === "friend"
          ? "Totally goals, bestie! Tap the 'Journal' tab and log this absolute vibe now. Keep slaying! 🌟"
          : "That's wonderful! Just click the 'Journal' icon in the navigation bar to write down this happy moment. Wish you a day filled with joy! 🌟";
      }
      if (lastAssistantMsg.toLowerCase().includes("cause") || lastAssistantMsg.toLowerCase().includes("share more") || lastAssistantMsg.toLowerCase().includes("trauma")) {
        return role === "friend"
          ? "Spill the tea, what made you feel so low? I'm here for you! 💙"
          : "Please tell me more, what caused you to feel this way? I am here to listen and help you process. 💙";
      }
      if (lastAssistantMsg.toLowerCase().includes("another topic") || lastAssistantMsg.toLowerCase().includes("goal")) {
        return role === "friend"
          ? "I'm down to chat about whatever, bestie. Got any more juicy news or thoughts for me? 💙"
          : "I'm always ready to listen. Is there any other goal or topic you'd like to discuss together today? 💙";
      }
    }
  }

  // 2. Tìm kiếm chủ đề/trạng thái cảm xúc trong toàn bộ lịch sử trò chuyện (từ mới nhất đến cũ nhất)
  let detectedCategory = null;
  const userMessages = messages.filter(m => m.role === "user").map(m => m.content.toLowerCase());
  
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const msg = userMessages[i];
    const cat = t.categories.find(c => c.keywords.some(kw => msg.includes(kw)));
    if (cat) {
      detectedCategory = cat.id;
      break;
    }
  }

  const catData = t.categories.find(c => c.id === detectedCategory);

  // 3. Kiểm tra xem tin nhắn cuối cùng có phải là câu hỏi "Nên làm gì / Làm thế nào" hay không
  const isAskingForAction = t.actionKeywords.some(kw => cleanLast.includes(kw));

  if (isAskingForAction) {
    if (catData) return getCatText(catData, "action");
    return getRoleText("actionDefault");
  }

  // 4. Nếu không phải câu hỏi hành động, đối chiếu theo từ khóa tin nhắn cuối cùng trực tiếp
  for (const cat of t.categories) {
    if (cat.keywords.some(kw => cleanLast.includes(kw))) {
      return getCatText(cat, "response");
    }
  }

  // 5. Nếu không khớp bất cứ thứ gì và đã từng có trạng thái cảm xúc trước đó, tiếp tục câu chuyện theo mạch cảm xúc đó
  if (catData) {
    return getCatText(catData, "followUp");
  }

  return getRoleText("default");
}

/**
 * Giả lập luồng trả về từng chữ (SSE Stream) từ dữ liệu Mock để giao diện hiển thị mượt mà
 * @param {string} mockText 
 * @param {AbortSignal} [signal]
 * @yields {string}
 */
export async function* streamLocalMockResponse(mockText, signal) {
  const words = mockText.match(/[^ ]+ ?/g) || [mockText];
  const isTest = typeof globalThis.process !== "undefined" && globalThis.process.env?.NODE_ENV === "test";
  
  for (const word of words) {
    if (signal?.aborted) break;
    yield word;
    if (!isTest) {
      await new Promise(resolve => setTimeout(resolve, 60 + Math.random() * 30));
    } else {
      await Promise.resolve();
    }
  }
}



