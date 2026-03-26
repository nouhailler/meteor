import { useState, useEffect } from "react";
import { t, shared } from "../tokens.js";
import { Icon } from "../Layout.jsx";
import { useWeatherCtx, toDisplayTemp } from "../WeatherContext.jsx";

const LAYERS   = [
  { id:"precip",  icon:"rainy",      label:"Précipitations" },
  { id:"temp",    icon:"thermostat", label:"Température"    },
  { id:"vent",    icon:"air",        label:"Vitesse du vent"},
  { id:"nuages",  icon:"cloud",      label:"Couverture nuageuse"},
];
const TIMELINE = ["−3h","−2h","−1h","Maintenant","+1h","+2h","+3h"];

function FakeMap({ location, current }) {
  const cityName = location?.city ?? "—";
  const temp     = current ? toDisplayTemp(current.temp, "C") : "—";
  return (
    <svg viewBox="0 0 800 500" style={{ width:"100%", height:"100%", position:"absolute", inset:0 }}>
      <defs>
        <radialGradient id="rain1" cx="55%" cy="40%" r="25%">
          <stop offset="0%" stopColor="rgba(29,158,117,0.5)"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
        <radialGradient id="rain2" cx="30%" cy="65%" r="18%">
          <stop offset="0%" stopColor="rgba(56,130,244,0.4)"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      <rect width="800" height="500" fill="#060e20"/>
      {[0,1,2,3,4,5,6,7].map(i=>(
        <line key={`h${i}`} x1="0" y1={i*70} x2="800" y2={i*70} stroke="rgba(91,177,255,0.05)" strokeWidth="1"/>
      ))}
      {[0,1,2,3,4,5,6,7,8,9].map(i=>(
        <line key={`v${i}`} x1={i*90} y1="0" x2={i*90} y2="500" stroke="rgba(91,177,255,0.05)" strokeWidth="1"/>
      ))}
      <path d="M50,80 Q200,60 350,90 Q450,110 600,80 Q700,65 780,90 L780,160 Q650,140 500,155 Q350,170 200,150 Q100,140 50,160Z"
            fill="rgba(16,30,62,0.8)" stroke="rgba(91,177,255,0.15)" strokeWidth="1"/>
      <path d="M0,200 Q150,180 300,210 Q400,225 550,200 Q680,180 800,210 L800,320 Q650,300 480,315 Q320,330 180,310 Q80,295 0,320Z"
            fill="rgba(12,25,52,0.7)" stroke="rgba(91,177,255,0.12)" strokeWidth="1"/>
      <ellipse cx="440" cy="200" rx="130" ry="90" fill="url(#rain1)" opacity="0.85"/>
      <ellipse cx="240" cy="325" rx="100" ry="70" fill="url(#rain2)" opacity="0.75"/>
      {/* Ville active */}
      <circle cx="440" cy="200" r={7} fill={t.primary} opacity="0.95"/>
      <circle cx="440" cy="200" r={16} fill="none" stroke={t.primary} strokeWidth="1.5" opacity="0.5"/>
      <text x="462" y="196" fill={t.onSurface} fontSize="12" fontFamily="Inter" fontWeight="700">{cityName}</text>
      <text x="462" y="212" fill={t.primary} fontSize="11" fontFamily="Inter" fontWeight="600">{temp}°C</text>
    </svg>
  );
}

