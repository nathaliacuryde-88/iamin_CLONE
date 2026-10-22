// CALENDAR: Month (flyer circles + spend + stats) and Agenda (giant day numbers)
(() => {
const cal = { view: 'month', sel: 24 };
const PLANS = { 3: ['fl_razzia.jpg', 22, 'in'], 10: ['fl_alles.jpg', 18, 'in'], 22: ['f2.jpg', 14, 'in'], 24: ['fl_razzia.jpg', 0, 'in'], 25: ['fl_desterradxs.jpg', 0, 'maybe'], 30: ['fl_queer.jpg', 0, 'maybe'], 31: ['fl_midnight.jpg', 0, 'in'] };
const BDAY = { 12: 'timo', 29: 'nina' }; const AWAY = { 20: 'jonas', 21: 'jonas' }; const BLOCK = [27, 28]; const TODAY = 22;
const head = () => `${statusBar()}${header()}
  <div class="row" style="padding:2px 16px 0 20px;flex:none"><span class="dsp" style="font-size:46px">October</span><span class="meta" style="margin:14px 0 0 8px">2026</span><span class="sp"></span><button class="icb f" data-sheet="sync" aria-label="Sync to my calendar">${I('RefreshCcw', 19)}</button></div>
  <div class="row" style="padding:12px 16px 0;flex:none"><div class="seg" style="width:210px"><button data-cv="month" aria-pressed="${cal.view == 'month'}">Month</button><button data-cv="agenda" aria-pressed="${cal.view == 'agenda'}">Agenda</button></div><span class="sp"></span><span class="mute" style="font-size:13px;font-weight:600;margin-right:8px">Maybes</span><button class="tog" aria-pressed="true" aria-label="Show maybes"></button></div>`;

const cell = (d) => {
  if (!d) return '<span></span>';
  const p = PLANS[d], b = BDAY[d], a = AWAY[d], bl = BLOCK.includes(d), today = d == TODAY, sel = d == cal.sel;
  const ring = sel ? 'box-shadow:0 0 0 3px var(--p);' : today ? 'box-shadow:0 0 0 2px var(--ink);' : '';
  let face;
  if (p) face = `<img src="${A(p[0])}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;${p[2] == 'maybe' ? 'opacity:.55;filter:saturate(.6)' : ''}">`;
  else if (b) face = `<img src="${AV(b)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;border:2.5px solid #FF5FA8">`;
  else face = `<span style="width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;background:${bl ? 'repeating-linear-gradient(135deg,var(--s3) 0 3px,transparent 3px 7px),var(--s2)' : 'var(--s2)'};color:${bl ? 'var(--mute)' : 'var(--ink)'}">${d}</span>`;
  return `<button class="cd" data-day="${d}" aria-label="Oct ${d}"><span class="cdc" style="${ring}">${face}${p || b ? `<span class="cdn">${d}</span>` : ''}${b ? `<span class="cdb">${I('Cake' in LUCIDE ? 'Cake' : 'Gift', 10, 2.6)}</span>` : ''}${a ? `<img class="cda" src="${AV(a)}" alt="">` : ''}</span><span class="cds">${p && p[1] ? '€' + p[1] : p && p[2] == 'maybe' ? 'maybe' : ''}</span></button>`;
};
const month = () => { const days = [null, null, null, ...Array.from({ length: 31 }, (_, k) => k + 1)];
  return `<div class="row" style="gap:8px;padding:14px 16px 0">${[['6', 'nights out'], ['€86', 'spent · the tab'], ['Romantica', 'top venue']].map((s, k) => `<div class="card" style="flex:${k == 2 ? 1.4 : 1};padding:12px;text-align:center"><div class="${k == 2 ? '' : 'dsp'}" style="font-size:${k == 2 ? 16 : 30}px;font-weight:700;${k == 2 ? 'padding-top:8px;padding-bottom:4px' : ''}">${s[0]}</div><div class="mute" style="font-size:11.5px;margin-top:4px">${s[1]}</div></div>`).join('')}</div>
  <div class="card" style="margin:10px 16px 0;padding:14px 8px 10px">
    <div class="cg" style="margin-bottom:4px">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<span class="meta" style="text-align:center;font-size:10.5px">${d}</span>`).join('')}</div>
    <div class="cg">${days.map(cell).join('')}</div>
    <div class="meta" style="text-align:center;font-size:9.5px;text-transform:none;margin-top:8px">Long-press to mark days unavailable · Tap a blocked day to edit</div>
  </div>
  <div class="row" style="gap:12px;padding:10px 20px 0;flex-wrap:wrap">${[[`<i style="width:12px;height:12px;border-radius:50%;background:url('${A('fl_razzia.jpg')}') center/cover"></i>`, 'Going'], [`<i style="width:12px;height:12px;border-radius:50%;background:url('${A('fl_queer.jpg')}') center/cover;opacity:.5"></i>`, 'Maybe'], ['<i style="width:12px;height:12px;border-radius:50%;border:2px solid #FF5FA8"></i>', 'Birthday'], [`<img src="${AV('jonas')}" alt="" style="width:13px;height:13px;border-radius:50%">`, 'Friend away'], ['<i style="width:12px;height:12px;border-radius:50%;background:repeating-linear-gradient(135deg,var(--mute) 0 2px,transparent 2px 4px)"></i>', 'Unavailable']].map((x) => `<span class="meta" style="display:flex;align-items:center;gap:5px;font-size:10px">${x[0]}${x[1]}</span>`).join('')}</div>
  <div class="row" style="padding:18px 20px 8px"><span style="font-weight:600;color:var(--mute)">Saturday, Oct ${cal.sel}</span><span class="sp"></span><button style="font-weight:700;font-size:13.5px;color:var(--pt)" data-day="0">Show all</button></div>
  <div style="display:flex;flex-direction:column;gap:8px;padding:0 16px">${dayRows(cal.sel)}</div>
  <div class="h2" style="padding-top:26px"><span class="dsp" style="font-size:26px">Where your nights went</span></div>
  <div style="display:flex;flex-direction:column;gap:6px;padding:0 16px">${[['fl_razzia.jpg', 'Romantica', 36, 2], ['fl_alles.jpg', 'Wagenhalle', 18, 1], ['f2.jpg', "Marie's place", 14, 1], ['fl_desterradxs.jpg', 'Utopia Kiosk', 18, 1]].map((v) => `<div style="position:relative;height:54px;border-radius:16px;overflow:hidden;background:var(--s1);border:1px solid var(--line)"><i style="position:absolute;left:0;top:0;bottom:0;width:${v[2] / 36 * 72}%;background:var(--pSoft)"></i><div class="row" style="position:relative;height:100%;padding:0 12px"><img src="${A(v[0])}" alt="" style="width:34px;height:34px;border-radius:50%;object-fit:cover"><span style="flex:1;font-weight:600">${v[1]}</span><span class="mute" style="font-size:12.5px">${v[3]} night${v[3] > 1 ? 's' : ''}</span><b style="margin-left:10px">€${v[2]}</b></div></div>`).join('')}</div>`; };

const evRow = (id) => { const e = EV[id]; const r = state.rsvp[id] || (id == 'dest' || id == 'queer' ? 'maybe' : 'in'); return `<button class="lrow" data-go="event" data-p='{"id":"${id}"}' style="text-align:left;width:100%"><i style="width:10px;height:10px;border-radius:50%;flex:none;${r == 'in' ? 'background:var(--p)' : 'box-shadow:inset 0 0 0 2px var(--pt)'}"></i><img class="thumb" src="${A(e.img)}" alt=""><div style="flex:1;min-width:0"><div class="tt">${e.name}</div><div class="sub"><span class="meta" style="color:var(--pt)">${e.time}</span>· ${e.count} going</div></div>${I('ChevronRight', 18, 2, 'color:var(--mute)')}</button>`; };
function dayRows(d) {
  const ids = Object.keys(EV).filter((k) => EV[k].day == d);
  let h = ids.map(evRow).join('');
  if (BDAY[d]) h += `<button class="lrow" style="width:100%;text-align:left" data-sheet="bday" data-p='{"who":"${BDAY[d]}"}'><img class="av" src="${AV(BDAY[d])}" alt="" width="46" height="46" style="border:2.5px solid #FF5FA8"><div style="flex:1"><div class="tt">${F[BDAY[d]].split(' ')[0]}'s birthday</div><div class="sub">Tap to send a card</div></div>${SV('cake', 34, 8)}</button>`;
  if (AWAY[d]) h += `<div class="lrow"><img class="av" src="${AV(AWAY[d])}" alt="" width="46" height="46"><div style="flex:1"><div class="tt">${F[AWAY[d]].split(' ')[0]} is away</div><div class="sub">${I('Plane', 14)}Lisbon · back Thu</div></div></div>`;
  if (BLOCK.includes(d)) h += `<div class="lrow"><span class="thumb" style="background:repeating-linear-gradient(135deg,var(--s3) 0 3px,transparent 3px 7px),var(--s2)"></span><div style="flex:1"><div class="tt">You're unavailable</div><div class="sub">Work trip · Oct 27 → 28</div></div>${I('Pencil', 17, 2, 'color:var(--mute)')}</div>`;
  return h || `<div class="lrow" style="justify-content:center;color:var(--mute)">No plans this day · <button style="color:var(--pt);font-weight:700" data-go="add">Add one</button></div>`;
}

