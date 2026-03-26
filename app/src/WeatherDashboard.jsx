import { useState, useEffect } from "react";
import { useWeatherCtx, toDisplayTemp } from "./WeatherContext.jsx";
import { Icon } from "./Layout.jsx";
import SearchBar from "./SearchBar.jsx";
import { LoadingSpinner, ErrorState } from "./LoadingState.jsx";

const tokens = {
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

const s = {
  app:{display:"flex",minHeight:"100vh",backgroundColor:tokens.background,color:tokens.onBackground,fontFamily:"'Inter','Manrope',sans-serif",position:"relative",overflow:"hidden"},
  bgGlow:{position:"fixed",top:"-30%",left:"15%",width:"60vw",height:"60vw",borderRadius:"50%",background:"radial-gradient(circle,rgba(91,177,255,0.06) 0%,transparent 70%)",pointerEvents:"none",zIndex:0},
  sidebar:{position:"fixed",left:0,top:0,height:"100%",width:256,display:"flex",flexDirection:"column",padding:16,backgroundColor:"rgba(6,14,32,0.75)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRight:"1px solid rgba(255,255,255,0.08)",zIndex:50},
  logoTitle:{fontSize:22,fontWeight:900,color:tokens.primary,letterSpacing:"-0.05em",fontFamily:"'Manrope',sans-serif",margin:0,lineHeight:1},
  logoSub:{fontSize:11,color:tokens.onSurfaceVariant,letterSpacing:"0.02em",margin:"4px 0 0"},
  nav:{flex:1,display:"flex",flexDirection:"column",gap:6,marginTop:16},
  navActive:{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",backgroundColor:"rgba(91,177,255,0.15)",color:tokens.primaryFixedDim,borderRadius:12,border:"1px solid rgba(91,177,255,0.2)",fontSize:14,fontWeight:600,fontFamily:"'Manrope',sans-serif",cursor:"pointer",textDecoration:"none"},
  navItem:{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",color:tokens.onSurfaceVariant,borderRadius:12,fontSize:14,fontFamily:"'Manrope',sans-serif",cursor:"pointer",textDecoration:"none"},
  proBanner:{marginTop:"auto",padding:16,background:tokens.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRadius:16,border:"1px solid rgba(255,255,255,0.05)",textAlign:"center"},
  proBtn:{width:"100%",padding:"8px 0",backgroundColor:tokens.primaryContainer,color:tokens.onPrimaryContainer,borderRadius:12,fontSize:13,fontWeight:700,fontFamily:"'Manrope',sans-serif",border:"none",cursor:"pointer"},
  main:{paddingLeft:256,minHeight:"100vh",width:"100%",position:"relative",zIndex:1},
  header:{position:"sticky",top:0,zIndex:40,height:80,backgroundColor:"rgba(6,14,32,0.5)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 32px",borderBottom:"1px solid rgba(255,255,255,0.04)"},
  headerActions:{display:"flex",alignItems:"center",gap:24},
  iconBtn:{background:"none",border:"none",color:tokens.onSurfaceVariant,cursor:"pointer",padding:4,borderRadius:8,display:"flex"},
  avatar:{width:40,height:40,borderRadius:"50%",backgroundColor:tokens.surfaceContainerHigh,border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",color:tokens.primary,fontSize:14,fontWeight:700,fontFamily:"'Manrope',sans-serif"},
  content:{padding:32,maxWidth:1280,margin:"0 auto",display:"flex",flexDirection:"column",gap:32},
  hero:{position:"relative",height:400,borderRadius:40,overflow:"hidden",background:"linear-gradient(135deg,#0d2647 0%,#0a1e3d 40%,#061225 100%)"},
  heroDecor:{position:"absolute",inset:0,background:"radial-gradient(ellipse at 70% 20%,rgba(91,177,255,0.15) 0%,transparent 60%),radial-gradient(ellipse at 20% 80%,rgba(197,192,255,0.08) 0%,transparent 50%)"},
  heroContent:{position:"absolute",bottom:48,left:48,right:48,display:"flex",justifyContent:"space-between",alignItems:"flex-end"},
  heroLeft:{display:"flex",flexDirection:"column",gap:8},
  heroBadge:{display:"flex",alignItems:"center",gap:10,color:tokens.primary},
  heroCity:{fontSize:22,fontWeight:400,color:tokens.onSurface,margin:0,fontFamily:"'Inter',sans-serif"},
  heroTemp:{fontSize:100,fontWeight:900,fontFamily:"'Manrope',sans-serif",letterSpacing:"-0.05em",color:"#fff",lineHeight:1,display:"flex",alignItems:"baseline",gap:4},
  heroUnit:{fontSize:40,fontWeight:300,color:tokens.onSurfaceVariant,fontFamily:"'Manrope',sans-serif"},
  heroCard:{background:tokens.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",padding:24,borderRadius:24,border:"1px solid rgba(255,255,255,0.1)",minWidth:240,textAlign:"right"},
  heroCondition:{fontSize:24,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:tokens.onSurface,marginBottom:6},
  heroHiLo:{display:"flex",justifyContent:"flex-end",gap:16,color:tokens.onSurfaceVariant,fontSize:14,fontWeight:500},
  heroFeelsRow:{marginTop:16,paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.1)",display:"flex",justifyContent:"space-between",alignItems:"center"},
  sectionHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",paddingLeft:4,paddingRight:4,marginBottom:16},
  sectionTitle:{fontSize:20,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:tokens.onSurface,margin:0},
  seeAllBtn:{background:"none",border:"none",color:tokens.primary,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4},
  carousel:{display:"flex",gap:12,overflowX:"auto",paddingBottom:16,scrollbarWidth:"thin",scrollbarColor:"#38476d transparent"},
  hourlyCardActive:{flexShrink:0,width:112,padding:16,background:tokens.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRadius:16,border:"1px solid rgba(91,177,255,0.3)",display:"flex",flexDirection:"column",alignItems:"center",gap:12},
  hourlyCard:{flexShrink:0,width:112,padding:16,backgroundColor:tokens.surfaceContainer,borderRadius:16,display:"flex",flexDirection:"column",alignItems:"center",gap:12,cursor:"pointer"},
  hourlyTimeActive:{fontSize:11,fontWeight:700,color:tokens.primary,textTransform:"uppercase",letterSpacing:"0.05em"},
  hourlyTime:{fontSize:11,fontWeight:500,color:tokens.onSurfaceVariant,textTransform:"uppercase",letterSpacing:"0.05em"},
  hourlyTemp:{fontSize:20,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:tokens.onSurface},
  bottomGrid:{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:24},
  metricsGrid:{gridColumn:"span 4",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16},
  metricCard:{gridColumn:"span 1",padding:24,background:tokens.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRadius:24,border:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",justifyContent:"space-between",aspectRatio:"1/1"},
  metricLabel:{fontSize:13,fontWeight:500,color:tokens.onSurfaceVariant,marginBottom:4,marginTop:6},
  metricValue:{fontSize:28,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:tokens.onSurface},
  metricSub:{fontSize:12,color:tokens.onSurfaceVariant,marginTop:4},
  uvBar:{width:"100%",height:4,backgroundColor:tokens.surfaceContainerHighest,borderRadius:9999,overflow:"hidden",marginTop:6},
  uvFill:{height:"100%",background:"linear-gradient(to right,#4ade80,#fde65e,#ef4444)",borderRadius:9999},
  radarCard:{gridColumn:"span 8",position:"relative",borderRadius:24,overflow:"hidden",border:"1px solid rgba(255,255,255,0.05)",background:"linear-gradient(135deg,#0a1e3d 0%,#081229 100%)",minHeight:360},
  radarBg:{position:"absolute",inset:0,background:"radial-gradient(ellipse at 60% 40%,rgba(29,158,117,0.12) 0%,transparent 60%),radial-gradient(ellipse at 30% 70%,rgba(56,130,244,0.1) 0%,transparent 50%)"},
  radarGrid:{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,rgba(91,177,255,0.08) 1px,transparent 1px)",backgroundSize:"32px 32px"},
  radarOverlay:{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(6,14,32,0.5) 0%,transparent 50%)"},
  radarContent:{position:"absolute",inset:0,padding:24,display:"flex",flexDirection:"column",justifyContent:"space-between"},
  liveBadge:{display:"inline-flex",alignItems:"center",gap:8,backgroundColor:"rgba(6,14,32,0.8)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",padding:"6px 14px",borderRadius:9999,border:"1px solid rgba(255,255,255,0.1)",alignSelf:"flex-start",marginBottom:8},
  liveDot:{width:8,height:8,borderRadius:"50%",backgroundColor:"#ef4444",animation:"pulse 1.5s ease-in-out infinite"},
  liveTxt:{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em"},
  radarTitle:{fontSize:24,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:"#fff"},
  radarBottom:{display:"flex",alignItems:"center",gap:12},
  radarPlayBtn:{background:tokens.glass,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",padding:12,borderRadius:16,border:"1px solid rgba(255,255,255,0.2)",color:tokens.onSurface,cursor:"pointer",display:"flex"},
  radarLegend:{background:tokens.glass,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",padding:"10px 18px",borderRadius:16,border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",gap:12},
  legendBar:{width:80,height:8,background:"linear-gradient(to right,#bfdbfe,#3b82f6,#1e1b4b)",borderRadius:9999},
  weeklySection:{gridColumn:"span 12"},
  weeklyGrid:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:12},
  weeklyCard:{padding:20,background:tokens.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderRadius:20,border:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",alignItems:"center",gap:10,cursor:"pointer"},
  weeklyDay:{fontSize:13,fontWeight:600,color:tokens.onSurfaceVariant,fontFamily:"'Manrope',sans-serif"},
  weeklyHigh:{fontSize:20,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:tokens.onSurface},
  weeklyLow:{fontSize:13,color:tokens.onSurfaceVariant},
  footer:{gridColumn:"span 12",display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:24,paddingBottom:16,borderTop:"1px solid rgba(255,255,255,0.05)"},
  footerLinks:{display:"flex",gap:24},
  footerLink:{fontSize:12,color:tokens.onSurfaceVariant,textDecoration:"none",cursor:"pointer"},
};

function RadarRings() {
  return (
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
      {[
        {cx:"58%",cy:"45%",r:30, c:"rgba(29,158,117,0.3)"},
        {cx:"58%",cy:"45%",r:55, c:"rgba(56,130,244,0.2)"},
        {cx:"58%",cy:"45%",r:80, c:"rgba(91,177,255,0.12)"},
        {cx:"58%",cy:"45%",r:110,c:"rgba(197,192,255,0.07)"},
        {cx:"38%",cy:"65%",r:22, c:"rgba(29,158,117,0.25)"},
        {cx:"38%",cy:"65%",r:44, c:"rgba(56,130,244,0.15)"},
      ].map((r,i)=><circle key={i} cx={r.cx} cy={r.cy} r={r.r} fill={r.c}/>)}
    </svg>
  );
}

export default function WeatherDashboard({ onNavigate=()=>{}, currentPage="dashboard" }) {
  const { location, current, hourly, daily, loading, error, prefs } = useWeatherCtx();
  const [activeHour, setActiveHour] = useState(0);

  useEffect(()=>{ setActiveHour(0); }, [location.lat, location.lon]);

  useEffect(() => {
    const id = "wd-kf";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = `
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .wmc:hover{border-color:rgba(91,177,255,0.2)!important}
        .whc:hover{background-color:#101e3e!important}
        .wwc:hover{border-color:rgba(91,177,255,0.25)!important}
        .wni:hover{color:#dee5ff!important;background-color:rgba(255,255,255,0.04)!important}
        .wce{animation:fadeInUp 0.5s ease forwards}
      `;
      document.head.appendChild(el);
    }
  }, []);

  const unit = prefs.unit;
  const T = (c) => toDisplayTemp(c, unit);
  const sym = unit === "F" ? "F" : "C";

  const uvPct = current ? Math.min((current.uvIndex / 11) * 100, 100) : 0;

  // Pression : tendance simplifiée
  const pressureLabel = current
    ? current.pressure > 1020 ? "Élevée" : current.pressure < 1000 ? "Basse" : "Stable"
    : "";

  return (
    <div style={s.app}>
      <div style={s.bgGlow}/>

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={{marginBottom:32,paddingLeft:16}}>
          <h1 style={s.logoTitle}>Atmosphere</h1>
          <p style={s.logoSub}>Local Weather</p>
        </div>
        <nav style={s.nav}>
          {NAV_ITEMS.map(item=>(
            <a key={item.id} href="#" onClick={e=>{e.preventDefault();onNavigate(item.id);}}
               className={item.id!==currentPage?"wni":""}
               style={item.id===currentPage?s.navActive:s.navItem}>
              <Icon name={item.icon} size={22} filled={item.id===currentPage} style={{color:item.id===currentPage?tokens.primary:"inherit"}}/>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div style={s.proBanner}>
          <p style={{fontSize:12,color:tokens.onSurfaceVariant,marginBottom:10}}>Obtenez une précision avancée</p>
          <button style={s.proBtn}>Passer à la version Pro</button>
        </div>
      </aside>

      {/* Main */}
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
            {/* Hero */}
            <section style={s.hero}>
              <div style={s.heroDecor}/>
              <div style={{position:"absolute",top:32,right:48}}>
                <Icon name={current.icon} size={160} filled style={{color:"rgba(91,177,255,0.12)"}}/>
              </div>
              <div style={s.heroContent}>
                <div style={s.heroLeft}>
                  <div style={s.heroBadge}>
                    <Icon name={current.icon} size={36} filled style={{color:tokens.primary}}/>
                    <span style={{fontSize:15,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",fontFamily:"'Manrope',sans-serif"}}>Météo Actuelle</span>
                  </div>
                  <p style={s.heroCity}>{location.city}, {location.country}</p>
                  <div style={s.heroTemp}>{T(current.temp)}°<span style={s.heroUnit}>{sym}</span></div>
                </div>
                <div style={s.heroCard}>
                  <div style={s.heroCondition}>{current.condition}</div>
                  <div style={s.heroHiLo}>
                    <span style={{display:"flex",alignItems:"center",gap:4}}>
                      <Icon name="arrow_upward" size={14} style={{color:tokens.primary}}/>H: {T(daily[0]?.high ?? current.temp)}°
                    </span>
                    <span style={{display:"flex",alignItems:"center",gap:4}}>
                      <Icon name="arrow_downward" size={14} style={{color:tokens.secondary}}/>B: {T(daily[0]?.low ?? current.temp)}°
                    </span>
                  </div>
                  <div style={s.heroFeelsRow}>
                    <span style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.12em",color:tokens.onSurfaceVariant}}>Ressenti</span>
                    <span style={{fontSize:18,fontWeight:700,fontFamily:"'Manrope',sans-serif"}}>{T(current.feelsLike)}°</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Hourly */}
            <section>
              <div style={s.sectionHeader}>
                <h3 style={s.sectionTitle}>Prévisions Horaires</h3>
                <button style={s.seeAllBtn}>Prochaines 24h <Icon name="chevron_right" size={16}/></button>
              </div>
              <div style={s.carousel}>
                {hourly.map((h,i)=>(
                  <div key={i} className={i!==activeHour?"whc":""} style={i===activeHour?s.hourlyCardActive:s.hourlyCard} onClick={()=>setActiveHour(i)}>
                    <span style={i===activeHour?s.hourlyTimeActive:s.hourlyTime}>{h.time}</span>
                    <Icon name={h.icon} size={28} filled={i===activeHour} style={{color:i===activeHour?tokens.primary:tokens.onSurfaceVariant}}/>
                    <span style={s.hourlyTemp}>{T(h.temp)}°</span>
                    {h.precipProb > 20 && (
                      <span style={{fontSize:10,color:tokens.secondary}}>{h.precipProb}%</span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Metrics + Radar */}
            <div style={s.bottomGrid}>
              <div style={s.metricsGrid}>
                {[
                  {icon:"humidity_mid",color:tokens.primary,   label:"Humidité",  value:`${current.humidity}%`,     sub:`Rosée à ${T(current.dewPoint)}° en ce moment.`},
                  {icon:"sunny",       color:tokens.tertiary,  label:"Indice UV", value:current.uvIndex, sub:current.uvLabel, uv:true},
                  {icon:"air",         color:tokens.secondaryDim,label:"Vent",    value:current.windSpeed, unit:"km/h", dir:current.windDir},
                  {icon:"compress",    color:tokens.error,     label:"Pression",  value:current.pressure, unit:"hPa", sub:pressureLabel},
                ].map((m,i)=>(
                  <div key={i} className="wmc" style={s.metricCard}>
                    <div>
                      <Icon name={m.icon} size={22} style={{color:m.color}}/>
                      <div style={s.metricLabel}>{m.label}</div>
                    </div>
                    <div>
                      <div style={{...s.metricValue,display:"flex",alignItems:"baseline",gap:4}}>
                        {m.value}{m.unit&&<span style={{fontSize:16,fontWeight:400,color:tokens.onSurfaceVariant}}>{m.unit}</span>}
                      </div>
                      {m.uv&&<div style={{fontSize:13,fontWeight:600,color:tokens.tertiaryDim,marginBottom:4}}>{m.sub}</div>}
                      {m.uv&&<div style={s.uvBar}><div style={{...s.uvFill,width:`${uvPct}%`}}/></div>}
                      {m.dir&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}><Icon name="navigation" size={14} style={{color:tokens.onSurfaceVariant,transform:"rotate(45deg)"}}/><span style={{fontSize:12,color:tokens.onSurfaceVariant}}>{m.dir}</span></div>}
                      {m.sub&&!m.uv&&!m.dir&&<div style={s.metricSub}>{m.sub}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Radar */}
              <div style={s.radarCard}>
                <div style={s.radarBg}/><div style={s.radarGrid}/><RadarRings/><div style={s.radarOverlay}/>
                <div style={s.radarContent}>
                  <div>
                    <div style={s.liveBadge}><span style={s.liveDot}/><span style={s.liveTxt}>Radar en direct</span></div>
                    <div style={s.radarTitle}>Précipitations</div>
                    <div style={{marginTop:8,fontSize:13,color:tokens.onSurfaceVariant}}>
                      {current.precipitation > 0
                        ? `${current.precipitation} mm actuellement`
                        : "Aucune précipitation en cours"}
                    </div>
                  </div>
                  <div style={s.radarBottom}>
                    <button style={s.radarPlayBtn}><Icon name="play_arrow" size={22}/></button>
                    <div style={s.radarLegend}>
                      <div>
                        <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",color:tokens.onSurfaceVariant,fontWeight:700,marginBottom:4}}>Précipitations</div>
                        <div style={s.legendBar}/>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:2}}>
                        <span style={{fontSize:11,color:tokens.onSurfaceVariant}}>Légères</span>
                        <span style={{fontSize:11,fontWeight:700}}>Fortes</span>
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8,marginLeft:"auto"}}>
                      {["add","remove","layers"].map((ic,i)=>(
                        <button key={i} style={{...s.radarPlayBtn,marginTop:i===2?8:0,padding:10}}><Icon name={ic} size={18}/></button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly */}
              <div style={s.weeklySection}>
                <div style={{...s.sectionHeader,marginBottom:16}}><h3 style={s.sectionTitle}>Prévisions 7 Jours</h3></div>
                <div style={s.weeklyGrid}>
                  {daily.map((d,i)=>(
                    <div key={i} className="wwc" style={s.weeklyCard}>
                      <div style={s.weeklyDay}>{d.day}</div>
                      <Icon name={d.icon} size={28} filled style={{color:i===0?tokens.primary:tokens.onSurfaceVariant}}/>
                      <div style={s.weeklyHigh}>{T(d.high)}°</div>
                      <div style={s.weeklyLow}>{T(d.low)}°</div>
                      {parseFloat(d.precip) > 0 && (
                        <div style={{fontSize:10,color:tokens.secondary}}>{d.precip}mm</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <footer style={s.footer}>
                <p style={{fontSize:12,color:tokens.onSurfaceVariant,margin:0}}>
                  Mis à jour à {current.updatedAt} · Open-Meteo · {location.city}
                </p>
                <div style={s.footerLinks}>
                  <a href="https://open-meteo.com" target="_blank" rel="noreferrer" style={s.footerLink}>Open-Meteo</a>
                  <a href="https://nominatim.openstreetmap.org" target="_blank" rel="noreferrer" style={s.footerLink}>OpenStreetMap</a>
                </div>
              </footer>
            </div>
          </>)}
        </div>
      </main>
    </div>
  );
}
