// FEED + subpages
(() => {
const tabs = `<div style="display:flex;align-items:center;padding:6px 16px 0 20px;gap:20px;font-weight:600;font-size:15px"><span style="position:relative">Inner Circle<i style="position:absolute;left:50%;bottom:-8px;width:4px;height:4px;border-radius:50%;background:var(--p);margin-left:-2px"></i></span><span style="color:var(--mute)">City Pulse</span><span style="flex:1"></span><span class="hb" style="width:36px;height:36px">${P('dice-five', 22)}</span><span class="hb" style="width:36px;height:36px">${P('sliders-horizontal', 22)}<span class="badge" style="top:0;right:0">2</span></span></div>`;
const bub = (img, name, tag, st, ring, wave) => `<div style="width:66px;text-align:center;flex:none"><div style="position:relative;width:58px;height:58px;margin:0 auto"><img src="${A(img)}" style="width:58px;height:58px;border-radius:50%;object-fit:cover;border:2.5px solid ${ring ? 'var(--p)' : 'color-mix(in srgb,var(--p) 40%,transparent)'};padding:2px;background:var(--bg)">${st ? `<span class="abs" style="right:-14px;bottom:-10px">${ST(st, 34, 8)}</span>` : ''}${wave ? `<span class="abs" style="left:-6px;top:-6px;width:22px;height:22px;border-radius:50%;background:var(--p);color:#fff;display:flex;align-items:center;justify-content:center">${P('hand-waving', 13, 'fill')}</span>` : ''}</div><div style="font-weight:600;font-size:12.5px;margin-top:8px">${name}</div><div class="meta" style="font-size:9.5px;color:var(--pt);margin-top:1px;white-space:nowrap">${tag}</div></div>`;
const today = `<div style="display:flex;align-items:flex-start;gap:4px;padding:16px 0 0 18px">
   <span style="font-weight:600;font-size:13px;color:var(--mute);width:44px;margin-top:20px">Today</span>
   <div style="width:66px;text-align:center;flex:none"><div style="width:58px;height:58px;margin:0 auto;border-radius:50%;border:2px dashed var(--line2);display:flex;align-items:center;justify-content:center;color:var(--pt)">${P('plus', 22, 'bold')}</div><div style="font-weight:600;font-size:12.5px;margin-top:8px">Your mood</div></div>
   ${bub('jonas', 'Jonas', 'drinks', 'spritz', 1)}${bub('timo', 'Timo', 'at Razzia', '', 0)}${bub('marie', 'Marie', 'Westend', 'sneaker', 1, 1)}${bub('nina', 'Nina', 'chill', 'couch', 1)}
 </div>`;
const deck = `
 <div class="abs" style="top:276px;left:40px;right:40px;height:50px;border-radius:22px;background:var(--s1);border:1px solid var(--line);opacity:.45;transform:perspective(600px) rotateX(-10deg) scale(.9);filter:brightness(.7)"></div>
 <div class="abs" style="top:712px;left:36px;right:36px;height:80px;border-radius:24px;background:var(--s1);border:1px solid var(--line);transform:perspective(600px) rotateX(8deg) scale(.92);filter:brightness(.75);padding:14px 18px;display:flex;justify-content:space-between;font-weight:600;font-size:15px"><span>Supperclub at Marie's</span>${meta('Sat, Oct 24', 'font-size:12px')}</div>
 <div class="abs" style="top:292px;left:14px;right:14px;height:432px;background:var(--s1);border:1px solid var(--line);border-radius:26px;box-shadow:0 18px 40px rgba(124,59,237,.18),var(--shadow);z-index:3">
   <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 18px 12px"><span style="font-weight:600;font-size:16px">Razzia · 4th anniversary</span>${meta('Today', 'font-size:12px')}</div>
   <div style="margin:0 10px;height:312px;border-radius:18px;overflow:hidden;position:relative;background:#000"><img src="${IMG('fl_razzia_clean.png')}" style="width:100%;height:100%;object-fit:cover;object-position:50% 40%">
     ${tagBadge('Inner circle', 'users')}
     <span class="abs" style="left:10px;bottom:10px;height:28px;border-radius:999px;padding:0 11px 0 8px;display:flex;align-items:center;gap:4px;background:rgba(0,0,0,.6);color:#fff;font-size:12px;font-weight:500">${P('map-pin', 15, 'fill')}Romantica</span>
     <span class="abs" style="right:6px;bottom:2px;display:flex;align-items:flex-end">${ST('flame', 38, -8)}${ST('eyes', 36, 6, 'margin-left:-14px')}<span style="height:22px;min-width:22px;border-radius:11px;background:#fff;color:#0B0B0A;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 0 6px -6px;padding:0 5px">5</span></span>
   </div>
   <div style="display:flex;align-items:center;padding:12px 12px 0 16px;gap:6px">${avs(['marie', 'timo', 'jonas'])}<span style="height:24px;min-width:24px;border-radius:12px;background:var(--p);color:#fff;font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 5px;margin-left:-7px;border:2px solid var(--s1)">+4</span>${meta('9', 'margin-left:2px')}<span style="flex:1"></span>${pill('pg', 'Maybe', 'question', 'height:38px;padding:0 14px')}${pill('pp', "I'm in", 'check', 'height:38px;padding:0 14px')}</div>
 </div>`;
const feedMain = (t) => page(t, 'feed', tabs + today + deck, 'feed', { h: 844 });
const under = (t) => tabs + today;

// F2 Your mood (GoingOutSheet)
const mood = (t) => sheet(t, 'mood', under(t), `
  <div style="padding:0 22px">${H1('Weekend vibe', 40, 'padding:0')}<div class="hint" style="margin-top:8px">Let your circle know what's your vibe for today.</div></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:18px 18px 0">
   ${[['spritz', 'Drinks', 1], ['sneaker', 'Dancing'], ['couch', 'Chill hang'], ['ball', 'Sport'], ['sun', 'Day event']].map((v) => `<div class="tile ${v[2] ? 'on' : ''}" style="height:118px">${ST(v[0], 54, -6)}${v[1]}</div>`).join('')}
  </div>
  <div style="padding:22px 22px 0"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:600;font-size:15px">Show until</span><span class="pill ppt" style="height:30px;font-size:13px;font-family:'JetBrains Mono'">02:00</span></div>
   <div style="height:6px;border-radius:3px;background:var(--s3);margin-top:14px;position:relative"><div style="width:62%;height:100%;border-radius:3px;background:var(--p)"></div><i class="abs" style="left:62%;top:-8px;width:22px;height:22px;margin-left:-11px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></i></div></div>
  <div style="padding:20px 22px 0">${fld('Where? (optional)', 'Westend')}<div class="hint" style="margin-top:6px;display:flex;align-items:center;gap:6px">${P('map-pin', 15)}No GPS — only what you type</div></div>
  <div style="padding:20px 22px 0;display:flex;flex-direction:column;gap:10px">${pill('pp', 'Add to the feed', '', 'height:54px;font-size:16px')}${pill('pg', 'Remove from the feed', '', 'height:48px')}<div class="hint" style="text-align:center;display:flex;align-items:center;justify-content:center;gap:6px">${P('lock-simple', 15)}Only mutual friends see this</div></div>
`, { top: 104 });

// F3 Friend bubble drawer
const friend = (t) => sheet(t, 'friend', under(t), `
  <div style="padding:6px 22px 0;display:flex;align-items:center;gap:16px"><div style="position:relative"><img src="${A('marie')}" style="width:92px;height:92px;border-radius:50%;object-fit:cover;border:3px solid var(--p);padding:3px;background:var(--sheet)"><span class="abs" style="right:-22px;bottom:-14px">${ST('sneaker', 56, 8)}</span></div>
   <div style="margin-left:14px"><div class="dsp" style="font-size:34px">Marie</div><div style="font-size:14px;color:var(--mute);margin-top:6px">Dancing · Westend</div>${meta('until 02:00', 'display:block;margin-top:4px;color:var(--pt)')}</div></div>
  <div style="margin:22px 16px 0;border-radius:22px;background:color-mix(in srgb,var(--p) 14%,transparent);border:1.5px solid color-mix(in srgb,var(--p) 40%,transparent);padding:16px;display:flex;align-items:center;gap:14px">${ST('hey', 58, -8)}<div><div style="font-weight:700;font-size:15.5px">Marie waved at you</div><div class="hint" style="margin-top:2px">Wave back so she knows you're up for it.</div></div></div>
  <div style="margin:12px 16px 0" class="lrow"><img class="thumb" src="${IMG('fl_razzia_clean.png')}"><div style="flex:1"><div class="tt">At Razzia · 4th anniversary</div><div class="sub">${P('map-pin', 14)}Romantica · 23:59</div></div><span style="color:var(--pt);font-weight:700;font-size:14px;white-space:nowrap">Open event</span></div>
  <div style="padding:22px 16px 0;display:flex;gap:10px">${pill('pp', 'Wave', 'hand-waving', 'flex:1;height:52px')}${pill('pg', 'View profile', 'user', 'flex:1;height:52px')}</div>
`, { top: 330 });

// F4 Roulette (result)
const roulette = (t) => sheet(t, 'roulette', under(t), `
  <div style="padding:0 22px">${H1("Can't decide?", 40, 'padding:0')}<div class="hint" style="margin-top:8px">Let the dice pick your night.</div></div>
  <div style="margin:18px 16px 0;border-radius:28px;background:var(--bg);border:1px solid var(--line);padding:18px;position:relative">
    <div class="abs" style="right:6px;top:-30px">${ST('dice', 92, 12)}</div>
    <div style="font-size:16px;font-weight:600"><span style="color:var(--pt)">The dice say:</span> Marie is in</div>
    <div style="margin-top:14px;height:240px;border-radius:20px;overflow:hidden;position:relative"><img src="${IMG('fl_alles.png')}" style="width:100%;height:100%;object-fit:cover"></div>
    <div style="font-weight:700;font-size:20px;margin-top:14px">Alles offen 26</div>
    <div class="sub" style="margin-top:4px">${P('calendar-blank', 15)}Sat 24 Oct · 16:00 ${P('map-pin', 15)}Wagenhalle</div>
  </div>
  <div style="padding:18px 16px 0;display:flex;gap:10px">${pill('po', 'Spin again', 'arrows-clockwise', 'flex:1;height:54px')}${pill('pp', 'I am in', 'check', 'flex:1.2;height:54px')}</div>
`, { top: 150 });

// F5 Filter (full screen)
const filter = (t) => `<div class="ph ${t}" id="filter-${t}" style="height:auto;padding-bottom:0">${status}
  <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 20px 0">${H1('Filter', 46, 'padding:0')}<span class="hb" style="background:var(--s2)">${P('x', 20)}</span></div>
  ${sec('map-pin', 'City', `${fld('', 'Stuttgart')}<div style="margin-top:10px;display:flex;align-items:center;gap:6px;color:var(--pt);font-weight:600;font-size:14px">${P('navigation-arrow', 17, 'fill')}Use my current location</div>`, `<span style="color:var(--pt);font-weight:600;font-size:13px">Stuttgart</span>`)}
  ${sec('sparkle', 'Vibes (pick any)', `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${[['vinyl', 'music', 1], ['popper', 'party', 1], ['tent', 'festival'], ['cake', 'birthday'], ['palette', 'art'], ['pizza', 'food'], ['croissant', 'brunch'], ['popcorn', 'cinema'], ['ball', 'sports'], ['tote', 'street markets']].map((v) => `<div class="tile ${v[2] ? 'on' : ''}" style="height:96px">${ST(v[0], 42, -5)}${v[1]}</div>`).join('')}</div>`)}
  ${sec('users', 'Friends going', `<div style="display:flex;justify-content:space-between;font-weight:600"><span>At least</span><span style="color:var(--pt)">2+</span></div><div style="height:6px;border-radius:3px;background:var(--s3);margin:16px 0 6px;position:relative"><div style="width:20%;height:100%;border-radius:3px;background:var(--p)"></div><i class="abs" style="left:20%;top:-8px;width:22px;height:22px;margin-left:-11px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></i></div>`)}
  ${sec('calendar-blank', 'Date range', `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${fld('From', 'Oct 23', 'calendar-blank')}${fld('To', 'Oct 26', 'calendar-blank')}</div>`)}
  <div style="margin-top:16px;padding:16px;border-top:1px solid var(--line);display:flex;gap:10px;background:var(--bg)">${pill('po', 'Reset', '', 'flex:1;height:54px')}${pill('pp', 'Show 12 events', '', 'flex:2;height:54px')}</div>
</div>`;

// F6 Notifications drawer
const nrow = (img, icon, txt, time, act, unread) => `<div style="display:flex;gap:12px;padding:12px 18px;align-items:flex-start;${unread ? 'background:color-mix(in srgb,var(--p) 7%,transparent)' : ''}"><div style="position:relative;flex:none"><img src="${A(img)}" style="width:46px;height:46px;border-radius:50%;object-fit:cover"><span class="abs" style="right:-4px;bottom:-4px;width:22px;height:22px;border-radius:50%;background:var(--p);color:#fff;display:flex;align-items:center;justify-content:center;border:2px solid var(--sheet)">${P(icon, 12, 'fill')}</span></div><div style="flex:1"><div style="font-size:14.5px;line-height:1.35">${txt}</div>${meta(time, 'display:block;margin-top:4px;font-size:10.5px')}${act ? `<div style="display:flex;gap:8px;margin-top:10px">${act}</div>` : ''}</div>${unread ? '<i style="width:8px;height:8px;border-radius:50%;background:var(--p);margin-top:6px;flex:none"></i>' : ''}</div>`;
const notif = (t) => sheet(t, 'notif', under(t), `
  <div style="padding:0 20px;display:flex;align-items:center;gap:10px">${H1('Notifications', 34, 'padding:0')}<span class="pill pp" style="height:26px;font-size:12px;padding:0 10px">3 new</span><span style="flex:1"></span><span style="font-size:13px;font-weight:600;color:var(--mute)">Clear all</span></div>
  <div class="meta" style="padding:18px 20px 6px">New</div>
  ${nrow('marie', 'envelope-simple', "<b>Marie</b> invited you to <b>Supperclub at Marie's</b>", '2 min', `${pill('pp', "I'm in", 'check', 'height:34px;font-size:13px;padding:0 14px')}${pill('pg', 'Maybe', '', 'height:34px;font-size:13px;padding:0 14px')}`, 1)}
  ${nrow('timo', 'user-plus', '<b>Timo</b> started following you', '1 h', pill('po', 'Follow back', '', 'height:34px;font-size:13px;padding:0 14px'), 1)}
  ${nrow('jonas', 'currency-eur', '<b>Jonas</b> added <b>€12</b> to the Razzia tab', '3 h', pill('pp', 'Settle up', '', 'height:34px;font-size:13px;padding:0 14px'), 1)}
  <div class="meta" style="padding:16px 20px 6px">Earlier</div>
  ${nrow('nina', 'archive', 'Your capsule from <b>Razzia</b> is open — 23 photos inside', 'Yesterday')}
  ${nrow('marie', 'handshake', '<b>Marie</b> sealed a pact: “I\'ll go if you go.”', 'Mon')}
  <div style="text-align:center;padding:16px 0 0">${ST('spark', 54, -8)}<div class="hint" style="margin-top:6px">That's everything for now</div></div>
`, { top: 70 });

window.FEED = [['Feed', feedMain], ['Your mood sheet', mood], ['Friend in the Today row', friend], ['Roulette (dice)', roulette], ['Filter', filter], ['Notifications', notif]];
})();
