/**
 * Place card for home list. FREE users see places 6+ as locked (isLocked=true):
 * blurred image, lock overlay, tap navigates to subscription.
 */
import type { Place, PlaceCategory, PriceRange } from "@datespot/shared-types";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { brand } from "../theme/colors";

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  ROMANTIC_DATE: "💕 Date",
  RESTAURANT: "🍽 Restaurant",
  DAIRY_RESTAURANT: "🧀 Dairy",
  MEAT_RESTAURANT: "🥩 Meat",
  SUSHI: "🍣 Sushi",
  SUNSET: "🌅 Sunset",
  ATTRACTION: "🎡 Attraction",
};

const PRICE_LABELS: Record<PriceRange, string> = {
  FREE: "Free",
  BUDGET: "₪",
  MODERATE: "₪₪",
  EXPENSIVE: "₪₪₪",
};

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
  isLocked?: boolean;
  onLockedPress?: () => void;
  testID?: string;
}

export function PlaceCard({
  place,
  onPress,
  isLocked = false,
  onLockedPress,
  testID,
}: PlaceCardProps) {
  const imageUri = place.images[0];
  const distance =
    place.distance != null ? `${place.distance.toFixed(1)} km` : null;

  const handlePress = () => {
    if (isLocked || place.isLocked) {
      onLockedPress?.();
    } else {
      onPress();
    }
  };

  const locked = isLocked || place.isLocked;

  return (
    <Pressable onPress={handlePress} style={styles.card} testID={testID}>
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[styles.image, locked && styles.imageLocked]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholder, locked && styles.imageLocked]}>
            <Text style={styles.placeholderEmoji}>📍</Text>
          </View>
        )}
        {locked ? (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockText}>Subscribe to unlock</Text>
          </View>
        ) : null}
        {distance && !locked ? (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{distance}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.category}>{CATEGORY_LABELS[place.category]}</Text>
          <Text style={styles.price}>{PRICE_LABELS[place.priceRange]}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: brand.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: brand.border,
  },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 176 },
  imageLocked: { opacity: 0.3 },
  placeholder: {
    width: "100%",
    height: 176,
    backgroundColor: brand.border,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: { fontSize: 36 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: { fontSize: 28, marginBottom: 4 },
  lockText: { color: brand.primary, fontWeight: "600", fontSize: 14 },
  distanceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  distanceText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  body: { padding: 16 },
  name: { fontSize: 18, fontWeight: "700", color: brand.text, marginBottom: 4 },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  category: { color: brand.textMuted, fontSize: 14 },
  price: { color: brand.textMuted, fontSize: 14, fontWeight: "500" },
});
