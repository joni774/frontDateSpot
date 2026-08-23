import Svg, { Path } from "react-native-svg";

type AiTabIconProps = {
  size?: number;
  color?: string;
};

/** Sparkle / auto-awesome, matching the Stitch AI tab. */
export function AiTabIcon({ size = 24, color = "#000000" }: AiTabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.2L13.35 8.15L18.2 9.5L13.35 10.85L12 15.8L10.65 10.85L5.8 9.5L10.65 8.15L12 3.2Z"
        fill={color}
      />
      <Path
        d="M18.2 13.4L18.85 15.7L21.2 16.35L18.85 17L18.2 19.3L17.55 17L15.2 16.35L17.55 15.7L18.2 13.4Z"
        fill={color}
      />
      <Path
        d="M6.4 14.2L6.95 16.15L8.9 16.7L6.95 17.25L6.4 19.2L5.85 17.25L3.9 16.7L5.85 16.15L6.4 14.2Z"
        fill={color}
      />
    </Svg>
  );
}
