import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useWeatherCtx, toDisplayTemp } from "./WeatherContext.jsx";
import { computeAlerts } from "./hooks/useWeather.js";
import { useCityImage } from "./hooks/useCityImage.js";
import { Icon } from "./Layout.jsx";
import SearchBar from "./SearchBar.jsx";
import { LoadingSpinner, ErrorState } from "./LoadingState.jsx";
import DayDetailModal from "./DayDetailModal.jsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const tk = {
  background:"#060e20", surfaceContainer:"#0c1934",
  surfaceContainerHigh:"#101e3e", surfaceContainerHighest:"#142449",
  primary:"#5bb1ff", primaryContainer:"#44a3f5", primaryFixedDim:"#71b8ff",
  secondary:"#c5c0ff", secondaryDim:"#6d60e9",
  tertiary:"#ffedb7", tertiaryDim:"#f0cf59",
  onBackground:"#dee5ff", onSurface:"#dee5ff", onSurfaceVariant:"#9baad6",
  onPrimary:"#002e4f", onPrimaryContainer:"#00223c",
  error:"#ff716c", glass:"rgba(20,36,73,0.45)",
};

const NAV_ITEMS = [
  {id:"dashboard",  icon:"dashboard", label:"Tableau de bord"},
  {id:"cartes",     icon:"map",       label:"Cartes"},
  {id:"air",        icon:"air",       label:"Qualité de l'air"},
  {id:"historique", icon:"history",   label:"Historique"},
  {id:"parametres", icon:"settings",  label:"Paramètres"},
];

const CHART_H = 220;

