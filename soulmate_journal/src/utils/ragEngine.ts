// =================== CLIENT-SIDE TF-IDF RAG ENGINE ===================
// Bộ máy Tìm kiếm Ngữ nghĩa Cục bộ chạy hoàn toàn trên trình duyệt client.
// Nó thực hiện tính toán tần suất từ và chỉ số nghịch đảo văn bản (TF-IDF)
// trên các dòng nhật ký cũ của người dùng để trả về ngữ cảnh liên quan nhất cho AI.

import { Journal } from "./types";

/**
 * Trích xuất các từ khóa đặc trưng từ chuỗi (loại bỏ từ dừng cơ bản)
 * @param text - Chuỗi văn bản đầu vào.
 * @returns Mảng các từ khóa đã lọc sạch.
 */
export function cleanTokenize(text: string): string[] {
  if (!text) return [];
  // Danh sách từ dừng cơ bản (stopwords) trong Tiếng Việt và Tiếng Anh
  const stopwords = new Set([
    "và", "là", "thì", "mà", "có", "của", "cho", "trong", "để", "với", "nhưng",
    "the", "and", "a", "of", "to", "in", "is", "that", "it", "for", "on", "with",
    "tôi", "mình", "bạn", "này", "cái", "nào", "ở", "ra", "vào", "lên", "xuống"
  ]);

  return text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'“”[\]\\]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopwords.has(w));
}

interface EmotionLexiconItem {
  keys: Set<string>;
  synonyms: string[];
}

// Từ điển mở rộng truy vấn theo cảm xúc (Emotion-aware Query Expansion Lexicon)
const EMOTION_LEXICON: EmotionLexiconItem[] = [
  {
    keys: new Set(["buồn", "chán", "tuyệt", "vọng", "khóc", "cô", "đơn", "tệ", "sad", "depressed", "cry", "lonely", "sầu", "nản", "thất", "vọng"]),
    synonyms: ["buồn", "chán", "tuyệt", "vọng", "khóc", "cô", "đơn", "tệ", "sad", "depressed", "cry", "lonely", "chán nản", "thất vọng"]
  },
  {
    keys: new Set(["lo", "lắng", "sợ", "bồn", "chồn", "anxious", "worried", "scared", "nervous", "hoang", "mang", "căng", "thẳng"]),
    synonyms: ["lo", "lắng", "sợ", "bồn", "chồn", "anxious", "worried", "scared", "nervous", "hoang", "mang", "căng", "thẳng", "lo lắng", "lo sợ", "căng thẳng"]
  },
  {
    keys: new Set(["giận", "tức", "bực", "điên", "angry", "mad", "furious", "khó", "chịu", "ghét"]),
    synonyms: ["giận", "tức", "bực", "điên", "angry", "mad", "furious", "khó chịu", "ghét"]
  },
  {
    keys: new Set(["stress", "áp", "lực", "mệt", "mỏi", "tải", "overload", "pressure", "tired", "kiệt", "sức"]),
    synonyms: ["stress", "áp lực", "mệt mỏi", "quá tải", "overload", "pressure", "tired", "kiệt sức"]
  },
  {
    keys: new Set(["vui", "hạnh", "phúc", "phấn", "khởi", "tuyệt", "với", "happy", "excited", "wonderful", "mừng", "sướng"]),
    synonyms: ["vui", "hạnh", "phúc", "phấn", "khởi", "tuyệt vời", "happy", "excited", "wonderful", "vui mừng"]
  },
  {
    keys: new Set(["bình", "yên", "thư", "giãn", "nhẹ", "nhõm", "peace", "relax", "calm", "an", "yên", "thoải", "mái"]),
    synonyms: ["bình yên", "thư giãn", "nhẹ nhõm", "peace", "relax", "calm", "an yên", "thoải mái"]
  },
  {
    keys: new Set(["cô", "đơn", "một", "mình", "bỏ", "rơi", "lẻ", "loi", "isolated", "lonely", "alone", "lạc", "lõng"]),
    synonyms: ["cô đơn", "một mình", "bị bỏ rơi", "lẻ loi", "isolated", "lonely", "alone", "lạc lõng"]
  }
];

