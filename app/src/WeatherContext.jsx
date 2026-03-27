import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useWeather } from "./hooks/useWeather.js";
import { useAirQuality } from "./hooks/useAirQuality.js";
import { reverseGeocode } from "./hooks/useGeoSearch.js";

const DEFAULT_LOCATION = { lat: 46.2044, lon: 6.1432, city: "Genève", country: "Suisse" };
const LS_KEY_LOC   = "atm_location";
const LS_KEY_PREFS = "atm_prefs";

function loadLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function toDisplayTemp(celsius, unit) {
  if (unit === "F") return Math.round(celsius * 9/5 + 32);
  return Math.round(celsius);
}
export function unitSymbol(unit) { return unit === "F" ? "°F" : "°C"; }

const WeatherCtx = createContext(null);

export function WeatherProvider({ children }) {
  const [location, _setLocation] = useState(() => loadLS(LS_KEY_LOC, DEFAULT_LOCATION));
  const [prefs,    setPrefsState] = useState(() => loadLS(LS_KEY_PREFS, { unit:"C", lang:"fr" }));

  useEffect(() => saveLS(LS_KEY_LOC,   location), [location]);
  useEffect(() => saveLS(LS_KEY_PREFS, prefs),    [prefs]);

  const setLocation = useCallback(async ({ lat, lon, city, country }) => {
    let resolvedCity    = city;
    let resolvedCountry = country;
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

  const weather    = useWeather(location.lat, location.lon);
  const airQuality = useAirQuality(location.lat, location.lon);

  const value = {
    location, setLocation,
    weather, airQuality,
    prefs, setPrefs,
    current:  weather.data?.current  ?? null,
    hourly:   weather.data?.hourly   ?? [],
    daily:    weather.data?.daily    ?? [],
    aq:       airQuality.data        ?? null,
    loading:  weather.loading,
    error:    weather.error,
  };

  return <WeatherCtx.Provider value={value}>{children}</WeatherCtx.Provider>;
}

export function useWeatherCtx() {
  const ctx = useContext(WeatherCtx);
  if (!ctx) throw new Error("useWeatherCtx doit être utilisé dans <WeatherProvider>");
  return ctx;
}
