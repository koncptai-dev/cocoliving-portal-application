import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Toast from "react-native-toast-message";

const Waiting_Driver_Screen = () => {
  const mapRef = useRef(null);
  const watchRef = useRef(null);

  const [currentLocation, setCurrentLocation] = useState(null);

  const DEFAULT_REGION = {
    latitude: 23.0225,
    longitude: 72.5714,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  // ✅ INITIAL LOCATION + LIVE TRACKING
  useEffect(() => {
    const startTracking = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          Toast.show({
            type: "error",
            text1: "Permission Denied",
            text2: "Enable location to continue",
          });
          return;
        }

        // ✅ First fix: get current location once
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const coords = position.coords;

        const initialRegion = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };

        setCurrentLocation(initialRegion);
        mapRef.current?.animateToRegion(initialRegion, 1000);

        // ✅ LIVE TRACKING START
        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 3000,
          },
          (loc) => {
            const region = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            };

            setCurrentLocation(region);

            mapRef.current?.animateToRegion(region, 500);
          }
        );
      } catch (error) {
        console.log("Location error:", error);

        Toast.show({
          type: "error",
          text1: "Failed to fetch location",
        });
      }
    };

    startTracking();

    // ✅ CLEANUP (VERY IMPORTANT)
    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={true}
        initialRegion={DEFAULT_REGION}
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
          />
        )}
      </MapView>
    </View>
  );
};

export default Waiting_Driver_Screen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});


// import React, { useEffect, useRef, useState } from "react";
// import { StyleSheet, View } from "react-native";
// import * as Location from "expo-location";
// import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
// import Toast from "react-native-toast-message";

// const Waiting_Driver_Screen = () => {
//   const mapRef = useRef(null);

//   const [currentLocation, setCurrentLocation] = useState(null);

//   const DEFAULT_REGION = {
//     latitude: 23.0225,
//     longitude: 72.5714,
//     latitudeDelta: 0.005,
//     longitudeDelta: 0.005,
//   };

//   useEffect(() => {
//     const getLocation = async () => {
//       try {
//         let { status } = await Location.requestForegroundPermissionsAsync();

//         if (status !== "granted") {
//           Toast.show({
//             type: "error",
//             text1: "Permission Denied",
//             text2: "Enable location to continue",
//           });
//           return;
//         }

//         const position = await Location.getCurrentPositionAsync({
//           accuracy: Location.Accuracy.High,
//         });

//         const coords = position.coords;

//         const region = {
//           latitude: coords.latitude,
//           longitude: coords.longitude,
//           latitudeDelta: 0.005,
//           longitudeDelta: 0.005,
//         };

//         setCurrentLocation(region);

//         // move map smoothly
//         mapRef.current?.animateToRegion(region, 1000);
//       } catch (error) {
//         console.log("Location error:", error);

//         Toast.show({
//           type: "error",
//           text1: "Failed to fetch location",
//         });
//       }
//     };

//     getLocation();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <MapView
//         ref={mapRef}
//         style={styles.map}
//         provider={PROVIDER_GOOGLE}
//         showsUserLocation={true}
//         showsMyLocationButton={true}
//         initialRegion={DEFAULT_REGION}
//       >
//         {currentLocation && (
//           <Marker
//             coordinate={{
//               latitude: currentLocation.latitude,
//               longitude: currentLocation.longitude,
//             }}
//             title="Your Location"
//           />
//         )}
//       </MapView>
//     </View>
//   );
// };

// //export default Waiting_Driver_Screen;

// // import React, { useEffect, useState } from "react";
// // import { StyleSheet, View, Dimensions } from "react-native";
// // import * as Location from "expo-location";
// // import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
// // import Toast from "react-native-toast-message";

// // const windowWidth = Dimensions.get("window").width;
// // const windowHeight = Dimensions.get("window").height;

// // const Waiting_Driver_Screen = () => {
// //   const [currentLocation, setCurrentLocation] = useState(null);
// //   const [initialRegion, setInitialRegion] = useState({
// //     latitude: 23.0225,
// //     longitude: 72.5714,
// //     latitudeDelta: 0.005,
// //     longitudeDelta: 0.005,
// //   });

