import { useState, useRef, useMemo, useEffect, cloneElement } from "react";
import { getNavItems } from "../utils/constants.js";
import { useAppContext } from "../context/AppContext.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

// =================== HOME PAGE LOCALIZATION ===================
const HOME_I18N = {
  vi: {
    sandbox_title: "🔮 Trải nghiệm nhanh - Hào quang năng lượng cảm xúc",
    sandbox_desc: "Chọn một mức độ tâm trạng để cảm nhận sự thay đổi tức thì của hào quang tinh thần:",
    sandbox_current: "Hào quang hiện tại:",
    portal_title: "🌈 Cổng Không Gian Tâm Lý Học AI",
    portal_desc: "Trải nghiệm toàn diện các tính năng được phát triển dựa trên khoa học hành vi nhằm hỗ trợ chữa lành, thấu hiểu tính cách và quản lý cảm xúc.",
    tech_title_1: "Mã hóa đầu cuối bảo mật",
    tech_desc_1: "Mọi dòng nhật ký và kết quả trắc nghiệm tâm lý của bạn được mã hóa an toàn trên thiết bị bằng thuật toán cao cấp AES-GCM 256-bit.",
    tech_title_2: "Hoạt động Ngoại tuyến (Offline-First)",
    tech_desc_2: "Ứng dụng hoạt động mượt mà không cần kết nối mạng qua IndexedDB và Service Worker, tự động đồng bộ khi trực tuyến trở lại.",
    tech_title_3: "Trí tuệ nhân tạo Gemini AI",
    tech_desc_3: "Tận dụng sức mạnh từ các mô hình ngôn ngữ lớn tiên tiến nhất để đưa ra những phân tích cảm xúc sâu sắc và gợi ý chữa lành thực tế.",
    progress_text: "Tiến trình: {completed}/5 bài đọc đã hoàn thành",
    quotes: {
      1: "Mọi cảm xúc đều có giá trị. Hãy cho phép bản thân nghỉ ngơi và nhẹ nhàng hôm nay.",
      2: "Nỗi buồn giống như một làn sương, nó sẽ trôi đi và để lại sự trong trẻo trong tâm hồn bạn.",
      3: "Những lúc chông chênh là cơ hội tốt để lắng nghe những nhịp đập sâu thẳm nhất bên trong.",
      4: "Một ngày bình yên là món quà tuyệt vời. Hãy tận hưởng nhịp điệu nhẹ nhàng này.",
      5: "Bạn đang làm rất tốt. Hãy tiếp tục nuôi dưỡng những suy nghĩ tích cực xung quanh mình.",
      6: "Nụ cười của bạn lan tỏa năng lượng tích cực. Hãy chia sẻ niềm vui này với thế giới!",
      7: "Năng lượng tinh thần của bạn đang tràn đầy và sáng rực. Cảm giác thật tuyệt vời!",
      8: "Bạn đang ở trạng thái thăng hoa nhất của tâm hồn. Hãy lưu giữ khoảnh khắc diệu kỳ này!"
    }
  },
  en: {
    sandbox_title: "🔮 Quick Experience - Emotional Energy Aura",
    sandbox_desc: "Select a mood level to feel the instant shift in your spiritual aura:",
    sandbox_current: "Current Aura:",
    portal_title: "🌈 AI Psychology Portals",
    portal_desc: "Comprehensive tools built on behavioral science to support healing, self-understanding, and emotion management.",
    tech_title_1: "End-to-End Encryption",
    tech_desc_1: "All your journal entries and psychological test results are safely encrypted on-device using secure AES-GCM 256-bit algorithms.",
    tech_title_2: "Offline-First Design",
    tech_desc_2: "The application works seamlessly offline via IndexedDB, automatically synchronizing when internet connection is restored.",
    tech_title_3: "Gemini AI Intelligence",
    tech_desc_3: "Leverages the advanced large language models to offer deep emotional analyses and actionable healing suggestions.",
    progress_text: "Progress: {completed}/5 articles read",
    quotes: {
      1: "All emotions are valid. Give yourself permission to rest and be gentle today.",
      2: "Sadness is like a mist; it will pass, leaving your soul clear and calm.",
      3: "Unstable times are great opportunities to listen to the deepest beats inside.",
      4: "A peaceful day is a wonderful gift. Enjoy this gentle rhythm.",
      5: "You are doing great. Keep nurturing positive thoughts around you.",
      6: "Your smile spreads positive energy. Share this joy with the world!",
      7: "Your mental energy is full and shining. It feels absolutely wonderful!",
      8: "You are at the peak state of your soul. Cherish this magical moment!"
    }
  },
  ja: {
    sandbox_title: "🔮 クイック体験 - 感情의 에너지 오라",
    sandbox_desc: "精神的なオーラの即座の変化を感じるために、気分のレベルを選択してください：",
    sandbox_current: "現在のオーラ：",
    portal_title: "🌈 AI心理学ポータル",
    portal_desc: "心の癒し、自己理解、感情管理をサポートするために、行動科学に基づいて開発された包括的なツール群。",
    tech_title_1: "エンドツーエンド暗号化",
    tech_desc_1: "すべてのジャーナルエントリと心理テスト結果は、高強度のAES-GCM 256ビットアルゴリズムを使用してデバイス上で安全に暗号化されます。",
    tech_title_2: "オフラインファースト（Offline-First）",
    tech_desc_2: "アプリはIndexedDBを介してネットワークなしでスムーズに動作し、オンラインに戻ると自動的に同期します。",
    tech_title_3: "Gemini AI 人工知能",
    tech_desc_3: "最先端 of 大型言語モデルの力を借りて、深い感情分析と実用的なヒーリングの提案を提供します。",
    progress_text: "進捗状況: {completed}/5 記事読了",
    quotes: {
      1: "すべての感情に価値があります。今日は自分を休ませ、優しくしてあげましょう。",
      2: "悲しみは霧のようなものです。それは過ぎ去り、あなたの魂に澄み切った静けさを残します。",
      3: "不安定な時期は、内なる最も深い鼓動に耳を傾ける良い機会です。",
      4: "穏やかな一日は素晴らしい贈り物です。この優しいリズムを楽しんでください。",
      5: "あなたは本当によくやっています。周りのポジティブな考えを育み続けましょう。",
      6: "あなたの笑顔はポジティブなエネルギーを広げます。この喜びを世界と共有しましょう！",
      7: "あなたの精神エネルギーは満치 溢れ、輝いています。本当に素晴らしい気分です！",
      8: "あなたは魂の最高の状態にいます。この不思議な瞬間を大切にしましょう！"
    }
  },
  ko: {
    sandbox_title: "🔮 빠른 체험 - 감정 에너지 오라",
    sandbox_desc: "정신적인 오라의 즉각적인 변화를 느끼기 위해 기분 레벨을 선택하세요:",
    sandbox_current: "현재 오라:",
    portal_title: "🌈 AI 심리학 포털",
    portal_desc: "치유, 자기 이해 및 감정 관리를 돕기 위해 행동 과학을 기반으로 개발된 종합 도구 모음.",
    tech_title_1: "종단간 암호화",
    tech_desc_1: "모든 일기 항목과 심리 테스트 결과는 고급 AES-GCM 256비트 알고리즘을 사용하여 기기에서 안전하게 암호화됩니다.",
    tech_title_2: "오프라인 우선 (Offline-First)",
    tech_desc_2: "앱은 IndexedDB를 통해 인터넷 연결 없이 원활하게 작동하며, 온라인으로 복구되면 자동으로 동기화됩니다.",
    tech_title_3: "Gemini AI 인공지능",
    tech_desc_3: "최첨단 대규모 언어 모델의 성능을 활용하여 깊은 감정 분석과 실질적인 치유 제안을 제공합니다.",
    progress_text: "진행 상황: {completed}/5개 독서 완료",
    quotes: {
      1: "모든 감정은 소중합니다. 오늘 하루는 자신에게 휴식을 주고 친절해지세요.",
      2: "슬픔은 안개와 같습니다. 그것은 지나가고 당신의 영혼에 맑은 고요함을 남깁니다.",
      3: "불안정한 시기는 내면의 가장 깊은 박동에 귀를 기울일 수 있는 좋은 기회입니다.",
      4: "평화로운 하루는 멋진 선물입니다. 이 부드러운 리듬을 즐겨보세요.",
      5: "당신은 아주 잘하고 있습니다. 당신 주변의 긍정적인 생각을 계속 키워나가세요.",
      6: "당신의 미소는 긍정적인 에너지를 전파합니다. 이 기쁨을 세상과 나누어 보세요!",
      7: "당신의 정신 에너지가 가득 차고 빛나고 있습니다. 정말 기분이 좋습니다!",
      8: "당신은 영혼의 가장 조화로운 상태에 있습니다. 이 마법 같은 순간을 소중히 간직하세요!"
    }
  },
  zh: {
    sandbox_title: "🔮 快速体验 - 情绪能量 🔮",
    sandbox_desc: "选择情绪等级以即时感受精神气场变化：",
    sandbox_current: "当前气场:",
    portal_title: "🌈 AI 心理学空间门 🌈",
    portal_desc: "融合行为科学的全面功能，旨在辅助疗愈、理解性格与管理情绪。",
    tech_title_1: "端到端加密",
    tech_desc_1: "您所有的日记记录和测试结果均在设备上使用高级 AES-GCM 256 位算法进行安全加密。",
    tech_title_2: "离线优先 (Offline-First)",
    tech_desc_2: "应用通过 IndexedDB 在离线状态下顺畅运行，并在网络连接恢复后自动同步。",
    tech_title_3: "Gemini AI 人工智能",
    tech_desc_3: "借助最前沿的大语言模型，提供深度情绪分析与实用的自愈建议。",
    progress_text: "进度：已完成 {completed}/5 篇阅读",
    quotes: {
      1: "所有情绪都是有价值的。今天允许自己好好休息，温柔对待自己。",
      2: "悲伤就像薄雾；它终将消散，让你的心灵重现清澈与宁静。",
      3: "动荡的时期是倾听内心深处最真实心声的绝佳契机。",
      4: "平和的一天是美好的礼物。尽情享受这温柔的节奏吧。",
      5: "你做得非常好。请继续保持并积极面对生活中的每一天。",
      6: "你的微笑能传播正能量。将这份快乐分享给世界吧！",
      7: "你的精神能量饱满且闪耀。感觉棒极了！",
      8: "你正处于灵魂最和谐的状态。珍惜这个神奇的瞬间！"
    }
  }
};

