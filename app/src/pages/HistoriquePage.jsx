import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Filler, Tooltip, Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { t, shared } from "../tokens.js";
import { Icon } from "../Layout.jsx";
import { useWeatherCtx, toDisplayTemp } from "../WeatherContext.jsx";
import { useHistorical } from "../hooks/useHistorical.js";
import { LoadingSpinner, ErrorState } from "../LoadingState.jsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

const PERIODS = [
  { label:"24h",     days:null },   // ← null = mode horaire (données du Context)
  { label:"7 Jours", days:7   },
  { label:"30 Jours",days:30  },
  { label:"90 Jours",days:90  },
];

const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];

function avg(arr) {
  const v = arr.filter(x => x!=null);
  return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null;
}

// ─── Options Chart communes ───────────────────────────────────────────────────
function baseOpts(sym) {
  return {
    responsive:true, maintainAspectRatio:false,
    animation:{ duration:900, easing:"easeOutQuart" },
    interaction:{ mode:"index", intersect:false },
    plugins:{
      legend:{ display:true, position:"top", align:"end", labels:{ color:"#9baad6", font:{size:11,family:"Inter"}, boxWidth:12, boxHeight:2, padding:16, usePointStyle:true, pointStyle:"line" } },
      tooltip:{ backgroundColor:"rgba(12,25,52,0.95)", titleColor:"#9baad6", bodyColor:"#dee5ff", borderColor:"rgba(91,177,255,0.3)", borderWidth:1, padding:10 },
    },
    scales:{
      x:{ grid:{ color:"rgba(255,255,255,0.05)", drawBorder:false }, ticks:{ color:"#9baad6", font:{size:10,family:"Inter"}, maxTicksLimit:10 } },
      y:{ grid:{ color:"rgba(255,255,255,0.05)", drawBorder:false }, ticks:{ color:"#9baad6", font:{size:10,family:"Inter"} } },
    },
  };
}

// ─── Graphique températures historiques ───────────────────────────────────────
function TempHistChart({ chartMax, chartMin, startDate, unit }) {
  const T   = c => c!=null ? toDisplayTemp(c,unit) : null;
  const sym = unit==="F" ? "°F" : "°C";
  const n   = chartMax.length;
  const step = Math.max(1,Math.floor(n/12));
  const labels = chartMax.map((_,i) => {
    if (i%step!==0 && i!==n-1) return "";
    const d = new Date(startDate); d.setDate(d.getDate()+i);
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  });
  const data = { labels, datasets:[
    { label:`Max (${sym})`, data:chartMax.map(v=>T(v)), borderColor:"#5bb1ff", backgroundColor:"rgba(91,177,255,0.12)", borderWidth:2, pointRadius:n>30?0:2, pointHoverRadius:4, fill:true, tension:0.4 },
    { label:`Min (${sym})`, data:chartMin.map(v=>T(v)), borderColor:"rgba(197,192,255,0.7)", backgroundColor:"rgba(197,192,255,0.05)", borderWidth:1.5, borderDash:[4,3], pointRadius:0, pointHoverRadius:3, fill:true, tension:0.4 },
  ]};
  const opts = { ...baseOpts(sym), plugins:{ ...baseOpts(sym).plugins, tooltip:{ ...baseOpts(sym).plugins.tooltip, callbacks:{ label:ctx=>` ${ctx.raw!=null?ctx.raw:"—"}${sym}` } } }, scales:{ ...baseOpts(sym).scales, y:{ ...baseOpts(sym).scales.y, ticks:{ ...baseOpts(sym).scales.y.ticks, callback:v=>`${v}°` } } } };
  return <Line data={data} options={opts}/>;
}

