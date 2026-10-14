// Layout for the 1200x630 event share image (Open Graph).
// Plain element objects (no JSX) so the same file runs in Supabase Edge (Deno)
// and in a local Node test with satori.

export type OgCard = {
  name?: string;
  date?: string | null; // YYYY-MM-DD
  time?: string | null; // HH:MM[:SS]
  location?: string | null;
  city?: string | null;
  image_url?: string | null;
  description?: string | null;
  going_count?: number; // leave undefined to hide the people line (private/brand card)
  avatars?: string[]; // avatar image URLs of people going (max 4 used)
};

const BG = "#090A0F";
const INK = "#EFF0F5";
const MUTED = "#9C99AD";
const PURPLE = "#8B5CF6";
const PURPLE_BTN = "#7C3AED";
const LILAC = "#A78BFA";

// deno-lint-ignore no-explicit-any
type El = { type: string; props: Record<string, any> };
// deno-lint-ignore no-explicit-any
const h = (type: string, style: Record<string, any>, ...children: any[]): El => ({
  type,
  props: { style: { display: "flex", ...style }, children: children.length === 1 ? children[0] : children },
});
const img = (src: string, style: Record<string, unknown>): El => ({ type: "img", props: { src, style } });

// Same rounded bracket as the app logo.
const bracket = (flip: boolean, hgt: number): El => {
  const w = hgt * 0.3, s = hgt * 0.11, r = w * 0.92, o = s / 2;
  const d = `M ${w} ${o} H ${o + r} A ${r - o} ${r - o} 0 0 0 ${o} ${r} V ${hgt - r} A ${r - o} ${r - o} 0 0 0 ${o + r} ${hgt - o} H ${w}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}"><path d="${d}" fill="none" stroke="${PURPLE}" stroke-width="${s}"/></svg>`;
  return img(`data:image/svg+xml;base64,${btoa(svg)}`, { width: w, height: hgt, transform: flip ? "scaleX(-1)" : "none" });
};

const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${LILAC}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

const checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

const parseCover = (description?: string | null) => {
  const m = (description ?? "").match(/\[\[cover:([^|]+)\|([^\]]+)\]\]/);
  return m ? { emoji: m[1], color: m[2] } : null;
};

export const formatWhen = (date?: string | null, time?: string | null) => {
  const parts: string[] = [];
  if (date) {
    const d = new Date(date + "T12:00:00Z");
    parts.push(d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).toUpperCase());
  }
  if (time) parts.push(time.slice(0, 5));
  return parts.join(" · ");
};

export function eventOgLayout(card: OgCard): El {
  const name = card.name ?? "I am in";
  const when = formatWhen(card.date, card.time);
  const where = [card.location, card.city].filter(Boolean).join(", ");
  const going = card.going_count ?? 0;
  const avatars = (card.avatars ?? []).filter(Boolean).slice(0, 4);
  const cover = parseCover(card.description);
  const titleSize = name.length > 40 ? 46 : name.length > 22 ? 56 : 66;
  const shownName = name.length > 70 ? name.slice(0, 67) + "…" : name;

  // Left: the flyer, the emoji cover, or the logo when the event has neither.
  const logoBig = h("div", { alignItems: "center" },
    h("span", { fontSize: 64, fontWeight: 700, marginRight: 14 }, "I am"), bracket(false, 96), h("span", { fontSize: 84, fontWeight: 700, margin: "0 10px" }, "IN"), bracket(true, 96));
  const left = card.image_url
    ? img(card.image_url, { position: "absolute", left: 0, top: 0, width: 520, height: 630, objectFit: "cover" })
    : h("div", { position: "absolute", left: 0, top: 0, width: 520, height: 630, alignItems: "center", justifyContent: "center",
        backgroundColor: cover ? `hsl(${cover.color.replace(/ /g, ", ")})` : "#1B1530", fontSize: 220 }, cover ? cover.emoji : logoBig);

  const people = card.going_count === undefined
    ? h("div", { marginTop: 22, fontSize: 30, fontWeight: 500, color: MUTED }, "See who’s in with your friends.")
    : going > 0
    ? h("div", { alignItems: "center", marginTop: 34 },
        avatars.length ? h("div", { marginRight: 18 },
          ...avatars.map((src, i) => img(src, { width: 66, height: 66, borderRadius: 33, border: `4px solid ${BG}`, marginLeft: i ? -18 : 0, objectFit: "cover" }))) : h("div", {}),
        h("div", { fontSize: 30, fontWeight: 500, color: INK },
          h("span", { color: PURPLE, fontWeight: 700, marginRight: 8 }, `${going} ${going === 1 ? "person" : "people"}`),
          going === 1 ? "is in" : "are in"))
    : h("div", { marginTop: 34, fontSize: 30, fontWeight: 500, color: MUTED }, "Be the first one in");

  return h("div", { position: "relative", width: 1200, height: 630, backgroundColor: BG, fontFamily: "Space Grotesk", color: INK },
    left,
    h("div", { position: "absolute", left: 380, top: 0, width: 160, height: 630, backgroundImage: `linear-gradient(90deg, rgba(9,10,15,0), ${BG})` }),
    h("div", { position: "absolute", left: 760, top: 260, width: 520, height: 520, borderRadius: 260,
      backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.45) 0%, rgba(124,58,237,0) 70%)" }),
    // Right column: flows top to bottom so long titles push the rest down.
    h("div", { position: "absolute", left: 576, top: 66, width: 584, height: 500, flexDirection: "column" },
      when ? h("div", { fontSize: 24, fontWeight: 700, letterSpacing: 3, color: LILAC, marginBottom: 12 }, when) : h("div", {}),
      h("div", { fontSize: titleSize, fontWeight: 700, lineHeight: 1.04, letterSpacing: -1.5 }, shownName),
      where
        ? h("div", { alignItems: "center", fontSize: 28, color: "#C9C6D6", fontWeight: 500, marginTop: 22 },
            img(`data:image/svg+xml;base64,${btoa(pinSvg)}`, { width: 28, height: 28, marginRight: 10 }), where)
        : h("div", {}),
      people,
      h("div", { marginTop: 34 },
        h("div", { alignItems: "center", padding: "16px 30px", borderRadius: 999, backgroundColor: PURPLE_BTN, fontSize: 28, fontWeight: 700,
          boxShadow: "0 0 40px rgba(124,58,237,0.5)" },
          img(`data:image/svg+xml;base64,${btoa(checkSvg)}`, { width: 26, height: 26, marginRight: 10 }), "I’m in"))),
    h("div", { position: "absolute", right: 40, bottom: 30, alignItems: "center", fontSize: 22, fontWeight: 700 },
      h("span", { marginRight: 8 }, "I am"), bracket(false, 30), h("span", { fontSize: 26, margin: "0 4px" }, "IN"), bracket(true, 30)),
  );
}
