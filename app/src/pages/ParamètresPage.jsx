import { t, shared } from "../tokens.js";
import { Icon } from "../Layout.jsx";
import { useWeatherCtx } from "../WeatherContext.jsx";

function Toggle({ checked, onChange }) {
  return (
    <label style={{ position:"relative", display:"inline-flex", alignItems:"center", cursor:"pointer" }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ position:"absolute",opacity:0,width:0,height:0 }}/>
      <div style={{ width:52, height:28, borderRadius:9999, backgroundColor:checked?t.primary:t.surfaceContainerHighest, position:"relative", transition:"background-color 0.2s" }}>
        <div style={{ position:"absolute", top:4, left:checked?24:4, width:20, height:20, borderRadius:"50%", backgroundColor:"#fff", transition:"left 0.2s" }}/>
      </div>
    </label>
  );
}

export default function ParamètresPage() {
  const { prefs, setPrefs } = useWeatherCtx();

  const notifItems = [
    { key:"alertes",     title:"Alertes météo graves",    sub:"Recevez des alertes immédiates en cas de phénomènes extrêmes." },
    { key:"quotidiennes",title:"Prévisions quotidiennes", sub:"Un résumé météo chaque matin à 8h00." },
    { key:"air",         title:"Qualité de l'air",        sub:"Alertes lorsque l'indice dépasse le seuil modéré." },
  ];

  const notifState = prefs.notifs ?? { alertes:true, quotidiennes:true, air:false };

  function toggleNotif(key) {
    setPrefs({ notifs: { ...notifState, [key]: !notifState[key] } });
  }

  return (
    <div style={{ ...shared.content, paddingTop:32 }}>
      <div style={{ marginBottom:40 }}>
        <h1 style={shared.pageTitle}>Paramètres</h1>
        <p style={shared.pageSub}>Gérez votre compte et vos préférences atmosphériques.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"8fr 4fr", gap:32, alignItems:"start" }}>
        {/* Colonne gauche */}
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

          {/* Profil */}
          <section style={{ ...shared.glass, padding:32 }}>
            <div style={{ display:"flex", alignItems:"center", gap:28 }}>
              <div style={{ position:"relative" }}>
                <div style={{ width:80, height:80, borderRadius:"50%", backgroundColor:t.surfaceContainerHighest, border:`3px solid ${t.primary}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:900, color:t.primary, fontFamily:"'Manrope',sans-serif" }}>PF</div>
                <button style={{ position:"absolute", bottom:0, right:0, backgroundColor:t.primary, border:"none", borderRadius:"50%", width:26, height:26, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon name="photo_camera" size={14} style={{ color:t.onPrimaryContainer }}/>
                </button>
              </div>
              <div style={{ flex:1 }}>
                <h2 style={{ fontSize:22, fontWeight:700, fontFamily:"'Manrope',sans-serif", color:"#fff", margin:0 }}>Patrick Favre</h2>
                <p style={{ fontSize:14, color:t.onSurfaceVariant, margin:"4px 0 12px" }}>patrick@example.ch</p>
                <button style={{ padding:"8px 18px", backgroundColor:t.surfaceContainerHighest, border:`1px solid ${t.primary}33`, borderRadius:12, fontSize:13, fontWeight:600, color:t.primary, cursor:"pointer" }}>
                  Éditer le profil
                </button>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section style={{ ...shared.glass, padding:32 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <div style={{ padding:8, backgroundColor:`${t.primary}18`, borderRadius:10 }}>
                <Icon name="notifications_active" size={20} style={{ color:t.primary }}/>
              </div>
              <h2 style={{ fontSize:18, fontWeight:700, fontFamily:"'Manrope',sans-serif", color:"#fff", margin:0 }}>Notifications</h2>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {notifItems.map(item => (
                <div key={item.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", backgroundColor:"rgba(255,255,255,0.04)", borderRadius:16 }}>
                  <div>
                    <p style={{ fontWeight:600, color:t.onSurface, margin:"0 0 3px", fontSize:14 }}>{item.title}</p>
                    <p style={{ fontSize:12, color:t.onSurfaceVariant, margin:0 }}>{item.sub}</p>
                  </div>
                  <Toggle checked={notifState[item.key]} onChange={() => toggleNotif(item.key)}/>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Colonne droite */}
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

          {/* Préférences */}
          <section style={{ ...shared.glass, padding:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <div style={{ padding:8, backgroundColor:`${t.primary}18`, borderRadius:10 }}>
                <Icon name="tune" size={20} style={{ color:t.primary }}/>
              </div>
              <h2 style={{ fontSize:18, fontWeight:700, fontFamily:"'Manrope',sans-serif", color:"#fff", margin:0 }}>Préférences</h2>
            </div>

            {/* Unité température */}
            <p style={{ fontSize:13, color:t.onSurfaceVariant, marginBottom:10 }}>Unités de température</p>
            <div style={{ display:"flex", backgroundColor:t.surfaceContainerHighest, borderRadius:12, padding:4, marginBottom:24 }}>
              {[{u:"C",l:"Celsius (°C)"},{u:"F",l:"Fahrenheit (°F)"}].map(({u,l}) => (
                <button key={u} onClick={() => setPrefs({ unit:u })} style={{
                  flex:1, padding:"8px 0", borderRadius:10, fontSize:12, fontWeight:prefs.unit===u?700:400,
                  backgroundColor:prefs.unit===u?t.primary:"transparent",
                  color:prefs.unit===u?t.onPrimaryContainer:t.onSurfaceVariant,
                  border:"none", cursor:"pointer",
                }}>{l}</button>
              ))}
            </div>

            {/* Langue */}
            <p style={{ fontSize:13, color:t.onSurfaceVariant, marginBottom:10 }}>Langue</p>
            <div style={{ position:"relative" }}>
              <select
                value={prefs.lang ?? "fr"}
                onChange={e => setPrefs({ lang: e.target.value })}
                style={{ width:"100%", backgroundColor:t.surfaceContainerHighest, border:"none", borderRadius:12, padding:"10px 14px", color:t.onSurface, fontSize:13, appearance:"none", cursor:"pointer" }}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
              <Icon name="expand_more" size={18} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:t.onSurfaceVariant, pointerEvents:"none" }}/>
            </div>
          </section>

          {/* Compte */}
          <section style={{ ...shared.glass, padding:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <div style={{ padding:8, backgroundColor:`${t.primary}18`, borderRadius:10 }}>
                <Icon name="lock" size={20} style={{ color:t.primary }}/>
              </div>
              <h2 style={{ fontSize:18, fontWeight:700, fontFamily:"'Manrope',sans-serif", color:"#fff", margin:0 }}>Compte</h2>
            </div>
            <button style={{ width:"100%", textAlign:"left", padding:"12px 14px", borderRadius:14, backgroundColor:"rgba(255,255,255,0.04)", border:"none", color:t.onSurface, fontSize:14, fontWeight:500, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              Changer le mot de passe
              <Icon name="chevron_right" size={18} style={{ color:t.onSurfaceVariant }}/>
            </button>
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:16 }}>
              <button style={{ width:"100%", padding:"12px 14px", borderRadius:14, backgroundColor:`${t.error}18`, border:"none", color:t.error, fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
                <Icon name="logout" size={18}/> Déconnexion
              </button>
              <p style={{ fontSize:10, textAlign:"center", marginTop:14, color:t.onSurfaceVariant, textTransform:"uppercase", letterSpacing:"0.1em" }}>
                Atmosphere v1.0.0 · Open-Meteo
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
