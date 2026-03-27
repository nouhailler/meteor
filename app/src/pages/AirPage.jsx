import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Tooltip, Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { t, shared } from "../tokens.js";
import { Icon } from "../Layout.jsx";
import { useWeatherCtx } from "../WeatherContext.jsx";
import { LoadingSpinner, ErrorState } from "../LoadingState.jsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ─── Jauge circulaire IQA ─────────────────────────────────────────────────────
function AqiGauge({ value = 0 }) {
  const r    = 110;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(value / 150, 1);
  const dash = circ * pct;
  const color =
    value <= 25  ? "#4ade80" :
    value <= 50  ? "#a3e635" :
    value <= 75  ? "#f0cf59" :
    value <= 100 ? "#fb923c" :
                   "#f87171";
  const label =
    value <= 25  ? "BON"        :
    value <= 50  ? "ASSEZ BON"  :
    value <= 75  ? "MODÉRÉ"     :
    value <= 100 ? "MÉDIOCRE"   :
                   "MAUVAIS";
  return (
    <div style={{ position:"relative", width:256, height:256 }}>
      <svg width="256" height="256" style={{ transform:"rotate(-90deg)" }}>
        <circle cx="128" cy="128" r={r} fill="transparent" stroke={t.surfaceContainerHighest} strokeWidth="12"/>
        <circle cx="128" cy="128" r={r} fill="transparent"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:72, fontWeight:900, fontFamily:"'Manrope',sans-serif", color:"#fff", lineHeight:1 }}>{value}</span>
        <span style={{ fontSize:13, fontWeight:700, color, letterSpacing:"0.15em", marginTop:8 }}>{label}</span>
      </div>
    </div>
  );
}

const CHART_H = 180;

// ─── Graphique barres IQA 24h ─────────────────────────────────────────────────
function AqiBarChart({ forecast24h }) {
  const labels = forecast24h.map(h => `${h.hour}h`);
  const values = forecast24h.map(h => h.aqi);
  const maxVal = Math.max(...values, 1);

  const data = {
    labels,
    datasets: [{
      label: "IQA",
      data:  values,
      backgroundColor: values.map(v =>
        v <= 25  ? "rgba(74,222,128,0.7)"  :
        v <= 50  ? "rgba(163,230,53,0.7)"  :
        v <= 75  ? "rgba(240,207,89,0.7)"  :
        v <= 100 ? "rgba(251,146,60,0.7)"  :
                   "rgba(248,113,113,0.7)"
      ),
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(12,25,52,0.95)",
        titleColor: "#dee5ff",
        bodyColor:  "#9baad6",
        borderColor: "rgba(91,177,255,0.3)",
        borderWidth: 1,
        callbacks: { label: ctx => ` IQA : ${ctx.raw}` },
      },
    },
    scales: {
      x: {
        grid:  { color:"rgba(255,255,255,0.05)", drawBorder:false },
        ticks: { color:"#9baad6", font:{ size:10, family:"Inter" }, maxTicksLimit:12 },
      },
      y: {
        grid:  { color:"rgba(255,255,255,0.05)", drawBorder:false },
        ticks: { color:"#9baad6", font:{ size:10, family:"Inter" } },
        min: 0,
        suggestedMax: Math.max(maxVal + 10, 60),
      },
    },
  };

  return (
    <div style={{ height: CHART_H }}>
      <Bar data={data} options={options}/>
    </div>
  );
}

const RECO = [
  { icon:"masks",          col:"#5bb1ff", title:"Portez un masque",     text:"Recommandé pour les personnes sensibles lors de longs trajets." },
  { icon:"fitness_center", col:"#f0cf59", title:"Activités physiques",  text:"Réduisez les exercices intenses en extérieur cet après-midi." },
  { icon:"air",            col:"#5bb1ff", title:"Aération",             text:"Privilégiez l'aération de votre domicile tôt le matin." },
];

