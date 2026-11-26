// Finly — bouton « VTC » dans la barre du haut, affiché seulement pour le compte créateur.
(function () {
  function add() {
    var top = document.querySelector(".top");
    if (!top || document.getElementById("vtcbtn")) return;
    var a = document.createElement("a");
    a.id = "vtcbtn"; a.href = "vtc.html"; a.textContent = "VTC"; a.setAttribute("aria-label", "Ma gestion VTC");
    a.style.cssText = "margin-left:auto;margin-right:8px;height:36px;padding:0 15px;border-radius:999px;display:inline-flex;align-items:center;flex:none;" +
      "font:700 13px/1 -apple-system,system-ui,sans-serif;letter-spacing:.05em;text-decoration:none;color:#26100f;" +
      "background:linear-gradient(135deg,#ffb347,#ff7a59 55%,#f0588f);box-shadow:0 6px 16px -8px rgba(255,122,89,.8)";
    var av = top.querySelector(".avatar");
    if (av) top.insertBefore(a, av); else top.appendChild(a);
  }
  function check(n) {
    if (!window.FinlyCloud) { if (n < 40) setTimeout(function () { check(n + 1); }, 250); return; }
    FinlyCloud.use("user").then(function (u) { return u.isOwner(); }).then(function (ok) { if (ok) add(); }).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { check(0); }); else check(0);
})();