const s = {
  app:{display:"flex",minHeight:"100vh",backgroundColor:tk.background,color:tk.onBackground,fontFamily:"'Inter','Manrope',sans-serif",position:"relative",overflow:"hidden"},
  bgGlow:{position:"fixed",top:"-30%",left:"15%",width:"60vw",height:"60vw",borderRadius:"50%",background:"radial-gradient(circle,rgba(91,177,255,0.06) 0%,transparent 70%)",pointerEvents:"none",zIndex:0},
  sidebar:{position:"fixed",left:0,top:0,height:"100%",width:256,display:"flex",flexDirection:"column",padding:16,backgroundColor:"rgba(6,14,32,0.75)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRight:"1px solid rgba(255,255,255,0.08)",zIndex:50},
  logoTitle:{fontSize:22,fontWeight:900,color:tk.primary,letterSpacing:"-0.05em",fontFamily:"'Manrope',sans-serif",margin:0,lineHeight:1},
  logoSub:{fontSize:11,color:tk.onSurfaceVariant,letterSpacing:"0.02em",margin:"4px 0 0"},
  nav:{flex:1,display:"flex",flexDirection:"column",gap:6,marginTop:16},
  navActive:{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",backgroundColor:"rgba(91,177,255,0.15)",color:tk.primaryFixedDim,borderRadius:12,border:"1px solid rgba(91,177,255,0.2)",fontSize:14,fontWeight:600,fontFamily:"'Manrope',sans-serif",cursor:"pointer",textDecoration:"none"},
  navItem:{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",color:tk.onSurfaceVariant,borderRadius:12,fontSize:14,fontFamily:"'Manrope',sans-serif",cursor:"pointer",textDecoration:"none"},
  main:{paddingLeft:256,minHeight:"100vh",width:"100%",position:"relative",zIndex:1},
  header:{position:"sticky",top:0,zIndex:40,height:80,backgroundColor:"rgba(6,14,32,0.5)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 32px",borderBottom:"1px solid rgba(255,255,255,0.04)"},
  headerActions:{display:"flex",alignItems:"center",gap:24},
  iconBtn:{background:"none",border:"none",color:tk.onSurfaceVariant,cursor:"pointer",padding:4,borderRadius:8,display:"flex"},
  avatar:{width:40,height:40,borderRadius:"50%",backgroundColor:tk.surfaceContainerHigh,border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",color:tk.primary,fontSize:14,fontWeight:700,fontFamily:"'Manrope',sans-serif"},
  content:{padding:32,maxWidth:1280,margin:"0 auto",display:"flex",flexDirection:"column",gap:28},
  hero:{position:"relative",height:380,borderRadius:40,overflow:"hidden",background:"linear-gradient(135deg,#0d2647 0%,#0a1e3d 40%,#061225 100%)"},
  heroContent:{position:"absolute",bottom:40,left:48,right:48,display:"flex",justifyContent:"space-between",alignItems:"flex-end"},
  heroLeft:{display:"flex",flexDirection:"column",gap:8},
  heroBadge:{display:"flex",alignItems:"center",gap:10,color:tk.primary},
  heroCity:{fontSize:22,fontWeight:400,color:tk.onSurface,margin:0},
  heroTemp:{fontSize:96,fontWeight:900,fontFamily:"'Manrope',sans-serif",letterSpacing:"-0.05em",color:"#fff",lineHeight:1,display:"flex",alignItems:"baseline",gap:4},
  heroUnit:{fontSize:38,fontWeight:300,color:tk.onSurfaceVariant,fontFamily:"'Manrope',sans-serif"},
  heroCard:{background:tk.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",padding:22,borderRadius:24,border:"1px solid rgba(255,255,255,0.1)",minWidth:230,textAlign:"right"},
  heroCondition:{fontSize:22,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:tk.onSurface,marginBottom:6},
  heroHiLo:{display:"flex",justifyContent:"flex-end",gap:16,color:tk.onSurfaceVariant,fontSize:14,fontWeight:500},
  heroFeelsRow:{marginTop:14,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.1)",display:"flex",justifyContent:"space-between",alignItems:"center"},
  sectionHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14},
  sectionTitle:{fontSize:20,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:tk.onSurface,margin:0},
  carousel:{display:"flex",gap:12,overflowX:"auto",paddingBottom:12,scrollbarWidth:"thin",scrollbarColor:"#38476d transparent"},
  hourlyCardActive:{flexShrink:0,width:108,padding:14,background:tk.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRadius:16,border:"1px solid rgba(91,177,255,0.3)",display:"flex",flexDirection:"column",alignItems:"center",gap:10},
  hourlyCard:{flexShrink:0,width:108,padding:14,backgroundColor:tk.surfaceContainer,borderRadius:16,display:"flex",flexDirection:"column",alignItems:"center",gap:10,cursor:"pointer",transition:"background-color 0.15s"},
  hourlyTimeActive:{fontSize:11,fontWeight:700,color:tk.primary,textTransform:"uppercase",letterSpacing:"0.05em"},
  hourlyTime:{fontSize:11,fontWeight:500,color:tk.onSurfaceVariant,textTransform:"uppercase",letterSpacing:"0.05em"},
  hourlyTemp:{fontSize:19,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:tk.onSurface},
  bottomGrid:{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:22},
  metricsGrid:{gridColumn:"span 4",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14},
  metricCard:{padding:22,background:tk.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRadius:22,border:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",aspectRatio:"1/1",textAlign:"center",gap:6},
  metricTopRow:{display:"flex",flexDirection:"column",alignItems:"center",gap:4},
  metricLabel:{fontSize:12,fontWeight:500,color:tk.onSurfaceVariant},
  metricValueLg:{fontSize:36,fontWeight:900,fontFamily:"'Manrope',sans-serif",color:tk.onSurface,lineHeight:1},
  metricValueMd:{fontSize:26,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:tk.onSurface,lineHeight:1},
  metricSub:{fontSize:11,color:tk.onSurfaceVariant},
  uvBar:{width:"80%",height:4,backgroundColor:tk.surfaceContainerHighest,borderRadius:9999,overflow:"hidden"},
  uvFill:{height:"100%",background:"linear-gradient(to right,#4ade80,#fde65e,#ef4444)",borderRadius:9999},
  chartCard:{gridColumn:"span 8",borderRadius:22,border:"1px solid rgba(255,255,255,0.05)",background:"linear-gradient(135deg,#0a1e3d 0%,#081229 100%)",padding:24,boxSizing:"border-box"},
  weeklySection:{gridColumn:"span 12"},
  weeklyGrid:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:10},
  weeklyCard:{padding:14,background:tk.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRadius:18,border:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer",transition:"all 0.18s"},
  weeklyDay:{fontSize:12,fontWeight:600,color:tk.onSurfaceVariant,fontFamily:"'Manrope',sans-serif"},
  weeklyHigh:{fontSize:18,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:tk.onSurface},
  weeklyLow:{fontSize:12,color:tk.onSurfaceVariant},
  footer:{gridColumn:"span 12",display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:20,paddingBottom:14,borderTop:"1px solid rgba(255,255,255,0.05)"},
  footerLinks:{display:"flex",gap:20},
  footerLink:{fontSize:12,color:tk.onSurfaceVariant,textDecoration:"none",cursor:"pointer"},
};

// ─── Bandeau alertes ──────────────────────────────────────────────────────────
function AlertBanner({ alerts }) {
  const [dismissed, setDismissed] = useState([]);
  const visible = alerts.filter(a => !dismissed.includes(a.id));
  if (!visible.length) return null;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {visible.map(alert => (
        <div key={alert.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", backgroundColor:`${alert.color}18`, border:`1px solid ${alert.color}44`, borderRadius:14 }}>
          <Icon name={alert.icon} size={20} style={{ color:alert.color, flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <span style={{ fontWeight:700, color:alert.color, fontSize:13 }}>{alert.label}</span>
            <span style={{ color:tk.onSurfaceVariant, fontSize:13, marginLeft:8 }}>{alert.msg}</span>
          </div>
          <button onClick={() => setDismissed(d => [...d, alert.id])} style={{ background:"none", border:"none", cursor:"pointer", color:tk.onSurfaceVariant, display:"flex", padding:4 }}>
            <Icon name="close" size={16}/>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Graphique température 24h ────────────────────────────────────────────────
function TempChart({ hourly, unit }) {
  const T   = (c) => unit === "F" ? Math.round(c*9/5+32) : Math.round(c);
  const sym = unit === "F" ? "°F" : "°C";
  const labels = hourly.map(h => h.time);
  const temps  = hourly.map(h => T(h.temp));
  const tMin   = Math.min(...temps);
  const tMax   = Math.max(...temps);

  const chartData = {
    labels,
    datasets: [{
      data: temps, borderColor:"#5bb1ff", backgroundColor:"rgba(91,177,255,0.12)",
      borderWidth:2, pointRadius:0, pointHoverRadius:5,
      pointHoverBackgroundColor:"#5bb1ff", fill:true, tension:0.4,
    }],
  };

  const options = {
    responsive:true, maintainAspectRatio:false,
    animation:{ duration:700, easing:"easeOutQuart" },
    plugins:{
      legend:{ display:false },
      tooltip:{ backgroundColor:"rgba(12,25,52,0.95)", titleColor:"#dee5ff", bodyColor:"#9baad6", borderColor:"rgba(91,177,255,0.3)", borderWidth:1, padding:10, callbacks:{ label:ctx=>` ${ctx.raw}${sym}` } },
    },
    scales:{
      x:{ grid:{ color:"rgba(255,255,255,0.05)", drawBorder:false }, ticks:{ color:"#9baad6", font:{size:10,family:"Inter"}, maxTicksLimit:8, maxRotation:0 } },
      y:{ grid:{ color:"rgba(255,255,255,0.05)", drawBorder:false }, ticks:{ color:"#9baad6", font:{size:10,family:"Inter"}, callback:v=>`${v}°`, stepSize:1 }, min:tMin-3, max:tMax+3 },
    },
  };

  return <div style={{ height:CHART_H }}><Line data={chartData} options={options}/></div>;
}

// ─── Hero avec image de ville / drapeau ──────────────────────────────────────
function HeroSection({ location, current, daily, T, sym }) {
  const { imageUrl, isFlag } = useCityImage(location.city, location.country);
  const [displayUrl, setDisplayUrl] = useState(imageUrl);
  const [visible, setVisible]       = useState(true);

  useEffect(() => {
    if (!imageUrl) return;
    setVisible(false);
    const t = setTimeout(() => { setDisplayUrl(imageUrl); setVisible(true); }, 250);
    return () => clearTimeout(t);
  }, [imageUrl]);

  return (
    <section style={s.hero}>
      {displayUrl && (
        isFlag ? (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", backgroundColor:"#060e20", opacity:visible?1:0, transition:"opacity 0.4s ease" }}>
            <img src={displayUrl} alt={location.country} style={{ height:"55%", maxWidth:"70%", objectFit:"contain", borderRadius:8, boxShadow:"0 8px 48px rgba(0,0,0,0.6)", opacity:0.35, filter:"saturate(0.7) brightness(0.6)" }}/>
          </div>
        ) : (
          <img src={displayUrl} alt={location.city} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 40%", opacity:visible?0.45:0, transition:"opacity 0.5s ease", filter:"saturate(0.7) brightness(0.6)" }}/>
        )
      )}

      {/* Overlay dégradé */}
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, #060e20 0%, rgba(6,14,32,0.55) 50%, rgba(6,14,32,0.15) 100%)" }}/>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 70% 20%,rgba(91,177,255,0.12) 0%,transparent 60%)" }}/>

      {/* Badge source */}
      {displayUrl && (
        <div style={{ position:"absolute", top:20, right:20, display:"flex", alignItems:"center", gap:8, backgroundColor:"rgba(6,14,32,0.65)", backdropFilter:"blur(8px)", padding:"5px 10px", borderRadius:9999, border:"1px solid rgba(255,255,255,0.08)" }}>
          <Icon name={isFlag ? "flag" : "photo_camera"} size={12} style={{ color:tk.onSurfaceVariant }}/>
          <span style={{ fontSize:10, color:tk.onSurfaceVariant, letterSpacing:"0.04em" }}>
            {isFlag ? location.country : "Wikimedia Commons"}
          </span>
        </div>
      )}

      {/* Contenu texte */}
      <div style={s.heroContent}>
        <div style={s.heroLeft}>
          <div style={s.heroBadge}>
            <Icon name={current.icon} size={34} filled style={{ color:tk.primary }}/>
            <span style={{ fontSize:14, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"'Manrope',sans-serif" }}>Météo Actuelle</span>
          </div>
          <p style={s.heroCity}>{location.city}, {location.country}</p>
          <div style={s.heroTemp}>{T(current.temp)}°<span style={s.heroUnit}>{sym}</span></div>
        </div>
        <div style={s.heroCard}>
          <div style={s.heroCondition}>{current.condition}</div>
          <div style={s.heroHiLo}>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}>
              <Icon name="arrow_upward" size={13} style={{ color:tk.primary }}/>H: {T(daily[0]?.high ?? current.temp)}°
            </span>
            <span style={{ display:"flex", alignItems:"center", gap:4 }}>
              <Icon name="arrow_downward" size={13} style={{ color:tk.secondary }}/>B: {T(daily[0]?.low ?? current.temp)}°
            </span>
          </div>
          <div style={s.heroFeelsRow}>
            <span style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.12em", color:tk.onSurfaceVariant }}>Ressenti</span>
            <span style={{ fontSize:17, fontWeight:700, fontFamily:"'Manrope',sans-serif" }}>{T(current.feelsLike)}°</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function WeatherDashboard({ onNavigate=()=>{}, currentPage="dashboard" }) {
  const { location, current, hourly, daily, loading, error, prefs } = useWeatherCtx();
  const [activeHour,  setActiveHour]  = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => { setActiveHour(0); }, [location.lat, location.lon]);

  useEffect(() => {
    const id = "wd-kf";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = `
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .wmc:hover{border-color:rgba(91,177,255,0.25)!important;transform:scale(1.01)}
        .whc:hover{background-color:#101e3e!important}
        .wwc:hover{border-color:rgba(91,177,255,0.35)!important;transform:translateY(-3px);box-shadow:0 8px 24px rgba(91,177,255,0.12)!important}
        .wni:hover{color:#dee5ff!important;background-color:rgba(255,255,255,0.04)!important}
      `;
      document.head.appendChild(el);
    }
  }, []);

  const closeModal = useCallback(() => setSelectedDay(null), []);

  const unit = prefs.unit;
  const T    = (c) => toDisplayTemp(c, unit);
  const sym  = unit === "F" ? "F" : "C";
  const uvPct = current ? Math.min((current.uvIndex/11)*100, 100) : 0;
  const pressureLabel = current
    ? current.pressure>1020 ? "Élevée" : current.pressure<1000 ? "Basse" : "Stable"
    : "";
  const alerts = computeAlerts(current, daily);

  return (
    <div style={s.app}>
      <div style={s.bgGlow}/>

      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <div style={{ marginBottom:32, paddingLeft:16 }}>
          <h1 style={s.logoTitle}>Meteor</h1>
          <p style={s.logoSub}>Local Weather · Open Source</p>
        </div>
        <nav style={s.nav}>
          {NAV_ITEMS.map(item => (
            <a key={item.id} href="#"
               onClick={e=>{ e.preventDefault(); onNavigate(item.id); }}
               className={item.id!==currentPage?"wni":""}
               style={item.id===currentPage ? s.navActive : s.navItem}>
              <Icon name={item.icon} size={22} filled={item.id===currentPage} style={{ color:item.id===currentPage?tk.primary:"inherit" }}/>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div style={{ marginTop:"auto", padding:"12px 16px", fontSize:11, color:tk.onSurfaceVariant, textAlign:"center" }}>
          Meteor v1.1 · Open-Meteo · OSM
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={s.main}>
        <header style={s.header}>
          <SearchBar/>
          <div style={s.headerActions}>
            <button style={s.iconBtn}><Icon name="notifications" size={22}/></button>
            <div style={s.avatar}>PF</div>
          </div>
        </header>

        <div style={s.content}>
          {loading && <LoadingSpinner message="Chargement des données météo…"/>}
          {error   && <ErrorState message={error}/>}

          {!loading && !error && current && (<>
            {alerts.length>0 && <AlertBanner alerts={alerts}/>}

            <HeroSection location={location} current={current} daily={daily} T={T} sym={sym}/>

            {/* Carousel horaire */}
            <section>
              <div style={s.sectionHeader}>
                <h3 style={s.sectionTitle}>Prévisions Horaires</h3>
                <span style={{ fontSize:12, color:tk.onSurfaceVariant }}>Prochaines 24h</span>
              </div>
              <div style={s.carousel}>
                {hourly.map((h,i)=>(
                  <div key={i} className={i!==activeHour?"whc":""} style={i===activeHour?s.hourlyCardActive:s.hourlyCard} onClick={()=>setActiveHour(i)}>
                    <span style={i===activeHour?s.hourlyTimeActive:s.hourlyTime}>{h.time}</span>
                    <Icon name={h.icon} size={26} filled={i===activeHour} style={{ color:i===activeHour?tk.primary:tk.onSurfaceVariant }}/>
                    <span style={s.hourlyTemp}>{T(h.temp)}°</span>
                    {h.precipProb>20 && <span style={{ fontSize:10, color:tk.secondary }}>{h.precipProb}%</span>}
                  </div>
                ))}
              </div>
            </section>

            {/* Grille metric + graphique */}
            <div style={s.bottomGrid}>
              <div style={s.metricsGrid}>
                <div className="wmc" style={{ ...s.metricCard, transition:"all 0.18s" }}>
                  <div style={s.metricTopRow}>
                    <Icon name="humidity_mid" size={22} style={{ color:tk.primary }}/>
                    <span style={s.metricLabel}>Humidité</span>
                  </div>
                  <span style={s.metricValueLg}>{current.humidity}<span style={{ fontSize:22, fontWeight:400 }}>%</span></span>
                  <span style={s.metricSub}>Rosée {T(current.dewPoint)}°</span>
                </div>

                <div className="wmc" style={{ ...s.metricCard, transition:"all 0.18s" }}>
                  <div style={s.metricTopRow}>
                    <Icon name="sunny" size={22} style={{ color:tk.tertiary }}/>
                    <span style={s.metricLabel}>Indice UV</span>
                  </div>
                  <span style={s.metricValueLg}>{current.uvIndex}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:tk.tertiaryDim }}>{current.uvLabel}</span>
                  <div style={s.uvBar}><div style={{ ...s.uvFill, width:`${uvPct}%` }}/></div>
                </div>

                <div className="wmc" style={{ ...s.metricCard, transition:"all 0.18s" }}>
                  <div style={s.metricTopRow}>
                    <Icon name="air" size={22} style={{ color:tk.secondaryDim }}/>
                    <span style={s.metricLabel}>Vent</span>
                  </div>
                  <div>
                    <span style={s.metricValueLg}>{current.windSpeed}</span>
                    <span style={{ fontSize:16, fontWeight:400, color:tk.onSurfaceVariant }}> km/h</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <Icon name="navigation" size={13} style={{ color:tk.onSurfaceVariant, transform:"rotate(45deg)" }}/>
                    <span style={{ fontSize:12, color:tk.onSurfaceVariant }}>{current.windDir}</span>
                  </div>
                </div>

                <div className="wmc" style={{ ...s.metricCard, transition:"all 0.18s" }}>
                  <div style={s.metricTopRow}>
                    <Icon name="compress" size={22} style={{ color:tk.error }}/>
                    <span style={s.metricLabel}>Pression</span>
                  </div>
                  <div>
                    <span style={s.metricValueMd}>{current.pressure}</span>
                    <span style={{ fontSize:14, fontWeight:400, color:tk.onSurfaceVariant }}> hPa</span>
                  </div>
                  <span style={s.metricSub}>{pressureLabel}</span>
                </div>
              </div>

              <div style={s.chartCard}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, fontFamily:"'Manrope',sans-serif", color:"#fff" }}>Courbe de température</div>
                    <div style={{ fontSize:11, color:tk.onSurfaceVariant, marginTop:2 }}>24 prochaines heures</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:tk.onSurfaceVariant }}>
                    <div style={{ width:20, height:2, backgroundColor:tk.primary, borderRadius:2 }}/>
                    <span>{unit==="F"?"°F":"°C"}</span>
                  </div>
                </div>
                <TempChart hourly={hourly} unit={unit}/>
              </div>

              <div style={s.weeklySection}>
                <div style={{ ...s.sectionHeader, marginBottom:14 }}>
                  <h3 style={s.sectionTitle}>Prévisions 7 Jours</h3>
                  <span style={{ fontSize:12, color:tk.onSurfaceVariant }}>Cliquez pour les détails</span>
                </div>
                <div style={s.weeklyGrid}>
                  {daily.map((d,i) => (
                    <div key={i} className="wwc" style={{ ...s.weeklyCard, transition:"all 0.18s" }} onClick={() => setSelectedDay(d)}>
                      <div style={s.weeklyDay}>{d.day}</div>
                      <Icon name={d.icon} size={26} filled style={{ color:i===0?tk.primary:tk.onSurfaceVariant }}/>
                      <div style={s.weeklyHigh}>{T(d.high)}°</div>
                      <div style={s.weeklyLow}>{T(d.low)}°</div>
                      {d.precipProb > 20 && (
                        <div style={{ display:"flex", alignItems:"center", gap:3, fontSize:10, color:tk.secondary }}>
                          <Icon name="water_drop" size={11} style={{ color:tk.secondary }}/>{d.precipProb}%
                        </div>
                      )}
                      {d.sunrise && d.sunset && (
                        <div style={{ fontSize:9, color:tk.onSurfaceVariant, textAlign:"center", lineHeight:1.6, borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:5, width:"100%" }}>
                          <div style={{ color:"#f0cf59" }}>☀ {d.sunrise}</div>
                          <div style={{ color:"#c5c0ff" }}>☽ {d.sunset}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <footer style={s.footer}>
                <p style={{ fontSize:12, color:tk.onSurfaceVariant, margin:0 }}>
                  Mis à jour à {current.updatedAt} · Open-Meteo · {location.city}
                </p>
                <div style={s.footerLinks}>
                  <a href="https://open-meteo.com" target="_blank" rel="noreferrer" style={s.footerLink}>Open-Meteo</a>
                  <a href="https://openstreetmap.org" target="_blank" rel="noreferrer" style={s.footerLink}>OpenStreetMap</a>
                </div>
              </footer>
            </div>
          </>)}
        </div>
      </main>

      {selectedDay && createPortal(
        <DayDetailModal day={selectedDay} onClose={closeModal}/>,
        document.body
      )}
    </div>
  );
}
