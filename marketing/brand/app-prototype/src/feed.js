// FEED + filter (vibe mixer board) + roulette + note + notifications
(() => {
const filt = { vibes: ['vinyl', 'disco'], pos: { vinyl: [24, 22], disco: [190, 60] }, friends: 2, dates: [1, 2], city: 'Stuttgart' };
const VIBES = [['vinyl', 'music'], ['popper', 'party'], ['disco', 'club'], ['tent', 'festival'], ['cake', 'birthday'], ['palette', 'art'], ['pizza', 'food'], ['croissant', 'brunch'], ['popcorn', 'cinema'], ['ball', 'sports'], ['tote', 'markets']];
const DATES = ['Tonight', 'Fri 23', 'Sat 24', 'Sun 25', 'Next week'];
const filterCount = () => filt.vibes.length + (filt.friends ? 1 : 0) + (filt.dates.length ? 1 : 0);

const bubble = (img, name, note, stk, opts = {}) => `<button class="tb" ${opts.mine ? 'data-sheet="note"' : `data-go="me" data-p='{"tab":"friends"}'`}>
  <span class="tbav">${opts.mine ? `<span class="av" style="width:64px;height:64px;background:var(--s2);border:2px dashed var(--line2);display:flex;align-items:center;justify-content:center;color:var(--pt)">${I('Plus', 22, 2.6)}</span>` : `<img class="av" src="${AV(img)}" alt="" width="64" height="64" style="border:2.5px solid var(--p);padding:2px;background:var(--bg)">`}${stk ? `<span class="tbst">${SV(stk, 32, -8)}</span>` : ''}</span>
  <span class="tbn">${name}</span><span class="tbs ${opts.mine ? 'mine' : ''}">${note}</span>
</button>`;

const card = (id) => { const e = EV[id]; const r = state.rsvp[id];
  return `<article class="fc" data-ev="${id}">
  <div class="fct"><span class="tt" style="font-size:16px">${e.name}</span><span class="meta" style="font-size:11.5px">${e.date}</span></div>
  <div class="fcc"><img src="${A(e.img)}" alt="">
    <span class="vis">${I(e.vis == 'Public' ? 'Users' : e.vis == 'Private' ? 'Lock' : 'Users', 12, 2.4)}${e.vis}</span>
    <span class="loc">${I('MapPin', 14, 2.2)}${e.venue}</span>
    <span class="rx">${(e.react || []).map(([s, n]) => `<span class="react" style="height:30px;padding-right:10px">${SV(s, 24)}${n}</span>`).join('')}</span>
  </div>
  <div class="fcf"><span class="avs">${e.going.map((a) => `<img class="av" src="${AV(a)}" alt="" width="26" height="26">`).join('')}</span><span class="plusn">+${e.extra}</span><span class="meta" style="margin-left:6px">${e.count}</span><span class="sp"></span>
    <button class="pill ${r == 'maybe' ? 'ppt' : 'pg'}" data-rsvp="${id}|maybe" style="height:38px;padding:0 14px;font-size:13.5px">${I('HelpCircle', 16)}Maybe</button>
    <button class="pill ${r == 'in' ? 'pp' : 'pg'}" data-rsvp="${id}|in" style="height:38px;padding:0 14px;font-size:13.5px">${I('Check', 16, 2.6)}I'm in</button></div>
</article>`; };

SCREENS.feed = { label: 'Feed', section: 'Feed', tag: 'upd', nav: 'feed', render: (p) => `${statusBar()}${header()}
  <div class="row" style="padding:2px 12px 0 20px;gap:20px;font-weight:600;font-size:15px;flex:none">
    <button data-tab="ic" style="position:relative">Inner Circle<i class="tdot"></i></button><button data-tab="cp" class="mute">City Pulse</button><span class="sp"></span>
    <button class="icb" data-sheet="roulette" aria-label="Roulette">${I('Dices', 20)}</button><button class="icb" data-go="filter" aria-label="Filter">${I('SlidersHorizontal', 20)}${filterCount() ? `<span class="badge">${filterCount()}</span>` : ''}</button>
  </div>
  <div class="today">
    <span class="tlab">Today</span>
    ${bubble('', 'Your note', `${I('Lock', 11, 2.4)}Location off`, '', { mine: 1 })}
    ${bubble('jonas', 'Jonas', 'pre-drinks at mine', 'spritz')}
    ${bubble('marie', 'Marie', 'ISO 2 tickets for Razzia!', 'hey')}
    ${bubble('timo', 'Timo', 'out out, Westend', 'disco')}
    ${bubble('nina', 'Nina', 'couch & films', 'couch')}
  </div>
  <div class="deck" id="deck">${FEED.map(card).join('')}</div>
  ${nav('feed')}
  <style>
  .tdot{position:absolute;left:50%;bottom:-8px;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:var(--p)}
  .today{display:flex;gap:4px;overflow-x:auto;padding:12px 16px 8px 18px;flex:none;scrollbar-width:none;align-items:flex-end}
  .today::-webkit-scrollbar{display:none}
  .tlab{font-weight:600;font-size:13px;color:var(--mute);writing-mode:vertical-rl;transform:rotate(180deg);align-self:center;margin-right:4px}
  .tb{display:flex;flex-direction:column;align-items:center;flex:none;text-align:center;width:80px}
  .tbav{position:relative;display:block}
  .tbst{position:absolute;right:-12px;bottom:-10px}
  .tbn{font-weight:600;font-size:12.5px;margin-top:8px}
  .tbs{display:block;max-width:78px;font-size:10.5px;color:var(--mute);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tbs.mine{display:flex;align-items:center;gap:3px;font-weight:600;color:#F0524F}
  .deck{flex:1;min-height:0;overflow-y:auto;scroll-snap-type:y mandatory;scrollbar-width:none;padding:8px 0 150px;position:relative}
  .deck::-webkit-scrollbar{display:none}
  .fc{scroll-snap-align:center;margin:0 14px -64px;background:var(--s1);border:1px solid var(--line);border-radius:26px;position:relative;transform-origin:50% 50%;transition:transform .15s linear,filter .15s linear;box-shadow:0 18px 40px rgba(0,0,0,.18);cursor:pointer}
  .fct{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 18px 11px}
  .fcc{margin:0 10px;height:300px;border-radius:18px;overflow:hidden;position:relative;background:#000}
  .fcc>img{width:100%;height:100%;object-fit:cover;display:block}
  .vis{position:absolute;left:10px;top:10px;height:24px;border-radius:999px;padding:0 9px;display:flex;align-items:center;gap:5px;background:var(--p);color:#fff;font:500 10px var(--mono);text-transform:uppercase;letter-spacing:.03em}
  .loc{position:absolute;left:10px;bottom:10px;height:28px;border-radius:999px;padding:0 11px 0 8px;display:flex;align-items:center;gap:4px;background:rgba(0,0,0,.6);color:#fff;font-size:12px;font-weight:500}
  .rx{position:absolute;right:8px;bottom:8px;display:flex;gap:5px}
  .rx .react{background:rgba(255,255,255,.92);color:#0B0B0A;border:0}
  .fcf{display:flex;align-items:center;gap:6px;padding:11px 12px 13px 16px}
  .plusn{height:26px;min-width:26px;border-radius:13px;background:var(--p);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 5px;margin-left:-8px;border:2px solid var(--s1)}
  </style>`,
  mount: (el) => {
    const deck = el.querySelector('#deck');
    const paint = () => { const mid = deck.scrollTop + deck.clientHeight / 2 - 40; deck.querySelectorAll('.fc').forEach((c) => { const cm = c.offsetTop + c.offsetHeight / 2; const d = Math.max(-1.5, Math.min(1.5, (cm - mid) / (c.offsetHeight * .9))); const a = Math.abs(d); c.style.transform = `scale(${1 - .1 * Math.min(a, 1.2)})`; c.style.filter = `brightness(${1 - .4 * Math.min(a, 1)})`; c.style.zIndex = String(100 - Math.round(a * 10)); }); };
    deck.addEventListener('scroll', () => requestAnimationFrame(paint)); setTimeout(paint, 30);
    el.addEventListener('click', (e) => {
      const rb = e.target.closest('[data-rsvp]');
      if (rb) { e.stopPropagation(); const [id, v] = rb.dataset.rsvp.split('|'); state.rsvp[id] = state.rsvp[id] == v ? null : v; const c = rb.closest('.fc'); const tmp = document.createElement('div'); tmp.innerHTML = card(id); c.replaceWith(tmp.firstElementChild); paint(); if (state.rsvp[id] == 'in') toast("You're in — friends will see it."); return; }
      const t = e.target.closest('[data-tab]'); if (t) { el.querySelectorAll('[data-tab]').forEach((b) => { b.classList.toggle('mute', b !== t); const dot = b.querySelector('.tdot'); if (dot) dot.remove(); }); t.insertAdjacentHTML('beforeend', '<i class="tdot"></i>'); return; }
      const c = e.target.closest('.fc'); if (c && !e.target.closest('button')) go('event', { id: c.dataset.ev });
    });
  } };

/* ---------- Filter: vibe mixer board ---------- */
const count = () => Math.max(1, 3 + filt.vibes.length * 3 + (filt.dates.length || 5) * 2 - filt.friends * 2);
SCREENS.filter = { label: 'Filter — vibe mixer', section: 'Feed', tag: 'new', render: () => `${statusBar()}
  <div class="row" style="padding:6px 16px 0 20px;flex:none"><span class="dsp" style="font-size:44px">Mix your night</span><span class="sp"></span><button class="icb f" data-go="feed" aria-label="Close">${I('X', 20)}</button></div>
  <div class="scroll" style="padding-bottom:110px">
   <div class="row" style="padding:12px 20px 0;gap:8px"><button class="pill pg" style="height:38px;font-size:13.5px" data-toast="City search opens here.">${I('MapPin', 16)}${filt.city}${I('ChevronDown', 16)}</button><button class="pill" style="height:38px;font-size:13.5px;color:var(--pt)" data-toast="Location enabled">${I('Navigation', 15)}Near me</button></div>
   <div class="row" style="padding:18px 20px 8px;gap:6px"><span class="flab">Drag vibes onto the board</span>${I('Hand' in LUCIDE ? 'Hand' : 'MousePointer2', 15, 2, 'color:var(--mute)')}</div>
   <div class="tray">${VIBES.map((v) => `<button class="tv ${filt.vibes.includes(v[0]) ? 'on' : ''}" data-v="${v[0]}">${SV(v[0], 38, -4)}<span>${v[1]}</span></button>`).join('')}</div>
   <div class="board" id="board">${filt.vibes.length ? '' : '<span class="bempty">Drag vibes here — or leave it empty for everything</span>'}</div>
   <div class="row" style="padding:16px 20px 0;align-items:stretch;gap:10px">
     <div class="card" style="flex:1;padding:14px 16px">
       <div class="flab">Friends going</div>
       <div class="row" style="margin-top:8px;gap:10px"><button class="icb f" data-f="-1" aria-label="Fewer">−</button><div style="flex:1;text-align:center"><div class="dsp" id="fval" style="font-size:42px">${filt.friends ? filt.friends + '+' : 'Any'}</div></div><button class="icb f" data-f="1" aria-label="More">+</button></div>
       <div class="dial">${Array.from({ length: 10 }, (_, k) => `<i class="${k < filt.friends ? 'on' : ''}"></i>`).join('')}</div>
     </div>
     <div class="card" style="width:120px;padding:14px;display:flex;flex-direction:column;justify-content:space-between"><div class="flab">With</div><div class="avs" style="margin-top:8px">${['marie', 'jonas', 'timo'].map((a) => `<img class="av" src="${AV(a)}" alt="" width="34" height="34">`).join('')}</div><div style="font-size:12.5px;color:var(--mute);margin-top:8px">Your inner circle</div></div>
   </div>
   <div class="flab" style="padding:18px 20px 8px">When — tap a start and an end</div>
   <div class="tl" id="tl">${DATES.map((d, k) => `<button data-d="${k}" class="${filt.dates.includes(k) ? 'on' : ''} ${filt.dates.length == 2 && k > filt.dates[0] && k < filt.dates[1] ? 'mid' : ''}">${d}</button>`).join('')}<button data-toast="Date picker opens here.">${I('CalendarDays', 16)}</button></div>
  </div>
  <div class="fbar"><button class="pill po" style="height:54px;flex:1" data-reset>Reset</button><button class="pill pp" style="height:54px;flex:2;font-size:16px" data-go="feed" id="showN">Show ${count()} events</button></div>
  <style>
  .tray{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;padding:0 14px}
  .tv{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;font-weight:600;padding:6px 0;border-radius:14px;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}
  .bs{touch-action:none;cursor:grab}
  .board.over{background:color-mix(in srgb,var(--p) 22%,transparent);border-style:solid}
  .ghost{position:fixed;z-index:9999;pointer-events:none;transform:translate(-50%,-50%) scale(1.15);filter:drop-shadow(0 12px 18px rgba(0,0,0,.35))}
  .bhint{position:absolute;right:12px;bottom:10px;font:500 10px var(--mono);text-transform:uppercase;letter-spacing:.04em;color:var(--pt);opacity:.7}
  .tv.on{opacity:.35}
  .board{margin:10px 16px 0;height:190px;border-radius:28px;border:2px dashed color-mix(in srgb,var(--p) 50%,transparent);background:var(--pSoft);position:relative;overflow:hidden}
  .bempty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 40px;color:var(--pt);font-weight:600;font-size:14px}
  .bs{position:absolute;display:flex;flex-direction:column;align-items:center;font:600 12px var(--ui);color:var(--pt)}
  .dial{display:flex;gap:3px;margin-top:10px}.dial i{flex:1;height:8px;border-radius:4px;background:var(--s3)}.dial i.on{background:var(--p)}
  .tl{display:flex;gap:6px;padding:0 16px;overflow-x:auto;scrollbar-width:none}
  .tl button{height:44px;padding:0 14px;border-radius:14px;background:var(--s1);border:1.5px solid var(--line);font-weight:600;font-size:13.5px;white-space:nowrap;flex:none}
  .tl button.on{background:var(--p);border-color:var(--p);color:#fff}
  .tl button.mid{background:var(--pSoft);border-color:transparent;color:var(--pt)}
  .fbar{position:absolute;left:0;right:0;bottom:0;display:flex;gap:10px;padding:14px 16px calc(18px + env(safe-area-inset-bottom,0px));background:var(--bg);border-top:1px solid var(--line);z-index:30}
  </style>`,
  mount: (el) => {
    const board = el.querySelector('#board'); const POS = [[24, 22], [130, 70], [236, 24], [70, 110], [190, 116], [280, 96], [16, 120], [150, 10], [250, 140]];
    const paintBoard = (anim) => { board.innerHTML = filt.vibes.length ? filt.vibes.map((v, k) => { const p = filt.pos[v] || POS[k % POS.length]; const lab = VIBES.find((x) => x[0] == v)[1]; return `<button class="bs" data-rm="${v}" style="left:${p[0]}px;top:${p[1]}px" aria-label="Remove ${lab}">${SV(v, 52, [-8, 6, -4, 10, -6][k % 5], anim === v ? 'slap' : '')}${lab}</button>`; }).join('') : '<span class="bempty">Drag vibes here — or leave it empty for everything</span>'; if (filt.vibes.length) board.insertAdjacentHTML('beforeend', '<span class="bhint">Drag off to remove</span>'); el.querySelector('#showN').textContent = `Show ${count()} events`; };
    paintBoard();
    // drag from the tray onto the board, or drag a board sticker off to remove it
    let drag = null;
    const addAt = (k, x, y) => { const r = board.getBoundingClientRect(); filt.pos[k] = [Math.round(Math.max(0, Math.min(r.width - 64, x - r.left - 32))), Math.round(Math.max(0, Math.min(r.height - 74, y - r.top - 34)))]; if (!filt.vibes.includes(k)) filt.vibes.push(k); const t = el.querySelector(`[data-v="${k}"]`); if (t) t.classList.add('on'); paintBoard(k); };
    const inBoard = (x, y) => { const r = board.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top && y < r.bottom; };
    el.addEventListener('pointerdown', (e) => { const src = e.target.closest('.tv:not(.on), .bs'); if (!src) return; const k = src.dataset.v || src.dataset.rm; drag = { k, fromBoard: !!src.dataset.rm, x0: e.clientX, y0: e.clientY, moved: false, src }; });
    el.addEventListener('pointermove', (e) => { if (!drag) return; if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return; if (!drag.moved) { drag.moved = true; drag.g = document.createElement('div'); drag.g.className = 'ghost'; drag.g.innerHTML = SV(drag.k, 56, -6); document.body.appendChild(drag.g); drag.src.style.opacity = '.3'; } drag.g.style.left = e.clientX + 'px'; drag.g.style.top = e.clientY + 'px'; board.classList.toggle('over', inBoard(e.clientX, e.clientY)); e.preventDefault(); });
    const end = (e) => { if (!drag) return; const d = drag; drag = null; if (!d.moved) return; d.g.remove(); d.src.style.opacity = ''; board.classList.remove('over'); el.dataset.dragged = '1'; setTimeout(() => delete el.dataset.dragged, 50);
      if (inBoard(e.clientX, e.clientY)) addAt(d.k, e.clientX, e.clientY);
      else if (d.fromBoard) { filt.vibes = filt.vibes.filter((x) => x != d.k); delete filt.pos[d.k]; el.querySelector(`[data-v="${d.k}"]`).classList.remove('on'); paintBoard(); } };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('click', (e) => {
      if (el.dataset.dragged) return;
      const v = e.target.closest('[data-v]'); if (v) { const k = v.dataset.v; if (!filt.vibes.includes(k)) { filt.pos[k] = POS[filt.vibes.length % POS.length]; filt.vibes.push(k); v.classList.add('on'); paintBoard(k); } return; }
      const rm = e.target.closest('[data-rm]'); if (rm) { filt.vibes = filt.vibes.filter((x) => x != rm.dataset.rm); el.querySelector(`[data-v="${rm.dataset.rm}"]`).classList.remove('on'); paintBoard(); return; }
      const f = e.target.closest('[data-f]'); if (f) { filt.friends = Math.max(0, Math.min(10, filt.friends + +f.dataset.f)); el.querySelector('#fval').textContent = filt.friends ? filt.friends + '+' : 'Any'; el.querySelectorAll('.dial i').forEach((i, k) => i.classList.toggle('on', k < filt.friends)); el.querySelector('#showN').textContent = `Show ${count()} events`; return; }
      const d = e.target.closest('[data-d]'); if (d) { const k = +d.dataset.d; if (filt.dates.length != 1) filt.dates = [k]; else filt.dates = [Math.min(filt.dates[0], k), Math.max(filt.dates[0], k)]; el.querySelectorAll('[data-d]').forEach((b) => { const j = +b.dataset.d; b.className = (filt.dates.includes(j) ? 'on ' : '') + (filt.dates.length == 2 && j > filt.dates[0] && j < filt.dates[1] ? 'mid' : ''); }); el.querySelector('#showN').textContent = `Show ${count()} events`; return; }
      if (e.target.closest('[data-reset]')) { filt.vibes = []; filt.pos = {}; filt.friends = 0; filt.dates = []; go('filter'); }
    });
  } };

/* ---------- Roulette ---------- */
SHEETS.roulette = { label: 'Roulette (dice)', section: 'Feed', base: 'feed', tag: 'upd', render: () => `
  <div class="row"><div><div class="dsp" style="font-size:40px">Can't decide?</div><div class="mute" style="font-size:14px;margin-top:6px">Let the dice pick your night.</div></div><span class="sp"></span><span id="dice">${SV('dice', 80, 10)}</span></div>
  <div id="rbox" class="card" style="margin-top:16px;min-height:300px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;padding:16px;background:var(--bg)"><button class="pill pp" style="height:54px;padding:0 26px;font-size:16px" data-roll>${I('Dices', 20)}Roll the dice</button></div>`,
  mount: (w) => {
    w.addEventListener('click', (e) => {
      if (!e.target.closest('[data-roll]')) return;
      const box = w.querySelector('#rbox'); const ids = FEED.slice(1); let k = 0; const dice = w.querySelector('#dice svg'); dice.style.animation = 'spin .5s linear infinite';
      const tick = setInterval(() => { const ev = EV[ids[k++ % ids.length]]; box.innerHTML = `<img src="${A(ev.img)}" alt="" style="width:120px;height:150px;object-fit:cover;border-radius:14px"><div style="font-weight:600">${ev.short}</div><div class="meta">Rolling…</div>`; }, 110);
      setTimeout(() => { clearInterval(tick); dice.style.animation = ''; const ev = EV.alles; box.innerHTML = `<div style="align-self:flex-start;font-weight:600;font-size:16px"><span style="color:var(--pt)">The dice say:</span> Timo is in</div><img src="${A(ev.img)}" alt="" class="pop" style="width:100%;height:210px;object-fit:cover;border-radius:18px"><div style="align-self:flex-start"><div style="font-weight:700;font-size:19px">${ev.name}</div><div class="sub">${I('CalendarDays', 15)}${ev.long} · ${ev.time} ${I('MapPin', 15)}${ev.venue}</div></div><div class="row" style="width:100%;gap:8px"><button class="pill po" style="flex:1;height:50px" data-roll>${I('RotateCw', 17)}Spin again</button><button class="pill pp" style="flex:1.2;height:50px" data-go="event" data-p='{"id":"alles"}'>${I('Check', 17, 2.6)}I am in</button></div>`; }, 1700);
    });
  } };

/* ---------- Your note ---------- */
SHEETS.note = { label: 'Your note (Today row)', section: 'Feed', base: 'feed', tag: 'new', render: () => `
  <div class="dsp" style="font-size:36px">Your note</div><div class="mute" style="font-size:14px;margin-top:6px">Your mood sticker sits on your photo in the Today row for 24 h. Mutual friends see it.</div>
  <div style="display:flex;flex-direction:column;align-items:center;margin-top:20px">
    <span style="position:relative;display:block"><img class="av" src="${AV('nina')}" alt="" width="96" height="96" style="border:3px solid var(--p);padding:3px"><span id="nst" style="position:absolute;right:-16px;bottom:-12px">${SV('spritz', 46, -8, 'slap')}</span></span>
    <b style="margin-top:12px">You</b><span class="mute" id="ntext" style="font-size:13px;margin-top:2px;max-width:260px;text-align:center">pre-drinks at mine, who's in?</span>
  </div>
  <div class="field" style="margin-top:18px"><input id="nin" value="pre-drinks at mine, who's in?" maxlength="60" aria-label="Your note"><span class="meta" id="ncount">29/60</span></div>
  <div class="flab" style="margin:16px 0 8px">Mood</div>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">${[['spritz', 'Drinks'], ['sneaker', 'Dancing'], ['couch', 'Chill'], ['ball', 'Sport'], ['sun', 'Day']].map((m, k) => `<button class="nm" data-m="${m[0]}" aria-pressed="${k == 0}" style="height:84px;border-radius:18px;border:1.5px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px;font-weight:600">${SV(m[0], 34)}${m[1]}</button>`).join('')}</div>
  <div class="row" style="margin-top:16px;padding:12px 14px;border-radius:16px;background:var(--bg)">${I('MapPin', 20)}<div style="flex:1"><div style="font-weight:600;font-size:14.5px">Where</div><div class="mute" style="font-size:12.5px">Only what you type — no GPS</div></div><button class="tog" aria-pressed="false" aria-label="Share where"></button></div>
  <div class="row" style="margin-top:8px;padding:12px 14px;border-radius:16px;background:var(--bg)">${I('Clock', 20)}<div style="flex:1;font-weight:600;font-size:14.5px">Show until</div><span class="pill ppt" style="height:30px;font:500 12.5px var(--mono)">02:00</span></div>
  <button class="pill pp" style="width:100%;height:54px;margin-top:16px;font-size:16px" data-close data-toast="">Share with my circle</button>
  <style>.nm[aria-pressed="true"]{background:var(--p);border-color:var(--p)!important;color:#fff}</style>`,
  mount: (w) => {
    const inp = w.querySelector('#nin'); inp.addEventListener('input', () => { w.querySelector('#ntext').textContent = inp.value || 'Add a line (optional)'; w.querySelector('#ncount').textContent = inp.value.length + '/60'; });
    w.addEventListener('click', (e) => { const m = e.target.closest('[data-m]'); if (!m) return; w.querySelectorAll('[data-m]').forEach((b) => b.setAttribute('aria-pressed', b === m)); w.querySelector('#nst').innerHTML = SV(m.dataset.m, 46, -8, 'slap'); });
  } };

/* ---------- Notifications ---------- */
const nrow = (img, icon, txt, time, act, unread) => `<div class="row" style="align-items:flex-start;padding:12px 4px;${unread ? '' : 'opacity:.8'}"><span style="position:relative;flex:none"><img class="av" src="${AV(img)}" alt="" width="46" height="46"><span style="position:absolute;right:-4px;bottom:-4px;width:22px;height:22px;border-radius:50%;background:var(--p);color:#fff;display:flex;align-items:center;justify-content:center;border:2px solid var(--sheet)">${I(icon, 12, 2.4)}</span></span><div style="flex:1"><div style="font-size:14.5px;line-height:1.35">${txt}</div><div class="meta" style="margin-top:4px">${time}</div>${act ? `<div class="row" style="gap:8px;margin-top:10px">${act}</div>` : ''}</div>${unread ? '<i style="width:8px;height:8px;border-radius:50%;background:var(--p);margin-top:6px"></i>' : ''}</div>`;
SHEETS.notifs = { label: 'Notifications', section: 'Feed', base: 'feed', tag: 'upd', render: () => `
  <div class="row"><span class="dsp" style="font-size:34px">Notifications</span><span class="pill pp" style="height:26px;font-size:12px;padding:0 10px">3 new</span><span class="sp"></span><button class="mute" style="font-weight:600;font-size:13px" data-toast="Cleared">Clear all</button></div>
  <div class="meta" style="margin-top:14px">New</div>
  ${nrow('marie', 'Mail', "<b>Marie</b> invited you to <b>Supperclub at Marie's</b>", '2 min', `<button class="pill pp" style="height:34px;font-size:13px;padding:0 14px">${I('Check', 15, 2.6)}I'm in</button><button class="pill pg" style="height:34px;font-size:13px;padding:0 14px">Maybe</button>`, 1)}
  ${nrow('timo', 'UserPlus', '<b>Timo</b> started following you', '1 h', '<button class="pill po" style="height:34px;font-size:13px;padding:0 14px">Follow back</button>', 1)}
  ${nrow('jonas', 'Euro', '<b>Jonas</b> added <b>€12</b> to the Razzia tab', '3 h', `<button class="pill pp" style="height:34px;font-size:13px;padding:0 14px" data-go="event" data-p='{"id":"razzia","to":"tab"}'>Settle up</button>`, 1)}
  <div class="meta" style="margin-top:12px">Earlier</div>
  ${nrow('nina', 'Archive', 'Your capsule from <b>Razzia</b> is open — 23 photos inside', 'Yesterday')}
  ${nrow('marie', 'BellRing' in LUCIDE ? 'BellRing' : 'Bell', '<b>Marie</b> sealed a pact: “I\'ll go if you go.”', 'Mon')}` };
})();
