// THE TAB: add-expense drawer (the tab itself lives inline on the event page)
(() => {
const _person = (a, n, txt, amt, act, done) => `<div class="row" style="padding:10px 0;border-top:1px solid var(--line)"><img class="av" src="${AV(a)}" alt="" width="38" height="38"><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14.5px">${n}</div><div class="mute" style="font-size:12.5px">${txt}</div></div><span style="font-weight:700;font-size:15px;${done ? 'color:var(--mute);text-decoration:line-through' : ''}">${amt}</span>${act}</div>`;
SHEETS.expense = { label: 'The tab — add expense (drawer)', section: 'Event', base: 'event', tag: 'upd', demo: { id: 'razzia' }, render: () => `
  <div class="dsp" style="font-size:34px">Add expense</div>
  <div style="text-align:center;margin-top:16px"><div class="dsp" style="font-size:72px" id="amt">€36.00</div><div class="mute" style="font-size:13px">Drinks round · split 3 ways = €12.00 each</div></div>
  <div class="field" style="margin-top:16px"><input value="Drinks round" aria-label="What for"></div>
  <div class="flab" style="margin:14px 0 8px">Paid by</div>
  <div class="row" style="gap:8px">${['nina', 'marie', 'jonas', 'timo'].map((a, k) => `<button class="pchip" aria-pressed="${k == 0}"><img class="av" src="${AV(a)}" alt="" width="30" height="30">${k ? F[a].split(' ')[0] : 'You'}</button>`).join('')}</div>
  <div class="flab" style="margin:14px 0 8px">Split between</div>
  <div class="row" style="gap:8px;flex-wrap:wrap">${['nina', 'marie', 'jonas', 'timo'].map((a, k) => `<button class="pchip" aria-pressed="${k < 3}"><img class="av" src="${AV(a)}" alt="" width="30" height="30">${k ? F[a].split(' ')[0] : 'You'}</button>`).join('')}</div>
  <div class="row" style="margin-top:14px;padding:12px 14px;border-radius:16px;background:var(--bg)"><span style="flex:1;font-weight:600;font-size:14.5px">Split equally</span><button class="tog" aria-pressed="true" aria-label="Split equally"></button></div>
  <button class="pill pp" style="width:100%;height:54px;margin-top:16px;font-size:16px" data-close data-toast="Added to the tab">Add to the tab</button>
  <style>.pchip{display:flex;align-items:center;gap:6px;height:42px;padding:0 12px 0 5px;border-radius:999px;border:1.5px solid var(--line2);font-weight:600;font-size:13.5px}.pchip[aria-pressed="true"]{background:var(--p);border-color:var(--p);color:#fff}</style>`,
  mount: (w) => { w.addEventListener('click', (e) => { const b = e.target.closest('.pchip'); if (b) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); }); } };
})();