// =================== Helper Styles & Handlers for Premium Buttons ===================
const actionButtonStyle = (_color) => ({
  background: "var(--glass1, rgba(255, 255, 255, 0.02))",
  border: "1px solid var(--border1, rgba(255, 255, 255, 0.06))",
  color: "var(--text-secondary, rgba(255, 255, 255, 0.55))",
  padding: "6px 16px",
  borderRadius: "99px",
  fontSize: "12px",
  fontWeight: "500",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer",
  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
  backdropFilter: "blur(8px)",
  textDecoration: "none",
  fontFamily: "inherit",
});

const handleBtnEnter = (e, _color) => {
  e.currentTarget.style.background = "var(--glass2, rgba(255, 255, 255, 0.08))";
  e.currentTarget.style.borderColor = "var(--border2, rgba(255, 255, 255, 0.15))";
  e.currentTarget.style.color = "var(--text-primary, white)";
  e.currentTarget.style.transform = "translateY(-1px)";
};

const handleBtnLeave = (e) => {
  e.currentTarget.style.background = "var(--glass1, rgba(255, 255, 255, 0.02))";
  e.currentTarget.style.borderColor = "var(--border1, rgba(255, 255, 255, 0.06))";
  e.currentTarget.style.color = "var(--text-secondary, rgba(255, 255, 255, 0.55))";
  e.currentTarget.style.transform = "translateY(0)";
};

