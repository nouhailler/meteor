// ─── AlertsBanner.jsx ─────────────────────────────────────────────────────────
// Bannière d'alertes météo calculées depuis les données Open-Meteo.
// S'affiche uniquement quand il y a des alertes actives.
// Peut être fermée individuellement.

import { useState } from "react";
import { Icon } from "./Layout.jsx";
import { computeAlerts } from "./hooks/useWeather.js";
import { useWeatherCtx, toDisplayTemp } from "./WeatherContext.jsx";

export default function AlertsBanner() {
  const { current, daily, prefs } = useWeatherCtx();
  const [dismissed, setDismissed] = useState(new Set());

  const alerts = computeAlerts(current, daily).filter(a => !dismissed.has(a.id));
  if (!alerts.length) return null;

  const T = (c) => toDisplayTemp(c, prefs.unit);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {alerts.map(alert => (
        <div key={alert.id} style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"12px 16px",
          backgroundColor:`${alert.color}18`,
          border:`1px solid ${alert.color}44`,
          borderRadius:16,
          animation:"fadeInUp 0.3s ease forwards",
        }}>
          {/* Icône */}
          <div style={{
            width:36, height:36, borderRadius:10,
            backgroundColor:`${alert.color}22`,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            <Icon name={alert.icon} size={20} filled style={{ color:alert.color }}/>
          </div>

          {/* Texte */}
          <div style={{ flex:1 }}>
            <span style={{ fontSize:13, fontWeight:700, color:"#fff", marginRight:8 }}>{alert.label}</span>
            <span style={{ fontSize:12, color:"#9baad6" }}>{alert.msg}</span>
          </div>

          {/* Fermer */}
          <button
            onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#9baad6", display:"flex", padding:4, borderRadius:6, flexShrink:0 }}
          >
            <Icon name="close" size={16}/>
          </button>
        </div>
      ))}
    </div>
  );
}
