// ============================================================
//  Finly : connexion à la base de données Supabase
// ============================================================
// Remplace le stockage de l'ancien artifact. L'appli appelle
// FinlyCloud.use('user') et FinlyCloud.use('db') ; ce fichier
// répond avec le compte Supabase et une petite base « documents »
// (table public.docs, protégée par les règles d'accès RLS).
//
// La clé « publishable » est faite pour être publique : les données
// sont protégées par les règles de la base (Row Level Security).
(function () {
  var SUPABASE_URL = "https://kfyblltpzbbkbqcgcgyu.supabase.co";
  var SUPABASE_KEY = "sb_publishable_59-vAMgtakYJx58HkFoXjQ_57HSY7FH";
  var LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";

  var clientP = null;
  function client() {
    if (!clientP) clientP = import(LIB).then(function (m) {
      return m.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "finly-auth" } });
    });
    return clientP;
  }

  // Session : on reprend la session enregistrée, sinon connexion invité (anonyme)
  var sessionP = null;
  function session() {
    if (!sessionP) sessionP = client().then(function (sb) {
      return sb.auth.getSession().then(function (r) {
        var s = r.data && r.data.session;
        if (s && s.user) return { sb: sb, user: s.user };
        return sb.auth.signInAnonymously().then(function (a) {
          if (a.error || !a.data || !a.data.user) throw a.error || new Error("auth");
          return { sb: sb, user: a.data.user };
        });
      });
    }).catch(function (e) { sessionP = null; throw e; });
    return sessionP;
  }

  function err(e) { var x = new Error((e && e.message) || "erreur"); x.code = (e && e.code) || "erreur"; return x; }

  /* ---------- base « documents » ---------- */
  function split(path) { var i = path.lastIndexOf("/"); return { coll: path.slice(0, i), id: path.slice(i + 1) }; }
  function snap(path, row) {
    var p = split(path);
    return { id: p.id, exists: !!row, data: function () { return row ? JSON.parse(JSON.stringify(row.data)) : undefined; } };
  }
  function qsnap(rows) {
    var docs = rows.map(function (r) { return snap(r.path, r); });
    return { docs: docs, size: docs.length, empty: !docs.length, forEach: function (f) { docs.forEach(f); } };
  }

  function makeDb(sb) {
    function doc(path) {
      return {
        id: split(path).id,
        get: function () {
          return sb.from("docs").select("path,data").eq("path", path).maybeSingle().then(function (r) {
            if (r.error) throw err(r.error); return snap(path, r.data);
          });
        },
        set: function (data) {
          var p = split(path);
          return sb.from("docs").upsert({ path: path, coll: p.coll, id: p.id, data: data, updated_at: new Date().toISOString() }, { onConflict: "path" }).then(function (r) {
            if (r.error) throw err(r.error);
          });
        },
        delete: function () {
          return sb.from("docs").delete().eq("path", path).then(function (r) { if (r.error) throw err(r.error); });
        }
      };
    }
    function collection(coll) {
      var filters = [], lim = 1000;
      var q = {
        where: function (field, op, value) { filters.push([field, op, value]); return q; },
        limit: function (n) { lim = n; return q; },
        doc: function (id) { return doc(coll + "/" + id); },
        get: function () {
          var req = sb.from("docs").select("path,data").eq("coll", coll);
          filters.forEach(function (f) {
            var o = {};
            if (f[1] === "==") { o[f[0]] = f[2]; req = req.contains("data", o); }
            else if (f[1] === "array-contains") { o[f[0]] = [f[2]]; req = req.contains("data", o); }
          });
          return req.order("updated_at", { ascending: false }).limit(lim).then(function (r) {
            if (r.error) throw err(r.error); return qsnap(r.data || []);
          });
        },
        // Suivi en direct : mise à jour dès qu'un document de la collection change,
        // plus une vérification toutes les 15 s (au cas où le direct est coupé).
        onSnapshot: function (cb, onErr) {
          var stopped = false, timer = null, chan = null, busy = false, again = false;
          function load() {
            if (stopped) return; if (busy) { again = true; return; } busy = true;
            q.get().then(function (s) { if (!stopped) cb(s); }).catch(function (e) { if (!stopped && onErr) onErr(e); })
              .then(function () { busy = false; if (again) { again = false; load(); } });
          }
          load();
          timer = setInterval(function () { if (document.visibilityState === "visible") load(); }, 15000);
          try {
            chan = sb.channel("docs-" + coll.replace(/[^a-z0-9]/gi, "_") + "-" + Math.random().toString(36).slice(2, 8))
              .on("postgres_changes", { event: "*", schema: "public", table: "docs", filter: "coll=eq." + coll }, function () { load(); })
              .subscribe();
          } catch (e) { /* le contrôle toutes les 15 s suffit */ }
          return function () { stopped = true; clearInterval(timer); if (chan) sb.removeChannel(chan); };
        }
      };
      return q;
    }
    return { doc: doc, collection: collection };
  }

  /* ---------- compte ---------- */
  function makeUser(sb, user) {
    return {
      me: function () {
        return sb.auth.getUser().then(function (r) {
          var u = (r.data && r.data.user) || user, md = u.user_metadata || {};
          return { id: u.id, name: md.name || "", avatarUrl: "", email: u.email || "", anonymous: !!u.is_anonymous };
        });
      },
      isOwner: function () {
        return sb.rpc("is_admin").then(function (r) { return !r.error && r.data === true; });
      }
    };
  }

  /* ---------- actions de compte (écran Profil) ---------- */
  var account = {
    // Garde la même progression : le compte invité reçoit un e-mail et un mot de passe
    create: function (email, password) {
      return session().then(function (s) {
        return s.sb.functions.invoke("link-account", { body: { email: email, password: password } }).then(function (r) {
          if (r.error) {
            var ctx = r.error.context;
            if (ctx && typeof ctx.json === "function") return ctx.json().then(function (j) { throw new Error((j && j.error) || "Création impossible, réessaie."); }, function () { throw new Error("Création impossible, réessaie."); });
            throw new Error("Création impossible, réessaie.");
          }
          if (r.data && r.data.error) throw new Error(r.data.error);
          return s.sb.auth.refreshSession();
        });
      });
    },
    // Connexion sur un autre téléphone : la progression du compte remplace celle de l'appareil
    login: function (email, password) {
      return client().then(function (sb) {
        return sb.auth.signInWithPassword({ email: email, password: password }).then(function (r) {
          if (r.error) throw new Error(/invalid/i.test(r.error.message) ? "E-mail ou mot de passe incorrect." : "Connexion impossible, réessaie.");
          try { localStorage.setItem("finly-adopt", "1"); } catch (e) {}
        });
      });
    },
    logout: function () {
      return client().then(function (sb) { return sb.auth.signOut(); }).then(function () {
        try { localStorage.setItem("finly-adopt", "1"); } catch (e) {}
      });
    },
    password: function (pw) {
      return client().then(function (sb) {
        return sb.auth.updateUser({ password: pw }).then(function (r) { if (r.error) throw new Error("Modification impossible, réessaie."); });
      });
    }
  };

  window.FinlyCloud = {
    account: account,
    use: function (name) {
      if (name === "user") return session().then(function (s) { return makeUser(s.sb, s.user); });
      if (name === "db") return session().then(function (s) { return makeDb(s.sb); });
      // IA intégrée et enregistrement de fichiers : fonctions propres à claude.ai,
      // l'appli bascule automatiquement sur ses solutions de secours.
      return Promise.reject(Object.assign(new Error("indisponible"), { code: "unavailable" }));
    }
  };
})();
