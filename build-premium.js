// Mise en ligne Netlify (lancé après build.js, voir netlify.toml) : abonnement Premium, Pack Duo
// et offres au bon moment, appliqués à index.html sans toucher aux fichiers sources.
// Chaque repère doit exister une seule fois : sinon la mise en ligne s'arrête avec un message clair.
const fs = require("fs");
function patch(file, edits) {
  let s = fs.readFileSync(file, "utf8");
  if (s.includes("function entAdd(")) return console.log("premium : déjà en place dans", file);
  edits.forEach(([a, b], i) => {
    const n = s.split(a).length - 1;
    if (n !== 1) throw new Error("premium : repère n°" + (i + 1) + " trouvé " + n + " fois dans " + file + " : " + a.slice(0, 80));
    s = s.replace(a, () => b);
  });
  fs.writeFileSync(file, s);
  console.log("premium :", edits.length, "modifications dans", file);
}
const EDITS = [
  ["'Méthode Buffett : listes d’entreprises à étudier']}};",
   "'Méthode Buffett : listes d’entreprises à étudier']},\n duo:{n:'Pack Duo',tag:'Finly Pro + Mindinvest Premium',pm:9.99,pa:79.99,f:['Tout Finly Pro, avec l’IA illimitée','Mindinvest Premium : les 7 rangs de cours et l’AMF en illimité','Un seul abonnement pour les deux apps','Moins cher que les deux séparément']},\n mi:{n:'Mindinvest Premium',pm:4.99,pa:39.99,ypm:2.49,ypa:19.99}};\n/* Pack Duo et Mindinvest : mêmes codes, droits partagés dans redeem/<compte>.ent */\nfunction planName(p){return p==='budget'?'Finly+':p==='mi'?'Mindinvest Premium':p==='duo'?'Pack Duo':'Pro'}\nfunction entAdd(ent,plan,months){ent=ent||{};var dur=(+months||1)*30.44*864e5,t=now();\n  if(plan==='mi'||plan==='duo')ent.mi=Math.max(t,+ent.mi||0)+dur;\n  if(plan==='premium'||plan==='duo'||plan==='budget'){var p=plan==='budget'?'budget':'premium',f=ent.fl||{};ent.fl={plan:p,until:Math.max(t,f.plan===p?+f.until||0:0)+dur}}\n  return ent}\nfunction entApplyFl(ent){var f=ent&&ent.fl;if(!f||!(+f.until>now()))return;var pl=f.plan==='budget'?'budget':'premium';\n  if(pl==='budget'&&isPremium()&&!(S.trialEnd&&S.trialEnd>now()))return;\n  if(S.plan===pl&&(+S.planUntil||0)+864e5>=+f.until)return;\n  S.plan=pl;S.planUntil=+f.until;S.statDay='';save();statsPublish();render();toast(planName(pl)+' activé jusqu’au '+new Date(S.planUntil).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}))}\n/* rappels au bon moment : fin d'essai, fin du mois de bienvenue, fin d'abonnement */\nfunction pwNudge(){if(S.admin||ACC.owner||$('#layer').innerHTML)return;var t=now(),day=ymd(new Date());\n  if(S.trialEnd&&S.trialEnd<=t&&!planActive()&&!S.trialSeen){S.trialSeen=1;save();paywall('Ton essai Pro est terminé. Tout ce que tu as créé est gardé : continue avec Pro, ou avec Finly+ pour le budget sans limite.','premium');return}\n  if(S.trialEnd&&S.trialEnd>t&&S.trialEnd-t<2*864e5&&S.trialWarn!==day){S.trialWarn=day;save();toast('Ton essai Pro se termine dans '+Math.max(1,Math.ceil((S.trialEnd-t)/864e5))+' jour(s)');return}\n  if(S.first&&!welcomeActive()&&!hasBudgetPlus()&&!S.welcomeSeen){S.welcomeSeen=1;save();paywall('Ton mois de bienvenue est fini : le Gratuit repasse à 2 lectures par l’IA et 5 papiers suivis. Garde tout en illimité avec Finly+.','budget');return}\n  if((S.plan==='premium'||S.plan==='budget')&&S.planUntil&&S.planUntil<=t&&S.planSeen!==S.planUntil){S.planSeen=S.planUntil;save();paywall('Ton abonnement '+planName(S.plan)+' est arrivé à échéance. Renouvelle-le pour garder tes fonctions.',S.plan)}}\nsetTimeout(pwNudge,5000);document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')setTimeout(pwNudge,1500)});\n"],
  ["PW.sel=focus==='budget'?'budget':'premium'",
   "PW.sel=focus==='budget'||focus==='duo'?focus:'premium'"],
  ["(k==='premium'?'<span class=\"badge acc\">Le plus complet</span>':'')",
   "(k==='premium'?'<span class=\"badge acc\">Le plus complet</span>':k==='duo'?'<span class=\"badge acc\">+ Mindinvest</span>':'')"],
  ["pwopts\">'+card('budget')+card('premium')+'</div>'",
   "pwopts\">'+card('budget')+card('premium')+card('duo')+'</div>'"],
  ["(sel==='premium'||PW.life?OFFERS.premium.f:OFFERS.budget.f)",
   "(PW.life?OFFERS.premium.f:(OFFERS[sel]||OFFERS.premium).f)"],
  [".pwopts{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
   ".pwopts{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.pwopts .pwopt[data-offsel=\"duo\"]{grid-column:1/-1}"],
  ["codeHash(code).then(function(h){return ACC.db.doc('codes/'+h).get().then(function(s){if(!s.exists){cb('Code inconnu : vérifie-le, lettre par lettre.');return}var c=s.data()||{};",
   "codeHash(code).then(function(h){return ACC.db.doc('codes/'+h).get().then(function(s){if(!s.exists){cb('Code inconnu : vérifie-le, lettre par lettre.');return}var c=s.data()||{};if(c.plan==='mi'){cb('Ce code est pour Mindinvest : entre-le dans l’app Mindinvest.');return}"],
  ["return ACC.db.doc('redeem/'+ACC.uid).set({hs:hs,plan:c.plan,months:+c.months||1,at:now()})",
   "return ACC.db.doc('redeem/'+ACC.uid).set(Object.assign(x,{hs:hs,plan:c.plan,months:+c.months||1,at:now(),app:'fl',ent:entAdd(x.ent,c.plan,+c.months||1)}))"],
  ["toast((pl==='budget'?'Finly+':'Pro')+' activé jusqu’",
   "toast(planName(pl)+' activé jusqu’"],
  ["ACC.db.doc('redeem/'+ACC.uid).get().then(function(s){var g=s.exists&&(s.data()||{}).gift;",
   "ACC.db.doc('redeem/'+ACC.uid).get().then(function(s){entApplyFl(s.exists&&(s.data()||{}).ent);var g=s.exists&&(s.data()||{}).gift;"],
  ["bSel('cPlan',[['budget','Finly+'],['premium','Pro']],'premium')",
   "bSel('cPlan',[['budget','Finly+'],['premium','Pro'],['mi','Mindinvest Premium'],['duo','Pack Duo']],'premium')"],
  ["var plan=($('#cPlan')||{}).value==='premium'?'premium':'budget',",
   "var plan=['budget','premium','mi','duo'].indexOf(($('#cPlan')||{}).value)>=0?$('#cPlan').value:'premium',"],
  ["\\nMerci pour ton abonnement '+(last.plan==='budget'?'Finly+':'Pro')+' à Finly !\\nTon code d’activation : '+last.c+'\\nOuvre l’app, va dans Profil > Réglages > « J’ai un code d’activation », et colle-le.",
   "\\nMerci pour ton abonnement '+planName(last.plan)+' !\\nTon code d’activation : '+last.c+(last.plan==='mi'?'\\nOuvre Mindinvest, va dans Outils > Abonnement > « J’ai un code d’activation », et colle-le.':'\\nOuvre Finly, va dans Profil > Réglages > « J’ai un code d’activation », et colle-le.'+(last.plan==='duo'?'\\nLe Pack débloque aussi Mindinvest : connecte-toi avec le même compte, c’est automatique.':''))+'"],
  ["'+(x.plan==='budget'?'Finly+':'Pro')+' · '+x.months+' ",
   "'+planName(x.plan)+' · '+x.months+' "],
  ["f('premium_a','Pro annuel ('+nf2.format(OFFERS.premium.pa)+' €)')",
   "f('premium_a','Pro annuel ('+nf2.format(OFFERS.premium.pa)+' €)')+f('duo_m','Pack Duo mensuel ('+nf2.format(OFFERS.duo.pm)+' €)')+f('duo_a','Pack Duo annuel ('+nf2.format(OFFERS.duo.pa)+' €)')+f('mi_m','Mindinvest Premium mensuel ('+nf2.format(OFFERS.mi.pm)+' €)')+f('mi_a','Mindinvest Premium annuel ('+nf2.format(OFFERS.mi.pa)+' €)')+f('miy_m','Mindinvest −26 ans mensuel ('+nf2.format(OFFERS.mi.ypm)+' €)')+f('miy_a','Mindinvest −26 ans annuel ('+nf2.format(OFFERS.mi.ypa)+' €)')"],
  ["['budget_m','budget_a','premium_m','premium_a','life','portal']",
   "['budget_m','budget_a','premium_m','premium_a','duo_m','duo_a','mi_m','mi_a','miy_m','miy_a','life','portal']"],
  ["crée Finly+ et Pro avec leurs prix mensuels et annuels (abonnements)",
   "crée Finly+, Pro, le Pack Duo et Mindinvest Premium (avec son prix −26 ans) avec leurs prix mensuels et annuels (abonnements)"],
  ["function codePrice(x){var o=x.plan==='budget'?OFFERS.budget:OFFERS.premium,",
   "function codePrice(x){var o=OFFERS[x.plan]||OFFERS.premium,"],
  ["html+='<button class=\"btn\" data-close=\"1\">Continuer</button>';",
   "var upsell=ok&&cfg.kind==='exam'&&cfg.id===FREE_RANK&&!isPremium();if(upsell)html+='<div class=\"card\" style=\"text-align:center;align-items:center;box-shadow:inset 0 0 0 2px var(--acc)\"><h3 style=\"margin:0\">La suite t’attend : rang '+(FREE_RANK+1)+'</h3><div class=\"note\">Tu as fini les cours gratuits. Les rangs 3 à 7, l’attestation et le plan d’investissement sont dans Pro.</div>'+(!S.trialEnd?'<button class=\"btn\" data-trial=\"1\">Essayer Pro 7 jours gratuitement</button>':'<button class=\"btn\" data-offer=\"premium\">Voir les offres</button>')+'</div>';html+='<button class=\"btn'+(upsell?' ghost':'')+'\" data-close=\"1\">Continuer</button>';"],
];
patch("index.html", EDITS);

