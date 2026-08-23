/** DateSpot brand — Stitch: terracotta rust, warm stone, coral accent */
export const colors = {
  primary: "#A43C12",
  primaryLight: "#FF7F50",
  primaryDark: "#6C2000",
  accent: "#4A6578",
  secondary: "#95445C",
  background: "#FAF9F7",
  surface: "#FFFFFF",
  surfaceContainer: "#EFEEEC",
  surfaceContainerHigh: "#E9E8E6",
  text: "#1A1C1B",
  textMuted: "#57423B",
  border: "#DEC0B6",
  outline: "#8B7169",
  error: "#BA1A1A",
  coral: "#FF7F50",
  tertiary: "#006970",
  /** Legacy alias — warm stone wash */
  cream: "#F4F3F1",
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

function chipTheme(color: string, colorDeep: string): CategoryTheme {
  return {
    color,
    colorDeep,
    inactiveBg: colors.surfaceContainerHigh,
    inactiveBorder: "transparent",
    inactiveText: colors.textMuted,
    iconBg: colors.surfaceContainerHigh,
    ripple: `${color}33`,
  };
}

/** Circular category chips — terracotta when active, stone when idle */
export const CATEGORY_THEMES: Record<CategoryFilter, CategoryTheme> = {
  ALL: chipTheme("#A43C12", "#6C2000"),
  ROMANTIC_DATE: chipTheme("#95445C", "#782D45"),
  RESTAURANT: chipTheme("#A43C12", "#6C2000"),
  DAIRY_RESTAURANT: chipTheme("#006970", "#004F54"),
  MEAT_RESTAURANT: chipTheme("#822800", "#6C2000"),
  SUSHI: chipTheme("#006970", "#004145"),
  SUNSET: chipTheme("#FF7F50", "#A43C12"),
  ATTRACTION: chipTheme("#4A6578", "#334856"),
};

export const CATEGORY_BADGE: Record<
  Exclude<CategoryFilter, "ALL">,
  string
> = {
  ROMANTIC_DATE: "bg-secondary/10 text-secondary",
  RESTAURANT: "bg-primary/10 text-primary",
  DAIRY_RESTAURANT: "bg-accent/15 text-accent",
  MEAT_RESTAURANT: "bg-primary/10 text-primary-dark",
  SUSHI: "bg-accent/10 text-accent",
  SUNSET: "bg-primary/10 text-primary",
  ATTRACTION: "bg-cream text-text-muted",
};
