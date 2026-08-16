import { useState, useEffect, lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { SoundEffectsProvider } from "./context/SoundEffectsContext.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import Nav from "./components/nav/Nav.jsx";
import { StarField } from "./components/UIComponents.jsx";
import CursorTrail from "./components/CursorTrail.jsx";
import RobotGuide, { FloatingRobot } from "./components/nav/RobotGuide.jsx";
import AuthModal from "./components/auth/AuthModal.jsx";
import { ProtectedRoute } from "./components/auth/ProtectedRoute.jsx";

import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { SkeletonCard } from "./components/SkeletonCard.jsx";
import { AppProvider, useAppContext } from "./context/AppContext.jsx";
import { PopItGame } from "./components/games/PopItGame.jsx";
import { ZenMeditationDock } from "./components/ZenMeditationDock.jsx";
import { UserStore } from "./utils/db.js";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts.js";
import PageWrapper from "./components/PageWrapper.jsx";
import AuraBackground from "./components/AuraBackground.jsx";
import styles from "./App.module.css";
import "./global.css";

import { IconHome, IconAI, IconJournal, IconChat } from "./components/BrandingIcons.jsx";

// Lazy-load heavy pages for better performance
const HomePage         = lazy(() => import("./pages/HomePage.jsx"));
const JournalPage      = lazy(() => import("./pages/JournalPage.jsx"));
const ChatbotPage      = lazy(() => import("./pages/ChatbotPage.jsx"));
const FutureLetterPage = lazy(() => import("./pages/FutureLetterPage.jsx"));
const ProfilePage      = lazy(() => import("./components/auth/ProfilePage.jsx"));
const AIHub            = lazy(() => import("./pages/AIHub.jsx"));
const MomentsHub       = lazy(() => import("./pages/MomentsHub.jsx"));
const CheckoutMockPage  = lazy(() => import("./pages/CheckoutMockPage.jsx"));
const CitationDemoPage  = lazy(() => import("./pages/CitationDemoPage.jsx"));
const NotFoundPage      = lazy(() => import("./pages/NotFoundPage.jsx"));

// Page loading fallback
function PageFallback() {
  return (
    <div style={{ minHeight: "60vh", padding: "80px 24px 40px", maxWidth: 800, margin: "0 auto" }}>
      <SkeletonCard lines={3} style={{ marginBottom: 16 }} />
      <SkeletonCard lines={4} style={{ marginBottom: 16 }} />
      <SkeletonCard lines={2} />
    </div>
  );
}

function ChatFallback() {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "80px 24px" }}>
      <SkeletonCard lines={1} style={{ height: 48, marginBottom: 16 }} />
      {[1, 2, 3].map(i => (
        <SkeletonCard key={i} lines={2} style={{ marginBottom: 12 }} />
      ))}
    </div>
  );
}

function AIFallback() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px" }}>
      <SkeletonCard lines={2} style={{ height: 100, marginBottom: 20 }} />
      <SkeletonCard lines={4} style={{ height: 200 }} />
    </div>
  );
}

function JournalFallback() {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[1, 2, 3, 4].map(i => (
          <SkeletonCard key={i} lines={1} style={{ height: 80 }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16 }}>
        <SkeletonCard lines={3} style={{ height: 180 }} />
        <SkeletonCard lines={4} style={{ height: 180 }} />
      </div>
    </div>
  );
}