export default function CartesPage() {
  const { location, current, hourly, prefs } = useWeatherCtx();
  const [activeLayer, setActiveLayer] = useState("precip");
  const [playing,     setPlaying]     = useState(false);
  const [timeIdx,     setTimeIdx]     = useState(3);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTimeIdx(i => (i + 1) % TIMELINE.length), 900);
    return () => clearInterval(id);
  }, [playing]);

  const T = (c) => toDisplayTemp(c, prefs.unit);

  // Stats de la ville sélectionnée depuis le Context
  const precipVal  = current?.precipitation != null ? `${current.precipitation} mm` : "—";
  const windVal    = current?.windSpeed      != null ? `${current.windSpeed} km/h`   : "—";
  const humidityVal= current?.humidity       != null ? `${current.humidity}%`        : "—";

  return (
    <div style={{ ...shared.content, position:"relative", padding:0, height:"calc(100vh - 80px)", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, backgroundColor:t.background }}>
        <FakeMap location={location} current={current}/>
      </div>

      {/* Stats flottantes — haut gauche */}
      <div style={{ position:"absolute", top:24, left:24, zIndex:10 }}>
        <div style={{ ...shared.glass, padding:24, minWidth:280 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
            <div>
              <h2 style={{ fontSize:28, fontWeight:900, fontFamily:"'Manrope',sans-serif", color:t.onSurface, margin:0 }}>{location.city}</h2>
              <p style={{ fontSize:13, color:t.onSurfaceVariant, margin:"4px 0 0" }}>{location.country}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:36, fontWeight:900, fontFamily:"'Manrope',sans-serif", color:t.primary }}>
                {current ? `${T(current.temp)}°` : "…"}
              </div>
              <div style={{ fontSize:10, color:t.onSurfaceVariant, textTransform:"uppercase", letterSpacing:"0.08em" }}>
                {current ? `Ressenti ${T(current.feelsLike)}°` : ""}
              </div>
            </div>
          </div>
          {[
            { icon:"water_drop", label:"Précipitations", val:precipVal,   col:t.primary },
            { icon:"air",        label:"Vent",           val:windVal,     col:t.secondary },
            { icon:"humidity_mid",label:"Humidité",      val:humidityVal, col:t.tertiaryDim },
          ].map((row, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", backgroundColor:"rgba(16,30,62,0.5)", borderRadius:12, border:"1px solid rgba(255,255,255,0.05)", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Icon name={row.icon} size={18} style={{ color:row.col }}/>
                <span style={{ fontSize:12, fontWeight:600, color:t.onSurfaceVariant }}>{row.label}</span>
              </div>
              <span style={{ fontSize:14, fontWeight:700 }}>{row.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contrôles zoom */}
      <div style={{ position:"absolute", top:24, right:24, zIndex:10, display:"flex", flexDirection:"column", gap:8 }}>
        {[
          [{ icon:"add" },{ icon:"remove" },{ icon:"my_location", filled:true }],
          [{ icon:"layers" }],
        ].map((group, gi) => (
          <div key={gi} style={{ ...shared.glass, padding:6, display:"flex", flexDirection:"column", gap:4 }}>
            {group.map((btn, i) => (
              <button key={i} style={{ width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:10, backgroundColor:"transparent", border:"none", color:t.onSurface, cursor:"pointer" }}>
                <Icon name={btn.icon} size={20} filled={btn.filled}/>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Calques */}
      <div style={{ position:"absolute", bottom:110, left:24, zIndex:10 }}>
        <div style={{ ...shared.glass, padding:16, width:240 }}>
          <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:t.onSurfaceVariant, marginBottom:10 }}>Calques de données</p>
          {LAYERS.map(l => (
            <button key={l.id} onClick={() => setActiveLayer(l.id)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:12, padding:"10px 12px",
              borderRadius:12, backgroundColor:l.id===activeLayer?"rgba(91,177,255,0.15)":"transparent",
              color:l.id===activeLayer?t.primary:t.onSurfaceVariant,
              border:"none", cursor:"pointer", fontSize:13, fontWeight:l.id===activeLayer?700:400,
              marginBottom:4, fontFamily:"'Inter',sans-serif",
            }}>
              <Icon name={l.icon} size={18}/>
              <span>{l.label}</span>
              {l.id===activeLayer && <Icon name="check_circle" size={16} filled style={{ marginLeft:"auto", color:t.primary }}/>}
            </button>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div style={{ position:"absolute", bottom:110, right:24, zIndex:10 }}>
        <div style={{ ...shared.glass, padding:14, width:180 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, fontWeight:700, color:t.onSurfaceVariant, textTransform:"uppercase", marginBottom:6 }}>
            <span>Faible</span><span>Intense</span>
          </div>
          <div style={{ height:8, borderRadius:9999, background:"linear-gradient(to right,#93c5fd,#22c55e,#ef4444)", marginBottom:8 }}/>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:t.onSurface }}>
            <span>0 mm/h</span><span>50+ mm/h</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position:"absolute", bottom:16, left:"50%", transform:"translateX(-50%)", zIndex:20, width:"80%", maxWidth:800 }}>
        <div style={{ ...shared.glass, padding:"12px 20px", display:"flex", alignItems:"center", gap:16, borderRadius:9999 }}>
          <button onClick={() => setPlaying(p => !p)} style={{ width:44, height:44, borderRadius:"50%", backgroundColor:t.primary, color:t.onPrimaryContainer, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon name={playing?"pause":"play_arrow"} size={22} filled/>
          </button>
          <div style={{ flex:1, display:"flex", gap:4 }}>
            {TIMELINE.map((tick, i) => (
              <button key={i} onClick={() => setTimeIdx(i)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", color:i===timeIdx?t.primary:t.onSurfaceVariant }}>
                <div style={{ width:"100%", height:3, borderRadius:9999, backgroundColor:i<=timeIdx?t.primary:"rgba(255,255,255,0.1)" }}/>
                <span style={{ fontSize:9, fontWeight:i===timeIdx?700:400, textTransform:"uppercase", letterSpacing:"0.06em" }}>{tick}</span>
              </button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0, paddingLeft:12, borderLeft:"1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize:10, color:t.onSurfaceVariant, textTransform:"uppercase", letterSpacing:"0.08em" }}>Vitesse</span>
            <button style={{ padding:"4px 10px", borderRadius:9999, backgroundColor:"rgba(255,255,255,0.07)", border:"none", color:t.onSurface, fontSize:11, fontWeight:700, cursor:"pointer" }}>1X</button>
          </div>
        </div>
      </div>
    </div>
  );
}