export default function AirPage() {
  const { location, aq, airQuality } = useWeatherCtx();
  // "live" = vue actuelle (jauge + polluants) | "history" = historique 24h
  const [view, setView] = useState("live");

  if (airQuality.loading) return <LoadingSpinner message="Chargement de la qualité de l'air…"/>;
  if (airQuality.error)   return <ErrorState message={airQuality.error}/>;

  const aqi         = aq?.aqi         ?? 0;
  const pollutants  = aq?.pollutants  ?? [];
  const forecast24h = aq?.forecast24h ?? [];
  const maxPct      = Math.max(...forecast24h.map(h => h.pct), 1);

  const aqiDescr =
    aqi <= 25  ? "La qualité de l'air est excellente — aucune restriction recommandée." :
    aqi <= 50  ? "Qualité bonne — activités normales en extérieur possibles." :
    aqi <= 75  ? "Qualité acceptable, risque modéré pour les personnes sensibles." :
    aqi <= 100 ? "Qualité médiocre — réduire les activités intenses en extérieur." :
                 "Qualité mauvaise — évitez les sorties prolongées.";

  return (
    <div style={{ ...shared.content, paddingTop:32 }}>

      {/* ── En-tête avec onglets ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:40 }}>
        <div>
          <h1 style={shared.pageTitle}>{location.city}, {location.country}</h1>
          <p style={shared.pageSub}>Mis à jour en temps réel · Open-Meteo Air Quality</p>
        </div>

        {/* Sélecteur de vue — EN DIRECT / Historique 24h */}
        <div style={{ display:"flex", backgroundColor:t.surfaceContainerHigh, padding:4, borderRadius:14, gap:4 }}>
          {[
            { id:"live",    label:"EN DIRECT",    icon:"sensors"  },
            { id:"history", label:"Historique 24h", icon:"history" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                display:"flex", alignItems:"center", gap:7,
                padding:"8px 16px", borderRadius:11, border:"none", cursor:"pointer",
                fontFamily:"'Inter',sans-serif", fontSize:13,
                fontWeight: view === tab.id ? 700 : 400,
                backgroundColor: view === tab.id ? t.primary : "transparent",
                color:           view === tab.id ? t.onPrimaryContainer : t.onSurfaceVariant,
                transition: "all 0.15s",
              }}
            >
              <Icon name={tab.icon} size={15} style={{ color:"inherit" }}/>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════ VUE EN DIRECT ══════════════════ */}
      {view === "live" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(12,1fr)", gap:32 }}>

          {/* Jauge IQA */}
          <div style={{ gridColumn:"span 5", ...shared.glass, padding:32, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:"-80px", right:"-80px", width:240, height:240, borderRadius:"50%", background:`radial-gradient(circle,${t.primary}18 0%,transparent 70%)` }}/>
            <p style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.15em", color:t.onSurfaceVariant, marginBottom:24 }}>Indice de Qualité de l'Air (IQA)</p>
            <AqiGauge value={aqi}/>
            <p style={{ fontSize:13, color:t.onSurfaceVariant, textAlign:"center", maxWidth:280, lineHeight:1.6, marginTop:20 }}>
              {aqiDescr}
            </p>
          </div>

          {/* Polluants */}
          <div style={{ gridColumn:"span 7", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {pollutants.map((p, i) => (
              <div key={i} style={{ backgroundColor:t.surfaceContainerLow, borderRadius:24, padding:20, border:"1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:t.onSurfaceVariant, marginBottom:6 }}>{p.label}</p>
                <p style={{ fontSize:22, fontWeight:700, fontFamily:"'Manrope',sans-serif", color:"#fff", margin:0 }}>
                  {p.val} <span style={{ fontSize:11, fontWeight:400, color:t.onSurfaceVariant }}>{p.unit}</span>
                </p>
                <div style={{ marginTop:12, height:3, backgroundColor:t.surfaceContainerHighest, borderRadius:9999, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${p.pct}%`, backgroundColor:p.col, borderRadius:9999 }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Recommandations */}
          <div style={{ gridColumn:"span 12" }}>
            <h3 style={shared.sectionTitle}>Recommandations Santé</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {RECO.map((r, i) => (
                <div key={i} style={{ backgroundColor:t.surfaceContainer, borderRadius:24, padding:20, display:"flex", alignItems:"flex-start", gap:14 }}>
                  <div style={{ width:44, height:44, borderRadius:16, backgroundColor:`${r.col}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon name={r.icon} size={22} style={{ color:r.col }}/>
                  </div>
                  <div>
                    <p style={{ fontWeight:700, color:"#fff", marginBottom:4, fontSize:14 }}>{r.title}</p>
                    <p style={{ fontSize:12, color:t.onSurfaceVariant, lineHeight:1.5 }}>{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ VUE HISTORIQUE 24H ══════════════════ */}
      {view === "history" && (
        <div style={{ display:"flex", flexDirection:"column", gap:28 }}>

          {/* Résumé */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {[
              { icon:"sensors",   col:t.primary,    label:"IQA actuel",   val:aqi,                                        unit:"" },
              { icon:"trending_up",col:t.tertiaryDim,label:"IQA max 24h", val:Math.max(...forecast24h.map(h=>h.aqi),0),   unit:"" },
              { icon:"trending_down",col:"#4ade80",  label:"IQA min 24h", val:Math.min(...forecast24h.map(h=>h.aqi),999), unit:"" },
            ].map((c, i) => (
              <div key={i} style={{ background:t.glassDark, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:24, padding:22, border:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ padding:9, backgroundColor:`${c.col}18`, borderRadius:11, display:"inline-flex", marginBottom:10 }}>
                  <Icon name={c.icon} size={18} style={{ color:c.col }}/>
                </div>
                <p style={{ fontSize:13, color:t.onSurfaceVariant, marginBottom:3 }}>{c.label}</p>
                <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                  <span style={{ fontSize:40, fontWeight:900, fontFamily:"'Manrope',sans-serif", color:"#fff" }}>{c.val}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Graphique barres Chart.js */}
          <div style={{ background:t.glassDark, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:28, padding:28, border:"1px solid rgba(255,255,255,0.05)" }}>
            <h3 style={{ fontSize:16, fontWeight:700, fontFamily:"'Manrope',sans-serif", color:"#fff", margin:"0 0 6px" }}>
              Évolution de l'IQA sur 24h
            </h3>
            <p style={{ fontSize:12, color:t.onSurfaceVariant, margin:"0 0 20px" }}>
              Indice de qualité de l'air · Open-Meteo Air Quality
            </p>

            {forecast24h.length > 0
              ? <AqiBarChart forecast24h={forecast24h}/>
              : <div style={{ height:CHART_H, display:"flex", alignItems:"center", justifyContent:"center", color:t.onSurfaceVariant }}>
                  Données 24h non disponibles
                </div>
            }

            {/* Légende couleurs */}
            <div style={{ display:"flex", gap:16, marginTop:16, flexWrap:"wrap" }}>
              {[
                { col:"#4ade80", label:"Bon (0–25)"         },
                { col:"#a3e635", label:"Assez bon (26–50)"  },
                { col:"#f0cf59", label:"Modéré (51–75)"     },
                { col:"#fb923c", label:"Médiocre (76–100)"  },
                { col:"#f87171", label:"Mauvais (>100)"     },
              ].map((l, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:3, backgroundColor:l.col }}/>
                  <span style={{ fontSize:11, color:t.onSurfaceVariant }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau détaillé heure par heure */}
          <div style={{ background:t.glassDark, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:22, overflow:"hidden", border:"1px solid rgba(255,255,255,0.05)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'Inter',sans-serif" }}>
              <thead>
                <tr style={{ backgroundColor:"rgba(255,255,255,0.04)" }}>
                  {["Heure","IQA","Qualité","Barre"].map((h, i) => (
                    <th key={i} style={{ padding:"12px 20px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.15em", color:t.onSurfaceVariant, textAlign:i===1?"center":"left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forecast24h.map((h, i) => {
                  const color =
                    h.aqi <= 25  ? "#4ade80" :
                    h.aqi <= 50  ? "#a3e635" :
                    h.aqi <= 75  ? "#f0cf59" :
                    h.aqi <= 100 ? "#fb923c" :
                                   "#f87171";
                  const qualLabel =
                    h.aqi <= 25  ? "Bon"        :
                    h.aqi <= 50  ? "Assez bon"  :
                    h.aqi <= 75  ? "Modéré"     :
                    h.aqi <= 100 ? "Médiocre"   :
                                   "Mauvais";
                  return (
                    <tr key={i} style={{ borderTop:"1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor="rgba(91,177,255,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor="transparent"}>
                      <td style={{ padding:"10px 20px", fontWeight:700, color:"#fff", fontSize:14 }}>{h.hour}h00</td>
                      <td style={{ padding:"10px 20px", textAlign:"center", fontWeight:900, fontFamily:"'Manrope',sans-serif", fontSize:16, color }}>{h.aqi}</td>
                      <td style={{ padding:"10px 20px", fontSize:13, color }}>{qualLabel}</td>
                      <td style={{ padding:"10px 20px" }}>
                        <div style={{ height:6, width:"100%", backgroundColor:t.surfaceContainerHighest, borderRadius:9999, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${Math.min((h.aqi/150)*100,100)}%`, backgroundColor:color, borderRadius:9999, transition:"width 0.3s" }}/>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
