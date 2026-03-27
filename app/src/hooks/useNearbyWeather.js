// ─── useNearbyWeather.js ──────────────────────────────────────────────────────
// Fetche les données météo actuelles pour un ensemble de villes proches
// en utilisant l'API Open-Meteo batch (plusieurs lat/lon en une seule requête).
//
// Retourne : { cities, loading, error }
// cities : [{ name, lat, lon, temp, windSpeed, precipitation, cloudCover, weatherCode, condition, icon }]

import { useState, useEffect } from "react";
import { wmoToIcon } from "./useWeather.js";

// ─── Grille de villes autour d'un point central ───────────────────────────────
// On génère une grille 5×5 de points espacés de ~50 km
function buildGrid(centerLat, centerLon) {
  const step = 0.45; // ~50km en degrés
  const offsets = [-2, -1, 0, 1, 2];
  const points = [];
  for (const dy of offsets) {
    for (const dx of offsets) {
      points.push({
        lat: Math.round((centerLat + dy * step) * 100) / 100,
        lon: Math.round((centerLon + dx * step) * 100) / 100,
      });
    }
  }
  return points;
}

export function useNearbyWeather(centerLat, centerLon) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (centerLat == null || centerLon == null) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const points = buildGrid(centerLat, centerLon);

    // Open-Meteo supporte les requêtes multi-points avec des tableaux
    const lats = points.map(p => p.lat).join(",");
    const lons = points.map(p => p.lon).join(",");

    const params = new URLSearchParams({
      latitude:  lats,
      longitude: lons,
      current: [
        "temperature_2m",
        "weather_code",
        "wind_speed_10m",
        "precipitation",
        "cloud_cover",
      ].join(","),
      timezone: "auto",
      wind_speed_unit: "kmh",
    });

    fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => {
        // L'API retourne un tableau quand plusieurs points sont demandés
        const responses = Array.isArray(json) ? json : [json];

        const cities = responses.map((resp, i) => {
          const c = resp.current;
          const { icon, label } = wmoToIcon(c.weather_code);
          return {
            lat:          points[i].lat,
            lon:          points[i].lon,
            temp:         Math.round(c.temperature_2m),
            windSpeed:    Math.round(c.wind_speed_10m),
            precipitation: c.precipitation ?? 0,
            cloudCover:   c.cloud_cover ?? 0,
            weatherCode:  c.weather_code,
            condition:    label,
            icon,
          };
        });

        setData(cities);
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("[useNearbyWeather]", err);
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [
    // Arrondi à 2 décimales pour éviter les re-fetch continus
    Math.round(centerLat * 100),
    Math.round(centerLon * 100),
  ]);

  return { data, loading, error };
}
