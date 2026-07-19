/** DateSpot brand palette — warm evening / romantic tones */
export const colors = {
  primary: "#B84A62",
  primaryLight: "#D47388",
  primaryDark: "#8F3A4D",
  accent: "#D4956A",
  secondary: "#5E4B63",
  background: "#FAF6F3",
  surface: "#FFFFFF",
  text: "#2A2224",
  textMuted: "#7A6B6F",
  border: "#EDE5E1",
  cream: "#F5EDE8",
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
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  ripple: string;
};

function chipTheme(hex: string): CategoryTheme {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return {
    color: hex,
    inactiveBg: `rgba(${r}, ${g}, ${b}, 0.28)`,
    inactiveBorder: `rgba(${r}, ${g}, ${b}, 0.58)`,
    inactiveText: "#FFFFFF",
    ripple: `rgba(${r}, ${g}, ${b}, 0.2)`,
  };
}

export const CATEGORY_THEMES: Record<CategoryFilter, CategoryTheme> = {
  ALL: chipTheme("#6E5B7A"),
  ROMANTIC_DATE: chipTheme(colors.primary),
  RESTAURANT: chipTheme("#C17A4A"),
  DAIRY_RESTAURANT: chipTheme("#6B8F9C"),
  MEAT_RESTAURANT: chipTheme("#9B4A4A"),
  SUSHI: chipTheme("#A85C72"),
  SUNSET: chipTheme("#C9924E"),
  ATTRACTION: chipTheme("#6E7F9C"),
};

export const CATEGORY_BADGE: Record<
  Exclude<CategoryFilter, "ALL">,
  string
> = {
  ROMANTIC_DATE: "bg-rose-100 text-rose-800",
  RESTAURANT: "bg-orange-100 text-orange-800",
  DAIRY_RESTAURANT: "bg-sky-100 text-sky-800",
  MEAT_RESTAURANT: "bg-red-100 text-red-800",
  SUSHI: "bg-pink-100 text-pink-800",
  SUNSET: "bg-amber-100 text-amber-800",
  ATTRACTION: "bg-slate-100 text-slate-700",
};