const agenda = () => { let h = '';
  for (let d = 22; d <= 32; d++) { const day = d > 31 ? d - 31 : d; const wd = ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'][(d - 22) % 7];
    const ids = d > 31 ? [] : Object.keys(EV).filter((k) => EV[k].day == day); const extra = [];
    if (BDAY[day] && d <= 31) extra.push(`<div class="ag-ev"><img class="av" src="${AV(BDAY[day])}" alt="" width="26" height="26" style="border:2px solid #FF5FA8"><span style="flex:1">${F[BDAY[day]].split(' ')[0]}'s birthday</span>${SV('cake', 24)}</div>`);
    if (BLOCK.includes(day) && d <= 31) extra.push(`<div class="ag-ev" style="opacity:.75"><span style="width:26px;height:26px;border-radius:50%;background:repeating-linear-gradient(135deg,var(--mute) 0 2px,transparent 2px 5px)"></span><span style="flex:1">Unavailable · work trip</span></div>`);
    const items = ids.map((id) => `<button class="ag-ev" data-go="event" data-p='{"id":"${id}"}'><img src="${A(EV[id].img)}" alt="" style="width:26px;height:26px;border-radius:7px;object-fit:cover"><span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${EV[id].short}</span><span class="meta" style="font-size:11px">${EV[id].time}</span></button>`).concat(extra);
    h += `<div class="ag ${d == 22 ? 'today' : ''}"><div class="agd"><span class="dsp" style="font-size:78px;line-height:.86">${day}</span><span class="meta" style="font-size:10.5px">${d == 22 ? 'Today' : wd}${d > 31 ? ' · Nov' : ''}</span></div><div class="agr">${items.length ? items.join('') : `<div class="ag-none"><i></i>No plans</div>`}</div></div>`; }
  return `<div style="display:flex;flex-direction:column;gap:8px;padding:14px 12px 0">${h}</div>`; };

