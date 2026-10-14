// A tiny in-memory PostgREST emulator so the REAL app renders with demo data.
// Only the data is staged; every pixel of UI comes from the app's own code.

export const ME = "11111111-1111-4111-8111-111111111111";
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const d = (offset) => {
  const t = new Date("2026-10-01T12:00:00Z"); t.setUTCDate(t.getUTCDate() + offset);
  return t.toISOString().slice(0, 10);
};
// people ids differ in their first chars too (the radar places avatars by hashing the id)
export const pid = (n) => (((n * 2654435761) >>> 0).toString(16).padStart(8, "0")) + "-0000-4000-8000-" + String(n).padStart(12, "0");
const cover = (emoji, color) => `[[cover:${emoji}|${color}]]`;

const people = [
  [ME, "Nathalia Cury", "nathalia", "Stuttgart"],
  [pid(101), "Timo Berger", "timo", "Stuttgart"],
  [pid(102), "Alex Willrich", "alexwill", "Stuttgart"],
  [pid(103), "Jonas Weber", "jonas.w", "Stuttgart"],
  [pid(104), "Marie Klein", "marie", "Stuttgart"],
  [pid(105), "Carla Oliveira", "carlinha", "São Paulo"],
  [pid(106), "Felix Hahn", "felix", "Stuttgart"],
  [pid(107), "Ana Lima", "analima", "Stuttgart"],
];

