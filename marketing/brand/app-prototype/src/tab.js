// THE TAB (split the bill) + add expense
(() => {
const person = (a, n, txt, amt, act, done) => `<div class="row" style="padding:10px 0;border-top:1px solid var(--line)"><img class="av" src="${AV(a)}" alt="" width="38" height="38"><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14.5px">${n}</div><div class="mute" style="font-size:12.5px">${txt}</div></div><span style="font-weight:700;font-size:15px;${done ? 'color:var(--mute);text-decoration:line-through' : ''}">${amt}</span>${act}</div>`;
SCREENS.tab = { label: 'The tab (split the bill)', section: 'Event', tag: 'upd', demo: { id: 'razzia' }, render: (p) => `
  <div style="position:relative;flex:none;height:178px;background:#120a14 url('${A('fl_razzia.jpg')}') center 35%/cover;color:#fff">
    <div style="position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.25))"></div>
    <div style="position:relative">${statusBar(1)}<div class="row" style="padding:0 14px"><button class="icb" style="background:rgba(0,0,0,.4);color:#fff" data-go="event" data-p='{"id":"${p.id || 'razzia'}"}' aria-label="Back">${I('ChevronLeft', 20, 2.4)}</button><span style="font-weight:700;font-size:20px;margin-left:6px">The tab</span><span class="sp"></span><img class="av" src="${AV('nina')}" alt="" width="38" height="38"></div>
    <div class="row" style="padding:12px 20px 0;font-size:13px;opacity:.85">${I('Receipt', 15)}Razzia · 4th anniversary · Sat 24 Oct</div></div>
  </div>
  <div class="scroll" style="margin-top:-26px;border-radius:28px 28px 0 0;background:var(--bg);position:relative;padding:20px 16px 170px">
    <div class="row" style="gap:6px">${I('ArrowDownLeft', 16, 2.4)}<span style="font-weight:600;font-size:14px">You're owed</span>${I('ChevronRight', 16)}</div>
    <div class="dsp" style="font-size:76px;margin-top:6px;letter-spacing:.01em">€18.00</div>
    <div class="row" style="gap:8px;margin-top:16px"><button class="pill pg" style="flex:1;height:52px;font-size:15.5px" data-sheet="expense">${I('Plus', 18, 2.6)}Add expense</button><button class="pill pp" style="flex:1;height:52px;font-size:15.5px" data-toast="Opens PayPal / Revolut / N26 with your handle filled in.">Settle up</button></div>
    <div class="card" style="margin-top:14px;padding:16px">
      <div class="row"><span style="width:12px;height:18px;border-radius:3px;border:2px solid var(--p)"></span><span style="font-weight:700;font-size:15px">Table total</span><span class="sp"></span><span style="font-weight:700">€126.00 · 9 people</span></div>
      <div style="height:6px;border-radius:3px;background:var(--s2);margin:12px 0 4px;overflow:hidden"><i style="display:block;width:57%;height:100%;background:var(--p);border-radius:3px"></i></div>
      <div class="mute" style="font-size:12.5px">4 of 7 settled · your share €14.00</div>
    </div>
    <div class="card" style="margin-top:10px;padding:6px 16px 8px">
      <div class="row" style="padding:10px 0"><span style="font-weight:700;font-size:15px">Owe you</span><span class="sp"></span><span class="meta">3 people</span></div>
      ${person('jonas', 'Jonas Weber', 'Drinks round · 01:20', '€12.00', '<button class="pill po" style="height:32px;font-size:12.5px;padding:0 12px" data-toast="Reminder sent with your PayPal link">Remind</button>')}
      ${person('timo', 'Timo Schulz', 'Taxi home', '€6.00', '<button class="pill po" style="height:32px;font-size:12.5px;padding:0 12px" data-toast="Reminder sent">Remind</button>')}
      ${person('marie', 'Marie Klein', 'Paid you back · Revolut', '€14.00', `<span style="color:#3BD47E">${I('CheckCircle2' in LUCIDE ? 'CheckCircle2' : 'Check', 20, 2.4)}</span>`, 1)}
    </div>
    <div class="card" style="margin-top:10px;padding:14px 16px">
      <div class="row"><img class="av" src="${AV('nina')}" alt="" width="42" height="42"><div style="flex:1"><div style="font-weight:700;font-size:15px">You owe Nina</div><div class="mute" style="font-size:12.5px">Entry · she paid for 2</div></div><span class="dsp" style="font-size:28px">€4.00</span></div>
      <div class="row" style="gap:6px;margin-top:12px">${['PayPal', 'Revolut', 'N26'].map((x) => `<button class="pill pg" style="flex:1;height:40px;font-size:13px" data-toast="Opens ${x} with @nina.o">${x}</button>`).join('')}</div>
    </div>
    <div class="card" style="margin-top:10px;padding:14px 16px;display:flex;align-items:center;gap:14px">${SV('receipt', 48, -8)}<div style="flex:1"><div style="font-weight:700;font-size:15px">Morning-after receipt</div><div class="mute" style="font-size:12.5px">The tab prints on the receipt after the night.</div></div>${I('ChevronRight', 18)}</div>
  </div>
  <div class="tswitch"><button aria-pressed="true">€18 owed</button><button aria-pressed="false">€4 you owe</button><button aria-pressed="false" aria-label="History">${I('History', 18)}</button></div>
  <style>.tswitch{position:absolute;left:50%;bottom:calc(26px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:flex;gap:2px;padding:5px;border-radius:999px;background:var(--nav);border:1px solid var(--line2);box-shadow:0 12px 30px rgba(0,0,0,.22);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);z-index:40}.tswitch button{white-space:nowrap;height:44px;padding:0 14px;border-radius:999px;font-weight:700;font-size:14px;color:var(--mute);display:flex;align-items:center}.tswitch button[aria-pressed="true"]{background:var(--s2);color:var(--ink);box-shadow:0 2px 8px rgba(0,0,0,.12)}</style>`,
  mount: (el) => { el.addEventListener('click', (e) => { const b = e.target.closest('.tswitch button'); if (b) el.querySelectorAll('.tswitch button').forEach((x) => x.setAttribute('aria-pressed', x === b)); }); } };

SHEETS.expense = { label: 'Add expense', section: 'Event', base: 'tab', tag: 'upd', demo: {}, render: () => `
  <div class="dsp" style="font-size:34px">Add expense</div>
  <div style="text-align:center;margin-top:16px"><div class="dsp" style="font-size:72px" id="amt">€36.00</div><div class="mute" style="font-size:13px">Drinks round · split 3 ways = €12.00 each</div></div>
  <div class="field" style="margin-top:16px"><input value="Drinks round" aria-label="What for"></div>
  <div class="flab" style="margin:14px 0 8px">Paid by</div>
  <div class="row" style="gap:8px">${['nina', 'marie', 'jonas', 'timo'].map((a, k) => `<button class="pchip" aria-pressed="${k == 0}"><img class="av" src="${AV(a)}" alt="" width="30" height="30">${k ? F[a].split(' ')[0] : 'You'}</button>`).join('')}</div>
  <div class="flab" style="margin:14px 0 8px">Split between</div>
  <div class="row" style="gap:8px;flex-wrap:wrap">${['nina', 'marie', 'jonas', 'timo'].map((a, k) => `<button class="pchip" aria-pressed="${k < 3}"><img class="av" src="${AV(a)}" alt="" width="30" height="30">${k ? F[a].split(' ')[0] : 'You'}</button>`).join('')}</div>
  <div class="row" style="margin-top:14px;padding:12px 14px;border-radius:16px;background:var(--bg)"><span style="flex:1;font-weight:600;font-size:14.5px">Split equally</span><button class="tog" aria-pressed="true" aria-label="Split equally"></button></div>
  <button class="pill pp" style="width:100%;height:54px;margin-top:16px;font-size:16px" data-close>Add to the tab</button>
  <style>.pchip{display:flex;align-items:center;gap:6px;height:42px;padding:0 12px 0 5px;border-radius:999px;border:1.5px solid var(--line2);font-weight:600;font-size:13.5px}.pchip[aria-pressed="true"]{background:var(--p);border-color:var(--p);color:#fff}</style>`,
  mount: (w) => { w.addEventListener('click', (e) => { const b = e.target.closest('.pchip'); if (b) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); }); } };
})();
