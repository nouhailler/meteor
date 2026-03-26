import { t, shared } from "./tokens.js";
import SearchBar from "./SearchBar.jsx";

export function Icon({ name, size=24, style={}, filled=false }) {
  return (
    <span className="material-symbols-outlined" style={{
      fontSize:size,
      fontVariationSettings:`'FILL' ${filled?1:0},'wght' 400,'GRAD' 0,'opsz' ${size}`,
      lineHeight:1, userSelect:"none", ...style,
    }}>{name}</span>
  );
}

const NAV_ITEMS = [
  { id:"dashboard", icon:"dashboard", label:"Tableau de bord" },
  { id:"cartes",    icon:"map",       label:"Cartes"           },
  { id:"air",       icon:"air",       label:"Qualité de l'air" },
  { id:"historique",icon:"history",   label:"Historique"       },
  { id:"parametres",icon:"settings",  label:"Paramètres"       },
];

export default function Layout({ page, onNavigate, children }) {
  return (
    <div style={{ display:"flex", minHeight:"100vh", backgroundColor:t.background, color:t.onBackground, fontFamily:"'Inter','Manrope',sans-serif", position:"relative" }}>
      <div style={{ position:"fixed", top:"-30%", left:"15%", width:"60vw", height:"60vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(91,177,255,0.05) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }} />

      <aside style={shared.sidebar}>
        <div style={{ marginBottom:32, paddingLeft:16 }}>
          <h1 style={shared.logoTitle}>Atmosphere</h1>
          <p style={shared.logoSub}>Local Weather</p>
        </div>
        <nav style={shared.nav}>
          {NAV_ITEMS.map(item => (
            <a key={item.id} href="#" onClick={e=>{e.preventDefault();onNavigate(item.id);}}
               className={item.id!==page?"wni":""}
               style={item.id===page ? shared.navActive : shared.navItem}>
              <Icon name={item.icon} size={22} filled={item.id===page} style={{color:item.id===page?t.primary:"inherit"}}/>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div style={shared.proBanner}>
          <p style={{fontSize:12,color:t.onSurfaceVariant,marginBottom:10}}>Obtenez une précision avancée</p>
          <button style={shared.proBtn}>Passer à la version Pro</button>
        </div>
      </aside>

      <main style={shared.main}>
        <header style={shared.header}>
          <SearchBar />
          <div style={shared.headerActions}>
            <button style={shared.iconBtn}><Icon name="notifications" size={22}/></button>
            <div style={shared.avatar}>PF</div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