export function makeDB(opts = {}) {
  const db = {
    profiles: people.map(([uid, dn, un, city], i) => ({
      id: id(200 + i), user_id: uid, display_name: dn, username: un, city, avatar_url: null,
      bio: null, account_type: "personal", organizer_verified: false, created_at: "2026-06-01T00:00:00Z",
    })),
    user_preferences: people.map(([uid]) => ({ user_id: uid, onboarded: true, coach_seen: true, active_mode: "personal", language: "en", show_dna_badge: true })),
    user_roles: [],
    // (follows below) + everyone in the demo friend group is mutual with Timo, so his feed is full
    follows: people.slice(1).flatMap(([uid], i) => [
      { id: id(300 + i * 2), follower_id: ME, following_id: uid, created_at: "2026-06-02T00:00:00Z" },
      { id: id(301 + i * 2), follower_id: uid, following_id: ME, created_at: "2026-06-02T00:00:00Z" },
    ]),
    events: [
      ev(1, "Rooftop sundowner", d(2), "19:00", "Stuttgart", "Skybar Mitte", "party", "circle", ME, cover("🌇", "262 70% 74%")),
      ev(2, "Marie turns 30", d(4), "20:00", "Stuttgart", "Marie's place", "birthday", "private", pid(104), cover("🎂🥳", "330 80% 60%")),
      ev(3, "Flohmarkt Karlsplatz", d(3), "09:00", "Stuttgart", "Karlsplatz", "street_markets", "public", pid(106), cover("🛍️", "38 95% 55%")),
      ev(4, "Techno all night", d(9), "23:00", "Stuttgart", "Climax Institutes", "music", "public", pid(103), cover("🎧", "262 83% 58%")),
      ev(5, "Sunday brunch club", d(5), "11:00", "Stuttgart", "Café Kaiserbau", "brunch", "tentative", ME, cover("🥂", "175 70% 45%")),
      ev(18, "Yoga in the park", d(1), "09:30", "Stuttgart", "Rosensteinpark", "sports", "circle", pid(102), cover("🧘", "175 70% 45%")),
      ev(19, "Lunch at Markthalle", d(2), "12:30", "Stuttgart", "Markthalle", "food", "circle", pid(104), cover("🥨", "38 95% 55%")),
      ev(7, "Jazz im Park", d(6), "18:00", "Stuttgart", "Schlossgarten", "music", "public", pid(107), cover("🎷", "220 90% 60%")),
      ev(8, "Indie night", d(8), "21:00", "Stuttgart", "Universum", "music", "public", pid(102), cover("🎸", "330 80% 60%")),
      ev(9, "Kellerparty", d(7), "22:00", "Stuttgart", "Keller Klub", "party", "public", pid(103), cover("🪩", "330 80% 60%")),
      ev(10, "Hausparty bei Felix", d(10), "21:00", "Stuttgart", "Felix's place", "party", "public", pid(106), cover("🎉", "38 95% 55%")),
      ev(6, "Cinema: open air", d(11), "21:00", "Stuttgart", "Kino am Schlossplatz", "cinema", "public", pid(101), cover("🎬", "220 90% 60%")),
    ],
    attendees: [],
    event_invites: [],
    notifications: [], birthday_cards: [], user_payment_handles: [], availability_blocks: [],
  };
  // ---------- reel 2: shared history with Lena, a photo capsule, live radar
  const past = [
    [11, "Summer rooftop", -9, "party", "🌅", "10 85% 60%"], [12, "Alex's birthday", -24, "birthday", "🎂", "330 80% 60%"],
    [13, "Open-air cinema", -38, "cinema", "🎬", "220 90% 60%"], [14, "Techno at Climax", -52, "music", "🎧", "262 83% 58%"],
    [15, "Sunday brunch club", -66, "brunch", "🥂", "175 70% 45%"], [16, "Flohmarkt run", -80, "street_markets", "🛍️", "38 95% 55%"],
    [17, "Jazz im Park", -95, "music", "🎷", "220 90% 60%"],
  ];
  for (const [n, name, off, vibe, em, col] of past) {
    db.events.push(ev(n, name, d(off), "19:00", "Stuttgart", "Stuttgart", vibe, "circle", n % 2 ? pid(102) : ME, cover(em, col)));
    for (const u of [ME, pid(102), pid(101), pid(104)].slice(0, n === 11 ? 4 : 2))
      db.attendees.push({ id: id(700 + n * 10 + db.attendees.length % 10), event_id: id(n), user_id: u, status: "going", comped: false, created_at: "2026-06-01T00:00:00Z" });
  }
  db.time_capsule_photos = [];
  for (let i = 0; i < 5; i++) db.time_capsule_photos.push({ id: id(900 + i), event_id: id(11), user_id: [ME, pid(102), pid(101), pid(104)][i % 4],
    image_url: `capsule/${String(i + 1).padStart(2, "0")}.jpg`, caption: null, created_at: `2026-09-24T2${i % 4}:0${i}:00Z` });
  db.time_capsule_messages = [1, 2, 3].map((k) => ({ id: id(950 + k), event_id: id(11), user_id: pid(100 + k), content: "🔮", created_at: "2026-09-24T22:00:00Z" }));
  db.live_presence = [[102, "here"], [107, "here"], [101, "on_the_way"], [103, "on_the_way"]].map(([u, st], k) => ({
    id: id(980 + k), event_id: id(1), user_id: pid(u), status: st, lat: 48.775 + k * 0.004, lng: 9.18 - k * 0.006,
    updated_at: "2026-10-03T16:10:00Z", expires_at: "2026-10-03T23:59:00Z" }));
  db.user_statuses = [];
  db.availability_blocks = [{ id: id(990), user_id: ME, date: d(8), reason: "work", created_at: "2026-09-20T00:00:00Z" }];
  for (const [u] of people.slice(2)) db.follows.push({ id: `f-${u}-a`, follower_id: pid(101), following_id: u, created_at: "2026-06-02T00:00:00Z" },
    { id: `f-${u}-b`, follower_id: u, following_id: pid(101), created_at: "2026-06-02T00:00:00Z" });
  const going = { 18: [102, 104], 19: [104, 106, 101], 1: [102, 103, 107, ME], 2: [102, 104, 106], 3: [106, 101], 4: [103, 105, 101, 102, 107], 5: [ME, 102], 6: [101, 104] };
  let n = 500;
  for (const [e, us] of Object.entries(going))
    for (const u of us) db.attendees.push({ id: id(n++), event_id: id(Number(e)), user_id: u === ME ? ME : pid(u), status: "going", comped: false, created_at: "2026-09-20T00:00:00Z" });
  if (opts.reel1) {   // reel 1: three real flyers in date order; Desterradxs is the one added from a screenshot
    const fl = (n, name, date, time, loc, vibe, owner, img) => Object.assign(ev(n, name, date, time, "Stuttgart", loc, vibe, "circle", owner, null),
      { image_url: `https://demo.supabase.co/storage/v1/object/public/covers/${img}` });
    db.events = [fl(20, "Razzia · 4th anniversary", d(2), "23:59", "Romantica", "party", pid(104), "fl_razzia.png"),
      fl(21, "Alles Offen 26", d(9), "14:00", "Kunstverein Wagenhalle", "art", pid(106), "fl_allesoffen.png"),
      fl(22, "Desterradxs Festival", d(16), "18:00", "Utopia Kiosk", "festival", ME, "fl_desterradxs.png")];
    db.attendees = [];
    // City Pulse: public Stuttgart plans from accounts Timo doesn't follow (never in Inner Circle)
    const orgs = [[120, "Kunstraum 34", "kunstraum34"], [121, "Queerfeminismus Stuttgart", "queerfeminismus_stuttgart"], [122, "Midnight Service", "midnightservice_stuttgart"],
      [130, "Lea Brandt", "lea.b"], [131, "Mo Haddad", "mo.h"], [132, "Sofia Reyes", "sofi"], [133, "Ben Krämer", "benk"], [134, "Yara Demir", "yara"]];
    for (const [n, dn, un] of orgs) db.profiles.push({ id: id(400 + n), user_id: pid(n), display_name: dn, username: un, city: "Stuttgart", avatar_url: null, bio: null,
      account_type: n < 130 ? "organizer" : "personal", organizer_verified: false, created_at: "2026-06-01T00:00:00Z" });
    const pub = (n, name, date, time, loc, vibe, owner, img) => Object.assign(ev(n, name, date, time, "Stuttgart", loc, vibe, "public", pid(owner), null),
      { image_url: `https://demo.supabase.co/storage/v1/object/public/covers/${img}` });
    db.events.push(pub(25, "Flohmarkt Kunstraum34", d(2), "10:00", "Filderstr. 34", "street_markets", 120, "fl_flohmarkt.png"),
      pub(26, "Queerfeminist Night", d(2), "20:00", "Sunny High", "party", 121, "fl_queer.png"),
      pub(27, "Midnight Service · Summer Rave", d(9), "16:00", "Trude", "music", 122, "fl_midnight.png"));
    for (const [e, us] of [[25, [130, 131]], [26, [132, 133, 134, 107]], [27, [130, 132, 134]]])
      for (const u of us) db.attendees.push({ id: `p${e}-${u}`, event_id: id(e), user_id: pid(u), status: "going", comped: false, created_at: "2026-09-20T00:00:00Z" });
    if (opts.filterDemo) {   // more plans, so every filter visibly narrows the deck
      db.events.filter((e) => e.visibility !== "public").forEach((e) => (e.city = "Stuttgart, Germany"));
      db.events.push(Object.assign(ev(23, "Vernissage Kunstbezirk", d(14), "19:00", "Stuttgart, Germany", "Kunstbezirk", "art", "circle", pid(104), cover("🖼️", "38 95% 55%"))),
        Object.assign(ev(24, "Berlin Atonal", d(22), "22:00", "Berlin, Germany", "Kraftwerk", "festival", "circle", pid(105), cover("🎛️", "220 90% 60%"))));
      for (const [e, us] of [[23, [104]], [24, [105, 102, 103]]])
        for (const u of us) db.attendees.push({ id: `a${e}-${u}`, event_id: id(e), user_id: pid(u), status: "going", comped: false, created_at: "2026-09-20T00:00:00Z" });
    }
    for (const [e, us] of [[20, [104, 102, 103]], [21, [106, 107]], [22, [102, 103, 107, ME]]])
      for (const u of us) db.attendees.push({ id: `a${e}-${u}`, event_id: id(e), user_id: u === ME ? ME : pid(u), status: "going", comped: false, created_at: "2026-09-20T00:00:00Z" });
  }
  if (opts.reel2b) {   // reel 2 v2: one public party night, before -> during -> after
    const R = Object.assign(ev(30, "Razzia · 4th anniversary", d(2), "22:00", "Stuttgart", "Romantica", "party", "public", pid(104), null),
      { image_url: "https://demo.supabase.co/storage/v1/object/public/covers/fl_razzia.png" });
    db.events = db.events.filter((e) => ![20, 21, 22].includes(+e.id.slice(-12)));
    db.events.push(R);
    for (const u of [ME, 101, 102, 103, 104, 107]) db.attendees.push({ id: `r30-${u}`, event_id: R.id, user_id: u === ME ? ME : pid(u), status: "going", comped: false, created_at: "2026-09-25T00:00:00Z" });
    // Timo has been to the past nights too (friendship receipt)
    for (const n of [12, 13, 14, 15, 16, 17]) db.attendees.push({ id: `t${n}`, event_id: id(n), user_id: pid(101), status: "going", comped: false, created_at: "2026-06-01T00:00:00Z" });
    db.event_pacts = opts.pact ? [{ id: id(1200), event_id: R.id, proposer_id: ME, partner_id: pid(101), status: opts.pact, sealed_at: opts.pact === "sealed" ? "2026-10-02T18:00:00Z" : null, created_at: "2026-10-02T17:00:00Z" }] : [];
    db.live_presence = [[102, "here", "21:02"], [104, "here", "20:40"], [101, "on_the_way", "21:06"], [103, "on_the_way", "21:04"]].map(([u, st, hm], k) => ({
      id: id(1300 + k), event_id: R.id, user_id: pid(u), status: st, lat: 48.7758 + (st === "here" ? 0.0002 * k : 0.004 + k * 0.002), lng: 9.1829 - (st === "here" ? 0.0002 : 0.006 + k * 0.002),
      updated_at: `2026-10-03T${hm}:00Z`, expires_at: "2026-10-04T04:00:00Z" }));
    db.event_line_votes = [[102, "long_wait", "20:58"], [104, "long_wait", "21:03"], [107, "short_wait", "20:51"], [103, "long_wait", "21:05"]].map(([u, st, hm], k) => ({
      id: id(1400 + k), event_id: R.id, user_id: pid(u), status: st, created_at: `2026-10-03T${hm}:00Z`, updated_at: `2026-10-03T${hm}:00Z` }));
    db.time_capsule_messages = (opts.notes || []).map(([u, txt], k) => ({ id: id(1500 + k), event_id: R.id, user_id: u === ME ? ME : pid(u), content: txt,
      created_at: `2026-10-03T2${k}:15:00Z`, updated_at: `2026-10-03T2${k}:15:00Z` }));
    db.time_capsule_photos = (opts.photos ? [1, 2, 3, 4, 5] : []).map((i) => ({ id: id(1600 + i), event_id: R.id, user_id: [ME, pid(101), pid(102), pid(104), pid(107)][i - 1],
      image_url: `capsule/${String(i).padStart(2, "0")}.jpg`, caption: null, created_at: `2026-10-04T0${i}:10:00Z` }));
    db.event_expenses = opts.tab ? [
      { id: id(1700), event_id: R.id, payer_id: pid(101), amount_cents: 12000, currency: "EUR", description: "Tickets x4", created_by: pid(101), created_at: "2026-10-03T20:00:00Z" },
      { id: id(1701), event_id: R.id, payer_id: pid(102), amount_cents: 3600, currency: "EUR", description: "Taxi home", created_by: pid(102), created_at: "2026-10-04T03:40:00Z" }] : [];
    db.expense_shares = opts.tab ? [
      ...[ME, pid(101), pid(102), pid(103)].map((u, k) => ({ id: id(1710 + k), expense_id: id(1700), user_id: u, share_cents: 3000, settled_at: null })),
      ...[ME, pid(101), pid(102)].map((u, k) => ({ id: id(1720 + k), expense_id: id(1701), user_id: u, share_cents: 1200, settled_at: null }))] : [];
    db.user_payment_handles = [[101, "timobraun"], [102, "alexwill"], [104, "marieklein"]].map(([u, h]) => ({ user_id: pid(u), paypal_handle: h, n26_handle: null, revolut_handle: null }));
    db.event_score_summary = opts.score ? [{ event_id: R.id, total_ratings: 6, fire_count: 6, mid_count: 0, flop_count: 0, fire_pct: 100 }] : [];
    db.event_ratings = [];
  }
  if (opts.picnic) {   // reel 4: you host a picnic with a "Bring what?" list
    const P = Object.assign(ev(40, "Sunday picnic", d(3), "13:00", "Stuttgart", "Rosensteinpark", "picnic", "circle", ME, cover("🧺", "38 95% 55%")), { bring_list_enabled: true });
    db.events.push(P);
    for (const u of [ME, 101, 102, 104, 107]) db.attendees.push({ id: `pc-${u}`, event_id: P.id, user_id: u === ME ? ME : pid(u), status: "going", comped: false, created_at: "2026-09-28T00:00:00Z" });
    db.event_bring_items = []; db.event_bring_item_claims = [];
  }
  return db;
}