// ─── Graphique températures 24h (données horaires temps réel) ─────────────────
function TempHourlyChart({ hourly, unit }) {
  const T   = c => toDisplayTemp(c,unit);
  const sym = unit==="F" ? "°F" : "°C";
  const temps = hourly.map(h=>T(h.temp));
  const tMin  = Math.min(...temps);
  const tMax  = Math.max(...temps);
  const data  = { labels:hourly.map(h=>h.time), datasets:[
    { label:`Température (${sym})`, data:temps, borderColor:"#5bb1ff", backgroundColor:"rgba(91,177,255,0.15)", borderWidth:2.5, pointRadius:3, pointHoverRadius:6, fill:true, tension:0.45 },
  ]};
  const opts = { ...baseOpts(sym),
    plugins:{ ...baseOpts(sym).plugins, legend:{display:false}, tooltip:{ ...baseOpts(sym).plugins.tooltip, callbacks:{ label:ctx=>` ${ctx.raw}${sym}` } } },
    scales:{ ...baseOpts(sym).scales, y:{ ...baseOpts(sym).scales.y, min:tMin-3, max:tMax+3, ticks:{ ...baseOpts(sym).scales.y.ticks, stepSize:1, callback:v=>`${v}°` } } },
  };
  return <Line data={data} options={opts}/>;
}

// ─── Graphique précipitations 24h ─────────────────────────────────────────────
function PrecipHourlyChart({ hourly }) {
  const data = { labels:hourly.map(h=>h.time), datasets:[
    { label:"Prob. pluie (%)", data:hourly.map(h=>h.precipProb??0), backgroundColor:"rgba(91,177,255,0.45)", borderRadius:4, borderSkipped:false },
  ]};
  const opts = { ...baseOpts("%"), plugins:{ ...baseOpts("%").plugins, legend:{display:false}, tooltip:{ ...baseOpts("%").plugins.tooltip, callbacks:{ label:ctx=>` ${ctx.raw}%` } } }, scales:{ ...baseOpts("%").scales, y:{ ...baseOpts("%").scales.y, min:0, max:100, ticks:{ ...baseOpts("%").scales.y.ticks, callback:v=>`${v}%` } } } };
  return <Bar data={data} options={opts}/>;
}

