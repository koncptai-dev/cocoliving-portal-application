import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { ArrowLeft } from "lucide-react-native";
import * as Location from "expo-location";

const DEFAULT_LOCATION = {
  latitude: 23.0225,
  longitude: 72.5714,
  latitudeDelta: 0.001,
  longitudeDelta: 0.001,
};

const CurrentLocationConfirmationModal = ({
  handleBackPress,
  locationCoordinates,
  modalOpenState,
}) => {
  const mapRef = useRef(null);

  const [currentLocation, setCurrentLocation] = useState(DEFAULT_LOCATION);

 useEffect(() => {
  console.log("📍 locationCoordinates received:", locationCoordinates);

  const lat = locationCoordinates?.latitude;
  const lng = locationCoordinates?.longitude;

  console.log("👉 Extracted lat/lng:", lat, lng);

  if (typeof lat === "number" && typeof lng === "number") {
    const newLocation = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.001,
      longitudeDelta: 0.001,
    };

    console.log("✅ Valid location, updating state:", newLocation);

    setCurrentLocation(newLocation);

    // delay to ensure map is ready
    setTimeout(() => {
      console.log("🗺️ Animating map to:", newLocation);

      if (mapRef.current) {
        mapRef.current.animateToRegion(newLocation, 800);
      } else {
        console.log("❌ mapRef is NULL");
      }
    }, 300);
  } else {
    console.log("❌ Invalid lat/lng, skipping update");
  }
}, [locationCoordinates, modalOpenState]);


useEffect(() => {
  const getLiveLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001,
      };

      console.log("🔥 Auto fetched location:", newLocation);

      setCurrentLocation(newLocation);

      mapRef.current?.animateToRegion(newLocation, 800);
    } catch (e) {
      console.log("❌ Auto location error:", e);
    }
  };

  // ONLY run if parent didn't send location
  if (!locationCoordinates?.latitude) {
    getLiveLocation();
  }
}, []);

// ✅ Initial camera fix
const moveCameraToLocation = () => {
  console.log("🚀 Map ready, moving camera to:", currentLocation);

  if (mapRef.current) {
    mapRef.current.animateToRegion(currentLocation, 800);
  } else {
    console.log("❌ mapRef is NULL on map ready");
  }
};

  
  return (
    <View style={styles.container}>
      {/* Back Button */}
      <Pressable testID="back-button" onPress={handleBackPress} style={styles.backButton}>
       <ArrowLeft
  size={24}
  color="#000"
  strokeWidth={2.25}
/>
      </Pressable>

      {/* Map */}
      <MapView
        testID="map"
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={true}
        region={currentLocation}
        onMapReady={moveCameraToLocation}
      >
        <Marker coordinate={currentLocation} title="Your Location" />
      </MapView>


      
    </View>
  );
};

export default CurrentLocationConfirmationModal;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  map: {
    flex: 1,
  },

  backButton: {
    position: "absolute",
    top: 20,
    left: 15,
    zIndex: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 30,

    // shadow (iOS)
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,

    // shadow (Android)
    elevation: 5,
  },
});