function ev(n, name, date, time, city, location, vibe, visibility, owner, coverTag) {
  return {
    id: id(n), name, date, time, end_date: null, end_time: null, city, location, vibe_category: vibe,
    visibility, created_by: owner, description: coverTag, image_url: null, lat: 48.7758, lng: 9.1829,
    source_url: null, capacity: null, ticket_price_cents: null, ticket_currency: null, ticket_quantity: null,
    bring_list_enabled: false, capsule_dismissed_at: null, created_at: "2026-09-15T00:00:00Z", updated_at: "2026-09-15T00:00:00Z",
  };
}

// ---- PostgREST filter subset
function parseList(v) { return v.replace(/^\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, "")); }
function test(row, col, expr) {
  const neg = expr.startsWith("not.");
  if (neg) expr = expr.slice(4);
  const i = expr.indexOf("."); const op = expr.slice(0, i); const val = expr.slice(i + 1);
  const x = row[col];
  let r;
  switch (op) {
    case "eq": r = String(x) === val; break;
    case "neq": r = String(x) !== val; break;
    case "in": r = parseList(val).includes(String(x)); break;
    case "gte": r = x != null && String(x) >= val; break;
    case "gt": r = x != null && String(x) > val; break;
    case "lte": r = x != null && String(x) <= val; break;
    case "lt": r = x != null && String(x) < val; break;
    case "is": r = val === "null" ? x == null : String(x) === val; break;
    case "ilike": case "like": r = new RegExp("^" + val.replace(/[%*]/g, ".*") + "$", "i").test(String(x ?? "")); break;
    default: r = true;
  }
  return neg ? !r : r;
}
function orFilter(row, expr) {
  return parseList(expr).some((part) => { const j = part.indexOf("."); return test(row, part.slice(0, j), part.slice(j + 1)); });
}

