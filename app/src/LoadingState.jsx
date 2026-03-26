// ─── LoadingState.jsx ─────────────────────────────────────────────────────────
// Composant réutilisable pour afficher loading / erreur dans les pages

import { t } from "./tokens.js";
import { Icon } from "./Layout.jsx";

export function LoadingSpinner({ message = "Chargement des données…" }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:400, gap:20,
      color: t.onSurfaceVariant,
    }}>
      <div style={{
        width:48, height:48, borderRadius:"50%",
        border:`3px solid ${t.surfaceContainerHighest}`,
        borderTopColor: t.primary,
        animation:"spin 0.8s linear infinite",
      }}/>
      <p style={{ fontSize:14, margin:0 }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:400, gap:16,
    }}>
      <Icon name="cloud_off" size={48} style={{ color: t.onSurfaceVariant }}/>
      <p style={{ fontSize:15, color: t.onSurface, margin:0 }}>Impossible de charger les données</p>
      <p style={{ fontSize:12, color: t.onSurfaceVariant, margin:0, maxWidth:320, textAlign:"center" }}>
        {message}
      </p>
      {onRetry && (
        <button onClick={onRetry} style={{
          padding:"8px 20px", backgroundColor: t.primary, color: t.onPrimaryContainer,
          border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer",
        }}>
          Réessayer
        </button>
      )}
    </div>
  );
}
