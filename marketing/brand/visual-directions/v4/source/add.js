// ADD EVENT + subpages
(() => {
const top = (on) => `${H1('Add a plan', 44)}${seg([['camera', 'Photo'], ['link', 'URL'], ['pencil-simple', 'Manual']], on, 'margin:14px 16px 0')}`;
const tiles4 = (on, small) => `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px">${[['eye', 'Public'], ['users', 'Circle'], ['lock-simple', 'List'], ['ghost', 'Ghost']].map((x, i) => `<div class="tile ${i == on ? 'on' : ''}" style="height:${small ? 58 : 68}px;gap:5px">${P(x[0], small ? 19 : 22, i == on ? 'fill' : 'regular')}${x[1]}</div>`).join('')}</div>`;
const rsvp = (st = '') => seg([['question', 'Maybe'], ['check', 'I am in']], 1, 'background:var(--bg);' + st, 'onp');
const VIBES = [['popper', 'party'], ['cake', 'birthday'], ['croissant', 'brunch'], ['pizza', 'dinner'], ['spritz', 'drinks'], ['vinyl', 'concert'], ['disco', 'club'], ['tent', 'festival'], ['popcorn', 'cinema'], ['ball', 'sports'], ['sun', 'day event']];
const vibeGrid = (on) => `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px">${VIBES.map((v) => `<div class="tile ${v[1] == on ? 'on' : ''}" style="height:84px;font-size:12.5px;gap:4px">${ST(v[0], 36, -5)}${v[1]}</div>`).join('')}</div>`;
const friendRow = (a, n, on) => `<div class="row2" style="padding:7px 0"><img src="${A(a)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover"><span style="flex:1;font-weight:600;font-size:14.5px">${n}</span><span style="width:24px;height:24px;border-radius:50%;${on ? 'background:var(--p);color:#fff' : 'border:2px solid var(--line2)'};display:flex;align-items:center;justify-content:center">${on ? P('check', 14, 'bold') : ''}</span></div>`;

// A1 Photo — empty
const photoEmpty = (t) => page(t, 'photo', `${top(0)}
 <div style="position:relative;height:200px;margin:18px 16px 0">
   ${['fl_midnight.png', 'fl_razzia_clean.png', 'fl_alles.png'].map((f, i) => `<img class="abs" src="${IMG(f)}" style="width:118px;height:150px;object-fit:cover;border-radius:14px;border:4px solid var(--s1);box-shadow:0 12px 24px rgba(0,0,0,.35);left:${[40, 128, 214][i]}px;top:${[30, 14, 34][i]}px;transform:rotate(${[-10, 2, 11][i]}deg)">`).join('')}
   <span class="abs" style="left:4px;top:96px">${ST('cam', 84, -12)}</span>
 </div>
 <div style="padding:14px 22px 0;font-size:16px;line-height:1.45"><b>Fastest way in.</b> <span style="color:var(--mute)">Drop a flyer or screenshot and the AI fills the event out for you — drop several and each becomes its own event.</span></div>
 <div style="margin:16px 16px 0;height:150px;border-radius:24px;border:2px dashed color-mix(in srgb,var(--p) 55%,transparent);background:color-mix(in srgb,var(--p) 8%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px">${P('camera-plus', 32, 'regular', 'color:var(--pt)')}<span style="font-weight:700;font-size:17px">Drop screenshots</span>${meta('PNG or JPG · up to 10 at once')}</div>
 ${sec('sparkle', 'How it works', [['Drop the flyer', 'A poster, a story screenshot, a group-chat invite — anything.'], ['AI reads it', 'Title, date, time, venue and vibe are detected automatically.'], ['Review & post', 'Tweak anything that looks off, then create — solo or in a batch.']].map((s, i) => `<div style="display:flex;gap:14px;padding:8px 0"><span class="dsp" style="font-size:34px;color:var(--pt);width:22px">${i + 1}</span><div><div style="font-weight:700;font-size:15.5px">${s[0]}</div><div class="hint" style="margin-top:2px">${s[1]}</div></div></div>`).join(''))}
 ${sec('file-text', 'What you get back', `<div style="display:flex;align-items:center;gap:12px"><img src="${IMG('fl_midnight.png')}" style="width:92px;height:120px;object-fit:cover;border-radius:12px">${P('arrow-right', 22, 'bold', 'color:var(--pt)')}<div style="flex:1;display:flex;flex-direction:column;gap:8px">${[['Title', 'Midnight Service'], ['When', 'Sat · 16:00'], ['Vibe', 'festival']].map((r) => `<div style="display:flex;align-items:center;gap:8px">${P('check-circle', 18, 'fill', 'color:#3BD47E')}<div>${meta(r[0], 'font-size:9.5px;display:block')}<div style="font-weight:600;font-size:14px">${r[1]}</div></div></div>`).join('')}</div></div><div class="hint" style="margin-top:12px;text-align:center">Drop 3 flyers → review 3 ready-made events</div>`)}
`, 'add');

// A2 Photo — drafts (one parsed, one parsing)
const photoDrafts = (t) => page(t, 'drafts', `${top(0)}
 <div style="margin:14px 16px 0;height:64px;border-radius:20px;border:2px dashed color-mix(in srgb,var(--p) 55%,transparent);display:flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:15px;color:var(--pt)">${P('camera-plus', 22)}Drop more screenshots</div>
 <div class="sec">
   <div class="row2"><div style="position:relative"><img src="${IMG('fl_midnight.png')}" style="width:64px;height:78px;border-radius:12px;object-fit:cover"><span class="abs" style="right:-6px;bottom:-6px;width:26px;height:26px;border-radius:50%;background:var(--p);color:#fff;display:flex;align-items:center;justify-content:center">${P('pencil-simple', 13, 'bold')}</span></div><div style="flex:1">${meta('Event 1')}<div style="font-weight:600;font-size:14px;margin-top:3px;color:#3BD47E;display:flex;align-items:center;gap:5px">${P('check-circle', 16, 'fill')}Read</div></div><span class="hb" style="background:var(--s2)">${P('x', 18)}</span></div>
   <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">
    ${fld('Event name*', 'Midnight Service · Summer Rave')}
    <div style="display:flex;align-items:center;gap:6px;color:var(--pt);font-weight:600;font-size:13.5px">${P('plus', 15, 'bold')}Add more info from screenshot</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${fld('Start date', 'Oct 10, 2026', 'calendar-blank')}${fld('End date (opt.)', 'Pick a date', 'calendar-blank', 1)}${fld('Start time', '4:00 PM', 'clock')}${fld('End time (opt.)', '10:00 PM', 'clock')}</div>
    ${fld('Location / venue', 'Secret location → Trude')}${fld('City*', 'Stuttgart', 'map-pin')}
    <div class="fld" style="min-height:70px;justify-content:flex-start;padding-top:10px"><span class="k">Description</span><span style="font-size:14.5px;margin-top:3px">Open air 16–22h, aftershow from 22h.</span></div>
    ${fld('Vibe', 'festival')}
    ${meta('Privacy', 'margin-top:6px')}${tiles4(0, 1)}
    ${meta('Your RSVP', 'margin-top:6px')}${rsvp()}
    <div class="row2" style="margin-top:6px;padding:12px 14px;border-radius:16px;background:var(--bg)">${P('package', 22, 'regular', 'color:var(--pt)')}<div style="flex:1"><div style="font-weight:600;font-size:14.5px">"Bring what?" list</div><div class="hint" style="font-size:12.5px">Crowdsource what to bring</div></div>${tog(false)}</div>
    <div style="padding:12px 14px;border-radius:16px;background:var(--bg)"><div class="row2">${P('user-plus', 19, 'regular', 'color:var(--pt)')}${meta('Invite friends', 'color:var(--ink);flex:1')}<span style="font-size:12.5px;color:var(--pt);font-weight:700">1 selected</span></div>${friendRow('marie', 'Marie Klein', 1)}${friendRow('jonas', 'Jonas Weber', 0)}</div>
   </div>
 </div>
 <div class="sec"><div class="row2"><img src="${IMG('fl_queer.png')}" style="width:64px;height:78px;border-radius:12px;object-fit:cover;filter:saturate(.6)"><div style="flex:1">${meta('Event 2')}<div style="font-weight:600;font-size:14px;margin-top:4px;display:flex;align-items:center;gap:6px;color:var(--pt)">${P('circle-notch', 16, 'bold')}AI parsing…</div></div><span class="hb" style="background:var(--s2)">${P('x', 18)}</span></div></div>
 <div style="margin:16px 16px 0">${pill('pp', 'Create all (1)', '', 'width:100%;height:56px;font-size:17px;opacity:.55')}<div class="hint" style="text-align:center;margin-top:8px">Waiting for event 2 to finish reading…</div></div>
`, 'add');

// A3 URL — parsed
const url = (t) => page(t, 'url', `${top(1)}
 <div style="display:flex;align-items:center;gap:14px;padding:18px 22px 0">${ST('envelope', 64, -8)}<div style="font-size:15.5px;line-height:1.45"><b>Found it online?</b> <span style="color:var(--mute)">Paste any event link and (IN) pulls the details across in seconds.</span></div></div>
 <div class="sec"><div class="fld" style="flex-direction:row;align-items:center;justify-content:flex-start;gap:10px">${P('link', 19, 'regular', 'color:var(--mute)')}<span style="font-size:15px;font-weight:600">ra.co/events/2219841</span></div>
   ${pill('pp', 'Extract event details', 'sparkle', 'width:100%;height:50px;margin-top:10px;border-radius:16px')}
   <div style="margin-top:12px;font-size:14px;display:flex;align-items:center;gap:6px">${P('check-circle', 17, 'fill', 'color:#3BD47E')}Extracted: <b>Desterradxs festival</b> · Oct 17</div></div>
 ${sec('image', 'Cover', `<div style="height:220px;border-radius:18px;overflow:hidden;position:relative"><img src="${IMG('fl_desterradxs.png')}" style="width:100%;height:100%;object-fit:cover"><span class="abs" style="right:10px;top:10px;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;display:flex;align-items:center;justify-content:center">${P('camera', 19)}</span></div><div class="hint" style="margin-top:8px">Pulled straight from the page — replace it anytime.</div>`)}
 ${sec('tag', 'The basics', fld('Event name*', 'Desterradxs festival'))}
 ${sec('calendar-blank', 'When & where', `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${fld('Start date*', 'Oct 17, 2026', 'calendar-blank')}${fld('End date', 'Oct 18, 2026', 'calendar-blank')}${fld('Start time', '8:00 PM', 'clock')}${fld('End time', 'End', 'clock', 1)}</div><div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">${fld('Venue / address', 'Utopia Kiosk')}${fld('City*', 'Stuttgart', 'map-pin')}</div>`)}
 <div class="hint" style="text-align:center;padding:14px 0 0">…vibe, description, who can see it, invites and RSVP continue as in Manual</div>
 ${sec('file-text', "What we'll grab", [['text-t', 'Title & description', 'cleaned up and ready to edit'], ['clock', 'Date & time', 'converted to your timezone'], ['map-pin', 'Venue & city', 'mapped for the nearby filter'], ['image', 'Cover image', 'pulled straight from the page']].map((r) => `<div class="row2" style="padding:7px 0">${P(r[0], 20, 'regular', 'color:var(--pt)')}<div><b style="font-size:14.5px">${r[1]}</b> <span class="hint">— ${r[2]}</span></div></div>`).join(''), '', 'opacity:.6')}
`, 'add');

// A4 Manual — full form
const manual = (t) => page(t, 'manual', `${top(2)}
 ${sec('image', 'Cover', `<div style="height:300px;border-radius:18px;background:linear-gradient(135deg,#7C3BED,#C04FE0);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:4px">${ST('pizza', 104, -12)}${ST('spritz', 96, 10)}<span class="abs" style="right:10px;bottom:10px;height:34px;border-radius:999px;padding:0 13px;display:flex;align-items:center;gap:6px;background:rgba(0,0,0,.55);color:#fff;font-size:13px;font-weight:600">${P('paint-brush', 16)}Cover Studio</span></div>
   <div style="display:flex;gap:8px;margin-top:10px">${pill('ppt', 'Stickers', 'smiley', 'flex:1;height:44px')}${pill('pg', 'Photo', 'image', 'flex:1;height:44px')}</div>
   <div style="display:flex;gap:10px;margin-top:12px;align-items:center">${['pizza', 'spritz'].map((s) => `<div style="position:relative;width:64px;height:64px;border-radius:16px;background:var(--bg);display:flex;align-items:center;justify-content:center">${ST(s, 40)}<span class="abs" style="right:-6px;top:-6px;width:22px;height:22px;border-radius:50%;background:var(--s3);display:flex;align-items:center;justify-content:center">${P('x', 12, 'bold')}</span></div>`).join('')}<div style="width:64px;height:64px;border-radius:16px;border:2px dashed var(--line2);display:flex;align-items:center;justify-content:center;color:var(--pt)">${P('plus', 24, 'bold')}</div></div>
   <div class="hint" style="margin-top:10px">Pick up to 5 — use Cover Studio for colors, stickers and text.</div>`)}
 ${sec('tag', 'The basics', fld('Event name*', "Supperclub at Marie's"))}
 ${sec('calendar-blank', 'When & where', `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${fld('Start date*', 'Oct 24, 2026', 'calendar-blank')}${fld('End date', 'Date', 'calendar-blank', 1)}${fld('Start time', '8:00 PM', 'clock')}${fld('End time', 'End', 'clock', 1)}</div><div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">${fld('Venue / address', "Marie's place, Westend")}${fld('City*', 'Stuttgart', 'map-pin')}</div>`)}
 ${sec('sparkle', 'Vibe', vibeGrid('dinner'))}
 ${sec('file-text', 'Description', `<div class="fld" style="min-height:96px;justify-content:flex-start;padding-top:12px"><span style="font-size:15px;line-height:1.4">Pasta, natural wine and one long table. Bring your best story from this week.</span></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">${pill('ppt', 'Generate', 'sparkle', 'height:38px;font-size:13.5px')}${pill('pg', 'Improve', 'pencil-simple-line', 'height:38px;font-size:13.5px')}</div>`, '<span class="hint" style="font-size:12px">optional</span>')}
 ${sec('lock-simple', 'Who can see it', `${tiles4(1)}<div class="hint" style="margin-top:10px"><b style="color:var(--ink)">Circle</b> — Visible only to your mutual friends. Won't appear on the public feed.</div>`)}
 ${sec('users', 'Who should be in', `<div class="fld" style="min-height:44px;flex-direction:row;align-items:center;justify-content:flex-start;gap:8px;color:var(--mute);font-size:14px">${P('magnifying-glass', 17)}Search friends</div><div style="margin-top:6px">${friendRow('marie', 'Marie Klein', 1)}${friendRow('jonas', 'Jonas Weber', 1)}${friendRow('timo', 'Timo Schulz', 0)}${friendRow('nina', 'Nina Ortega', 0)}</div>`, `<span style="font-size:12.5px;color:var(--mute);font-weight:600">Select all</span><span style="font-size:12.5px;color:var(--pt);font-weight:700;margin-left:8px">2 selected</span>`)}
 ${sec('user-circle-plus', 'Co-host', `<div class="fld" style="min-height:44px;flex-direction:row;align-items:center;justify-content:flex-start;gap:8px;color:var(--mute);font-size:14px">${P('magnifying-glass', 17)}Search friends to add as co-host</div><div style="margin-top:10px"><span class="chip on" style="padding:0 12px 0 4px"><img src="${A('marie')}" style="width:28px;height:28px;border-radius:50%;object-fit:cover">Marie ${P('x', 13, 'bold')}</span></div>`, '<span class="hint" style="font-size:12px">optional</span>')}
 ${sec('package', 'Bring what?', `<div class="hint">Let attendees claim items to bring (snacks, speaker, ball…)</div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px"><span class="chip on">Wine ${P('x', 12, 'bold')}</span><span class="chip on">Bread ${P('x', 12, 'bold')}</span><span class="chip">+ Speaker</span><span class="chip">+ Ice</span><span class="chip">+ Cups</span></div><div class="row2" style="margin-top:10px"><div class="fld" style="min-height:44px;flex:1;color:var(--mute);font-size:14px">Add an item…</div><span style="width:44px;height:44px;border-radius:12px;background:var(--p);color:#fff;display:flex;align-items:center;justify-content:center">${P('plus', 20, 'bold')}</span></div>`, tog())}
 ${sec('check', 'Your RSVP', rsvp())}
 <div style="margin:16px 16px 0">${pill('pp', 'Create event', '', 'width:100%;height:56px;font-size:17px;box-shadow:0 10px 26px rgba(124,59,237,.4)')}</div>
`, 'add');

// A5 Cover Studio
const studio = (t) => sheet(t, 'studio', top(2), `
  <div style="display:flex;justify-content:space-between;align-items:center;padding:0 20px">${H1('Cover Studio', 32, 'padding:0')}${pill('pp', 'Done', 'check', 'height:38px;font-size:14px')}</div>
  <div style="margin:16px 20px 0;height:350px;border-radius:26px;background:linear-gradient(135deg,#7C3BED,#FF5FA8);position:relative;overflow:hidden">
    <span class="abs" style="left:28px;top:34px">${ST('pizza', 110, -14)}</span><span class="abs" style="right:30px;top:70px">${ST('spritz', 96, 12)}</span>
    <div class="abs" style="left:34px;right:34px;bottom:44px;border:2px dashed rgba(255,255,255,.9);border-radius:10px;padding:8px 10px;text-align:center"><span class="dsp" style="font-size:44px;color:#fff">Supperclub</span><span class="abs" style="right:-11px;top:-11px;width:22px;height:22px;border-radius:50%;background:#F0524F;color:#fff;display:flex;align-items:center;justify-content:center">${P('x', 12, 'bold')}</span><span class="abs" style="right:-8px;bottom:-8px;width:16px;height:16px;border-radius:4px;background:#fff"></span></div>
  </div>
  ${seg(['Presets', 'Color', 'Stickers', 'Text'], 2, 'margin:16px 20px 0;background:var(--bg)')}
  ${meta('Tap to add — stack as many as you like', 'display:block;padding:14px 22px 10px')}
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:0 20px">${['spark', 'flame', 'heart', 'burst', 'moon', 'disco', 'popper', 'spritz', 'wave', 'sun', 'in', 'cake', 'balloon', 'vinyl', 'crown'].map((s) => `<div style="height:62px;border-radius:16px;background:var(--bg);display:flex;align-items:center;justify-content:center">${ST(s, 40, -4)}</div>`).join('')}</div>
  <div style="display:flex;gap:8px;padding:12px 20px 0"><div class="fld" style="flex:1;min-height:44px;color:var(--mute);font-size:14px">Paste or type any emoji…</div>${pill('pg', 'Add', '', 'height:44px')}</div>
  <div class="hint" style="padding:8px 22px 0;font-size:12px">Drag to move · pinch (or drag the white corner) to resize · tap the red × to delete.</div>
`, { top: 60, h: 930 });

// A6 Duplicate dialog
const dup = (t) => dialog(t, 'dup', top(0), `
  <div style="display:flex;justify-content:center;margin-top:-62px">${ST('seal', 84, -8)}</div>
  ${H1('Looks like the same night', 30, 'padding:10px 0 0;text-align:center')}
  <div class="lrow" style="margin-top:16px;background:var(--bg)"><img class="thumb" src="${IMG('fl_razzia_clean.png')}"><div style="flex:1"><div class="tt">Razzia · 4th anniversary</div><div class="sub">Sat 3 Oct · Romantica</div></div></div>
  <div style="font-size:14.5px;line-height:1.45;margin-top:14px;text-align:center"><b>Marie</b> already added <b>“Razzia · 4th anniversary”</b> on Sat 3 Oct at Romantica.</div>
  <div class="hint" style="text-align:center;margin-top:8px">Join theirs so RSVPs don't split — or create your own if it's a different plan.</div>
  <div style="display:flex;flex-direction:column;gap:8px;margin-top:18px">${pill('pp', 'Join their event', '', 'height:52px')}${pill('po', 'View first', '', 'height:48px')}${pill('', 'Create my own', '', 'height:44px;color:var(--mute)')}</div>
`);

window.ADD = [['Photo — empty', photoEmpty], ['Photo — screenshots read', photoDrafts], ['URL — extracted', url], ['Manual', manual], ['Cover Studio', studio], ['Same night? (duplicate)', dup]];
})();
