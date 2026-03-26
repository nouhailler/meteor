# Atmosphere — Tableau de bord Météo

Application météo desktop construite avec **Vite + React**, design exporté depuis Google Stitch, données réelles via **Open-Meteo** (gratuit, sans clé API).

![Dashboard](stitch_export/screenshots/tableau_de_bord_météo_nav.png)

## Démarrage rapide

```bash
cd app
npm install
npm run dev
# → http://localhost:5173
```

## Fonctionnalités

- **Données réelles** — températures, vent, UV, humidité, pression via [Open-Meteo](https://open-meteo.com)
- **Qualité de l'air** — PM2.5, PM10, NO2, O3, SO2, CO via Open-Meteo Air Quality API
- **Historique météo** — jusqu'à 90 jours via Open-Meteo Archive API + export CSV
- **Recherche de villes** — autocomplétion via [Nominatim](https://nominatim.openstreetmap.org) (OpenStreetMap)
- **Géolocalisation GPS** — bouton ma position avec reverse geocoding automatique
- **Préférences persistées** — unité °C/°F, ville favorite sauvegardées dans localStorage
- **5 écrans** — Tableau de bord, Cartes, Qualité de l'air, Historique, Paramètres

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | React 18 + Vite 5 |
| État global | React Context |
| Données météo | Open-Meteo API |
| Géocodage | Nominatim / OpenStreetMap |
| Design | Google Stitch (export) |
| Icônes | Material Symbols Outlined |
| Typographie | Manrope + Inter |
| Packaging | Electron + electron-builder |

## Architecture

```
app/src/
├── App.jsx                 ← Routeur + WeatherProvider
├── WeatherContext.jsx      ← État global (location, prefs, data)
├── Layout.jsx              ← Shell partagé (sidebar + header)
├── SearchBar.jsx           ← Recherche live + GPS
├── LoadingState.jsx        ← Spinner + état d'erreur
├── WeatherDashboard.jsx    ← Page principale
├── tokens.js               ← Design system (couleurs, styles)
└── hooks/
│   ├── useWeather.js       ← Open-Meteo forecast
│   ├── useAirQuality.js    ← Open-Meteo air quality
│   ├── useGeoSearch.js     ← Nominatim + navigator.geolocation
│   └── useHistorical.js    ← Open-Meteo archive
└── pages/
    ├── CartesPage.jsx
    ├── AirPage.jsx
    ├── HistoriquePage.jsx
    └── ParamètresPage.jsx
```

## Commandes

```bash
npm run dev      # Serveur de développement (hot-reload)
npm run build    # Build de production → app/dist/
npm run preview  # Prévisualiser le build
```

## Packaging Debian (.deb)

```bash
cd /home/patrick/claude-workspace/meteor
bash packaging/build-deb.sh
sudo dpkg -i release/atmosphere-weather_1.0.0_amd64.deb
```

## Sources de données

- Météo & prévisions : [Open-Meteo](https://open-meteo.com) — gratuit, sans clé, RGPD-compliant
- Qualité de l'air : [Open-Meteo Air Quality](https://air-quality-api.open-meteo.com)
- Historique : [Open-Meteo Archive](https://archive-api.open-meteo.com)
- Géocodage : [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org)

## Licence

MIT
