import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { t, shared } from "../tokens.js";
import { Icon } from "../Layout.jsx";
import { useWeatherCtx, toDisplayTemp } from "../WeatherContext.jsx";
import { useNearbyWeather } from "../hooks/useNearbyWeather.js";

// ─── Marqueur ville principale ────────────────────────────────────────────────
const mainMarkerIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#5bb1ff;border:3px solid rgba(91,177,255,0.4);box-shadow:0 0 0 8px rgba(91,177,255,0.12);"></div>`,
  iconSize:[14,14], iconAnchor:[7,7], popupAnchor:[0,-12],
});

// ─── Calques de fond ──────────────────────────────────────────────────────────
const LAYERS = [
  { id:"osm",       icon:"map",       label:"Standard",    url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",                                                     attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
  { id:"topo",      icon:"terrain",   label:"Topographie", url:"https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",                                                       attribution:'&copy; <a href="https://opentopomap.org">OpenTopoMap</a>' },
  { id:"sombre",    icon:"dark_mode", label:"Sombre",      url:"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",                                         attribution:'&copy; <a href="https://carto.com/">CARTO</a>' },
  { id:"satellite", icon:"satellite", label:"Satellite",   url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",         attribution:'&copy; Esri' },
];

// ─── Calques données météo ────────────────────────────────────────────────────
const OVERLAYS = [
  { id:"precip",  icon:"rainy",       label:"Précipitations",     unit:"mm",  field:"precipitation" },
  { id:"temp",    icon:"thermostat",  label:"Température",        unit:"°",   field:"temp"          },
  { id:"vent",    icon:"air",         label:"Vitesse du vent",    unit:"km/h",field:"windSpeed"      },
  { id:"nuages",  icon:"cloud",       label:"Couverture nuageuse",unit:"%",   field:"cloudCover"     },
  { id:"none",    icon:"layers_clear",label:"Aucun overlay",      unit:"",    field:null             },
];

// ─── Couleur du marker selon la valeur et le calque ──────────────────────────
function overlayColor(overlay, point, unit) {
  if (!overlay || overlay.field === null) return "rgba(91,177,255,0.7)";

  const val = point[overlay.field] ?? 0;

  if (overlay.id === "temp") {
    // Bleu froid → rouge chaud
    const norm = Math.min(Math.max((val - (-20)) / 60, 0), 1); // -20°→40°
    const r = Math.round(norm * 220);
    const b = Math.round((1 - norm) * 220);
    return `rgba(${r}, 80, ${b}, 0.85)`;
  }
  if (overlay.id === "precip") {
    if (val <= 0)   return "rgba(91,177,255,0.2)";
    if (val <= 1)   return "rgba(91,177,255,0.5)";
    if (val <= 5)   return "rgba(56,130,244,0.75)";
    return               "rgba(29,100,200,0.9)";
  }
  if (overlay.id === "vent") {
    if (val <= 10)  return "rgba(74,222,128,0.6)";
    if (val <= 30)  return "rgba(240,207,89,0.7)";
    if (val <= 60)  return "rgba(251,146,60,0.8)";
    return               "rgba(248,113,113,0.9)";
  }
  if (overlay.id === "nuages") {
    const a = 0.15 + (val / 100) * 0.65;
    return `rgba(180,200,240,${a.toFixed(2)})`;
  }
  return "rgba(91,177,255,0.6)";
}

// ─── Taille du marker selon la valeur ────────────────────────────────────────
function overlayRadius(overlay, point) {
  if (!overlay || overlay.field === null) return 20;
  const val = point[overlay.field] ?? 0;
  if (overlay.id === "precip") return Math.max(16, Math.min(50, 16 + val * 6));
  if (overlay.id === "vent")   return Math.max(16, Math.min(50, 16 + val * 0.5));
  if (overlay.id === "nuages") return Math.max(20, 20 + val * 0.2);
  return 24;
}

// ─── Label affiché sur le marker ─────────────────────────────────────────────
function overlayLabel(overlay, point, unit) {
  if (!overlay || overlay.field === null) return null;
  const val = point[overlay.field] ?? 0;
  if (overlay.id === "temp") return `${val}°`;
  if (overlay.id === "precip") return val > 0 ? `${val}mm` : "";
  if (overlay.id === "vent")   return `${val}`;
  if (overlay.id === "nuages") return `${val}%`;
  return "";
}

// ─── Repositionne la carte ────────────────────────────────────────────────────
function MapMover({ lat, lon }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lon], 10, { animate:true, duration:0.8 }); }, [lat, lon]);
  return null;
}

