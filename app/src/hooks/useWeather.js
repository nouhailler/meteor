// ─── useWeather.js ────────────────────────────────────────────────────────────
// Appelle l'API Open-Meteo (gratuit, sans clé, RGPD-compliant)
// Doc : https://open-meteo.com/en/docs
//
// Retourne :
//   { current, hourly, daily, loading, error }
//
// current  : température, ressenti, humidité, pression, vent, UV, météocode
// hourly   : tableau des 24 prochaines heures
// daily    : tableau des 7 prochains jours

import { useState, useEffect } from "react";

// ─── Correspondance WMO weathercode → icône Material + libellé ───────────────
export function wmoToIcon(code) {
  if (code === 0)              return { icon: "wb_sunny",          label: "Ciel dégagé"          };
  if (code <= 2)               return { icon: "partly_cloudy_day", label: "Partiellement nuageux" };
  if (code === 3)              return { icon: "cloud",             label: "Couvert"               };
  if (code <= 49)              return { icon: "foggy",             label: "Brouillard"            };
  if (code <= 59)              return { icon: "grain",             label: "Bruine"                };
  if (code <= 69)              return { icon: "rainy",             label: "Pluie"                 };
  if (code <= 79)              return { icon: "ac_unit",           label: "Neige"                 };
  if (code <= 82)              return { icon: "rainy",             label: "Averses"               };
  if (code <= 86)              return { icon: "weather_mix",       label: "Averses de neige"      };
  if (code <= 99)              return { icon: "thunderstorm",      label: "Orage"                 };
  return                              { icon: "help",              label: "Inconnu"               };
}

// ─── Convertit une direction vent (degrés) en texte ──────────────────────────
export function degreesToDirection(deg) {
  const dirs = ["N","NE","E","SE","S","SO","O","NO"];
  return dirs[Math.round(deg / 45) % 8];
}

// ─── Noms des jours ──────────────────────────────────────────────────────────
const DAYS = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const DAYS_FULL = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];

export function useWeather(lat, lon) {
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
      // Données actuelles
      current: [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation",
        "weather_code",
        "surface_pressure",
        "wind_speed_10m",
        "wind_direction_10m",
        "uv_index",
        "is_day",
      ].join(","),
      // Prévisions horaires (48h)
      hourly: [
        "temperature_2m",
        "weather_code",
        "precipitation_probability",
      ].join(","),
      forecast_hours: 24,
      // Prévisions quotidiennes (7j)
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "uv_index_max",
      ].join(","),
      forecast_days: 7,
      timezone: "auto",
      wind_speed_unit: "kmh",
    });

    fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`Open-Meteo HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        const c = json.current;
        const h = json.hourly;
        const d = json.daily;
        const now = new Date(c.time);

        // ── Current ──────────────────────────────────────────────────────────
        const { icon: currentIcon, label: currentLabel } = wmoToIcon(c.weather_code);
        const current = {
          temp:        Math.round(c.temperature_2m),
          feelsLike:   Math.round(c.apparent_temperature),
          humidity:    c.relative_humidity_2m,
          precipitation: c.precipitation,
          weatherCode: c.weather_code,
          icon:        currentIcon,
          condition:   currentLabel,
          pressure:    Math.round(c.surface_pressure),
          windSpeed:   Math.round(c.wind_speed_10m),
          windDir:     degreesToDirection(c.wind_direction_10m),
          uvIndex:     Math.round(c.uv_index ?? 0),
          isDay:       c.is_day === 1,
          updatedAt:   now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        };

        // ── UV label ─────────────────────────────────────────────────────────
        const uv = current.uvIndex;
        current.uvLabel =
          uv <= 2  ? "Faible"    :
          uv <= 5  ? "Modéré"    :
          uv <= 7  ? "Élevé"     :
          uv <= 10 ? "Très élevé":
                     "Extrême";

        // ── Dewpoint approx (formule Magnus) ─────────────────────────────────
        const T = c.temperature_2m;
        const RH = c.relative_humidity_2m;
        const alpha = Math.log(RH / 100) + (17.625 * T) / (243.04 + T);
        current.dewPoint = Math.round((243.04 * alpha) / (17.625 - alpha));

        // ── Hourly ───────────────────────────────────────────────────────────
        const hourly = h.time.map((timeStr, i) => {
          const date = new Date(timeStr);
          const isNow = i === 0;
          const { icon } = wmoToIcon(h.weather_code[i]);
          return {
            time:   isNow ? "Now" : date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            temp:   Math.round(h.temperature_2m[i]),
            icon,
            precipProb: h.precipitation_probability[i],
          };
        });

        // ── Daily ────────────────────────────────────────────────────────────
        const today = new Date();
        const daily = d.time.map((dateStr, i) => {
          const date = new Date(dateStr + "T12:00:00");
          const { icon } = wmoToIcon(d.weather_code[i]);
          const dayName = i === 0 ? "Auj." : i === 1 ? "Hier" : DAYS[date.getDay()];
          return {
            day:    dayName,
            dayFull: DAYS_FULL[date.getDay()],
            date:   `${date.getDate()} ${MONTHS[date.getMonth()]}`,
            icon,
            weatherCode: d.weather_code[i],
            high:   Math.round(d.temperature_2m_max[i]),
            low:    Math.round(d.temperature_2m_min[i]),
            precip: d.precipitation_sum[i]?.toFixed(1) ?? "0.0",
            uvMax:  Math.round(d.uv_index_max[i] ?? 0),
          };
        });

        setData({ current, hourly, daily, timezone: json.timezone });
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("[useWeather]", err);
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lat, lon]);

  return { data, loading, error };
}
