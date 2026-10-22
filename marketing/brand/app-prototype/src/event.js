// EVENT PAGE (ticket sections) + sticker board + live radar (compass)
(() => {
const ticket = (inner, st = '') => `<section class="tk" style="${st}">${inner}</section>`;
const WORDS = [['hi there!', '#FFE14D'], ['hi Mark', '#FF5FA8'], ['same time next week', '#3B6CFF'], ['afters?', '#D8FF3D'], ['iconique', '#fff']];

const stickerLayer = (id) => (state.sticks[id] || []).map(([s, x, y, r], k) => s.startsWith('w:') ? `<span class="wtag ${k == (state.sticks[id].length - 1) && state.justStuck ? 'slap' : ''}" style="left:${x}px;top:${y}px;--r:${r}deg;transform:rotate(${r}deg);background:${(WORDS.find((w) => w[0] == s.slice(2)) || [0, '#fff'])[1]}">${s.slice(2)}</span>` : `<span class="hs" style="left:${x}px;top:${y}px">${SV(s, 62, r, k == (state.sticks[id].length - 1) && state.justStuck ? 'slap' : '')}</span>`).join('');

SCREENS.event = { label: 'Event page', section: 'Event', tag: 'upd', demo: { id: 'razzia' }, render: (p) => { const id = p.id || 'razzia'; const e = EV[id]; const r = state.rsvp[id];
  return `<div class="scroll" style="padding-bottom:140px">
  <div class="hero"><img src="${A(e.img)}" alt="">${stickerLayer(id)}
    <div class="htop">${statusBar(1)}<div class="row" style="padding:0 14px"><button class="icb glassb" data-go="feed" aria-label="Back">${I('ChevronLeft', 20, 2.4)}</button><span class="sp"></span><button class="icb glassb" data-sheet="stick" data-p='{"id":"${id}"}' aria-label="Add a sticker">${I('Smile', 20)}</button><button class="icb glassb" data-toast="Share sheet opens (same as today)." aria-label="Share">${I('Share2', 19)}</button><button class="icb glassb" data-toast="More: edit, duplicate, delete (same as today)." aria-label="More">${I('MoreHorizontal', 20)}</button></div></div>
    <button class="stickbtn" data-sheet="stick" data-p='{"id":"${id}"}'>${I('Plus', 15, 2.6)}Stick something</button>
  </div>
  ${ticket(`<div class="meta" style="color:inherit;opacity:.7;text-align:center">${e.long} · ${e.time} · ${e.venue}</div><h1 class="dsp" style="font-size:40px;text-align:center;margin:10px 0 0">${e.name}</h1><div class="row" style="justify-content:center;margin-top:14px;gap:6px"><span class="chipk">${I(e.vis == 'Public' ? 'Eye' : 'Users', 13, 2.4)}${e.vis}</span><span class="chipk">${SV(e.vibe, 22)}${({ disco: 'club', pizza: 'dinner', palette: 'art', tent: 'festival', popper: 'party', vinyl: 'music' })[e.vibe]}</span>${r == 'in' ? `<span class="chipk" style="background:#7C3BED;color:#fff;border:0">${I('Check', 13, 2.8)}You're in</span>` : ''}</div>`, 'margin-top:-34px;position:relative;z-index:2')}
  ${ticket(`<div class="tkh">About the event</div><p class="ab">Four years of Razzia. Keryda live at midnight, then DJ Afropunk and Gabbanalli until late. Dress loud, arrive early, the line gets long after 1.</p><button class="rm">Read more</button><div class="hr"></div><div class="row"><img class="av" src="${AV('marie')}" alt="" width="40" height="40"><div style="flex:1"><div style="font-weight:700">Marie Klein</div><div style="font-size:12.5px;opacity:.7">Host · added from a screenshot</div></div><button class="fol">Follow +</button></div>`)}
  ${ticket(`<div class="tkh">Who's in</div><div class="row" style="justify-content:space-between"><div class="avs">${[...e.going, 'nina'].map((a) => `<img class="av" src="${AV(a)}" alt="" width="44" height="44" style="border-color:var(--cream)">`).join('')}<span class="plusb">+${e.extra}</span></div><div style="text-align:right"><div class="dsp" style="font-size:34px">${e.count}</div><div style="font-size:12px;opacity:.7">going · 3 maybe</div></div></div>
     <div class="pact">${SV('seal', 44, -8)}<div style="flex:1"><div style="font-weight:700">“I'll go if you go.”</div><div style="font-size:12.5px;opacity:.75">Pact · Jonas · 2 of 3 in</div></div><button class="pill pp" style="height:34px;font-size:13px;padding:0 14px" data-toast="Pact joined">Join</button></div>
     <div class="row" style="gap:6px;margin-top:12px;flex-wrap:wrap">${reactPills(id, 1)}<button class="react" data-sheet="stick" data-p='{"id":"${id}"}' style="padding:0 12px">${I('Plus', 16, 2.6)}</button></div>`)}
  ${ticket(`<div class="tkh">Where</div><div style="font-weight:700;font-size:17px">${e.venue}</div><div style="font-size:13px;opacity:.7;margin-top:2px">Tübinger Str. 22 · ${e.area}, Stuttgart</div>
     <div class="map"><svg viewBox="0 0 320 140" width="100%" height="140" aria-hidden="true"><rect width="320" height="140" fill="#E9E3D2"/><path d="M0 92 C80 80 120 120 200 98 S300 70 320 76" stroke="#BFD7EA" stroke-width="14" fill="none"/><path d="M40 0 L70 140 M150 0 L132 140 M0 40 L320 30 M230 0 L260 140" stroke="#fff" stroke-width="7"/><path d="M0 120 L320 112" stroke="#fff" stroke-width="5"/></svg><span class="mpin">${SV('pin', 40)}</span><button class="mbtn" data-toast="Opens Maps">${I('Navigation', 14, 2.4)}Directions</button></div>
     <div class="row" style="gap:6px;margin-top:10px">${['f3.jpg', 'p01.jpg', 'f4.jpg'].map((f) => `<img src="${A(f)}" alt="" style="flex:1;height:84px;min-width:0;object-fit:cover;border-radius:12px">`).join('')}</div>`)}
  ${e.lineup ? ticket(`<div class="tkh">Line-up</div>${e.lineup.map((n, k) => `<div class="row" style="padding:8px 0;${k ? 'border-top:1px dashed rgba(0,0,0,.18)' : ''}"><span style="width:38px;height:38px;border-radius:50%;background:#17140F;color:#F6F1E4;display:flex;align-items:center;justify-content:center">${I('Music', 17)}</span><div style="flex:1"><div style="font-weight:700">${n}</div><div style="font-size:12px;opacity:.7">${['00:00', '01:30', '03:00'][k]}</div></div><button class="fol">Follow +</button></div>`).join('')}`) : ''}
  ${ticket(`<div class="tkh">On the night</div>
     <button class="nrow" data-go="radar" data-p='{"id":"${id}"}'><span class="nic" style="background:#0B0B0A;color:#D8FF3D">${I('Compass', 20)}</span><span style="flex:1;text-align:left"><b>Live radar</b><br><span style="font-size:12.5px;opacity:.7">3 there · 2 on the way</span></span>${I('ChevronRight', 18)}</button>
     <button class="nrow" data-go="tab" data-p='{"id":"${id}"}'><span class="nic" style="background:#7C3BED;color:#fff">${I('Euro', 20)}</span><span style="flex:1;text-align:left"><b>The tab</b><br><span style="font-size:12.5px;opacity:.7">€126 so far · your share €14</span></span>${I('ChevronRight', 18)}</button>
     <button class="nrow" data-toast="Bring list (same as today)."><span class="nic" style="background:#FFE14D;color:#17140F">${I('Package', 20)}</span><span style="flex:1;text-align:left"><b>Bring what?</b><br><span style="font-size:12.5px;opacity:.7">Speaker · Ice · Cups — 1 open</span></span>${I('ChevronRight', 18)}</button>
     <button class="nrow" data-go="capsule"><span class="nic" style="background:#F6F1E4;border:1.5px solid #17140F">${SV('crystal', 26)}</span><span style="flex:1;text-align:left"><b>Message to the future</b><br><span style="font-size:12.5px;opacity:.7">Seal a prediction before the night</span></span>${I('ChevronRight', 18)}</button>`)}
  ${ticket(`<div class="tkh">Next from Romantica</div><div class="row" style="gap:12px"><img src="${A('fl_midnight.jpg')}" alt="" style="width:76px;height:96px;object-fit:cover;border-radius:12px"><div style="flex:1"><div style="font-weight:700">Midnight Service</div><div style="font-size:12.5px;opacity:.75;margin-top:4px">Sat 31 Oct · Trude<br>From €12</div><button class="rm" style="margin-top:6px">Details</button></div></div>`)}
  </div>
  <div class="tbar"><div><div class="dsp" style="font-size:28px">${e.price || 'Free'}</div><div style="font-size:11.5px;opacity:.7">${e.price ? 'Card checkout · auto-RSVP' : e.count + ' going · 3 maybe'}</div></div><span class="sp"></span>
    <button class="pill ${r == 'maybe' ? 'ppt' : 'pg'}" data-ersvp="maybe" style="height:50px;padding:0 16px">${I('HelpCircle', 18)}Maybe</button><button class="pill pp" data-ersvp="in" style="height:50px;padding:0 18px">${I('Check', 18, 2.6)}${r == 'in' ? "You're in" : e.price ? 'Buy & in' : "I'm in"}</button></div>
  <style>
  .hero{position:relative;height:430px;background:#000;overflow:hidden}
  .hero>img{width:100%;height:100%;object-fit:cover;display:block}
  .htop{position:absolute;left:0;right:0;top:0;background:linear-gradient(rgba(0,0,0,.45),transparent);color:#fff}
  .glassb{background:rgba(0,0,0,.4);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;margin-left:6px}
  .stickbtn{position:absolute;right:14px;bottom:48px;height:34px;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.9);color:#0B0B0A;font-weight:700;font-size:12.5px;display:flex;align-items:center;gap:5px}
  .hs{position:absolute}
  .wtag{position:absolute;font:20px var(--dsp);text-transform:uppercase;padding:6px 10px 5px;border:3px solid #fff;border-radius:8px;color:#0B0B0A;box-shadow:0 3px 8px rgba(0,0,0,.3);white-space:nowrap}
  .tk{position:relative;margin:10px 12px 0;background:var(--cream);color:var(--creamInk);border-radius:22px;padding:20px 20px 18px;-webkit-mask:radial-gradient(circle 11px at 0 50%,transparent 10px,#000 11px) left/51% 100% no-repeat,radial-gradient(circle 11px at 100% 50%,transparent 10px,#000 11px) right/51% 100% no-repeat;mask:radial-gradient(circle 11px at 0 50%,transparent 10px,#000 11px) left/51% 100% no-repeat,radial-gradient(circle 11px at 100% 50%,transparent 10px,#000 11px) right/51% 100% no-repeat}
  .tkh{font:500 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;opacity:.65;text-align:center;margin-bottom:12px}
  .ab{margin:0;font-size:16.5px;line-height:1.45;font-weight:500;text-align:center;text-wrap:pretty}
  .rm{display:block;margin:10px auto 0;font:700 12px var(--ui);text-transform:uppercase;letter-spacing:.04em;text-decoration:underline;text-underline-offset:3px}
  .hr{border-top:1.5px dashed currentColor;opacity:.25;margin:16px -4px}
  .fol{height:32px;padding:0 12px;border-radius:999px;border:1.5px solid currentColor;font:700 12px var(--ui);text-transform:uppercase}
  .chipk{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 11px 0 8px;border-radius:999px;border:1.5px solid currentColor;font-size:12.5px;font-weight:600}
  .plusb{height:44px;min-width:44px;border-radius:22px;background:#7C3BED;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;margin-left:-8px;border:2px solid var(--cream)}
  .pact{display:flex;align-items:center;gap:12px;margin-top:14px;padding:12px 14px;border-radius:18px;background:rgba(124,59,237,.12)}
  .map{position:relative;margin-top:12px;border-radius:16px;overflow:hidden}
  .mpin{position:absolute;left:50%;top:22px;margin-left:-20px}
  .mbtn{position:absolute;right:8px;bottom:8px;height:30px;padding:0 11px;border-radius:999px;background:#17140F;color:#F6F1E4;font-size:12px;font-weight:700;display:flex;align-items:center;gap:5px}
  .nrow{display:flex;align-items:center;gap:12px;width:100%;padding:10px 0;border-top:1px dashed rgba(127,127,127,.35);font-size:14.5px;color:inherit}
  .nrow:first-of-type{border-top:0}
  .nic{width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex:none}
  .tbar{position:absolute;left:10px;right:10px;bottom:calc(14px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:8px;padding:14px 12px 12px 18px;background:var(--cream);color:var(--creamInk);border-radius:20px;box-shadow:0 14px 36px rgba(0,0,0,.3);z-index:40;-webkit-mask:linear-gradient(#000,#000) 0 8px/100% calc(100% - 8px) no-repeat,conic-gradient(from -45deg at 50% 8px,#000 90deg,transparent 0) 0 0/16px 8px repeat-x;mask:linear-gradient(#000,#000) 0 8px/100% calc(100% - 8px) no-repeat,conic-gradient(from -45deg at 50% 8px,#000 90deg,transparent 0) 0 0/16px 8px repeat-x}
  .tbar .pg{background:rgba(127,127,127,.18);color:inherit}
  </style>`; },
  mount: (el, p) => { const id = p.id || 'razzia'; state.justStuck = false;
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-ersvp]'); if (!b) return; const v = b.dataset.ersvp; state.rsvp[id] = state.rsvp[id] == v ? null : v; go('event', { id }); if (state.rsvp[id] == 'in') toast("You're in — friends will see it."); });
  } };

/* ---------- Sticker board ---------- */
SHEETS.stick = { label: 'Stick something (sticker board)', section: 'Event', base: 'event', tag: 'new', demo: { id: 'razzia' }, render: () => `
  <div class="dsp" style="font-size:34px">Stick something</div><div class="mute" style="font-size:14px;margin-top:6px">Friends going see what you stick on the flyer. Tap to place it.</div>
  <div class="flab" style="margin:16px 0 8px">Stickers</div>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">${['in', 'flame', 'heart', 'popper', 'disco', 'spritz', 'eyes', 'skull', 'crown', 'spark', 'moon', 'cam', 'burst', 'hey', 'plus1'].map((s) => `<button data-st="${s}" style="height:64px;border-radius:16px;background:var(--bg);display:flex;align-items:center;justify-content:center">${SV(s, 42, -4)}</button>`).join('')}</div>
  <div class="flab" style="margin:16px 0 8px">Words</div>
  <div style="display:flex;flex-wrap:wrap;gap:10px">${WORDS.map((w, k) => `<button data-st="w:${w[0]}" class="wtag" style="position:static;background:${w[1]};transform:rotate(${[-4, 3, -2, 5, -3][k]}deg)">${w[0]}</button>`).join('')}</div>`,
  mount: (w, p) => { w.addEventListener('click', (e) => { const b = e.target.closest('[data-st]'); if (!b) return; const id = (p && p.id) || state.params.id || 'razzia'; const L = state.sticks[id] = state.sticks[id] || []; L.push([b.dataset.st, 30 + Math.round(Math.random() * 230), 90 + Math.round(Math.random() * 230), Math.round(Math.random() * 24 - 12)]); state.justStuck = true; closeSheet(); go('event', { id }); state.justStuck = false; toast('Stuck — friends going can see it'); }); } };

/* ---------- Live radar (compass) ---------- */
SCREENS.radar = { label: 'Live radar — compass', section: 'Event', tag: 'upd', demo: { id: 'razzia' }, render: (p) => { const e = EV[p.id || 'razzia'];
  const dots = [['jonas', 70, 150, 'there', '#3BD47E'], ['marie', 248, 128, 'there', '#3BD47E'], ['nina', 196, 238, 'there', '#3BD47E'], ['timo', 300, 210, 'way', '#FFB21F'], ['ben', 56, 232, 'way', '#FFB21F']];
  return `<div style="position:absolute;inset:0;background:#0B0B0A;color:#F4F3EE;display:flex;flex-direction:column">
  ${statusBar(1)}<div class="row" style="padding:0 14px"><button class="icb" style="background:#242422" data-go="event" data-p='{"id":"${p.id || 'razzia'}"}' aria-label="Back">${I('ChevronLeft', 20, 2.4)}</button><span class="sp"></span><span class="meta" style="color:#8F8E88">Live radar · ${e.short}</span><span class="sp"></span><button class="icb" style="background:#242422" data-toast="Only friends going see this. You can leave the radar anytime.">${I('Info', 20)}</button></div>
  <div style="position:relative;height:400px;margin-top:6px">
   <svg viewBox="0 0 390 400" width="390" height="400" style="position:absolute;left:50%;margin-left:-195px" aria-hidden="true">
    <defs><radialGradient id="cone" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#7C3BED" stop-opacity=".55"/><stop offset="1" stop-color="#7C3BED" stop-opacity="0"/></radialGradient></defs>
    ${[170, 132, 96, 62, 32].map((rx, k) => `<ellipse cx="195" cy="200" rx="${rx}" ry="${rx * .5}" fill="none" stroke="${k ? '#2F2F2C' : '#7C3BED'}" stroke-width="${k ? 1.4 : 2}"/>`).join('')}
    ${Array.from({ length: 72 }, (_, k) => { const a = k * Math.PI / 36; const x1 = 195 + 170 * Math.cos(a), y1 = 200 + 85 * Math.sin(a), x2 = 195 + (k % 6 ? 160 : 150) * Math.cos(a), y2 = 200 + (k % 6 ? 80 : 75) * Math.sin(a); return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${k % 6 ? '#3a3a37' : '#B49BFF'}" stroke-width="${k % 6 ? 1 : 2}"/>`; }).join('')}
    ${[['N', 195, 106], ['E', 375, 204], ['S', 195, 300], ['W', 15, 204]].map((c) => `<text x="${c[1]}" y="${c[2]}" text-anchor="middle" font-family="JetBrains Mono" font-size="12" fill="#B49BFF">${c[0]}</text>`).join('')}
    <g style="transform-origin:195px 200px;animation:spin 6s linear infinite"><path d="M195 200 L150 120 A90 90 0 0 1 240 120 Z" fill="url(#cone)" transform="scale(1 .5) translate(0 200)"/></g>
    <line x1="195" y1="200" x2="195" y2="120" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
   </svg>
   <span style="position:absolute;left:50%;top:166px;margin-left:-22px">${SV('pin', 44)}</span>
   ${dots.map((d, k) => `<span class="rdot pop" style="left:${d[1]}px;top:${d[2]}px;animation-delay:${200 + k * 120}ms"><span style="position:absolute;left:50%;bottom:6px;width:2px;height:${30 - (d[2] - 120) / 8}px;margin-left:-1px;background:${d[4]}"></span>${d[0] == 'ben' ? `<span class="rav" style="background:#FF5FA8;color:#0B0B0A">B</span>` : `<img class="rav" src="${AV(d[0])}" alt="">`}<i style="background:${d[4]}"></i></span>`).join('')}
  </div>
  <div style="text-align:center;margin-top:-10px"><div class="dsp" style="font-size:34px">Jonas · 400 m NE</div><div class="row" style="justify-content:center;gap:8px;margin-top:12px"><span class="pill" style="height:34px;background:#fff;color:#0B0B0A;font-size:13.5px">${I('MapPin', 15, 2.4)}3 there</span><span class="pill" style="height:34px;background:#242422;font-size:13.5px">${I('Footprints', 15)}2 on the way</span><span class="pill" style="height:34px;background:#242422;font-size:13.5px">1 home</span></div></div>
  <div class="row" style="gap:8px;padding:22px 14px 0">${[['MapPin', "I'm there", 1], ['Navigation', 'On the way'], ['Home' in LUCIDE ? 'Home' : 'Moon', 'Still home']].map((b) => `<button class="pill" data-rstat style="flex:1;height:54px;flex-direction:column;gap:2px;font-size:12.5px;border-radius:18px;${b[2] ? 'background:#7C3BED;color:#fff' : 'background:#242422;color:#F4F3EE'}">${I(b[0], 18)}${b[1]}</button>`).join('')}</div>
  <div class="mute" style="text-align:center;font-size:12px;margin-top:12px;color:#8F8E88">Shows on the inner ring · only friends going see you</div>
  <style>.rdot{position:absolute;transform:translate(-50%,-100%)}.rav{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;object-fit:cover;border:2.5px solid #0B0B0A;box-shadow:0 0 0 2px currentColor;font-weight:700;position:relative;top:-34px}.rdot i{position:absolute;left:50%;bottom:-4px;width:9px;height:9px;margin-left:-4.5px;border-radius:50%}</style>
  </div>`; },
  mount: (el) => { el.addEventListener('click', (e) => { const b = e.target.closest('[data-rstat]'); if (!b) return; el.querySelectorAll('[data-rstat]').forEach((x) => { const on = x === b; x.style.background = on ? '#7C3BED' : '#242422'; x.style.color = on ? '#fff' : '#F4F3EE'; }); }); } };
})();
