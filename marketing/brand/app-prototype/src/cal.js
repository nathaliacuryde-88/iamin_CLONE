// CALENDAR: Month / Week / Day. Friends away and the stats live in modules under the calendar.
(() => {
const cal = { view: 'month', sel: 24 };
const PLANS = { 3: ['fl_razzia.jpg', 'in'], 10: ['fl_alles.jpg', 'in'], 22: ['f2.jpg', 'in'], 24: ['fl_razzia.jpg', 'in'], 25: ['fl_desterradxs.jpg', 'maybe'], 30: ['fl_queer.jpg', 'maybe'], 31: ['fl_midnight.jpg', 'in'] };
const BDAY = { 12: 'timo', 29: 'nina' }; const BLOCK = [27, 28]; const TODAY = 22;
const AWAY = [['jonas', 'Lisbon', 'Oct 20 → 21', 'back Thu'], ['marie', 'Berlin', 'Nov 2 → 5', 'next week']];
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const wd = (d) => WD[(d + 2) % 7]; // Oct 1 2026 is a Thursday
const evOn = (d) => Object.keys(EV).filter((k) => EV[k].day == d);

const head = () => `${statusBar()}${header()}
  <div class="row" style="padding:2px 16px 0 20px;flex:none"><span class="dsp" style="font-size:46px">${cal.view == 'day' ? `${wd(cal.sel)} ${cal.sel}` : 'October'}</span><span class="meta" style="margin:14px 0 0 8px">${cal.view == 'day' ? 'Oct 2026' : cal.view == 'week' ? 'Oct 19 – 25' : '2026'}</span><span class="sp"></span><button class="icb f" data-sheet="sync" aria-label="Sync to my calendar">${I('RefreshCcw', 19)}</button></div>
  <div class="row" style="padding:12px 16px 0;flex:none"><div class="seg" style="width:240px">${[['month', 'Month'], ['week', 'Week'], ['day', 'Day']].map((v) => `<button data-cv="${v[0]}" aria-pressed="${cal.view == v[0]}">${v[1]}</button>`).join('')}</div><span class="sp"></span><span class="mute" style="font-size:13px;font-weight:600;margin-right:8px">Maybes</span><button class="tog" aria-pressed="true" aria-label="Show maybes"></button></div>`;

const cell = (d) => {
  if (!d) return '<span></span>';
  const p = PLANS[d], b = BDAY[d], bl = BLOCK.includes(d), today = d == TODAY, sel = d == cal.sel;
  const ring = sel ? 'box-shadow:0 0 0 3px var(--p);' : today ? 'box-shadow:0 0 0 2px var(--ink);' : '';
  let face;
  if (p) face = `<img src="${A(p[0])}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;${p[1] == 'maybe' ? 'opacity:.5;filter:saturate(.6)' : ''}">`;
  else if (b) face = `<img src="${AV(b)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2.5px solid #FF5FA8">`;
  else face = `<span style="width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;background:${bl ? 'repeating-linear-gradient(135deg,var(--s3) 0 3px,transparent 3px 7px),var(--s2)' : 'var(--s2)'};color:${bl ? 'var(--mute)' : 'var(--ink)'}">${d}</span>`;
  return `<button class="cd" data-day="${d}" aria-label="Oct ${d}"><span class="cdc" style="${ring}">${face}${p || b ? `<span class="cdn">${d}</span>` : ''}${b ? `<span class="cdb">${I('Cake', 10, 2.6)}</span>` : ''}</span></button>`;
};

const evRow = (id) => { const e = EV[id]; const r = state.rsvp[id] || (id == 'dest' || id == 'queer' ? 'maybe' : 'in'); return `<button class="lrow" data-go="event" data-p='{"id":"${id}"}' style="text-align:left;width:100%"><i style="width:10px;height:10px;border-radius:50%;flex:none;${r == 'in' ? 'background:var(--p)' : 'box-shadow:inset 0 0 0 2px var(--pt)'}"></i><img class="thumb" src="${A(e.img)}" alt=""><div style="flex:1;min-width:0"><div class="tt">${e.name}</div><div class="sub"><span class="meta" style="color:var(--pt)">${e.time}</span>· ${e.count} going</div></div>${I('ChevronRight', 18, 2, 'color:var(--mute)')}</button>`; };
function dayRows(d) {
  let h = evOn(d).map(evRow).join('');
  if (BDAY[d]) h += `<button class="lrow" style="width:100%;text-align:left" data-sheet="bday" data-p='{"who":"${BDAY[d]}"}'><img class="av" src="${AV(BDAY[d])}" alt="" width="46" height="46" style="border:2.5px solid #FF5FA8"><div style="flex:1"><div class="tt">${F[BDAY[d]].split(' ')[0]}'s birthday</div><div class="sub">Tap to send a card</div></div>${SV('cake', 34, 8)}</button>`;
  if (BLOCK.includes(d)) h += `<button class="lrow" style="width:100%;text-align:left" data-sheet="block"><span class="thumb" style="background:repeating-linear-gradient(135deg,var(--s3) 0 3px,transparent 3px 7px),var(--s2)"></span><div style="flex:1"><div class="tt">You're unavailable</div><div class="sub">Work trip · Oct 27 → 28</div></div>${I('Pencil', 17, 2, 'color:var(--mute)')}</button>`;
  return h || `<div class="lrow" style="justify-content:center;color:var(--mute)">No plans this day · <button style="color:var(--pt);font-weight:700" data-go="add">Add one</button></div>`;
}

// modules under the calendar (all views)
const modules = () => `
  <div class="h2" style="padding-top:26px"><span class="dsp" style="font-size:26px">Friends away</span><span class="sp"></span><span class="meta">${AWAY.length}</span></div>
  <div style="display:flex;flex-direction:column;gap:8px;padding:0 16px">${AWAY.map((f) => `<div class="lrow"><img class="av" src="${AV(f[0])}" alt="" width="46" height="46"><div style="flex:1;min-width:0"><div class="tt">${F[f[0]].split(' ')[0]} · ${f[1]}</div><div class="sub">${I('Plane', 14)}${f[2]} · ${f[3]}</div></div><button class="pill pg" style="height:34px;font-size:12.5px;padding:0 12px" data-toast="Message opens (same as today).">Say hi</button></div>`).join('')}</div>
  <div class="h2" style="padding-top:22px"><span class="dsp" style="font-size:26px">Your October</span></div>
  <div class="row" style="gap:8px;padding:0 16px">${[['6', 'nights out'], ['€86', 'spent · the tab'], ['Romantica', 'top venue']].map((s, k) => `<div class="card" style="flex:${k == 2 ? 1.4 : 1};padding:14px 12px;text-align:center"><div class="${k == 2 ? '' : 'dsp'}" style="font-size:${k == 2 ? 16 : 32}px;font-weight:700;${k == 2 ? 'padding-top:9px;padding-bottom:5px' : ''}">${s[0]}</div><div class="mute" style="font-size:11.5px;margin-top:4px">${s[1]}</div></div>`).join('')}</div>`;

const month = () => { const days = [null, null, null, ...Array.from({ length: 31 }, (_, k) => k + 1)];
  return `<div class="card" style="margin:14px 16px 0;padding:14px 8px 10px">
    <div class="cg" style="margin-bottom:6px">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<span class="meta" style="text-align:center;font-size:10.5px">${d}</span>`).join('')}</div>
    <div class="cg">${days.map(cell).join('')}</div>
    <div class="meta" style="text-align:center;font-size:9.5px;text-transform:none;margin-top:8px">Long-press to mark days unavailable · Tap a blocked day to edit</div>
  </div>
  <div class="row" style="gap:12px;padding:10px 20px 0;flex-wrap:wrap">${[[`<i style="width:12px;height:12px;border-radius:50%;background:url('${A('fl_razzia.jpg')}') center/cover"></i>`, 'Going'], [`<i style="width:12px;height:12px;border-radius:50%;background:url('${A('fl_queer.jpg')}') center/cover;opacity:.5"></i>`, 'Maybe'], ['<i style="width:12px;height:12px;border-radius:50%;border:2px solid #FF5FA8"></i>', 'Birthday'], ['<i style="width:12px;height:12px;border-radius:50%;background:repeating-linear-gradient(135deg,var(--mute) 0 2px,transparent 2px 4px)"></i>', 'Unavailable']].map((x) => `<span class="meta" style="display:flex;align-items:center;gap:5px;font-size:10px">${x[0]}${x[1]}</span>`).join('')}</div>
  <div class="row" style="padding:18px 20px 8px"><span style="font-weight:600;color:var(--mute)">${wd(cal.sel)}, Oct ${cal.sel}</span><span class="sp"></span><button style="font-weight:700;font-size:13.5px;color:var(--pt)" data-cv="day">Open day</button></div>
  <div style="display:flex;flex-direction:column;gap:8px;padding:0 16px">${dayRows(cal.sel)}</div>`; };

// week: giant day numbers (the agenda look), Mon 19 → Sun 25
const week = () => { let h = '';
  for (let d = 19; d <= 25; d++) { const extra = [];
    if (BDAY[d]) extra.push(`<div class="ag-ev"><img class="av" src="${AV(BDAY[d])}" alt="" width="26" height="26" style="border:2px solid #FF5FA8"><span style="flex:1">${F[BDAY[d]].split(' ')[0]}'s birthday</span>${SV('cake', 24)}</div>`);
    if (BLOCK.includes(d)) extra.push(`<div class="ag-ev" style="opacity:.75"><span style="width:26px;height:26px;border-radius:50%;background:repeating-linear-gradient(135deg,var(--mute) 0 2px,transparent 2px 5px)"></span><span style="flex:1">Unavailable · work trip</span></div>`);
    const items = evOn(d).map((id) => `<button class="ag-ev" data-go="event" data-p='{"id":"${id}"}'><img src="${A(EV[id].img)}" alt="" style="width:26px;height:26px;border-radius:7px;object-fit:cover"><span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${EV[id].short}</span><span class="meta" style="font-size:11px">${EV[id].time}</span></button>`).concat(extra);
    h += `<div class="ag ${d == TODAY ? 'today' : ''} ${d < TODAY ? 'past' : ''} ${items.length ? '' : 'empty'}" data-wd="${d}"><div class="agd"><span class="dsp" style="font-size:${items.length ? 78 : 44}px;line-height:.86">${d}</span><span class="meta" style="font-size:10.5px">${d == TODAY ? 'Today' : wd(d)}</span></div><div class="agr">${items.length ? items.join('') : `<div class="ag-none"><i></i>No plans</div>`}</div></div>`; }
  return `<div class="row" style="padding:14px 16px 0"><button class="icb f" data-toast="Previous week" aria-label="Previous week">${I('ChevronLeft', 18)}</button><span style="flex:1;text-align:center;font-weight:700">Week 43 · 3 plans</span><button class="icb f" data-toast="Next week" aria-label="Next week">${I('ChevronRight', 18)}</button></div>
  <div style="display:flex;flex-direction:column;gap:8px;padding:12px 12px 0">${h}</div>`; };

