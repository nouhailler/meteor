import { useState } from "react";
import { t, shared } from "../tokens.js";
import { Icon } from "../Layout.jsx";
import { useWeatherCtx, toDisplayTemp } from "../WeatherContext.jsx";
import { useHistorical } from "../hooks/useHistorical.js";
import { LoadingSpinner, ErrorState } from "../LoadingState.jsx";

const PERIODS = [
  { label:"7 Jours",  days:7  },
  { label:"30 Jours", days:30 },
  { label:"90 Jours", days:90 },
];

const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];

function avg(arr) {
  const v = arr.filter(x => x != null);
  return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null;
}

export default function HistoriquePage() {
  const { location, prefs }    = useWeatherCtx();
  const [periodIdx, setPeriod] = useState(1);
  const days = PERIODS[periodIdx].days;

  const { data, loading, error } = useHistorical(location.lat, location.lon, days);

  const unit = prefs.unit;
  const T    = (c) => c != null ? toDisplayTemp(c, unit) : "—";

  if (loading) return <LoadingSpinner message="Chargement de l'historique…"/>;
  if (error)   return <ErrorState message={error}/>;

  const rows      = data?.rows      ?? [];
  const chartMax  = data?.chartMax  ?? [];
  const chartMin  = data?.chartMin  ?? [];

  const avgTemp    = data?.avgTemp    != null ? T(data.avgTemp)    : "—";
  const totalPrecip= data?.totalPrecip!= null ? data.totalPrecip.toFixed(1) : "—";
  const avgWind    = data?.avgWind    != null ? Math.round(data.avgWind)    : "—";

  // Graphique : normaliser sur min-max global
  const allTemps = [...chartMax, ...chartMin].filter(v => v != null);
  const tMin = Math.min(...allTemps);
  const tMax = Math.max(...allTemps, tMin + 1);
  const toY = (v) => v != null ? Math.round(((tMax - v) / (tMax - tMin)) * 160 + 20) : 100;

  // SVG polyline
  const n = chartMax.length;
  const xStep = n > 1 ? 1000 / (n - 1) : 500;
  const pointsMax = chartMax.map((v, i) => `${i * xStep},${toY(v)}`).join(" ");
  const pointsMin = chartMin.map((v, i) => `${i * xStep},${toY(v)}`).join(" ");
  const areaPath  = chartMax.length
    ? `M${chartMax.map((v,i)=>`${i*xStep},${toY(v)}`).join(" L")} L${(n-1)*xStep},200 L0,200 Z`
    : "";

  // Axe X : quelques labels
  const xLabels = (() => {
    if (!data?.startDate || !data?.endDate) return [];
    const start = new Date(data.startDate);
    const end   = new Date(data.endDate);
    const total = chartMax.length;
    const step  = Math.max(1, Math.floor(total / 5));
    return Array.from({length: Math.ceil(total / step)}, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i * step);
      return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    });
  })();

  // Export CSV
  function exportCSV() {
    const header = "Date,Max,Min,Précipitations (mm),Vent max (km/h),Conditions\n";
    const body   = rows.map(r =>
      `${r.date},${r.high ?? ""},${r.low ?? ""},${r.precip},${r.wind ?? ""},${r.weatherCode}`
    ).join("\n");
    const blob = new Blob([header + body], { type:"text/csv" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `historique_${location.city}_${days}j.csv`;
    a.click();
  }

  return (
    <div style={{ ...shared.content, paddingTop:32 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:40 }}>
        <div>
          <nav style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:t.onSurfaceVariant, marginBottom:8 }}>
            <span>Archives</span>
            <Icon name="arrow_forward_ios" size={10}/>
            <span style={{ color:t.primary }}>{location.city}, {location.country}</span>
          </nav>
          <h1 style={shared.pageTitle}>Historique Météo</h1>
        </div>
        <div style={{ display:"flex", backgroundColor:t.surfaceContainerHigh, padding:4, borderRadius:16, gap:4 }}>
          {PERIODS.map((p, i) => (
            <button key={i} onClick={() => setPeriod(i)} style={{
              padding:"8px 16px", borderRadius:12, fontSize:13,
              fontWeight:i===periodIdx?700:400,
              backgroundColor:i===periodIdx?t.primary:"transparent",
              color:i===periodIdx?t.onPrimaryContainer:t.onSurfaceVariant,
              border:"none", cursor:"pointer", fontFamily:"'Inter',sans-serif",
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Résumé 3 cartes */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24, marginBottom:32 }}>
        {[
          { icon:"thermostat", col:t.primary,    label:"Température Moyenne", val:avgTemp,     unit:unit==="F"?"°F":"°C" },
          { icon:"rainy",      col:t.secondary,  label:"Précipitations",      val:totalPrecip, unit:"mm" },
          { icon:"air",        col:t.tertiaryDim,label:"Vent Moyen",          val:avgWind,     unit:"km/h" },
        ].map((c, i) => (
          <div key={i} style={{ background:t.glassDark, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:28, padding:24, border:"1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ padding:10, backgroundColor:`${c.col}18`, borderRadius:12, display:"inline-flex", marginBottom:12 }}>
              <Icon name={c.icon} size={20} style={{ color:c.col }}/>
            </div>
            <p style={{ fontSize:13, color:t.onSurfaceVariant, marginBottom:4 }}>{c.label}</p>
            <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
              <span style={{ fontSize:36, fontWeight:900, fontFamily:"'Manrope',sans-serif", color:"#fff" }}>{c.val}</span>
              <span style={{ fontSize:20, fontWeight:300, color:c.col }}>{c.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Graphique températures */}
      <div style={{ background:t.glassDark, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:32, padding:32, border:"1px solid rgba(255,255,255,0.05)", marginBottom:32 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <h3 style={{ fontSize:18, fontWeight:700, color:"#fff", margin:0 }}>Tendances de Température</h3>
            <p style={{ fontSize:13, color:t.onSurfaceVariant, marginTop:4 }}>Données réelles · Open-Meteo Archive</p>
          </div>
          <div style={{ display:"flex", gap:16 }}>
            {[{col:t.primary,label:"Max"},{col:t.secondary,label:"Min"}].map((l,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:10, height:10, borderRadius:"50%", backgroundColor:l.col }}/>
                <span style={{ fontSize:12, color:t.onSurfaceVariant }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height:200, position:"relative" }}>
          <svg width="100%" height="200" viewBox="0 0 1000 200" preserveAspectRatio="none" style={{ overflow:"visible" }}>
            <defs>
              <linearGradient id="gp" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={t.primary} stopOpacity="0.25"/>
                <stop offset="100%" stopColor={t.primary} stopOpacity="0"/>
              </linearGradient>
            </defs>
            {[40,80,120,160].map(y=>(
              <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke={t.outlineVariant} strokeOpacity="0.15" strokeDasharray="4"/>
            ))}
            {areaPath && <path d={areaPath} fill="url(#gp)"/>}
            {pointsMax && <polyline points={pointsMax} fill="none" stroke={t.primary}   strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>}
            {pointsMin && <polyline points={pointsMin} fill="none" stroke={t.secondary} strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" opacity="0.7"/>}
          </svg>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:12, fontSize:10, color:t.onSurfaceVariant, fontWeight:700, textTransform:"uppercase" }}>
          {xLabels.map(l => <span key={l}>{l}</span>)}
        </div>
      </div>

      {/* Tableau */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h3 style={shared.sectionTitle}>Registres Quotidiens</h3>
        <button onClick={exportCSV} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:t.primary, fontSize:13, fontWeight:700, cursor:"pointer" }}>
          <Icon name="download" size={16}/> Exporter CSV
        </button>
      </div>
      <div style={{ background:t.glassDark, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:24, overflow:"hidden", border:"1px solid rgba(255,255,255,0.05)", marginBottom:32 }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'Inter',sans-serif" }}>
          <thead>
            <tr style={{ backgroundColor:"rgba(255,255,255,0.04)" }}>
              {["Date","Max / Min","Conditions","Précipitations"].map((h,i)=>(
                <th key={i} style={{ padding:"14px 24px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.15em", color:t.onSurfaceVariant, textAlign:i===3?"right":i===1?"center":"left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 30).map((r, i) => (
              <tr key={i} style={{ borderTop:"1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding:"12px 24px" }}>
                  <div style={{ fontWeight:700, color:"#fff", fontSize:14 }}>{r.day}</div>
                  <div style={{ fontSize:12, color:t.onSurfaceVariant }}>{r.date}</div>
                </td>
                <td style={{ padding:"12px 24px", textAlign:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                    <span style={{ fontWeight:700, color:t.primary }}>{T(r.high)}°</span>
                    <div style={{ width:40, height:3, backgroundColor:t.surfaceContainerHighest, borderRadius:9999 }}/>
                    <span style={{ color:t.secondary }}>{T(r.low)}°</span>
                  </div>
                </td>
                <td style={{ padding:"12px 24px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <Icon name={r.icon} size={18} filled style={{ color:t.onSurfaceVariant }}/>
                    <span style={{ fontSize:13 }}>Code {r.weatherCode}</span>
                  </div>
                </td>
                <td style={{ padding:"12px 24px", textAlign:"right" }}>
                  <span style={{ fontSize:13, fontFamily:"monospace", color:parseFloat(r.precip)>5?t.secondary:t.onSurfaceVariant, fontWeight:parseFloat(r.precip)>5?700:400 }}>
                    {r.precip} mm
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 30 && (
          <div style={{ padding:16, backgroundColor:"rgba(255,255,255,0.03)", textAlign:"center" }}>
            <span style={{ fontSize:12, color:t.onSurfaceVariant }}>Utilisez l'export CSV pour voir les {rows.length} jours complets</span>
          </div>
        )}
      </div>
    </div>
  );
}
