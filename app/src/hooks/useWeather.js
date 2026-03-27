// ─── useWeather.js ────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";

export function wmoToIcon(code) {
  if (code === 0)  return { icon: "wb_sunny",          label: "Ciel dégagé"          };
  if (code <= 2)   return { icon: "partly_cloudy_day", label: "Partiellement nuageux" };
  if (code === 3)  return { icon: "cloud",             label: "Couvert"               };
  if (code <= 49)  return { icon: "foggy",             label: "Brouillard"            };
  if (code <= 59)  return { icon: "grain",             label: "Bruine"                };
  if (code <= 69)  return { icon: "rainy",             label: "Pluie"                 };
  if (code <= 79)  return { icon: "ac_unit",           label: "Neige"                 };
  if (code <= 82)  return { icon: "rainy",             label: "Averses"               };
  if (code <= 86)  return { icon: "weather_mix",       label: "Averses de neige"      };
  if (code <= 99)  return { icon: "thunderstorm",      label: "Orage"                 };
  return                  { icon: "help",              label: "Inconnu"               };
}

export function degreesToDirection(deg) {
  const dirs = ["N","NE","E","SE","S","SO","O","NO"];
  return dirs[Math.round(deg / 45) % 8];
}

const DAYS   = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const DAYS_FULL = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];

// ─── Calcul des alertes depuis les données actuelles ─────────────────────────
export function computeAlerts(current, daily) {
  const alerts = [];
  if (!current) return alerts;

  if (current.windSpeed >= 50)
    alerts.push({ id:"wind",   icon:"air",           color:"#c5c0ff", label:"Vent fort",      msg:`${current.windSpeed} km/h — rafales possibles` });
  else if (current.windSpeed >= 30)
    alerts.push({ id:"wind",   icon:"air",           color:"#9baad6", label:"Vent modéré",    msg:`${current.windSpeed} km/h` });

  if (current.uvIndex >= 8)
    alerts.push({ id:"uv",     icon:"sunny",         color:"#ef4444", label:"UV extrême",     msg:`Indice ${current.uvIndex} — protection maximale` });
  else if (current.uvIndex >= 6)
    alerts.push({ id:"uv",     icon:"sunny",         color:"#f0cf59", label:"UV élevé",       msg:`Indice ${current.uvIndex} — crème solaire conseillée` });

  if (current.precipitation >= 10)
    alerts.push({ id:"rain",   icon:"thunderstorm",  color:"#5bb1ff", label:"Fortes pluies",  msg:`${current.precipitation} mm en cours` });
  else if (current.precipitation > 0)
    alerts.push({ id:"rain",   icon:"rainy",         color:"#9baad6", label:"Précipitations", msg:`${current.precipitation} mm en cours` });

  if (current.temp <= 0)
    alerts.push({ id:"frost",  icon:"ac_unit",       color:"#bfdbfe", label:"Gel",            msg:`${current.temp}°C — surfaces glissantes possibles` });

  if (daily?.[0]?.precip && parseFloat(daily[0].precip) >= 20)
    alerts.push({ id:"flood",  icon:"water",         color:"#60a5fa", label:"Cumul important",msg:`${daily[0].precip} mm prévus aujourd'hui` });

  return alerts;
}

export function useWeather(lat, lon) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (lat == null || lon == null) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      latitude:  lat,
      longitude: lon,
      current: [
        "temperature_2m","apparent_temperature","relative_humidity_2m",
        "precipitation","weather_code","surface_pressure",
        "wind_speed_10m","wind_direction_10m","uv_index","is_day",
      ].join(","),
      hourly: [
        "temperature_2m","weather_code","precipitation_probability",
        "wind_speed_10m","relative_humidity_2m",
      ].join(","),
      forecast_hours: 24,
      daily: [
        "weather_code","temperature_2m_max","temperature_2m_min",
        "precipitation_sum","uv_index_max","wind_speed_10m_max",
        "sunrise","sunset","precipitation_probability_max",
      ].join(","),
      forecast_days: 7,
      timezone: "auto",
      wind_speed_unit: "kmh",
    });

    fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(`Open-Meteo HTTP ${r.status}`); return r.json(); })
      .then(json => {
        const c = json.current;
        const h = json.hourly;
        const d = json.daily;
        const now = new Date(c.time);

        // ── Current ──────────────────────────────────────────────────────────
        const { icon: currentIcon, label: currentLabel } = wmoToIcon(c.weather_code);
        const current = {
          temp:          Math.round(c.temperature_2m),
          feelsLike:     Math.round(c.apparent_temperature),
          humidity:      c.relative_humidity_2m,
          precipitation: c.precipitation,
          weatherCode:   c.weather_code,
          icon:          currentIcon,
          condition:     currentLabel,
          pressure:      Math.round(c.surface_pressure),
          windSpeed:     Math.round(c.wind_speed_10m),
          windDir:       degreesToDirection(c.wind_direction_10m),
          uvIndex:       Math.round(c.uv_index ?? 0),
          isDay:         c.is_day === 1,
          updatedAt:     now.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" }),
        };
        const uv = current.uvIndex;
        current.uvLabel = uv<=2?"Faible":uv<=5?"Modéré":uv<=7?"Élevé":uv<=10?"Très élevé":"Extrême";

        const T  = c.temperature_2m;
        const RH = c.relative_humidity_2m;
        const alpha = Math.log(RH/100) + (17.625*T)/(243.04+T);
        current.dewPoint = Math.round((243.04*alpha)/(17.625-alpha));

        // ── Hourly ───────────────────────────────────────────────────────────
        const hourly = h.time.map((timeStr, i) => {
          const date = new Date(timeStr);
          const { icon } = wmoToIcon(h.weather_code[i]);
          return {
            time:       i===0 ? "Now" : date.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),
            temp:       Math.round(h.temperature_2m[i]),
            icon,
            precipProb: h.precipitation_probability[i],
            windSpeed:  Math.round(h.wind_speed_10m?.[i] ?? 0),
            humidity:   h.relative_humidity_2m?.[i] ?? 0,
          };
        });

        // ── Daily ────────────────────────────────────────────────────────────
        const daily = d.time.map((dateStr, i) => {
          const date = new Date(dateStr + "T12:00:00");
          const { icon } = wmoToIcon(d.weather_code[i]);
          const dayName = i===0 ? "Auj." : i===1 ? "Dem." : DAYS[date.getDay()];

          // Sunrise/sunset formatting
          const fmtTime = (iso) => {
            if (!iso) return "—";
            return new Date(iso).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
          };

          return {
            day:         dayName,
            dayFull:     DAYS_FULL[date.getDay()],
            date:        `${date.getDate()} ${MONTHS[date.getMonth()]}`,
            icon,
            weatherCode: d.weather_code[i],
            high:        Math.round(d.temperature_2m_max[i]),
            low:         Math.round(d.temperature_2m_min[i]),
            precip:      d.precipitation_sum[i]?.toFixed(1) ?? "0.0",
            uvMax:       Math.round(d.uv_index_max[i] ?? 0),
            windMax:     Math.round(d.wind_speed_10m_max?.[i] ?? 0),
            precipProb:  d.precipitation_probability_max?.[i] ?? 0,
            sunrise:     fmtTime(d.sunrise?.[i]),
            sunset:      fmtTime(d.sunset?.[i]),
          };
        });

        setData({ current, hourly, daily, timezone: json.timezone });
      })
      .catch(err => {
        if (err.name !== "AbortError") { console.error("[useWeather]", err); setError(err.message); }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lat, lon]);

  return { data, loading, error };
}
