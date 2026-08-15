import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Linking, Platform } from "react-native";

/** Tel Aviv center — used only when the user explicitly skips GPS. */
export const DEFAULT_COORDS = { lat: 32.0853, lng: 34.7818 };

/** Default search radius; Google Nearby Search caps at 50 km. */
export const DEFAULT_PLACES_RADIUS_KM = 10;
export const PLACES_RADIUS_OPTIONS_KM = [5, 10, 20, 50] as const;
/** @deprecated Use DEFAULT_PLACES_RADIUS_KM */
export const PLACES_SEARCH_RADIUS_KM = DEFAULT_PLACES_RADIUS_KM;

const LAST_COORDS_KEY = "@datespot/lastDeviceCoords";

export type DeviceCoords = { lat: number; lng: number };

export type DeviceLocationResult = {
  coords: DeviceCoords;
  denied: boolean;
  unavailable: boolean;
  servicesOff: boolean;
  canAskAgain: boolean;
  fromDevice: boolean;
};

const QUICK_FIX_TIMEOUT_MS = 20000;
const WATCH_FIX_TIMEOUT_MS = 25000;

function fallbackResult(
  overrides: Partial<DeviceLocationResult> = {}
): DeviceLocationResult {
  return {
    coords: DEFAULT_COORDS,
    denied: false,
    unavailable: false,
    servicesOff: false,
    canAskAgain: true,
    fromDevice: false,
    ...overrides,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function toCoords(position: Location.LocationObject): DeviceCoords {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
}

async function readCachedCoords(): Promise<DeviceCoords | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_COORDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeviceCoords;
    if (
      typeof parsed.lat === "number" &&
      Number.isFinite(parsed.lat) &&
      typeof parsed.lng === "number" &&
      Number.isFinite(parsed.lng)
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupt cache
  }
  return null;
}

async function writeCachedCoords(coords: DeviceCoords) {
  try {
    await AsyncStorage.setItem(LAST_COORDS_KEY, JSON.stringify(coords));
  } catch {
    // ignore cache write errors
  }
}

async function watchForFix(ms: number): Promise<Location.LocationObject> {
  let subscription: Location.LocationSubscription | null = null;
  try {
    return await new Promise<Location.LocationObject>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("watch_timeout")), ms);
      void Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Lowest,
          distanceInterval: 0,
          mayShowUserSettingsDialog: true,
        },
        (position) => {
          clearTimeout(timer);
          resolve(position);
        }
      )
        .then((sub) => {
          subscription = sub;
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  } finally {
    subscription?.remove();
  }
}

async function readNativePosition(): Promise<Location.LocationObject> {
  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: 30 * 60 * 1000,
  });

  try {
    return await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
        mayShowUserSettingsDialog: true,
      }),
      QUICK_FIX_TIMEOUT_MS,
      "location_timeout_lowest"
    );
  } catch {
    if (lastKnown) return lastKnown;
  }

  try {
    return await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
        mayShowUserSettingsDialog: true,
      }),
      QUICK_FIX_TIMEOUT_MS,
      "location_timeout_low"
    );
  } catch {
    if (lastKnown) return lastKnown;
  }

  return watchForFix(WATCH_FIX_TIMEOUT_MS);
}

async function resolveWebCoords(): Promise<DeviceLocationResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return fallbackResult({ unavailable: true });
  }

  try {
    const permission = await navigator.permissions?.query({
      name: "geolocation",
    });
    if (permission?.state === "denied") {
      return fallbackResult({ denied: true, canAskAgain: false });
    }
  } catch {
    // permissions API unsupported — fall through to geolocation request
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: QUICK_FIX_TIMEOUT_MS,
        maximumAge: 60_000,
      });
    });

    const coords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
    await writeCachedCoords(coords);
    return {
      coords,
      denied: false,
      unavailable: false,
      servicesOff: false,
      canAskAgain: true,
      fromDevice: true,
    };
  } catch (error) {
    const denied =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 1;
    return fallbackResult({
      denied,
      unavailable: !denied,
      canAskAgain: !denied,
    });
  }
}

export async function describeCoords(coords: DeviceCoords): Promise<string | null> {
  try {
    const places = await Location.reverseGeocodeAsync({
      latitude: coords.lat,
      longitude: coords.lng,
    });
    const place = places[0];
    if (!place) return null;
    return (
      place.city ||
      place.subregion ||
      place.district ||
      place.region ||
      place.street ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Request when-in-use location and return device coords.
 * Never throws. If permission is granted, prefers last-known/cache over Tel Aviv.
 */
export async function resolveDeviceCoords(options?: {
  prompt?: boolean;
}): Promise<DeviceLocationResult> {
  if (Platform.OS === "web") {
    return resolveWebCoords();
  }

  const prompt = options?.prompt ?? false;

  try {
    let permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      if (prompt || permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
    }

    if (permission.status !== Location.PermissionStatus.GRANTED) {
      return fallbackResult({
        denied: true,
        canAskAgain: permission.canAskAgain,
      });
    }

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return fallbackResult({
        unavailable: true,
        servicesOff: true,
      });
    }

    if (Platform.OS === "android") {
      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        // User declined the Android high-accuracy dialog.
      }
    }

    try {
      const position = await readNativePosition();
      const coords = toCoords(position);
      await writeCachedCoords(coords);
      return {
        coords,
        denied: false,
        unavailable: false,
        servicesOff: false,
        canAskAgain: true,
        fromDevice: true,
      };
    } catch {
      const cached = await readCachedCoords();
      if (cached) {
        return {
          coords: cached,
          denied: false,
          unavailable: false,
          servicesOff: false,
          canAskAgain: true,
          fromDevice: true,
        };
      }
      return fallbackResult({ unavailable: true });
    }
  } catch {
    return fallbackResult({ unavailable: true });
  }
}

export async function openLocationSettings() {
  if (Platform.OS !== "web") {
    await Linking.openSettings();
  }
}
