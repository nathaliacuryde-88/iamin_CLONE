// EVENT PAGE: one page of ticket sections (incl. live radar, the tab, bring list, message to the future) + sticker board
(() => {
const ticket = (inner, st = '') => `<section class="tk" style="${st}">${inner}</section>`;
const WORDS = [['hi there!', '#FFE14D'], ['hi Mark', '#FF5FA8'], ['same time next week', '#3B6CFF'], ['afters?', '#D8FF3D'], ['iconique', '#fff']];

const stickerLayer = (id) => (state.sticks[id] || []).map(([s, x, y, r], k) => s.startsWith('w:') ? `<span class="wtag ${k == (state.sticks[id].length - 1) && state.justStuck ? 'slap' : ''}" style="left:${x}px;top:${y}px;--r:${r}deg;transform:rotate(${r}deg);background:${(WORDS.find((w) => w[0] == s.slice(2)) || [0, '#fff'])[1]}">${s.slice(2)}</span>` : `<span class="hs" style="left:${x}px;top:${y}px">${SV(s, 62, r, k == (state.sticks[id].length - 1) && state.justStuck ? 'slap' : '')}</span>`).join('');

const radarInline = () => { const dots = [['jonas', 90, 150, '#3BD47E'], ['marie', 278, 128, '#3BD47E'], ['nina', 214, 236, '#3BD47E'], ['timo', 320, 214, '#FFB21F'], ['ben', 70, 232, '#FFB21F']];
  return `<div class="rdr"><svg viewBox="15 92 360 222" width="100%" aria-hidden="true">
    <defs><radialGradient id="cone" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#7C3BED" stop-opacity=".55"/><stop offset="1" stop-color="#7C3BED" stop-opacity="0"/></radialGradient>${dots.map((d, k) => `<clipPath id="rc${k}"><circle cx="${d[1]}" cy="${d[2] - 30}" r="15"/></clipPath>`).join('')}</defs>
    ${[170, 132, 96, 62, 32].map((rx, k) => `<ellipse cx="195" cy="200" rx="${rx}" ry="${rx * .5}" fill="none" stroke="${k ? '#2F2F2C' : '#7C3BED'}" stroke-width="${k ? 1.4 : 2}"/>`).join('')}
    ${Array.from({ length: 72 }, (_, k) => { const a = k * Math.PI / 36; const x1 = 195 + 170 * Math.cos(a), y1 = 200 + 85 * Math.sin(a), x2 = 195 + (k % 6 ? 160 : 150) * Math.cos(a), y2 = 200 + (k % 6 ? 80 : 75) * Math.sin(a); return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${k % 6 ? '#3a3a37' : '#B49BFF'}" stroke-width="${k % 6 ? 1 : 2}"/>`; }).join('')}
    ${[['N', 195, 108], ['E', 362, 204], ['S', 195, 300], ['W', 28, 204]].map((c) => `<text x="${c[1]}" y="${c[2]}" text-anchor="middle" font-family="JetBrains Mono" font-size="12" fill="#B49BFF">${c[0]}</text>`).join('')}
    <g style="transform-origin:195px 200px;animation:spin 6s linear infinite"><path d="M195 200 L150 120 A90 90 0 0 1 240 120 Z" fill="url(#cone)" transform="scale(1 .5) translate(0 200)"/></g>
    ${dots.map((d, k) => `<line x1="${d[1]}" y1="${d[2]}" x2="${d[1]}" y2="${d[2] - 14}" stroke="${d[3]}" stroke-width="2"/><circle cx="${d[1]}" cy="${d[2]}" r="4" fill="${d[3]}"/><circle cx="${d[1]}" cy="${d[2] - 30}" r="17" fill="#0B0B0A" stroke="${d[3]}" stroke-width="2"/>${d[0] == 'ben' ? `<circle cx="${d[1]}" cy="${d[2] - 30}" r="15" fill="#FF5FA8"/><text x="${d[1]}" y="${d[2] - 25}" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="14" fill="#0B0B0A">B</text>` : `<image href="${AV(d[0])}" x="${d[1] - 15}" y="${d[2] - 45}" width="30" height="30" clip-path="url(#rc${k})" preserveAspectRatio="xMidYMid slice"/>`}`).join('')}
   </svg><span class="rpin">${SV('pin', 36)}</span>
   <div class="rlab"><span class="dsp" style="font-size:22px">Jonas · 400 m NE</span><span class="row" style="gap:6px;justify-content:center;margin-top:6px;font-size:12px;font-weight:600"><span class="rchip" style="background:#fff;color:#0B0B0A">3 there</span><span class="rchip">2 on the way</span><span class="rchip">1 home</span></span></div></div>`; };

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
  ${ticket(`<div class="tkh" id="sec-radar">Live radar · on the night</div>${radarInline()}
     <div class="row" style="gap:6px;margin-top:12px">${[['MapPin', "I'm there", 1], ['Navigation', 'On the way'], ['Home', 'Still home']].map((b) => `<button class="rst ${b[2] ? 'on' : ''}" data-rstat>${I(b[0], 17)}${b[1]}</button>`).join('')}</div>
     <div style="font-size:12px;opacity:.65;text-align:center;margin-top:10px">Only friends going see you · you can leave anytime</div>`)}
  ${ticket(`<div class="tkh" id="sec-tab">The tab</div>
     <div class="row" style="justify-content:center;gap:6px;font-weight:600;font-size:14px">${I('ArrowDownLeft', 16, 2.4)}You're owed</div>
     <div class="dsp" style="font-size:64px;text-align:center;margin-top:4px">€18.00</div>
     <div class="row" style="gap:8px;margin-top:14px"><button class="pill tkb" style="flex:1;height:48px" data-sheet="expense" data-p='{"id":"${id}"}'>${I('Plus', 18, 2.6)}Add expense</button><button class="pill pp" style="flex:1;height:48px" data-toast="Opens PayPal / Revolut / N26 with your handle filled in.">Settle up</button></div>
     <div style="margin-top:16px"><div class="row" style="font-size:13.5px"><b style="flex:1">Table total</b><b>€126.00 · 9 people</b></div><div style="height:6px;border-radius:3px;background:rgba(127,127,127,.25);margin:8px 0 4px;overflow:hidden"><i style="display:block;width:57%;height:100%;background:#7C3BED;border-radius:3px"></i></div><div style="font-size:12.5px;opacity:.7">4 of 7 settled · your share €14.00</div></div>
     <div class="hr"></div>
     <div style="font:500 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;opacity:.65;margin-bottom:4px">Owe you · 3</div>
     ${[['jonas', 'Jonas', 'Drinks round · 01:20', '€12.00', 0], ['timo', 'Timo', 'Taxi home', '€6.00', 0], ['marie', 'Marie', 'Paid back · Revolut', '€14.00', 1]].map((r) => `<div class="row" style="padding:8px 0;border-top:1px dashed rgba(127,127,127,.35)"><img class="av" src="${AV(r[0])}" alt="" width="36" height="36"><div style="flex:1;min-width:0"><div style="font-weight:700;font-size:14.5px">${r[1]}</div><div style="font-size:12.5px;opacity:.7">${r[2]}</div></div><b style="${r[4] ? 'opacity:.5;text-decoration:line-through' : ''}">${r[3]}</b>${r[4] ? `<span style="color:#1FA35C">${I('CheckCircle2', 20, 2.4)}</span>` : `<button class="fol" style="height:30px" data-toast="Reminder sent with your PayPal link">Remind</button>`}</div>`).join('')}
     <div class="pact" style="margin-top:10px"><img class="av" src="${AV('nina')}" alt="" width="40" height="40"><div style="flex:1"><div style="font-weight:700">You owe Nina €4.00</div><div style="font-size:12.5px;opacity:.75">Entry · she paid for 2</div></div></div>
     <div class="row" style="gap:6px;margin-top:8px">${['PayPal', 'Revolut', 'N26'].map((x) => `<button class="pill tkb" style="flex:1;height:38px;font-size:13px" data-toast="Opens ${x} with @nina.o">${x}</button>`).join('')}</div>
     <button class="rm" data-toast="Full history of the tab (same as today).">${I('History', 13)} History</button>`)}
  ${ticket(`<div class="tkh" id="sec-bring">Bring what?</div>
     ${[['Speaker', 'jonas', 1], ['Ice', '', 0], ['Cups', 'marie', 1]].map((b) => `<div class="row" style="padding:9px 0;border-top:1px dashed rgba(127,127,127,.35)">${I(b[2] ? 'SquareCheck' : 'Square', 22, 2, b[2] ? 'color:#7C3BED' : 'opacity:.5')}<span style="flex:1;font-weight:600;${b[2] ? '' : ''}">${b[0]}</span>${b[1] ? `<img class="av" src="${AV(b[1])}" alt="" width="26" height="26"><span style="font-size:12.5px;opacity:.7">${F[b[1]].split(' ')[0]}</span>` : `<button class="pill pp" style="height:32px;font-size:12.5px;padding:0 12px" data-bring>I'll bring it</button>`}</div>`).join('')}
     <button class="row" style="padding:10px 0 0;border-top:1px dashed rgba(127,127,127,.35);width:100%;font-weight:700;font-size:13.5px;color:#7C3BED" data-toast="Add an item (same as today).">${I('Plus', 18, 2.6)}Add item</button>`)}
  ${ticket(`<div class="tkh" id="sec-future">Message to the future</div>
     <div class="row" style="gap:12px">${SV('crystal', 56, -6)}<div style="flex:1"><div style="font-weight:700">Seal a prediction</div><div style="font-size:12.5px;opacity:.75">3 sealed · everyone reads them when the capsule opens, Sun 10:12</div></div></div>
     <div class="fut"><textarea id="futin" rows="2" maxlength="500" placeholder="Calling it now — we close the place down."></textarea></div>
     <div class="row" style="margin-top:8px"><span class="meta" style="flex:1;color:inherit;opacity:.6" id="futn">0 / 500</span><button class="pill pp" style="height:42px" data-seal>${I('Lock', 16)}Seal it</button></div>`)}
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
  .rdr{position:relative;margin:0 -8px;border-radius:20px;background:#0B0B0A;color:#F4F3EE;padding:10px 6px 14px;overflow:hidden}
  .rdr svg{display:block}
  .rpin{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%)}
  .rlab{text-align:center;margin-top:4px}
  .rchip{height:26px;padding:0 10px;border-radius:999px;background:#242422;display:inline-flex;align-items:center}
  .rst{flex:1;height:52px;border-radius:16px;background:rgba(127,127,127,.16);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px;font-weight:700;color:inherit}
  .rst.on{background:#7C3BED;color:#fff}
  .tkb{background:rgba(127,127,127,.16);color:inherit}
  .fut{margin-top:12px;border-radius:16px;background:rgba(127,127,127,.12);padding:12px 14px}
  .fut textarea{width:100%;border:0;background:transparent;font:600 15.5px var(--ui);color:inherit;resize:none;outline:none}
  .fut textarea::placeholder{color:inherit;opacity:.45}
  .rm .ic{vertical-align:-2px}
  .tbar{position:absolute;left:10px;right:10px;bottom:calc(14px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:8px;padding:14px 12px 12px 18px;background:var(--cream);color:var(--creamInk);border-radius:20px;box-shadow:0 14px 36px rgba(0,0,0,.3);z-index:40;-webkit-mask:linear-gradient(#000,#000) 0 8px/100% calc(100% - 8px) no-repeat,conic-gradient(from -45deg at 50% 8px,#000 90deg,transparent 0) 0 0/16px 8px repeat-x;mask:linear-gradient(#000,#000) 0 8px/100% calc(100% - 8px) no-repeat,conic-gradient(from -45deg at 50% 8px,#000 90deg,transparent 0) 0 0/16px 8px repeat-x}
  .tbar .pg{background:rgba(127,127,127,.18);color:inherit}
  </style>`; },
  mount: (el, p) => { const id = p.id || 'razzia'; state.justStuck = false;
    if (p.to) { const t = el.querySelector('#sec-' + p.to); const sc = el.querySelector('.scroll'); if (t && sc) sc.scrollTop = t.closest('.tk').offsetTop - 60; }
    const fin = el.querySelector('#futin'); fin.addEventListener('input', () => { el.querySelector('#futn').textContent = fin.value.length + ' / 500'; });
    el.addEventListener('click', (e) => {
      const rs = e.target.closest('[data-rstat]'); if (rs) { el.querySelectorAll('[data-rstat]').forEach((x) => x.classList.toggle('on', x === rs)); return; }
      const br = e.target.closest('[data-bring]'); if (br) { br.outerHTML = `<img class="av" src="${AV('nina')}" alt="" width="26" height="26"><span style="font-size:12.5px;opacity:.7">You</span>`; toast("You're bringing ice"); return; }
      if (e.target.closest('[data-seal]')) { if (!fin.value.trim()) fin.value = fin.placeholder; fin.disabled = true; fin.style.filter = 'blur(4px)'; toast('Sealed until the morning after'); return; }
      const b = e.target.closest('[data-ersvp]'); if (!b) return; const v = b.dataset.ersvp; state.rsvp[id] = state.rsvp[id] == v ? null : v; const sc = el.querySelector('.scroll').scrollTop; go('event', { id }); document.querySelector('#scr .scroll').scrollTop = sc; if (state.rsvp[id] == 'in') toast("You're in — friends will see it."); });
  } };

