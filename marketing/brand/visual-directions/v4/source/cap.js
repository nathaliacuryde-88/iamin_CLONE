// CAPSULE + subpages (wallet + countdown, sealed, opened, gallery, receipt, story)
(() => {
const blurTiles = (imgs, st = '') => `<div style="display:flex;${st}">${imgs.map((p, i) => `<div style="width:96px;height:126px;border-radius:12px;border:4px solid #F4F3EE;overflow:hidden;transform:rotate(${[-8, 3, 10][i]}deg);margin-left:${i ? -20 : 0}px;box-shadow:0 8px 18px rgba(0,0,0,.4);flex:none"><img src="${IMG(p)}" style="width:100%;height:100%;object-fit:cover;filter:blur(9px) brightness(.85);transform:scale(1.2)"></div>`).join('')}</div>`;
const countdown = (size = 24) => `<span class="pill pp" style="height:${size * 2}px;font-family:Anton;font-size:${size}px;font-weight:400;letter-spacing:.04em;padding:0 ${size * .8}px">07 : 48 : 12</span>`;

// K1 Wallet + countdown
const NIGHTS = [['Flohmarkt Filderstraße', 'Sat 3 Oct', '#ECE9A6', '#0B0B0A', '4 photos'], ['Desterradxs festival', 'Sun 20 Sep', '#1F3A1C', '#E9F7D0', '12 photos'], ['Supperclub', 'Fri 2 Oct', 'transparent', 'var(--ink)', 'empty · 31h left'], ["Marie's birthday", 'Sun 6 Sep', '#F48BC8', '#0B0B0A', '18 photos'], ['Alles offen 26', 'Sat 10 Oct', '#E8364F', '#fff', '9 photos']];
const wallet = (t) => page(t, 'wallet', `${H1('Capsules', 50)}
 <div style="padding:6px 20px 0;color:var(--mute);font-size:15px;font-weight:500">Shared memories, one per night.</div>
 <div style="position:relative;height:${5 * 58 + 380}px;margin-top:16px">
  ${NIGHTS.map((c, i) => `<div class="abs" style="top:${i * 58}px;left:16px;right:16px;height:200px;border-radius:26px;background:${c[2]};color:${c[3]};${c[2] == 'transparent' ? 'background:var(--bg);border:2px dashed var(--line2);' : ''}padding:16px 18px;display:flex;justify-content:space-between;box-shadow:0 -6px 16px rgba(0,0,0,.22)"><span style="font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-right:10px">${c[0]}</span><span class="meta" style="color:inherit;opacity:.75;white-space:nowrap">${c[4]}</span></div>`).join('')}
  <div class="abs" style="top:${5 * 58}px;left:16px;right:16px;height:380px;border-radius:28px;overflow:hidden;background:#140A10;box-shadow:0 -10px 28px rgba(0,0,0,.45);color:#fff">
    <img src="${IMG('fl_razzia_clean.png')}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.35;filter:blur(2px)">
    <div class="abs" style="inset:0;background:linear-gradient(to bottom,rgba(10,10,10,.1),rgba(10,10,10,.88))"></div>
    <div class="abs" style="top:16px;left:18px;right:18px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:700;font-size:17px">Razzia · 4th anniversary</div>${meta('Sat 24 Oct · sealed', 'color:#bbb;display:block;margin-top:3px')}</div>${avs(['marie', 'timo', 'jonas'], 26)}</div>
    ${blurTiles(['f3.jpg', 'f4.jpg', 'f1.jpg'], 'position:absolute;left:22px;top:84px')}
    <span class="abs" style="right:8px;top:86px">${ST('cam', 104, -10)}</span>
    <div class="abs" style="left:18px;bottom:84px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px">23 photos · 5 people · 3 predictions</div>
    <div class="abs" style="left:18px;right:18px;bottom:18px;display:flex;align-items:center;justify-content:space-between"><span><span class="meta" style="color:#bbb;display:block">Opens</span><span style="font-weight:700;font-size:15px">Sun 10:12</span></span>${countdown(24)}</div>
  </div>
 </div>
 <div style="margin:14px 16px 0;display:flex;gap:10px">${pill('pg', 'Add photos', 'camera-plus', 'flex:1;height:50px')}${pill('pg', 'Seal a prediction', 'hourglass-medium', 'flex:1;height:50px')}</div>
 <div class="hint" style="text-align:center;margin-top:10px">Tap a night to open it · pull the stack to see older nights</div>
`, 'cap');

// K2 Sealed capsule (before it opens)
const sealed = (t) => page(t, 'sealed', `
 <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 20px 0"><span class="hb" style="background:var(--s2)">${P('caret-left', 20, 'bold')}</span>${meta('Sealed capsule')}<span class="hb" style="background:var(--s2)">${P('share-network', 19)}</span></div>
 <div style="text-align:center;padding:14px 0 0">${ST('lock', 96, -8)}</div>
 ${H1('Razzia · 4th anniversary', 30, 'text-align:center;padding:12px 30px 0')}
 <div style="text-align:center;margin-top:10px">${meta('Sat 24 Oct · Romantica')}</div>
 <div style="margin:20px 16px 0;border-radius:28px;background:var(--hero);color:#F4F3EE;padding:22px;text-align:center">
   <div class="meta" style="color:#8C8B85">Opens in</div>
   <div class="dsp" style="font-size:66px;margin-top:8px;letter-spacing:.04em">07:48:12</div>
   <div style="font-size:14px;color:#BDBCB6;margin-top:8px">Sunday at 10:12 — the morning after</div>
 </div>
 <div style="margin:14px 16px 0;border-radius:28px;background:var(--s1);border:1px solid var(--line);padding:18px;position:relative;overflow:hidden">
   <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:16px">23 photos inside</span>${meta('no peeking')}</div>
   <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px">${['f3.jpg', 'f4.jpg', 'f1.jpg', 'f2.jpg', 'f5.jpg', '02.jpg', '03.jpg', '01.jpg'].map((p) => `<div style="aspect-ratio:1;border-radius:10px;overflow:hidden"><img src="${IMG(p)}" style="width:100%;height:100%;object-fit:cover;filter:blur(8px);transform:scale(1.2)"></div>`).join('')}</div>
   ${pill('pp', 'Add photos', 'camera-plus', 'width:100%;height:48px;margin-top:14px')}
 </div>
 <div style="margin:14px 16px 0;border-radius:28px;background:var(--s1);border:1px solid var(--line);padding:18px">
   <div class="row2">${ST('crystal', 62, -6)}<div><div style="font-weight:700;font-size:16px">3 predictions sealed</div><div class="hint">Everyone can read them after the night.</div></div></div>
   <div style="margin-top:14px;border-radius:18px;background:var(--bg);padding:14px">
     <div class="row2" style="justify-content:space-between">${meta('Yours · sealed 21:04')}<span style="display:flex;gap:10px;color:var(--mute)">${P('pencil-simple', 18)}${P('trash', 18)}</span></div>
     <div style="font-weight:600;font-size:16px;line-height:1.35;margin-top:8px">“Timo ends up dancing on the bar.”</div>
   </div>
   <div style="display:flex;gap:8px;margin-top:10px">${['jonas', 'marie'].map((a) => `<div style="flex:1;border-radius:16px;background:var(--bg);padding:12px;display:flex;align-items:center;gap:8px"><img src="${A(a)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover"><span style="flex:1;height:12px;border-radius:6px;background:var(--s3)"></span>${P('lock-simple', 16, 'fill', 'color:var(--mute)')}</div>`).join('')}</div>
 </div>
`, 'cap');

// K3 Opened capsule (the morning after) — long page
const opened = (t) => page(t, 'opened', `
 <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 20px 0"><span class="hb" style="background:var(--s2)">${P('caret-left', 20, 'bold')}</span>${meta('The morning after')}<span class="hb" style="background:var(--s2)">${P('share-network', 19)}</span></div>
 <div style="position:relative;margin:16px 19px 0">
  <div style="display:grid;grid-template-columns:repeat(3,112px);grid-auto-rows:148px;gap:8px">
   ${['f3.jpg', 'f4.jpg', 'f2.jpg', '01.jpg', 'C', 'f1.jpg', '02.jpg', 'f5.jpg', '03.jpg'].map((p) => p == 'C' ? `<div style="border-radius:14px;background:var(--s1);border:1px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center"><div class="dsp" style="font-size:30px">Razzia</div>${meta('24.10.26', 'margin-top:6px')}${meta('23 photos', 'margin-top:2px')}</div>` : `<img src="${IMG(p)}" style="width:112px;height:148px;object-fit:cover;border-radius:14px">`).join('')}
  </div>
  <span class="abs" style="right:-14px;top:-26px">${ST('burst', 86, -10)}</span>
  <span class="abs" style="left:-16px;bottom:-30px">${ST('receipt', 96, -14)}</span>
 </div>
 <div style="margin:26px 16px 0;border-radius:24px;background:var(--s1);border:1px solid var(--line);padding:16px">
   <div class="row2" style="justify-content:space-between">${meta('Sealed 21:04 · Jonas')}<span class="pill pp" style="height:26px;font-size:12px;padding:0 10px">Came true</span></div>
   <div style="font-weight:600;font-size:19px;line-height:1.3;margin-top:8px">“Timo ends up dancing on the bar.”</div>
 </div>
 <div style="display:flex;align-items:center;gap:12px;padding:22px 20px 8px">${ST('crystal', 48, -6)}<span class="dsp" style="font-size:28px">Revealed</span></div>
 <div style="margin:0 16px;display:flex;flex-direction:column;gap:8px">${[['marie', 'Marie Klein', 'Jonas loses his jacket. Again.'], ['nina', 'You', 'Home before 4. Lol.']].map((r) => `<div style="border-radius:20px;background:var(--s1);border:1px solid var(--line);padding:14px 16px"><div style="font-size:15.5px;font-weight:600;line-height:1.35">“${r[2]}”</div><div class="row2" style="margin-top:10px;gap:8px"><img src="${A(r[0])}" style="width:24px;height:24px;border-radius:50%;object-fit:cover"><span style="font-size:13px;font-weight:600">${r[1]}</span><span class="hint" style="font-size:12.5px">· sealed before the night</span></div></div>`).join('')}</div>
 <div style="margin:14px 16px 0;border-radius:24px;background:var(--s1);border:1px solid var(--line);padding:16px">
   <div class="row2" style="justify-content:space-between"><div><div style="font-weight:700;font-size:16px">Exit poll</div>${meta('12 votes')}</div></div>
   <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px">${[['flame', 'Worth it', 9], ['meh', 'Mid', 2], ['skull', 'Flop', 1]].map((v, i) => `<div class="tile" style="height:110px;${i == 0 ? 'border-color:var(--p);background:color-mix(in srgb,var(--p) 12%,var(--bg))' : ''}">${ST(v[0], 46, -6)}<span><b class="dsp" style="font-size:22px">${v[2]}</b> <span style="font-weight:500;color:var(--mute);font-size:12.5px">${v[1]}</span></span></div>`).join('')}</div>
 </div>
 <div style="display:flex;justify-content:space-between;align-items:center;padding:22px 20px 10px"><span class="dsp" style="font-size:28px">Photos (23)</span><span style="display:flex;align-items:center;gap:6px;color:var(--pt);font-weight:700;font-size:14px">${P('camera-plus', 18)}Add photos</span></div>
 <div style="margin:0 16px;display:grid;grid-template-columns:1fr 1fr;gap:8px">${['f4.jpg', 'f3.jpg', 'f1.jpg', 'f2.jpg'].map((p) => `<img src="${IMG(p)}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:16px">`).join('')}</div>
 <div style="margin:16px 16px 0;display:flex;gap:10px">${pill('pg', 'Receipt', 'receipt', 'flex:1;height:54px')}${pill('pp', 'Post to story', 'instagram-logo', 'flex:1.4;height:54px')}</div>
`, 'cap');

// K4 Gallery
const gallery = (t) => `<div class="ph ${t}" id="gallery-${t}" style="height:844px;padding-bottom:0;background:#000;color:#fff">${status.replace('class="status"', 'class="status" style="color:#fff"')}
  <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 16px 0">${meta('3 / 23', 'color:#fff;font-size:13px')}<span style="display:flex;gap:8px">${['download-simple', 'trash', 'x'].map((i) => `<span class="hb" style="background:rgba(255,255,255,.14);color:#fff">${P(i, 19)}</span>`).join('')}</span></div>
  <div style="position:absolute;left:0;right:0;top:120px;height:560px"><img src="${IMG('f4.jpg')}" style="width:100%;height:100%;object-fit:cover"></div>
  <div style="position:absolute;left:0;right:0;bottom:30px;display:flex;gap:8px;justify-content:center;align-items:center">${['f3.jpg', 'f1.jpg', 'f4.jpg', 'f2.jpg', 'f5.jpg'].map((p, i) => `<img src="${IMG(p)}" style="width:${i == 2 ? 62 : 52}px;height:${i == 2 ? 62 : 52}px;border-radius:12px;object-fit:cover;${i == 2 ? 'box-shadow:0 0 0 3px #7C3BED' : 'opacity:.55'}">`).join('')}</div>
</div>`;

// K5 Morning-after receipt
const receipt = (t) => sheet(t, 'receipt', '', `
  <div style="display:flex;justify-content:space-between;align-items:center;padding:0 20px">${H1('Morning-after receipt', 26, 'padding:0')}<span style="display:flex;gap:6px">${['download-simple', 'share-network'].map((i) => `<span class="hb" style="background:var(--bg)">${P(i, 19)}</span>`).join('')}</span></div>
  <div style="position:relative;margin:22px auto 0;width:316px">
   <span class="abs" style="right:-30px;top:-28px;z-index:2">${ST('flame', 64, 12)}</span>
   <div style="background:#F6F3EA;color:#111;font-family:'JetBrains Mono';font-size:12px;padding:22px 20px;clip-path:polygon(0 8px,4% 0,8% 8px,12% 0,16% 8px,20% 0,24% 8px,28% 0,32% 8px,36% 0,40% 8px,44% 0,48% 8px,52% 0,56% 8px,60% 0,64% 8px,68% 0,72% 8px,76% 0,80% 8px,84% 0,88% 8px,92% 0,96% 8px,100% 0,100% calc(100% - 8px),96% 100%,92% calc(100% - 8px),88% 100%,84% calc(100% - 8px),80% 100%,76% calc(100% - 8px),72% 100%,68% calc(100% - 8px),64% 100%,60% calc(100% - 8px),56% 100%,52% calc(100% - 8px),48% 100%,44% calc(100% - 8px),40% 100%,36% calc(100% - 8px),32% 100%,28% calc(100% - 8px),24% 100%,20% calc(100% - 8px),16% 100%,12% calc(100% - 8px),8% 100%,4% calc(100% - 8px),0 100%)">
    <div style="text-align:center;font-weight:500;font-size:15px">I AM (IN)</div><div style="text-align:center;margin-top:4px">★ MORNING-AFTER RECEIPT ★</div>
    <div style="text-align:center;margin-top:12px;font-weight:500">RAZZIA · 4TH ANNIVERSARY</div><div style="text-align:center">SAT 24 OCT 2026 · STUTTGART</div>
    <div style="border-top:1px dashed #999;margin:12px 0"></div>
    ${[['People going', '9'], ['Photos in capsule', '23']].map((r) => `<div style="display:flex;justify-content:space-between;margin:4px 0"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}
    <div style="border-top:1px dashed #999;margin:12px 0"></div>
    <div>SEALED PREDICTION</div><div style="font-style:italic;margin-top:4px">“Timo ends up dancing on the bar.”</div>
    <div style="border-top:1px dashed #999;margin:12px 0"></div>
    ${[['Table total', '€126.00'], ['Your share', '€14.00']].map((r, i) => `<div style="display:flex;justify-content:space-between;margin:4px 0;${i ? 'font-size:15px;font-weight:500' : ''}"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}
    <div style="border-top:1px dashed #999;margin:12px 0"></div>
    ${[['Exit poll', 'WORTH IT 9 · MID 2 · FLOP 1'], ['Verdict', 'FIRE']].map((r) => `<div style="display:flex;justify-content:space-between;margin:4px 0"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}
    <div style="border-top:1px dashed #999;margin:12px 0"></div>
    <div style="text-align:center">— TIP —</div><div style="text-align:center;margin-top:6px">THANK YOU · COME AGAIN · #8F3A1C</div>
   </div>
  </div>
`, { top: 60 });

// K6 Story recap
const story = (t) => sheet(t, 'story', '', `
  ${H1('Story recap', 30, 'padding:0 22px')}
  <div style="margin:16px auto 0;width:252px;height:448px;border-radius:22px;overflow:hidden;position:relative;background:linear-gradient(170deg,#2A1458,#0B0B0A 70%);color:#fff;box-shadow:0 18px 40px rgba(0,0,0,.4)">
    <div class="meta" style="position:absolute;left:18px;top:18px;color:#C4A6FF;font-size:10px">Recap</div>
    <div class="dsp" style="position:absolute;left:16px;top:38px;font-size:46px;line-height:.9;transform:rotate(-2deg)">Razzia<br>4th<br>anniversary</div>
    ${['f3.jpg', 'f4.jpg', 'f1.jpg'].map((p, i) => `<img src="${IMG(p)}" style="position:absolute;width:110px;height:140px;object-fit:cover;border-radius:8px;border:4px solid #fff;left:${[22, 120, 64][i]}px;top:${[190, 206, 258][i]}px;transform:rotate(${[-8, 7, -2][i]}deg);box-shadow:0 8px 16px rgba(0,0,0,.4)">`).join('')}
    <span class="abs" style="right:10px;top:150px">${ST('burst', 54, 10)}</span>
    <div class="abs" style="left:0;right:0;bottom:16px;text-align:center;font:700 15px 'Space Grotesk';letter-spacing:.04em">I am <span style="color:#A98BFF">(</span>IN<span style="color:#A98BFF">)</span></div>
  </div>
  <div style="margin:16px 18px 0;border-radius:20px;background:var(--bg)"><div class="row2" style="padding:14px 16px;justify-content:space-between;font-weight:600;font-size:15px">Show capsule photos${tog()}</div><div class="row2" style="padding:14px 16px;justify-content:space-between;font-weight:600;font-size:15px;border-top:1px solid var(--line)">Show “settle up” line${tog(false)}</div></div>
  <div style="padding:14px 18px 0">${pill('pp', 'Share to story', 'share-network', 'width:100%;height:54px;font-size:16px')}<div class="hint" style="text-align:center;margin-top:8px;font-size:12.5px">Pick Instagram → Story in the share menu.</div></div>
`, { top: 60 });

window.CAP = [['Capsules — wallet + countdown', wallet], ['Sealed capsule (before it opens)', sealed], ['Opened capsule — the morning after', opened], ['Photo gallery', gallery], ['Morning-after receipt', receipt], ['Story recap', story]];
})();