// day: strip + hour timeline
const SLOT = { supper: [20, 3], razzia: [24, 4], alles: [16, 4], dest: [22, 4], queer: [20, 3], midnight: [16, 6] };
const day = () => { const d = cal.sel; const st0 = evOn(d).map((id) => (SLOT[id] || [20])[0]); const H0 = st0.length ? Math.max(10, Math.min(...st0) - 1) : 17, HN = 30 - H0, RH = 46;
  const strip = Array.from({ length: 7 }, (_, k) => 19 + k).map((n) => `<button class="dstrip ${n == d ? 'on' : ''}" data-dd="${n}"><span>${wd(n)[0]}</span><b>${n}</b>${PLANS[n] ? '<i></i>' : ''}</button>`).join('');
  const blocks = evOn(d).map((id, k) => { const [st, du] = SLOT[id] || [20, 3]; const top = (st - H0) * RH, h = Math.min(du, H0 + HN - st) * RH - 4; const e = EV[id]; return `<button class="dblk" data-go="event" data-p='{"id":"${id}"}' style="top:${top}px;height:${h}px"><img src="${A(e.img)}" alt=""><span class="dbi"><b>${e.short}</b><span class="meta" style="color:inherit;opacity:.8">${e.time} · ${e.venue}</span><span class="avs" style="margin-top:6px">${e.going.map((a) => `<img class="av" src="${AV(a)}" alt="" width="22" height="22">`).join('')}</span></span></button>`; }).join('');
  const allDay = (BDAY[d] ? `<button class="lrow" style="width:100%;text-align:left" data-sheet="bday" data-p='{"who":"${BDAY[d]}"}'><img class="av" src="${AV(BDAY[d])}" alt="" width="36" height="36" style="border:2px solid #FF5FA8"><span class="tt" style="flex:1">${F[BDAY[d]].split(' ')[0]}'s birthday</span>${SV('cake', 28)}</button>` : '') + (BLOCK.includes(d) ? `<div class="lrow"><span class="thumb" style="width:36px;height:36px;background:repeating-linear-gradient(135deg,var(--s3) 0 3px,transparent 3px 7px),var(--s2)"></span><span class="tt">Unavailable · work trip</span></div>` : '');
  return `<div class="row" style="gap:4px;padding:14px 12px 0">${strip}</div>
  ${allDay ? `<div style="display:flex;flex-direction:column;gap:6px;padding:12px 16px 0">${allDay}</div>` : ''}
  <div class="tline" style="height:${HN * RH}px">${Array.from({ length: HN }, (_, k) => `<div class="hl2" style="top:${k * RH}px"><span class="meta">${String((H0 + k) % 24).padStart(2, '0')}:00</span></div>`).join('')}<div class="tlb">${blocks || ''}</div>${blocks ? '' : `<div class="dnone">No plans · <button style="color:var(--pt);font-weight:700" data-go="add">Add one</button></div>`}</div>`; };

