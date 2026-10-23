// Mise en ligne Netlify : assemble l'appli et crée les icônes. Aucune dépendance.
// - src/index.01.html, src/index.02.html, … sont mis bout à bout pour former index.html
//   (le fichier est découpé en morceaux pour pouvoir être envoyé sur GitHub facilement).
// - src/icons.json contient les icônes PNG en texte (base64) : elles sont recréées en images.
const fs = require("fs");
const path = require("path");

const parts = fs.readdirSync("src").filter(f => /^index\.\d+\.html$/.test(f)).sort();
if (!parts.length) throw new Error("Aucun morceau src/index.NN.html trouvé");
const html = parts.map(f => fs.readFileSync(path.join("src", f), "utf8")).join("");
if (!html.includes("</html>")) throw new Error("index.html incomplet (morceau manquant ?)");
fs.writeFileSync("index.html", html);
console.log("index.html assemblé :", parts.length, "morceaux,", html.length, "caractères");

const icons = JSON.parse(fs.readFileSync("src/icons.json", "utf8"));
for (const [name, b64] of Object.entries(icons)) {
  fs.writeFileSync(name, Buffer.from(b64, "base64"));
  console.log("icône créée :", name);
}
