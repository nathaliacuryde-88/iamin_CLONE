// I am (IN) sticker set. Each sticker is drawn in a 0..100 box; the white die-cut
// outline comes from the #cut filter, so shapes need no outline of their own.
const K = "#0B0B0A", LIME = "#D8FF3D", PINK = "#FF5FA8", ORANGE = "#FF6A13", YEL = "#FFE14D",
  GOLD = "#FFD400", BLUE = "#3B6CFF", RED = "#F23D3D", CREAM = "#FBF7EC";

const DEFS = `
<filter id="cut" filterUnits="userSpaceOnUse" x="-12" y="-12" width="124" height="124">
 <feMorphology in="SourceAlpha" operator="dilate" radius="4.2" result="d"/>
 <feGaussianBlur in="d" stdDeviation="1.4" result="b"/>
 <feComponentTransfer in="b" result="t"><feFuncA type="linear" slope="7" intercept="-2.5"/></feComponentTransfer>
 <feFlood flood-color="#fff"/><feComposite in2="t" operator="in" result="w"/>
 <feMerge><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<radialGradient id="silver" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#c9c9c9"/><stop offset="1" stop-color="#5d5d5d"/></radialGradient>
<linearGradient id="brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE38A"/><stop offset=".5" stop-color="#E9B23A"/><stop offset="1" stop-color="#B57E12"/></linearGradient>
<clipPath id="discoclip"><circle cx="50" cy="56" r="34"/></clipPath>
<clipPath id="ballclip"><circle cx="50" cy="50" r="38"/></clipPath>
<clipPath id="popclip"><path d="M14 88 L40 38 L64 62 Z"/></clipPath>`;

