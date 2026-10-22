// PROFILE: Me / Calendar / Friends + edit, status, settings
(() => {
const tabs = (on) => `<div style="display:flex;align-items:baseline;gap:16px;padding:8px 20px 0">${['Me', 'Calendar', 'Friends'].map((x, i) => `<span class="dsp" style="font-size:${i == on ? 44 : 30}px;${i == on ? '' : 'color:var(--mute);opacity:.6'}">${x}</span>`).join('')}</div>`;
const card = (body, st = '') => `<div style="margin:12px 16px 0;border-radius:28px;background:var(--s1);border:1px solid var(--line);padding:18px;${st}">${body}</div>`;
const evRow = (wd, d, img, n, loc) => `<div class="lrow"><div class="datec">${meta(wd, 'font-size:10.5px')}<b>${d}</b></div><img class="thumb" src="${IMG(img)}"><div style="flex:1;min-width:0"><div class="tt">${n}</div><div class="sub">${loc}</div></div>${P('caret-right', 18, 'bold', 'color:var(--mute)')}</div>`;

// P1 Me
const me = (t) => page(t, 'me', `${tabs(0)}
 ${card(`<div style="display:flex;justify-content:center"><div style="position:relative"><img src="${A('marie')}" style="width:140px;height:140px;border-radius:50%;object-fit:cover;border:3px solid var(--p);padding:4px;background:var(--s1)"><span class="abs" style="right:-30px;bottom:-14px">${ST('disco', 66, 10)}</span><span class="abs" style="left:4px;bottom:6px;width:34px;height:34px;border-radius:50%;background:var(--p);color:#fff;display:flex;align-items:center;justify-content:center;border:3px solid var(--s1)">${P('pencil-simple', 16, 'bold')}</span></div></div>
   <div class="dsp" style="font-size:40px;text-align:center;margin-top:14px">Marie Klein</div>
   <div style="text-align:center;margin-top:8px;display:flex;justify-content:center;gap:12px;flex-wrap:wrap">${meta('@marie')}<span class="meta" style="display:flex;align-items:center;gap:4px">${P('map-pin', 13, 'fill')}Stuttgart</span><span class="meta" style="display:flex;align-items:center;gap:4px">${P('cake', 13, 'fill')}22 March</span></div>
   <div style="text-align:center;font-size:15px;line-height:1.45;margin-top:10px">Dinner that turns into a night? Always in.</div>
   <div style="display:flex;gap:8px;justify-content:center;margin-top:16px">${pill('pg', 'Edit profile', 'pencil-simple', 'height:42px;font-size:14px')}${pill('pg', 'Share', 'link-simple', 'height:42px;font-size:14px')}</div>`, 'padding-top:24px')}
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 16px 0">
   <div style="border-radius:24px;background:var(--s1);border:1px solid var(--line);padding:14px;display:flex;align-items:center;gap:10px">${ST('flame', 42, -8)}<div><div class="dsp" style="font-size:26px">87%</div><div class="hint" style="font-size:12px">worth it · 12 rated</div></div></div>
   <div style="border-radius:24px;background:var(--s1);border:1px solid var(--line);padding:14px;display:flex;align-items:center;gap:10px">${ST('free', 46, -6)}<div><div style="font-weight:700;font-size:14px">Open for events</div><div style="font-size:12.5px;color:var(--pt);font-weight:600">change</div></div></div>
 </div>
 <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 16px 0">${[['23', 'Events'], ['7', 'Followers'], ['7', 'Following']].map((s) => `<div style="border-radius:22px;background:var(--s1);border:1px solid var(--line);height:104px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;text-align:center"><span style="color:var(--mute);font-size:13px;font-weight:500">${s[1]}</span><span class="dsp" style="font-size:42px">${s[0]}</span></div>`).join('')}</div>
 <div style="display:flex;gap:14px;padding:18px 20px 0;overflow:hidden">
   <div style="text-align:center;width:66px;flex:none"><div style="width:64px;height:64px;border-radius:50%;border:2px dashed var(--line2);display:flex;align-items:center;justify-content:center;color:var(--pt)">${P('plus', 22, 'bold')}</div><div style="font-size:12px;font-weight:600;margin-top:6px">Edit</div></div>
   ${[['f4.jpg', 'Razzia', 'Oct 24'], ['f2.jpg', 'Supper', 'Oct 2'], ['f5.jpg', 'Desterradxs', 'Sep 20'], ['01.jpg', 'Birthday', 'Sep 6']].map((h) => `<div style="text-align:center;width:66px;flex:none"><div style="width:64px;height:64px;border-radius:50%;padding:2.5px;background:linear-gradient(135deg,#7C3BED,#C4A6FF)"><img src="${IMG(h[0])}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;border:2.5px solid var(--bg)"></div><div style="font-size:12px;font-weight:600;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h[1]}</div>${meta(h[2], 'font-size:9.5px')}</div>`).join('')}
 </div>
 <div style="margin:16px 16px 0">${pill('po', 'Rate past events (3)', 'sparkle', 'width:100%;height:48px')}</div>
 <div style="margin:12px 16px 0;border-radius:30px;background:var(--hero);color:#F4F3EE;padding:20px;position:relative;overflow:hidden">
   <div class="meta" style="color:#8C8B85;display:flex;align-items:center;gap:6px">${P('lock-simple', 13, 'fill')}Your going-out DNA</div>
   <div style="display:flex;align-items:center;gap:14px;margin-top:14px">${ST('moon', 84, -8)}<div><div class="dsp" style="font-size:36px">The Closer</div><div style="font-size:13.5px;color:#BDBCB6;margin-top:6px;line-height:1.4">Last one out, first one in the group chat the next day.</div></div></div>
   <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:16px">${[['23', 'attended'], ['6', 'organised'], ['5 wk', 'streak'], ['€18', 'owed to you'], ['€4', 'you owe'], ['3', 'cities']].map((s) => `<div style="border-radius:14px;background:#222220;padding:10px"><div class="dsp" style="font-size:22px">${s[0]}</div>${meta(s[1], 'font-size:9.5px;color:#8C8B85')}</div>`).join('')}</div>
   <div style="font-style:italic;font-size:12.5px;color:#8C8B85;margin-top:12px">Updates as your habits change · <span style="color:#A98BFF;font-style:normal;font-weight:600">See full DNA</span></div>
 </div>
 <div style="display:flex;justify-content:space-between;align-items:center;padding:22px 20px 10px"><span class="dsp" style="font-size:26px">Stickers you earned</span><span style="color:var(--pt);font-weight:600;font-size:13.5px">See all</span></div>
 <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 16px">${[['disco', '10 nights'], ['spritz', 'host'], ['cam', 'capsule'], ['seal', '3 pacts'], ['crystal', 'oracle'], ['receipt', 'paid up'], ['crown', 'top 3'], ['moon', '4 am']].map((s, i) => `<div class="tile" style="height:100px;font-size:11.5px;font-family:'JetBrains Mono';text-transform:uppercase;font-weight:400;color:var(--mute)">${ST(s[0], 46, [-6, 5, -4, 8][i % 4])}${s[1]}</div>`).join('')}</div>
 <div style="display:flex;justify-content:space-between;align-items:center;padding:22px 20px 0"><span class="dsp" style="font-size:26px">Your events · 2026</span><span class="meta" style="display:flex;align-items:center;gap:5px">${P('arrows-down-up', 13)}Newest</span></div>
 <div class="meta" style="padding:12px 20px 8px">October</div>
 <div style="margin:0 16px;display:flex;flex-direction:column;gap:8px">${evRow('Sat', '24', 'f2.jpg', "Supperclub at Marie's", 'Westend')}${evRow('Sat', '10', 'fl_alles.png', 'Alles offen 26', 'Kunstverein Wagenhalle')}${evRow('Sat', '03', 'fl_razzia_clean.png', 'Razzia · 4th anniversary', 'Romantica')}</div>
`, 'me');

// P2 Calendar (what friends see)
const cal = (t) => { const K = window.CALKIT; return page(t, 'mecal', `${tabs(1)}
 <div style="margin:14px 16px 0;border-radius:20px;background:color-mix(in srgb,var(--p) 10%,var(--s1));border:1px solid color-mix(in srgb,var(--p) 30%,transparent);padding:12px 14px;display:flex;align-items:center;gap:10px">${P('eye', 20, 'regular', 'color:var(--pt)')}<span style="font-size:13.5px;line-height:1.4">This is what your friends see. Ghost plans stay blurred.</span></div>
 <div style="display:flex;align-items:center;justify-content:space-between;margin:12px 16px 0">${seg(['Month', 'Week', 'Day'], 1, 'width:230px')}<span style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--mute)">Maybes${tog()}</span></div>
 ${K.hero('Your next', '2 weeks', K.two)}${K.legend}
 <div style="margin:14px 16px 0;display:flex;flex-direction:column;gap:8px">
  ${K.evRow('Sat', '24', `<img class="thumb" src="${IMG('f2.jpg')}">`, "Supperclub at Marie's", `${K.timeChip('20:00')}6 going`, K.right.in)}
  ${K.evRow('Sun', '25', `<img class="thumb" src="${IMG('fl_desterradxs.png')}">`, 'Desterradxs festival', `${K.timeChip('22:00')}12 going`, K.right.maybe)}
  ${K.evRow('Tue', '27', `<div class="thumb" style="background:color-mix(in srgb,var(--p) 18%,var(--s2));display:flex;align-items:center;justify-content:center;color:var(--pt)">${P('airplane-tilt', 24, 'fill')}</div>`, 'Away · Work trip', `${meta('→ Oct 28')} · shown as away`, `<span style="color:var(--mute)">${P('pencil-simple', 18)}</span>`)}
 </div>
 <div style="margin:14px 16px 0;border-radius:26px;background:var(--s1);border:1px solid var(--line);padding:16px;display:flex;align-items:center;gap:14px">${ST('free', 54, -6)}<div style="flex:1"><div style="font-weight:700;font-size:15px">Open for events</div><div class="hint" style="font-size:12.5px">Friends can pull you into plans this week.</div></div><span style="font-weight:700;font-size:13.5px;color:var(--pt)">Change</span></div>
`, 'me'); };

// P3 Friends
const fr = (a, n, st, stk, icon) => `<div class="lrow" style="min-height:74px"><img src="${A(a)}" style="width:46px;height:46px;border-radius:50%;object-fit:cover"><div style="flex:1;min-width:0"><div class="tt">${n}</div><div class="sub">${icon ? P(icon, 14, 'fill', 'color:var(--pt)') : ''}${st}</div></div>${stk ? ST(stk, 40, -8) : ''}${P('caret-right', 17, 'bold', 'color:var(--mute)')}</div>`;
const friends = (t) => page(t, 'mefriends', `${tabs(2)}
 <div style="margin:14px 16px 0" class="fld"><span class="v" style="justify-content:flex-start;color:var(--mute);font-weight:500;font-size:14.5px">${P('magnifying-glass', 18)}Search by name or @username</span></div>
 <div class="meta" style="padding:18px 20px 8px">Requests · 1</div>
 <div class="lrow" style="margin:0 16px"><img src="${A('nina')}" style="width:46px;height:46px;border-radius:50%;object-fit:cover"><div style="flex:1"><div class="tt">Lea Fontaine</div><div class="sub">3 mutual friends</div></div>${pill('pp', 'Accept', 'check', 'height:36px;font-size:13px;padding:0 12px')}<span class="hb" style="width:36px;height:36px;background:var(--s2)">${P('x', 16, 'bold')}</span></div>
 <div style="display:flex;justify-content:space-between;align-items:center;padding:22px 20px 10px"><span class="dsp" style="font-size:24px">Who you actually go out with</span></div>
 <div style="display:flex;gap:8px;margin:0 16px">${[['jonas', 'Jonas', '14 shared', 'Real ones'], ['marie', 'Marie', '11 shared', 'Real ones'], ['timo', 'Timo', '6 shared', 'Building history']].map((f) => `<div style="flex:1;border-radius:24px;background:var(--s1);border:1px solid var(--line);padding:14px 8px;text-align:center"><img src="${A(f[0])}" style="width:62px;height:62px;border-radius:50%;object-fit:cover;border:2.5px solid var(--p);padding:2px"><div style="font-weight:700;font-size:14.5px;margin-top:8px">${f[1]}</div>${meta(f[2], 'font-size:10px;display:block;margin-top:2px')}<div style="font-size:11.5px;color:var(--pt);font-weight:700;margin-top:6px">${f[3]}</div></div>`).join('')}</div>
 <div style="display:flex;justify-content:space-between;align-items:center;padding:22px 20px 8px"><span class="meta">All friends · 12</span><span style="font-size:13px;color:var(--mute);font-weight:600">7 followers · 7 following</span></div>
 <div style="margin:0 16px;display:flex;flex-direction:column;gap:8px">
  ${fr('marie', 'Marie Klein', 'Out tonight · Westend', 'sneaker')}
  ${fr('jonas', 'Jonas Weber', 'Drinks · until 01:00', 'spritz')}
  ${fr('timo', 'Timo Schulz', 'Away · Lisbon until Fri', '', 'airplane-tilt')}
  ${fr('nina', 'Nina Ortega', 'Not tonight', 'moon')}
 </div>
 <div style="margin:14px 16px 0;border-radius:28px;background:var(--hero);color:#F4F3EE;padding:20px;display:flex;align-items:center;gap:16px">${ST('hey', 74, -8)}<div style="flex:1"><div style="font-weight:700;font-size:16px">Plans are better with friends</div><div style="font-size:13px;color:#BDBCB6;margin-top:4px">Share your profile link.</div>${pill('pp', 'Invite a friend', 'user-plus', 'height:40px;font-size:13.5px;margin-top:12px')}</div></div>
 <div style="margin:14px 16px 0;border-radius:24px;background:var(--s1);border:1px solid var(--line);padding:16px;display:flex;align-items:center;gap:14px">${ST('receipt', 56, -8)}<div style="flex:1"><div style="font-weight:700;font-size:15px">Friendship receipts</div><div class="hint" style="font-size:12.5px">Tap a friend to see yours — shared nights, who hosted, favorite vibe.</div></div></div>
`, 'me');

// P4 Edit profile
const edit = (t) => page(t, 'meedit', `
 <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 20px 0"><span style="font-weight:600;font-size:15px;color:var(--mute)">Cancel</span>${meta('Edit profile')}<span style="font-weight:700;font-size:15px;color:var(--pt)">Save</span></div>
 <div style="text-align:center;padding:18px 0 0"><div style="position:relative;display:inline-block"><img src="${A('marie')}" style="width:120px;height:120px;border-radius:50%;object-fit:cover"><span class="abs" style="right:0;bottom:0;width:40px;height:40px;border-radius:50%;background:var(--p);color:#fff;display:flex;align-items:center;justify-content:center;border:3px solid var(--bg)">${P('camera', 19, 'fill')}</span></div></div>
 <div style="margin:18px 16px 0;display:flex;flex-direction:column;gap:8px">${fld('Display name', 'Marie Klein')}${fld('Username', '@marie')}<div class="fld" style="min-height:76px;justify-content:flex-start;padding-top:10px"><span class="k">Bio</span><span style="font-size:15px;margin-top:3px">Dinner that turns into a night? Always in.</span></div>${fld('City', 'Stuttgart', 'map-pin')}${fld('Birthday', '22 March', 'cake')}</div>
 ${sec('currency-eur', 'Settle up handles', `<div class="hint" style="margin-bottom:10px">Used when splitting a tab — friends see these only when paying you back.</div><div style="display:flex;flex-direction:column;gap:8px">${fld('PayPal', 'marieklein')}${fld('Revolut', '@marie.k')}${fld('N26 MoneyBeam', 'N26 MoneyBeam handle', '', 1)}</div>`)}
 <div style="margin:16px 16px 0;display:flex;gap:10px">${pill('pg', 'Cancel', '', 'flex:1;height:54px')}${pill('pp', 'Save', 'floppy-disk', 'flex:2;height:54px')}</div>
`, false, { noHeader: true });

// P5 Status sheet
const statusS = (t) => sheet(t, 'status', tabs(0), `
  ${H1('How are you feeling?', 34, 'padding:0 22px')}
  <div style="margin:16px 16px 0;border-radius:24px;background:color-mix(in srgb,var(--p) 14%,transparent);border:1.5px solid color-mix(in srgb,var(--p) 45%,transparent);padding:14px 16px;display:flex;align-items:center;gap:14px">${ST('spritz', 54, -6)}<div style="flex:1"><div style="font-weight:700;font-size:15.5px">Your mood today</div><div class="hint" style="font-size:12.5px">Drinks, dancing, chill… tell your circle.</div></div>${P('caret-right', 18, 'bold', 'color:var(--pt)')}</div>
  <div style="margin:10px 16px 0;display:flex;flex-direction:column;gap:8px">${[['free', 'Up for anything', 'Default. No badge shown.', 1], ['moon', 'Not tonight', 'Auto-clears in 24h. Friends see a moon on your avatar.'], ['battery', 'Low energy week', 'Stays for a week. Friends see it on your avatar.']].map((o) => `<div style="border-radius:24px;background:var(--bg);border:1.5px solid ${o[3] ? 'var(--p)' : 'var(--line)'};padding:14px 16px;display:flex;align-items:center;gap:14px">${ST(o[0], 54, -6)}<div style="flex:1"><div style="font-weight:700;font-size:15.5px">${o[1]}</div><div class="hint" style="font-size:12.5px">${o[2]}</div></div>${o[3] ? `<span style="width:26px;height:26px;border-radius:50%;background:var(--p);color:#fff;display:flex;align-items:center;justify-content:center">${P('check', 14, 'bold')}</span>` : ''}</div>`).join('')}</div>
  <div style="margin:14px 22px 0;display:flex;gap:10px;align-items:flex-start" class="hint">${P('airplane-tilt', 18, 'fill', 'color:var(--pt);margin-top:1px')}Travelling? Block those days on your calendar — friends will see you're away.</div>
`, { top: 250 });

// P6 Settings
const setRow = (icon, txt, right = P('caret-right', 17, 'bold', 'color:var(--mute)')) => `<div class="rowi" style="border-top:1px solid var(--line)">${P(icon, 22, 'regular', 'color:var(--pt)')}<span style="flex:1">${txt}</span>${right}</div>`;
const settings = (t) => sheet(t, 'settings', tabs(0), `
  ${H1('Settings', 40, 'padding:0 22px')}
  <div style="margin:16px 16px 0;border-radius:24px;background:var(--bg);padding:14px 16px;display:flex;align-items:center;gap:12px"><img src="${A('marie')}" style="width:50px;height:50px;border-radius:50%;object-fit:cover"><div style="flex:1"><div style="font-weight:700;font-size:16px">Marie Klein</div>${meta('@marie · Stuttgart', 'font-size:10.5px')}</div><span class="pill ppt" style="height:28px;font-size:12px;padding:0 10px">Person</span></div>
  <div style="margin:12px 16px 0;border-radius:24px;background:var(--bg);overflow:hidden">${setRow('calendar-check', 'Sync to my calendar').replace('border-top:1px solid var(--line)', '')}${setRow('bell', 'Notifications')}</div>
  ${meta('Appearance', 'display:block;padding:18px 22px 8px')}<div style="padding:0 16px">${seg([['moon', 'Dark'], ['sun', 'Light']], t == 'd' ? 0 : 1, 'background:var(--bg)')}</div>
  ${meta('Language', 'display:block;padding:16px 22px 8px')}<div style="padding:0 16px">${seg(['English', 'Deutsch'], 0, 'background:var(--bg)')}</div>
  <div style="padding:20px 16px 0">${pill('po', 'Log out', 'sign-out', 'width:100%;height:50px')}<div style="text-align:center;margin-top:12px;font-size:13px;color:var(--mute)">Delete account…</div></div>
  <div style="text-align:center;margin-top:18px;border-top:1px solid var(--line);padding-top:16px"><div style="font-weight:700;font-size:14px">I am (IN) 1.0</div><div class="hint" style="font-size:12.5px;margin-top:3px;display:flex;align-items:center;justify-content:center;gap:5px">made with ${P('heart', 14, 'fill', 'color:var(--p)')} by Nathalia Cury in Stuttgart</div><div class="hint" style="font-size:12.5px;margin-top:6px">Privacy · Terms</div></div>
`, { top: 70 });

window.ME = [['Profile — Me', me], ['Profile — Calendar (what friends see)', cal], ['Profile — Friends', friends], ['Edit profile', edit], ['Status sheet', statusS], ['Settings', settings]];
})();
