// Core: helpers, sample data, router, nav, sheets, panel.
document.getElementById('defs').innerHTML = DEFS;
S.in = S.in.replace('#D8FF3D', '#7C3BED').replace('fill="#0B0B0A"', 'fill="#fff"');

const A = (n) => `assets/${n}`;
const AV = (n) => `assets/av_${n}.jpg`;
const I = (n, s = 22, sw = 2, st = '') => `<svg class="ic" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="${st}" aria-hidden="true">${LUCIDE[n] || ''}</svg>`;
// sticker svg (visible size s)
const SV = (n, s, r = 0, cls = '', st = '') => `<svg class="st ${cls}" viewBox="-10 -10 120 120" width="${s * 1.2}" height="${s * 1.2}" style="margin:${-s * .1}px;--r:${r}deg;transform:rotate(${r}deg);${st}" aria-hidden="true"><g filter="url(#cut)">${S[n]}</g></svg>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const F = { marie: 'Marie Klein', jonas: 'Jonas Weber', timo: 'Timo Schulz', nina: 'Nina Ortega' };
const EV = {
  supper: { name: "Supperclub at Marie's", short: 'Supperclub', date: 'Today', long: 'Thu 22 Oct', day: 22, time: '20:00', venue: "Marie's place", area: 'Westend', img: 'f2.jpg', vis: 'Private', vibe: 'pizza', going: ['marie', 'nina', 'jonas'], extra: 3, count: 6, react: [['heart', 4], ['flame', 2]], spend: 14 },
  razzia: { name: 'Razzia · 4th anniversary', short: 'Razzia', date: 'Sat, Oct 24', long: 'Sat 24 Oct', day: 24, time: '23:59', venue: 'Romantica', area: 'Mitte', img: 'fl_razzia.jpg', vis: 'Inner circle', vibe: 'disco', going: ['marie', 'timo', 'jonas'], extra: 4, count: 9, react: [['flame', 12], ['eyes', 5]], lineup: ['Keryda (live)', 'DJ Afropunk', 'Gabbanalli'], spend: 22 },
  alles: { name: 'Alles offen 26', short: 'Alles offen', date: 'Sat, Oct 24', long: 'Sat 24 Oct', day: 24, time: '16:00', venue: 'Kunstverein Wagenhalle', area: 'Nord', img: 'fl_alles.jpg', vis: 'Public', vibe: 'palette', going: ['timo', 'nina'], extra: 2, count: 4, react: [['heart', 3]] },
  dest: { name: 'Desterradxs festival', short: 'Desterradxs', date: 'Sun, Oct 25', long: 'Sun 25 Oct', day: 25, time: '22:00', venue: 'Utopia Kiosk', area: 'Ost', img: 'fl_desterradxs.jpg', vis: 'Public', vibe: 'tent', going: ['jonas', 'marie', 'timo'], extra: 9, count: 12, react: [['popper', 8], ['flame', 6]], price: '€18' },
  queer: { name: 'Queerfeminist Night', short: 'Queerfeminist', date: 'Fri, Oct 30', long: 'Fri 30 Oct', day: 30, time: '20:00', venue: 'Sunny High', area: 'Süd', img: 'fl_queer.jpg', vis: 'Public', vibe: 'popper', going: ['nina'], extra: 1, count: 2, react: [['heart', 6]] },
  midnight: { name: 'Midnight Service', short: 'Midnight', date: 'Sat, Oct 31', long: 'Sat 31 Oct', day: 31, time: '16:00', venue: 'Trude', area: 'West', img: 'fl_midnight.jpg', vis: 'Public', vibe: 'vinyl', going: ['timo', 'jonas'], extra: 5, count: 7, react: [['vinyl', 3]], price: '€12' },
};
const FEED = ['supper', 'razzia', 'alles', 'dest', 'queer', 'midnight'];
const state = { screen: 'feed', params: {}, rsvp: { razzia: 'in' }, reacts: {}, sticks: { razzia: [['popper', 28, 120, -10], ['hey', 252, 150, 8]] } };

/* ---------- shared chrome ---------- */
const statusBar = (light) => `<div class="status" ${light ? 'style="color:#fff"' : ''}><span>9:41</span><span style="display:flex;gap:6px;align-items:center"><svg width="18" height="12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5" width="3" height="7" rx="1" fill="currentColor"/><rect x="10" y="2" width="3" height="10" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg><svg width="27" height="13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2.5" y="2.5" width="17" height="8" rx="2" fill="currentColor"/></svg></span></div>`;
const LOGO = `<span class="logo">I am <i>(</i>IN<i>)</i></span>`;
const header = () => `<div class="hdr">${LOGO}<span class="hic"><button class="icb" data-go="me" data-p='{"tab":"friends"}' aria-label="People">${I('Users', 20)}</button><button class="icb" data-toast="Search opens here (same as today)." aria-label="Search">${I('Search', 20)}</button><button class="icb" data-sheet="notifs" aria-label="Notifications">${I('Bell', 20)}<span class="badge">3</span></button><button class="icb" data-toast="Settings open here (same as today)." aria-label="Settings">${I('Settings', 20)}</button></span></div>`;
const NAVI = [['feed', 'LayoutGrid', 'Feed'], ['calendar', 'CalendarDays', 'Calendar'], null, ['capsule', 'Archive', 'Capsule'], ['me', 'User', 'Profile']];
const nav = (on) => `<div class="fade"></div><nav class="nav" aria-label="Main">${NAVI.map((x) => x ? `<button data-go="${x[0]}" ${on == x[0] ? 'aria-current="page"' : ''}>${I(x[1], 22, on == x[0] ? 2.4 : 2)}${x[2]}</button>` : `<button class="add" data-go="add">${'<b>' + I('Plus', 24, 2.6) + '</b>'}Add</button>`).join('')}</nav>`;
const back = (label = '', to = 'feed', p = {}) => `<div class="hdr" style="padding-left:12px"><button class="icb f" data-go="${to}" data-p='${JSON.stringify(p)}' aria-label="Back">${I('ChevronLeft', 20, 2.4)}</button><span class="meta">${label}</span><span style="width:40px"></span></div>`;
const reactPills = (id, big) => (EV[id].react || []).map(([s, n]) => { const on = state.reacts[id + s]; return `<button class="react ${on ? 'on' : ''}" data-react="${id}|${s}" style="${big ? '' : 'height:30px'}">${SV(s, big ? 30 : 24)}${n + (on ? 1 : 0)}</button>`; }).join('');

/* ---------- router ---------- */
const SCREENS = {}; const SHEETS = {};
const app = document.getElementById('app');
function go(id, params = {}) {
  if (!SCREENS[id]) return;
  if (SCREENS[id].alias) return go(SCREENS[id].alias[0], SCREENS[id].alias[1]);
  state.screen = id; state.params = params;
  const s = SCREENS[id];
  app.innerHTML = `<div class="scr" id="scr">${s.render(params)}</div>`;
  s.mount && s.mount(app.querySelector('#scr'), params);
  updatePanel();
}
function openSheet(id, params = {}) {
  const sh = SHEETS[id]; if (!sh) return;
  closeSheet();
  const wrap = document.createElement('div'); wrap.id = 'sheetwrap';
  wrap.innerHTML = `<div class="scrim" data-close></div><div class="sheet" role="dialog" aria-label="${esc(sh.label)}" style="${sh.full ? 'max-height:none;top:calc(40px + env(safe-area-inset-top,0px))' : ''}"><div class="grab"></div><div class="sbody">${sh.render(params)}</div></div>`;
  app.appendChild(wrap);
  sh.mount && sh.mount(wrap, params);
  state.sheet = id; updatePanel();
}
function closeSheet() { const w = document.getElementById('sheetwrap'); if (w) w.remove(); state.sheet = null; updatePanel(); }
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; app.appendChild(t); setTimeout(() => t.remove(), 2200); }

app.addEventListener('click', (e) => {
  const c = e.target.closest('[data-close]'); if (c) { closeSheet(); if (c.dataset.toast) toast(c.dataset.toast); return; }
  const g = e.target.closest('[data-go]'); if (g) { closeSheet(); go(g.dataset.go, g.dataset.p ? JSON.parse(g.dataset.p) : {}); return; }
  const sh = e.target.closest('[data-sheet]'); if (sh) { openSheet(sh.dataset.sheet, sh.dataset.p ? JSON.parse(sh.dataset.p) : {}); return; }
  const t = e.target.closest('[data-toast]'); if (t) { toast(t.dataset.toast); return; }
  const r = e.target.closest('[data-react]'); if (r) { const [id, s] = r.dataset.react.split('|'); state.reacts[id + s] = !state.reacts[id + s]; const n = (EV[id].react.find((x) => x[0] == s) || [0, 0])[1] + (state.reacts[id + s] ? 1 : 0); r.classList.toggle('on', !!state.reacts[id + s]); r.lastChild.textContent = n; const svg = r.querySelector('svg'); svg.classList.remove('slap'); void svg.offsetWidth; svg.classList.add('slap'); return; }
  const tg = e.target.closest('.tog'); if (tg) { tg.setAttribute('aria-pressed', tg.getAttribute('aria-pressed') === 'false'); return; }
  const sg = e.target.closest('.seg button[data-seg]'); if (sg) { sg.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === sg)); }
});

/* ---------- panel ---------- */
const TAGS = { new: ['new', 'New'], upd: ['upd', 'New look'], old: ['', 'Existing'], nat: ['nat', 'Native'] };
function updatePanel() {
  const jump = document.getElementById('jump'); if (!jump) return;
  const groups = {};
  Object.entries(SCREENS).forEach(([id, s]) => { (groups[s.section] = groups[s.section] || []).push(['s', id, s]); });
  Object.entries(SHEETS).forEach(([id, s]) => { (groups[s.section] = groups[s.section] || []).push(['h', id, s]); });
  jump.innerHTML = Object.entries(groups).map(([g, items]) => `<h3>${g}</h3>` + items.map(([k, id, s]) => {
    const cur = k == 's' ? (state.screen == id && !state.sheet) : state.sheet == id; const t = TAGS[s.tag] || TAGS.old;
    return `<button data-j="${k}|${id}" aria-current="${cur}">${k == 'h' ? '<span class="mute">↳</span>' : ''}${esc(s.label)}<span class="tag ${t[0]}">${t[1]}</span></button>`;
  }).join('')).join('');
}
document.getElementById('jump').addEventListener('click', (e) => {
  const b = e.target.closest('[data-j]'); if (!b) return; const [k, id] = b.dataset.j.split('|');
  if (k == 's') { closeSheet(); go(id, SCREENS[id].demo || {}); } else { const sh = SHEETS[id]; closeSheet(); if (state.screen != sh.base) go(sh.base, (SCREENS[sh.base] || {}).demo || {}); openSheet(id, sh.demo || {}); }
});
document.getElementById('themeSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return; const v = b.dataset.v;
  if (v === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v;
  document.querySelectorAll('#themeSeg button').forEach((x) => x.setAttribute('aria-pressed', x === b));
});
