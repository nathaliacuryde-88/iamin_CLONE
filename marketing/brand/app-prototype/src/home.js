// HOME SCREEN: widgets + app icon quick actions (native iOS/Android work)
(() => {
const appIcon = (big) => `<span style="width:${big ? 66 : 62}px;height:${big ? 66 : 62}px;border-radius:16px;background:#0B0B0A;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(0,0,0,.35)"><span style="font:700 12px var(--ui);color:#fff;letter-spacing:.03em">I am<br><span style="color:#B49BFF">(</span>IN<span style="color:#B49BFF">)</span></span></span>`;
const icons = (n) => Array.from({ length: n }, (_, k) => `<span class="hi"><span style="background:${['#F2F2F7', '#34C759', '#0A84FF', '#FF9F0A', '#FF375F', '#5E5CE6', '#64D2FF', '#FFD60A'][k % 8]}"></span><i>${['Photos', 'Maps', 'Mail', 'Notes', 'Music', 'Camera', 'Weather', 'Wallet'][k % 8]}</i></span>`).join('');
const wall = `background:radial-gradient(120% 80% at 10% 0%,#6C3BD8 0%,transparent 60%),radial-gradient(120% 90% at 100% 100%,#FF5FA8 0%,transparent 55%),#1B1036`;
const widgets = `
  <div class="hw2">
    <div class="wsm" style="background:#0B0B0A;color:#fff"><div class="row" style="gap:6px;font:700 11px var(--ui);color:#B49BFF">I am (IN)<span class="sp"></span><span style="color:#8F8E88">in 2 d</span></div><img src="${A('fl_razzia.jpg')}" alt="" style="width:64px;height:64px;border-radius:12px;object-fit:cover;margin-top:10px;transform:rotate(-6deg)"><div style="font-weight:700;font-size:13px;margin-top:10px">Razzia</div><div style="font-size:11px;color:#BDBCB6">Sat 23:59 · 9 going</div></div>
    <div class="wsm" style="background:#7C3BED;color:#fff;position:relative;overflow:hidden"><div style="font:700 11px var(--ui);opacity:.85">Capsule opens</div><div class="dsp" style="font-size:36px;margin-top:8px">07:48</div><div style="font-size:11px;opacity:.85">Sun 10:12 · 23 photos</div><span style="position:absolute;right:-8px;bottom:-10px">${SV('cam', 56, -12)}</span></div>
  </div>
  <div class="wmd"><div class="row" style="font:700 11px var(--ui);color:#B49BFF">WHO'S OUT TONIGHT<span class="sp"></span><span style="color:#8F8E88">4 friends</span></div><div class="row" style="gap:10px;margin-top:10px">${[['jonas', 'spritz', 'drinks'], ['marie', 'sneaker', 'dancing'], ['timo', 'disco', 'out out'], ['nina', 'couch', 'chill']].map((f) => `<div style="flex:1;text-align:center;position:relative"><img class="av" src="${AV(f[0])}" alt="" width="46" height="46" style="margin:0 auto;border:2px solid #7C3BED"><span style="position:absolute;right:2px;top:-8px">${SV(f[1], 24, 8)}</span><div style="font-size:11px;font-weight:600;margin-top:4px">${f[2]}</div></div>`).join('')}</div></div>`;
SCREENS.home = { label: 'Home screen — widgets', section: 'Home screen', tag: 'nat', render: () => `<div style="position:absolute;inset:0;${wall};color:#fff">${statusBar(1)}
  <div style="padding:8px 18px 0">${widgets}</div>
  <div class="hg">${icons(7)}<button class="hi" data-go="homeqa">${appIcon()}<i>I am (IN)</i></button></div>
  <div class="hdock">${['#34C759', '#0A84FF', '#F2F2F7', '#FF375F'].map((c) => `<span style="background:${c}"></span>`).join('')}</div>
  <div style="position:absolute;left:0;right:0;bottom:118px;text-align:center;font-size:12px;opacity:.75">Tap the I am (IN) icon to see the long-press menu</div>
  <style>
  .hw2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .wsm{height:158px;border-radius:24px;padding:14px;display:flex;flex-direction:column}
  .wmd{margin-top:14px;border-radius:24px;padding:14px;background:rgba(20,16,30,.72);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
  .hg{display:grid;grid-template-columns:repeat(4,1fr);gap:18px 0;padding:22px 18px 0}
  .hi{display:flex;flex-direction:column;align-items:center;gap:5px;color:#fff}
  .hi>span{width:62px;height:62px;border-radius:16px;display:block}
  .hi i{font-style:normal;font-size:11.5px}
  .hdock{position:absolute;left:14px;right:14px;bottom:calc(20px + env(safe-area-inset-bottom,0px));height:86px;border-radius:30px;background:rgba(255,255,255,.18);backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:space-around}
  .hdock span{width:60px;height:60px;border-radius:16px;display:block}
  </style></div>` };
SCREENS.homeqa = { label: 'Home screen — quick actions', section: 'Home screen', tag: 'nat', render: () => `<div style="position:absolute;inset:0;${wall};color:#fff">${statusBar(1)}
  <div style="padding:8px 18px 0;filter:blur(10px);opacity:.6">${widgets}</div>
  <div style="position:absolute;inset:0;background:rgba(10,8,20,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)" data-go="home"></div>
  <div style="position:absolute;left:24px;top:612px">${appIcon(1)}</div>
  <div class="qam">
    ${[['Add from screenshot', 'Pick a flyer — we fill it in', 'ImagePlus', 'add'], ["Who's out tonight", '4 friends', 'Users', 'feed'], ['Open my capsule', 'Opens 10:12', 'Archive', 'capsule'], ['New plan', '', 'Plus', 'addform']].map((q, k) => `<button class="qa" data-go="${q[3]}" style="${k == 3 ? 'border-top:8px solid rgba(0,0,0,.08)' : ''}"><span style="flex:1;text-align:left"><span style="display:block;font-size:16.5px">${q[0]}</span>${q[1] ? `<span style="display:block;font-size:14px;color:#6b6b70;margin-top:2px">${q[1]}</span>` : ''}</span>${I(q[2], 22)}</button>`).join('')}
    <button class="qa" style="border-top:8px solid rgba(0,0,0,.08)" data-toast="Opens the feedback form"><span style="flex:1;text-align:left"><span style="display:block;font-size:16.5px">Something wrong?</span><span style="display:block;font-size:14px;color:#6b6b70;margin-top:2px">Tell us before deleting</span></span>${I('Heart', 22)}</button>
  </div>
  <style>.qam{position:absolute;left:24px;right:24px;top:252px;border-radius:24px;background:rgba(240,240,245,.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);color:#0B0B0A;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.4);animation:pop .25s both;transform-origin:20% 100%}.qa{display:flex;align-items:center;gap:12px;width:100%;padding:14px 18px;border-top:1px solid rgba(0,0,0,.1)}.qa:first-child{border-top:0}</style></div>` };
})();