SCREENS.calendar = { label: 'Calendar — Month & Agenda', section: 'Calendar', tag: 'upd', nav: 'calendar', render: () => `${head()}<div class="scroll" id="cbody">${cal.view == 'month' ? month() : agenda()}</div>${nav('calendar')}
  <style>
  .cg{display:grid;grid-template-columns:repeat(7,1fr);row-gap:4px}
  .cd{display:flex;flex-direction:column;align-items:center;gap:2px;min-height:58px}
  .cdc{position:relative;width:40px;height:40px;border-radius:50%;display:block}
  .cdn{position:absolute;left:-4px;top:-4px;min-width:17px;height:17px;border-radius:9px;background:var(--ink);color:var(--bg);font:700 9.5px var(--ui);display:flex;align-items:center;justify-content:center;padding:0 3px}
  .cdb{position:absolute;right:-4px;top:-4px;width:17px;height:17px;border-radius:50%;background:#FF5FA8;color:#0B0B0A;display:flex;align-items:center;justify-content:center}
  .cda{position:absolute;right:-5px;bottom:-5px;width:18px;height:18px;border-radius:50%;object-fit:cover;border:2px solid var(--s1)}
  .cds{font:600 10.5px var(--ui);color:var(--mute);height:13px}
  .ag{display:flex;gap:10px;background:var(--s1);border:1px solid var(--line);border-radius:22px;padding:12px 12px 12px 16px;min-height:104px}
  .ag.today{border-color:var(--p);box-shadow:inset 0 0 0 1px var(--p)}
  .agd{width:100px;display:flex;flex-direction:column;justify-content:space-between}
  .agr{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;justify-content:center}
  .ag-ev{display:flex;align-items:center;gap:8px;height:42px;padding:0 10px 0 8px;border-radius:12px;background:var(--s2);font-weight:600;font-size:13.5px;width:100%;text-align:left}
  .ag-none{display:flex;align-items:center;justify-content:center;gap:8px;color:var(--mute);font-size:13.5px;height:100%}
  .ag-none i{width:16px;height:16px;border-radius:50%;background:var(--s2)}
  </style>`,
  mount: (el) => { el.addEventListener('click', (e) => {
    const v = e.target.closest('[data-cv]'); if (v) { cal.view = v.dataset.cv; go('calendar'); return; }
    const d = e.target.closest('[data-day]'); if (d && cal.view == 'month') { const n = +d.dataset.day; if (BLOCK.includes(n)) { openSheet('block'); return; } cal.sel = n || 24; const sc = el.querySelector('#cbody').scrollTop; el.querySelector('#cbody').innerHTML = month(); el.querySelector('#cbody').scrollTop = sc; }
  }); } };

