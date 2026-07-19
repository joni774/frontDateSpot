import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import {
  ImageBackground,
  Platform,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from "react-native";

const webGlassBlur = {
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
} as ViewStyle;

const glassBlur = Platform.select<ViewStyle>({
  web: webGlassBlur,
  default: {},
});

export const glassPanel: ViewStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.52)",
  borderBottomWidth: 1,
  borderBottomColor: "rgba(255, 255, 255, 0.38)",
  ...glassBlur,
};

export const glassCircle: ViewStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.38)",
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.55)",
  ...glassBlur,
};

type TimeOfDay = "sunrise" | "day" | "sunset" | "night";

type SceneryPreset = {
  colors: string[];
  locations: number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
  sunOuter: ViewStyle;
  sunInner: ViewStyle;
  horizonGlow: ViewStyle;
};

export function getTimeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours();

  if (hour >= 5 && hour < 11) return "sunrise";
  if (hour >= 17 && hour < 21) return "sunset";
  if (hour >= 11 && hour < 17) return "day";
  return "night";
}

export type GreetingPeriod = "morning" | "afternoon" | "evening" | "night";

export function getGreetingPeriod(date = new Date()): GreetingPeriod {
  const timeOfDay = getTimeOfDay(date);

  if (timeOfDay === "sunrise") return "morning";
  if (timeOfDay === "day") return "afternoon";
  if (timeOfDay === "sunset") return "evening";
  return "night";
}

export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

