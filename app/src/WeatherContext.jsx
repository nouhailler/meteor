// ─── WeatherContext.jsx ───────────────────────────────────────────────────────
// Context global partagé entre toutes les pages.
// Fournit :
//   - location    : { lat, lon, city, country }
//   - setLocation : changer la ville active
//   - weather     : données Open-Meteo (current, hourly, daily)
//   - airQuality  : données qualité de l'air
//   - prefs       : { unit: "C"|"F", lang: "fr" }
//   - setPrefs

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useWeather } from "./hooks/useWeather.js";
import { useAirQuality } from "./hooks/useAirQuality.js";
import { reverseGeocode } from "./hooks/useGeoSearch.js";

// ─── Valeurs par défaut : Genève ──────────────────────────────────────────────
const DEFAULT_LOCATION = { lat: 46.2044, lon: 6.1432, city: "Genève", country: "Suisse" };
const LS_KEY_LOC   = "atm_location";
const LS_KEY_PREFS = "atm_prefs";

// ─── Helpers LS ───────────────────────────────────────────────────────────────
function loadLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── Conversion °C → °F ──────────────────────────────────────────────────────
export function toDisplayTemp(celsius, unit) {
  if (unit === "F") return Math.round(celsius * 9/5 + 32);
  return Math.round(celsius);
}
export function unitSymbol(unit) { return unit === "F" ? "°F" : "°C"; }

// ─── Context ──────────────────────────────────────────────────────────────────
const WeatherCtx = createContext(null);

export function WeatherProvider({ children }) {
  const [location, _setLocation] = useState(() => loadLS(LS_KEY_LOC, DEFAULT_LOCATION));
  const [prefs,    setPrefsState] = useState(() => loadLS(LS_KEY_PREFS, { unit: "C", lang: "fr" }));

  // Persister à chaque changement
  useEffect(() => saveLS(LS_KEY_LOC,   location), [location]);
  useEffect(() => saveLS(LS_KEY_PREFS, prefs),    [prefs]);

  // Changer la ville (depuis la recherche ou le GPS)
  const setLocation = useCallback(async ({ lat, lon, city, country }) => {
    let resolvedCity    = city;
    let resolvedCountry = country;

    // Si pas de nom fourni → reverse geocoding
    if (!resolvedCity) {
      const geo = await reverseGeocode(lat, lon);
      resolvedCity    = geo.city;
      resolvedCountry = geo.country;
    }
    _setLocation({ lat, lon, city: resolvedCity, country: resolvedCountry });
  }, []);

  const setPrefs = useCallback((patch) => {
    setPrefsState(prev => ({ ...prev, ...patch }));
  }, []);

  // Données météo depuis les hooks
  const weather    = useWeather(location.lat, location.lon);
  const airQuality = useAirQuality(location.lat, location.lon);

  const value = {
    location,
    setLocation,
    weather,        // { data, loading, error }
    airQuality,     // { data, loading, error }
    prefs,
    setPrefs,
    // Raccourcis pratiques
    current:  weather.data?.current  ?? null,
    hourly:   weather.data?.hourly   ?? [],
    daily:    weather.data?.daily    ?? [],
    aq:       airQuality.data        ?? null,
    loading:  weather.loading,
    error:    weather.error,
  };

  return <WeatherCtx.Provider value={value}>{children}</WeatherCtx.Provider>;
}

// ─── Hook consommateur ────────────────────────────────────────────────────────
export function useWeatherCtx() {
  const ctx = useContext(WeatherCtx);
  if (!ctx) throw new Error("useWeatherCtx doit être utilisé dans <WeatherProvider>");
  return ctx;
}
