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
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
} as ViewStyle;

const glassBlur = Platform.select<ViewStyle>({
  web: webGlassBlur,
  default: {},
});

/** Soft translucent control — quieter than frosted glass candy */
export const glassPanel: ViewStyle = {
  backgroundColor: "rgba(26, 25, 24, 0.28)",
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: "rgba(255, 255, 255, 0.12)",
  ...glassBlur,
};

export const glassCircle: ViewStyle = {
  backgroundColor: "rgba(26, 25, 24, 0.35)",
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: "rgba(255, 255, 255, 0.22)",
  ...glassBlur,
};

type TimeOfDay = "sunrise" | "day" | "sunset" | "night";

type SceneryPreset = {
  colors: string[];
  locations: number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
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

/** Quiet washes into stone background — no multi-stop sky candy */
const SCENERY: Record<TimeOfDay, SceneryPreset> = {
  sunrise: {
    colors: ["#D8D4CF", "#E8E5E1", "#F1F0EE"],
    locations: [0, 0.45, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  day: {
    colors: ["#D5D9DC", "#E6E8E9", "#F1F0EE"],
    locations: [0, 0.4, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  sunset: {
    colors: ["#C9B8BC", "#E0D8D6", "#F1F0EE"],
    locations: [0, 0.4, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  night: {
    colors: ["#2A2E34", "#3F4A56", "#F1F0EE"],
    locations: [0, 0.35, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
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

/** Photo-first overlays — dark wash only, no rainbow candy */
const TOP_PANEL: Record<TimeOfDay, TopPanelPreset> = {
  sunrise: {
    image: TOP_PANEL_IMAGES.sunrise,
    colors: ["rgba(26, 25, 24, 0.55)", "rgba(26, 25, 24, 0.28)", "rgba(26, 25, 24, 0.12)"],
    locations: [0, 0.55, 1],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  day: {
    image: TOP_PANEL_IMAGES.day,
    colors: ["rgba(26, 25, 24, 0.5)", "rgba(26, 25, 24, 0.25)", "rgba(26, 25, 24, 0.1)"],
    locations: [0, 0.55, 1],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  sunset: {
    image: TOP_PANEL_IMAGES.sunset,
    colors: ["rgba(26, 25, 24, 0.58)", "rgba(90, 34, 53, 0.32)", "rgba(26, 25, 24, 0.14)"],
    locations: [0, 0.55, 1],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  night: {
    image: TOP_PANEL_IMAGES.night,
    colors: ["rgba(18, 20, 24, 0.72)", "rgba(42, 46, 52, 0.45)", "rgba(26, 25, 24, 0.2)"],
    locations: [0, 0.5, 1],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
};

export function HomeTopPanel({ children }: { children: React.ReactNode }) {
  const preset = useMemo(() => TOP_PANEL[getTimeOfDay()], []);

  return (
    <View style={topPanelStyles.wrap}>
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
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

const topPanelStyles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#1A1918",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  image: {
    width: "100%",
  },
  imageInner: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});
