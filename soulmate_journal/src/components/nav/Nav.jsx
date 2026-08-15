import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { UserStore, AccountStore } from "../../utils/db.js";
import { SoulmateJournalLogo } from "../UIComponents.jsx";
import LangSwitcher from "../LangSwitcher.jsx";

import { getNavItems } from "../../utils/constants.js";
import styles from "./Nav.module.css";
import { useAppContext } from "../../context/AppContext.jsx";
import { useThemeContext } from "../../context/ThemeContext.jsx";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";
import { useSoundEffects } from "../../context/SoundEffectsContext.jsx";

// =================== USER AVATAR ===================
function UserAvatar({ user, onClick, t }) {
  return (
    <button
      onClick={onClick}
      aria-label={t.profile_title || "Hồ sơ cá nhân"}
      aria-haspopup="true"
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
    >
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#6c3de8,#22d3ee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0, boxShadow: "0 4px 12px rgba(108,61,232,0.3)" }}>
        {user.avatar}
      </div>
    </button>
  );
}

// =================== LOGOUT MODAL (enhanced) ===================
export function LogoutModal({ user, onLogout, onSwitchAccount, onCancel, t }) {
  const trapRef = useFocusTrap(true);

  // Close modal on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      style={{ position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
    >
      <div style={{ position:"absolute",inset:0,background:"rgba(5,8,20,0.88)",backdropFilter:"blur(16px)" }} onClick={onCancel} />
      <div ref={trapRef} style={{ position:"relative",width:"100%",maxWidth:380,background:"linear-gradient(135deg,rgba(13,20,64,0.99),rgba(26,10,60,0.99))",border:"1px solid rgba(239,68,68,0.25)",borderRadius:24,padding:"36px 32px",textAlign:"center",boxShadow:"0 40px 100px rgba(0,0,0,0.8)",animation:"modalIn 0.35s cubic-bezier(.34,1.56,.64,1)" }}>
        {/* Animated farewell emoji */}
        <div style={{ fontSize:56,marginBottom:12,animation:"waveHand 1.5s ease infinite" }}>👋</div>
        <h2 id="logout-modal-title" style={{ color:"white",fontSize:22,fontWeight:800,margin:"0 0 8px" }}>{t.logout_title}</h2>
        <p style={{ color:"rgba(255,255,255,0.5)",fontSize:14,margin:"0 0 28px",lineHeight:1.6 }}>{t.logout_sub}</p>

        {/* User card */}
        <div style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:14,padding:"12px 16px",marginBottom:24,display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#6c3de8,#22d3ee)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"white",flexShrink:0 }}>{user.avatar}</div>
          <div style={{ textAlign:"left" }}>
            <div style={{ color:"white",fontWeight:600,fontSize:14 }}>{user.name}</div>
            <div style={{ color:"rgba(255,255,255,0.4)",fontSize:12 }}>{user.email || user.phone}</div>
          </div>
          <div style={{ marginLeft:"auto",padding:"3px 9px",borderRadius:99,background:"rgba(34,197,94,0.15)",color:"#22c55e",fontSize:11,fontWeight:600,border:"1px solid rgba(34,197,94,0.3)" }}>● {t.status_online || "Online"}</div>
        </div>

        {/* Buttons */}
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          <button onClick={onLogout} style={{ width:"100%",padding:"13px",background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"none",color:"white",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 0 20px rgba(239,68,68,0.35)",transition:"all 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            🚪 {t.logout_yes}
          </button>
          <button onClick={onSwitchAccount} style={{ width:"100%",padding:"12px",background:"rgba(108,61,232,0.15)",border:"1px solid rgba(108,61,232,0.35)",color:"#a78bfa",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",transition:"all 0.2s" }}>
            🔄 {t.logout_switch}
          </button>
          <button onClick={onCancel} aria-label={t.close || "Đóng"} style={{ width:"100%",padding:"11px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",borderRadius:12,fontSize:13,cursor:"pointer" }}>
            ✕ {t.logout_no}
          </button>
        </div>
      </div>
    </div>
  );
}

// =================== ACCOUNT SWITCH MODAL ===================
function AccountSwitchModal({ currentUser, onSwitch, onAdd, onClose, t }) {
  const accounts = AccountStore.getAccounts();
  const trapRef = useFocusTrap(true);

  // Close modal on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="switch-modal-title"
      style={{ position:"fixed",inset:0,zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
    >
      <div style={{ position:"absolute",inset:0,background:"rgba(5,8,20,0.85)",backdropFilter:"blur(14px)" }} onClick={onClose} />
      <div ref={trapRef} style={{ position:"relative",width:"100%",maxWidth:400,background:"linear-gradient(135deg,rgba(13,20,64,0.99),rgba(10,14,60,0.99))",border:"1px solid rgba(108,61,232,0.3)",borderRadius:24,padding:"32px 28px",boxShadow:"0 40px 100px rgba(0,0,0,0.8)",animation:"modalIn 0.35s cubic-bezier(.34,1.56,.64,1)" }}>
        <button onClick={onClose} aria-label={t.close || "Đóng"} style={{ position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.08)",border:"none",color:"rgba(255,255,255,0.5)",width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>

        <h2 id="switch-modal-title" style={{ color:"white",fontSize:20,fontWeight:800,margin:"0 0 6px",textAlign:"center" }}>🔄 {t.switch_title}</h2>
        <p style={{ color:"rgba(255,255,255,0.4)",fontSize:13,textAlign:"center",margin:"0 0 24px" }}>{accounts.length} {t.switch_title?.toLowerCase()}</p>

        <div style={{ display:"flex",flexDirection:"column",gap:10,maxHeight:280,overflowY:"auto" }}>
          {accounts.length === 0 && (
            <div style={{ textAlign:"center",color:"rgba(255,255,255,0.35)",padding:24 }}>{t.switch_empty || "No saved accounts"}</div>
          )}
          {accounts.map(acc => {
            const isCurrent = currentUser && acc.id === currentUser.id;
            return (
              <div key={acc.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:isCurrent?"rgba(108,61,232,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${isCurrent?"rgba(108,61,232,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:14,transition:"all 0.2s" }}>
                <div style={{ width:42,height:42,borderRadius:"50%",background:isCurrent?"linear-gradient(135deg,#6c3de8,#22d3ee)":"linear-gradient(135deg,#374151,#6b7280)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"white",flexShrink:0 }}>{acc.avatar}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ color:"white",fontWeight:600,fontSize:14 }}>{acc.name}</div>
                  <div style={{ color:"rgba(255,255,255,0.4)",fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{acc.email || acc.phone}</div>
                </div>
                {isCurrent ? (
                  <span style={{ padding:"3px 10px",borderRadius:99,background:"rgba(34,197,94,0.15)",color:"#22c55e",fontSize:11,fontWeight:600,border:"1px solid rgba(34,197,94,0.3)",whiteSpace:"nowrap" }}>✓ {t.current_account}</span>
                ) : (
                  <div style={{ display:"flex",gap:6 }}>
                    <button onClick={() => onSwitch(acc)} style={{ padding:"5px 12px",borderRadius:8,background:"rgba(108,61,232,0.25)",border:"1px solid rgba(108,61,232,0.4)",color:"#a78bfa",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap" }}>→ {t.switch_use || "Use"}</button>
                    <button onClick={() => AccountStore.removeAccount(acc.id)} style={{ padding:"5px 8px",borderRadius:8,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",color:"#f87171",cursor:"pointer",fontSize:12 }} aria-label={t.delete_entry || "Xóa mục này"}>✕</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={onAdd} style={{ width:"100%",marginTop:16,padding:"12px",background:"rgba(255,255,255,0.05)",border:"1px dashed rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.6)",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
          ➕ {t.add_account}
        </button>
      </div>
    </div>
  );
}

AccountSwitchModal.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    avatar: PropTypes.node,
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
  }),
  onSwitch: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  t: PropTypes.object.isRequired,
};

UserAvatar.propTypes = {
  user: PropTypes.shape({
    avatar: PropTypes.node,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  t: PropTypes.object.isRequired,
};

LogoutModal.propTypes = {
  user: PropTypes.shape({
    avatar: PropTypes.node,
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
  onSwitchAccount: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  t: PropTypes.object.isRequired,
};

// =================== NAV ===================
function Nav() {
  const { page, setPage, lang, setLang, user, setAuthModal, logout, switchUser, t } = useAppContext();
  const { theme, toggleTheme } = useThemeContext();
  const { isMuted, toggleMute } = useSoundEffects();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = getNavItems(t);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header role="banner" className={`${styles.navbar} ${scrolled ? styles.scrolled : ""} ${menuOpen ? styles.navbarOpen : ""}`}>
      <nav role="navigation" aria-label={t.main_navigation || "Main Navigation"} className={styles.container}>
        <button onClick={() => setPage("home")} aria-label={t.nav_home_label || "Trang chủ EPIONARA"} className={styles.logoBtn}>
          <SoulmateJournalLogo size={38} showText={true} animate={false} />
        </button>

        <div className={styles.desktopNav}>
          {navItems.map(item => {
            if (item.children) {
              const isExpanded = item.id === page || item.children.some(c => c.id === page);
              return (
                <div key={item.id} className={styles.dropdownContainer}>
                  <button 
                    onClick={() => setPage(item.id)}
                    aria-haspopup="true"
                    aria-expanded={isExpanded}
                    aria-label={`${item.label} Menu`}
                    className={`${styles.navItem} ${isExpanded ? styles.navItemActive : ""}`}
                  >
                    {item.label} ▾
                  </button>
                  <div className={styles.dropdownMenu}>
                    {item.children.map(child => (
                      <button key={child.id} onClick={() => setPage(child.id)} aria-label={child.label} className={`${styles.dropdownItem} ${page === child.id ? styles.dropdownItemActive : ""}`}>
                        <span style={{ marginRight: 8 }}>{child.icon}</span> {child.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <button key={item.id} onClick={() => setPage(item.id)} 
                aria-label={item.label}
                className={`${styles.navItem} ${page === item.id ? styles.navItemActive : ""}`}
              >{item.label}</button>
            );
          })}
        </div>

        <div className={styles.actions}>
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? t.theme_dark : t.theme_light}

            style={{
              background: "var(--glass1, rgba(255,255,255,0.06))",
              border: "1px solid var(--border1, rgba(255,255,255,0.12))",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a78bfa",
              cursor: "pointer",
              fontSize: 13,
              transition: "all 0.2s",
              marginRight: 6,
              padding: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--glass2, rgba(255,255,255,0.12))";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "var(--glass1, rgba(255,255,255,0.06))";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "🌊"}
          </button>
          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
            style={{
              background: "var(--glass1, rgba(255,255,255,0.06))",
              border: "1px solid var(--border1, rgba(255,255,255,0.12))",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isMuted ? "var(--text-secondary, rgba(255,255,255,0.4))" : "#a78bfa",
              cursor: "pointer",
              fontSize: 13,
              transition: "all 0.2s",
              boxShadow: isMuted ? "none" : "0 0 10px rgba(167,139,250,0.3)",
              marginRight: 6,
              padding: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--glass2, rgba(255,255,255,0.12))";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "var(--glass1, rgba(255,255,255,0.06))";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          <LangSwitcher lang={lang} setLang={setLang} />
          {user ? (
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <UserAvatar user={user} onClick={() => setUserDropdown(!userDropdown)} t={t} />
              {userDropdown && (
                <div style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, marginTop: 8, background: "var(--nav-dropdown-bg, rgba(8, 7, 16, 0.95))", border: "1px solid var(--nav-dropdown-border, rgba(255, 255, 255, 0.08))", borderRadius: 16, minWidth: 220, overflow: "hidden", backdropFilter: "blur(20px)", zIndex: 2000, boxShadow: "0 24px 60px -15px rgba(0, 0, 0, 0.8)" }}>
                  {/* User info header */}
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--nav-dropdown-border, rgba(255,255,255,0.06))", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0 }}>{user.avatar}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email || user.phone}</div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0, boxShadow: "0 0 8px #10b981" }} />
                  </div>
                  {/* Menu items */}
                  {[
                    { icon: "👤", label: t.nav_profile, action: () => { setPage("profile"); setUserDropdown(false); } },
                    { icon: "💬", label: t.nav_chat, action: () => { setPage("chat"); setUserDropdown(false); } }
                  ].map(item => (
                    <button key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", background: "none", border: "none", color: "var(--nav-dropdown-item-text, var(--text-primary))", cursor: "pointer", fontSize: 13, textAlign: "left", transition: "all 0.15s ease" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--nav-hover-bg, rgba(255,255,255,0.05))"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <span style={{ fontSize: 15 }}>{item.icon}</span> {item.label}
                    </button>
                  ))}
                  {/* Switch account */}
                  <div style={{ borderTop: "1px solid var(--nav-dropdown-border, rgba(255,255,255,0.06))" }}>
                    <button onClick={() => { setShowSwitchModal(true); setUserDropdown(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", background: "none", border: "none", color: "rgba(99, 102, 241, 0.85)", cursor: "pointer", fontSize: 13, textAlign: "left", transition: "all 0.15s ease" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <span>🔄</span> {t.switch_account || t.logout_switch || "Switch Account"}
                    </button>
                  </div>
                  {/* Logout */}
                  <div style={{ borderTop: "1px solid var(--nav-dropdown-border, rgba(255,255,255,0.06))" }}>
                    <button onClick={() => { setShowLogoutModal(true); setUserDropdown(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 13, textAlign: "left", transition: "all 0.15s ease" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <span>🚪</span> {t.logout}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setAuthModal("login")} className={styles.authBtn}>
            {t.nav_login}</button>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Đóng danh mục" : "Mở danh mục"} aria-expanded={menuOpen} className={styles.mobileMenuBtn}>☰</button>
        </div>
      </nav>

      {menuOpen && (
        <div style={{ background: "#0a0e27", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "12px 20px 20px", maxHeight: "calc(100vh - 64px)", overflowY: "auto", borderRadius: "0 0 16px 16px" }}>
          {navItems.map(item => {
            if (item.children) {
              return (
                <div key={item.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", padding: "4px 14px 8px", letterSpacing: 1 }}>{item.label}</div>
                  {item.children.map(child => (
                    <button key={child.id} onClick={() => { setPage(child.id); setMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: page === child.id ? "rgba(108,61,232,0.15)" : "none", border: "none", color: page === child.id ? "#a78bfa" : "rgba(255,255,255,0.8)", padding: "11px 14px 11px 24px", borderRadius: 10, cursor: "pointer", fontSize: 14, marginBottom: 2 }}>
                      <span style={{ fontSize: 16 }}>{child.icon}</span> {child.label}
                    </button>
                  ))}
                </div>
              );
            }
            return (
              <button key={item.id} onClick={() => { setPage(item.id); setMenuOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", background: page === item.id ? "rgba(108,61,232,0.15)" : "none", border: "none", color: page === item.id ? "#a78bfa" : "rgba(255,255,255,0.8)", padding: "11px 14px", borderRadius: 10, cursor: "pointer", fontSize: 14, marginBottom: 12 }}>{item.label}</button>
            );
          })}
        </div>
      )}

      {showLogoutModal && user && (
        <LogoutModal user={user} t={t}
          onLogout={() => { setShowLogoutModal(false); logout(); }}
          onSwitchAccount={() => { setShowLogoutModal(false); setShowSwitchModal(true); }}
          onCancel={() => setShowLogoutModal(false)} />
      )}
      {showSwitchModal && (
        <AccountSwitchModal currentUser={user} t={t}
          onSwitch={async (acc) => { const users = await UserStore.getUsers(); const full = users.find(u => u.id === acc.id); if (full) { await switchUser(full); } setShowSwitchModal(false); }}
          onAdd={() => { setShowSwitchModal(false); setAuthModal("login"); }}
          onClose={() => setShowSwitchModal(false)} />
      )}
    </header>
  );
}

export default Nav;