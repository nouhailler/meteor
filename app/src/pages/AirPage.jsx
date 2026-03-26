import { t, shared } from "../tokens.js";
import { Icon } from "../Layout.jsx";
import { useWeatherCtx } from "../WeatherContext.jsx";
import { LoadingSpinner, ErrorState } from "../LoadingState.jsx";

function AqiGauge({ value = 0 }) {
  const r = 110, circ = 2 * Math.PI * r;
  const pct  = Math.min(value / 150, 1);   // 150 = "mauvais", max de l'échelle affichée
  const dash = circ * pct;
  const color = value <= 25  ? "#4ade80"
              : value <= 50  ? "#a3e635"
              : value <= 75  ? "#f0cf59"
              : value <= 100 ? "#fb923c"
              :                "#f87171";
  return (
    <div style={{ position:"relative", width:256, height:256 }}>
      <svg width="256" height="256" style={{ transform:"rotate(-90deg)" }}>
        <circle cx="128" cy="128" r={r} fill="transparent" stroke={t.surfaceContainerHighest} strokeWidth="12"/>
        <circle cx="128" cy="128" r={r} fill="transparent"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:72, fontWeight:900, fontFamily:"'Manrope',sans-serif", color:"#fff", lineHeight:1 }}>{value}</span>
        <span style={{ fontSize:13, fontWeight:700, color, letterSpacing:"0.15em", marginTop:8 }}>
          {value <= 25 ? "BON" : value <= 50 ? "ASSEZ BON" : value <= 75 ? "MODÉRÉ" : value <= 100 ? "MÉDIOCRE" : "MAUVAIS"}
        </span>
      </div>
    </div>
  );
}

const RECO = [
  { icon:"masks",         col:"#5bb1ff", title:"Portez un masque",    text:"Recommandé pour les personnes sensibles lors de longs trajets." },
  { icon:"fitness_center",col:"#f0cf59", title:"Activités physiques", text:"Réduisez les exercices intenses en extérieur cet après-midi." },
  { icon:"air",           col:"#5bb1ff", title:"Aération",            text:"Privilégiez l'aération de votre domicile tôt le matin." },
];

export default function AirPage() {
  const { location, aq, airQuality } = useWeatherCtx();

  if (airQuality.loading) return <LoadingSpinner message="Chargement de la qualité de l'air…"/>;
  if (airQuality.error)   return <ErrorState message={airQuality.error}/>;

  const aqi         = aq?.aqi         ?? 0;
  const pollutants  = aq?.pollutants  ?? [];
  const forecast24h = aq?.forecast24h ?? [];
  const maxPct = Math.max(...forecast24h.map(h => h.pct), 1);

  return (
    <div style={{ ...shared.content, paddingTop:32 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:40 }}>
        <div>
          <h1 style={shared.pageTitle}>{location.city}, {location.country}</h1>
          <p style={shared.pageSub}>Mis à jour en temps réel · Open-Meteo Air Quality</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <span style={{ padding:"6px 16px", backgroundColor:t.secondaryContainer, borderRadius:9999, fontSize:12, fontWeight:700, color:"#9f98ff" }}>EN DIRECT</span>
          <span style={{ padding:"6px 16px", backgroundColor:t.surfaceContainerHigh, borderRadius:9999, fontSize:12, color:t.onSurfaceVariant }}>Historique 24h</span>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(12,1fr)", gap:32 }}>
        {/* Jauge IQA */}
        <div style={{ gridColumn:"span 5", ...shared.glass, padding:32, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"-80px", right:"-80px", width:240, height:240, borderRadius:"50%", background:`radial-gradient(circle,${t.primary}18 0%,transparent 70%)` }}/>
          <p style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.15em", color:t.onSurfaceVariant, marginBottom:24 }}>Indice de Qualité de l'Air (IQA)</p>
          <AqiGauge value={aqi}/>
          <p style={{ fontSize:13, color:t.onSurfaceVariant, textAlign:"center", maxWidth:280, lineHeight:1.6, marginTop:20 }}>
            {aqi <= 25  ? "La qualité de l'air est excellente — aucune restriction recommandée." :
             aqi <= 50  ? "Qualité bonne — activités normales en extérieur possibles." :
             aqi <= 75  ? "Qualité acceptable, risque modéré pour les personnes sensibles." :
             aqi <= 100 ? "Qualité médiocre — réduire les activités intenses en extérieur." :
                          "Qualité mauvaise — évitez les sorties prolongées."}
          </p>
        </div>

        {/* Polluants */}
        <div style={{ gridColumn:"span 7", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {pollutants.map((p, i) => (
            <div key={i} style={{ backgroundColor:t.surfaceContainerLow, borderRadius:24, padding:20, border:"1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:t.onSurfaceVariant, marginBottom:6 }}>{p.label}</p>
              <p style={{ fontSize:22, fontWeight:700, fontFamily:"'Manrope',sans-serif", color:"#fff" }}>
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

        {/* Graphique 24h */}
        <div style={{ gridColumn:"span 12", backgroundColor:t.surfaceContainerLow, borderRadius:32, padding:32, border:"1px solid rgba(255,255,255,0.05)" }}>
          <h3 style={{ fontSize:18, fontWeight:700, fontFamily:"'Manrope',sans-serif", color:"#fff", margin:"0 0 8px" }}>Prévisions IQA 24h</h3>
          <p style={{ fontSize:13, color:t.onSurfaceVariant, margin:"0 0 24px" }}>Évolution de l'indice de qualité de l'air</p>
          <div style={{ height:180, display:"flex", alignItems:"flex-end", gap:3 }}>
            {forecast24h.map((h, i) => {
              const barH = Math.max((h.pct / maxPct) * 100, 4);
              const isHigh = h.aqi > 50;
              return (
                <div key={i} title={`${h.hour}h : IQA ${h.aqi}`} style={{
                  flex:1, borderRadius:"4px 4px 0 0",
                  backgroundColor: isHigh ? `${t.tertiaryDim}44` : `${t.primary}28`,
                  height:`${barH}%`, transition:"background-color 0.2s", cursor:"default",
                }}/>
              );
            })}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:12, fontSize:10, color:t.onSurfaceVariant, fontWeight:700, textTransform:"uppercase" }}>
            {["00h","06h","12h","18h","23h"].map(l => <span key={l}>{l}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