// ─── Graphique précipitations historiques ─────────────────────────────────────
function PrecipChart({ rows }) {
  const n=rows.length, step=Math.max(1,Math.floor(n/12));
  const labels=rows.map((r,i)=>(i%step===0||i===n-1)?r.date:"");
  const data={ labels, datasets:[{ label:"Précipitations (mm)", data:rows.map(r=>parseFloat(r.precip)||0), backgroundColor:rows.map(r=>parseFloat(r.precip)>=10?"rgba(197,192,255,0.7)":"rgba(91,177,255,0.45)"), borderRadius:4, borderSkipped:false }] };
  const opts={ ...baseOpts("mm"), plugins:{ ...baseOpts("mm").plugins, legend:{display:false}, tooltip:{ ...baseOpts("mm").plugins.tooltip, callbacks:{ label:ctx=>` ${ctx.raw} mm` } } }, scales:{ ...baseOpts("mm").scales, y:{ ...baseOpts("mm").scales.y, min:0, ticks:{ ...baseOpts("mm").scales.y.ticks, callback:v=>`${v}mm` } } } };
  return <Bar data={data} options={opts}/>;
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function HistoriquePage() {
  const { location, prefs, hourly } = useWeatherCtx();
  const [periodIdx, setPeriod] = useState(1);   // défaut : 7 jours
  const [activeTab, setTab]    = useState("temp");

  const period = PERIODS[periodIdx];
  const is24h  = period.days === null;

  const { data, loading, error } = useHistorical(
    location.lat, location.lon, is24h ? 7 : period.days
  );

  const unit = prefs.unit;
  const T    = c => c!=null ? toDisplayTemp(c,unit) : "—";
  const sym  = unit==="F" ? "°F" : "°C";

  if (!is24h && loading) return <LoadingSpinner message="Chargement de l'historique…"/>;
  if (!is24h && error)   return <ErrorState message={error}/>;

  const rows     = data?.rows     ?? [];
  const chartMax = data?.chartMax ?? [];
  const chartMin = data?.chartMin ?? [];

  const avgTemp     = data?.avgTemp     != null ? T(data.avgTemp)             : "—";
  const totalPrecip = data?.totalPrecip != null ? data.totalPrecip.toFixed(1) : "—";
  const avgWind     = data?.avgWind     != null ? Math.round(data.avgWind)    : "—";
  const startDate   = data?.startDate   ?? "";

  function exportCSV() {
    const header = `Date,Max (${sym}),Min (${sym}),Précipitations (mm),Vent max (km/h)\n`;
    const body   = rows.map(r=>`${r.date},${T(r.high)},${T(r.low)},${r.precip},${r.wind??""}`).join("\n");
    const blob   = new Blob([header+body],{type:"text/csv"});
    const a      = document.createElement("a");
    a.href       = URL.createObjectURL(blob);
    a.download   = `historique_${location.city}_${period.label}.csv`;
    a.click();
  }

  // ─── Résumé 24h depuis données horaires ────────────────────────────────────
  const hourlyTemps = hourly.map(h=>h.temp).filter(v=>v!=null);
  const hourlyPrecips = hourly.map(h=>h.precipProb??0);
  const avg24hTemp  = hourlyTemps.length ? T(hourlyTemps.reduce((a,b)=>a+b,0)/hourlyTemps.length) : "—";
  const maxPrecipProb = hourlyPrecips.length ? Math.max(...hourlyPrecips) : 0;

  return (
    <div style={{ ...shared.content, paddingTop:32 }}>
      {/* En-tête */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
        <div>
          <nav style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:t.onSurfaceVariant, marginBottom:8 }}>
            <span>Archives</span>
            <Icon name="arrow_forward_ios" size={10}/>
            <span style={{ color:t.primary }}>{location.city}, {location.country}</span>
          </nav>
          <h1 style={shared.pageTitle}>Historique Météo</h1>
        </div>
        {/* Sélecteur de période */}
        <div style={{ display:"flex", backgroundColor:t.surfaceContainerHigh, padding:4, borderRadius:16, gap:4 }}>
          {PERIODS.map((p,i) => (
            <button key={i} onClick={() => { setPeriod(i); setTab("temp"); }} style={{
              padding:"8px 16px", borderRadius:12, fontSize:13,
              fontWeight:i===periodIdx?700:400,
              backgroundColor:i===periodIdx?t.primary:"transparent",
              color:i===periodIdx?t.onPrimaryContainer:t.onSurfaceVariant,
              border:"none", cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"all 0.15s",
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* ── Mode 24h (données horaires temps réel) ── */}
      {is24h && (<>
        {/* Résumé */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, marginBottom:28 }}>
          {[
            { icon:"thermostat", col:t.primary,    label:"Température moy. 24h",    val:avg24hTemp, unit:sym },
            { icon:"rainy",      col:t.secondary,  label:"Prob. pluie max",          val:maxPrecipProb, unit:"%" },
            { icon:"schedule",   col:t.tertiaryDim,label:"Données",                  val:"Temps réel", unit:"" },
          ].map((c,i) => (
            <div key={i} style={{ background:t.glassDark, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:24, padding:22, border:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ padding:9, backgroundColor:`${c.col}18`, borderRadius:11, display:"inline-flex", marginBottom:10 }}>
                <Icon name={c.icon} size={18} style={{ color:c.col }}/>
              </div>
              <p style={{ fontSize:13, color:t.onSurfaceVariant, marginBottom:3 }}>{c.label}</p>
              <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                <span style={{ fontSize:34, fontWeight:900, fontFamily:"'Manrope',sans-serif", color:"#fff" }}>{c.val}</span>
                <span style={{ fontSize:16, fontWeight:300, color:c.col }}>{c.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Graphiques horaires */}
        <div style={{ background:t.glassDark, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:28, padding:28, border:"1px solid rgba(255,255,255,0.05)", marginBottom:28 }}>
          <div style={{ display:"flex", gap:4, backgroundColor:t.surfaceContainerHigh, padding:4, borderRadius:12, marginBottom:22, width:"fit-content" }}>
            {[{id:"temp",label:"Température",icon:"thermostat"},{id:"precip",label:"Prob. pluie",icon:"rainy"}].map(tab=>(
              <button key={tab.id} onClick={()=>setTab(tab.id)} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:10,fontSize:13,fontWeight:activeTab===tab.id?700:400,backgroundColor:activeTab===tab.id?t.primary:"transparent",color:activeTab===tab.id?t.onPrimaryContainer:t.onSurfaceVariant,border:"none",cursor:"pointer" }}>
                <Icon name={tab.icon} size={14} style={{ color:"inherit" }}/>{tab.label}
              </button>
            ))}
          </div>
          <div style={{ height:240 }}>
            {activeTab==="temp"   && hourly.length>0 && <TempHourlyChart hourly={hourly} unit={unit}/>}
            {activeTab==="precip" && hourly.length>0 && <PrecipHourlyChart hourly={hourly}/>}
            {hourly.length===0 && <div style={{ height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:t.onSurfaceVariant }}>Données horaires non disponibles</div>}
          </div>
        </div>

        {/* Tableau horaire */}
        <div style={{ background:t.glassDark, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:22, overflow:"hidden", border:"1px solid rgba(255,255,255,0.05)" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'Inter',sans-serif" }}>
            <thead>
              <tr style={{ backgroundColor:"rgba(255,255,255,0.04)" }}>
                {["Heure","Icône","Température","Prob. pluie","Vent"].map((h,i)=>(
                  <th key={i} style={{ padding:"12px 20px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",color:t.onSurfaceVariant,textAlign:i>1?"right":"left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hourly.map((h,i) => (
                <tr key={i} style={{ borderTop:"1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor="rgba(91,177,255,0.04)"}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
                  <td style={{ padding:"10px 20px",fontWeight:700,color:"#fff",fontSize:14 }}>{h.time}</td>
                  <td style={{ padding:"10px 20px" }}><Icon name={h.icon} size={18} filled style={{ color:t.primary }}/></td>
                  <td style={{ padding:"10px 20px",textAlign:"right",fontWeight:700,color:t.primary }}>{T(h.temp)}°</td>
                  <td style={{ padding:"10px 20px",textAlign:"right",color:(h.precipProb??0)>50?t.secondary:t.onSurfaceVariant }}>{h.precipProb??0}%</td>
                  <td style={{ padding:"10px 20px",textAlign:"right",color:t.onSurfaceVariant }}>{h.windSpeed??0} km/h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ── Mode historique (7/30/90j) ── */}
      {!is24h && !loading && !error && (<>
        {/* Résumé */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, marginBottom:28 }}>
          {[
            { icon:"thermostat",col:t.primary,    label:"Température Moyenne",val:avgTemp,     unit:sym },
            { icon:"rainy",     col:t.secondary,  label:"Précipitations",     val:totalPrecip, unit:"mm" },
            { icon:"air",       col:t.tertiaryDim,label:"Vent Moyen",         val:avgWind,     unit:"km/h" },
          ].map((c,i) => (
            <div key={i} style={{ background:t.glassDark,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRadius:24,padding:22,border:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ padding:9,backgroundColor:`${c.col}18`,borderRadius:11,display:"inline-flex",marginBottom:10 }}>
                <Icon name={c.icon} size={18} style={{ color:c.col }}/>
              </div>
              <p style={{ fontSize:13,color:t.onSurfaceVariant,marginBottom:3 }}>{c.label}</p>
              <div style={{ display:"flex",alignItems:"baseline",gap:4 }}>
                <span style={{ fontSize:34,fontWeight:900,fontFamily:"'Manrope',sans-serif",color:"#fff" }}>{c.val}</span>
                <span style={{ fontSize:16,fontWeight:300,color:c.col }}>{c.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Graphiques historiques */}
        <div style={{ background:t.glassDark,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRadius:28,padding:28,border:"1px solid rgba(255,255,255,0.05)",marginBottom:28 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
            <div style={{ display:"flex",gap:4,backgroundColor:t.surfaceContainerHigh,padding:4,borderRadius:12 }}>
              {[{id:"temp",label:"Température",icon:"thermostat"},{id:"precip",label:"Précipitations",icon:"rainy"}].map(tab=>(
                <button key={tab.id} onClick={()=>setTab(tab.id)} style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:10,fontSize:13,fontWeight:activeTab===tab.id?700:400,backgroundColor:activeTab===tab.id?t.primary:"transparent",color:activeTab===tab.id?t.onPrimaryContainer:t.onSurfaceVariant,border:"none",cursor:"pointer" }}>
                  <Icon name={tab.icon} size={14} style={{ color:"inherit" }}/>{tab.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize:12,color:t.onSurfaceVariant,margin:0 }}>Open-Meteo Archive</p>
          </div>
          <div style={{ height:240 }}>
            {activeTab==="temp"   && chartMax.length>0 && <TempHistChart chartMax={chartMax} chartMin={chartMin} startDate={startDate} unit={unit}/>}
            {activeTab==="precip" && rows.length>0     && <PrecipChart rows={[...rows].reverse()}/>}
            {chartMax.length===0  && <div style={{ height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:t.onSurfaceVariant }}>Aucune donnée disponible</div>}
          </div>
        </div>

        {/* Tableau + export */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <h3 style={shared.sectionTitle}>Registres Quotidiens</h3>
          <button onClick={exportCSV} style={{ display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:t.primary,fontSize:13,fontWeight:700,cursor:"pointer" }}>
            <Icon name="download" size={16}/> Exporter CSV
          </button>
        </div>
        <div style={{ background:t.glassDark,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRadius:22,overflow:"hidden",border:"1px solid rgba(255,255,255,0.05)",marginBottom:32 }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:"'Inter',sans-serif" }}>
            <thead>
              <tr style={{ backgroundColor:"rgba(255,255,255,0.04)" }}>
                {["Date","Max / Min","Précipitations","Vent max"].map((h,i)=>(
                  <th key={i} style={{ padding:"12px 22px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",color:t.onSurfaceVariant,textAlign:i>1?"right":"left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0,30).map((r,i) => (
                <tr key={i} style={{ borderTop:"1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={e=>e.currentTarget.style.backgroundColor="rgba(91,177,255,0.04)"}
                  onMouseLeave={e=>e.currentTarget.style.backgroundColor="transparent"}>
                  <td style={{ padding:"11px 22px" }}>
                    <div style={{ fontWeight:700,color:"#fff",fontSize:14 }}>{r.day}</div>
                    <div style={{ fontSize:12,color:t.onSurfaceVariant }}>{r.date}</div>
                  </td>
                  <td style={{ padding:"11px 22px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:9 }}>
                      <Icon name={r.icon} size={15} filled style={{ color:t.onSurfaceVariant }}/>
                      <span style={{ fontWeight:700,color:t.primary }}>{T(r.high)}°</span>
                      <span style={{ color:t.onSurfaceVariant,fontSize:12 }}>/</span>
                      <span style={{ color:t.secondary }}>{T(r.low)}°</span>
                    </div>
                  </td>
                  <td style={{ padding:"11px 22px",textAlign:"right" }}>
                    <span style={{ fontSize:13,fontFamily:"monospace",color:parseFloat(r.precip)>=10?t.secondary:parseFloat(r.precip)>0?t.primary:t.onSurfaceVariant,fontWeight:parseFloat(r.precip)>5?700:400 }}>
                      {r.precip} mm
                    </span>
                  </td>
                  <td style={{ padding:"11px 22px",textAlign:"right",fontSize:13,color:t.onSurfaceVariant }}>
                    {r.wind!=null?`${r.wind} km/h`:"—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length>30 && (
            <div style={{ padding:14,backgroundColor:"rgba(255,255,255,0.03)",textAlign:"center" }}>
              <span style={{ fontSize:12,color:t.onSurfaceVariant }}>{rows.length-30} jours supplémentaires via export CSV</span>
            </div>
          )}
        </div>
      </>)}
    </div>
  );
}
