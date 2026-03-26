// ─── useGeoSearch.js ──────────────────────────────────────────────────────────
// Recherche de villes via Nominatim (OpenStreetMap) — gratuit, sans clé
// + accès GPS via navigator.geolocation
// + reverse geocoding (coords → nom de ville)

import { useState, useCallback, useRef } from "react";

const NOMINATIM = "https://nominatim.openstreetmap.org";

// ─── Recherche texte → liste de lieux ────────────────────────────────────────
export function useGeoSearch() {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback((query) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          q:              query,
          format:         "json",
          limit:          6,
          addressdetails: 1,
          "accept-language": "fr",
        });
        const res = await fetch(`${NOMINATIM}/search?${params}`, {
          headers: { "Accept-Language": "fr" },
        });
        const json = await res.json();

        setResults(json.map(place => ({
          id:      place.place_id,
          name:    place.display_name.split(",").slice(0, 3).join(", "),
          lat:     parseFloat(place.lat),
          lon:     parseFloat(place.lon),
          country: place.address?.country_code?.toUpperCase() ?? "",
          city:    place.address?.city
                ?? place.address?.town
                ?? place.address?.village
                ?? place.name,
        })));
      } catch (e) {
        console.error("[useGeoSearch]", e);
      } finally {
        setSearching(false);
      }
    }, 350); // debounce 350ms
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, searching, search, clear };
}

// ─── Reverse geocoding (lat/lon → nom de lieu) ───────────────────────────────
export async function reverseGeocode(lat, lon) {
  try {
    const params = new URLSearchParams({
      lat, lon,
      format: "json",
      "accept-language": "fr",
      zoom: 10,
    });
    const res = await fetch(`${NOMINATIM}/reverse?${params}`);
    const json = await res.json();
    const a = json.address ?? {};
    return {
      city:    a.city ?? a.town ?? a.village ?? a.municipality ?? json.name ?? "Lieu inconnu",
      country: a.country ?? "",
      countryCode: a.country_code?.toUpperCase() ?? "",
    };
  } catch (e) {
    console.error("[reverseGeocode]", e);
    return { city: "Lieu inconnu", country: "", countryCode: "" };
  }
}

// ─── GPS : demande la position de l'utilisateur ──────────────────────────────
export function useGPS() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const locate = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = "Géolocalisation non supportée par ce navigateur.";
        setError(err);
        reject(err);
        return;
      }
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLoading(false);
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        err => {
          setLoading(false);
          const msg = err.code === 1 ? "Permission refusée."
                    : err.code === 2 ? "Position indisponible."
                    : "Délai dépassé.";
          setError(msg);
          reject(msg);
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    });
  }, []);

  return { loading, error, locate };
}
