// Finly — partie « Gestion VTC » (vtc.html), réservée au compte créateur.
// Vérifie le compte avec la base (fonction is_admin) et garde une copie des données
// dans le dossier privé du compte : data/users/<id>/vtc (lisible seulement par toi).
// Les photos des tickets restent sur le téléphone.
(function () {
  var KEY = "gestionvtc:v1", uid = null, db = null, timer = null;
  function path() { return "data/users/" + uid + "/vtc"; }
  function push(S) {
    if (!db || !uid) return;
    clearTimeout(timer);
    timer = setTimeout(function () { db.doc(path()).set(JSON.parse(JSON.stringify(S))).catch(function () {}); }, 800);
  }
  window.VTC_SYNC = push;
  window.VTC_BLOCK = function () {
    document.getElementById("root").innerHTML =
      '<div style="min-height:85dvh;display:grid;place-items:center;text-align:center;padding:30px"><div>' +
      '<h2 style="font-size:26px">Espace réservé</h2><p class="sub" style="margin-top:8px">Cette partie de Finly est réservée au compte créateur.</p>' +
      '<a class="btn" href="./" style="text-decoration:none;max-width:260px;margin:22px auto 0">Retour à Finly</a></div></div>';
  };
  window.VTC_READY = new Promise(function (res) {
    if (!window.FinlyCloud) return res({});
    FinlyCloud.use("user").then(function (u) { return Promise.all([u.me(), u.isOwner()]); }).then(function (x) {
      if (!x[1]) return res({ blocked: true });
      uid = x[0].id;
      return FinlyCloud.use("db").then(function (d) { db = d; return d.doc(path()).get(); }).then(function (s) {
        var remote = s.exists ? s.data() : null, local = null;
        try { local = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
        var lt = (local && local.t) || 0, rt = (remote && remote.t) || 0;
        if (remote && rt > lt) return res({ state: remote });
        res({});
        if (local && lt > rt) push(local);
      });
    }).catch(function () { res({}); }); // hors ligne : on garde les données du téléphone
  });
})();
