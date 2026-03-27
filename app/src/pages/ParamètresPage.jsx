import { t, shared } from "../tokens.js";
import { Icon } from "../Layout.jsx";
import { useWeatherCtx } from "../WeatherContext.jsx";

function Toggle({ checked, onChange }) {
  return (
    <label style={{ position:"relative", display:"inline-flex", alignItems:"center", cursor:"pointer" }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ position:"absolute",opacity:0,width:0,height:0 }}/>
      <div style={{ width:52,height:28,borderRadius:9999,backgroundColor:checked?t.primary:t.surfaceContainerHighest,position:"relative",transition:"background-color 0.2s" }}>
        <div style={{ position:"absolute",top:4,left:checked?24:4,width:20,height:20,borderRadius:"50%",backgroundColor:"#fff",transition:"left 0.2s" }}/>
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
  const toggleNotif = (key) => setPrefs({ notifs:{ ...notifState, [key]:!notifState[key] } });

  return (
    <div style={{ ...shared.content, paddingTop:32 }}>
      <div style={{ marginBottom:40 }}>
        <h1 style={shared.pageTitle}>Paramètres</h1>
        <p style={shared.pageSub}>Préférences et notifications de l'application.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"8fr 4fr", gap:32, alignItems:"start" }}>

        {/* ── Colonne gauche ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

          {/* Notifications */}
          <section style={{ ...shared.glass, padding:32 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <div style={{ padding:8,backgroundColor:`${t.primary}18`,borderRadius:10 }}>
                <Icon name="notifications_active" size={20} style={{ color:t.primary }}/>
              </div>
              <h2 style={{ fontSize:18,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:"#fff",margin:0 }}>Notifications</h2>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {notifItems.map(item => (
                <div key={item.key} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",backgroundColor:"rgba(255,255,255,0.04)",borderRadius:16 }}>
                  <div>
                    <p style={{ fontWeight:600,color:t.onSurface,margin:"0 0 3px",fontSize:14 }}>{item.title}</p>
                    <p style={{ fontSize:12,color:t.onSurfaceVariant,margin:0 }}>{item.sub}</p>
                  </div>
                  <Toggle checked={notifState[item.key]} onChange={() => toggleNotif(item.key)}/>
                </div>
              ))}
            </div>
          </section>

          {/* À propos */}
          <section style={{ ...shared.glass, padding:32 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <div style={{ padding:8,backgroundColor:`${t.primary}18`,borderRadius:10 }}>
                <Icon name="info" size={20} style={{ color:t.primary }}/>
              </div>
              <h2 style={{ fontSize:18,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:"#fff",margin:0 }}>À propos</h2>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { label:"Application",   val:"Meteor Weather" },
                { label:"Version",       val:"v1.1.0" },
                { label:"Licence",       val:"MIT — Open Source" },
                { label:"Données météo", val:"Open-Meteo (gratuit, sans clé)" },
                { label:"Géocodage",     val:"Nominatim / OpenStreetMap" },
                { label:"Cartes",        val:"OpenStreetMap · CARTO · Esri" },
              ].map((row,i) => (
                <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<5?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <span style={{ fontSize:13,color:t.onSurfaceVariant }}>{row.label}</span>
                  <span style={{ fontSize:13,color:t.onSurface,fontWeight:600 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Colonne droite ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

          {/* Préférences */}
          <section style={{ ...shared.glass, padding:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <div style={{ padding:8,backgroundColor:`${t.primary}18`,borderRadius:10 }}>
                <Icon name="tune" size={20} style={{ color:t.primary }}/>
              </div>
              <h2 style={{ fontSize:18,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:"#fff",margin:0 }}>Préférences</h2>
            </div>

            <p style={{ fontSize:13,color:t.onSurfaceVariant,marginBottom:10 }}>Unités de température</p>
            <div style={{ display:"flex",backgroundColor:t.surfaceContainerHighest,borderRadius:12,padding:4,marginBottom:24 }}>
              {[{u:"C",l:"Celsius (°C)"},{u:"F",l:"Fahrenheit (°F)"}].map(({u,l}) => (
                <button key={u} onClick={() => setPrefs({ unit:u })} style={{
                  flex:1,padding:"8px 0",borderRadius:10,fontSize:12,
                  fontWeight:prefs.unit===u?700:400,
                  backgroundColor:prefs.unit===u?t.primary:"transparent",
                  color:prefs.unit===u?t.onPrimaryContainer:t.onSurfaceVariant,
                  border:"none",cursor:"pointer",transition:"all 0.15s",
                }}>{l}</button>
              ))}
            </div>

            <p style={{ fontSize:13,color:t.onSurfaceVariant,marginBottom:10 }}>Langue de l'interface</p>
            <div style={{ position:"relative" }}>
              <select value={prefs.lang??"fr"} onChange={e=>setPrefs({lang:e.target.value})}
                style={{ width:"100%",backgroundColor:t.surfaceContainerHighest,border:"none",borderRadius:12,padding:"10px 14px",color:t.onSurface,fontSize:13,appearance:"none",cursor:"pointer" }}>
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
              <Icon name="expand_more" size={18} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:t.onSurfaceVariant,pointerEvents:"none" }}/>
            </div>
          </section>

          {/* Sources de données */}
          <section style={{ ...shared.glass, padding:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <div style={{ padding:8,backgroundColor:`${t.primary}18`,borderRadius:10 }}>
                <Icon name="cloud_download" size={20} style={{ color:t.primary }}/>
              </div>
              <h2 style={{ fontSize:18,fontWeight:700,fontFamily:"'Manrope',sans-serif",color:"#fff",margin:0 }}>Sources</h2>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {[
                { icon:"wb_sunny",   label:"Météo",           url:"https://open-meteo.com",                  name:"Open-Meteo" },
                { icon:"air",        label:"Qualité de l'air",url:"https://air-quality-api.open-meteo.com",  name:"Open-Meteo AQ" },
                { icon:"history",    label:"Historique",      url:"https://archive-api.open-meteo.com",      name:"Open-Meteo Archive" },
                { icon:"location_on",label:"Géocodage",       url:"https://nominatim.openstreetmap.org",     name:"Nominatim / OSM" },
              ].map((s,i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",backgroundColor:"rgba(255,255,255,0.04)",borderRadius:12,textDecoration:"none",color:t.onSurface }}>
                  <Icon name={s.icon} size={16} style={{ color:t.primary }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12,color:t.onSurfaceVariant }}>{s.label}</div>
                    <div style={{ fontSize:13,fontWeight:600 }}>{s.name}</div>
                  </div>
                  <Icon name="open_in_new" size={14} style={{ color:t.onSurfaceVariant }}/>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