/* ---------- Sticker board ---------- */
SHEETS.stick = { label: 'Stick something (sticker board)', section: 'Event', base: 'event', tag: 'new', demo: { id: 'razzia' }, render: () => `
  <div class="dsp" style="font-size:34px">Stick something</div><div class="mute" style="font-size:14px;margin-top:6px">Friends going see what you stick on the flyer. Tap to place it.</div>
  <div class="flab" style="margin:16px 0 8px">Stickers</div>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">${['in', 'flame', 'heart', 'popper', 'disco', 'spritz', 'eyes', 'skull', 'crown', 'spark', 'moon', 'cam', 'burst', 'hey', 'plus1'].map((s) => `<button data-st="${s}" style="height:64px;border-radius:16px;background:var(--bg);display:flex;align-items:center;justify-content:center">${SV(s, 42, -4)}</button>`).join('')}</div>
  <div class="flab" style="margin:16px 0 8px">Words</div>
  <div style="display:flex;flex-wrap:wrap;gap:10px">${WORDS.map((w, k) => `<button data-st="w:${w[0]}" class="wtag" style="position:static;background:${w[1]};transform:rotate(${[-4, 3, -2, 5, -3][k]}deg)">${w[0]}</button>`).join('')}</div>`,
  mount: (w, p) => { w.addEventListener('click', (e) => { const b = e.target.closest('[data-st]'); if (!b) return; const id = (p && p.id) || state.params.id || 'razzia'; const L = state.sticks[id] = state.sticks[id] || []; L.push([b.dataset.st, 30 + Math.round(Math.random() * 230), 90 + Math.round(Math.random() * 230), Math.round(Math.random() * 24 - 12)]); state.justStuck = true; closeSheet(); go('event', { id }); state.justStuck = false; toast('Stuck — friends going can see it'); }); } };

})();
