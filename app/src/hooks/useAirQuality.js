// ─── useAirQuality.js ─────────────────────────────────────────────────────────
// Appelle Open-Meteo Air Quality API (gratuit, sans clé)
// Doc : https://air-quality-api.open-meteo.com/v1/air-quality
//
// Retourne :
//   { aqi, pollutants, forecast24h, loading, error }

import { useState, useEffect } from "react";

// ─── Calcul IQA européen simplifié (échelle 0-500) ───────────────────────────
function computeAQI(pm2_5, pm10, no2, o3) {
  // Basé sur les seuils OMS / CAQI européen
  const scores = [
    pm2_5 != null ? Math.min((pm2_5 / 25)  * 100, 500) : null,
    pm10  != null ? Math.min((pm10  / 50)  * 100, 500) : null,
    no2   != null ? Math.min((no2   / 40)  * 100, 500) : null,
    o3    != null ? Math.min((o3    / 100) * 100, 500) : null,
  ].filter(v => v != null);
  if (scores.length === 0) return null;
  return Math.round(Math.max(...scores));
}

function aqiLabel(aqi) {
  if (aqi == null) return { label: "N/A",          color: "#9baad6" };
  if (aqi <= 25)   return { label: "Bon",           color: "#4ade80" };
  if (aqi <= 50)   return { label: "Assez bon",     color: "#a3e635" };
  if (aqi <= 75)   return { label: "Modéré",        color: "#f0cf59" };
  if (aqi <= 100)  return { label: "Médiocre",      color: "#fb923c" };
  if (aqi <= 150)  return { label: "Mauvais",       color: "#f87171" };
  return                  { label: "Très mauvais",  color: "#c084fc" };
}

export function useAirQuality(lat, lon) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (lat == null || lon == null) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      latitude:  lat,
      longitude: lon,
      current: [
        "pm10", "pm2_5", "carbon_monoxide",
        "nitrogen_dioxide", "sulphur_dioxide", "ozone",
        "european_aqi",
      ].join(","),
      hourly: ["pm2_5", "european_aqi"].join(","),
      forecast_hours: 24,
      timezone: "auto",
    });

    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`Air Quality API HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        const c = json.current;

        const pm2_5 = c.pm2_5;
        const pm10  = c.pm10;
        const no2   = c.nitrogen_dioxide;
        const o3    = c.ozone;
        const so2   = c.sulphur_dioxide;
        const co    = c.carbon_monoxide;

        // Préférer l'index européen fourni par l'API si disponible
        const rawAqi = c.european_aqi ?? computeAQI(pm2_5, pm10, no2, o3);
        const aqi    = Math.round(rawAqi ?? 0);
        const { label, color } = aqiLabel(aqi);

        const maxPol = Math.max(
          pm2_5 ?? 0, (pm10 ?? 0) / 2, (no2 ?? 0) / 1.5, (o3 ?? 0) / 2
        );

        const pollutants = [
          { label: "PM2.5", val: pm2_5?.toFixed(1) ?? "—", unit: "µg/m³", pct: Math.min((pm2_5 ?? 0) / 25  * 100, 100), col: "#f0cf59" },
          { label: "PM10",  val: pm10?.toFixed(1)  ?? "—", unit: "µg/m³", pct: Math.min((pm10  ?? 0) / 50  * 100, 100), col: "#5bb1ff" },
          { label: "O3",    val: o3?.toFixed(1)    ?? "—", unit: "µg/m³", pct: Math.min((o3    ?? 0) / 100 * 100, 100), col: "#f0cf59" },
          { label: "NO2",   val: no2?.toFixed(1)   ?? "—", unit: "µg/m³", pct: Math.min((no2   ?? 0) / 40  * 100, 100), col: "#5bb1ff" },
          { label: "SO2",   val: so2?.toFixed(1)   ?? "—", unit: "µg/m³", pct: Math.min((so2   ?? 0) / 20  * 100, 100), col: "#5bb1ff" },
          { label: "CO",    val: co != null ? (co / 1000).toFixed(2) : "—", unit: "mg/m³", pct: Math.min((co ?? 0) / 10000 * 100, 100), col: "#5bb1ff" },
        ];

        // Forecast 24h (hauteurs normalisées pour le graphique)
        const h = json.hourly;
        const maxAqiH = Math.max(...(h.european_aqi ?? h.pm2_5 ?? [1]));
        const forecast24h = (h.european_aqi ?? h.pm2_5 ?? []).map((v, i) => ({
          hour: new Date(h.time[i]).getHours(),
          aqi:  Math.round(v ?? 0),
          pct:  Math.round((v ?? 0) / Math.max(maxAqiH, 1) * 100),
        }));

        setData({ aqi, label, color, pollutants, forecast24h });
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("[useAirQuality]", err);
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lat, lon]);

  return { data, loading, error };
}
