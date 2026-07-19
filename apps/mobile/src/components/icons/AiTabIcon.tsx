import Svg, { Circle, Path } from "react-native-svg";

type AiTabIconProps = {
  size?: number;
  color?: string;
};

export function AiTabIcon({ size = 24, color = "#000000" }: AiTabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C7.58 3 4 6.13 4 10C4 12.38 5.34 14.47 7.4 15.7V19.2C7.4 19.75 7.95 20.15 8.47 19.95L11.2 18.9C11.46 18.95 11.73 19 12 19C16.42 19 20 15.87 20 10C20 6.13 16.42 3 12 3Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="10" r="1.2" fill={color} />
      <Circle cx="12" cy="10" r="1.2" fill={color} />
      <Circle cx="15" cy="10" r="1.2" fill={color} />
    </Svg>
  );
}
