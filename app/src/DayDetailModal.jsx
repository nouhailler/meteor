// ─── DayDetailModal.jsx ───────────────────────────────────────────────────────
// Modal "détail d'une journée" — s'ouvre au clic sur une carte des 7 jours.
// Affiche : lever/coucher soleil, précipitations, UV, vent, température horaire.

import { useEffect } from "react";
import { Icon } from "./Layout.jsx";
import { useWeatherCtx, toDisplayTemp } from "./WeatherContext.jsx";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// Couleur UV
function uvColor(uv) {
  if (uv <= 2)  return "#4ade80";
  if (uv <= 5)  return "#f0cf59";
  if (uv <= 7)  return "#fb923c";
  if (uv <= 10) return "#f87171";
  return "#c084fc";
}

export default function DayDetailModal({ day, onClose }) {
  const { hourly, prefs } = useWeatherCtx();
  const T = (c) => toDisplayTemp(c, prefs.unit);
  const sym = prefs.unit === "F" ? "°F" : "°C";

  // Fermer sur Echap
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!day) return null;

  // Données horaires pour le mini-graphique (on prend les 24h disponibles)
  const labels = hourly.map(h => h.time);
  const temps  = hourly.map(h => T(h.temp));

  const chartData = {
    labels,
    datasets: [{
      data:            temps,
      borderColor:     "#5bb1ff",
      backgroundColor: "rgba(91,177,255,0.10)",
      borderWidth:     2,
      pointRadius:     0,
      pointHoverRadius:4,
      pointHoverBackgroundColor:"#5bb1ff",
      fill:            true,
      tension:         0.4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: "easeOutQuart" },
    plugins: { legend:{ display:false }, tooltip:{
      backgroundColor:"rgba(12,25,52,0.95)",
      titleColor:"#dee5ff", bodyColor:"#9baad6",
      borderColor:"rgba(91,177,255,0.3)", borderWidth:1,
      callbacks:{ label: ctx => ` ${ctx.raw}${sym}` },
    }},
    scales: {
      x: { grid:{ color:"rgba(255,255,255,0.04)" }, ticks:{ color:"#9baad6", font:{size:10}, maxTicksLimit:8 } },
      y: { grid:{ color:"rgba(255,255,255,0.04)" }, ticks:{ color:"#9baad6", font:{size:10}, callback: v => `${v}°` } },
    },
  };

  const infoRows = [
    { icon:"arrow_upward",   label:"Max",         val:`${T(day.high)}${sym}`,  col:"#5bb1ff" },
    { icon:"arrow_downward", label:"Min",         val:`${T(day.low)}${sym}`,   col:"#c5c0ff" },
    { icon:"rainy",          label:"Précipitations",val:`${day.precip} mm`,    col:"#60a5fa" },
    { icon:"water_drop",     label:"Prob. pluie", val:`${day.precipProb ?? 0}%`,col:"#9baad6" },
    { icon:"air",            label:"Vent max",    val:`${day.windMax ?? "—"} km/h`,col:"#6d60e9" },
    { icon:"sunny",          label:"UV max",      val:`${day.uvMax}`,          col:uvColor(day.uvMax) },
    { icon:"wb_twilight",    label:"Lever",       val:day.sunrise ?? "—",      col:"#f0cf59" },
    { icon:"nights_stay",    label:"Coucher",     val:day.sunset  ?? "—",      col:"#c5c0ff" },
  ];

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:1000,
        backgroundColor:"rgba(6,14,32,0.75)",
        backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        animation:"fadeIn 0.2s ease",
      }}
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"min(680px, 95vw)",
          backgroundColor:"#0c1934",
          border:"1px solid rgba(91,177,255,0.15)",
          borderRadius:28,
          padding:32,
          animation:"slideUp 0.25s ease",
          maxHeight:"90vh",
          overflowY:"auto",
        }}
      >
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
              <Icon name={day.icon} size={32} filled style={{ color:"#5bb1ff" }}/>
              <h2 style={{ fontSize:26, fontWeight:900, fontFamily:"'Manrope',sans-serif", color:"#fff", margin:0 }}>
                {day.dayFull}
              </h2>
            </div>
            <p style={{ fontSize:14, color:"#9baad6", margin:0 }}>{day.date} · {day.condition ?? ""}</p>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:10, cursor:"pointer", color:"#9baad6",
            display:"flex", padding:8,
          }}>
            <Icon name="close" size={20}/>
          </button>
        </div>

        {/* Grille infos */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:28 }}>
          {infoRows.map((row, i) => (
            <div key={i} style={{
              backgroundColor:"rgba(255,255,255,0.04)",
              borderRadius:14, padding:"14px 12px",
              border:"1px solid rgba(255,255,255,0.06)",
              display:"flex", flexDirection:"column", gap:6,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <Icon name={row.icon} size={14} style={{ color:row.col }}/>
                <span style={{ fontSize:11, color:"#9baad6", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>{row.label}</span>
              </div>
              <span style={{ fontSize:18, fontWeight:700, fontFamily:"'Manrope',sans-serif", color:"#fff" }}>{row.val}</span>
            </div>
          ))}
        </div>

        {/* Graphique températures horaires */}
        <div style={{
          backgroundColor:"rgba(255,255,255,0.03)",
          borderRadius:16, padding:20,
          border:"1px solid rgba(255,255,255,0.06)",
        }}>
          <p style={{ fontSize:12, fontWeight:700, color:"#9baad6", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 16px" }}>
            Température horaire (données actuelles)
          </p>
          <div style={{ height:160 }}>
            <Line data={chartData} options={chartOptions}/>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
