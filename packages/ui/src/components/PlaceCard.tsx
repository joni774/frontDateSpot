/**
 * Place card for home list. Tap opens place details.
 * Labels are passed from the app (i18n) so this package stays UI-only.
 */
import type { Place } from "@datespot/shared-types";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { brand } from "../theme/colors";

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
  isLocked?: boolean;
  onLockedPress?: () => void;
  sponsoredLabel?: string;
  categoryLabel?: string;
  priceLabel?: string;
  distanceLabel?: string | null;
  noPhotoLabel?: string;
  lockedLabel?: string;
  testID?: string;
}

export function PlaceCard({
  place,
  onPress,
  isLocked = false,
  onLockedPress,
  sponsoredLabel = "Sponsored",
  categoryLabel,
  priceLabel,
  distanceLabel,
  noPhotoLabel = "No photo",
  lockedLabel = "Subscribe to unlock",
  testID,
}: PlaceCardProps) {
  const imageUri = place.images[0];
  const distance =
    distanceLabel !== undefined
      ? distanceLabel
      : place.distance != null
        ? `${place.distance.toFixed(1)} km`
        : null;

  const handlePress = () => {
    if (isLocked || place.isLocked) {
      onLockedPress?.();
    } else {
      onPress();
    }
  };

  const locked = isLocked || place.isLocked;
  const sponsored = !!place.isSponsored && !locked;

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
            <Text style={styles.placeholderText}>{noPhotoLabel}</Text>
          </View>
        )}
        {locked ? (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockText}>{lockedLabel}</Text>
          </View>
        ) : null}
        {sponsored ? (
          <View style={styles.sponsoredBadge} testID="sponsored-badge">
            <Text style={styles.sponsoredText}>{sponsoredLabel}</Text>
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
          <Text style={styles.category}>
            {categoryLabel ?? place.category}
          </Text>
          <Text style={styles.price}>{priceLabel ?? place.priceRange}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: brand.surface,
    borderRadius: 14,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brand.border,
    shadowColor: "#1A1918",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 168 },
  imageLocked: { opacity: 0.35 },
  placeholder: {
    width: "100%",
    height: 168,
    backgroundColor: brand.border,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { fontSize: 13, color: brand.textMuted, fontWeight: "500" },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(26, 25, 24, 0.28)",
  },
  lockText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  sponsoredBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(26, 25, 24, 0.72)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sponsoredText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  distanceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(26, 25, 24, 0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  distanceText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  body: { paddingHorizontal: 14, paddingVertical: 12 },
  name: { fontSize: 17, fontWeight: "600", color: brand.text, marginBottom: 4 },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  category: { color: brand.textMuted, fontSize: 13 },
  price: { color: brand.textMuted, fontSize: 13, fontWeight: "500" },
});