const SCENERY: Record<TimeOfDay, SceneryPreset> = {
  sunrise: {
    colors: [
      "#0c1445",
      "#1e3a8a",
      "#2563eb",
      "#60a5fa",
      "#fbbf24",
      "#fb923c",
      "#fde68a",
      "#fff7ed",
    ],
    locations: [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.86, 1],
    start: { x: 0, y: 0 },
    end: { x: 0.6, y: 1 },
    sunOuter: {
      top: 48,
      left: -56,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: "rgba(251, 191, 36, 0.38)",
    },
    sunInner: {
      top: 96,
      left: 8,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(254, 240, 138, 0.62)",
    },
    horizonGlow: {
      bottom: 0,
      left: 0,
      right: 0,
      height: "42%",
      backgroundColor: "rgba(254, 215, 170, 0.22)",
    },
  },
  day: {
    colors: ["#7BA3B8", "#9BBFD0", "#B8D4E0", "#D4E8F0", "#EEF4F7", "#FAF6F3"],
    locations: [0, 0.2, 0.4, 0.6, 0.8, 1],
    start: { x: 0.2, y: 0 },
    end: { x: 0.8, y: 1 },
    sunOuter: {
      top: -40,
      right: 32,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: "rgba(250, 204, 21, 0.35)",
    },
    sunInner: {
      top: 8,
      right: 72,
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: "rgba(253, 224, 71, 0.55)",
    },
    horizonGlow: {
      bottom: 0,
      left: 0,
      right: 0,
      height: "30%",
      backgroundColor: "rgba(186, 230, 253, 0.2)",
    },
  },
  sunset: {
    colors: [
      "#2A2224",
      "#4A3544",
      "#6E4A5A",
      "#B84A62",
      "#D47388",
      "#D4956A",
      "#E8B88A",
      "#FAF0E8",
    ],
    locations: [0, 0.12, 0.28, 0.42, 0.55, 0.72, 0.86, 1],
    start: { x: 0.1, y: 0 },
    end: { x: 0.9, y: 1 },
    sunOuter: {
      top: -72,
      right: -48,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: "rgba(255, 183, 77, 0.35)",
    },
    sunInner: {
      top: -16,
      right: 28,
      width: 128,
      height: 128,
      borderRadius: 64,
      backgroundColor: "rgba(255, 224, 130, 0.55)",
    },
    horizonGlow: {
      bottom: 0,
      left: 0,
      right: 0,
      height: "45%",
      backgroundColor: "rgba(255, 236, 179, 0.18)",
    },
  },
  night: {
    colors: ["#1A1520", "#2A2224", "#3D3244", "#4A3544", "#5E4B63", "#2A2224"],
    locations: [0, 0.2, 0.4, 0.55, 0.75, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    sunOuter: {
      top: 32,
      right: 40,
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: "rgba(226, 232, 240, 0.18)",
    },
    sunInner: {
      top: 52,
      right: 60,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "rgba(248, 250, 252, 0.35)",
    },
    horizonGlow: {
      bottom: 0,
      left: 0,
      right: 0,
      height: "35%",
      backgroundColor: "rgba(49, 46, 129, 0.25)",
    },
  },
};

type TopPanelPreset = {
  image: ImageSourcePropType;
  colors: string[];
  locations: number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

const TOP_PANEL_IMAGES: Record<TimeOfDay, ImageSourcePropType> = {
  sunrise: {
    uri: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&q=80&auto=format&fit=crop",
  },
  day: {
    uri: "https://images.unsplash.com/photo-1488459716781-31db71592aa9?w=1200&q=80&auto=format&fit=crop",
  },
  sunset: {
    uri: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80&auto=format&fit=crop",
  },
  night: require("../../assets/images/tel-aviv-night.jpg"),
};

const TOP_PANEL: Record<TimeOfDay, TopPanelPreset> = {
  sunrise: {
    image: TOP_PANEL_IMAGES.sunrise,
    colors: [
      "rgba(15, 23, 42, 0.55)",
      "rgba(30, 58, 138, 0.45)",
      "rgba(251, 146, 60, 0.35)",
      "rgba(253, 186, 116, 0.25)",
    ],
    locations: [0, 0.35, 0.7, 1],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  day: {
    image: TOP_PANEL_IMAGES.day,
    colors: [
      "rgba(42, 34, 36, 0.4)",
      "rgba(94, 75, 99, 0.32)",
      "rgba(184, 74, 98, 0.22)",
      "rgba(255, 255, 255, 0.1)",
    ],
    locations: [0, 0.4, 0.75, 1],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  sunset: {
    image: TOP_PANEL_IMAGES.sunset,
    colors: [
      "rgba(42, 34, 36, 0.6)",
      "rgba(110, 75, 90, 0.48)",
      "rgba(184, 74, 98, 0.38)",
      "rgba(212, 149, 106, 0.28)",
    ],
    locations: [0, 0.35, 0.68, 1],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  night: {
    image: TOP_PANEL_IMAGES.night,
    colors: [
      "rgba(26, 21, 32, 0.78)",
      "rgba(62, 50, 68, 0.62)",
      "rgba(94, 75, 99, 0.48)",
      "rgba(42, 34, 36, 0.38)",
    ],
    locations: [0, 0.3, 0.65, 1],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
};

export function HomeTopPanel({ children }: { children: React.ReactNode }) {
  const preset = useMemo(() => TOP_PANEL[getTimeOfDay()], []);

  return (
    <View style={[topPanelStyles.wrap, glassBlur]}>
      <ImageBackground
        source={preset.image}
        style={topPanelStyles.image}
        imageStyle={topPanelStyles.imageInner}
        resizeMode="cover"
      >
        <LinearGradient
          colors={preset.colors}
          locations={preset.locations}
          start={preset.start}
          end={preset.end}
          style={StyleSheet.absoluteFill}
        />
        <View style={topPanelStyles.content}>{children}</View>
      </ImageBackground>
    </View>
  );
}

export function SunsetSceneryBackground({ children }: { children: React.ReactNode }) {
  const scenery = useMemo(() => SCENERY[getTimeOfDay()], []);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={scenery.colors}
        locations={scenery.locations}
        start={scenery.start}
        end={scenery.end}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.glow, scenery.sunOuter]} />
      <View style={[styles.glow, scenery.sunInner]} />
      <View style={[styles.horizonGlow, scenery.horizonGlow]} />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  glow: {
    position: "absolute",
  },
  horizonGlow: {
    position: "absolute",
  },
});

const topPanelStyles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  image: {
    width: "100%",
  },
  imageInner: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});
