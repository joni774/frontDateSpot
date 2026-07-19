import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { CategoryFilter } from "../../theme/colors";

type Props = {
  category: CategoryFilter;
  size?: number;
  color?: string;
};

export function CategoryChipIcon({
  category,
  size = 14,
  color = "#FFFFFF",
}: Props) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const };

  switch (category) {
    case "ALL":
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.8" />
          <Circle cx="12" cy="12" r="3" fill={color} />
        </Svg>
      );
    case "ROMANTIC_DATE":
      return (
        <Svg {...common}>
          <Path
            d="M12 20.2C12 20.2 3.5 14.8 3.5 9.2C3.5 6.4 5.7 4.4 8.4 4.4C10 4.4 11.4 5.2 12 6.4C12.6 5.2 14 4.4 15.6 4.4C18.3 4.4 20.5 6.4 20.5 9.2C20.5 14.8 12 20.2 12 20.2Z"
            stroke={color}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "RESTAURANT":
      return (
        <Svg {...common}>
          <Path
            d="M7 4V11C7 12.1 7.9 13 9 13H10V20"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Path
            d="M5.5 4V8.5M8.5 4V8.5M11.5 4V8.5"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Path
            d="M16 4C16 4 18.5 6.5 18.5 10C18.5 12 17.2 13 16 13V20"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case "DAIRY_RESTAURANT":
      return (
        <Svg {...common}>
          <Path
            d="M8 8.5C8 6.5 9.8 4.5 12 4.5C14.2 4.5 16 6.5 16 8.5C16 11.5 12 13 12 13C12 13 8 11.5 8 8.5Z"
            stroke={color}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <Path
            d="M7 13.5C7 13.5 5.5 15 5.5 17C5.5 19.2 8.2 20.5 12 20.5C15.8 20.5 18.5 19.2 18.5 17C18.5 15 17 13.5 17 13.5"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </Svg>
      );
    case "MEAT_RESTAURANT":
      return (
        <Svg {...common}>
          <Path
            d="M6.5 14.5C6.5 11 9 8 12.5 7C15.5 6.1 18.5 7.8 19 10.5C19.4 12.8 18 14.8 16 15.5C14.5 16 13.2 15.8 12 15"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M5 16.5C5.8 18.8 8.5 20.5 12 20.5C14.2 20.5 16.1 19.7 17.3 18.4"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Circle cx="14.5" cy="11" r="1.2" fill={color} />
        </Svg>
      );
    case "SUSHI":
      return (
        <Svg {...common}>
          <Rect
            x="4"
            y="9"
            width="16"
            height="7"
            rx="3.5"
            stroke={color}
            strokeWidth="1.8"
          />
          <Circle cx="9" cy="12.5" r="1.4" fill={color} />
          <Circle cx="12.5" cy="12.5" r="1.4" fill={color} />
          <Circle cx="16" cy="12.5" r="1.4" fill={color} />
        </Svg>
      );
    case "SUNSET":
      return (
        <Svg {...common}>
          <Path
            d="M12 4V6.5M5.5 10.5L7.3 11.5M18.5 10.5L16.7 11.5"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Path
            d="M7.5 15.5C8.4 13.6 10.1 12.5 12 12.5C13.9 12.5 15.6 13.6 16.5 15.5"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Path
            d="M4 18H20M7 20.5H17"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </Svg>
      );
    case "ATTRACTION":
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
          <Path
            d="M12 3V5.5M12 18.5V21M3 12H5.5M18.5 12H21M6.2 6.2L8 8M16 16L17.8 17.8M17.8 6.2L16 8M8 16L6.2 17.8"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </Svg>
      );
  }
}
