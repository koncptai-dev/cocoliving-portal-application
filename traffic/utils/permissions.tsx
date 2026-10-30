// utils/permissions.ts
import * as Location from "expo-location";

export const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    // Check foreground location permission
    const fgStatus = await Location.getForegroundPermissionsAsync();
    if (fgStatus.status !== "granted") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Foreground location permission not granted");
        return false;
      }
    }

    // Check background location permission
    const bgStatus = await Location.getBackgroundPermissionsAsync();
    if (bgStatus.status !== "granted") {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Background location permission not granted");
        return false;
      }
    }

    console.log("✅ All location permissions granted");
    return true;
  } catch (err) {
    console.error("❌ Error requesting location permissions", err);
    return false;
  }
};
