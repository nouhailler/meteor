// ─── useHistorical.js ─────────────────────────────────────────────────────────
// Appelle Open-Meteo Historical API pour les données passées
// Doc : https://archive-api.open-meteo.com/v1/archive

import { useState, useEffect } from "react";
import { wmoToIcon } from "./useWeather.js";

const DAYS_FULL = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const MONTHS    = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export function useHistorical(lat, lon, days = 30) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (lat == null || lon == null) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    // L'API archive ne couvre pas les 5 derniers jours — on utilise forecast pour le récent
    const endDate   = daysAgo(2);   // avant-hier (archive disponible)
    const startDate = daysAgo(days + 2);

    const params = new URLSearchParams({
      latitude:   lat,
      longitude:  lon,
      start_date: startDate,
      end_date:   endDate,
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "wind_speed_10m_max",
      ].join(","),
      timezone: "auto",
      wind_speed_unit: "kmh",
    });

    fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`Archive API HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        const d = json.daily;

        const rows = d.time.map((dateStr, i) => {
          const date    = new Date(dateStr + "T12:00:00");
          const dayOfW  = date.getDay();
          const { icon } = wmoToIcon(d.weather_code[i]);
          const max = d.temperature_2m_max[i];
          const min = d.temperature_2m_min[i];
          const precip = d.precipitation_sum[i] ?? 0;
          return {
            day:    DAYS_FULL[dayOfW],
            date:   `${date.getDate()} ${MONTHS[date.getMonth()]}`,
            icon,
            weatherCode: d.weather_code[i],
            high:   max != null ? Math.round(max) : null,
            low:    min != null ? Math.round(min) : null,
            precip: precip.toFixed(1),
            wind:   d.wind_speed_10m_max[i] != null ? Math.round(d.wind_speed_10m_max[i]) : null,
          };
        }).reverse(); // du plus récent au plus ancien

        // Statistiques résumées
        const temps  = d.temperature_2m_max.filter(v => v != null);
        const tempsMin = d.temperature_2m_min.filter(v => v != null);
        const allTemps = [...temps, ...tempsMin];
        const precips= d.precipitation_sum.filter(v => v != null);
        const winds  = d.wind_speed_10m_max.filter(v => v != null);

        const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;

        const avgTemp   = avg(allTemps);
        const totalPrecip = precips.reduce((a,b)=>a+b, 0);
        const avgWind   = avg(winds);

        // Pour le graphique : max/min par jour (chronologique = inversion)
        const chartMax = [...d.temperature_2m_max].reverse();
        const chartMin = [...d.temperature_2m_min].reverse();

        setData({ rows, avgTemp, totalPrecip, avgWind, chartMax, chartMin, startDate, endDate });
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("[useHistorical]", err);
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lat, lon, days]);

  return { data, loading, error };
}