// =================== 3D PORTAL CARD ===================
function PortalCard({ item, onClick, delay }) {
  const cardRef = useRef(null);
  const { setPage, t } = useAppContext();
  
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 25;
    const rotateY = (centerX - x) / 25;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.borderColor = `${item.color}55`;
    card.style.boxShadow = `0 24px 60px -12px rgba(0, 0, 0, 0.75), 0 0 30px ${item.color}1a`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.borderColor = `rgba(255, 255, 255, 0.05)`;
    card.style.boxShadow = "var(--shadow-card)";
  };

  const renderCardActions = () => {
    switch (item.id) {
      case "portal_moments":
        return (
          <div style={{ marginTop: 28, display: "flex", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPage("letter");
              }}
              style={actionButtonStyle(item.color)}
              onMouseEnter={(e) => handleBtnEnter(e, item.color)}
              onMouseLeave={handleBtnLeave}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              <span>{t.nav_letter || "Thư Tương Lai"}</span>
            </button>
          </div>
        );
      case "portal_ai":
        return (
          <div style={{ marginTop: 28, display: "flex", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPage("ai");
              }}
              style={actionButtonStyle(item.color)}
              onMouseEnter={(e) => handleBtnEnter(e, item.color)}
              onMouseLeave={handleBtnLeave}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>
              <span>{t.nav_analysis || "Phân Tích AI"}</span>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      ref={cardRef}
      onClick={() => onClick(item.id)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        borderRadius: "32px",
        padding: "40px 24px",
        cursor: "pointer",
        textAlign: "center",
        animation: `slideUpIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`,
        transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s, box-shadow 0.4s",
        willChange: "transform",
        overflow: "visible", // Cho phép mix-blend-mode của con hoạt động với nền ngoài mà không bị clip mask
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Spotlight effect */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(800px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${item.color}0f, transparent 40%)`,
        pointerEvents: "none",
        zIndex: 0,
        borderRadius: "32px", // Đảm bảo spotlight bo tròn theo card
      }} />
      
      {/* Decorative Glow */}
      <div style={{ position: "absolute", top: "-20%", left: "-20%", width: "140%", height: "140%", background: `radial-gradient(circle at center, ${item.color}0a 0%, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
      
      <div 
        style={{ 
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "180px",
          width: "180px",
          margin: "0 auto 24px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, #0e0926 0%, #030012 100%)",
          border: `1px solid ${item.color}44`,
          boxShadow: `inset 0 0 20px ${item.color}22, 0 8px 24px rgba(0,0,0,0.15)`,
          animation: "floatPulse 4s ease-in-out infinite",
          filter: `drop-shadow(0 0 16px ${item.color}33)`,
          transform: "translateZ(50px)",
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        {(() => {
          // Cân bằng tỉ lệ hình học của từng logo để tạo cảm quan đồng đều và đẹp mắt
          let iconWidth = "140px";
          let iconHeight = "140px";
          if (item.id === "portal_moments") {
            iconWidth = "160px";
            iconHeight = "120px";
          } else if (item.id === "portal_balance") {
            iconWidth = "130px";
            iconHeight = "130px";
          }
          return cloneElement(item.icon, { width: iconWidth, height: iconHeight });
        })()}
      </div>
      
      <h2 style={{ 
        color: "var(--text-primary)", 
        fontSize: "25px", 
        fontWeight: 800, 
        margin: "0 0 12px",
        letterSpacing: "-0.2px",
        fontFamily: "'Outfit', sans-serif",
        position: "relative",
        zIndex: 1
      }}>
        {item.label}
      </h2>
      <p style={{ 
        color: "var(--text-secondary)", 
        fontSize: "13.5px", 
        margin: "0",
        lineHeight: 1.6,
        padding: "0 8px",
        position: "relative",
        zIndex: 1
      }}>
        {item.desc}
      </p>

      {/* Render custom actions */}
      {renderCardActions()}
    </div>
  );
}

// =================== DAILY WELCOME ===================
function DailyWelcome() {
  const { user, t, lang } = useAppContext();
  const hour = new Date().getHours();
  
  const morningBadges = {
    vi: "🌅 Buổi sáng trong lành",
    en: "🌅 Fresh Morning",
    ja: "🌅 さわやかな朝",
    ko: "🌅 상쾌한 아침",
    zh: "🌅 清新的早晨"
  };
  const afternoonBadges = {
    vi: "🍃 Buổi chiều êm ả",
    en: "🍃 Peaceful Afternoon",
    ja: "🍃 穏やかな午後",
    ko: "🍃 평화로운 오후",
    zh: "🍃 安静的下午"
  };
  const eveningBadges = {
    vi: "🌙 Buổi tối bình yên",
    en: "🌙 Quiet Evening",
    ja: "🌙 静かな夜",
    ko: "🌙 평온한 밤",
    zh: "🌙 宁静的夜晚"
  };

  // Xác định khoảng thời gian và style tương ứng mang phong cách chữa lành
  let timeTheme = {
    bg: "linear-gradient(135deg, rgba(115, 156, 166, 0.15), rgba(204, 165, 133, 0.05))",
    border: "rgba(115, 156, 166, 0.25)",
    color: "#6fa0ad",
    badge: morningBadges[lang] || morningBadges.vi,
    shadow: "0 12px 30px rgba(115, 156, 166, 0.1)"
  };
  
  if (hour >= 12 && hour < 18) {
    timeTheme = {
      bg: "linear-gradient(135deg, rgba(110, 133, 123, 0.15), rgba(173, 136, 112, 0.05))",
      border: "rgba(110, 133, 123, 0.25)",
      color: "#a8c3b7",
      badge: afternoonBadges[lang] || afternoonBadges.vi,
      shadow: "0 12px 30px rgba(110, 133, 123, 0.1)"
    };
  } else if (hour >= 18 || hour < 5) {
    timeTheme = {
      bg: "linear-gradient(135deg, rgba(173, 136, 112, 0.12), rgba(13, 18, 16, 0.6))",
      border: "rgba(173, 136, 112, 0.2)",
      color: "#c79980",
      badge: eveningBadges[lang] || eveningBadges.vi,
      shadow: "0 12px 30px rgba(173, 136, 112, 0.08)"
    };
  }


  const greeting = hour < 12 ? t.home_greeting_morning : hour < 18 ? t.home_greeting_afternoon : t.home_greeting_evening;
  const name = user?.name ? user.name.split(" ").pop() : t.home_greeting_friend;

  const quotes = useMemo(() => [
    t.home_quote_1,
    t.home_quote_2,
    t.home_quote_3,
    t.home_quote_4,
    t.home_quote_5
  ], [t]);
  const quote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], [quotes]);

  return (
    <div style={{
      textAlign: "center",
      marginBottom: 60,
      animation: "fadeIn 1s ease",
      padding: "24px 32px",
      borderRadius: "28px",
      background: timeTheme.bg,
      border: `1px solid ${timeTheme.border}`,
      boxShadow: timeTheme.shadow,
      maxWidth: "720px",
      margin: "0 auto 60px",
    }}>
      <div style={{ 
        display: "inline-block", 
        background: "rgba(255, 255, 255, 0.04)", 
        border: `1px solid ${timeTheme.border}`, 
        borderRadius: 99, 
        padding: "6px 20px", 
        fontSize: 13, 
        color: timeTheme.color, 
        fontWeight: 700,
        marginBottom: 16,
        boxShadow: `0 2px 8px rgba(0,0,0,0.05)`
      }}>
         {timeTheme.badge} ✦ {greeting}, {name}! ✦
      </div>
      <p style={{ 
        fontSize: "15.5px", 
        color: "var(--text-primary, white)", 
        maxWidth: "600px", 
        margin: "0 auto",
        fontStyle: "italic",
        lineHeight: 1.7,
        fontWeight: 500
      }}>
        "{quote}"
      </p>
    </div>
  );
}

// =================== MOOD ENERGY SANDBOX ===================
function MoodSandbox({ t }) {
  const { lang } = useAppContext();
  const activeLang = ["vi", "en", "ja", "ko", "zh"].includes(lang) ? lang : "vi";
  const homeT = HOME_I18N[activeLang] || HOME_I18N.vi;

  const [selectedMood, setSelectedMood] = useState(7); // default Very Happy/Excellent
  const [bursts, setBursts] = useState([]);

  const spawnBurst = (emoji) => {
    // Generate 7-8 random sparkles radiating upward from the card center
    const newBursts = Array.from({ length: 8 }, (_, i) => ({
      id: Math.random() + i,
      emoji,
      tx: (Math.random() - 0.5) * 200, // random angle spread
      ty: -60 - Math.random() * 120,   // shoot upward
      rot: Math.random() * 360,
      scale: Math.random() * 0.5 + 0.8,
      delay: i * 0.04,
    }));
    setBursts(newBursts);
  };
  
  const moodAtmospheres = {
    1: { emoji: "😭", label: t.mood0 || "Tồi tệ", bg: "radial-gradient(circle, rgba(239,68,68,0.12) 0%, rgba(3,0,20,0.98) 80%)", color: "#ef4444", quote: homeT.quotes[1] },
    2: { emoji: "😢", label: t.mood1 || "Buồn", bg: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, rgba(3,0,20,0.98) 80%)", color: "#f97316", quote: homeT.quotes[2] },
    3: { emoji: "🍃", label: t.mood2 || "Bất ổn", bg: "radial-gradient(circle, rgba(234,179,8,0.12) 0%, rgba(3,0,20,0.98) 80%)", color: "#eab308", quote: homeT.quotes[3] },
    4: { emoji: "😐", label: t.mood3 || "Bình thường", bg: "radial-gradient(circle, rgba(107,114,128,0.12) 0%, rgba(3,0,20,0.98) 80%)", color: "#6b7280", quote: homeT.quotes[4] },
    5: { emoji: "💖", label: t.mood4 || "Ổn", bg: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, rgba(3,0,20,0.98) 80%)", color: "#22c55e", quote: homeT.quotes[5] },
    6: { emoji: "😊", label: t.mood5 || "Vui", bg: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(3,0,20,0.98) 80%)", color: "#3b82f6", quote: homeT.quotes[6] },
    7: { emoji: "🔮", label: t.mood6 || "Rất vui", bg: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(3,0,20,0.98) 80%)", color: "#8b5cf6", quote: homeT.quotes[7] },
    8: { emoji: "✨", label: t.mood7 || "Tuyệt vời", bg: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, rgba(3,0,20,0.98) 80%)", color: "#ec4899", quote: homeT.quotes[8] },
  };

  const activeAtm = moodAtmospheres[selectedMood];

  return (
    <div className="glass" style={{
      padding: "36px 32px 32px",
      borderRadius: "28px",
      background: "var(--glass-bg)",
      border: "1px solid var(--glass-border)",
      boxShadow: "0 30px 70px rgba(0,0,0,0.7)",
      maxWidth: "720px",
      margin: "0 auto 80px",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.5s ease"
    }}>
      {/* Background Glow corresponding to current mood */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: activeAtm.bg,
        zIndex: 0,
        transition: "background 0.8s ease",
        pointerEvents: "none"
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "19px", fontWeight: 800, marginBottom: "10px", textAlign: "center", letterSpacing: "-0.2px" }}>
          {homeT.sandbox_title}
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "28px", textAlign: "center" }}>
          {homeT.sandbox_desc}
        </p>

        {/* Mood selectors */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: "10px", marginBottom: "28px" }}>
          {Object.entries(moodAtmospheres).map(([lvl, item]) => {
            const isActive = +lvl === selectedMood;
            return (
              <button
                key={lvl}
                onClick={() => {
                  setSelectedMood(+lvl);
                  spawnBurst(item.emoji);
                }}
                style={{
                  padding: "14px 6px",
                  background: isActive ? `${item.color}1c` : "var(--glass1, rgba(255, 255, 255, 0.02))",
                  border: `1px solid ${isActive ? item.color : "var(--border1, rgba(255, 255, 255, 0.06))"}`,
                  color: isActive ? "var(--text-primary, white)" : "var(--text-secondary, rgba(255,255,255,0.6))",
                  borderRadius: "16px",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = `${item.color}55`; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = "var(--border1, rgba(255, 255, 255, 0.06))"; }}
              >
                <span style={{ fontSize: "22px", filter: isActive ? `drop-shadow(0 0 10px ${item.color})` : "none" }}>{item.emoji}</span>
                <span style={{ fontSize: "11px", fontWeight: isActive ? 800 : 500 }}>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic output container */}
        <div style={{
          background: "var(--bg-primary, rgba(3, 2, 12, 0.65))",
          border: `1px solid ${activeAtm.color}33`,
          borderRadius: "20px",
          padding: "24px",
          textAlign: "center",
          minHeight: "120px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          transition: "border-color 0.8s ease",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5)",
          position: "relative"
        }}>
          {/* Burst emojis floating upward */}
          {bursts.map(b => (
            <span
              key={b.id}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                fontSize: "24px",
                pointerEvents: "none",
                zIndex: 10,
                display: "inline-block",
                animation: "emojiBurst 1.3s cubic-bezier(0.1, 0.8, 0.3, 1) forwards",
                animationDelay: `${b.delay}s`,
                "--tx": `${b.tx}px`,
                "--ty": `${b.ty}px`,
                "--rot": `${b.rot}deg`,
                "--scale": b.scale,
              }}
            >
              {b.emoji}
            </span>
          ))}

          <div style={{ fontSize: "32px", marginBottom: "10px", animation: "float 3s ease-in-out infinite" }}>{activeAtm.emoji}</div>
          <p style={{ color: "var(--text-primary, white)", fontSize: "15.5px", fontWeight: 600, lineHeight: 1.6, fontStyle: "italic", padding: "0 10px" }}>
            "{activeAtm.quote}"
          </p>
          <p style={{ color: activeAtm.color, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginTop: "12px", letterSpacing: "1.5px", filter: "brightness(1.15)" }}>
            {homeT.sandbox_current} {activeAtm.label}
          </p>
        </div>
      </div>
    </div>
  );
}