function InnerAppContent() {
  const [loadingScreen, setLoadingScreen] = useState(true);
  const { t, user, setUser, page, activeTab, setPage, authModal, setAuthModal, login, logout, isInitializing } = useAppContext();
  const [showRobot, setShowRobot] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Keyboard navigation shortcuts
  useKeyboardShortcuts(setPage, setAuthModal);

  // Show robot guide for first-time visitors
  useEffect(() => {
    const seen = localStorage.getItem("sj_guide_seen");
    if (!seen) {
      setTimeout(() => setShowRobot(true), 2500);
    }
  }, []);

  // Offline detector
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Guard: chờ session load để tránh flash "logged out" khi app khởi động
  if (isInitializing) {
    return (
      <ThemeProvider>
        <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%,#0a1835 0%,#07091d 60%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(167,139,250,0.3)", borderTop: "3px solid #a78bfa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      </ThemeProvider>
    );
  }

  if (loadingScreen) {
    return (
      <ThemeProvider>
        <LoadingScreen onDone={() => setLoadingScreen(false)} t={t} />
      </ThemeProvider>
    );
  }

  if (isOffline) {
    return (
      <ThemeProvider>
        <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%,#0a1835 0%,#07091d 60%)", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 50, marginBottom: 16 }}>📡</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "#f87171" }}>{t.offline_title || "Mất kết nối mạng"}</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 32, maxWidth: 400, lineHeight: 1.6 }}>
            {t.offline_desc || "Có vẻ bạn đã bị ngắt kết nối Internet. Trong lúc chờ đợi, hãy thư giãn với khu vườn cát Zen nhé."}
          </p>
          <div style={{ width: "100%", maxWidth: 600, background: "rgba(255,255,255,0.03)", padding: 24, borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)" }}>
            <PopItGame />
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 32 }}>{t.offline_retry || "Ứng dụng sẽ tự động tải lại khi có mạng."}</p>
        </div>
      </ThemeProvider>
    );
  }

  const renderRoutes = () => (
    <Routes>
      <Route path="/" element={<PageWrapper><HomePage onAuthClick={setAuthModal} /></PageWrapper>} />
      <Route path="/journal" element={
        <ProtectedRoute>
          <Suspense fallback={<JournalFallback />}>
            <PageWrapper><JournalPage /></PageWrapper>
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <PageWrapper>
            <ProfilePage
              user={user}
              onUpdate={u => { setUser(u); UserStore.saveSession(u); }}
              onLogout={logout}
              setPage={setPage}
              t={t}
            />
          </PageWrapper>
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          <Suspense fallback={<ChatFallback />}>
            <PageWrapper><ChatbotPage /></PageWrapper>
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/letter" element={<PageWrapper><FutureLetterPage /></PageWrapper>} />
      <Route path="/checkout-mock" element={<PageWrapper><CheckoutMockPage /></PageWrapper>} />
      <Route path="/citation-demo" element={<PageWrapper><CitationDemoPage /></PageWrapper>} />
      
      {/* Portal Hubs */}
      <Route path="/portal_ai" element={<PageWrapper><AIHub /></PageWrapper>} />
      <Route path="/portal_moments" element={<PageWrapper><MomentsHub /></PageWrapper>} />
      
      <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
    </Routes>
  );

  return (
    <ThemeProvider>
      <ToastProvider>
        <div style={{
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
          minHeight: "100vh",
          color: "var(--text-primary, white)",
          position: "relative",
        }}>
          <a href="#main-content" className="skip-link">{t.skip_nav || "Bỏ qua điều hướng"}</a>
          <AuraBackground />
          <StarField />
          <CursorTrail />

          <Nav />

          <main
            key={page}
            style={{ animation: "pageIn .4s ease", position: "relative", zIndex: 1 }}
            id="main-content"
            role="main"
          >
            <ErrorBoundary t={t}>
              <Suspense fallback={<PageFallback />}>
                {renderRoutes()}
              </Suspense>
            </ErrorBoundary>
          </main>

          {/* Auth Modal */}
          {authModal && (
            <AuthModal
              mode={authModal}
              onClose={() => setAuthModal(null)}
              onSuccess={async (u) => { await login(u); setAuthModal(null); }}
              t={t}
            />
          )}

          {/* Mobile Bottom Tab Bar */}
          <nav
            className={styles.mobileTabBar}
            aria-label="Mobile navigation"
            role="navigation"
          >
            {[
              { id: "home",    icon: <IconHome />, label: t.nav_home || "Home" },
              { id: "ai",      icon: <IconAI />, label: t.nav_ai || "AI" },
              { id: "journal", icon: <IconJournal />, label: t.nav_journal || "Journal" },
              { id: "chat",    icon: <IconChat />, label: t.nav_chat || "Chat" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPage(tab.id)}
                aria-label={tab.label}
                aria-current={activeTab === tab.id ? "page" : undefined}
                className={styles.tabButton}
                style={{
                  color: activeTab === tab.id ? "#a78bfa" : "var(--text-secondary, rgba(255,255,255,0.4))",
                }}
              >
                <span className={styles.tabIcon}>{tab.icon}</span>
                <span className={styles.tabLabel} style={{ fontWeight: activeTab === tab.id ? 700 : 400 }}>
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <div className={styles.tabIndicator} />
                )}
              </button>
            ))}
          </nav>



          {/* Zen Sanctuary Meditation & Ambient Sound Mixer Dock */}
          <ZenMeditationDock />

          {/* Floating Robot (Global except Chat Page) */}
          {page !== "chat" && <FloatingRobot onClick={() => setShowRobot(true)} color="#6c3de8" />}

          {/* Robot Guide (Global except Chat Page) */}
          {page !== "chat" && showRobot && (
            <RobotGuide
              onClose={() => {
                setShowRobot(false);
                localStorage.setItem("sj_guide_seen", "1");
              }}
            />
          )}

          {/* Footer */}
          <footer style={{
            background: "linear-gradient(to top,rgba(7,9,29,1),rgba(10,12,35,0.95))",
            borderTop: "1px solid rgba(108,61,232,0.15)",
            padding: "48px 24px 32px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0 }}>
                © 2025 EPIONARA · Made with 💜 · AI-powered Psychology Platform
              </p>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

function InnerApp() {
  return (
    <AppProvider>
      <SoundEffectsProvider>
        <InnerAppContent />
      </SoundEffectsProvider>
    </AppProvider>
  );
}

const router = createBrowserRouter([{ path: "*", element: <InnerApp /> }]);

export default function App() {
  return <RouterProvider router={router} />;
}
