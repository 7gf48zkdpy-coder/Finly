// Mise en ligne Netlify (lancé après le reste de la construction, voir netlify.toml) :
// branche acces.js (écran de lancement animé, compte obligatoire, verrou code / Face ID)
// dans les pages, sans toucher aux fichiers sources. Aucune dépendance.
const fs = require("fs");
function patch(file, find, insert, after) {
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(insert)) return console.log("acces : déjà en place dans", file);
  if (!s.includes(find)) throw new Error("acces : repère introuvable dans " + file + " : " + find);
  s = s.replace(find, after ? find + insert : insert + find);
  fs.writeFileSync(file, s);
  console.log("acces : branché dans", file);
}

const PAGE = "<script>window.ACCES={app:\"finly\",name:\"Finly\",tag:\"Budget, factures, épargne et investissement\",tu:true,cloud:\"FinlyCloud\",google:true,codeLogin:true,\nbg:\"#000000\",bg2:\"#1c0d33\",accent:\"#7c3aed\",accent2:\"#c084fc\",logo:'<img src=\"apple-touch-icon.png\" alt=\"\">'};</script>\n<script src=\"acces.js\"></script>\n<script src=\"vtc-entry.js\" defer></script>\n<style>html.ac-on,html.ac-on body{background:#000!important}#ac{bottom:calc(-1 * env(safe-area-inset-bottom,0px))!important;min-height:100lvh}.top{position:relative!important;top:auto!important;background:transparent!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:none!important}html::after{content:\"\";position:fixed;top:0;left:0;right:0;height:env(safe-area-inset-top,0px);background:var(--bg);z-index:30;pointer-events:none}</style>\n";
patch("index.html", '<script src="pwa.js" defer></script>', PAGE, false);
patch("cloud.js", "  window.FinlyCloud = {\n    account: account,", "\n    client: client, // utilisé par acces.js (écran de connexion et verrou)", true);
