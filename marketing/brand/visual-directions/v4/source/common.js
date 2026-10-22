// Shared helpers for the v4 screens (variation 3 look, Phosphor icons, big stickers).
document.getElementById('defs').innerHTML = DEFS;
S.in = S.in.replace('#D8FF3D', '#7C3BED').replace('fill="#0B0B0A"', 'fill="#fff"');

// Phosphor icon: weight regular | fill | bold
const P = (n, s = 20, w = 'regular', st = '') => {
  const src = (PH[w] && PH[w][n]) || PH.regular[n];
  if (!src) console.warn('missing icon', n);
  return `<svg class="pi" viewBox="0 0 256 256" style="width:${s}px;height:${s}px;${st}">${src || ''}</svg>`;
};
// Sticker (keep >= 32px; smaller jobs use icons)
const ST = (n, s = 48, r = 0, st = '') =>
  `<svg class="st" viewBox="-10 -10 120 120" style="width:${s * 1.2}px;height:${s * 1.2}px;margin:${-s * 0.1}px;transform:rotate(${r}deg);${st}"><g filter="url(#cut)">${S[n]}</g></svg>`;
const A = (x) => `../a/av_${x}.jpg`;
const IMG = (x) => `../a/${x}`;
const avs = (a, s = 24) => `<span style="display:flex">${a.map((x) => `<img class="av" style="width:${s}px;height:${s}px" src="${A(x)}">`).join('')}</span>`;

const status = `<div class="status"><span>9:41</span><span style="display:flex;gap:6px;align-items:center"><svg width="18" height="12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5" width="3" height="7" rx="1" fill="currentColor"/><rect x="10" y="2" width="3" height="10" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg><svg width="27" height="13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2.5" y="2.5" width="17" height="8" rx="2" fill="currentColor"/></svg></span></div>`;
const LOGO = `<span class="logo">I am <i>(</i>IN<i>)</i></span>`;
const header = `<div class="hdr">${LOGO}<span class="hic"><span class="hb">${P('users', 21)}</span><span class="hb">${P('magnifying-glass', 21)}</span><span class="hb">${P('bell', 21)}<span class="badge">3</span></span><span class="hb">${P('gear', 21)}</span></span></div>`;
const NAV = [['squares-four', 'Feed', 'feed'], ['calendar-dots', 'Calendar', 'cal'], null, ['archive', 'Capsule', 'cap'], ['user', 'Profile', 'me']];
const nav = (on) => `<div class="fade"></div><div class="nav">${NAV.map((x) => x ? `<span class="it ${on == x[2] ? 'on' : ''}">${P(x[0], 23, on == x[2] ? 'fill' : 'regular')}${x[1]}</span>` : `<span class="add"><b>${P('plus', 24, 'bold')}</b>Add</span>`).join('')}</div>`;

// Full page (flows; height grows with content)
const page = (t, id, body, on, opt = {}) =>
  `<div class="ph ${t}" id="${id}-${t}" style="${opt.h ? `height:${opt.h}px;padding-bottom:0;` : ''}">${status}${opt.noHeader ? '' : header}${body}${on === false ? '' : nav(on)}</div>`;

// Bottom sheet over a dimmed page
const sheet = (t, id, under, body, opt = {}) => {
  const top = opt.top ?? 96, h = opt.h ?? 844;
  return `<div class="ph ${t}" id="${id}-${t}" style="height:${h}px;padding-bottom:0">${status}${header}<div style="opacity:.5">${under || ''}</div>
  <div class="abs" style="inset:0;background:rgba(0,0,0,${t == 'd' ? .6 : .35});z-index:20"></div>
  <div class="abs sheetp" style="top:${top}px;z-index:21">${opt.noHandle ? '' : '<div class="handle"></div>'}${body}</div></div>`;
};
// Dialog in the middle of a dimmed page
const dialog = (t, id, under, body) => `<div class="ph ${t}" id="${id}-${t}" style="height:844px;padding-bottom:0">${status}${header}<div style="opacity:.5">${under || ''}</div>
  <div class="abs" style="inset:0;background:rgba(0,0,0,${t == 'd' ? .6 : .35});z-index:20"></div>
  <div class="abs dlg" style="z-index:21">${body}</div></div>`;

const H1 = (txt, size = 46, extra = '') => `<div class="dsp" style="font-size:${size}px;padding:8px 20px 0;${extra}">${txt}</div>`;
const sec = (icon, label, body, right = '', st = '') => `<div class="sec" style="${st}"><div class="sech">${icon ? P(icon, 17) : ''}<span class="meta">${label}</span><span style="flex:1"></span>${right}</div>${body}</div>`;
const fld = (k, v, icon = '', ph = false) => `<div class="fld"><span class="k">${k}</span><span class="v">${ph ? `<span class="ph2">${v}</span>` : v}${icon ? P(icon, 18, 'regular', 'color:var(--mute)') : ''}</span></div>`;
const tog = (on = true) => `<span class="tog ${on ? '' : 'off'}"></span>`;
const pill = (cls, txt, icon = '', st = '') => `<span class="pill ${cls}" style="${st}">${icon ? P(icon, 18, cls == 'pp' ? 'bold' : 'regular') : ''}${txt}</span>`;
const ACTW = (n) => ['check', 'x', 'plus', 'question', 'caret-left', 'caret-right'].includes(n) ? 'bold' : 'fill';
const seg = (opts, on, st = '', onCls = 'on') => `<div class="seg" style="${st}">${opts.map((o, i) => `<span class="${i == on ? onCls : ''}">${Array.isArray(o) ? P(o[0], 17, i == on ? ACTW(o[0]) : 'regular') + o[1] : o}</span>`).join('')}</div>`;
const meta = (txt, st = '') => `<span class="meta" style="${st}">${txt}</span>`;
const tagBadge = (txt, icon) => `<span class="abs meta" style="left:10px;top:10px;height:24px;border-radius:999px;padding:0 9px;display:flex;align-items:center;gap:5px;background:var(--p);color:#fff;font-size:10px;letter-spacing:.03em">${icon ? P(icon, 13, 'bold') : ''}${txt}</span>`;
