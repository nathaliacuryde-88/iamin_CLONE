// CAPSULE: wallet + countdown, sealed, morning after, gallery, receipt, story (v4 design)
(() => {
const NIGHTS = [['Flohmarkt Filderstraße', '4 photos', '#ECE9A6', '#0B0B0A'], ['Desterradxs festival', '12 photos', '#1F3A1C', '#E9F7D0'], ['Supperclub', 'empty · 31h left', '', ''], ["Marie's birthday", '18 photos', '#F48BC8', '#0B0B0A'], ['Alles offen 26', '9 photos', '#E8364F', '#fff']];
const blurTiles = (imgs) => `<div style="display:flex;position:absolute;left:22px;top:84px">${imgs.map((p, i) => `<div style="width:96px;height:126px;border-radius:12px;border:4px solid #F4F3EE;overflow:hidden;transform:rotate(${[-8, 3, 10][i]}deg);margin-left:${i ? -20 : 0}px;box-shadow:0 8px 18px rgba(0,0,0,.4);flex:none"><img src="${A(p)}" alt="" style="width:100%;height:100%;object-fit:cover;filter:blur(9px) brightness(.85);transform:scale(1.2)"></div>`).join('')}</div>`;

function openCard(c) {
  const app = document.getElementById('app'); const ar = app.getBoundingClientRect(); const r = c.getBoundingClientRect(); const to = c.dataset.go;
  const fly = c.cloneNode(true); fly.className = c.className + ' wfly'; fly.removeAttribute('data-go');
  Object.assign(fly.style, { left: (r.left - ar.left) + 'px', top: (r.top - ar.top) + 'px', width: r.width + 'px', height: r.height + 'px', right: 'auto', margin: 0, animation: 'none' });
  app.appendChild(fly);
  c.closest('.scroll').querySelectorAll('.wc, .wfront').forEach((x) => { if (x !== c) x.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(90px)', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }); else x.style.visibility = 'hidden'; });
  const lift = fly.animate([{ transform: 'none' }, { transform: 'translateY(-14px) scale(1.03) rotate(-1deg)' }], { duration: 170, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
  lift.onfinish = () => { const grow = fly.animate([{ left: fly.style.left, top: (r.top - ar.top - 14) + 'px', width: r.width + 'px', height: r.height + 'px', borderRadius: '26px', transform: 'scale(1.03) rotate(-1deg)' }, { left: '0px', top: '0px', width: ar.width + 'px', height: ar.height + 'px', borderRadius: '0px', transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' });
    grow.onfinish = () => { go(to, { anim: 1 }); const pg = app.querySelector('#scr'); app.appendChild(fly); pg.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.9,.3,1)' }); fly.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' }).onfinish = () => fly.remove(); }; };
}

SCREENS.capsule = { label: 'Capsules — wallet + countdown', section: 'Capsule', tag: 'new', nav: 'capsule', render: () => `${statusBar()}${header()}
  <div class="scroll">
  <div class="dsp" style="font-size:50px;padding:4px 20px 0">Capsules</div>
  <div class="mute" style="padding:6px 20px 0;font-size:15px;font-weight:500">Shared memories, one per night.</div>
  <div style="position:relative;height:${5 * 58 + 380}px;margin-top:16px">
   ${NIGHTS.map((c, i) => `<button data-go="opened" class="wc" style="--i:${i};top:${i * 58}px;${c[2] ? `background:${c[2]};color:${c[3]}` : 'background:var(--bg);border:2px dashed var(--line2);color:var(--ink)'}"><span style="font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c[0]}</span><span class="meta" style="color:inherit;opacity:.75;white-space:nowrap">${c[1]}</span></button>`).join('')}
   <button data-go="sealed" class="wfront">
     <img src="${A('fl_razzia.jpg')}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.35;filter:blur(2px)">
     <span style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(10,10,10,.1),rgba(10,10,10,.88))"></span>
     <span class="row" style="position:absolute;top:16px;left:18px;right:18px;text-align:left"><span style="flex:1"><span style="display:block;font-weight:700;font-size:17px">Razzia · 4th anniversary</span><span class="meta" style="color:#bbb">Sat 24 Oct · sealed</span></span><span class="avs">${['marie', 'timo', 'jonas'].map((a) => `<img class="av" src="${AV(a)}" alt="" width="26" height="26" style="border-color:#140A10">`).join('')}</span></span>
     ${blurTiles(['f3.jpg', 'f4.jpg', 'f1.jpg'])}
     <span style="position:absolute;left:18px;bottom:84px;font-size:15px;font-weight:600">23 photos · 5 people · 3 predictions</span>
     <span class="row" style="position:absolute;left:18px;right:18px;bottom:18px"><span style="text-align:left"><span class="meta" style="display:block;color:#bbb">Opens</span><b>Sun 10:12</b></span><span class="sp"></span><span class="pill pp cdn2" style="height:48px;font:24px var(--dsp);letter-spacing:.04em;padding:0 18px" id="cdown">07 : 48 : 12</span></span>
   </button>
  </div>
  <div class="row" style="gap:10px;padding:14px 16px 0"><button class="pill pg" style="flex:1;height:50px" data-toast="Opens your photos — they stay sealed until 10:12.">${I('ImagePlus', 18)}Add photos</button><button class="pill pg" style="flex:1;height:50px" data-sheet="predict">${I('Hourglass', 18)}Seal a prediction</button></div>
  <div class="mute" style="text-align:center;font-size:13px;margin-top:10px">Tap a night to open it</div>
  </div>${nav('capsule')}
  <style>.wc{position:absolute;left:16px;right:16px;height:200px;border-radius:26px;padding:16px 18px;display:flex;justify-content:space-between;gap:10px;box-shadow:0 -6px 16px rgba(0,0,0,.22);text-align:left}
  .wfront{position:absolute;left:16px;right:16px;top:290px;height:380px;border-radius:28px;overflow:hidden;background:#140A10;box-shadow:0 -10px 28px rgba(0,0,0,.45);color:#fff;display:block;--i:5}
  .wc,.wfront{animation:wcin .6s cubic-bezier(.2,.9,.25,1.05) calc(var(--i) * 60ms) both;transition:transform .25s cubic-bezier(.2,.9,.3,1)}
  .wc:hover{transform:translateY(-6px)}
  @keyframes wcin{from{transform:translateY(160px);opacity:0}to{transform:none;opacity:1}}
  .wfly{position:absolute;z-index:300;overflow:hidden;pointer-events:none}</style>`,
  mount: (el) => {
    // tap a night: the card lifts out of the wallet and grows into the page
    el.addEventListener('click', (e) => { const c = e.target.closest('.wc, .wfront'); if (!c) return; e.stopPropagation(); e.preventDefault(); openCard(c); }, true);
    let s = 7 * 3600 + 48 * 60 + 12; const t = setInterval(() => { const c = el.querySelector('#cdown'); if (!c) return clearInterval(t); s--; const h = String(Math.floor(s / 3600)).padStart(2, '0'), m = String(Math.floor(s / 60) % 60).padStart(2, '0'), x = String(s % 60).padStart(2, '0'); c.textContent = `${h} : ${m} : ${x}`; }, 1000); } };

SCREENS.sealed = { label: 'Sealed capsule', section: 'Capsule', tag: 'new', render: () => `${statusBar()}${back('Sealed capsule', 'capsule')}
  <div class="scroll">
  <div style="text-align:center;padding-top:8px">${SV('lock', 92, -8)}</div>
  <div class="dsp" style="font-size:30px;text-align:center;padding:10px 30px 0">Razzia · 4th anniversary</div>
  <div class="meta" style="text-align:center;margin-top:8px">Sat 24 Oct · Romantica</div>
  <div style="margin:18px 16px 0;border-radius:28px;background:var(--hero);color:#F4F3EE;padding:22px;text-align:center"><div class="meta" style="color:#8F8E88">Opens in</div><div class="dsp" style="font-size:64px;margin-top:8px;letter-spacing:.04em">07:48:12</div><div style="font-size:14px;color:#BDBCB6;margin-top:8px">Sunday at 10:12 — the morning after</div></div>
  <div class="card" style="margin:12px 16px 0;padding:18px"><div class="row"><b style="flex:1">23 photos inside</b><span class="meta">no peeking</span></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px">${['f3.jpg', 'f4.jpg', 'f1.jpg', 'f2.jpg', 'f5.jpg', 'p01.jpg', 'p02.jpg', 'p03.jpg'].map((p) => `<span style="aspect-ratio:1;border-radius:10px;overflow:hidden;display:block"><img src="${A(p)}" alt="" style="width:100%;height:100%;object-fit:cover;filter:blur(8px);transform:scale(1.2)"></span>`).join('')}</div><button class="pill pp" style="width:100%;height:48px;margin-top:14px">${I('ImagePlus', 18)}Add photos</button></div>
  <div class="card" style="margin:12px 16px 0;padding:18px"><div class="row">${SV('crystal', 58, -6)}<div><b>3 predictions sealed</b><div class="mute" style="font-size:13px">Everyone can read them after the night.</div></div></div>
   <div style="margin-top:14px;border-radius:18px;background:var(--bg);padding:14px"><div class="row"><span class="meta" style="flex:1">Yours · sealed 21:04</span><span class="row mute" style="gap:12px">${I('Pencil', 17)}${I('Trash2', 17)}</span></div><div style="font-weight:600;font-size:16px;margin-top:8px">“Timo ends up dancing on the bar.”</div></div>
   <div class="row" style="gap:8px;margin-top:10px">${['jonas', 'marie'].map((a) => `<div class="row" style="flex:1;border-radius:16px;background:var(--bg);padding:12px;gap:8px"><img class="av" src="${AV(a)}" alt="" width="28" height="28"><span style="flex:1;height:12px;border-radius:6px;background:var(--s3)"></span>${I('Lock', 15, 2, 'color:var(--mute)')}</div>`).join('')}</div></div>
  </div>` };

SCREENS.opened = { label: 'The morning after (opened)', section: 'Capsule', tag: 'upd', render: () => `${statusBar()}${back('The morning after', 'capsule')}
  <div class="scroll">
  <div style="position:relative;margin:10px 19px 0"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
   ${['f3.jpg', 'f4.jpg', 'f2.jpg', 'p01.jpg', 'C', 'f1.jpg', 'p02.jpg', 'f5.jpg', 'p03.jpg'].map((p, k) => p == 'C' ? `<div class="card" style="height:148px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:14px"><span class="dsp" style="font-size:30px">Razzia</span><span class="meta" style="margin-top:6px">24.10.26</span><span class="meta">23 photos</span></div>` : `<button data-go="gallery" style="position:relative;height:148px;border-radius:14px;overflow:hidden"><img src="${A(p)}" alt="" style="width:100%;height:100%;object-fit:cover">${k == 1 ? `<span class="react" style="position:absolute;left:5px;bottom:5px;height:26px;padding-right:8px;background:rgba(255,255,255,.92);color:#0B0B0A;border:0">${SV('flame', 20)}9</span>` : ''}</button>`).join('')}
  </div></div>
  <div class="card" style="margin:16px 16px 0;padding:16px"><div class="row"><span class="meta" style="flex:1">Sealed 21:04 · Jonas</span><span class="pill pp" style="height:26px;font-size:12px;padding:0 10px">Came true</span></div><div style="font-weight:600;font-size:19px;margin-top:8px">“Timo ends up dancing on the bar.”</div></div>
  <div class="row" style="padding:22px 20px 8px">${SV('crystal', 44, -6)}<span class="dsp" style="font-size:28px">Revealed</span></div>
  <div style="display:flex;flex-direction:column;gap:8px;padding:0 16px">${[['marie', 'Marie Klein', 'Jonas loses his jacket. Again.'], ['nina', 'You', 'Home before 4. Lol.']].map((r) => `<div class="card" style="padding:14px 16px;border-radius:20px"><div style="font-weight:600;font-size:15.5px">“${r[2]}”</div><div class="row" style="gap:8px;margin-top:10px"><img class="av" src="${AV(r[0])}" alt="" width="24" height="24"><b style="font-size:13px">${r[1]}</b><span class="mute" style="font-size:12.5px">· sealed before the night</span></div></div>`).join('')}</div>
  <div class="card" style="margin:12px 16px 0;padding:16px"><b>Exit poll</b><div class="meta">12 votes</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px">${[['flame', 'Worth it', 9], ['meh', 'Mid', 2], ['skull', 'Flop', 1]].map((v, i) => `<div style="height:108px;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:var(--bg);border:1.5px solid ${i ? 'var(--line)' : 'var(--p)'}">${SV(v[0], 44, -6)}<span><b class="dsp" style="font-size:22px">${v[2]}</b> <span class="mute" style="font-size:12.5px">${v[1]}</span></span></div>`).join('')}</div></div>
  <div class="row" style="gap:10px;padding:16px 16px 0"><button class="pill pg" style="flex:1;height:54px" data-sheet="receipt">${I('Receipt', 18)}Receipt</button><button class="pill pp" style="flex:1.4;height:54px" data-sheet="story">${I('Share2', 18)}Post to story</button></div>
  </div>` };

SCREENS.gallery = { label: 'Photo gallery', section: 'Capsule', tag: 'upd', render: () => `<div style="position:absolute;inset:0;background:#000;color:#fff">${statusBar(1)}
  <div class="row" style="padding:0 14px"><span class="meta" style="color:#fff">3 / 23</span><span class="sp"></span>${['Download', 'Trash2'].map((i) => `<button class="icb" style="background:rgba(255,255,255,.14);margin-left:6px" data-toast="${i == 'Download' ? 'Saved to photos' : 'Only your own photos can be deleted'}">${I(i, 19)}</button>`).join('')}<button class="icb" style="background:rgba(255,255,255,.14);margin-left:6px" data-go="opened" aria-label="Close">${I('X', 19)}</button></div>
  <div style="position:absolute;left:0;right:0;top:120px;height:520px"><img src="${A('f4.jpg')}" alt="" style="width:100%;height:100%;object-fit:cover"></div>
  <div class="row" style="position:absolute;left:14px;right:14px;bottom:110px;gap:6px">${[['flame', 9], ['heart', 4], ['eyes', 2]].map(([s, n]) => `<span class="react" style="background:rgba(255,255,255,.14);border-color:transparent;color:#fff">${SV(s, 26)}${n}</span>`).join('')}<span class="react" style="background:rgba(255,255,255,.14);border-color:transparent;color:#fff;padding:0 12px">${I('Smile', 17)}</span></div>
  <div class="row" style="position:absolute;left:0;right:0;bottom:30px;justify-content:center;gap:8px">${['f3.jpg', 'f1.jpg', 'f4.jpg', 'f2.jpg', 'f5.jpg'].map((p, i) => `<img src="${A(p)}" alt="" style="width:${i == 2 ? 62 : 52}px;height:${i == 2 ? 62 : 52}px;border-radius:12px;object-fit:cover;${i == 2 ? 'box-shadow:0 0 0 3px #7C3BED' : 'opacity:.55'}">`).join('')}</div></div>` };

SHEETS.receipt = { label: 'Morning-after receipt', section: 'Capsule', base: 'opened', tag: 'old', render: () => `
  <div class="row"><span class="dsp" style="font-size:26px;flex:1">Morning-after receipt</span><button class="icb f">${I('Download', 18)}</button><button class="icb f" style="margin-left:6px">${I('Share2', 18)}</button></div>
  <div style="position:relative;margin:20px auto 0;width:300px"><span style="position:absolute;right:-28px;top:-26px;z-index:2">${SV('flame', 60, 12)}</span>
  <div style="background:#F6F3EA;color:#111;font:12px var(--mono);padding:22px 20px;clip-path:polygon(0 8px,5% 0,10% 8px,15% 0,20% 8px,25% 0,30% 8px,35% 0,40% 8px,45% 0,50% 8px,55% 0,60% 8px,65% 0,70% 8px,75% 0,80% 8px,85% 0,90% 8px,95% 0,100% 8px,100% calc(100% - 8px),95% 100%,90% calc(100% - 8px),85% 100%,80% calc(100% - 8px),75% 100%,70% calc(100% - 8px),65% 100%,60% calc(100% - 8px),55% 100%,50% calc(100% - 8px),45% 100%,40% calc(100% - 8px),35% 100%,30% calc(100% - 8px),25% 100%,20% calc(100% - 8px),15% 100%,10% calc(100% - 8px),5% 100%,0 calc(100% - 8px))">
   <div style="text-align:center;font-weight:500;font-size:15px">I AM (IN)</div><div style="text-align:center;margin-top:4px">★ MORNING-AFTER RECEIPT ★</div><div style="text-align:center;margin-top:12px;font-weight:500">RAZZIA · 4TH ANNIVERSARY</div><div style="text-align:center">SAT 24 OCT 2026 · STUTTGART</div>
   <div style="border-top:1px dashed #999;margin:12px 0"></div>${[['People going', '9'], ['Photos in capsule', '23']].map((r) => `<div style="display:flex;justify-content:space-between;margin:4px 0"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}
   <div style="border-top:1px dashed #999;margin:12px 0"></div><div>SEALED PREDICTION</div><div style="font-style:italic;margin-top:4px">“Timo ends up dancing on the bar.”</div>
   <div style="border-top:1px dashed #999;margin:12px 0"></div>${[['Table total', '€126.00'], ['Your share', '€14.00']].map((r, i) => `<div style="display:flex;justify-content:space-between;margin:4px 0;${i ? 'font-size:15px;font-weight:500' : ''}"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}
   <div style="border-top:1px dashed #999;margin:12px 0"></div><div style="display:flex;justify-content:space-between"><span>Verdict</span><span>WORTH IT</span></div><div style="text-align:center;margin-top:12px">THANK YOU · COME AGAIN · #8F3A1C</div></div></div>` };
SHEETS.story = { label: 'Story recap', section: 'Capsule', base: 'opened', tag: 'old', render: () => `
  <div class="dsp" style="font-size:30px">Story recap</div>
  <div style="margin:14px auto 0;width:236px;height:420px;border-radius:22px;overflow:hidden;position:relative;background:linear-gradient(170deg,#2A1458,#0B0B0A 70%);color:#fff">
   <div class="meta" style="position:absolute;left:16px;top:16px;color:#C9B3FF">Recap</div><div class="dsp" style="position:absolute;left:14px;top:34px;font-size:42px;transform:rotate(-2deg)">Razzia<br>4th<br>anniversary</div>
   ${['f3.jpg', 'f4.jpg', 'f1.jpg'].map((p, i) => `<img src="${A(p)}" alt="" style="position:absolute;width:100px;height:128px;object-fit:cover;border-radius:8px;border:4px solid #fff;left:${[18, 112, 60][i]}px;top:${[180, 196, 244][i]}px;transform:rotate(${[-8, 7, -2][i]}deg)">`).join('')}
   <span style="position:absolute;right:8px;top:140px">${SV('burst', 50, 10)}</span><div style="position:absolute;left:0;right:0;bottom:14px;text-align:center;font:700 14px var(--ui);letter-spacing:.04em">I am <span style="color:#C9B3FF">(</span>IN<span style="color:#C9B3FF">)</span></div></div>
  <div class="row" style="margin-top:14px;padding:12px 14px;border-radius:16px;background:var(--bg)"><span style="flex:1;font-weight:600">Show capsule photos</span><button class="tog" aria-pressed="true" aria-label="Show capsule photos"></button></div>
  <button class="pill pp" style="width:100%;height:52px;margin-top:12px">${I('Share2', 18)}Share to story</button>` };
SHEETS.predict = { label: 'Seal a prediction', section: 'Capsule', base: 'capsule', tag: 'old', render: () => `
  <div class="row">${SV('crystal', 64, -6)}<div><div class="dsp" style="font-size:30px">Message to the future</div><div class="mute" style="font-size:13px;margin-top:4px">Your prediction or note — shared with everyone after the event ends.</div></div></div>
  <div class="field" style="margin-top:16px;min-height:100px;align-items:flex-start;padding:12px 14px;font-size:16px">Calling it now — we close the place down.</div>
  <div class="row" style="margin-top:10px"><span class="meta" style="flex:1">42 / 500</span><button class="pill pp" style="height:46px" data-close>${I('Lock', 16)}Seal it</button></div>` };
})();
