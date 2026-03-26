// ─── SearchBar.jsx ────────────────────────────────────────────────────────────
// Barre de recherche avec dropdown de résultats + bouton GPS.
// Utilisée dans WeatherDashboard et Layout.

import { useState, useRef, useEffect } from "react";
import { t } from "./tokens.js";
import { Icon } from "./Layout.jsx";
import { useGeoSearch, useGPS } from "./hooks/useGeoSearch.js";
import { useWeatherCtx } from "./WeatherContext.jsx";

export default function SearchBar() {
  const { setLocation } = useWeatherCtx();
  const { results, searching, search, clear } = useGeoSearch();
  const { loading: gpsLoading, locate } = useGPS();
  const [query, setQuery]   = useState("");
  const [open,  setOpen]    = useState(false);
  const wrapRef = useRef(null);

  // Fermer le dropdown si clic extérieur
  useEffect(() => {
    function onClickOut(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, []);

  function handleInput(e) {
    const v = e.target.value;
    setQuery(v);
    search(v);
    setOpen(true);
  }

  function handleSelect(place) {
    setLocation({ lat: place.lat, lon: place.lon, city: place.city, country: place.name.split(",").slice(1).join(",").trim() });
    setQuery(place.city);
    setOpen(false);
    clear();
  }

  async function handleGPS() {
    try {
      const { lat, lon } = await locate();
      await setLocation({ lat, lon }); // reverse geocoding automatique
      setQuery("");
      setOpen(false);
    } catch (e) {
      console.warn("GPS:", e);
    }
  }

  const showDropdown = open && (results.length > 0 || searching);

  return (
    <div ref={wrapRef} style={{ position:"relative", flex:1, maxWidth:420 }}>
      {/* Input */}
      <div style={{ position:"relative" }}>
        <Icon name="search" size={18} style={{
          position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
          color: t.onSurfaceVariant, pointerEvents:"none",
        }}/>
        <input
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Rechercher une ville…"
          style={{
            width:"100%", backgroundColor: t.surfaceContainerHighest,
            border:"none", borderRadius:9999,
            padding:"9px 44px 9px 40px",
            fontSize:13, color: t.onSurface, outline:"none",
            boxSizing:"border-box", fontFamily:"'Inter',sans-serif",
          }}
        />
        {/* Bouton GPS */}
        <button onClick={handleGPS} title="Ma position" style={{
          position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
          background:"none", border:"none", cursor:"pointer",
          color: gpsLoading ? t.primary : t.onSurfaceVariant,
          display:"flex", padding:4, borderRadius:6,
        }}>
          <Icon name={gpsLoading ? "autorenew" : "my_location"} size={16}
            style={{ animation: gpsLoading ? "spin 1s linear infinite" : "none" }}/>
        </button>
      </div>

      {/* Dropdown résultats */}
      {showDropdown && (
        <div style={{
          position:"absolute", top:"calc(100% + 8px)", left:0, right:0, zIndex:200,
          backgroundColor: t.surfaceContainerHigh,
          border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:16, overflow:"hidden",
          boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {searching && (
            <div style={{ padding:"12px 16px", fontSize:12, color: t.onSurfaceVariant }}>
              Recherche…
            </div>
          )}
          {results.map(place => (
            <button key={place.id} onClick={() => handleSelect(place)} style={{
              width:"100%", display:"flex", alignItems:"center", gap:10,
              padding:"10px 16px", background:"none", border:"none",
              borderBottom:`1px solid rgba(255,255,255,0.04)`,
              cursor:"pointer", textAlign:"left", color: t.onSurface,
              fontFamily:"'Inter',sans-serif",
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor="rgba(91,177,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor="transparent"}
            >
              <Icon name="location_on" size={16} style={{ color: t.primary, flexShrink:0 }}/>
              <span style={{ fontSize:13 }}>{place.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Keyframe spin pour GPS loading */}
      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}
