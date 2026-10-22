// ADD: entry with fanned screenshots, the form, and the event art studio (Sleeve-style)
(() => {
const art = { bg: 'purple', stickers: ['pizza', 'spritz'], text: 'bold', shadow: 'subtle', light: 'spot', base: 'wood', wood: 'mahogany', photo: false };
const BGS = { purple: 'linear-gradient(140deg,#7C3BED,#B44FE0)', pink: 'linear-gradient(140deg,#FF5FA8,#FF9F6B)', night: 'linear-gradient(140deg,#0B0B0A,#3A1C78)', lime: 'linear-gradient(140deg,#D8FF3D,#7EE787)', sky: 'linear-gradient(140deg,#3B6CFF,#7FD3FF)' };
const WOODS = { maple: ['#F2CF95', '#D9A964'], mahogany: ['#D9824A', '#9C4A22'], walnut: ['#8A5532', '#4E2C17'] };

const artFace = (size) => `<div class="artf" style="width:${size}px;height:${size}px;background:${art.photo ? `url('${A('f2.jpg')}') center/cover` : BGS[art.bg]}">
  ${art.stickers.map((s, k) => `<span style="position:absolute;left:${[8, 52, 30][k % 3]}%;top:${[10, 22, 50][k % 3]}%">${SV(s, size * .3, [-12, 10, -4][k % 3])}</span>`).join('')}
  ${art.text != 'none' ? `<span class="artt" style="font-family:${art.text == 'bold' ? 'var(--dsp)' : 'var(--ui)'};font-weight:${art.text == 'bold' ? 400 : 700};font-size:${size * (art.text == 'bold' ? .17 : .12)}px;text-transform:${art.text == 'bold' ? 'uppercase' : 'none'}">Supperclub</span>` : ''}
  ${art.light == 'spot' ? '<i class="lspot"></i>' : art.light == 'glare' ? '<i class="lglare"></i>' : ''}
</div>`;
const STUDIO_CSS = `<style>
  .pv{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:270px;padding-bottom:6px;border-radius:24px;background:radial-gradient(120% 90% at 20% 10%,#A98BFF 0%,transparent 55%),radial-gradient(120% 90% at 90% 90%,#D8FF3D 0%,transparent 50%),radial-gradient(100% 100% at 80% 20%,#FF5FA8 0%,transparent 55%),#3B2A7A}
  .pvin{position:relative;z-index:2;margin-bottom:-14px}
  .artf{position:relative;border-radius:16px;overflow:hidden;display:flex;align-items:flex-end;justify-content:center}
  .artt{position:relative;z-index:2;color:#fff;padding:0 8px 12px;line-height:.9;text-shadow:0 2px 10px rgba(0,0,0,.25)}
  .lspot{position:absolute;inset:0;background:radial-gradient(circle at 30% 22%,rgba(255,255,255,.55),transparent 45%);mix-blend-mode:screen}
  .lglare{position:absolute;inset:-20%;background:linear-gradient(120deg,transparent 40%,rgba(255,255,255,.55) 48%,transparent 56%)}
  .base{height:30px;border-radius:5px;box-shadow:0 14px 24px rgba(0,0,0,.35),inset 0 2px 0 rgba(255,255,255,.35)}
  .pvwrap{margin:4px 16px 0;flex:none}
  .pvcap{text-align:center;font:500 10.5px var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--mute);margin:8px 0 2px}
  .sth{font-weight:700;font-size:15px;margin:16px 4px 8px}
  .tl3{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:var(--s1);border:1px solid var(--line);border-radius:20px;padding:10px}
  .ot{display:flex;flex-direction:column;align-items:center;gap:6px}
  .otf{width:100%;aspect-ratio:1.15;border-radius:14px;background:var(--s2);border:3px solid transparent;display:flex;align-items:center;justify-content:center;color:var(--mute)}
  .ot[aria-pressed="true"] .otf{border-color:var(--p);background:var(--pSoft)}
  .otl{font-size:12.5px;font-weight:600;padding:2px 8px;border-radius:999px}
  .ot[aria-pressed="true"] .otl{background:var(--p);color:#fff}
  .sw{width:38px;height:38px;border-radius:10px;display:block}
  .sq{width:36px;height:36px;border-radius:9px;background:#fff;display:block}
  </style>`;
const SH = { none: 'none', subtle: '0 10px 22px rgba(0,0,0,.25)', regular: '0 18px 34px rgba(0,0,0,.35)', deep: '0 30px 50px rgba(0,0,0,.5)' };
const preview = (size = 210) => { const w = WOODS[art.wood];
  const base = art.base == 'none' ? '' : `<div class="base" style="width:${size + 40}px;background:${art.base == 'wood' ? `repeating-linear-gradient(92deg,rgba(0,0,0,.08) 0 2px,transparent 2px 9px),linear-gradient(${w[0]},${w[1]})` : art.base == 'metal' ? 'linear-gradient(#F2F2F2,#9EA3A8)' : 'linear-gradient(#FFFFFF,#E4E2DB)'}"></div>`;
  return `<div class="pv"><div class="pvin" style="filter:drop-shadow(${SH[art.shadow] == 'none' ? '0 0 0 transparent' : SH[art.shadow].replace(/,\s*$/, '')})">${artFace(size)}</div>${base}</div>`; };

/* ---------- entry ---------- */
SCREENS.add = { label: 'Add — drop flyers', section: 'Add', tag: 'upd', nav: 'add', render: () => `${statusBar()}${header()}
  <div class="scroll">
  <div class="dsp" style="font-size:44px;padding:4px 20px 0">Add a plan</div>
  <div class="seg" style="margin:14px 16px 0"><button data-seg aria-pressed="true">${I('Camera', 17)}Photo</button><button data-seg aria-pressed="false" data-toast="Paste a link — same flow as today.">${I('Link', 17)}URL</button><button data-seg aria-pressed="false" data-go="addform">${I('PenTool', 17)}Manual</button></div>
  <div class="dz">
    <div class="dsp" style="font-size:40px;text-align:center;color:var(--pt)">Add flyers</div>
    <div class="fan">
      <button class="fanc" data-go="addform" data-p='{"from":"midnight"}' style="transform:rotate(-14deg) translate(-96px,22px)"><img src="${A('fl_midnight.jpg')}" alt="Midnight Service screenshot"></button>
      <button class="fanc" data-go="addform" data-p='{"from":"queer"}' style="transform:rotate(12deg) translate(96px,22px)"><img src="${A('fl_queer.jpg')}" alt="Queerfeminist Night screenshot"></button>
      <button class="fanplus" data-toast="Opens your photos — pick up to 10 screenshots.">${I('Plus', 54, 2.2)}</button>
    </div>
  </div>
  <p style="margin:14px 22px 0;font-size:15px;line-height:1.45"><b>Fastest way in.</b> <span class="mute">Drop a flyer or screenshot and the AI fills the event out for you — drop several and each becomes its own event.</span></p>
  <div class="flab" style="padding:18px 20px 8px">Recent screenshots · tap to import</div>
  <div class="row" style="gap:8px;padding:0 16px;overflow-x:auto;scrollbar-width:none">${['fl_alles.jpg', 'fl_desterradxs.jpg', 'fl_razzia.jpg', 'f3.jpg', 'f4.jpg'].map((f) => `<button data-go="addform" style="flex:none;width:76px;height:118px;border-radius:14px;overflow:hidden;border:1px solid var(--line)"><img src="${A(f)}" alt="" style="width:100%;height:100%;object-fit:cover"></button>`).join('')}</div>
  <div class="card" style="margin:16px 16px 0;padding:16px"><div class="flab" style="margin-bottom:10px">How it works</div>${[['Drop the flyer', 'A poster, a story screenshot, a group-chat invite — anything.'], ['AI reads it', 'Title, date, time, venue and vibe are detected automatically.'], ['Review & post', 'Tweak anything that looks off, then create — solo or in a batch.']].map((s, i) => `<div class="row" style="align-items:flex-start;padding:7px 0"><span class="dsp" style="font-size:30px;color:var(--pt);width:20px">${i + 1}</span><div><div style="font-weight:700;font-size:15px">${s[0]}</div><div class="mute" style="font-size:13px;margin-top:2px">${s[1]}</div></div></div>`).join('')}</div>
  </div>${nav('add')}
  <style>
  .dz{margin:16px 16px 0;border:2.5px dashed var(--line2);border-radius:30px;padding:22px 0 0;overflow:hidden}
  .fan{position:relative;height:200px;display:flex;justify-content:center;align-items:flex-end}
  .fanc{position:absolute;bottom:-20px;width:136px;height:180px;border-radius:18px;overflow:hidden;border:4px solid var(--s1);box-shadow:0 14px 30px rgba(0,0,0,.25)}
  .fanc img{width:100%;height:100%;object-fit:cover}
  .fanplus{position:relative;z-index:2;width:140px;height:186px;margin-bottom:-24px;border-radius:24px;background:var(--s3);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 30px rgba(0,0,0,.25)}
  </style>` };

/* ---------- form ---------- */
const VIB = [['popper', 'party'], ['cake', 'birthday'], ['croissant', 'brunch'], ['pizza', 'dinner'], ['spritz', 'drinks'], ['vinyl', 'concert'], ['disco', 'club'], ['tent', 'festival'], ['popcorn', 'cinema'], ['ball', 'sports'], ['sun', 'day event']];
const sec = (icon, label, body, right = '') => `<div class="card" style="margin:10px 16px 0;padding:16px"><div class="row" style="gap:7px;margin-bottom:12px"><span style="color:var(--pt)">${I(icon, 16)}</span><span class="flab" style="color:var(--ink)">${label}</span><span class="sp"></span>${right}</div>${body}</div>`;
const fld = (k, v, icon, ph) => `<div class="field" style="flex-direction:column;align-items:stretch;justify-content:center;gap:0;padding:8px 14px"><span class="flab">${k}</span><span class="row" style="justify-content:space-between;font-weight:600;font-size:15.5px;margin-top:2px;${ph ? 'color:var(--mute);font-weight:500' : ''}">${v}${icon ? I(icon, 17, 2, 'color:var(--mute)') : ''}</span></div>`;
SCREENS.addform = { label: 'Add — the form', section: 'Add', tag: 'old', render: () => `${statusBar()}${back('New plan', 'add')}
  <div class="scroll" style="padding-bottom:40px">
  ${sec('Image', 'Event art', `<button data-go="studio" style="display:block;width:100%">${preview(170)}</button><div class="row" style="gap:8px;margin-top:12px"><button class="pill pp" style="flex:1;height:44px" data-go="studio">${I('Palette', 17)}Design the art</button><button class="pill pg" style="flex:1;height:44px" data-toast="Pick a photo (same as today).">${I('Image', 17)}Use a photo</button></div>`)}
  ${sec('Tag', 'The basics', fld('Event name*', "Supperclub at Marie's"))}
  ${sec('CalendarDays', 'When & where', `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${fld('Start date*', 'Oct 22, 2026', 'CalendarDays')}${fld('End date', 'Date', 'CalendarDays', 1)}${fld('Start time', '8:00 PM', 'Clock')}${fld('End time', 'End', 'Clock', 1)}</div><div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">${fld('Venue / address', "Marie's place, Westend")}${fld('City*', 'Stuttgart', 'MapPin')}</div>`)}
  ${sec('Sparkles', 'Vibe', `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${VIB.map((v) => `<button class="vt" aria-pressed="${v[1] == 'dinner'}" data-vt>${SV(v[0], 34, -5)}${v[1]}</button>`).join('')}</div>`)}
  ${sec('FileText', 'Description', `<div class="field" style="min-height:90px;align-items:flex-start;padding:12px 14px;font-size:15px;line-height:1.4">Pasta, natural wine and one long table. Bring your best story from this week.</div><div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px"><button class="pill ppt" style="height:36px;font-size:13px">${I('Sparkles', 15)}Generate</button><button class="pill pg" style="height:36px;font-size:13px">${I('PenTool', 15)}Improve</button></div>`, '<span class="mute" style="font-size:12px">optional</span>')}
  ${sec('Lock', 'Who can see it', `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${[['Eye', 'Public'], ['Users', 'Circle', 1], ['Lock', 'List'], ['EyeOff', 'Ghost']].map((x) => `<button class="vt" style="height:64px" aria-pressed="${!!x[2]}" data-vt>${I(x[0], 20)}${x[1]}</button>`).join('')}</div><div class="mute" style="font-size:13px;margin-top:10px"><b style="color:var(--ink)">Circle</b> — Visible only to your mutual friends. Won't appear on the public feed.</div>`)}
  ${sec('Users', 'Who should be in', `${['marie', 'jonas', 'timo', 'nina'].map((a, k) => `<div class="row" style="padding:7px 0"><img class="av" src="${AV(a)}" alt="" width="36" height="36"><span style="flex:1;font-weight:600">${F[a]}</span><span style="width:24px;height:24px;border-radius:50%;${k < 2 ? 'background:var(--p);color:#fff' : 'border:2px solid var(--line2)'};display:flex;align-items:center;justify-content:center">${k < 2 ? I('Check', 14, 3) : ''}</span></div>`).join('')}`, '<span style="font-size:12.5px;color:var(--pt);font-weight:700">2 selected</span>')}
  ${sec('Users', 'Co-host', `<div class="field" style="color:var(--mute);font-size:14px">${I('Search', 17)}Search friends to add as co-host</div>`, '<span class="mute" style="font-size:12px">optional</span>')}
  ${sec('Package', 'Bring what?', `<div class="mute" style="font-size:13px">Let attendees claim items to bring (snacks, speaker, ball…)</div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:10px">${['Wine ×', 'Bread ×', '+ Speaker', '+ Ice'].map((x, k) => `<span class="pill ${k < 2 ? 'pp' : 'po'}" style="height:34px;font-size:13px;padding:0 12px">${x}</span>`).join('')}</div>`, '<button class="tog" aria-pressed="true" aria-label="Bring list"></button>')}
  ${sec('Check', 'Your RSVP', `<div class="seg p"><button data-seg aria-pressed="false">${I('HelpCircle', 16)}Maybe</button><button data-seg aria-pressed="true">${I('Check', 16, 2.6)}I am in</button></div>`)}
  <div style="margin:16px 16px 0"><button class="pill pp" style="width:100%;height:56px;font-size:17px" data-go="event" data-p='{"id":"supper"}'>Create event</button></div>
  </div>${STUDIO_CSS}
  <style>.vt{height:80px;border-radius:16px;background:var(--bg);border:1.5px solid var(--line2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:12px;font-weight:600}.vt[aria-pressed="true"]{background:var(--p);border-color:var(--p);color:#fff}</style>`,
  mount: (el) => { el.addEventListener('click', (e) => { const v = e.target.closest('[data-vt]'); if (v) v.parentElement.querySelectorAll('[data-vt]').forEach((b) => b.setAttribute('aria-pressed', b === v)); }); } };

/* ---------- event art studio ---------- */
const tiles = (key, opts) => `<div class="tl3">${opts.map(([v, label, face]) => `<button class="ot" data-k="${key}" data-v="${v}" aria-pressed="${art[key] == v}"><span class="otf">${face}</span><span class="otl">${label}</span></button>`).join('')}</div>`;
const studioBody = () => `
  <div class="pvwrap">${preview(196)}<div class="pvcap">How it shows in the feed</div></div>
  <div class="scroll" style="padding:4px 16px 40px">
    <div class="sth">Background</div>${tiles('bg', [['purple', 'Purple', '<i class="sw" style="background:' + BGS.purple + '"></i>'], ['pink', 'Pink', '<i class="sw" style="background:' + BGS.pink + '"></i>'], ['night', 'Night', '<i class="sw" style="background:' + BGS.night + '"></i>'], ['lime', 'Lime', '<i class="sw" style="background:' + BGS.lime + '"></i>']])}
    <div class="sth">Stickers</div><div class="tl3" style="grid-template-columns:repeat(5,1fr)">${['pizza', 'spritz', 'disco', 'heart', 'spark', 'flame', 'moon', 'popper', 'cake', 'vinyl'].map((s) => `<button class="ot" data-stk="${s}" aria-pressed="${art.stickers.includes(s)}"><span class="otf">${SV(s, 34)}</span></button>`).join('')}</div>
    <div class="sth">Text</div>${tiles('text', [['none', 'None', I('Ban' in LUCIDE ? 'Ban' : 'X', 26)], ['bold', 'Poster', '<b style="font:24px var(--dsp)">AA</b>'], ['clean', 'Clean', '<b style="font:700 22px var(--ui)">Aa</b>']])}
    <div class="sth">Frame & shadow</div>${tiles('shadow', [['none', 'None', I('X', 26)], ['subtle', 'Subtle', '<i class="sq" style="box-shadow:0 4px 8px rgba(0,0,0,.2)"></i>'], ['regular', 'Regular', '<i class="sq" style="box-shadow:0 8px 14px rgba(0,0,0,.3)"></i>'], ['deep', 'Deep', '<i class="sq" style="box-shadow:0 12px 20px rgba(0,0,0,.45)"></i>']])}
    <div class="sth">Lighting</div>${tiles('light', [['none', 'None', I('X', 26)], ['spot', 'Spotlight', '<i class="sq" style="background:radial-gradient(circle at 35% 30%,#fff,#bbb)"></i>'], ['glare', 'Glare', '<i class="sq" style="background:linear-gradient(135deg,#ccc 40%,#fff 50%,#ccc 60%)"></i>']])}
    <div class="sth">Base</div>${tiles('base', [['none', 'None', I('X', 26)], ['wood', 'Wood', '<i class="sq" style="background:linear-gradient(#D9824A,#9C4A22)"></i>'], ['metal', 'Metal', '<i class="sq" style="background:linear-gradient(#F2F2F2,#9EA3A8)"></i>'], ['plain', 'Plain', '<i class="sq" style="background:linear-gradient(135deg,#fff 50%,#111 50%)"></i>']])}
    ${art.base == 'wood' ? tiles('wood', Object.entries(WOODS).map(([k, c]) => [k, k[0].toUpperCase() + k.slice(1), `<i class="sq" style="background:linear-gradient(${c[0]},${c[1]})"></i>`])) : ''}
  </div>`;
SCREENS.studio = { label: 'Event art studio', section: 'Add', tag: 'new', render: () => `${statusBar()}
  <div class="row" style="padding:2px 14px 6px;flex:none"><button class="pill pg" style="height:38px;font-size:13.5px" data-go="addform">Cancel</button><span class="sp"></span><span style="font-weight:700">Event art</span><span class="sp"></span><button class="pill pp" style="height:38px;font-size:13.5px" data-go="addform">${I('Check', 15, 2.6)}Done</button></div>
  <div id="stb" style="flex:1;min-height:0;display:flex;flex-direction:column">${studioBody()}</div>
  ${STUDIO_CSS}`,
  mount: (el) => { el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-k]'); const s = e.target.closest('[data-stk]');
    if (t) art[t.dataset.k] = t.dataset.v; else if (s) { const k = s.dataset.stk; art.stickers = art.stickers.includes(k) ? art.stickers.filter((x) => x != k) : [...art.stickers, k].slice(-3); } else return;
    const sc = el.querySelector('#stb .scroll').scrollTop; el.querySelector('#stb').innerHTML = studioBody(); el.querySelector('#stb .scroll').scrollTop = sc;
  }); } };
})();