SCREENS.calendar = { label: 'Calendar — Month', section: 'Calendar', tag: 'upd', nav: 'calendar', demo: { view: 'month' }, render: (p) => { if (p && p.view) cal.view = p.view; return `${head()}<div class="scroll" id="cbody">${cal.view == 'month' ? month() : cal.view == 'week' ? week() : day()}${modules()}</div>${nav('calendar')}
  <style>
  .cg{display:grid;grid-template-columns:repeat(7,1fr);row-gap:8px}
  .cd{display:flex;flex-direction:column;align-items:center;min-height:44px}
  .cdc{position:relative;width:40px;height:40px;border-radius:50%;display:block}
  .cdn{position:absolute;left:-4px;top:-4px;min-width:17px;height:17px;border-radius:9px;background:var(--ink);color:var(--bg);font:700 9.5px var(--ui);display:flex;align-items:center;justify-content:center;padding:0 3px}
  .cdb{position:absolute;right:-4px;top:-4px;width:17px;height:17px;border-radius:50%;background:#FF5FA8;color:#0B0B0A;display:flex;align-items:center;justify-content:center}
  .ag{display:flex;gap:10px;background:var(--s1);border:1px solid var(--line);border-radius:22px;padding:12px 12px 12px 16px;min-height:104px}
  .ag.today{border-color:var(--p);box-shadow:inset 0 0 0 1px var(--p)}
  .ag.past{opacity:.55}
  .ag.empty{min-height:0;padding-top:10px;padding-bottom:10px;align-items:center}.ag.empty .agd{flex-direction:row;align-items:baseline;gap:8px}
  .agd{width:100px;display:flex;flex-direction:column;justify-content:space-between}
  .agr{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;justify-content:center}
  .ag-ev{display:flex;align-items:center;gap:8px;height:42px;padding:0 10px 0 8px;border-radius:12px;background:var(--s2);font-weight:600;font-size:13.5px;width:100%;text-align:left}
  .ag-none{display:flex;align-items:center;justify-content:center;gap:8px;color:var(--mute);font-size:13.5px;height:100%}
  .ag-none i{width:16px;height:16px;border-radius:50%;background:var(--s2)}
  .dstrip{flex:1;height:70px;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:var(--s1);border:1px solid var(--line);position:relative}
  .dstrip span{font:500 10.5px var(--mono);color:var(--mute)}.dstrip b{font:28px var(--dsp)}
  .dstrip i{position:absolute;bottom:7px;width:5px;height:5px;border-radius:50%;background:var(--p)}
  .dstrip.on{background:var(--p);border-color:var(--p);color:#fff}.dstrip.on span{color:#fff;opacity:.8}.dstrip.on i{background:#fff}
  .tline{position:relative;margin:16px 16px 0}
  .hl2{position:absolute;left:0;right:0;border-top:1px solid var(--line);height:0}.hl2 span{position:absolute;top:4px;left:0;font-size:10px}
  .tlb{position:absolute;left:52px;right:0;top:0;bottom:0}
  .dblk{position:absolute;left:0;right:0;border-radius:18px;overflow:hidden;text-align:left;color:#fff;background:#000;box-shadow:0 10px 24px rgba(0,0,0,.2)}
  .dblk>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.6}
  .dbi{position:relative;display:flex;flex-direction:column;padding:12px 14px;gap:2px;font-size:16px}
  .dnone{position:absolute;left:52px;right:0;top:0;padding:14px;color:var(--mute);font-size:13.5px}
  </style>`; },
  mount: (el) => { el.addEventListener('click', (e) => {
    const v = e.target.closest('[data-cv]'); if (v) { cal.view = v.dataset.cv; go('calendar'); return; }
    const dd = e.target.closest('[data-dd]'); if (dd) { cal.sel = +dd.dataset.dd; go('calendar'); return; }
    const wdd = e.target.closest('[data-wd]'); if (wdd && !e.target.closest('[data-go]')) { cal.sel = +wdd.dataset.wd; cal.view = 'day'; go('calendar'); return; }
    const d = e.target.closest('[data-day]'); if (d && cal.view == 'month') { const n = +d.dataset.day; if (BLOCK.includes(n)) { openSheet('block'); return; } cal.sel = n || 24; const b = el.querySelector('#cbody'); const sc = b.scrollTop; b.innerHTML = month() + modules(); b.scrollTop = sc; }
  }); } };
