/** DateSpot brand — city evening: cool stone neutrals, deep wine accent */
export const colors = {
  primary: "#7C3048",
  primaryLight: "#A04D66",
  primaryDark: "#5A2235",
  accent: "#4A6578",
  secondary: "#3F4A56",
  background: "#F1F0EE",
  surface: "#FFFFFF",
  text: "#1A1918",
  textMuted: "#6A6563",
  border: "#E2DFDB",
  /** Legacy alias — cool stone wash (not cream) */
  cream: "#EAE8E5",
} as const;

export type CategoryFilter =
  | "ALL"
  | "ROMANTIC_DATE"
  | "RESTAURANT"
  | "DAIRY_RESTAURANT"
  | "MEAT_RESTAURANT"
  | "SUSHI"
  | "SUNSET"
  | "ATTRACTION";

export type CategoryTheme = {
  color: string;
  colorDeep: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  iconBg: string;
  ripple: string;
};

const CHIP_GLASS_BG = "rgba(255, 255, 255, 0.42)";
const CHIP_GLASS_BORDER = "rgba(255, 255, 255, 0.38)";

function chipTheme(color: string, colorDeep: string): CategoryTheme {
  return {
    color,
    colorDeep,
    inactiveBg: CHIP_GLASS_BG,
    inactiveBorder: CHIP_GLASS_BORDER,
    inactiveText: "#FFFFFF",
    iconBg: `${color}33`,
    ripple: `${color}33`,
  };
}

/** Soft dusk accents — readable on glass, distinct when browsing */
export const CATEGORY_THEMES: Record<CategoryFilter, CategoryTheme> = {
  ALL: chipTheme("#7C3048", "#5A2235"),
  ROMANTIC_DATE: chipTheme("#9B4560", "#6E2F44"),
  RESTAURANT: chipTheme("#6E5548", "#4A3A32"),
  DAIRY_RESTAURANT: chipTheme("#5A7A8A", "#3D5562"),
  MEAT_RESTAURANT: chipTheme("#8A4A42", "#5C312C"),
  SUSHI: chipTheme("#3F6B6A", "#2A4A49"),
  SUNSET: chipTheme("#B07850", "#7A5336"),
  ATTRACTION: chipTheme("#4A6578", "#334856"),
};

export const CATEGORY_BADGE: Record<
  Exclude<CategoryFilter, "ALL">,
  string
> = {
  ROMANTIC_DATE: "bg-primary/10 text-primary",
  RESTAURANT: "bg-secondary/10 text-secondary",
  DAIRY_RESTAURANT: "bg-accent/15 text-accent",
  MEAT_RESTAURANT: "bg-primary/10 text-primary-dark",
  SUSHI: "bg-accent/10 text-accent",
  SUNSET: "bg-secondary/10 text-secondary",
  ATTRACTION: "bg-cream text-text-muted",
};
