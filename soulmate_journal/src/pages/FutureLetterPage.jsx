import { useState, useEffect, useRef } from "react";
import { useLetters } from "../hooks/useStorage.js";
import { BackButton } from "../components/UIComponents.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { useAppContext } from "../context/AppContext.jsx";
import GlassCard from "../components/GlassCard.jsx";

// =================== ZEN SAND CANVAS COMPONENT ===================
function SandCanvas({ onDraw, color = "#a78bfa" }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.offsetWidth;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a0f3e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Sand texture
    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = `rgba(167,139,250,${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const evt = e.touches ? e.touches[0] : e;
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  };

  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      const cp = { x: (pos.x + lastPos.current.x) / 2, y: pos.y + Math.sin(Date.now() / 200) * 4 };
      ctx.quadraticCurveTo(cp.x, cp.y, pos.x, pos.y);
    }
    ctx.stroke();
    lastPos.current = pos;
    if (onDraw) onDraw();
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={() => { setDrawing(true); lastPos.current = null; }}
      onMouseUp={() => setDrawing(false)}
      onMouseMove={draw}
      onTouchStart={(e) => { e.preventDefault(); setDrawing(true); lastPos.current = null; }}
      onTouchEnd={() => setDrawing(false)}
      onTouchMove={(e) => { e.preventDefault(); draw(e); }}
      style={{ width: "100%", borderRadius: 16, cursor: "crosshair", display: "block", touchAction: "none" }}
    />
  );
}

// =================== FUTURE LETTER ===================
function FutureLetterContent({ minimal = false }) {
  const { t, setPage, lang } = useAppContext();
  const activeLang = lang || "vi";
  const { letters, addLetter, updateLetter } = useLetters();
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [openLetter, setOpenLetter] = useState(null);
  const [strokes, setStrokes] = useState(0);

  const save = () => {
    if (!text.trim()) return;
    const dueTs = new Date(dueDate).getTime();
    const letter = { id: Date.now(), text, created: Date.now(), due: dueTs, opened: false, strokes };
    addLetter(letter);
    setText(""); setWriting(false); setStrokes(0);
  };

  const open = (letter) => {
    updateLetter(letter.id, { opened: true });
    setOpenLetter({ ...letter, opened: true });
  };

  const daysLeft = (due) => Math.max(0, Math.ceil((due - Date.now()) / 86400000));
  const isArrived = (due) => Date.now() >= (due - 3600000); // 1 hour buffer

  return (
    <div style={{ minHeight: minimal ? "auto" : "100vh", background: minimal ? "none" : "var(--bg-gradient)", paddingTop: minimal ? 0 : 80, paddingBottom: minimal ? 20 : 80 }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: minimal ? 0 : "0 24px" }}>
        {!minimal && <BackButton onClick={() => setPage("home")} label={`← ${t.nav_home || "Home"}`} />}
        {!minimal && (
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h1 style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: 900, background: "linear-gradient(135deg,#fbbf24,#f97316,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 10px" }}>
              💌 {t.letter_title || "Thư Gửi Tương Lai"}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>{t.letter_sub || "Viết những điều bạn muốn nhắn gửi đến bản thân sau này"}</p>
          </div>
        )}

        {/* Arrived letters alert */}
        {letters.filter(l => isArrived(l.due) && !l.opened).map(l => (
          <div key={l.id} onClick={() => open(l)} style={{ background: "linear-gradient(135deg,rgba(251,191,36,0.12),rgba(249,115,22,0.06))", border: "2px solid rgba(251,191,36,0.4)", borderRadius: 24, padding: "20px 24px", marginBottom: 16, cursor: "pointer", animation: "glowPulse 2s ease infinite", display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 36 }}>🎁</span>
            <div>
              <div style={{ color: "var(--orange, #fbbf24)", fontWeight: 800, fontSize: 17 }}>{t.letter_arrived_msg || "Thư đã đến nơi rồi bạn ơi! 💌"}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>{t.letter_written_on || "Bạn đã viết vào"} {new Date(l.created).toLocaleDateString(activeLang === "vi" ? "vi-VN" : activeLang)}</div>
            </div>
          </div>
        ))}

        {/* Open letter modal */}
        {openLetter && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(5,8,20,0.92)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "linear-gradient(135deg,rgba(13,20,64,0.99),rgba(26,10,60,0.99))", border: "2px solid rgba(251,191,36,0.4)", borderRadius: 32, padding: "40px", maxWidth: 600, width: "100%", boxShadow: "0 40px 100px rgba(0,0,0,0.8)", animation: "modalIn 0.4s cubic-bezier(.34,1.56,.64,1)" }}>
              <div style={{ fontSize: 48, textAlign: "center", marginBottom: 20 }}>💌</div>
              <h2 style={{ color: "#fbbf24", fontSize: 24, fontWeight: 900, textAlign: "center", margin: "0 0 24px" }}>{t.letter_from_past || "Lời nhắn từ quá khứ"}</h2>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 20, padding: "24px", color: "white", lineHeight: 1.8, fontSize: 16, whiteSpace: "pre-wrap", marginBottom: 24, maxHeight: "40vh", overflowY: "auto" }}>
                {openLetter.text}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center", marginBottom: 24 }}>
                {t.letter_written_date || "Bạn đã viết lá thư này vào ngày"} {new Date(openLetter.created).toLocaleDateString(activeLang === "vi" ? "vi-VN" : activeLang)}
              </div>
              <button onClick={() => setOpenLetter(null)} className="btn-primary" style={{ width: "100%" }}>{t.letter_close || "Đóng thư lại 💙"}</button>
            </div>
          </div>
        )}

        {/* Write new letter */}
        {writing ? (
          <GlassCard style={{ border: "1.5px solid rgba(251,191,36,0.25)", borderRadius: 32, padding: "32px", marginBottom: 24, animation: "pageIn 0.5s ease" }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "var(--text-secondary)", fontSize: 13, display: "block", marginBottom: 8, fontWeight: 600 }}>{t.letter_select_date || "📅 CHỌN NGÀY THƯ SẼ ĐẾN:"}</label>
              <input 
                type="date" 
                value={dueDate} 
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setDueDate(e.target.value)}
                style={{ width: "100%", background: "var(--bg0)", border: "1px solid var(--border2)", borderRadius: 12, padding: "12px 16px", color: "var(--text-primary)", fontSize: 15, outline: "none" }}
              />
            </div>

            <label style={{ color: "var(--text-secondary)", fontSize: 13, display: "block", marginBottom: 8, fontWeight: 600 }}>{t.letter_your_message || "📝 LỜI NHẮN GỬI:"}</label>
            <textarea 
              value={text} 
              onChange={e => setText(e.target.value)} 
              placeholder={t.letter_placeholder_new || "Bạn muốn nhắn gì cho chính mình trong tương lai nào..."}
              rows={6} 
              style={{ width: "100%", background: "var(--bg0)", border: "1px solid var(--border2)", borderRadius: 16, color: "var(--text-primary)", fontSize: 15, lineHeight: 1.8, resize: "none", fontFamily: "inherit", padding: 16, marginBottom: 20, outline: "none" }}
            />

            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "var(--text-secondary)", fontSize: 13, display: "block", marginBottom: 8, fontWeight: 600 }}>{t.letter_draw_sand || "🎨 VẼ MỘT BỨC TRANH CÁT TẶNG BẠN TƯƠNG LAI:"}</label>
              <div style={{ position: "relative", background: "#1a0f3e", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(167,139,250,0.3)" }}>
                <SandCanvas onDraw={() => setStrokes(s => s + 1)} color="#fbbf24" />
                <div style={{ position: "absolute", bottom: 10, right: 12, fontSize: 10, color: "rgba(255,255,255,0.4)", pointerEvents: "none" }}>{t.letter_draw_instruction || "Dùng tay/chuột để vẽ ✨"}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setWriting(false)} className="btn-ghost" style={{ padding: "10px 24px" }}>{t.letter_cancel || "Thôi không viết nữa"}</button>
              <button onClick={save} disabled={!text.trim()} className="btn-primary" style={{ padding: "10px 32px", opacity: !text.trim() ? 0.5 : 1 }}>
                {t.letter_seal_send || "📨 Niêm phong & Gửi đi"}
              </button>
            </div>
          </GlassCard>
        ) : (
          <button onClick={() => setWriting(true)} className="btn-future-write-new">
            {t.letter_write_new || "✍️ Viết một lá thư mới tặng chính mình"}
          </button>
        )}

        {/* Letters list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ color: "var(--text-secondary)", fontSize: 12, letterSpacing: 1, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{t.letter_waiting || "Hộp thư đang chờ..."}</h3>
          {letters.filter(l => !isArrived(l.due) || l.opened).sort((a, b) => b.id - a.id).map(l => (
            <GlassCard key={l.id} style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: l.opened ? "var(--glass2)" : "var(--healing-glow)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                {l.opened ? "📬" : "📩"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {l.opened ? l.text : (t.letter_sealed || "Đang được niêm phong kỹ...")}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 4 }}>
                  {t.letter_date_written || "Ngày viết:"} {new Date(l.created).toLocaleDateString(activeLang === "vi" ? "vi-VN" : activeLang)}
                </div>
              </div>
              {isArrived(l.due) && l.opened ? (
                <button onClick={() => open(l)} className="btn-ghost" style={{ padding: "6px 16px", fontSize: 12 }}>{t.letter_read_again || "Đọc lại"}</button>
              ) : (
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--orange, #fbbf24)", fontWeight: 800, fontSize: 18 }}>{daysLeft(l.due)}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 10, fontWeight: 600 }}>{t.letter_days_left || "NGÀY NỮA"}</div>
                </div>
              )}
            </GlassCard>
          ))}
          {letters.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-secondary)", opacity: 0.6 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📮</div>
              <p>{t.letter_empty || "Chưa có lá thư nào đang chờ cả."}<br/>{t.letter_empty_sub || "Bạn hãy viết lá thư đầu tiên đi!"}</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(251,191,36,0.2)} 50%{box-shadow:0 0 40px rgba(251,191,36,0.4)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.9) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
    </div>
  );
}

export default function FutureLetterPage({ minimal = false }) {
  const { t } = useAppContext();
  return <ErrorBoundary t={t}><FutureLetterContent minimal={minimal} /></ErrorBoundary>;
}
