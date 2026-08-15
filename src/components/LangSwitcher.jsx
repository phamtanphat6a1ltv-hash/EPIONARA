import { useState } from "react";
import { LANGS } from "../i18n/index.js";

export default function LangSwitcher({ lang, setLang }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Language: ${LANGS[lang]?.name}`}
        style={{
          background: "var(--glass2, rgba(255,255,255,0.06))",
          border: "1px solid var(--border2, rgba(255,255,255,0.12))",
          borderRadius: 99,
          padding: "6px 14px",
          color: "var(--text-primary, white)",
          cursor: "pointer",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "inherit",
          transition: "all 0.2s",
        }}
      >
        {LANGS[lang]?.flag} {LANGS[lang]?.name}
        <span style={{ opacity: 0.7, fontSize: 10, color: "var(--text-secondary, white)" }}>▼</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "var(--nav-dropdown-bg, rgba(13,20,64,0.98))",
            border: "1px solid var(--nav-dropdown-border, rgba(255,255,255,0.12))",
            borderRadius: 14,
            overflow: "hidden",
            zIndex: 2000,
            minWidth: 160,
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {Object.entries(LANGS).map(([code, { flag, name }]) => (
            <button
              key={code}
              role="option"
              aria-selected={code === lang}
              onClick={() => { setLang(code); setOpen(false); }}
              style={{
                display: "flex",
                width: "100%",
                gap: 10,
                alignItems: "center",
                padding: "10px 16px",
                background: code === lang ? "var(--nav-dropdown-item-active-bg, rgba(108,61,232,0.2))" : "none",
                border: "none",
                color: code === lang ? "var(--nav-dropdown-item-active-text, #a78bfa)" : "var(--nav-dropdown-item-text, rgba(255,255,255,0.8))",
                cursor: "pointer",
                fontSize: 13,
                textAlign: "left",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (code !== lang) e.currentTarget.style.background = "var(--nav-hover-bg, rgba(255,255,255,0.06))"; }}
              onMouseLeave={e => { if (code !== lang) e.currentTarget.style.background = "none"; }}
            >
              {flag} {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