const burstPath = (cx, cy, r1, r2, n) => {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2, r = i % 2 ? r2 : r1;
    d += (i ? "L" : "M") + (cx + r * Math.cos(a)).toFixed(1) + " " + (cy + r * Math.sin(a)).toFixed(1);
  }
  return d + "Z";
};
const wavyCircle = (cx, cy, r, amp, n) => {
  let d = "";
  for (let i = 0; i <= 72; i++) {
    const a = (Math.PI * 2 * i) / 72, rr = r + amp * Math.sin(n * a);
    d += (i ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(1) + " " + (cy + rr * Math.sin(a)).toFixed(1);
  }
  return d + "Z";
};
const sunRays = () => {
  let s = "";
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12, b = 0.17;
    const p = (r, t) => `${(50 + r * Math.cos(t)).toFixed(1)} ${(50 + r * Math.sin(t)).toFixed(1)}`;
    s += `<path d="M${p(28, a - b)} L${p(45, a)} L${p(28, a + b)}Z" fill="#FF9F1C"/>`;
  }
  return s;
};
const ballPatches = () => {
  let s = "";
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5, cx = 50 + 33 * Math.cos(a), cy = 50 + 33 * Math.sin(a);
    s += `<path d="${burstPath(cx, cy, 11, 11, 5).replace(/L/g, " L")}" fill="${K}" transform="rotate(${(k * 72 + 180).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
    const ix = 50 + 12 * Math.cos(a), iy = 50 + 12 * Math.sin(a), ox = 50 + 23 * Math.cos(a), oy = 50 + 23 * Math.sin(a);
    s += `<path d="M${ix.toFixed(1)} ${iy.toFixed(1)} L${ox.toFixed(1)} ${oy.toFixed(1)}" stroke="${K}" stroke-width="2.4"/>`;
  }
  return s;
};
const pent = (cx, cy, r) => { let d = ""; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; d += (i ? "L" : "M") + (cx + r * Math.cos(a)).toFixed(1) + " " + (cy + r * Math.sin(a)).toFixed(1); } return d + "Z"; };

const T = (txt, x, y, size, fill = K, fam = "Anton", extra = "") =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${fam}" font-size="${size}" fill="${fill}" ${extra}>${txt}</text>`;

const S = {
in: `<circle cx="50" cy="50" r="42" fill="${LIME}"/>${T("I'M IN", 50, 62, 33, K, "Anton", 'transform="rotate(-12 50 50)"')}`,
free: `<g transform="rotate(-6 50 50)"><rect x="6" y="30" width="88" height="40" rx="20" fill="${LIME}"/><circle cx="25" cy="50" r="8" fill="#17B75A"/><circle cx="25" cy="50" r="3.5" fill="#B9F5CF"/>${T("FREE", 61, 61, 28)}</g>`,
spritz: `<path d="M26 18h48c0 30-8 44-24 46C34 62 26 48 26 18z" fill="#EAF3F5" stroke="#B9CFD3" stroke-width="1.5"/><path d="M29 30h42c-2 20-9 30-21 31-12-1-19-11-21-31z" fill="${ORANGE}"/><path d="M29 30h42" stroke="#FFD9B8" stroke-width="3"/><rect x="47" y="63" width="6" height="21" fill="#EAF3F5" stroke="#B9CFD3" stroke-width="1.5"/><ellipse cx="50" cy="86" rx="17" ry="5" fill="#EAF3F5" stroke="#B9CFD3" stroke-width="1.5"/><circle cx="72" cy="20" r="11" fill="#FFB21F"/><circle cx="72" cy="20" r="7.5" fill="#FFD36B"/><path d="M72 13v14M65 20h14M67 15l10 10M77 15l-10 10" stroke="#FFB21F" stroke-width="1.4"/><path d="M38 8l10 48" stroke="${K}" stroke-width="3" stroke-linecap="round"/><circle cx="41" cy="44" r="2" fill="#fff" opacity=".7"/><circle cx="56" cy="38" r="1.6" fill="#fff" opacity=".7"/>`,
disco: `<rect x="48.5" y="6" width="3" height="16" fill="#8a8a8a"/><circle cx="50" cy="56" r="34" fill="url(#silver)"/><g clip-path="url(#discoclip)" stroke="rgba(0,0,0,.28)" stroke-width="1.6" fill="none"><path d="M10 34h80M10 43h80M10 52h80M10 61h80M10 70h80M10 79h80"/><ellipse cx="50" cy="56" rx="11" ry="34"/><ellipse cx="50" cy="56" rx="23" ry="34"/><path d="M50 20v74"/></g><rect x="30" y="37" width="8" height="7" fill="#fff" opacity=".9"/><rect x="40" y="46" width="6" height="6" fill="#fff" opacity=".6"/><path d="M80 14l2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5z" fill="${LIME}"/>`,
sneaker: `<path d="M12 64 C12 50 18 38 28 34 L42 32 C46 42 56 48 68 50 C82 52 90 56 90 66 Z" fill="${PINK}"/><path d="M30 34 C34 44 34 54 30 64" stroke="#fff" stroke-width="3" fill="none"/><path d="M44 36l-6 6M50 40l-6 6M56 43l-6 6" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M58 58 C66 52 76 54 84 60" stroke="${LIME}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M10 64 H92 C92 72 88 78 82 78 H18 C12 78 10 72 10 64Z" fill="${CREAM}"/><path d="M10 70 H92" stroke="${K}" stroke-width="2.5"/>`,
couch: `<rect x="22" y="28" width="56" height="30" rx="9" fill="#2F5BE6"/><rect x="16" y="50" width="68" height="22" rx="7" fill="${BLUE}"/><rect x="8" y="40" width="18" height="36" rx="9" fill="#5A84FF"/><rect x="74" y="40" width="18" height="36" rx="9" fill="#5A84FF"/><rect x="16" y="76" width="7" height="10" rx="2" fill="#1b2f7a"/><rect x="77" y="76" width="7" height="10" rx="2" fill="#1b2f7a"/><path d="M50 52v18" stroke="#2848c4" stroke-width="2"/><rect x="30" y="34" width="16" height="13" rx="4" fill="${LIME}" transform="rotate(-8 38 40)"/>`,
sun: `${sunRays()}<circle cx="50" cy="50" r="27" fill="${YEL}"/><rect x="31" y="42" width="16" height="11" rx="5" fill="${K}"/><rect x="53" y="42" width="16" height="11" rx="5" fill="${K}"/><path d="M47 45h6" stroke="${K}" stroke-width="2.5"/>`,
ball: `<circle cx="50" cy="50" r="38" fill="#fff" stroke="${K}" stroke-width="2.5"/><g clip-path="url(#ballclip)">${ballPatches()}</g><path d="${pent(50, 50, 12)}" fill="${K}"/><circle cx="50" cy="50" r="38" fill="none" stroke="${K}" stroke-width="2.5"/>`,
key: `<g transform="rotate(-32 50 50)" fill="url(#brass)"><path d="M14 50a20 20 0 1 1 40 0a20 20 0 1 1-40 0zM52 45h40v10h-8v10h-8v-10h-6v8h-8v-8H52z"/></g><g transform="rotate(-32 50 50)"><circle cx="27" cy="50" r="6" fill="#fff"/><path d="M58 50h30" stroke="#9c6a08" stroke-width="1.5"/></g>`,
moon: `<path d="M60 12a38 38 0 1 0 28 58A30 30 0 1 1 60 12z" fill="${YEL}"/><circle cx="40" cy="62" r="4" fill="#F2C916"/><circle cx="30" cy="44" r="2.6" fill="#F2C916"/><path d="M80 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="${LIME}"/>`,
battery: `<g transform="rotate(-6 50 55)"><rect x="12" y="40" width="68" height="36" rx="8" fill="#fff" stroke="${K}" stroke-width="4"/><rect x="80" y="50" width="8" height="16" rx="2" fill="${K}"/><rect x="19" y="47" width="13" height="22" rx="3" fill="#FF3B4A"/></g>${T("Z", 62, 32, 18)}${T("z", 76, 18, 12)}`,
flame: `<path d="M50 6 C58 24 80 34 80 60 C80 80 66 94 50 94 C34 94 20 80 20 60 C20 46 28 38 35 29 C37 39 41 44 46 46 C43 31 45 17 50 6Z" fill="${ORANGE}"/><path d="M50 44 C56 54 65 58 65 71 C65 81 58 88 50 88 C42 88 35 81 35 71 C35 63 41 58 44 52 C46 56 48 58 51 58 C49 54 49 49 50 44Z" fill="${YEL}"/>`,
eyes: `<ellipse cx="33" cy="50" rx="18" ry="25" fill="#fff" stroke="${K}" stroke-width="3"/><ellipse cx="67" cy="50" rx="18" ry="25" fill="#fff" stroke="${K}" stroke-width="3"/><circle cx="41" cy="55" r="9" fill="${K}"/><circle cx="75" cy="55" r="9" fill="${K}"/><circle cx="44" cy="51" r="3" fill="#fff"/><circle cx="78" cy="51" r="3" fill="#fff"/>`,
skull: `<g transform="rotate(-8 50 50)"><path d="M50 10 C73 10 87 27 87 47 C87 59 81 66 74 70 V82 C74 87 70 90 66 90 H34 C30 90 26 87 26 82 V70 C19 66 13 59 13 47 C13 27 27 10 50 10Z" fill="#F4F1E6"/><ellipse cx="35" cy="49" rx="10" ry="11" fill="${K}"/><ellipse cx="65" cy="49" rx="10" ry="11" fill="${K}"/><path d="M50 60 L44 71 H56Z" fill="${K}"/><path d="M40 78v12M50 78v12M60 78v12" stroke="${K}" stroke-width="2.6"/></g>`,
cheers: `<g transform="translate(26 16) rotate(14 9 30)"><path d="M0 0h18l-2 34c-1 6-4 9-7 9s-6-3-7-9z" fill="#EAF3F5" stroke="#B9CFD3" stroke-width="1.5"/><path d="M1.5 10h15l-1.6 24c-1 5-3 7-5.9 7s-4.9-2-5.9-7z" fill="#FFD36B"/><rect x="8" y="43" width="2.4" height="20" fill="#B9CFD3"/><ellipse cx="9.2" cy="64" rx="10" ry="3" fill="#EAF3F5" stroke="#B9CFD3" stroke-width="1.5"/></g><g transform="translate(56 16) rotate(-14 9 30)"><path d="M0 0h18l-2 34c-1 6-4 9-7 9s-6-3-7-9z" fill="#EAF3F5" stroke="#B9CFD3" stroke-width="1.5"/><path d="M1.5 10h15l-1.6 24c-1 5-3 7-5.9 7s-4.9-2-5.9-7z" fill="#FFD36B"/><rect x="8" y="43" width="2.4" height="20" fill="#B9CFD3"/><ellipse cx="9.2" cy="64" rx="10" ry="3" fill="#EAF3F5" stroke="#B9CFD3" stroke-width="1.5"/></g><path d="M50 2v8M40 6l4 6M60 6l-4 6" stroke="${LIME}" stroke-width="3.5" stroke-linecap="round"/>`,
heart: `<path d="M50 88 C20 68 8 52 8 34 C8 20 19 11 31 11 C40 11 46 17 50 24 C54 17 60 11 69 11 C81 11 92 20 92 34 C92 52 80 68 50 88Z" fill="#FF3B4A"/><ellipse cx="27" cy="30" rx="6" ry="9" fill="#fff" opacity=".55" transform="rotate(-30 27 30)"/>`,
popper: `<path d="M14 88 L40 38 L64 62 Z" fill="${BLUE}"/><g clip-path="url(#popclip)" fill="${LIME}"><path d="M10 70 L60 40 L64 46 L14 76Z"/><path d="M10 86 L64 54 L68 60 L14 92Z"/></g><rect x="66" y="10" width="7" height="12" rx="2" fill="${PINK}" transform="rotate(25 69 16)"/><circle cx="84" cy="36" r="4.5" fill="${LIME}"/><rect x="52" y="18" width="7" height="7" rx="1.5" fill="${YEL}" transform="rotate(15 55 21)"/><circle cx="90" cy="16" r="4" fill="${ORANGE}"/><path d="M60 40 q6 -9 12 0 t12 0" stroke="${PINK}" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="76" y="50" width="6" height="10" rx="2" fill="${BLUE}" transform="rotate(-30 79 55)"/>`,
meh: `<path d="M50 13 C71 11 89 27 87 49 C89 71 71 89 50 87 C28 89 11 71 13 49 C11 27 29 15 50 13Z" fill="#CFCEC7"/><circle cx="37" cy="46" r="4.5" fill="${K}"/><circle cx="63" cy="46" r="4.5" fill="${K}"/><path d="M35 64 H65" stroke="${K}" stroke-width="4.5" stroke-linecap="round"/>`,
maybe: `<path d="M24 22h52a16 16 0 0 1 16 16v14a16 16 0 0 1-16 16H44l-16 14 3-14h-7A16 16 0 0 1 8 52V38a16 16 0 0 1 16-16z" fill="#fff" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/>${T("maybe?", 50, 53, 21, K, "Inter Tight", 'font-style="italic" font-weight="800"')}`,
plus1: `<path d="${burstPath(50, 50, 44, 33, 12)}" fill="${PINK}"/>${T("+1", 50, 64, 34, K, "Anton", 'transform="rotate(8 50 50)"')}`,
burst: `<path d="${burstPath(50, 50, 44, 33, 12)}" fill="${YEL}"/>${T("9.1", 50, 62, 30, K, "Anton", 'transform="rotate(-6 50 50)"')}`,
vinyl: `<circle cx="50" cy="50" r="42" fill="${K}"/><circle cx="50" cy="50" r="36" fill="none" stroke="#333" stroke-width="1.2"/><circle cx="50" cy="50" r="30" fill="none" stroke="#333" stroke-width="1.2"/><circle cx="50" cy="50" r="24" fill="none" stroke="#333" stroke-width="1.2"/><circle cx="50" cy="50" r="15" fill="${LIME}"/><circle cx="50" cy="50" r="2.6" fill="${K}"/><path d="M20 32 A36 36 0 0 1 36 17" stroke="#fff" stroke-width="3" opacity=".35" fill="none" stroke-linecap="round"/>`,
tent: `<path d="M50 18 V6" stroke="${K}" stroke-width="2.5"/><path d="M50 5 L65 9 L50 13Z" fill="${LIME}"/><rect x="18" y="50" width="64" height="38" fill="#fff"/><path d="M26 50h8v38h-8zM42 50h8v38h-8zM58 50h8v38h-8zM74 50h8v38h-8z" fill="${RED}"/><path d="M41 88 L50 64 L59 88Z" fill="${K}"/><path d="M8 54 L50 18 L92 54 Z" fill="${RED}"/><path d="M50 18 L30 54 H42Z M50 18 L58 54 H70Z" fill="#fff"/>${[12, 22, 32, 42, 52, 62, 72, 82].map((x, i) => `<circle cx="${x + 3}" cy="55" r="5" fill="${i % 2 ? "#fff" : RED}"/>`).join("")}`,
cake: `<ellipse cx="50" cy="86" rx="40" ry="6" fill="#fff" stroke="#DDD" stroke-width="1.5"/><rect x="18" y="46" width="64" height="38" rx="6" fill="#FF8FC3"/><path d="M18 52 Q18 44 26 44 H74 Q82 44 82 52 V58 Q78 64 74 58 Q70 66 64 58 Q58 64 52 58 Q46 68 40 58 Q34 64 28 58 Q22 66 18 58Z" fill="#FFF6E8"/><rect x="28" y="70" width="6" height="3" rx="1.5" fill="${LIME}"/><rect x="48" y="74" width="6" height="3" rx="1.5" fill="${BLUE}" transform="rotate(30 51 75)"/><rect x="66" y="69" width="6" height="3" rx="1.5" fill="${YEL}"/><rect x="47" y="22" width="6" height="22" rx="2" fill="${LIME}"/><path d="M47 28l6-3M47 34l6-3M47 40l6-3" stroke="#9BC400" stroke-width="1.6"/><ellipse cx="50" cy="15" rx="4.5" ry="7.5" fill="#FF9F1C"/><ellipse cx="50" cy="17" rx="2.2" ry="4" fill="${YEL}"/>`,
palette: `<path d="M50 12 C74 12 90 28 90 48 C90 60 82 64 72 62 C64 60 60 66 62 74 C64 84 58 90 48 90 C26 90 10 72 10 50 C10 28 28 12 50 12Z" fill="#EFD3A0"/><circle cx="32" cy="38" r="7" fill="${LIME}"/><circle cx="52" cy="28" r="7" fill="${PINK}"/><circle cx="72" cy="38" r="6.5" fill="${BLUE}"/><circle cx="26" cy="58" r="6.5" fill="${ORANGE}"/><circle cx="40" cy="74" r="6" fill="${K}"/><path d="M90 8 L60 50" stroke="${K}" stroke-width="5" stroke-linecap="round"/><path d="M62 47 L55 57" stroke="#bbb" stroke-width="7" stroke-linecap="round"/><path d="M55 57 L50 64" stroke="${PINK}" stroke-width="6" stroke-linecap="round"/>`,
pizza: `<path d="M16 24 Q50 8 84 24 L52 92 Z" fill="#FFD36B"/><path d="M16 24 Q50 8 84 24 L80 33 Q50 18 20 33Z" fill="#D98A3A"/><circle cx="40" cy="42" r="7" fill="#E5372E"/><circle cx="62" cy="40" r="6" fill="#E5372E"/><circle cx="52" cy="62" r="6" fill="#E5372E"/><circle cx="46" cy="78" r="3" fill="#2E8B3A"/><circle cx="34" cy="56" r="2.5" fill="#2E8B3A"/>`,
croissant: `${[[22, 62, 10, 14, -45], [78, 62, 10, 14, 45], [34, 47, 12, 17, -25], [66, 47, 12, 17, 25], [50, 40, 14, 20, 0]].map(([x, y, rx, ry, r]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#E8A54B" stroke="#B66A1F" stroke-width="2" transform="rotate(${r} ${x} ${y})"/>`).join("")}<path d="M44 30 Q50 34 56 30M42 44 Q50 48 58 44" stroke="#FFD08A" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
popcorn: `${[[30, 36, 9], [42, 27, 10], [57, 25, 10], [70, 34, 9], [36, 20, 8], [52, 14, 8], [64, 18, 7]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF4D6" stroke="#E9C97A" stroke-width="1.5"/>`).join("")}<path d="M22 40 H78 L69 90 H31 Z" fill="#fff"/><path d="M22 40 H33 L38.5 90 H31Z M44.4 40 H55.6 L53.8 90 H46.2Z M67 40 H78 L69 90 H61.5Z" fill="${RED}"/><path d="M20 40 H80" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>`,
tote: `<path d="M34 42 C34 16 66 16 66 42" stroke="#CDBE9C" stroke-width="6" fill="none"/><path d="M20 38 H80 L84 90 H16 Z" fill="#EFE6D2"/><circle cx="50" cy="64" r="15" fill="${LIME}"/>${T("MARKT", 50, 68, 10)}`,
balloon: `<ellipse cx="50" cy="40" rx="27" ry="31" fill="${PINK}"/><path d="M45 70 L55 70 L50 77Z" fill="#E0408A"/><path d="M50 77 C43 83 57 87 50 95" stroke="${K}" stroke-width="1.8" fill="none"/><ellipse cx="39" cy="27" rx="5" ry="9" fill="#fff" opacity=".6" transform="rotate(-20 39 27)"/>`,
gift: `<ellipse cx="39" cy="28" rx="12" ry="7" fill="${LIME}" transform="rotate(-25 39 28)"/><ellipse cx="61" cy="28" rx="12" ry="7" fill="${LIME}" transform="rotate(25 61 28)"/><rect x="18" y="46" width="64" height="42" rx="3" fill="${BLUE}"/><rect x="13" y="34" width="74" height="15" rx="3" fill="#5A84FF"/><rect x="45" y="34" width="10" height="54" fill="${LIME}"/><circle cx="50" cy="32" r="5.5" fill="#B8E000"/>`,
bottle: `<g transform="rotate(-24 50 56)"><path d="M41 42 C41 33 45 29 45 22 H55 C55 29 59 33 59 42 V90 Q59 94 55 94 H45 Q41 94 41 90Z" fill="#1F4D2B"/><path d="M44 14 H56 L55 32 H45Z" fill="#E9B23A"/><rect x="41" y="58" width="18" height="16" fill="${CREAM}"/><path d="M45 66h10" stroke="${K}" stroke-width="1.5"/><path d="M45 44 V54" stroke="#fff" stroke-width="2.5" opacity=".35" stroke-linecap="round"/></g><rect x="66" y="2" width="9" height="11" rx="3" fill="#D9A866" transform="rotate(30 70 8)"/><circle cx="58" cy="14" r="2.5" fill="${LIME}"/><circle cx="80" cy="22" r="3" fill="${YEL}"/><circle cx="70" cy="26" r="2" fill="${LIME}"/>`,
pin: `<path d="M50 94 C50 94 18 62 18 40 A32 32 0 0 1 82 40 C82 62 50 94 50 94Z" fill="${LIME}"/><circle cx="50" cy="40" r="12" fill="${K}"/>`,
scooter: `<path d="M22 76 H72" stroke="${K}" stroke-width="7" stroke-linecap="round"/><path d="M72 76 L64 18" stroke="${LIME}" stroke-width="7" stroke-linecap="round"/><path d="M55 18 H74" stroke="${K}" stroke-width="6" stroke-linecap="round"/><circle cx="22" cy="80" r="10" fill="${K}"/><circle cx="22" cy="80" r="3.5" fill="#999"/><circle cx="76" cy="80" r="10" fill="${K}"/><circle cx="76" cy="80" r="3.5" fill="#999"/>`,
radar: `<circle cx="50" cy="50" r="42" fill="${K}"/><circle cx="50" cy="50" r="28" fill="none" stroke="#2f2f2c" stroke-width="1.6"/><circle cx="50" cy="50" r="14" fill="none" stroke="#2f2f2c" stroke-width="1.6"/><path d="M50 50 L50 8 A42 42 0 0 1 86 29 Z" fill="${LIME}" opacity=".85"/><circle cx="64" cy="26" r="4.5" fill="${LIME}"/><circle cx="32" cy="64" r="4" fill="${PINK}"/><circle cx="60" cy="70" r="3.5" fill="#fff"/><circle cx="50" cy="50" r="3" fill="#fff"/>`,
seal: `<path d="${wavyCircle(50, 50, 40, 3.2, 14)}" fill="#D7263D"/><circle cx="50" cy="50" r="27" fill="#B81B30"/><circle cx="50" cy="50" r="27" fill="none" stroke="#E5455A" stroke-width="2"/>${T("IN", 50, 63, 34, "#E85468")}<path d="M24 26 Q30 20 36 22" stroke="#fff" stroke-width="3" opacity=".35" fill="none" stroke-linecap="round"/>`,
crystal: `<path d="M28 80 H72 L66 93 H34Z" fill="#8B5A2B"/><circle cx="50" cy="46" r="33" fill="#CFE8FF"/><circle cx="50" cy="48" r="21" fill="#E9F6FF"/><path d="M50 34 C51.5 44 54 46.5 64 48 C54 49.5 51.5 52 50 62 C48.5 52 46 49.5 36 48 C46 46.5 48.5 44 50 34Z" fill="${LIME}"/><ellipse cx="36" cy="30" rx="6" ry="10" fill="#fff" opacity=".85" transform="rotate(-35 36 30)"/><path d="M28 80 H72" stroke="#6E431D" stroke-width="2"/>`,
ghost: `<g transform="rotate(-8 50 50)"><path d="M22 90 V44 A28 28 0 0 1 78 44 V90 L68.7 82 L59.3 90 L50 82 L40.7 90 L31.3 82 Z" fill="#fff" stroke="#D6D5CF" stroke-width="2"/><path d="M70 30 A28 28 0 0 1 78 44 V90 L68.7 82 L66 84 V40Z" fill="#EDEDE8"/><ellipse cx="40" cy="46" rx="4.5" ry="6.5" fill="${K}"/><ellipse cx="60" cy="46" rx="4.5" ry="6.5" fill="${K}"/><ellipse cx="50" cy="62" rx="5" ry="6" fill="${K}"/><circle cx="32" cy="56" r="4" fill="${PINK}" opacity=".5"/><circle cx="68" cy="56" r="4" fill="${PINK}" opacity=".5"/></g>`,
envelope: `<g transform="rotate(-8 50 50)"><rect x="10" y="26" width="80" height="54" rx="5" fill="${CREAM}" stroke="#E2D4B2" stroke-width="2"/><path d="M12 28 L50 58 L88 28" stroke="#E2D4B2" stroke-width="2.4" fill="none"/><circle cx="50" cy="56" r="12" fill="${LIME}"/>${T("IN", 50, 61, 13)}</g>`,
hey: `<path d="M20 18h60a14 14 0 0 1 14 14v22a14 14 0 0 1-14 14H58l-10 16-6-16H20A14 14 0 0 1 6 54V32a14 14 0 0 1 14-14z" fill="${LIME}" transform="rotate(-6 50 50)"/>${T("HEY!", 50, 55, 30, K, "Anton", 'transform="rotate(-6 50 50)"')}`,
cash: `<rect x="14" y="22" width="70" height="40" rx="4" fill="#FF9F1C" transform="rotate(-10 49 42)"/><g transform="rotate(7 50 60)"><rect x="12" y="38" width="76" height="44" rx="4" fill="#FFB84D" stroke="#E08A00" stroke-width="2"/><circle cx="50" cy="60" r="13" fill="none" stroke="#E08A00" stroke-width="2"/>${T("€50", 50, 66, 15, "#7A4A00")}${T("50", 22, 50, 10, "#7A4A00")}${T("50", 78, 78, 10, "#7A4A00")}</g>`,
clock: `<circle cx="27" cy="22" r="11" fill="${RED}"/><circle cx="73" cy="22" r="11" fill="${RED}"/><path d="M30 84 L23 94 M70 84 L77 94" stroke="${K}" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="56" r="33" fill="${RED}"/><circle cx="50" cy="56" r="25" fill="#fff"/><path d="M50 56 V39 M50 56 L62 63" stroke="${K}" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="56" r="3" fill="${K}"/><rect x="45" y="15" width="10" height="9" rx="2" fill="${K}"/>`,
ticket: `<g transform="rotate(-8 50 50)"><path d="M14 28 H86 A6 6 0 0 1 92 34 V43 A7 7 0 0 0 92 57 V66 A6 6 0 0 1 86 72 H14 A6 6 0 0 1 8 66 V57 A7 7 0 0 0 8 43 V34 A6 6 0 0 1 14 28Z" fill="${LIME}"/><path d="M70 32 V68" stroke="${K}" stroke-width="1.8" stroke-dasharray="3 3"/>${T("ADMIT 1", 39, 57, 16)}${T("IN", 81, 57, 15)}</g>`,
lock: `<path d="M33 48 V34 A17 17 0 0 1 67 34 V48" stroke="#A9A9A9" stroke-width="8" fill="none"/><rect x="22" y="44" width="56" height="44" rx="9" fill="${GOLD}"/><circle cx="50" cy="61" r="6" fill="${K}"/><rect x="47.5" y="63" width="5" height="13" rx="2" fill="${K}"/>`,
film: `<g transform="rotate(-12 50 50)"><rect x="6" y="28" width="88" height="44" rx="2" fill="${K}"/>${[10, 19, 28, 37, 46, 55, 64, 73, 82].map((x) => `<rect x="${x}" y="31" width="5" height="4" rx="1" fill="#fff"/><rect x="${x}" y="65" width="5" height="4" rx="1" fill="#fff"/>`).join("")}<rect x="12" y="39" width="22" height="22" rx="2" fill="${PINK}"/><rect x="39" y="39" width="22" height="22" rx="2" fill="#FFB84D"/><rect x="66" y="39" width="22" height="22" rx="2" fill="${BLUE}"/></g>`,
calendar: `<g transform="rotate(6 50 50)"><rect x="16" y="16" width="68" height="72" rx="7" fill="#fff" stroke="#DDD" stroke-width="1.5"/><path d="M16 23 A7 7 0 0 1 23 16 H77 A7 7 0 0 1 84 23 V38 H16Z" fill="${RED}"/>${T("OCT", 50, 33, 13, "#fff")}${T("03", 50, 78, 36)}<circle cx="33" cy="16" r="3.5" fill="${K}"/><circle cx="67" cy="16" r="3.5" fill="${K}"/></g>`,
crown: `<path d="M12 74 L18 30 L35 52 L50 22 L65 52 L82 30 L88 74 Z" fill="${GOLD}"/><rect x="12" y="68" width="76" height="16" rx="3" fill="#F2B705"/><circle cx="18" cy="28" r="5" fill="${GOLD}"/><circle cx="50" cy="20" r="5" fill="${GOLD}"/><circle cx="82" cy="28" r="5" fill="${GOLD}"/><circle cx="32" cy="76" r="4.5" fill="${LIME}"/><circle cx="50" cy="76" r="4.5" fill="${PINK}"/><circle cx="68" cy="76" r="4.5" fill="${BLUE}"/>`,
brokenheart: `<path d="M48 24 C45 18 39 12 30 12 C19 12 8 20 8 34 C8 52 20 68 48 88 L44 66 L52 54 L42 42 Z" fill="#FF3B4A"/><g transform="translate(6 -2) rotate(8 70 50)"><path d="M52 24 C55 18 61 12 70 12 C81 12 92 20 92 34 C92 52 80 68 52 88 L48 66 L56 54 L46 42 Z" fill="#E42D3C"/></g>`,
spark: `<path d="M44 14 C47 38 54 46 80 50 C54 54 47 62 44 90 C41 62 34 54 8 50 C34 46 41 38 44 14Z" fill="${LIME}"/><path d="M80 8 C81 16 83 18 92 20 C83 22 81 24 80 32 C79 24 77 22 68 20 C77 18 79 16 80 8Z" fill="${PINK}"/>`,
dice: `<g transform="rotate(16 66 36)"><rect x="46" y="14" width="40" height="40" rx="9" fill="${PINK}"/><circle cx="56" cy="24" r="3.5" fill="#fff"/><circle cx="66" cy="34" r="3.5" fill="#fff"/><circle cx="76" cy="44" r="3.5" fill="#fff"/></g><g transform="rotate(-12 37 60)"><rect x="12" y="36" width="48" height="48" rx="10" fill="#fff" stroke="#D6D5CF" stroke-width="1.5"/><circle cx="24" cy="48" r="4" fill="${K}"/><circle cx="48" cy="48" r="4" fill="${K}"/><circle cx="36" cy="60" r="4" fill="${K}"/><circle cx="24" cy="72" r="4" fill="${K}"/><circle cx="48" cy="72" r="4" fill="${K}"/></g>`,
cam: `<rect x="10" y="28" width="80" height="48" rx="7" fill="${GOLD}"/><rect x="10" y="28" width="80" height="13" rx="6" fill="#111"/><rect x="10" y="35" width="80" height="6" fill="#111"/><rect x="18" y="31" width="18" height="7" rx="2" fill="#EDEDED"/><rect x="72" y="31" width="11" height="7" rx="2" fill="#555"/><circle cx="58" cy="58" r="14" fill="#111"/><circle cx="58" cy="58" r="8" fill="#3a3a3a"/><circle cx="55" cy="55" r="2.6" fill="#bbb"/><text x="16" y="70" font-family="Anton" font-size="11" fill="#111">FLASH 27</text>`,
receipt: `<g transform="rotate(6 50 50)"><path d="M24 8h52v80l-6.5-5-6.5 5-6.5-5-6.5 5-6.5-5-6.5 5-6.5-5-6.5 5z" fill="#FBFAF5" stroke="#ddd" stroke-width="1"/><text x="50" y="22" text-anchor="middle" font-family="JetBrains Mono" font-size="7.5" fill="#111">THE NIGHT</text><path d="M31 32h26M31 40h20M31 48h24M31 56h16" stroke="#999" stroke-width="2.4"/><path d="M62 32h7M64 40h5M62 48h7M64 56h5" stroke="#999" stroke-width="2.4"/><path d="M31 64h38" stroke="#111" stroke-width="1" stroke-dasharray="2 2"/><text x="31" y="75" font-family="JetBrains Mono" font-size="8" font-weight="500" fill="#111">TOTAL</text><text x="69" y="75" text-anchor="end" font-family="Anton" font-size="11" fill="#111">€42</text></g>`,
wave: `<circle cx="50" cy="50" r="39" fill="#fff"/><path d="M56.8 11.6 A39 39 0 0 1 81.9 27.6 L63.1 40.8 A16 16 0 0 0 52.8 34.2Z" fill="${PINK}"/><path d="M88.4 56.8 A39 39 0 0 1 72.4 81.9 L59.2 63.1 A16 16 0 0 0 65.8 52.8Z" fill="${PINK}"/><path d="M43.2 88.4 A39 39 0 0 1 18.1 72.4 L36.9 59.2 A16 16 0 0 0 47.2 65.8Z" fill="${PINK}"/><path d="M11.6 43.2 A39 39 0 0 1 27.6 18.1 L40.8 36.9 A16 16 0 0 0 34.2 47.2Z" fill="${PINK}"/><circle cx="50" cy="50" r="16" fill="#fff" stroke="#E5E4DE" stroke-width="2"/><circle cx="50" cy="50" r="39" fill="none" stroke="#E5E4DE" stroke-width="1.5"/><path d="M24 30 A32 32 0 0 1 40 17" stroke="#fff" stroke-width="4" opacity=".7" fill="none" stroke-linecap="round"/>`,
};

// Where each sticker goes: [id, label, replaces, used in]
const GROUPS = [
 ["Moods (Your mood today) & status on avatars", [
  ["disco", "Out tonight", "🔥 🪩", "OutTonightBar vibe_out"],
  ["spritz", "Drinks", "🍸 🍹", "vibe_drinks"],
  ["sneaker", "Dancing", "💃", "vibe_dancing"],
  ["couch", "Chill hang / still home", "🛋️", "vibe_chill, LiveRadar"],
  ["sun", "Day event / sunny", "☀️", "vibe_day, CoverStudio"],
  ["ball", "Sport", "⚡ ⚽", "vibe_sport, categories"],
  ["key", "At mine", "🏠", "new mood"],
  ["free", "Free tonight", "🟢", "StatusBadge available"],
  ["moon", "Not tonight / late", "🌙", "StatusBadge, PactSection"],
  ["battery", "Low energy", "😴", "StatusBadge, StatusSheet"],
 ]],
 ["Reactions, exit poll & scores", [
  ["flame", "Fire / worth it", "🔥", "ReactionPicker, ExitPoll, EventScoreStrip"],
  ["eyes", "Looking / are you in?", "👀", "ReactionPicker, reality check"],
  ["skull", "Dead / flop", "💀", "ReactionPicker, ExitPoll"],
  ["cheers", "Cheers / brunch", "🥂", "ReactionPicker, categories"],
  ["heart", "Love", "❤️ 💖 💜", "ReactionPicker, cards"],
  ["popper", "Party", "🎉 🥳 🎊", "ReactionPicker, categories, toasts"],
  ["meh", "Mid", "😐", "ExitPoll, EventScoreStrip"],
  ["burst", "Score (number on top)", "★ ⭐ 🏅", "NightReceipt, CreatorScore"],
  ["maybe", "Maybe", "🤔 🤷", "Maybe states"],
  ["in", "I'm in / confirmed", "✅ ✋", "RSVP, EventPulse, notifications"],
 ]],
 ["Event categories", [
  ["vinyl", "Music", "🎵 🎶", "FilterSheet, EventCard, AddEvent"],
  ["popper", "Party", "🎉", "FilterSheet"],
  ["tent", "Festival", "🎪", "FilterSheet"],
  ["cake", "Birthday", "🎂", "FilterSheet, birthdays"],
  ["palette", "Art", "🎨", "FilterSheet"],
  ["pizza", "Food", "🍽️ 🌮", "FilterSheet"],
  ["croissant", "Brunch", "🥂 ☕", "FilterSheet"],
  ["popcorn", "Cinema", "🎬", "FilterSheet"],
  ["ball", "Sports", "⚡", "FilterSheet"],
  ["tote", "Street markets", "🛍️", "FilterSheet"],
 ]],
 ["On the night: radar, pacts, ghosts, the line, the tab", [
  ["pin", "I'm there / location", "📍 🎉", "LiveRadar, EventDetail"],
  ["scooter", "On the way", "🛵 🚶", "LiveRadar"],
  ["radar", "Live radar", "📡", "LiveRadarSection, MapSheet"],
  ["seal", "Pact sealed", "🤝", "PactSection, notifications"],
  ["ghost", "Ghost / let it fade / knock", "👻", "EventPulse, GhostKnock, FriendGhostCard"],
  ["dice", "Roulette", "🎲", "Roulette sheet"],
  ["ticket", "Walk-in / the line", "🟢 🎟️", "Line mode, notifications"],
  ["receipt", "The tab / receipt", "🧾", "NightReceipt, expenses"],
  ["cash", "Paid / money", "💸 💳", "payments, Onboarding"],
 ]],
 ["Capsule & memories", [
  ["cam", "Capsule / photos", "📸", "TimeCapsule, AddEvent"],
  ["film", "Recap / reel", "🎞️", "CapsuleDetail"],
  ["crystal", "Prediction", "🔮", "RevealedPredictions, TimeCapsule"],
  ["lock", "Sealed / private", "🔒", "EventDetail, capsules"],
  ["calendar", "Date / plans", "🗓️ 📅", "calendar, notifications"],
 ]],
 ["Birthdays", [
  ["cake", "Birthday", "🎂 🍰", "BirthdayCardComposer/Reveal"],
  ["balloon", "Balloon", "🎈", "Birthday cards"],
  ["gift", "Gift", "🎁", "Birthday cards, ConvertMaybes"],
  ["bottle", "Bubbles", "🍾", "Birthday cards"],
  ["plus1", "+1 / party", "🥳 🎊", "Birthday cards, calendar"],
 ]],
 ["Notifications & everything else", [
  ["envelope", "Invite", "💌", "NotificationsBell, Calendar"],
  ["hey", "Friend request / wave", "👋", "NotificationsBell, Welcome, Onboarding"],
  ["clock", "Reminder", "⏰", "payment_reminder"],
  ["spark", "New / glow", "✨ ✦ 💫 🌟", "new_follower, toasts, CoverStudio"],
  ["crown", "Super host", "👑", "organizer SuperHostsCard"],
  ["brokenheart", "Slipping away", "💔", "organizer SlippingAwayCard"],
  ["wave", "Chill / pool", "🌊 🌴", "CoverStudio presets"],
 ]],
];

if (typeof module !== "undefined") module.exports = { S, DEFS, GROUPS };
