import type { Place } from '@datespot/shared-types';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

export interface PlaceCardProps {
  place: Place;
  locked?: boolean;
  onPress?: () => void;
  categoryLabel?: string;
}

export function PlaceCard({ place, locked = false, onPress, categoryLabel }: PlaceCardProps) {
  const imageUri = place.images[0];

  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      className={`bg-white rounded-2xl overflow-hidden shadow-sm mb-4 ${locked ? 'opacity-70' : ''}`}
    >
      <View className="relative">
        {imageUri ? (
          <Image source={{ uri: imageUri }} className="w-full h-40" resizeMode="cover" />
        ) : (
          <View className="w-full h-40 bg-gray-200 items-center justify-center">
            <Text className="text-gray-400">📍</Text>
          </View>
        )}
        {locked ? (
          <View className="absolute inset-0 bg-black/40 items-center justify-center">
            <Text className="text-white text-2xl">🔒</Text>
          </View>
        ) : null}
      </View>
      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
            {place.name}
          </Text>
          <Text className="text-primary font-semibold">★ {place.rating.toFixed(1)}</Text>
        </View>
        {categoryLabel ? (
          <Text className="text-gray-500 text-sm mt-1">{categoryLabel}</Text>
        ) : null}
        {place.distanceKm != null ? (
          <Text className="text-gray-400 text-xs mt-1">{place.distanceKm.toFixed(1)} km</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