export function handle(db, method, url, body, headers) {
  const u = new URL(url);
  const m = u.pathname.match(/^\/rest\/v1\/(rpc\/)?([\w]+)/);
  if (!m) return null;
  if (m[1]) { if (m[2] === "get_follow_counts") return { status: 200, json: { followers: 7, following: 7 } };
    if (m[2] === "get_friend_birthdays") return { status: 200, json: db.friend_birthdays || [] };
    if (m[2] === "get_event_pulse_stats") return { status: 200, json: [{ total_ratings: 6, fire_count: 6, mid_count: 0, flop_count: 0, avg_score: 9.4 }] };
    return { status: 200, json: [] }; }
  const table = m[2];
  db[table] ??= [];
  let rows = db[table];
  const filt = (r) => {
    for (const [k, v] of u.searchParams) {
      if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(k)) continue;
      if (k.includes(".")) continue;
      if (k === "or") { if (!orFilter(r, v)) return false; continue; }
      if (!test(r, k, v)) return false;
    }
    return true;
  };
  if (method === "GET" || method === "HEAD") {
    let out = rows.filter(filt);
    const ord = u.searchParams.get("order");
    if (ord) {
      const [c, dir] = ord.split(",")[0].split(".");
      out = [...out].sort((a, b) => (String(a[c]) < String(b[c]) ? -1 : 1) * (dir === "desc" ? -1 : 1));
    }
    const lim = u.searchParams.get("limit"); if (lim) out = out.slice(0, +lim);
    return { status: 200, rows: out, count: out.length };
  }
  if (method === "POST") {
    const items = Array.isArray(body) ? body : [body];
    const defaults = table === "live_presence" ? { expires_at: "2026-10-03T23:59:00Z", updated_at: "2026-10-03T16:15:00Z" } : {};
    const made = items.map((it, k) => ({ ...defaults, id: `99999999-0000-4000-8000-${String(Date.now() % 1e9 + k).padStart(12, "0")}`, created_at: globalThis.FAKE_NOW || new Date().toISOString(), ...(table === "time_capsule_messages" ? { updated_at: globalThis.FAKE_NOW } : {}), ...it }));
    rows.push(...made);
    return { status: 201, rows: made, count: made.length };
  }
  if (method === "PATCH") {
    const hit = rows.filter(filt); hit.forEach((r) => Object.assign(r, body));
    return { status: 200, rows: hit, count: hit.length };
  }
  if (method === "DELETE") {
    const keep = rows.filter((r) => !filt(r)); const gone = rows.filter(filt);
    db[table] = keep; return { status: 200, rows: gone, count: gone.length };
  }
  return null;
}