// ─── Boutons Zoom ─────────────────────────────────────────────────────────────
function ZoomControls() {
  const map = useMap();
  const btnS = {
    width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center",
    borderRadius:10, backgroundColor:"rgba(8,18,40,0.9)", border:"1px solid rgba(255,255,255,0.12)",
    color:"#dee5ff", cursor:"pointer", backdropFilter:"blur(12px)",
  };
  return (
    <div style={{ position:"absolute", top:16, right:16, zIndex:1000, display:"flex", flexDirection:"column", gap:6 }}>
      <button onClick={() => map.zoomIn()}  title="Zoom +"  style={btnS}><span className="material-symbols-outlined" style={{fontSize:20}}>add</span></button>
      <button onClick={() => map.zoomOut()} title="Zoom −"  style={btnS}><span className="material-symbols-outlined" style={{fontSize:20}}>remove</span></button>
      <button onClick={() => map.locate({ setView:true, maxZoom:12 })} title="Ma position" style={{ ...btnS, borderColor:"rgba(91,177,255,0.3)", color:"#5bb1ff" }}>
        <span className="material-symbols-outlined" style={{fontSize:20,fontVariationSettings:"'FILL' 1"}}>my_location</span>
      </button>
    </div>
  );
}

// ─── Markers météo overlay ────────────────────────────────────────────────────
function WeatherOverlay({ points, overlay, unit }) {
  if (!overlay || overlay.field === null || !points?.length) return null;

  return points.map((pt, i) => {
    const color  = overlayColor(overlay, pt, unit);
    const radius = overlayRadius(overlay, pt);
    const label  = overlayLabel(overlay, pt, unit);

    return (
      <CircleMarker
        key={i}
        center={[pt.lat, pt.lon]}
        radius={radius}
        pathOptions={{ fillColor:color, fillOpacity:0.75, color:"rgba(255,255,255,0.15)", weight:1 }}
      >
        {/* Label permanent sur la carte */}
        {label && (
          <Tooltip permanent direction="center" className="weather-map-label">
            <span style={{ fontSize:11, fontWeight:700, color:"#fff", fontFamily:"'Manrope',sans-serif", textShadow:"0 1px 3px rgba(0,0,0,0.8)" }}>{label}</span>
          </Tooltip>
        )}
        <Popup>
          <div style={{ fontFamily:"'Manrope',sans-serif", minWidth:140 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#dee5ff", marginBottom:6 }}>{pt.condition}</div>
            <div style={{ fontSize:12, color:"#9baad6" }}>🌡 {pt.temp}°C</div>
            <div style={{ fontSize:12, color:"#9baad6" }}>💨 {pt.windSpeed} km/h</div>
            {pt.precipitation > 0 && <div style={{ fontSize:12, color:"#9baad6" }}>🌧 {pt.precipitation} mm</div>}
            <div style={{ fontSize:12, color:"#9baad6" }}>☁ {pt.cloudCover}%</div>
          </div>
        </Popup>
      </CircleMarker>
    );
  });
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function CartesPage() {
  const { location, current, prefs } = useWeatherCtx();
  // Défauts : fond Standard, overlay Précipitations
  const [activeBase,    setActiveBase]    = useState("osm");
  const [activeOverlay, setActiveOverlay] = useState("precip");
  const [showLayers,    setShowLayers]    = useState(false);

  // Données météo de la grille autour de la ville active
  const { data: nearbyPoints, loading: nearbyLoading } = useNearbyWeather(location.lat, location.lon);

  const T   = (c) => toDisplayTemp(c, prefs.unit);
  const sym = prefs.unit === "F" ? "°F" : "°C";

  const currentLayer   = LAYERS.find(l => l.id === activeBase)     ?? LAYERS[0];
  const currentOverlay = OVERLAYS.find(o => o.id === activeOverlay) ?? OVERLAYS[0];

  const tempVal     = current ? `${T(current.temp)}${sym}` : "…";
  const feelsVal    = current ? `Ressenti ${T(current.feelsLike)}${sym}` : "";
  const precipVal   = current?.precipitation != null ? `${current.precipitation} mm` : "—";
  const windVal     = current?.windSpeed      != null ? `${current.windSpeed} km/h`  : "—";
  const humidityVal = current?.humidity       != null ? `${current.humidity}%`       : "—";

  const btnBase = (active) => ({
    width:"100%", display:"flex", alignItems:"center", gap:9, padding:"8px 10px",
    borderRadius:9, cursor:"pointer", fontSize:12, marginBottom:2,
    fontFamily:"'Inter',sans-serif", border:"none",
    backgroundColor: active ? "rgba(91,177,255,0.18)"  : "transparent",
    color:           active ? t.primary                 : t.onSurfaceVariant,
    fontWeight:      active ? 700                       : 400,
    outline:         active ? "1px solid rgba(91,177,255,0.3)" : "none",
  });

  const btnOverlay = (active) => ({
    ...btnBase(false),
    backgroundColor: active ? "rgba(197,192,255,0.15)" : "transparent",
    color:           active ? t.secondary              : t.onSurfaceVariant,
    fontWeight:      active ? 700                      : 400,
    outline:         active ? "1px solid rgba(197,192,255,0.3)" : "none",
  });

  // Styles Leaflet Tooltip sans fond par défaut
  useEffect(() => {
    const id = "leaflet-tooltip-style";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = `
        .weather-map-label {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .weather-map-label::before { display: none !important; }
      `;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <div style={{ position:"relative", height:"calc(100vh - 80px)", overflow:"hidden" }}>

      {/* ── Carte Leaflet ── */}
      <MapContainer
        center={[location.lat, location.lon]}
        zoom={9}
        style={{ width:"100%", height:"100%", zIndex:0 }}
        zoomControl={false}
      >
        <TileLayer
          key={activeBase}
          url={currentLayer.url}
          attribution={currentLayer.attribution}
          subdomains="abc"
        />
        <MapMover lat={location.lat} lon={location.lon}/>

        {/* Markers overlay météo sur la grille */}
        <WeatherOverlay
          points={nearbyPoints}
          overlay={currentOverlay}
          unit={sym}
        />

        {/* Marker ville principale */}
        <Marker position={[location.lat, location.lon]} icon={mainMarkerIcon}>
          <Popup>
            <div style={{ fontFamily:"'Manrope',sans-serif", minWidth:160 }}>
              <div style={{ fontWeight:900, fontSize:16, color:"#dee5ff", marginBottom:4 }}>{location.city}</div>
              <div style={{ fontSize:22, fontWeight:700, color:"#5bb1ff", marginBottom:2 }}>{tempVal}</div>
              <div style={{ fontSize:12, color:"#9baad6", marginBottom:6 }}>{feelsVal}</div>
              {current && <div style={{ fontSize:12, color:"#9baad6" }}>
                <div>💨 {windVal} &nbsp;·&nbsp; 💧 {humidityVal}</div>
                {current.precipitation > 0 && <div>🌧 {precipVal}</div>}
              </div>}
            </div>
          </Popup>
        </Marker>

        <ZoomControls/>
      </MapContainer>

      {/* ── Panel stats ville — haut gauche ── */}
      <div style={{ position:"absolute", top:16, left:16, zIndex:400 }}>
        <div style={{ ...shared.glass, padding:20, minWidth:260 }}>
          {/* Nom + température */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div>
              <h2 style={{ fontSize:22, fontWeight:900, fontFamily:"'Manrope',sans-serif", color:t.onSurface, margin:0 }}>{location.city}</h2>
              <p style={{ fontSize:11, color:t.onSurfaceVariant, margin:"2px 0 0" }}>{location.country}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:28, fontWeight:900, fontFamily:"'Manrope',sans-serif", color:t.primary }}>{tempVal}</div>
              <div style={{ fontSize:10, color:t.onSurfaceVariant }}>{feelsVal}</div>
            </div>
          </div>

          {/* Métriques */}
          {[
            { icon:"water_drop",  label:"Précipitations", val:precipVal,   col:t.primary },
            { icon:"air",         label:"Vent",           val:windVal,     col:t.secondary },
            { icon:"humidity_mid",label:"Humidité",       val:humidityVal, col:t.tertiaryDim },
          ].map((row, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", backgroundColor:"rgba(16,30,62,0.6)", borderRadius:10, border:"1px solid rgba(255,255,255,0.05)", marginBottom:5 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Icon name={row.icon} size={15} style={{ color:row.col }}/>
                <span style={{ fontSize:11, fontWeight:600, color:t.onSurfaceVariant }}>{row.label}</span>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:t.onSurface }}>{row.val}</span>
            </div>
          ))}

          {/* Indicateur overlay actif + état chargement */}
          <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:8 }}>
            {nearbyLoading
              ? <span style={{ fontSize:11, color:t.onSurfaceVariant }}>⟳ Chargement des données...</span>
              : <>
                  <Icon name={currentOverlay.icon} size={13} style={{ color:t.secondary }}/>
                  <span style={{ fontSize:11, color:t.onSurfaceVariant }}>
                    {currentOverlay.id === "none" ? "Pas d'overlay" : `${currentOverlay.label} · ${nearbyPoints?.length ?? 0} points`}
                  </span>
                </>
            }
          </div>
        </div>
      </div>

      {/* ── Bouton calques ── */}
      <div style={{ position:"absolute", top:16, right:74, zIndex:400 }}>
        <button
          onClick={() => setShowLayers(s => !s)}
          style={{ ...shared.glass, width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", border:"none", cursor:"pointer", color: showLayers ? t.primary : t.onSurface, padding:0 }}
        >
          <Icon name="layers" size={22} filled={showLayers}/>
        </button>
      </div>

      {/* ── Panel calques ── */}
      {showLayers && (
        <div style={{ position:"absolute", top:68, right:74, zIndex:400, display:"flex", flexDirection:"column", gap:8 }}>

          {/* Fonds de carte */}
          <div style={{ ...shared.glass, padding:12, width:210 }}>
            <p style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:t.onSurfaceVariant, marginBottom:7 }}>Fond de carte</p>
            {LAYERS.map(l => (
              <button key={l.id} onClick={() => setActiveBase(l.id)} style={btnBase(l.id === activeBase)}>
                <Icon name={l.icon} size={14}/>
                <span>{l.label}</span>
                {l.id === activeBase && <Icon name="check" size={12} style={{ marginLeft:"auto", color:t.primary }}/>}
              </button>
            ))}
          </div>

          {/* Overlay données météo */}
          <div style={{ ...shared.glass, padding:12, width:210 }}>
            <p style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:t.onSurfaceVariant, marginBottom:7 }}>Données météo</p>
            {OVERLAYS.map(o => (
              <button key={o.id} onClick={() => setActiveOverlay(o.id)} style={btnOverlay(o.id === activeOverlay)}>
                <Icon name={o.icon} size={14}/>
                <span>{o.label}</span>
                {o.id === activeOverlay && <Icon name="check" size={12} style={{ marginLeft:"auto", color:t.secondary }}/>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Légende contextuelle (si overlay actif) ── */}
      {currentOverlay.id !== "none" && (
        <div style={{ position:"absolute", bottom:20, left:16, zIndex:400 }}>
          <div style={{ ...shared.glass, padding:14, minWidth:220 }}>
            <p style={{ fontSize:10, fontWeight:700, color:t.onSurfaceVariant, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>
              {currentOverlay.label}
            </p>

            {/* Gradient légende */}
            {currentOverlay.id === "temp" && (
              <LegendGradient from="#0055cc" to="#dd2200" labels={["< −10°","0°","10°","20°","> 35°"]}/>
            )}
            {currentOverlay.id === "precip" && (
              <LegendSteps steps={[
                { col:"rgba(91,177,255,0.2)",  label:"0 mm" },
                { col:"rgba(91,177,255,0.5)",  label:"0–1 mm" },
                { col:"rgba(56,130,244,0.75)", label:"1–5 mm" },
                { col:"rgba(29,100,200,0.9)",  label:"> 5 mm" },
              ]}/>
            )}
            {currentOverlay.id === "vent" && (
              <LegendSteps steps={[
                { col:"rgba(74,222,128,0.7)",  label:"< 10 km/h" },
                { col:"rgba(240,207,89,0.7)",  label:"10–30 km/h" },
                { col:"rgba(251,146,60,0.8)",  label:"30–60 km/h" },
                { col:"rgba(248,113,113,0.9)", label:"> 60 km/h" },
              ]}/>
            )}
            {currentOverlay.id === "nuages" && (
              <LegendGradient from="rgba(180,200,240,0.15)" to="rgba(180,200,240,0.8)" labels={["0%","25%","50%","75%","100%"]}/>
            )}

            <div style={{ marginTop:10, fontSize:10, color:t.onSurfaceVariant }}>
              © <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" style={{ color:t.primary }}>OpenStreetMap</a>
              &nbsp;· Open-Meteo
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Composants de légende ────────────────────────────────────────────────────
function LegendGradient({ from, to, labels }) {
  return (
    <>
      <div style={{ height:10, borderRadius:9999, background:`linear-gradient(to right, ${from}, ${to})`, marginBottom:6 }}/>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:t.onSurfaceVariant }}>
        {labels.map(l => <span key={l}>{l}</span>)}
      </div>
    </>
  );
}

function LegendSteps({ steps }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:16, height:10, borderRadius:3, backgroundColor:s.col, flexShrink:0 }}/>
          <span style={{ fontSize:11, color:t.onSurfaceVariant }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
