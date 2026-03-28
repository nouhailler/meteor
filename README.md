# ☄️ Meteor — Tableau de bord météo

[![Version](https://img.shields.io/badge/version-1.2.0-blue)](https://github.com/nouhailler/meteor-weather/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Open Source](https://img.shields.io/badge/open%20source-yes-brightgreen)](https://github.com/nouhailler/meteor-weather)
[![Data](https://img.shields.io/badge/data-Open--Meteo-orange)](https://open-meteo.com)

Application météo desktop **100% open source**, construite avec **React + Vite**, sans compte utilisateur, sans clé API, sans télémétrie. Toutes les données proviennent de services gratuits et conformes RGPD.

---

## ✨ Fonctionnalités

### Tableau de bord
- **Image contextuelle** — photo de la ville via Wikimedia Commons, avec fallback automatique sur le drapeau du pays (via flagcdn.com) si aucune image n'est trouvée en 5 secondes
- **Alertes météo automatiques** — bandeaux dismissables pour vent fort (≥30 km/h), UV élevés (≥6), précipitations, gel, cumul journalier important
- **Prévisions horaires** — carousel des 24 prochaines heures, cliquable, avec probabilité de précipitation
- **Métriques temps réel** — Humidité (+ point de rosée), Indice UV (+ barre colorée), Vent (vitesse + direction), Pression atmosphérique (+ tendance)
- **Courbe de température** — graphique Chart.js animé, amplitude automatique ±3° autour du min/max réel
- **Prévisions 7 jours** — cartes cliquables avec lever/coucher du soleil et probabilité de pluie
- **Fenêtre détail journée** — modal avec 8 métriques : max/min, précipitations, prob. pluie, vent max, UV, lever et coucher du soleil

### Carte interactive
- Fond de carte au choix : Standard (OSM), Topographie, Sombre (CARTO), Satellite (Esri)
- **Données météo sur la carte** — grille 5×5 de 25 points en temps réel via Open-Meteo
- 4 overlays fonctionnels : Précipitations (cercles proportionnels), Température (gradient froid→chaud), Vent (vert→rouge), Nuages (opacité)
- Zoom +/− fonctionnel, bouton "Ma position" (GPS)
- Légende contextuelle adaptée au calque sélectionné

### Qualité de l'air
- **Vue En Direct** — jauge IQA circulaire, 6 polluants (PM2.5, PM10, NO₂, O₃, CO, SO₂), recommandations santé
- **Historique 24h** — graphique en barres Chart.js coloré par niveau, tableau heure par heure

### Historique
- **Mode 24h** — données horaires du contexte React (aucun appel API supplémentaire)
- **Modes 7j / 30j / 90j** — Open-Meteo Archive API, graphiques température + précipitations
- **Export CSV** — fichier nommé automatiquement avec ville et période

### Paramètres
- Bascule °C / °F persistée (appliquée sur tous les écrans)
- Langue : Français, English, Deutsch
- Notifications configurables par type
- Section "À propos" avec version, licence et liens sources

### Documentation intégrée
- **Aide contextuelle** — bouton `?` dans chaque fenêtre, panneau latéral slide-in
- 5 sections de documentation adaptées à chaque page de l'application

---

## 🚀 Démarrage rapide

### Depuis les sources

```bash
git clone https://github.com/nouhailler/meteor-weather.git
cd meteor-weather/app
npm install
npm run dev
# → http://localhost:5173
```

### Depuis le paquet Debian (.deb)

```bash
# Téléchargez le fichier .deb depuis la page Releases
sudo dpkg -i meteor-weather_1.2.0_amd64.deb
sudo apt install -f   # Résoudre les dépendances manquantes si nécessaire
# Lancez l'application
meteor-weather
```

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | React 18 + Vite 5 |
| État global | React Context + localStorage |
| Graphiques | Chart.js 4 + react-chartjs-2 |
| Cartes | Leaflet 1.9 + react-leaflet 4 |
| Icônes | Material Symbols Outlined |
| Typographie | Manrope + Inter (Google Fonts) |
| Météo | Open-Meteo API (gratuit, sans clé) |
| Qualité de l'air | Open-Meteo Air Quality API |
| Historique | Open-Meteo Archive API |
| Géocodage | Nominatim / OpenStreetMap |
| Images villes | Wikimedia Commons API |
| Drapeaux | flagcdn.com |
| Packaging | Paquet Debian (.deb) |

---

## 📁 Architecture du projet

```
meteor-weather/
├── app/                          # Code source React/Vite
│   ├── index.html                # Point d'entrée (Leaflet CSS inclus)
│   ├── package.json
│   └── src/
│       ├── App.jsx               # Routeur principal + WeatherProvider
│       ├── WeatherContext.jsx    # État global (location, météo, prefs)
│       ├── WeatherDashboard.jsx  # Page Tableau de bord (layout complet)
│       ├── Layout.jsx            # Shell partagé sidebar + header + aide
│       ├── SearchBar.jsx         # Recherche Nominatim + GPS
│       ├── HelpPanel.jsx         # Documentation contextuelle (panneau ?)
│       ├── DayDetailModal.jsx    # Modal détail journée (portal React)
│       ├── LoadingState.jsx      # Spinner + ErrorState
│       ├── tokens.js             # Design system (couleurs, styles partagés)
│       ├── hooks/
│       │   ├── useWeather.js         # Open-Meteo forecast + computeAlerts()
│       │   ├── useAirQuality.js      # Open-Meteo Air Quality
│       │   ├── useHistorical.js      # Open-Meteo Archive (7/30/90j)
│       │   ├── useGeoSearch.js       # Nominatim + GPS
│       │   ├── useNearbyWeather.js   # Grille 5×5 autour de la ville (carte)
│       │   └── useCityImage.js       # Wikipedia → image ville, fallback drapeau
│       └── pages/
│           ├── CartesPage.jsx        # Leaflet + overlays météo
│           ├── AirPage.jsx           # Jauge IQA + polluants + historique 24h
│           ├── HistoriquePage.jsx    # 24h/7j/30j/90j + Chart.js + export CSV
│           └── ParamètresPage.jsx    # Préférences + À propos + Sources
├── packaging/
│   ├── build-deb.sh              # Build Electron → .deb
│   └── push-github.sh            # git + gh CLI → GitHub + release
└── README.md
```

---

## 🌐 Sources de données (toutes gratuites, sans clé API)

| Service | Usage | URL |
|---------|-------|-----|
| **Open-Meteo** | Météo temps réel + prévisions | https://open-meteo.com |
| **Open-Meteo Air Quality** | PM2.5, PM10, NO₂, O₃, CO, SO₂ | https://air-quality-api.open-meteo.com |
| **Open-Meteo Archive** | Historique jusqu'à 90 jours | https://archive-api.open-meteo.com |
| **Nominatim / OSM** | Géocodage + autocomplétion | https://nominatim.openstreetmap.org |
| **OpenStreetMap** | Tuiles de carte standard | https://www.openstreetmap.org |
| **CARTO** | Tuiles carte sombre | https://carto.com |
| **Esri** | Tuiles satellite | https://www.esri.com |
| **Wikimedia Commons** | Photos des villes | https://commons.wikimedia.org |
| **flagcdn.com** | Drapeaux des pays | https://flagcdn.com |

---

## 🧪 Commandes de développement

```bash
npm run dev      # Serveur développement avec hot-reload → localhost:5173
npm run build    # Build de production → app/dist/
npm run preview  # Prévisualiser le build
```

---

## 📦 Créer et publier le paquet Debian

```bash
cd ~/claude-workspace/meteor

# Build uniquement
bash packaging/build-deb.sh
# → meteor-weather_1.2.0_amd64.deb dans release/

# Push GitHub + release + .deb attaché
bash packaging/push-github.sh
```

---

## 🗺️ Feuille de route

- [ ] Support multilingue complet (i18n)
- [ ] Widgets météo configurables
- [ ] Mode hors-ligne avec cache des dernières données
- [ ] Support OpenWeatherMap (tuiles météo temps réel sur la carte)
- [ ] Thèmes de couleur alternatifs

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commitez vos changements (`git commit -m 'feat: description'`)
4. Poussez (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

---

## 📄 Licence

Distribué sous licence **MIT**. Voir `LICENSE` pour plus d'informations.

---

**Projet maintenu par [Patrick](https://github.com/nouhailler)**  
Aucun compte requis · Aucune clé API · 100% open source
