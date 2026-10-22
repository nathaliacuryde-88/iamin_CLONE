// CALENDAR + subpages (hero card + date-column list)
(() => {
const head = (wOn) => `<div style="padding:8px 20px 0;display:flex;align-items:flex-end;justify-content:space-between"><span class="dsp" style="font-size:46px">October</span><span style="display:flex;align-items:center;gap:8px">${meta('2026', 'font-size:13px')}<span class="hb" style="background:var(--s1);border:1px solid var(--line)">${P('arrows-clockwise', 19)}</span></span></div>
 <div style="display:flex;align-items:center;justify-content:space-between;margin:14px 16px 0">${seg(['Month', 'Week', 'Day'], wOn, 'width:230px')}<span style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--mute)">Maybes${tog()}</span></div>`;
// one day circle
const AWAY = { 21: 'timo', 22: 'timo', 23: 'timo' };
const circle = (d, o = {}) => {
  const going = [3, 10, 24, 31].includes(d) && !o.other, maybe = [9, 25].includes(d) && !o.other, today = d == 22 && !o.other, blocked = [27, 28].includes(d) && !o.other, bday = d == 30 && !o.other, away = !o.other && AWAY[d], sel = o.sel == d && !o.other;
  const bg = sel ? '#F4F3EE' : going ? 'var(--p)' : blocked ? 'repeating-linear-gradient(135deg,rgba(255,255,255,.18) 0 3px,transparent 3px 7px),#222220' : '#222220';
  return `<div style="position:relative;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;background:${bg};color:${sel ? '#0B0B0A' : o.other ? 'rgba(244,243,238,.3)' : blocked ? 'rgba(244,243,238,.55)' : '#F4F3EE'};${today ? 'box-shadow:0 0 0 2px #F4F3EE;' : ''}${maybe ? 'box-shadow:inset 0 0 0 2px #A98BFF;' : ''}">${d}${away ? `<img src="${A(away)}" class="abs" style="right:-5px;bottom:-5px;width:18px;height:18px;border-radius:50%;object-fit:cover;border:2px solid var(--hero)">` : ''}${bday ? `<span class="abs" style="right:-6px;top:-7px;width:18px;height:18px;border-radius:50%;background:#FF5FA8;color:#0B0B0A;display:flex;align-items:center;justify-content:center">${P('cake', 11, 'fill')}</span>` : ''}</div>`;
};
const hero = (title, sub, days, o = {}) => `<div style="margin:14px 16px 0;background:var(--hero);color:var(--heroInk);border-radius:30px;padding:20px 18px">
   <div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-weight:600;font-size:22px">${title}</div><div style="font-weight:600;font-size:22px;color:#5E5D58">${sub}</div></div><span style="display:flex;gap:8px;color:#8C8B85">${P('caret-left', 20, 'bold')}${P('caret-right', 20, 'bold')}</span></div>
   <div style="display:grid;grid-template-columns:repeat(7,40px);justify-content:space-between;margin-top:18px">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((x) => `<span class="meta" style="text-align:center;font-size:10.5px;color:#8C8B85">${x}</span>`).join('')}</div>
   <div style="display:grid;grid-template-columns:repeat(7,40px);justify-content:space-between;gap:10px 0;margin-top:8px">${days.map((d) => circle(d[0], { other: d[1], sel: o.sel })).join('')}</div>
   ${o.hint ? `<div class="meta" style="text-align:center;font-size:10px;margin-top:14px;text-transform:none;color:#8C8B85">Long-press to mark days unavailable · Tap a blocked day to edit</div>` : ''}
 </div>`;
const legend = `<div style="display:flex;flex-wrap:wrap;gap:8px 14px;margin:12px 20px 0">${[['<i style="width:10px;height:10px;border-radius:50%;background:var(--p)"></i>', 'Going'], ['<i style="width:10px;height:10px;border-radius:50%;box-shadow:inset 0 0 0 2px var(--pt)"></i>', 'Maybe'], ['<i style="width:12px;height:12px;border-radius:50%;background:repeating-linear-gradient(135deg,var(--mute) 0 2px,transparent 2px 4px)"></i>', 'Unavailable'], [`<img src="${A('timo')}" style="width:14px;height:14px;border-radius:50%;object-fit:cover">`, 'Friend away'], [`<span style="width:14px;height:14px;border-radius:50%;background:#FF5FA8;color:#0B0B0A;display:flex;align-items:center;justify-content:center">${P('cake', 9, 'fill')}</span>`, 'Birthday']].map((x) => `<span class="meta" style="display:flex;align-items:center;gap:6px;font-size:10.5px">${x[0]}${x[1]}</span>`).join('')}</div>`;
const two = [[19], [20], [21], [22], [23], [24], [25], [26], [27], [28], [29], [30], [31], [1, 1]];
const month = [[28, 1], [29, 1], [30, 1], ...Array.from({ length: 31 }, (_, i) => [i + 1]), [1, 1]];
const dc = (wd, d) => `<div class="datec">${meta(wd, 'font-size:10.5px')}<b>${d}</b></div>`;
const right = { in: `<span class="pill pp" style="height:30px;padding:0 12px;font-size:13px">In</span>`, maybe: `<span class="chip" style="height:30px;font-size:12.5px;border-color:var(--pt);color:var(--pt);background:transparent">Maybe</span>` };
const evRow = (wd, d, img, title, sub, r, st = '') => `<div class="lrow" style="${st}">${dc(wd, d)}${img}<div style="flex:1;min-width:0"><div class="tt">${title}</div><div class="sub">${sub}</div></div>${r}</div>`;
const timeChip = (tm) => `<span style="height:22px;border-radius:999px;padding:0 8px;background:color-mix(in srgb,var(--p) 16%,transparent);color:var(--pt);display:inline-flex;align-items:center;gap:4px;font-family:'JetBrains Mono';font-size:11px">${P('clock', 12)}${tm}</span>`;

// C1 Week (Upcoming)
const week = (t) => page(t, 'calweek', `${head(1)}${hero('Upcoming', 'Next 2 weeks', two)}${legend}
 <div style="margin:16px 16px 0;display:flex;gap:8px;overflow:hidden">
   <div class="lrow" style="min-height:60px;padding:10px 14px;flex:none;background:color-mix(in srgb,var(--p) 10%,var(--s1))"><img src="${A('timo')}" style="width:38px;height:38px;border-radius:50%;object-fit:cover"><div><div style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px">Timo is away ${P('airplane-tilt', 15, 'fill', 'color:var(--pt)')}</div>${meta('Lisbon · 21–23 Oct', 'font-size:10.5px')}</div></div>
   <div class="lrow" style="min-height:60px;padding:10px 14px;flex:none"><img src="${A('nina')}" style="width:38px;height:38px;border-radius:50%;object-fit:cover"><div><div style="font-weight:600;font-size:14px">Nina is away</div>${meta('Home · 2–4 Nov', 'font-size:10.5px')}</div></div>
 </div>
 <div style="margin:14px 16px 0;display:flex;flex-direction:column;gap:8px">
  ${evRow('Sat', '24', `<img class="thumb" src="${IMG('f2.jpg')}">`, "Supperclub at Marie's", `${timeChip('20:00')}6 going`, right.in)}
  ${evRow('Sun', '25', `<img class="thumb" src="${IMG('fl_desterradxs.png')}">`, 'Desterradxs festival', `${timeChip('22:00')}12 going`, right.maybe)}
  ${evRow('Tue', '27', `<div class="thumb" style="background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--mute) 40%,transparent) 0 3px,transparent 3px 7px);border:1px solid var(--line2);display:flex;align-items:center;justify-content:center;color:var(--mute)">${P('prohibit', 20)}</div>`, "You're unavailable", `${meta('→ Oct 28')} · Work trip`, `<span style="color:var(--mute)">${P('pencil-simple', 18)}</span>`)}
  ${evRow('Fri', '30', `<div class="thumb" style="background:#FFE3F0;display:flex;align-items:center;justify-content:center;overflow:visible">${ST('cake', 40, 8)}</div>`, "Nina's birthday", 'Turns 27 · send her a card', `<span class="pill pg" style="height:32px;padding:0 12px;font-size:13px">${P('envelope-simple', 15)}Card</span>`)}
  ${evRow('Sat', '31', `<div class="thumb" style="background:var(--s2)"></div>`, 'Hidden plan', `${timeChip('23:00')}`, `<span class="hb" style="width:32px;height:32px;background:var(--s2);color:var(--mute)">${P('lock-simple', 16)}</span>`, 'filter:blur(1.5px);opacity:.55')}
 </div>`, 'cal');

// C2 Month (selected day)
const monthV = (t) => page(t, 'calmonth', `${head(0)}${hero('October', '2026', month, { sel: 24, hint: 1 })}${legend}
 <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 20px 8px"><span style="font-weight:600;font-size:15px;color:var(--mute)">Saturday, Oct 24</span><span style="font-weight:700;font-size:14px;color:var(--pt)">Show all</span></div>
 <div style="margin:0 16px;display:flex;flex-direction:column;gap:8px">
  ${evRow('Sat', '24', `<img class="thumb" src="${IMG('f2.jpg')}">`, "Supperclub at Marie's", `${timeChip('20:00')}6 going`, right.in)}
  ${evRow('Sat', '24', `<img class="thumb" src="${IMG('fl_alles.png')}">`, 'Alles offen 26 · aftershow', `${timeChip('23:30')}4 going`, right.maybe)}
 </div>`, 'cal');

// C3 Day (today, timeline)
const dayV = (t) => page(t, 'calday', `${head(2)}
 <div style="margin:14px 16px 0;background:var(--hero);color:var(--heroInk);border-radius:30px;padding:20px 18px">
   <div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-weight:600;font-size:22px">Thursday</div><div style="font-weight:600;font-size:22px;color:#5E5D58">October 22 · today</div></div><span style="display:flex;gap:8px;color:#8C8B85">${P('caret-left', 20, 'bold')}${P('caret-right', 20, 'bold')}</span></div>
   <div style="position:relative;margin-top:22px;padding-left:64px">
     <div class="abs" style="left:52px;top:0;bottom:0;width:2px;background:#2A2A27"></div>
     <div style="position:relative;height:56px"><span class="abs meta" style="left:-64px;top:4px;color:#A98BFF;font-size:12px">19:40</span><i class="abs" style="left:-17px;top:6px;width:12px;height:12px;border-radius:50%;background:#7C3BED;box-shadow:0 0 12px #7C3BED"></i><div class="abs" style="left:0;right:0;top:11px;height:2px;background:rgba(124,59,237,.6)"></div><span class="abs meta" style="right:0;top:-6px;color:#A98BFF;font-size:10px">Now</span><div class="abs" style="left:0;top:22px;font-size:13px;color:#8C8B85">Free for 1 h 20 min — pre-drinks, anyone?</div></div>
     ${[['21:00', 'f2.jpg', "Pre-drinks at Jonas'", 'in'], ['23:00', 'fl_queer.png', 'Queerfeminist Night', 'maybe']].map((e) => `<div style="position:relative;margin-top:14px"><span class="abs meta" style="left:-64px;top:20px;color:#F4F3EE;font-size:12px">${e[0]}</span><i class="abs" style="left:-16px;top:24px;width:10px;height:10px;border-radius:50%;${e[3] == 'in' ? 'background:#7C3BED' : 'box-shadow:inset 0 0 0 2px #A98BFF'}"></i><div style="background:#222220;border-radius:18px;padding:10px;display:flex;align-items:center;gap:10px"><img src="${IMG(e[1])}" style="width:44px;height:44px;border-radius:12px;object-fit:cover"><span style="flex:1;font-weight:600;font-size:14.5px">${e[2]}</span>${P('caret-right', 16, 'bold', 'color:#8C8B85')}</div></div>`).join('')}
     <div style="margin-top:16px;height:46px;border-radius:16px;border:1.5px dashed rgba(169,139,255,.7);display:flex;align-items:center;justify-content:center;gap:6px;font-weight:600;font-size:14px;color:#A98BFF">${P('plus', 16, 'bold')}Add to this night</div>
   </div>
 </div>
 <div class="lrow" style="margin:14px 16px 0;background:color-mix(in srgb,var(--p) 10%,var(--s1))"><img src="${A('timo')}" style="width:40px;height:40px;border-radius:50%;object-fit:cover"><div style="flex:1"><div style="font-weight:600;font-size:14.5px;display:flex;align-items:center;gap:6px">Timo is away today ${P('airplane-tilt', 15, 'fill', 'color:var(--pt)')}</div><div class="sub">Lisbon · back Friday</div></div></div>
 <div style="margin:22px 16px 0;border-radius:26px;border:1.5px dashed var(--line2);padding:22px;text-align:center">${ST('maybe', 70, -6)}<div style="font-weight:700;font-size:16px;margin-top:10px">Empty calendar = wasted potential.</div><div class="hint" style="margin-top:4px">Friday, Oct 23 is begging for plans.</div>${pill('pp', 'Add an event', 'plus', 'margin-top:14px;height:44px')}</div>
 <div class="hint" style="text-align:center;margin-top:8px;font-size:12px">↑ how an empty day looks</div>`, 'cal');

// C4 Sync sheet
const sync = (t) => sheet(t, 'sync', head(1), `
  <div style="display:flex;justify-content:center;margin-top:-4px">${ST('calendar', 92, -6)}</div>
  ${H1('Sync to my calendar', 34, 'padding:12px 22px 0;text-align:center')}
  <div class="hint" style="text-align:center;padding:10px 30px 0;font-size:14px">Subscribe once — your events stay up to date in Google, Apple or Outlook automatically.</div>
  <div style="margin:18px 18px 0;border-radius:20px;background:var(--bg);padding:14px 16px" class="row2"><div style="flex:1"><div style="font-weight:600;font-size:15px">Include Maybe</div><div class="hint" style="font-size:12.5px">Shown as “Maybe · …” and tentative</div></div>${tog()}</div>
  <div style="display:flex;flex-direction:column;gap:8px;padding:14px 18px 0">${[['apple-logo', 'Apple Calendar (iPhone / Mac)'], ['google-logo', 'Google Calendar'], ['microsoft-outlook-logo', 'Outlook']].map((x) => pill('pg', x[1], x[0], 'height:52px;font-size:15px')).join('')}${pill('', 'Copy link for other apps', 'copy', 'height:46px;color:var(--ink)')}</div>
  <div class="hint" style="padding:10px 26px 0;font-size:12px;text-align:center">Your calendar app refreshes on its own schedule — Apple about hourly, Google can take up to a day. This link is private; don't share it.</div>
  <div style="text-align:center;margin-top:12px;font-size:13px;font-weight:600;color:var(--mute);display:flex;align-items:center;justify-content:center;gap:6px">${P('arrows-clockwise', 15)}Cancel sync</div>
`, { top: 120 });

// C5 Mark unavailable (range select + confirm)
const blockSheet = (t) => sheet(t, 'block', `${head(1)}<div style="margin:12px 16px 0;height:50px;border-radius:999px;background:var(--s1);border:1.5px solid var(--p);display:flex;align-items:center;justify-content:space-between;padding:0 6px;font-weight:600;font-size:14px"><span class="hb" style="width:38px;height:38px;background:var(--s2)">${P('x', 16)}</span>Pick last unavailable day<span class="pill pp" style="height:38px;font-size:13px">${P('check', 15, 'bold')}Done</span></div>${hero('Upcoming', 'Next 2 weeks', two)}`, `
  <div style="display:flex;align-items:center;gap:14px;padding:4px 22px 0">${ST('moon', 66, -8)}<div>${H1('Mark Oct 27 → Oct 28 unavailable?', 26, 'padding:0')}${meta('2 days', 'display:block;margin-top:6px')}</div></div>
  <div style="padding:16px 18px 0">${fld('Reason (optional)', 'Work trip')}</div>
  <div style="margin:10px 18px 0;border-radius:20px;background:var(--bg);padding:14px 16px" class="row2">${P('airplane-tilt', 22, 'fill', 'color:var(--pt)')}<div style="flex:1"><div style="font-weight:600;font-size:15px">Show friends I'm away</div><div class="hint" style="font-size:12.5px">They'll see your face on these days in their calendar.</div></div>${tog()}</div>
  <div style="padding:16px 18px 0;display:flex;flex-direction:column;gap:8px">${pill('pp', 'Confirm', 'check', 'height:54px;font-size:16px')}<div style="display:flex;gap:8px">${pill('po', 'Edit', 'pencil-simple', 'flex:1;height:46px')}${pill('', 'Cancel', '', 'flex:1;height:46px;color:var(--mute)')}</div></div>
`, { top: 410 });

// C6 Birthday card composer
const card = (t) => sheet(t, 'bdaycard', head(1), `
  ${H1('Send a birthday card', 32, 'padding:0 22px')}
  <div class="hint" style="padding:6px 22px 0">For Nina — she'll get a confetti reveal.</div>
  <div style="margin:16px 18px 0;height:300px;border-radius:28px;background:linear-gradient(150deg,#FF5FA8,#7C3BED);position:relative;overflow:hidden">
    <span class="abs" style="left:20px;top:22px">${ST('cake', 118, -10)}</span><span class="abs" style="right:28px;top:10px">${ST('balloon', 92, 10)}</span><span class="abs" style="right:110px;top:110px">${ST('spark', 44, 0)}</span>
    <div class="abs" style="left:18px;right:18px;bottom:18px;border-radius:18px;background:rgba(255,255,255,.2);backdrop-filter:blur(8px);padding:14px 16px;color:#fff"><div style="font-weight:700;font-size:20px">Happy birthday, Nina!</div><div style="font-style:italic;font-size:14.5px;margin-top:4px;opacity:.95">“27 looks good on you. Dinner's on us this Friday.”</div></div>
  </div>
  ${meta('Stickers', 'display:block;padding:16px 22px 8px')}
  <div style="display:flex;gap:8px;padding:0 18px;overflow:hidden">${['cake', 'balloon', 'gift', 'bottle', 'popper', 'plus1', 'heart', 'spark'].map((s, i) => `<div style="width:58px;height:58px;flex:none;border-radius:16px;background:${i < 2 ? 'color-mix(in srgb,var(--p) 22%,transparent)' : 'var(--bg)'};${i < 2 ? 'box-shadow:inset 0 0 0 2px var(--p);' : ''}display:flex;align-items:center;justify-content:center">${ST(s, 38, -4)}</div>`).join('')}</div>
  ${meta('Background', 'display:block;padding:16px 22px 8px')}
  <div style="display:flex;gap:10px;padding:0 18px;align-items:center">${['linear-gradient(150deg,#FF5FA8,#7C3BED)', 'linear-gradient(150deg,#FF9F1C,#F23D3D)', 'linear-gradient(150deg,#3B6CFF,#22D3EE)', 'linear-gradient(150deg,#3BD47E,#D8FF3D)', 'linear-gradient(150deg,#0B0B0A,#7C3BED)'].map((g, i) => `<span style="width:42px;height:42px;border-radius:50%;background:${g};${i == 0 ? 'box-shadow:0 0 0 3px var(--sheet),0 0 0 5px var(--p)' : ''}"></span>`).join('')}${pill('pg', 'Upload photo', 'image', 'height:42px;font-size:13px;margin-left:auto')}</div>
  <div style="padding:14px 18px 0">${seg(['None', 'Solid', 'Glass'], 2, 'background:var(--bg)')}</div>
  <div style="padding:12px 18px 0"><div class="fld" style="min-height:64px;justify-content:flex-start;padding-top:10px"><span class="k">Message (optional)</span><span style="font-size:14.5px;margin-top:3px">27 looks good on you. Dinner's on us this Friday.</span></div>${meta('49/200', 'display:block;text-align:right;margin-top:4px;font-size:10px')}</div>
  <div style="padding:8px 18px 0;display:flex;gap:10px">${pill('', 'Cancel', '', 'flex:1;height:52px;color:var(--mute)')}${pill('pp', 'Wait for the day', '', 'flex:2;height:52px;opacity:.6')}</div>
  <div class="hint" style="text-align:center;margin-top:8px;font-size:12px">You can send this card on Oct 30</div>
`, { top: 56, h: 990 });

window.CALKIT = { hero, two, legend, evRow, timeChip, right };
window.CAL = [['Week — Upcoming (with friends away)', week], ['Month — day selected', monthV], ['Day — timeline + empty day', dayV], ['Sync to my calendar', sync], ['Mark days unavailable', blockSheet], ['Birthday card', card]];
})();
