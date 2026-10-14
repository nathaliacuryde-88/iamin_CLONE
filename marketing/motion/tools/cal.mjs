// Calendar film captures (13 Oct build) at the film7 scale: 390 css wide -> 1080 px.
import fs from "fs"; import { createRequire } from "module"; import { makeDB, install, pid, ME } from "../fakebackend.mjs";
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const VW = +(process.env.VW || 390), DSF = +(process.env.DSF || 1080 / 390), VH = +(process.env.VH || Math.round(1920 / (1080 / 390)));
const EVID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const OUT = process.env.OUTDIR || "calfilm/cap"; fs.mkdirSync(OUT, { recursive: true });
const only = process.argv[2];
const run = (k) => !only || only.split(",").includes(k);
const B = fs.existsSync(`${OUT}/boxes.json`) ? JSON.parse(fs.readFileSync(`${OUT}/boxes.json`)) : {};
const b = await chromium.launch();
const TIMO = pid(101);
const day = (n) => `2026-10-${String(n).padStart(2, "0")}`;
const extra = (db) => {
  const me = db.profiles.find((p) => p.user_id === ME); if (me) { me.display_name = "Nina Alves"; me.username = "nina"; }
  const add = (n, name, dd, time, loc, vibe, owner, em, col) => {
    const e = JSON.parse(JSON.stringify(db.events[0])); Object.assign(e, { id: EVID(n), name, date: day(dd), time, location: loc, vibe_category: vibe, created_by: owner, visibility: "circle",
      image_url: null, description: `[[cover:${em}|${col}]]` }); db.events.push(e); return e; };
  add(60, "Picnic at Killesberg", 11, "13:00", "Höhenpark Killesberg", "picnic", pid(104), "🧺", "38 95% 55%");
  add(61, "Quiz night", 21, "20:00", "Kneipe Eck", "party", pid(102), "🧠", "220 90% 60%");
  add(62, "Bouldering", 16, "18:30", "Rockerei", "sports", pid(103), "🧗", "175 70% 45%");
  add(63, "Karaoke", 24, "21:00", "Sing Sing", "party", pid(107), "🎤", "330 80% 60%");
  add(64, "Gallery opening", 29, "19:00", "Kunstverein", "art", pid(106), "🖼️", "262 70% 74%");
  const st = { 1: "interested", 2: "going", 3: "going", 4: "going", 6: "going", 7: "interested", 8: "interested", 9: "interested", 10: "going", 19: "going", 60: "going", 61: "interested", 62: "going", 63: "interested", 64: "going" };
  db.attendees = db.attendees.filter((a) => a.user_id !== TIMO);
  let k = 0; for (const [e, s] of Object.entries(st)) db.attendees.push({ id: `t-${k++}`, event_id: EVID(+e), user_id: TIMO, status: s, comped: false, created_at: "2026-09-20T00:00:00Z" });
  db.friend_birthdays = [{ user_id: pid(107), display_name: "Ana Lima", avatar_url: null, birthday: "1996-10-09" }, { user_id: pid(103), display_name: "Jonas Weber", avatar_url: null, birthday: "1994-10-27" }];
  db.availability_blocks = [{ id: "mb1", user_id: pid(104), date: day(19), reason: "Work trip", created_at: "2026-09-20T00:00:00Z" },
    { id: "mb2", user_id: pid(104), date: day(20), reason: "Work trip", created_at: "2026-09-20T00:00:00Z" }, { id: "mb3", user_id: pid(104), date: day(21), reason: "Work trip", created_at: "2026-09-20T00:00:00Z" },
    { id: "mb4", user_id: pid(104), date: day(22), reason: "work", created_at: "2026-09-20T00:00:00Z" }];
  // Marie's own plans (for her calendar)
  for (const [e, s] of [[2, "going"], [19, "going"], [60, "going"], [4, "going"], [64, "interested"]]) db.attendees.push({ id: `m-${e}`, event_id: EVID(e), user_id: pid(104), status: s, comped: false, created_at: "2026-09-20T00:00:00Z" });
};
async function fresh(at = "2026-10-01T10:00:00Z", more = () => {}) {
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DSF, colorScheme: "dark", timezoneId: "Europe/Berlin" });
  globalThis.FAKE_NOW = at; const db = makeDB({}); extra(db); more(db); await install(ctx, db, undefined, TIMO);
  await ctx.addInitScript(() => { sessionStorage.setItem("exit-poll-prompted", "1"); for (const k of ["iamin.coach.feed.v1", "iamin.coach.v1", "iamin.gesture.v1", "iamin.coach.calendar.v1"]) localStorage.setItem(k, "1"); localStorage.setItem("calendar:showMaybes", "false"); });
  for (const h of ["https://geocoding-api.open-meteo.com/**", "https://api.open-meteo.com/**", "https://nominatim.openstreetmap.org/**"]) await ctx.route(h, (r) => r.fulfill({ json: {} }));
  if (process.env.HIDESYNC) await ctx.addInitScript(() => { const st = document.createElement("style"); st.textContent = 'button[aria-label="Sync to my calendar"]{display:none !important}'; document.addEventListener("DOMContentLoaded", () => document.head.appendChild(st)); });
  const p = await ctx.newPage(); await p.clock.setFixedTime(new Date(at)); p.on("pageerror", (e) => console.log("ERR", e.message.slice(0, 140)));
  return { ctx, p, db };
}
const go = async (p, u) => { await p.goto("http://127.0.0.1:8080" + u, { waitUntil: "networkidle" }); await p.waitForTimeout(2200); };
const box = (loc) => loc.evaluate((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10); });
const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png` });
const dayCell = (p, n) => p.locator(`[data-date="${day(n)}"]`).filter({ visible: true }).locator("visible=true").first();
const visCell = async (p, n) => { const all = p.locator(`[data-date="${day(n)}"]`); const k = await all.count();
  for (let i = 0; i < k; i++) { const bx = await box(all.nth(i)); if (bx[0] >= 0 && bx[0] < VW - 10 && bx[2] > 0) return all.nth(i); } return all.first(); };

if (run("views")) {
  const { ctx, p } = await fresh(); await go(p, "/calendar");
  await shot(p, "month");
  await p.addStyleTag({ content: "[data-date] .rounded-full.bg-primary{visibility:hidden}" }); await p.waitForTimeout(200); await shot(p, "month_nodots");
  await p.evaluate(() => document.querySelectorAll("style").forEach((s) => { if (s.textContent.includes("visibility:hidden") && s.textContent.includes("data-date")) s.remove(); })); await p.waitForTimeout(200);
  fs.writeFileSync(`${OUT}/month_text.txt`, await p.locator("body").innerText());
  B.cells = {}; for (let n = 1; n <= 31; n++) { const c = await visCell(p, n); if (await c.count()) B.cells[n] = await box(c); }
  for (const [k, l] of [["tabMonth", "M"], ["tabWeek", "W"], ["tabDay", "D"]]) B[k] = await box(p.getByText(l, { exact: true }).first());
  B.maybes = await box(p.getByRole("switch").first()).catch(() => null);
  B.sync = await box(p.getByRole("button", { name: /calendar sync|sync/i }).first()).catch(() => null);
  console.log(JSON.stringify({ tabs: [B.tabMonth, B.tabWeek, B.tabDay], maybes: B.maybes, sync: B.sync }));
  await p.getByText("W", { exact: true }).first().click(); await p.waitForTimeout(900);
  const next = p.locator("h2", { hasText: /Sep|Oct/ }).first().locator("xpath=following-sibling::button[1]");
  await next.click(); await p.waitForTimeout(900); await shot(p, "week"); fs.writeFileSync(`${OUT}/week_text.txt`, await p.locator("body").innerText());
  await p.getByText("D", { exact: true }).first().click(); await p.waitForTimeout(900);
  for (let i = 0; i < 3; i++) { await next.click(); await p.waitForTimeout(150); }
  await p.waitForTimeout(800);
  await p.evaluate(() => { const h = [...document.querySelectorAll("h3,h2,p,div,span")].find((e) => e.children.length === 0 && /^Sunday, October 11$/.test(e.textContent.trim()));
    if (!h) return; const row = h.parentElement; const w = document.createElement("span");
    w.style.cssText = "display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:15px;color:hsl(var(--muted-foreground))";
    w.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>15°C';
    h.style.display = "flex"; h.style.justifyContent = "space-between"; h.style.alignItems = "center"; h.style.width = "100%"; h.appendChild(w); });
  await p.waitForTimeout(300); await shot(p, "day"); fs.writeFileSync(`${OUT}/day_text.txt`, await p.locator("body").innerText());
  await p.getByText("M", { exact: true }).first().click(); await p.waitForTimeout(900);
  // maybes: off at the top, tap, then scroll down to the list
  const sw = p.getByRole("switch").first();
  console.log("maybes initially", await sw.getAttribute("aria-checked"));
  const scroller = () => p.evaluate((y) => { const e = document.querySelector('[data-date]'); let s = e; while (s && !(s.scrollHeight > s.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(s).overflowY))) s = s.parentElement; (s || document.scrollingElement).scrollTop = y; }, 0);
  await scroller(); await p.waitForTimeout(500);
  await shot(p, "mb_off"); B.maybesSw = await box(sw);
  const dotted = () => p.evaluate(() => [...document.querySelectorAll("[data-date]")].filter((c) => c.querySelector(".rounded-full.bg-primary")).map((c) => c.dataset.date));
  const before = new Set(await dotted());
  await sw.click(); await p.waitForTimeout(900);
  const fresh2 = (await dotted()).filter((d) => !before.has(d)); console.log("maybe-only days", fresh2);
  await p.evaluate((ds) => { for (const d of ds) document.querySelectorAll(`[data-date="${d}"] .rounded-full.bg-primary`).forEach((e) => { e.style.background = "transparent"; e.style.boxShadow = "inset 0 0 0 1.5px hsl(var(--primary))"; }); }, fresh2);
  await p.waitForTimeout(200);
  for (let y = 0; y <= 400; y += 10) {
    await p.evaluate((y) => { const e = document.querySelector('[data-date]'); let s = e; while (s && !(s.scrollHeight > s.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(s).overflowY))) s = s.parentElement; (s || document.scrollingElement).scrollTop = y; }, y);
    await p.waitForTimeout(120); await shot(p, `mb_on_${String(y).padStart(3, "0")}`);
  }
  await ctx.close(); }

if (run("bday")) {
  const { ctx, p } = await fresh("2026-10-09T09:00:00Z"); await go(p, "/calendar");
  await (await visCell(p, 9)).click(); await p.waitForTimeout(1000); await shot(p, "bday_day");
  const cta = p.getByText(/send.*card/i).first(); B.sendCard = await box(cta).catch(() => null); console.log("sendCard", B.sendCard);
  await cta.evaluate((e) => e.scrollIntoView({ block: "center" })); await p.waitForTimeout(500); B.sendCard = await box(cta); await shot(p, "bday_day2");
  await cta.click(); await p.waitForTimeout(1600); await shot(p, "bday_card");
  const ta = p.locator("textarea").first(); if (await ta.count()) { await ta.fill("Happy birthday Ana! 🎉 Drinks on me"); await p.waitForTimeout(500); await shot(p, "bday_card_msg"); }
  fs.writeFileSync(`${OUT}/bday_text.txt`, await p.locator("body").innerText());
  await ctx.close(); }

if (run("block")) {
  const { ctx, p } = await fresh(); await go(p, "/calendar");
  await p.waitForTimeout(1000);
  await p.waitForTimeout(1500);
  const a = await box(await visCell(p, 13)); B.blockA = a; console.log("cell13", a);
  await p.mouse.move(a[0] + a[2] / 2, a[1] + a[3] / 2); await p.mouse.down(); await p.waitForTimeout(900); await shot(p, "block_press");
  const z = await box(await visCell(p, 15)); B.blockZ = z; B.blockA2 = await box(await visCell(p, 13));
  await p.mouse.move(z[0] + z[2] / 2, z[1] + z[3] / 2, { steps: 8 }); await p.waitForTimeout(400); await p.mouse.up(); await p.waitForTimeout(500); await shot(p, "block_range");
  const done = p.getByRole("button", { name: /done/i }).first(); B.blockDone = await box(done).catch(() => null);
  await done.click(); await p.waitForTimeout(1200); await shot(p, "block_sheet");
  fs.writeFileSync(`${OUT}/block_text.txt`, await p.locator("body").innerText());
  const reason = p.locator('input, textarea').last(); if (await reason.count()) { await reason.fill("Lisbon trip ✈️"); await p.waitForTimeout(400); await shot(p, "block_sheet_reason"); }
  const save = p.getByRole("button", { name: /block|save|confirm/i }).last(); B.blockSave = await box(save).catch(() => null);
  await save.click(); await p.waitForTimeout(1500); await shot(p, "block_done");
  await ctx.close(); }

if (run("mood")) {
  const { ctx, p } = await fresh("2026-10-03T17:30:00Z"); await go(p, "/");
  await p.getByText(/Your mood/i).first().click(); await p.waitForTimeout(1500);
  await p.evaluate(() => { const d = document.querySelector('[role=dialog]'); const h = d.querySelector('h2'); if (h) { h.style.display = 'none'; const n = h.nextElementSibling; if (n && n.tagName === 'P') n.style.display = 'none'; } });
  await p.waitForTimeout(600); await shot(p, "mood_sheet");
  const dance = p.getByRole("button", { name: /Dancing/i }).first(); B.dance = await box(dance).catch(() => null);
  await dance.click(); await p.waitForTimeout(700); await shot(p, "mood_dance");
  const addb = p.getByRole("button", { name: /Add to the feed/i }).first(); B.moodAdd = await box(addb).catch(() => null);
  await addb.click(); await p.waitForTimeout(1500); await shot(p, "mood_after");
  await ctx.close(); }

if (run("friend")) {
  const { ctx, p } = await fresh(); await go(p, "/profile/" + pid(104));
  await shot(p, "marie_profile");
  const tab = p.getByRole("button", { name: /calendar/i }).first(); B.marieTab = await box(tab).catch(() => null);
  await shot(p, "marie_cal");
  const cal = p.getByText(/October 2026/i).first(); if (await cal.count()) { await cal.evaluate((e) => e.scrollIntoView({ block: "start" })); await p.waitForTimeout(300); await cal.evaluate((e) => { let s = e.parentElement; while (s && !(s.scrollHeight > s.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(s).overflowY))) s = s.parentElement; (s || document.scrollingElement).scrollTop -= 150; }); await p.waitForTimeout(700); await shot(p, "marie_cal2"); }
  fs.writeFileSync(`${OUT}/marie_text.txt`, await p.locator("body").innerText());
  await ctx.close(); }

if (run("sync")) {
  const { ctx, p } = await fresh(); await go(p, "/calendar");
  await p.getByRole("button", { name: /sync/i }).first().click(); await p.waitForTimeout(1800); await shot(p, "sync_sheet");
  const apple = p.getByRole("link", { name: /apple/i }).first(); B.syncApple = await box(apple).catch(() => null);
  fs.writeFileSync(`${OUT}/sync_text.txt`, await p.locator("body").innerText());
  await ctx.close(); }

fs.writeFileSync(`${OUT}/boxes.json`, JSON.stringify(B, null, 1)); await b.close();
