// ─── useCityImage.js ──────────────────────────────────────────────────────────
// Cherche une image de la ville via l'API Wikipedia/Wikimedia Commons.
// Fallback automatique : drapeau du pays via flagcdn.com (fiable, sans clé).
//
// Retourne : { imageUrl, flagUrl, isFlag, loading }
//   imageUrl : URL de l'image à afficher (ville ou drapeau)
//   flagUrl  : URL du drapeau toujours disponible
//   isFlag   : true si on affiche le drapeau (pas de photo de ville trouvée)

import { useState, useEffect } from "react";

// ─── Correspondance pays → code ISO 3166-1 alpha-2 ───────────────────────────
// On normalise le nom de pays reçu de Nominatim vers un code ISO
const COUNTRY_TO_ISO = {
  // Europe
  "France":"fr","Suisse":"ch","Allemagne":"de","Italie":"it","Espagne":"es",
  "Portugal":"pt","Belgique":"be","Pays-Bas":"nl","Luxembourg":"lu","Autriche":"at",
  "Suède":"se","Norvège":"no","Danemark":"dk","Finlande":"fi","Islande":"is",
  "Irlande":"ie","Royaume-Uni":"gb","United Kingdom":"gb","Pologne":"pl","Tchéquie":"cz",
  "Slovaquie":"sk","Hongrie":"hu","Roumanie":"ro","Bulgarie":"bg","Grèce":"gr",
  "Croatie":"hr","Serbie":"rs","Slovénie":"si","Bosnie-Herzégovine":"ba",
  "Monténégro":"me","Macédoine du Nord":"mk","Albanie":"al","Kosovo":"xk",
  "Ukraine":"ua","Biélorussie":"by","Moldavie":"md","Russie":"ru","Turquie":"tr",
  "Chypre":"cy","Malte":"mt","Liechtenstein":"li","Monaco":"mc","Andorre":"ad",
  "Saint-Marin":"sm",
  // Amérique
  "États-Unis":"us","United States":"us","Canada":"ca","Mexique":"mx",
  "Brésil":"br","Argentine":"ar","Chili":"cl","Colombie":"co","Pérou":"pe",
  "Venezuela":"ve","Équateur":"ec","Bolivie":"bo","Paraguay":"py","Uruguay":"uy",
  "Cuba":"cu","Haïti":"ht","République dominicaine":"do","Jamaïque":"jm",
  // Asie
  "Chine":"cn","Japon":"jp","Corée du Sud":"kr","Inde":"in","Pakistan":"pk",
  "Bangladesh":"bd","Thaïlande":"th","Vietnam":"vn","Indonésie":"id",
  "Malaisie":"my","Philippines":"ph","Singapour":"sg","Myanmar":"mm",
  "Cambodge":"kh","Laos":"la","Mongolie":"mn","Kazakhstan":"kz",
  "Ouzbékistan":"uz","Azerbaïdjan":"az","Géorgie":"ge","Arménie":"am",
  "Iran":"ir","Irak":"iq","Syrie":"sy","Liban":"lb","Jordanie":"jo",
  "Israël":"il","Arabie saoudite":"sa","Yémen":"ye","Oman":"om",
  "Émirats arabes unis":"ae","Qatar":"qa","Koweït":"kw","Bahreïn":"bh",
  "Afghanistan":"af","Népal":"np","Sri Lanka":"lk",
  // Afrique
  "Maroc":"ma","Algérie":"dz","Tunisie":"tn","Libye":"ly","Égypte":"eg",
  "Sénégal":"sn","Côte d'Ivoire":"ci","Ghana":"gh","Nigéria":"ng",
  "Cameroun":"cm","Kenya":"ke","Éthiopie":"et","Tanzanie":"tz","Ouganda":"ug",
  "Mozambique":"mz","Zimbabwe":"zw","Zambie":"zm","Afrique du Sud":"za",
  "Madagascar":"mg","Mauritanie":"mr","Mali":"ml","Niger":"ne","Tchad":"td",
  "Soudan":"sd","Somalie":"so","Angola":"ao","Congo":"cg",
  // Océanie
  "Australie":"au","Nouvelle-Zélande":"nz","Papouasie-Nouvelle-Guinée":"pg",
  "Fidji":"fj","Samoa":"ws",
};

function countryToIso(countryName) {
  if (!countryName) return null;
  // Cherche d'abord exact
  if (COUNTRY_TO_ISO[countryName]) return COUNTRY_TO_ISO[countryName];
  // Cherche partiel (insensible à la casse)
  const lower = countryName.toLowerCase();
  for (const [name, code] of Object.entries(COUNTRY_TO_ISO)) {
    if (lower.includes(name.toLowerCase()) || name.toLowerCase().includes(lower)) return code;
  }
  return null;
}

function flagUrl(iso) {
  if (!iso) return null;
  return `https://flagcdn.com/w320/${iso.toLowerCase()}.png`;
}

// ─── Fetch image Wikipedia ────────────────────────────────────────────────────
async function fetchWikimediaImage(cityName, signal) {
  // Étape 1 : chercher la page Wikipedia de la ville (en français d'abord, puis en anglais)
  for (const lang of ["fr", "en"]) {
    try {
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?` + new URLSearchParams({
        action:   "query",
        list:     "search",
        srsearch: cityName,
        srlimit:  1,
        format:   "json",
        origin:   "*",
      });
      const res  = await fetch(searchUrl, { signal });
      const json = await res.json();
      const hit  = json.query?.search?.[0];
      if (!hit) continue;

      // Étape 2 : récupérer l'image principale de la page
      const pageUrl = `https://${lang}.wikipedia.org/w/api.php?` + new URLSearchParams({
        action:    "query",
        titles:    hit.title,
        prop:      "pageimages",
        pithumbsize: 1200,
        piprop:    "thumbnail|original",
        format:    "json",
        origin:    "*",
      });
      const pageRes  = await fetch(pageUrl, { signal });
      const pageJson = await pageRes.json();
      const pages    = pageJson.query?.pages ?? {};
      const page     = Object.values(pages)[0];

      const url = page?.original?.source ?? page?.thumbnail?.source ?? null;
      if (url) return url;
    } catch (e) {
      if (e.name === "AbortError") throw e;
      // Continue avec la langue suivante
    }
  }
  return null;
}

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useCityImage(city, country) {
  const [state, setState] = useState({ imageUrl:null, flagUrl:null, isFlag:true, loading:false });

  useEffect(() => {
    if (!city) return;

    const isoCode = countryToIso(country);
    const flag    = flagUrl(isoCode);

    // Afficher le drapeau immédiatement pendant le chargement Wikipedia
    setState({ imageUrl: flag, flagUrl: flag, isFlag: true, loading: true });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s max

    fetchWikimediaImage(city, controller.signal)
      .then(url => {
        clearTimeout(timeout);
        if (url) {
          setState({ imageUrl: url, flagUrl: flag, isFlag: false, loading: false });
        } else {
          setState({ imageUrl: flag, flagUrl: flag, isFlag: true, loading: false });
        }
      })
      .catch(err => {
        clearTimeout(timeout);
        if (err.name !== "AbortError") {
          console.warn("[useCityImage]", err);
        }
        // Fallback drapeau dans tous les cas d'erreur
        setState({ imageUrl: flag, flagUrl: flag, isFlag: true, loading: false });
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [city, country]);

  return state;
}
