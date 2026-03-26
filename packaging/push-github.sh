#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# push-github.sh — Commit tout et pousse sur GitHub
#
# Prérequis :
#   sudo apt install git gh
#   gh auth login   (une seule fois)
#
# Usage :
#   cd /home/patrick/claude-workspace/meteor
#   bash packaging/push-github.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_NAME="atmosphere-weather"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "═══════════════════════════════════════════"
echo "  Atmosphere — Push GitHub"
echo "═══════════════════════════════════════════"

# ── 1. Init git si besoin ──────────────────────────────────────────────────────
if [ ! -d ".git" ]; then
  git init
  git branch -M main
  echo "▶ Dépôt git initialisé"
fi

# ── 2. Configurer l'identité git si pas encore fait ───────────────────────────
if ! git config user.email > /dev/null 2>&1; then
  git config user.email "patrick@atmosphere.local"
  git config user.name  "Patrick Favre"
fi

# ── 3. Vérifier / créer le remote origin ──────────────────────────────────────
GH_USER=$(gh api user --jq .login 2>/dev/null || echo "")
if [ -z "$GH_USER" ]; then
  echo ""
  echo "  ✗ GitHub CLI non authentifié."
  echo "  Exécute d'abord :  gh auth login"
  exit 1
fi

REPO_URL="https://github.com/${GH_USER}/${REPO_NAME}.git"

if git remote get-url origin > /dev/null 2>&1; then
  echo "▶ Remote origin déjà configuré : $(git remote get-url origin)"
else
  # Créer le repo si inexistant
  if gh repo view "${GH_USER}/${REPO_NAME}" > /dev/null 2>&1; then
    echo "▶ Repo GitHub existant trouvé"
  else
    echo "▶ Création du repo GitHub '${REPO_NAME}'..."
    gh repo create "$REPO_NAME" \
      --description "Tableau de bord météo React + Open-Meteo · Design Google Stitch" \
      --public \
      --confirm 2>/dev/null || \
    gh repo create "$REPO_NAME" \
      --description "Tableau de bord météo React + Open-Meteo · Design Google Stitch" \
      --public 2>/dev/null || true
  fi
  git remote add origin "$REPO_URL"
  echo "▶ Remote origin ajouté : $REPO_URL"
fi

# ── 4. Branche principale ──────────────────────────────────────────────────────
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
if [ "$CURRENT_BRANCH" != "main" ]; then
  git branch -M main
fi

# ── 5. Staging + commit ───────────────────────────────────────────────────────
echo ""
echo "▶ Ajout de tous les fichiers..."
git add -A

# Vérifier s'il y a quelque chose à committer
if git diff --cached --quiet; then
  echo "  ℹ  Rien de nouveau à committer — le dépôt est à jour."
else
  TIMESTAMP=$(date "+%Y-%m-%d %H:%M")
  git commit -m "feat: application météo complète — React + Open-Meteo + Context

- Hook useWeather : données réelles Open-Meteo (forecast, hourly, daily)
- Hook useAirQuality : PM2.5/PM10/NO2/O3/SO2/CO via Open-Meteo Air Quality
- Hook useHistorical : 7/30/90 jours via Open-Meteo Archive + export CSV
- Hook useGeoSearch : autocomplétion Nominatim + GPS navigator.geolocation
- WeatherContext : état global (location, prefs °C/°F) persisté localStorage
- SearchBar : recherche live avec dropdown + bouton GPS
- 5 pages branchées sur données réelles : Dashboard, Cartes, Air, Historique, Paramètres
- LoadingSpinner + ErrorState pour tous les états de chargement
- Design system Stitch (Manrope + Inter + Material Symbols)

Mise à jour : $TIMESTAMP"
  echo "  ✓ Commit effectué"
fi

# ── 6. Push ───────────────────────────────────────────────────────────────────
echo ""
echo "▶ Push vers GitHub..."
git push -u origin main --force-with-lease 2>/dev/null || \
git push -u origin main --force 2>/dev/null || \
git push -u origin main

echo ""
echo "═══════════════════════════════════════════"
echo "  ✓ Projet disponible sur GitHub :"
echo "  → https://github.com/${GH_USER}/${REPO_NAME}"
echo "═══════════════════════════════════════════"
