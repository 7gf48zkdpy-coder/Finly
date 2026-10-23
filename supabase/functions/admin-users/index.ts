// Finly : outils du créateur (liste des clients, blocage, abonnement offert).
// Seul un compte présent dans la table privée « admins » peut l'utiliser.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: { user }, error: uerr } = await admin.auth.getUser(token);
    if (uerr || !user) return json({ error: "Connexion expirée, rouvre l'appli." }, 401);
    const { data: isAdm } = await admin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!isAdm) return json({ error: "Réservé au créateur de l'appli." }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "list") {
      const out: unknown[] = [];
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) return json({ error: "Liste indisponible." }, 500);
        for (const u of data.users) {
          out.push({
            id: u.id, email: u.email || "", anon: !!u.is_anonymous, created: u.created_at, last: u.last_sign_in_at,
            banned: !!(u.banned_until && new Date(u.banned_until).getTime() > Date.now()),
            providers: (u.app_metadata && u.app_metadata.providers) || [],
            mfa: (u.factors || []).filter((f) => f.status === "verified").length > 0,
          });
        }
        if (data.users.length < 1000) break;
      }
      const { data: stats } = await admin.from("docs").select("id,data").eq("coll", "stats").limit(5000);
      const st: Record<string, unknown> = {};
      (stats || []).forEach((r) => { st[r.id] = r.data; });
      return json({ users: out, stats: st });
    }

    const uid = String(body.uid || "");
    if (!/^[0-9a-f-]{36}$/.test(uid)) return json({ error: "Client inconnu." }, 400);

    if (action === "ban") {
      if (uid === user.id) return json({ error: "Tu ne peux pas bloquer ton propre compte." }, 400);
      const { error } = await admin.auth.admin.updateUserById(uid, { ban_duration: body.on ? "876000h" : "none" });
      if (error) return json({ error: "Modification impossible." }, 500);
      return json({ ok: true });
    }

    if (action === "gift") {
      const plan = body.plan === "budget" ? "budget" : "premium";
      const months = Math.max(1, Math.min(1200, Number(body.months) || 1));
      const { data: cur } = await admin.from("docs").select("data").eq("path", "redeem/" + uid).maybeSingle();
      const data = Object.assign({}, (cur && cur.data) || {}, { gift: { plan, months, at: Date.now() } });
      const { error } = await admin.from("docs").upsert({ path: "redeem/" + uid, coll: "redeem", id: uid, uid, data, updated_at: new Date().toISOString() }, { onConflict: "path" });
      if (error) return json({ error: "Enregistrement impossible." }, 500);
      return json({ ok: true });
    }

    return json({ error: "Action inconnue." }, 400);
  } catch (_e) {
    return json({ error: "Erreur, réessaie." }, 500);
  }
});
