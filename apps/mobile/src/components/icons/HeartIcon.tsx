import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
  filled?: boolean;
};

export function HeartIcon({
  size = 22,
  color = "#A43C12",
  filled = false,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20.2C12 20.2 3.5 14.8 3.5 9.2C3.5 6.4 5.7 4.4 8.4 4.4C10 4.4 11.4 5.2 12 6.4C12.6 5.2 14 4.4 15.6 4.4C18.3 4.4 20.5 6.4 20.5 9.2C20.5 14.8 12 20.2 12 20.2Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill={filled ? color : "none"}
      />
    </Svg>
  );
}