// =================== HOME PAGE ===================
function HomeContent() {
  const { setPage, user, setAuthModal: onAuthClick, t, lang } = useAppContext();
  const activeLang = ["vi", "en", "ja", "ko", "zh"].includes(lang) ? lang : "vi";
  const homeT = HOME_I18N[activeLang] || HOME_I18N.vi;

  const heroImages = useMemo(() => [
    { src: "/hero-dashboard.png", alt: "Soul Journal & CBT thought records" },
    { src: "/hero-dashboard-2.png", alt: "3D Emotion Globe & Personality growth radar map" },
    { src: "/hero-dashboard-3.png", alt: "Zen Garden & Healing games" },
    { src: "/hero-dashboard-4.png", alt: "MindBot AI companion counselor chat" },
  ], []);
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIdx(prev => (prev + 1) % heroImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroImages]);

  const portals = getNavItems(t).filter(item => item.children);

  return (
    <div style={{ 
      minHeight: "100vh", 
      paddingTop: "120px", 
      paddingBottom: "120px",
      position: "relative", 
      overflow: "hidden" 
    }}>
      

      {/* Grid Overlay */}
      <div style={{
        position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
        backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        backgroundPosition: "0 0, 20px 20px",
        opacity: 0.1,
        zIndex: -2, pointerEvents: "none"
      }} />

      <div style={{ position: "relative", maxWidth: "1200px", margin: "0 auto", padding: "0 24px", zIndex: 1 }}>
        
        {/* REDESIGNED HERO SECTION */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "60px",
          alignItems: "center",
          marginBottom: "100px"
        }}>
          {/* Hero Left Content */}
          <div style={{ animation: "fadeIn 0.8s ease" }}>
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px", 
              background: "rgba(110, 133, 123, 0.08)", 
              border: "1px solid rgba(110, 133, 123, 0.25)", 
              borderRadius: "99px", 
              padding: "6px 16px", 
              fontSize: "12px", 
              fontWeight: 600, 
              color: "var(--text-secondary)", 
              marginBottom: "24px" 
            }}>
              <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "var(--sage-green)", boxShadow: "0 0 8px var(--sage-green)" }} />
              ✦ {t.badge || "Tiên phong trong phân tích tâm lý học AI"}
            </div>
            
            <h1 style={{
              fontSize: "clamp(38px, 5.5vw, 56px)",
              fontWeight: 900,
              color: "var(--text-primary)",
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              marginBottom: "20px"
            }}>
              {t.home_hero_title_1} <br />
              <span className="shimmer-text" style={{ fontSize: "1.06em" }}>{t.home_hero_title_2}</span>
            </h1>
            
            <p style={{
              fontSize: "15.5px",
              color: "var(--text-secondary)",
              lineHeight: 1.75,
              marginBottom: "36px",
              maxWidth: "520px"
            }}>
              {t.sub_tagline || "EPIONARA — Gương phản chiếu tâm lý sử dụng trí tuệ nhân tạo và khoa học hành vi giúp bạn thấu hiểu sâu sắc cảm xúc, tính cách và năng lượng tinh thần."}
            </p>
            
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "36px" }}>
              {!user ? (
                <button 
                  onClick={() => onAuthClick("login")}
                  className="btn-primary"
                  style={{ padding: "14px 36px", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {t.home_start_btn} <span>→</span>
                </button>
              ) : (
                <button 
                  onClick={() => setPage("journal")}
                  className="btn-primary"
                  style={{ padding: "14px 36px", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  📝 {t.nav_journal || "Nhật Ký Tâm Hồn"} <span>→</span>
                </button>
              )}
              <a 
                href="#portals-section" 
                className="btn-ghost"
                style={{ padding: "13px 30px", fontSize: "15px", textDecoration: "none", display: "inline-block", textAlign: "center" }}
              >
                {t.home_explore_btn || "🔮 Khám phá tính năng"}
              </a>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "8px", opacity: 0.65 }}>
              <span style={{ fontSize: "16px" }}>🔒</span>
              <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{t.home_privacy || "Mã hóa đầu cuối 100% bảo mật dữ liệu"}</span>
            </div>
          </div>

          {/* Hero Right Visual (Mockup Slider) */}
          <div style={{ 
            animation: "scaleIn 1s cubic-bezier(0.16, 1, 0.3, 1)", 
            position: "relative",
            width: "100%",
            maxWidth: "540px",
            justifySelf: "center"
          }}>
            <div style={{
              position: "relative",
              borderRadius: "28px",
              padding: "8px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.01))",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 35px 80px rgba(0,0,0,0.85), 0 0 50px rgba(108,61,232,0.15)",
              animation: "float 6s ease-in-out infinite",
            }}>
              {/* Overlay reflection screen gloss */}
              <div style={{
                position: "absolute",
                inset: "8px",
                borderRadius: "20px",
                background: "linear-gradient(125deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)",
                zIndex: 2,
                pointerEvents: "none"
              }} />
              
              {/* Spacer image to maintain aspect ratio */}
              <img 
                src="/hero-dashboard.png" 
                alt="Spacer" 
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: "20px",
                  display: "block",
                  opacity: 0,
                  pointerEvents: "none"
                }} 
              />

              {/* Slider Images with premium fade zoom transitions */}
              {heroImages.map((img, idx) => (
                <img 
                  key={idx}
                  src={img.src} 
                  alt={img.alt} 
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    width: "calc(100% - 16px)",
                    height: "calc(100% - 16px)",
                    borderRadius: "20px",
                    display: "block",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    zIndex: currentHeroIdx === idx ? 1 : 0,
                    opacity: currentHeroIdx === idx ? 1 : 0,
                    transition: "opacity 0.8s ease-in-out, transform 0.8s ease-in-out",
                    transform: currentHeroIdx === idx ? "scale(1)" : "scale(0.97)",
                  }} 
                />
              ))}

              {/* Dot Indicators */}
              <div style={{
                position: "absolute",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "8px",
                zIndex: 3,
                background: "rgba(3, 2, 12, 0.5)",
                padding: "6px 12px",
                borderRadius: "99px",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
              }}>
                {heroImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentHeroIdx(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    style={{
                      width: currentHeroIdx === idx ? "18px" : "6px",
                      height: "6px",
                      borderRadius: "99px",
                      background: currentHeroIdx === idx ? "#a78bfa" : "rgba(255,255,255,0.4)",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: currentHeroIdx === idx ? "0 0 8px #a78bfa" : "none"
                    }}
                  />
                ))}
              </div>

              {/* Glow backdrops */}
              <div style={{
                position: "absolute",
                bottom: "-25px",
                left: "15%",
                right: "15%",
                height: "20px",
                background: "radial-gradient(ellipse at center, rgba(139,92,246,0.5) 0%, transparent 70%)",
                filter: "blur(12px)",
                zIndex: 0
              }} />
            </div>
          </div>
        </div>

        {/* Daily welcome quote */}
        <DailyWelcome />

        {/* Interactive mood auric sandbox */}
        <MoodSandbox t={t} />

        {/* Portal Grid Header */}
        <div id="portals-section" style={{ marginTop: "120px", marginBottom: "60px", textAlign: "center" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "14px", letterSpacing: "-0.5px" }}>
            {homeT.portal_title}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "580px", margin: "0 auto", lineHeight: 1.6 }}>
            {homeT.portal_desc}
          </p>
        </div>

        {/* Portal Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: "32px",
          marginBottom: "100px"
        }}>
          {portals.map((portal, idx) => (
            <PortalCard 
              key={portal.id} 
              item={portal} 
              onClick={(id) => {
                setPage(id);
              }} 
              delay={idx * 0.08}
            />
          ))}
        </div>

        {/* Technology & Privacy Section */}
        <div style={{
          marginTop: "120px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          borderTop: "1px solid var(--border1, rgba(255,255,255,0.06))",
          paddingTop: "60px"
        }}>
          {[
            { title: homeT.tech_title_1, desc: homeT.tech_desc_1, icon: "🔑", color: "#a78bfa" },
            { title: homeT.tech_title_2, desc: homeT.tech_desc_2, icon: "📶", color: "#22d3ee" },
            { title: homeT.tech_title_3, desc: homeT.tech_desc_3, icon: "🤖", color: "#f97316" },
          ].map((tech, i) => (
            <div key={i} className="glass" style={{
              padding: "28px",
              borderRadius: "22px",
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "100px", height: "100px", background: `radial-gradient(circle, ${tech.color}0a 0%, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ fontSize: "32px", marginBottom: "18px", display: "inline-block", filter: `drop-shadow(0 0 12px ${tech.color}33)` }}>{tech.icon}</div>
              <h3 style={{ color: "var(--text-primary)", fontSize: "17px", fontWeight: 700, marginBottom: "10px" }}>{tech.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6 }}>{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Background Orbs */}
      <div style={{ position: "fixed", top: "20%", left: "10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(108,61,232,0.06) 0%, transparent 70%)", zIndex: -1, animation: "orbFloat 20s infinite linear" }} />
      <div style={{ position: "fixed", bottom: "10%", right: "10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)", zIndex: -1, animation: "orbFloat 25s infinite linear reverse" }} />
    </div>
  );
}

export default function HomePage() {
  const { t } = useAppContext();
  return (
    <ErrorBoundary t={t}>
      <HomeContent />
    </ErrorBoundary>
  );
}
