import { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { useSoundEffects } from "../../context/SoundEffectsContext.jsx";
import { ARCHETYPES, RARITIES } from "../../utils/constants.js";

export function SoulCardModal({ mood, note, onClose }) {
  const { t, lang, addCoins, collectCard } = useAppContext();
  const { playBubble, playSuccess } = useSoundEffects();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showShareView, setShowShareView] = useState(false);
  const [card, setCard] = useState(null);
  const [shared, setShared] = useState(false);

  // Generate Card properties on mount
  useEffect(() => {
    playBubble();
    const moodScore = Math.max(1, Math.min(Number(mood) + 1, 8));
    const arch = ARCHETYPES[moodScore] || ARCHETYPES[4];
    
    // Weighted Rarity roll
    const roll = Math.random() * 100;
    let selectedRarity = RARITIES[0];
    let sum = 0;
    for (let r of RARITIES) {
      sum += r.weight;
      if (roll <= sum) {
        selectedRarity = r;
        break;
      }
    }

    const cardId = `card_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const newCard = {
      id: cardId,
      archetypeId: moodScore,
      title: arch.title[lang] || arch.title.en,
      emoji: arch.emoji,
      gradient: arch.gradient,
      quote: arch.quotes[lang] || arch.quotes.en,
      rarity: selectedRarity.name[lang] || selectedRarity.name.en,
      rarityColor: selectedRarity.color,
      rarityShadow: selectedRarity.shadow,
      date: new Date().toLocaleDateString(({
        vi: "vi-VN",
        en: "en-US",
        ja: "ja-JP",
        ko: "ko-KR",
        zh: "zh-CN"
      })[lang] || "en-US"),
      noteSnippet: note ? (note.length > 60 ? note.slice(0, 57) + "..." : note) : ""
    };
    
    setCard(newCard);
  }, [mood, note, lang]);

  const handleFlip = () => {
    if (isFlipped) return;
    setIsFlipped(true);
    playSuccess();
  };

  const handleShareToEarn = () => {
    if (shared) return;
    addCoins(50);
    setShared(true);
    // Simulate screenshot download / copy link
    const link = document.createElement("a");
    link.href = "#";
    // Play sound
    playSuccess();
    setShowShareView(true);
  };

  const handleClaim = () => {
    if (card) {
      collectCard(card);
    }
    // Grant coins for journaling entry
    addCoins(50);
    onClose();
  };

  if (!card) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(4, 5, 15, 0.9)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.3s ease",
        color: "white",
        padding: 16,
      }}
    >
      {/* Floating particles background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", opacity: 0.55 }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: Math.random() * 5 + 2,
              height: Math.random() * 5 + 2,
              borderRadius: "50%",
              background: card.rarityColor,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              boxShadow: `0 0 10px ${card.rarityColor}`,
              animation: `floatUp ${Math.random() * 5 + 4}s linear infinite`,
            }}
          />
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        {!showShareView ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: card.rarityColor,
                  textShadow: `0 0 10px ${card.rarityColor}33`,
                }}
              >
                ✨ {t.game_card_rarity_title || "PHÁT HIỆN TẦN SỐ CẢM XÚC"} ✨
              </span>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginTop: 6, margin: 0, color: "white" }}>
                {isFlipped ? (t.game_card_unveiled || "Thẻ Bài Linh Hồn Của Bạn") : (t.game_card_tap_flip || "Nhấn Vào Thẻ Để Lật")}
              </h2>
            </div>

            {/* 3D Card Container */}
            <div
              onClick={handleFlip}
              style={{
                perspective: 1000,
                width: 280,
                height: 420,
                cursor: isFlipped ? "default" : "pointer",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: "transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  position: "relative",
                }}
              >
                {/* CARD BACK */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 24,
                    border: "3px solid rgba(255,255,255,0.08)",
                    background: "radial-gradient(circle at 50% 30%, #1e1b4b 0%, #07091d 80%)",
                    boxShadow: "0 25px 50px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.05)",
                    backfaceVisibility: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                    gap: 16,
                  }}
                >
                  {/* Glowing core */}
                  <div
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${card.rarityColor}88 0%, transparent 70%)`,
                      filter: "blur(8px)",
                      position: "absolute",
                      animation: "pulse 2s ease-in-out infinite",
                    }}
                  />
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.03)",
                      border: `2px dashed ${card.rarityColor}55`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 32,
                      zIndex: 2,
                    }}
                  >
                    ✨
                  </div>
                  <div style={{ textAlign: "center", zIndex: 2 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "rgba(255,255,255,0.8)" }}>EPIONARA</div>
                    <div style={{ fontSize: 10, tracking: 4, color: card.rarityColor, fontWeight: 700, marginTop: 2 }}>AURA CARD</div>
                  </div>
                </div>

                {/* CARD FRONT */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 24,
                    border: `3px solid ${card.rarityColor}cc`,
                    background: card.gradient,
                    boxShadow: `${card.rarityShadow}, 0 25px 50px rgba(0,0,0,0.5)`,
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: 20,
                    overflow: "hidden",
                  }}
                >
                  {/* Holographic shimmer effect */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Header: Title and Rarity */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 2 }}>
                    <div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          background: "rgba(0,0,0,0.45)",
                          padding: "2px 8px",
                          borderRadius: 99,
                          color: card.rarityColor,
                          border: `1px solid ${card.rarityColor}44`,
                        }}
                      >
                        {card.rarity}
                      </span>
                      <h3 style={{ fontSize: 18, fontWeight: 900, margin: "6px 0 0", color: "white", textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}>
                        {card.title}
                      </h3>
                    </div>
                    <div style={{ fontSize: 28 }}>{card.emoji}</div>
                  </div>

                  {/* Quote Body */}
                  <div
                    style={{
                      background: "rgba(0,0,0,0.42)",
                      backdropFilter: "blur(4px)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      padding: 14,
                      zIndex: 2,
                      margin: "20px 0",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: "rgba(255,255,255,0.9)",
                        fontStyle: "italic",
                        textAlign: "center",
                      }}
                    >
                      "{card.quote}"
                    </p>
                  </div>

                  {/* Footer: Date and snippet */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 10, zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{card.date}</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {card.noteSnippet}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            {isFlipped && (
              <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "center", animation: "fadeInUp 0.4s ease both" }}>
                <button
                  onClick={handleShareToEarn}
                  style={{
                    padding: "12px 24px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    borderRadius: 99,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                >
                  📤 {shared ? (t.game_card_shared || "Đã lưu ảnh!") : (t.game_card_share_earn || "Chia sẻ +50 xu")}
                </button>
                <button
                  onClick={handleClaim}
                  style={{
                    padding: "12px 32px",
                    background: `linear-gradient(135deg, ${card.rarityColor}, #7c3aed)`,
                    color: "white",
                    border: "none",
                    borderRadius: 99,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: `0 6px 20px ${card.rarityColor}33`,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  {t.game_card_claim || "Nhận quà & Đóng"}
                </button>
              </div>
            )}
          </>
        ) : (
          /* STORY SHARE PREVIEW VIEW */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, animation: "fadeIn 0.3s ease" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800 }}>📱 Instagram/TikTok Story Preview</h3>
            
            {/* 9:16 Share Poster Container */}
            <div
              style={{
                width: 270,
                height: 480,
                borderRadius: 24,
                border: `2px solid ${card.rarityColor}`,
                background: "radial-gradient(circle at 50% 30%, #0c0b24 0%, #03040c 100%)",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 30px 60px rgba(0,0,0,0.8)",
                position: "relative",
              }}
            >
              {/* Stars particles overlay */}
              <div style={{ position: "absolute", inset: 0, opacity: 0.18, background: "radial-gradient(white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
              
              {/* Header logo */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, color: card.rarityColor }}>EPIONARA</span>
                <span style={{ fontSize: 7, color: "rgba(255,255,255,0.4)" }}>YOUR EMOTIONAL COSMOS</span>
              </div>

              {/* Main Card graphic */}
              <div
                style={{
                  width: 170,
                  height: 250,
                  borderRadius: 16,
                  background: card.gradient,
                  border: `2px solid ${card.rarityColor}`,
                  boxShadow: card.rarityShadow,
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 8, background: "rgba(0,0,0,0.5)", padding: "1px 6px", borderRadius: 8, color: card.rarityColor }}>{card.rarity}</span>
                  <span style={{ fontSize: 18 }}>{card.emoji}</span>
                </div>
                
                <h4 style={{ fontSize: 12, fontWeight: 900, margin: 0, textAlign: "center", color: "white" }}>
                  {card.title}
                </h4>

                <p style={{ fontSize: 8, margin: 0, lineHeight: 1.4, color: "rgba(255,255,255,0.8)", textAlign: "center", fontStyle: "italic" }}>
                  "{card.quote.length > 100 ? card.quote.slice(0, 97) + "..." : card.quote}"
                </p>
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "rgba(255,255,255,0.4)" }}>
                  <span>{card.date}</span>
                  <span>Aura Card</span>
                </div>
              </div>

              {/* QR and referral code footer */}
              <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 8, fontWeight: 700 }}>
                    {({
                      vi: "🔍 Tìm tần số tâm hồn của bạn:",
                      en: "🔍 Find your soul frequency:",
                      ja: "🔍 あなたの魂の周波数を見つける:",
                      ko: "🔍 내면의 감정 주파수 찾기:",
                      zh: "🔍 探寻您的内心灵魂频率:"
                    })[lang] || "🔍 Find your soul frequency:"}
                  </span>
                  <span style={{ fontSize: 7, color: card.rarityColor, textDecoration: "underline" }}>epionara.io/cosmos</span>
                </div>
                {/* Mock QR code block */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    background: "white",
                    borderRadius: 6,
                    padding: 3,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1.5,
                  }}
                >
                  {Array.from({ length: 16 }).map((_, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: 8,
                        height: 8,
                        background: (idx % 3 === 0 || idx % 5 === 2 || idx === 0 || idx === 15) ? "black" : "white",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => {
                setShowShareView(false);
                setShared(true);
              }}
              style={{
                padding: "8px 24px",
                background: "rgba(255,255,255,0.08)",
                border: "none",
                color: "white",
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ← Quay lại nhận xu
            </button>
          </div>
        )}
      </div>

      {/* Global CSS for animations */}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
