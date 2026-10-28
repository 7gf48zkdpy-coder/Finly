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

const PAGE = "<script>window.ACCES={app:\"finly\",name:\"Finly\",tag:\"Budget, factures, épargne et investissement\",tu:true,cloud:\"FinlyCloud\",google:true,codeLogin:true,\nbg:\"#000000\",bg2:\"#1c0d33\",accent:\"#7c3aed\",accent2:\"#c084fc\",logo:'<img src=\"apple-touch-icon.png\" alt=\"\">'};</script>\n<script src=\"acces.js\"></script>\n";
patch("index.html", '<script src="pwa.js" defer></script>', PAGE, false);
patch("cloud.js", "  window.FinlyCloud = {\n    account: account,", "\n    client: client, // utilisé par acces.js (écran de connexion et verrou)", true);