SHEETS.sync = { label: 'Sync to my calendar', section: 'Calendar', base: 'calendar', tag: 'old', render: () => `
  <div style="text-align:center">${SV('calendar', 84, -6)}</div><div class="dsp" style="font-size:32px;text-align:center;margin-top:10px">Sync to my calendar</div>
  <p class="mute" style="text-align:center;font-size:14px;margin:8px 10px 0">Subscribe once — your events stay up to date in Google, Apple or Outlook automatically.</p>
  <div class="row" style="margin-top:16px;padding:12px 14px;border-radius:16px;background:var(--bg)"><div style="flex:1"><div style="font-weight:600">Include Maybe</div><div class="mute" style="font-size:12.5px">Shown as “Maybe · …” and tentative</div></div><button class="tog" aria-pressed="true" aria-label="Include maybe"></button></div>
  <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">${['Apple Calendar (iPhone / Mac)', 'Google Calendar', 'Outlook'].map((x) => `<button class="pill pg" style="height:50px" data-toast="Opens ${x}">${I('CalendarPlus', 18)}${x}</button>`).join('')}<button class="pill" style="height:44px" data-toast="Link copied">${I('Copy', 17)}Copy link for other apps</button></div>
  <p class="mute" style="text-align:center;font-size:12px;margin:10px 6px 0">Your calendar app refreshes on its own schedule. This link is private; don't share it.</p>` };
SHEETS.block = { label: 'Mark days unavailable', section: 'Calendar', base: 'calendar', tag: 'upd', render: () => `
  <div class="row">${SV('moon', 60, -8)}<div><div class="dsp" style="font-size:28px">Unavailable Oct 27 → 28</div><div class="meta" style="margin-top:6px">2 days blocked</div></div></div>
  <div class="field" style="margin-top:16px"><input value="Work trip" aria-label="Reason"></div>
  <div class="row" style="margin-top:10px;padding:12px 14px;border-radius:16px;background:var(--bg)">${I('Plane', 20, 2, 'color:var(--pt)')}<div style="flex:1"><div style="font-weight:600">Show friends I'm away</div><div class="mute" style="font-size:12.5px">Your face shows on these days in their calendar.</div></div><button class="tog" aria-pressed="true" aria-label="Show as away"></button></div>
  <div class="row" style="gap:8px;margin-top:14px"><button class="pill po" style="flex:1;height:48px" data-close>${I('Pencil', 16)}Edit dates</button><button class="pill" style="flex:1;height:48px;color:#F0524F" data-close>${I('Trash2', 16)}Erase</button></div>` };
SHEETS.bday = { label: 'Birthday card', section: 'Calendar', base: 'calendar', tag: 'upd', demo: { who: 'nina' }, render: (p) => { const n = F[p.who || 'nina'].split(' ')[0]; return `
  <div class="dsp" style="font-size:32px">Send a birthday card</div><div class="mute" style="font-size:14px;margin-top:6px">For ${n} — they'll get a confetti reveal.</div>
  <div style="position:relative;height:270px;margin-top:14px;border-radius:26px;background:linear-gradient(150deg,#FF5FA8,#7C3BED);overflow:hidden"><span style="position:absolute;left:18px;top:18px">${SV('cake', 104, -10)}</span><span style="position:absolute;right:24px;top:8px">${SV('balloon', 84, 10)}</span><div style="position:absolute;left:16px;right:16px;bottom:16px;border-radius:18px;background:rgba(255,255,255,.22);backdrop-filter:blur(8px);padding:14px;color:#fff"><b style="font-size:19px">Happy birthday, ${n}!</b><div style="font-style:italic;margin-top:4px">“Dinner's on us this Friday.”</div></div></div>
  <div class="row" style="gap:8px;margin-top:12px;overflow-x:auto;scrollbar-width:none">${['cake', 'balloon', 'gift', 'bottle', 'popper', 'plus1', 'heart'].map((s, k) => `<span style="flex:none;width:54px;height:54px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:${k < 2 ? 'var(--pSoft)' : 'var(--bg)'}">${SV(s, 36)}</span>`).join('')}</div>
  <div class="row" style="gap:8px;margin-top:14px"><button class="pill" style="flex:1;height:50px;color:var(--mute)" data-close>Cancel</button><button class="pill pp" style="flex:2;height:50px;opacity:.6">Wait for the day</button></div>`; } };
})();
