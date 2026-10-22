// Dump every lucide icon the app imports as {Name: "<inner svg>"} for the mockups.
import fs from "fs";
import { createRequire } from "module";
const req = createRequire(process.cwd() + "/package.json");
const React = req("react"); const { renderToStaticMarkup } = req("react-dom/server"); const L = req("lucide-react");
const names = new Set();
const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = d + "/" + f.name; if (f.isDirectory()) walk(p); else if (/\.(tsx?|jsx?)$/.test(f.name)) { const s = fs.readFileSync(p, "utf8"); for (const m of s.matchAll(/import\s*\{([^}]+)\}\s*from\s*"lucide-react"/g)) m[1].split(",").map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean).forEach((n) => names.add(n)); } } };
walk("src");
["Dice5","Sparkles","Users","UsersRound","MapPin","Heart","MessageCircle","Share2","Plus","Bell","Search","Settings","SlidersHorizontal","Dices","CalendarDays","Calendar","Archive","User","Home","LayoutGrid","Camera","Link","PenLine","ImagePlus","Lock","Globe","Ghost","Eye","EyeOff","RefreshCw","ChevronLeft","ChevronRight","X","Check","Clock","Upload","Pencil","UserPlus","Gift","Cake","Sun","Moon","QrCode","Receipt","Ticket","Radar","Handshake","Wallet","Star","Flame"].forEach((n)=>names.add(n));
const out = {};
for (const n of names) { const C = L[n]; if (!C) continue; const html = renderToStaticMarkup(React.createElement(C, { size: 24 })); out[n] = html.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, ""); }
fs.writeFileSync(process.argv[2], "window.LUCIDE=" + JSON.stringify(out) + ";");
console.log(Object.keys(out).length, "icons");
