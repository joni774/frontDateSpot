import { useState } from "react";
import {
  Image,
  type ImageProps,
  type ImageStyle,
  View,
  type StyleProp,
} from "react-native";
import { colors } from "../theme/colors";

type PlaceThumbnailProps = {
  uri?: string | null;
  style: StyleProp<ImageStyle>;
  resizeMode?: ImageProps["resizeMode"];
  testID?: string;
};

export function PlaceThumbnail({
  uri,
  style,
  resizeMode = "cover",
  testID,
}: PlaceThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return (
      <View
        testID={testID ? `${testID}-placeholder` : undefined}
        style={[style, { backgroundColor: colors.surfaceContainer }]}
      />
    );
  }

  return (
    <Image
      testID={testID}
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
}