SCREENS.calWeek = { label: 'Calendar — Week', section: 'Calendar', tag: 'new', render: () => '', alias: ['calendar', { view: 'week' }] };
SCREENS.calDay = { label: 'Calendar — Day', section: 'Calendar', tag: 'new', render: () => '', alias: ['calendar', { view: 'day' }] };

SHEETS.sync = { label: 'Sync to my calendar', section: 'Calendar', base: 'calendar', tag: 'old', render: () => `
  <div style="text-align:center">${SV('calendar', 84, -6)}</div><div class="dsp" style="font-size:32px;text-align:center;margin-top:10px">Sync to my calendar</div>
  <p class="mute" style="text-align:center;font-size:14px;margin:8px 10px 0">Subscribe once — your events stay up to date in Google, Apple or Outlook automatically.</p>
  <div class="row" style="margin-top:16px;padding:12px 14px;border-radius:16px;background:var(--bg)"><div style="flex:1"><div style="font-weight:600">Include Maybe</div><div class="mute" style="font-size:12.5px">Shown as “Maybe · …” and tentative</div></div><button class="tog" aria-pressed="true" aria-label="Include maybe"></button></div>
  <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">${['Apple Calendar (iPhone / Mac)', 'Google Calendar', 'Outlook'].map((x) => `<button class="pill pg" style="height:50px" data-toast="Opens ${x}">${I('CalendarPlus', 18)}${x}</button>`).join('')}<button class="pill" style="height:44px" data-toast="Link copied">${I('Copy', 17)}Copy link for other apps</button></div>
  <p class="mute" style="text-align:center;font-size:12px;margin:10px 6px 0">Your calendar app refreshes on its own schedule. This link is private; don't share it.</p>` };