/**
 * Tìm kiếm các dòng nhật ký cũ có liên quan nhất theo thuật toán BM25 kết hợp mở rộng cảm xúc và suy giảm thời gian.
 * @param query - Truy vấn hiện tại của người dùng
 * @param journals - Danh sách tất cả nhật ký
 * @param limit - Số lượng bản ghi liên quan tối đa cần lấy
 * @returns Chuỗi ngữ cảnh định dạng Markdown để nạp vào AI Prompt
 */
export function retrieveSemanticContext(query: string, journals: Journal[], limit: number = 2): string {
  if (!query || !journals || journals.length === 0) return "";

  const queryTokens = cleanTokenize(query);
  if (queryTokens.length === 0) return "";

  // Mở rộng truy vấn (Emotion-aware Query Expansion)
  const expandedTokens = [...queryTokens];
  const addedTokens = new Set(queryTokens);

  queryTokens.forEach(token => {
    for (const group of EMOTION_LEXICON) {
      if (group.keys.has(token)) {
        group.synonyms.forEach(syn => {
          const synTokens = cleanTokenize(syn);
          synTokens.forEach(st => {
            if (!addedTokens.has(st)) {
              addedTokens.add(st);
              expandedTokens.push(st);
            }
          });
        });
      }
    }
  });

  // Chỉ xét các nhật ký có ghi chú văn bản
  const docs = journals.filter(j => j.note && j.note.trim().length > 0);
  if (docs.length === 0) return "";

  const N = docs.length;

  // Tiền xử lý token hóa tài liệu
  const docInfos = docs.map(doc => {
    const tokens = cleanTokenize(doc.note);
    return {
      doc,
      tokens,
      len: tokens.length
    };
  });

  const totalLen = docInfos.reduce((sum, d) => sum + d.len, 0);
  const avgdl = N > 0 ? (totalLen / N) : 1.0;
  const safeAvgdl = avgdl === 0 ? 1.0 : avgdl;

  // Tính Document Frequency (DF) cho từng token trong expandedTokens
  const dfMap: Record<string, number> = {};
  expandedTokens.forEach(token => {
    let count = 0;
    docInfos.forEach(info => {
      if (info.tokens.includes(token)) {
        count++;
      }
    });
    dfMap[token] = count;
  });

  // Tham số BM25
  const k1 = 1.2;
  const b = 0.75;

  // Tính điểm BM25 kết hợp Temporal Decay
  const scores = docInfos.map(info => {
    if (info.len === 0) return { doc: info.doc, score: 0 };

    let bm25Score = 0;

    expandedTokens.forEach(token => {
      const tf = info.tokens.filter(t => t === token).length;
      if (tf > 0) {
        const df = dfMap[token] || 0;
        // Công thức IDF tránh số âm của BM25
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        const termScore = idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (info.len / safeAvgdl)));
        bm25Score += termScore;
      }
    });

    // Áp dụng Temporal Decay
    let decay = 1;
    if (info.doc.date) {
      const docDate = new Date(info.doc.date);
      if (!isNaN(docDate.getTime())) {
        const diffTime = Date.now() - docDate.getTime();
        const daysAgo = Math.max(0, diffTime / (1000 * 60 * 60 * 24));
        const lambda = 0.005; // Giảm 0.5% điểm mỗi ngày
        decay = Math.exp(-lambda * daysAgo);
      }
    }

    return {
      doc: info.doc,
      score: bm25Score * decay
    };
  });

  // Sắp xếp giảm dần và lọc các tài liệu có khớp từ khóa (score > 0.05)
  const bestMatches = scores
    .filter(s => s.score > 0.05) // Giữ nguyên ngưỡng điểm tương quan tối thiểu
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.doc);

  if (bestMatches.length === 0) return "";

  // Trả về chuỗi Markdown mô tả ngữ cảnh quá khứ
  return bestMatches.map(m => {
    const sleepInfo = m.sleep ? `, ngủ ${m.sleep}h` : "";
    const moodScore = m.score ? `, điểm tâm trạng: ${m.score}/8` : "";
    return `[Nhật ký ngày ${m.date}${sleepInfo}${moodScore}]: "${m.note.trim()}"`;
  }).join("\n");
}