export async function install(ctx, db, log = () => {}, asUser = ME) {
  const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 10 * 365 * 86400;
  const jwt = `${b64u({ alg: "HS256", typ: "JWT" })}.${b64u({ sub: asUser, role: "authenticated", exp, aud: "authenticated" })}.sig`;
  const user = { id: asUser, aud: "authenticated", role: "authenticated", email: "nathalia@demo.app",
    email_confirmed_at: "2026-06-01T00:00:00Z", created_at: "2026-06-01T00:00:00Z", app_metadata: { provider: "email" }, user_metadata: {} };
  const session = { access_token: jwt, token_type: "bearer", expires_in: 315360000, expires_at: exp, refresh_token: "r", user };
  await ctx.addInitScript(([s]) => {
    localStorage.setItem("sb-demo-auth-token", s);
    localStorage.setItem("iamin.coach.feed.v1", "1");
    // past demo events: mark the exit poll as already answered
    localStorage.setItem("exit-poll-dismissed-v1", JSON.stringify([11,12,13,14,15,16,17].map((n) => "00000000-0000-4000-8000-" + String(n).padStart(12, "0"))));
  }, [JSON.stringify(session)]);
  // Brand font, served from ./assets/fonts (the browser has no route to Google here)
  const fs = await import("fs"); const path = await import("path");
  const FD = path.join(path.dirname(new URL(import.meta.url).pathname), "assets", "fonts");
  const PHOTOS = path.join(path.dirname(new URL(import.meta.url).pathname), "assets", "photos");
  await ctx.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ contentType: "text/css",
    body: fs.readFileSync(path.join(FD, "space-grotesk.css"), "utf8") }));
  await ctx.route("https://fonts.gstatic.com/**", (r) => r.fulfill({ contentType: "font/woff2",
    body: fs.readFileSync(path.join(FD, path.basename(new URL(r.request().url()).pathname))) }));
  await ctx.route("https://demo.supabase.co/**", async (route) => {
    const r = route.request();
    const p = new URL(r.url()).pathname;
    if (p.startsWith("/auth/v1/user")) return route.fulfill({ json: user });
    if (p.startsWith("/storage/v1/object/sign/") && r.method() === "POST") {
      const bucket = p.split("/")[5]; let b = {}; try { b = r.postDataJSON() || {}; } catch {}
      const urlPath = decodeURIComponent(p.split("/").slice(6).join("/"));
      const paths = b.paths || (b.path ? [b.path] : urlPath ? [urlPath] : []);
      const rows = paths.map((pp) => ({ path: pp, signedURL: `/object/sign/${bucket}/${pp}?token=demo`, error: null }));
      return route.fulfill({ json: b.paths ? rows : { signedURL: rows[0]?.signedURL } });
    }
    if (p.startsWith("/storage/") && r.method() === "GET") {
      const f = path.join(PHOTOS, path.basename(p));
      if (fs.existsSync(f)) return route.fulfill({ contentType: "image/jpeg", body: fs.readFileSync(f) });
      return route.fulfill({ status: 404, body: "" });
    }
    if (p.startsWith("/functions/v1/parse-event-screenshot")) {   // the AI reading the flyer
      await new Promise((res) => setTimeout(res, 1800));
      return route.fulfill({ json: { name: "Desterradxs Festival", date: "2026-10-17", time: "18:00", end_date: "2026-10-18", end_time: null,
        location: "Utopia Kiosk", city: "Stuttgart", description: "", vibe_category: "festival" } });
    }
    if (p.startsWith("/auth/") || p.startsWith("/storage/") || p.startsWith("/functions/")) return route.fulfill({ json: {} });
    let body = null; try { body = r.postDataJSON(); } catch {}
    const res = handle(db, r.method(), r.url(), body, r.headers());
    log(r.method(), r.url(), res?.rows?.length);
    if (!res) return route.fulfill({ status: 200, json: [] });
    if (res.json) return route.fulfill({ status: res.status, json: res.json });
    const single = (r.headers()["accept"] || "").includes("object");
    const payload = single ? (res.rows[0] ?? null) : res.rows;
    return route.fulfill({ status: res.status, contentType: "application/json", body: JSON.stringify(payload),
      headers: { "content-range": `0-${Math.max(0, res.count - 1)}/${res.count}`, "access-control-expose-headers": "content-range" } });
  });
}