// //   useEffect(() => {
// //     const getLocation = async () => {
// //       try {
// //         // ✅ Request permission
// //         let { status } = await Location.requestForegroundPermissionsAsync();

// //         if (status !== "granted") {
// //           Toast.show({
// //             type: "error",
// //             text1: "Permission Denied",
// //             text2: "Enable location to continue",
// //           });
// //           return;
// //         }

// //         // ✅ Get location using Expo
// //         const position = await Location.getCurrentPositionAsync({
// //           accuracy: Location.Accuracy.High,
// //         });

// //         console.log("📍 Expo Location:", position);

// //         setCurrentLocation(position.coords);

// //         setInitialRegion({
// //           latitude: position.coords.latitude,
// //           longitude: position.coords.longitude,
// //           latitudeDelta: 0.005,
// //           longitudeDelta: 0.005,
// //         });
// //       } catch (error) {
// //         Toast.show({
// //           type: "error",
// //           text1: "Failed to fetch location",
// //         });
// //         console.log("❌ Location error:", error);
// //       }
// //     };

// //     getLocation();
// //   }, []);

// //   return (
// //     <View style={styles.container}>
// //       {initialRegion && (
// //         <MapView
// //           showsUserLocation={true}
// //           showsMyLocationButton={true}
// //           style={styles.map}
// //           initialRegion={initialRegion}
// //           provider={PROVIDER_GOOGLE}
// //         >
// //           {currentLocation && (
// //             <Marker
// //               coordinate={{
// //                 latitude: currentLocation.latitude,
// //                 longitude: currentLocation.longitude,
// //               }}
// //               title="Your Location"
// //             />
// //           )}
// //         </MapView>
// //       )}
// //     </View>
// //   );
// // };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     width: "100%",
//     height: "100%",
//   },
// });

// export default Waiting_Driver_Screen;


// import React, { useEffect, useState } from "react";
// import { StyleSheet, View, Dimensions } from "react-native";
// import * as Location from "expo-location";
// import MapView, { Marker } from "react-native-maps";
// import Geolocation from "react-native-geolocation-service";
// import Toast from "react-native-toast-message";

// const windowWidth = Dimensions.get("window").width;
// const windowHeight = Dimensions.get("window").height;

// const Waiting_Driver_Screen = () => {
//   const [currentLocation, setCurrentLocation] = useState(null);
//   const [initialRegion, setInitialRegion] = useState({
//     latitude: 23.0225,
//     longitude: 72.5714,
//     latitudeDelta: 0.005,
//     longitudeDelta: 0.005,
//   });

//   useEffect(() => {
//     const getLocation = async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         console.log("Permission to access location was denied");
//         return;
//       }
//       if (Geolocation) {
//         Geolocation.getCurrentPosition(
//           (position) => {
//             setCurrentLocation(position.coords);
//             console.log(position, "position data");
//             setInitialRegion({
//               latitude: position.coords.latitude,
//               longitude: position.coords.longitude,
//               latitudeDelta: 0.005,
//               longitudeDelta: 0.005,
//             });
//           },
//           (error) => {
//             Toast.show({
//               type: "error",
//               text1: "Failed to fetch location data",
//               text2: "Please check your location configuration",
//             });
//             console.log(error.code, error.message);
//           },
//           { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
//         );
//       }
//     };

//     getLocation();
//   }, []);

//   return (
//     <View style={styles.container}>
//       {initialRegion && (
//         <MapView
//           showsUserLocation
//           showsMyLocationButton={true}
//           style={styles.map}
//           initialRegion={initialRegion}
//           provider="google"
//         >
//           {currentLocation && (
//             <Marker
//               coordinate={{
//                 latitude: currentLocation.latitude,
//                 longitude: currentLocation.longitude,
//               }}
//               title="Your Location"
//             />
//           )}
//         </MapView>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   map: {
//     width: "100%",
//     height: "100%",
//   },
// });

// export default Waiting_Driver_Screen;
