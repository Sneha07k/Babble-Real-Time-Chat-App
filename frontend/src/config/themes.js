// per-chat looks; keys must match CHAT_THEMES in backend/config/constants.js
// "mine" sits behind white text, so its colours stay dark enough to read

const dots = "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px) 0 0 / 20px 20px";
const stars =
  "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1.5px) 0 0 / 60px 60px, " +
  "radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1.5px) 30px 30px / 60px 60px";

const glow = (a, b, base) =>
  `radial-gradient(circle at 15% 20%, ${a}, transparent 45%), ` +
  `radial-gradient(circle at 85% 85%, ${b}, transparent 50%), ${base}`;

export const THEMES = {
  default: {
    name: "Babble",
    emoji: "💬",
    wallpaper: `${dots}, ${glow("color-mix(in srgb, var(--c1) 28%, transparent)", "color-mix(in srgb, var(--c2) 22%, transparent)", "var(--bg)")}`,
    mine: "var(--gradient)",
    swatch: "var(--gradient)",
  },
  sunset: {
    name: "Sunset",
    emoji: "🌅",
    wallpaper: `${dots}, ${glow("rgba(249,115,22,0.3)", "rgba(219,39,119,0.25)", "#24101c")}`,
    mine: "linear-gradient(135deg, #c2410c 0%, #be185d 100%)",
    swatch: "linear-gradient(135deg, #f97316, #db2777)",
  },
  ocean: {
    name: "Ocean",
    emoji: "🌊",
    wallpaper: `${dots}, ${glow("rgba(6,182,212,0.25)", "rgba(37,99,235,0.25)", "#071a2b")}`,
    mine: "linear-gradient(135deg, #0369a1 0%, #0e7490 100%)",
    swatch: "linear-gradient(135deg, #0ea5e9, #2563eb)",
  },
  forest: {
    name: "Forest",
    emoji: "🌿",
    wallpaper: `${dots}, ${glow("rgba(34,197,94,0.2)", "rgba(20,184,166,0.2)", "#0b1d15")}`,
    mine: "linear-gradient(135deg, #15803d 0%, #0f766e 100%)",
    swatch: "linear-gradient(135deg, #22c55e, #14b8a6)",
  },
  candy: {
    name: "Candy",
    emoji: "🍬",
    wallpaper: `${dots}, ${glow("rgba(236,72,153,0.3)", "rgba(192,38,211,0.28)", "#26102a")}`,
    mine: "linear-gradient(135deg, #a21caf 0%, #be185d 100%)",
    swatch: "linear-gradient(135deg, #ec4899, #c026d3)",
  },
  galaxy: {
    name: "Galaxy",
    emoji: "🌌",
    wallpaper: `${stars}, ${glow("rgba(79,70,229,0.35)", "rgba(147,51,234,0.3)", "#080617")}`,
    mine: "linear-gradient(135deg, #4338ca 0%, #7e22ce 100%)",
    swatch: "linear-gradient(135deg, #4f46e5, #9333ea)",
  },
  lemonade: {
    name: "Lemonade",
    emoji: "🍋",
    wallpaper: `${dots}, ${glow("rgba(234,179,8,0.22)", "rgba(132,204,22,0.18)", "#1b1808")}`,
    mine: "linear-gradient(135deg, #a16207 0%, #4d7c0f 100%)",
    swatch: "linear-gradient(135deg, #eab308, #84cc16)",
  },
  midnight: {
    name: "Midnight",
    emoji: "🌙",
    wallpaper: `${dots}, #0b0d14`,
    mine: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
    swatch: "linear-gradient(135deg, #475569, #0f172a)",
  },
};

export const themeOf = (chat) => THEMES[chat?.theme] || THEMES.default;