SHEETS.block = { label: 'Mark days unavailable', section: 'Calendar', base: 'calendar', tag: 'upd', render: () => `
  <div class="row">${SV('moon', 60, -8)}<div><div class="dsp" style="font-size:28px">Unavailable Oct 27 → 28</div><div class="meta" style="margin-top:6px">2 days blocked</div></div></div>
  <div class="field" style="margin-top:16px"><input value="Work trip" aria-label="Reason"></div>
  <div class="row" style="margin-top:10px;padding:12px 14px;border-radius:16px;background:var(--bg)">${I('Plane', 20, 2, 'color:var(--pt)')}<div style="flex:1"><div style="font-weight:600">Show friends I'm away</div><div class="mute" style="font-size:12.5px">You show up under “Friends away” on their calendar.</div></div><button class="tog" aria-pressed="true" aria-label="Show as away"></button></div>
  <div class="row" style="gap:8px;margin-top:14px"><button class="pill po" style="flex:1;height:48px" data-close>${I('Pencil', 16)}Edit dates</button><button class="pill" style="flex:1;height:48px;color:#F0524F" data-close>${I('Trash2', 16)}Erase</button></div>` };
SHEETS.bday = { label: 'Birthday card', section: 'Calendar', base: 'calendar', tag: 'upd', demo: { who: 'nina' }, render: (p) => { const n = F[p.who || 'nina'].split(' ')[0]; return `
  <div class="dsp" style="font-size:32px">Send a birthday card</div><div class="mute" style="font-size:14px;margin-top:6px">For ${n} — they'll get a confetti reveal.</div>
  <div style="position:relative;height:270px;margin-top:14px;border-radius:26px;background:linear-gradient(150deg,#FF5FA8,#7C3BED);overflow:hidden"><span style="position:absolute;left:18px;top:18px">${SV('cake', 104, -10)}</span><span style="position:absolute;right:24px;top:8px">${SV('balloon', 84, 10)}</span><div style="position:absolute;left:16px;right:16px;bottom:16px;border-radius:18px;background:rgba(255,255,255,.22);backdrop-filter:blur(8px);padding:14px;color:#fff"><b style="font-size:19px">Happy birthday, ${n}!</b><div style="font-style:italic;margin-top:4px">“Dinner's on us this Friday.”</div></div></div>
  <div class="row" style="gap:8px;margin-top:12px;overflow-x:auto;scrollbar-width:none">${['cake', 'balloon', 'gift', 'bottle', 'popper', 'plus1', 'heart'].map((s, k) => `<span style="flex:none;width:54px;height:54px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:${k < 2 ? 'var(--pSoft)' : 'var(--bg)'}">${SV(s, 36)}</span>`).join('')}</div>
  <div class="row" style="gap:8px;margin-top:14px"><button class="pill" style="flex:1;height:50px;color:var(--mute)" data-close>Cancel</button><button class="pill pp" style="flex:2;height:50px;opacity:.6">Wait for the day</button></div>`; } };
})();
