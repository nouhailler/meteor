import { useState, useEffect } from "react";
import { WeatherProvider } from "./WeatherContext.jsx";
import Layout from "./Layout.jsx";
import WeatherDashboard from "./WeatherDashboard.jsx";
import CartesPage       from "./pages/CartesPage.jsx";
import AirPage          from "./pages/AirPage.jsx";
import HistoriquePage   from "./pages/HistoriquePage.jsx";
import ParamètresPage   from "./pages/ParamètresPage.jsx";

function useGlobalStyles() {
  useEffect(() => {
    const linkId = "atm-fonts";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId; link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;900&family=Inter:wght@300;400;500;600&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap";
      document.head.appendChild(link);
    }
    const styleId = "atm-styles";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = `
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .wni:hover { color:#dee5ff!important; background-color:rgba(255,255,255,0.05)!important; }
        .wmc:hover { border-color:rgba(91,177,255,0.2)!important; }
        .whc:hover { background-color:#101e3e!important; }
        .wwc:hover { border-color:rgba(91,177,255,0.25)!important; }
        .page-enter { animation: fadeInUp 0.35s ease forwards; }

        /* ── Scrollbar large et cliquable ── */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
        }
        ::-webkit-scrollbar-thumb {
          background: #38476d;
          border-radius: 8px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #5bb1ff;
          background-clip: content-box;
          border: 2px solid transparent;
        }
        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: #38476d rgba(255,255,255,0.03);
        }
      `;
      document.head.appendChild(el);
    }
  }, []);
}

function PageContent({ page }) {
  switch (page) {
    case "dashboard":  return <WeatherDashboard />;
    case "cartes":     return <CartesPage />;
    case "air":        return <AirPage />;
    case "historique": return <HistoriquePage />;
    case "parametres": return <ParamètresPage />;
    default:           return <WeatherDashboard />;
  }
}

function AppInner() {
  const [page, setPage]         = useState("dashboard");
  const [transKey, setTransKey] = useState(0);
  useGlobalStyles();

  function navigate(target) {
    if (target === page) return;
    setPage(target);
    setTransKey(k => k + 1);
  }

  if (page === "dashboard") {
    return (
      <div key={transKey} className="page-enter">
        <WeatherDashboard onNavigate={navigate} currentPage={page} />
      </div>
    );
  }

  return (
    <Layout page={page} onNavigate={navigate}>
      <div key={transKey} className="page-enter">
        <PageContent page={page} />
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <WeatherProvider>
      <AppInner />
    </WeatherProvider>
  );
}
