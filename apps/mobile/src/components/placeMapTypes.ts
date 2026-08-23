export type PlaceMarker = {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type PlaceMapProps = {
  coords: { lat: number; lng: number };
  places: PlaceMarker[];
  selectedPlaceId?: string | null;
  onPlacePress?: (placeId: string) => void;
  zoomDelta?: number;
};

export function hasCoords(
  place: PlaceMarker
): place is PlaceMarker & { latitude: number; longitude: number } {
  return (
    typeof place.latitude === "number" &&
    Number.isFinite(place.latitude) &&
    typeof place.longitude === "number" &&
    Number.isFinite(place.longitude)
  );
}
