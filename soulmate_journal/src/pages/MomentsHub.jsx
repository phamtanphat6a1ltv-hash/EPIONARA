import { useState } from "react";
import JournalPage from "./JournalPage.jsx";
import FutureLetterPage from "./FutureLetterPage.jsx";
import { BackButton } from "../components/UIComponents.jsx";
import { useAppContext } from "../context/AppContext.jsx";
import { IconJournal, IconLetter } from "../components/BrandingIcons.jsx";

function MomentsHub() {
  const { setPage, t } = useAppContext();
  const [activeTab, setActiveTab] = useState("journal");

  const tabs = [
    { id: "journal", label: t.nav_journal, icon: <IconJournal /> },
    { id: "letter", label: t.nav_letter, icon: <IconLetter /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "journal": return <JournalPage minimal={true} />;
      case "letter": return <FutureLetterPage minimal={true} />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", paddingTop: 80 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <BackButton onClick={() => setPage("home")} label={"← " + t.nav_home} />
          
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "12px",
                  border: "none",
                  background: activeTab === tab.id ? "linear-gradient(135deg,#6c3de8,#8b5cf6)" : "transparent",
                  color: activeTab === tab.id ? "white" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <span>{tab.icon}</span>
                <span className="hide-mobile">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ animation: "fadeInUp 0.5s ease" }}>
          {renderContent()}
        </div>
      </div>
      <style>{`
        @media (max-width: 600px) {
          .hide-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}

export default MomentsHub;
