import {
  Clock3,
  Clock8,
  MapPin,
} from "lucide-react-native";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
  AppState,
} from "react-native";
import Toast from "react-native-toast-message";
import { useColorScheme } from "react-native";


import * as IntentLauncher from "expo-intent-launcher";
import SwipeToConfirmModal from "./SwipeToConfirmModal";
import * as Location from "expo-location";
//import Geolocation from "react-native-geolocation-service";
import { isCheckinAllowed } from "@/utils/isCheckInAllowed";
import { Colors } from "@/constants/Colors";
import dayjs from "dayjs";
import { axiosInstance } from "@/libs/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CurrentLocationConfirmationModal from "./CurrentLocationConfirmationModal";
import CTAButton from "../ui/CTAButton";
import toastConfig from "@/utils/toastConfig";
import { startForegroundTracking } from "@/index";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const TAB_BAR_HEIGHT = 72;
const BUTTON_SIZE = Math.min(width * 0.55, 170);

export default function BeforeCheckInOut({
  setIsShiftCompleted,
  upcomingShiftData,
}) {
  console.log("upcoming shift data", upcomingShiftData);
  const [hasPunchedIn, setHasPunchedIn] = useState(false);
  const [hasPunchedOut, setHasPunchedOut] = useState(false);
  const [showSwipeModal, setShowSwipeModal] = useState(false);
  const [locationEnableModal, setLocationEnableModal] = useState(false);
  const [location, setLocation] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const isMockLocation = useRef(false);
  const [
    showCurrentLocationConfirmationModal,
    setShowCurrentLocationConfirmationModal,
  ] = useState(false);
   const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const tabBarHeight = useBottomTabBarHeight();
//const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);


const [secondsLeft, setSecondsLeft] = useState(7);
const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);


const [checkpointLocationName, setCheckpointLocationName] = useState("");
const [currentLocationName, setCurrentLocationName] = useState("");
const [distanceFromCheckpoint, setDistanceFromCheckpoint] = useState(0);


const [gpsEnableModal, setGpsEnableModal] = useState(false);

const theme = useColorScheme();
const isDark = theme === "dark";





  
const punchIn = useMutation({
  mutationFn: async (punchInData: any) => {
    console.log("👉 Punch In Payload:", punchInData); // ✅ payload print

    const response = await axiosInstance.put(
      "userApp/punch-in/",
      punchInData
    );

    console.log("✅ Punch In API Response FULL:", response); // full response
    console.log("✅ Punch In API Response DATA:", response.data); // actual data

    if (response.status === 200) {
      setHasPunchedIn(true);
      queryClient.invalidateQueries({ queryKey: ["get-duties-list"] });

      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Punched in successfully.",
      });
    }

    setIsLoading(false);
    setShowSwipeModal(false);
    setShowCurrentLocationConfirmationModal(false);
  },
});

  const punchOut = useMutation({
    mutationFn: async (punchInData: any) => {
      const response = await axiosInstance.put(
        "userApp/punch-out/",
        punchInData
      );
      if (response.status === 200) {
        setHasPunchedOut(true);
        queryClient.invalidateQueries({ queryKey: ["get-duties-list"] });
        Toast.show({
          type: "success",
          text1: "Success!",
          text2: "Punched out successfully.",
          visibilityTime: 10000,
          autoHide: true,
        });
      }
      setIsLoading(false);
      setShowSwipeModal(false);
      setShowCurrentLocationConfirmationModal(false);
      console.log("response", response.data);
      return;
    },
    onError: (error) => {
      console.log("Error in punch flow:", error);
      Toast.show({
        type: "error",
        text1: "Error while Punching Out",
      });
      setIsLoading(false);
      setShowSwipeModal(false);
      setShowCurrentLocationConfirmationModal(false);
    },
  });




const fetchLocation = async () => {
  try {
    setIsLoading(true);

    /* =========================
       1. PERMISSION CHECK
    ========================= */
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      setIsLoading(false);

      Toast.show({
        type: "error",
        text1: "Permission Required",
        text2: "Enable location access",
      });

      return;
    }

    /* =========================
       2. GPS ENABLE CHECK
    ========================= */
    const enabled = await Location.hasServicesEnabledAsync();

    if (!enabled) {
      setIsLoading(false);
      setLocationEnableModal(true);
 Toast.show({
    type: "error",
    text1: "GPS Disabled",
    text2: "Please enable your GPS",
    visibilityTime: 4000,
  });
      return;

    }
   
    setLocationEnableModal(false);




    /* =========================
       3. SINGLE LOCATION CALL ONLY
    ========================= */
    // const location = await Location.getCurrentPositionAsync({});


// let location = await Location.getLastKnownPositionAsync();

// if (!location) {
//   location = await Location.getCurrentPositionAsync({
//     accuracy: Location.Accuracy.High,
//   });
// }


let location = await Location.getLastKnownPositionAsync({maxAge: 10000});

if (!location) {
  const locationPromise = Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Location timeout")), 10000)
  );

  location = await Promise.race([
    locationPromise,
    timeoutPromise,
  ]);
}

    console.log("location:", location);
    console.log("mocked:", location?.mocked);

    /* =========================
       4. MOCK DETECTION
    ========================= */
    if (location?.mocked === true) {
      setIsAllowed(false);
      setIsLoading(false);

      Toast.show({
        type: "error",
        text1: "Fake GPS Detected",
        text2: "Please disable mock location",
      });

      return;
    }

    /* =========================
       5. VALIDATE COORDS
    ========================= */
    const coords = location?.coords;

    if (!coords?.latitude || !coords?.longitude) {
      setIsLoading(false);

      Toast.show({
        type: "error",
        text1: "Location unavailable",
        text2: "Try again",
      });

      return;
    }

    const userLat = Number(coords.latitude);
    const userLng = Number(coords.longitude);

    /* =========================
       6. CHECKPOINT
    ========================= */
    const cpLat = Number(
      upcomingShiftData?.checkpointInTpam?.lattitude
    );

    const cpLng = Number(
      upcomingShiftData?.checkpointInTpam?.longitude
    );

    if (!cpLat || !cpLng) {
      throw new Error("Checkpoint missing");
    }

    /* =========================
       7. DISTANCE
    ========================= */
    const distance = calculateDistance(
      userLat,
      userLng,
      cpLat,
      cpLng
    );

    setDistanceFromCheckpoint(Math.round(distance));

    /* =========================
       8. GEO CHECK
    ========================= */
    const ALLOWED_RADIUS = 300;

    if (distance > ALLOWED_RADIUS) {
      setIsAllowed(false);
      setIsLoading(false);

      Toast.show({
        type: "error",
        text1: "Outside checkpoint area",
        text2: `${Math.round(distance)} meters away`,
      });

      return;
    }

    /* =========================
       9. SUCCESS
    ========================= */
    setLocation(location);
    setIsAllowed(true);

    setShowCurrentLocationConfirmationModal(true);


/* =========================
   10. AUTO CLOSE TIMER
========================= */

if (hasPunchedIn) {
  setSecondsLeft(7);

  // clear old timers
  if (autoCloseTimer.current) {
    clearTimeout(autoCloseTimer.current);
  }

  if (countdownInterval.current) {
    clearInterval(countdownInterval.current);
  }

  countdownInterval.current = setInterval(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
        }
        return 0;
      }

      return prev - 1;
    });
  }, 1000);

  autoCloseTimer.current = setTimeout(() => {
    setShowCurrentLocationConfirmationModal(false);

    Toast.show({
      type: "info",
      text1: "Timed out",
      text2: "Please confirm again",
    });
  }, 7000);
}





  } catch (error) {
    console.log("Location error:", error);

    //setIsLoading(false);

    Toast.show({
  type: "error",
  text1: "Current Location Unavailable",
  text2:
    "If you were using a Fake GPS app, please disable it and try again.",
});
    // Toast.show({
    //   type: "error",
    //   text1: "Location Failed",
    //   text2: error?.message || "Try again",
    // });
  }


finally {
    setIsLoading(false);
  }

};







  useEffect(() => {
   

    if (upcomingShiftData) {
      // console.log("punch in", upcomingShiftData?.punchIn);
      if (upcomingShiftData?.punchIn && !upcomingShiftData?.punchOut) {
        setHasPunchedIn(true);
      }
    }
  }, [upcomingShiftData]);

 






 
useEffect(() => {
  const subscription = AppState.addEventListener("change", async (state) => {
    if (state === "active") {
      console.log("🔁 App resumed — rechecking permission");

      const { status } = await Location.getForegroundPermissionsAsync();
      const enabled = await Location.hasServicesEnabledAsync();

      // ✅ Permission handling
      if (status === "granted") {
        setLocationEnableModal(false);
      } else {
        setLocationEnableModal(true);
      }

      // ✅ Optional: GPS handling (if you added separate modal)
      if (!enabled) {
        setGpsEnableModal(true);
      } else {
        setGpsEnableModal(false);
      }

      // ✅ Always stop loader
      // setIsLoading(false);
      // setShowCurrentLocationConfirmationModal(false);
// ✅ Only close modal if permission/GPS is actually unavailable
      if (status !== "granted" || !enabled) {
        setShowCurrentLocationConfirmationModal(false);
      }

    }
  });

  return () => subscription.remove();
}, []);





  const handleSwipeSuccess = async (state) => {
    try {
      const punchDateTime = new Date();
      if (state === "punch-in") {
        console.log("location", location?.coords);
      
        punchIn.mutate({
          punchInTime: punchDateTime,
          punchInCoordinates: {
            punchInLatitude: location?.coords?.latitude,
            punchInLongitude: location?.coords?.longitude,
          },
          dutyId: upcomingShiftData?.id,
        });
      } else if (state === "punch-out") {
        punchOut.mutate({
          punchOutTime: punchDateTime,
          punchOutCoordinates: {
            punchOutLatitude: location?.coords?.latitude,
            punchOutLongitude: location?.coords?.longitude,
          },
          dutyId: upcomingShiftData?.id,
        });
        // setIsShiftCompleted(true);
      }
    } catch (error) {
      console.error("Error in punch flow:", error);
      Toast.show({
        type: "error",
        text1: "Unexpected Error",
        text2: "Could not complete punch action.",
        visibilityTime: 10000,
        autoHide: true,
      });
    }
  };
  // const handlePress = useCallback(() => {
  //   if (Platform.OS === "android") {
  //     try {
  //       IntentLauncher.startActivityAsync(
  //         IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
  //       );
  //     } catch (error) {
  //       Toast.show({
  //         type: "error",
  //         text1: "Error opening location settings",
  //         text2: "Please enable location manually.",
  //       });
  //     }
  //   } else {
  //     // iOS fallback: open app settings
  //     Linking.openSettings().catch(() => {
  //       Toast.show({
  //         type: "error",
  //         text1: "Failed to open settings",
  //         text2: "Please open settings manually to enable location.",
  //       });
  //     });
  //   }
  // }, []);

const handlePress = useCallback(() => {
  setLocationEnableModal(false); // optional UX improvement

  Linking.openSettings().catch(() => {
    Toast.show({
      type: "error",
      text1: "Unable to open settings",
      text2: "Please enable location permission manually.",
    });
  });
}, []);




  const handleLocationConfirmationModalBackPress = () => {

 if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
  if (countdownInterval.current) clearInterval(countdownInterval.current);
    setShowCurrentLocationConfirmationModal(false);
    // setShowSwipeModal(false);
  };
  


useEffect(() => {
  return () => {
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  };
}, []);

//   useEffect(() => {
//   return () => {
//     if (autoCloseTimer.current) {
//       clearTimeout(autoCloseTimer.current);
//     }
//   };
// }, []);


const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371e3; // meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);

  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};





  return (
    <>
      {upcomingShiftData ? (
        <>
          <View style={styles.clockContainer}>
            <Text style={{ fontSize: 24, color: Colors.primary.color }}>
              {upcomingShiftData?.shiftInTpam?.label
                ? upcomingShiftData?.shiftInTpam?.label
                : "--"}{" "}
            </Text>
            {/* <Text style={styles.time}>09:15 - 13:00</Text> */}
            <Text style={styles.time}>
              {upcomingShiftData?.startTime
                ? dayjs(upcomingShiftData?.startTime).format("HH:mm")
                : "--"}{" "}
              -{" "}
              {upcomingShiftData?.endTime
                ? dayjs(upcomingShiftData?.endTime).format("HH:mm")
                : "--"}
            </Text>
            <Text style={styles.date}>
              {upcomingShiftData?.endTime
                ? dayjs(upcomingShiftData?.endTime).format(
                    "MMM DD, YYYY - dddd"
                  )
                : "--"}
            </Text>
            <Text style={styles.date}>
              {upcomingShiftData?.checkpointInTpam?.name
                ? upcomingShiftData?.checkpointInTpam?.name
                : "--"}
            </Text>
          </View>
          {/* Punch In/Out Button */}
          {!hasPunchedOut && (
            <View>
              <Pressable
                testID="punch-in-button"
                onPress={() => {
               fetchLocation(); 
    //                setIsLoading(true);

    // setTimeout(() => {
    //   fetchLocation();
    // }, 3000);

                }}
                style={({ pressed }) => [
                  styles.outermostPunchinContainer,
                  pressed && styles.punchButtonPressed,
                ]}
              >
                <View style={styles.punchContainer}>
                  <View>
                    <View style={styles.punchButton}>
                      <Image
                        source={
                          hasPunchedIn
                            ? require("@/assets/images/punch-in.png")
                            : require("@/assets/images/punch-out.png")
                        } // Replace icon with image
                        style={styles.punchImage} // Add a style for the image
                      />
                      <Text style={styles.punchText}>
                        {hasPunchedIn ? t("punch-out") : t("punch-in")}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            </View>
          )}
          {hasPunchedOut && <View style={{ height: 160 }}></View>}
          

          {/** latest change **/}
          <View style={[    styles.punchStats, { marginBottom: 72 + insets.bottom + 20, },]}>
          
            <View style={styles.stat}>
             <Clock3
  size={24}
  color={Colors.primary.textBlack}
  strokeWidth={2}
/>
              <Text style={styles.statTime}>
                {upcomingShiftData?.punchIn
                  ? dayjs(upcomingShiftData?.punchIn).format("HH:mm")
                  : "--"}
              </Text>
              <Text style={styles.statLabel}>{t("punch-in")}</Text>
            </View>
            <View style={styles.stat}>
             <Clock8
  size={24}
  color={Colors.primary.textBlack}
  strokeWidth={2}
/>
              <Text style={styles.statTime}>
                {" "}
                {upcomingShiftData?.punchOut
                  ? dayjs(upcomingShiftData?.punchOut).format("HH:mm")
                  : "--"}
              </Text>
              <Text style={styles.statLabel}>{t("punch-out")}</Text>
            </View>
         
            <View style={styles.stat}>
              <Pressable
  style={styles.stat}
  onPress={() => router.push("/location")}
>
  <MapPin
    size={24}
    color={Colors.primary.textBlack}
    strokeWidth={2}
  />
  <Text style={styles.statTime}>{t("current")}</Text>
  <Text style={styles.statLabel}>{t("location")}</Text>
</Pressable>
            </View>
          </View>
        </>
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ alignItems: "center", fontSize: 16, color: "gray" }}>
            No upcoming shifts available for today
          </Text>
        </View>
      )}

     

      {showCurrentLocationConfirmationModal && (
        <Modal
          visible={showCurrentLocationConfirmationModal}
          onRequestClose={handleLocationConfirmationModalBackPress}
          animationType="fade"
        >
          {showCurrentLocationConfirmationModal && (
            <SafeAreaView style={{ width: "100%", height: "100%" }}>
              {/* <View style={{ flex: 1 }}> */}
              <CurrentLocationConfirmationModal
                handleBackPress={handleLocationConfirmationModalBackPress}
                locationCoordinates={{
                  latitude: location?.coords?.latitude,
                  longitude: location?.coords?.longitude,
                  latitudeDelta: 0.001,
                  longitudeDelta: 0.001,
                }}
                modalOpenState={showCurrentLocationConfirmationModal}
              >

              </CurrentLocationConfirmationModal>
              {/* </View> */}
             
              {hasPunchedIn && (
 <Text
  style={[
    styles.countdownText,
    { color: secondsLeft <= 3 ? "#FF0000" : "#D32F2F" },
  ]}
>
  Auto closing in {secondsLeft}s
</Text>
)}
             
              <View
                style={{
                  flexDirection: "row",
                  padding: 16,
                  // gap: 8,
                  // justifyContent: ",
                }}
              >
                {/* <View style={{ flexGrow: 1 }}>
                  <CTAButton label="Close" type="bordered" />
                </View> */}
               
              
                
                
                <View style={{ flexGrow: 1 }}>
                  <CTAButton
                    disabled={
                      !isAllowed ||
                      //isLoading ||
                      isMockLocation.current ||
                      punchIn.isPending ||
                      punchOut.isPending
                    }
                    label={
                      punchIn.isPending
                        ? "Punching in..."
                        : punchOut.isPending
                        ? "Punching out..."
                        : "Confirm"
                    }
                    type="filled"
onPress={() => {
  if (autoCloseTimer.current) {
    clearTimeout(autoCloseTimer.current);
  }

  if (countdownInterval.current) {
    clearInterval(countdownInterval.current);
  }

  const punchInState = !hasPunchedIn
    ? "punch-in"
    : !hasPunchedOut
    ? "punch-out"
    : "";

  handleSwipeSuccess(punchInState);
}}

                    //                     onPress={() => {
//   // ✅ clear timeout
//   if (autoCloseTimer.current) {
//     clearTimeout(autoCloseTimer.current);
//   }

//   const punchInState = !hasPunchedIn
//     ? "punch-in"
//     : !hasPunchedOut
//     ? "punch-out"
//     : "";

//   handleSwipeSuccess(punchInState);
// }}
                    // onPress={() => {
                    //   const punchInState = !hasPunchedIn
                    //     ? "punch-in"
                    //     : !hasPunchedOut
                    //     ? "punch-out"
                    //     : "";
                    //   handleSwipeSuccess(punchInState);
                    // }}
                  />
                </View>
              </View>
              <Toast config={toastConfig} />
            
            </SafeAreaView>
          )}
        </Modal>
      )}
      <Modal visible={locationEnableModal} animationType="fade">
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text>Please go to settings and enable location...</Text>
          <Pressable onPress={handlePress}>
            <View>
              <Text
                style={{
                  backgroundColor: Colors.primary.background,
                  padding: 8,
                  color: "white",
                  marginVertical: 12,
                }}
              >
                Go to settings
              </Text>
            </View>
          </Pressable>
        </View>
      </Modal>



 {/* ✅ ADD LOADER MODAL HERE 👇 */}

<Modal
  visible={isLoading }
  transparent
  animationType="fade"
>
  <View
    style={{
      flex: 1,
      backgroundColor: isDark
        ? "rgba(0,0,0,0.7)"
        : "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}
  >
    {/* CARD */}
    <View
      style={{
        width: "100%",
        maxWidth: 340,
        backgroundColor: isDark ? "#1E1E1E" : "#fff",
        borderRadius: 16,
        padding: 18,
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      
      <View
  style={{
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  }}
>
  <Text
    style={{
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#fff" : "#111",
      marginRight: 8,
    }}
  >
    📡 Wait! Fetching Location
  </Text>

  <ActivityIndicator
    size="small"
    color={isDark ? "#fff" : Colors.primary.color}
  />
</View>

      {/* CHECKPOINT */}
      <Text style={{ color: "#888", fontSize: 12 }}>
        📍 Checkpoint (Expected)
      </Text>
      <Text
        style={{
          color: isDark ? "#ddd" : "#222",
          fontSize: 13,
          marginBottom: 12,
          fontWeight: "500",
        }}
      >
        {checkpointLocationName ||
          upcomingShiftData?.checkpointInTpam?.name ||
          "Loading..."}
      </Text>

      {/* USER LOCATION */}
      <Text style={{ color: "#888", fontSize: 12 }}>
        📌 Your Current Location
      </Text>
      <Text
        style={{
          color: isDark ? "#ddd" : "#222",
          fontSize: 13,
          marginBottom: 12,
        }}
      >
        {currentLocationName || "Fetching location..."}
      </Text>

      {/* DISTANCE */}
      <Text style={{ color: "#888", fontSize: 12 }}>
        📏 Distance from checkpoint
      </Text>
      <Text
        style={{
          color:
            distanceFromCheckpoint > 100
              ? "#E53935"
              : "#2E7D32",
          fontSize: 14,
          fontWeight: "700",
        }}
      >
        {distanceFromCheckpoint
          ? `${distanceFromCheckpoint} meters`
          : "Calculating..."}
      </Text>

      {/* WARNING */}
      {distanceFromCheckpoint > 100 && (
        <Text
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "#E53935",
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          ⚠ You are outside allowed checkpoint range
        </Text>
      )}
    </View>
  </View>
</Modal>





      {/* <SwipeToConfirmModal
        state={!hasPunchedIn ? "punch-in" : !hasPunchedOut ? "punch-out" : ""}
        showSwipeModal={showSwipeModal}
        setShowSwipeModal={setShowSwipeModal}
        onSwipeSuccess={handleSwipeSuccess}
      /> */}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  id: {
    fontSize: 12,
    color: "#888",
  },
  clockContainer: {
    alignItems: "center",
  },
  time: {
    fontSize: 32,
    fontWeight: "light",
    color: Colors.primary.textBlack,
    marginTop: 16,
  },
  date: {
    color: "#666",
    marginTop: 8,
  },
  outermostPunchinContainer: {
    // backgroundColor: "red",
  },
  punchContainer: {
    alignItems: "center",
  },
  punchButton: {
    marginTop: "auto",
    // width: 130,
    // height: 130,
    // borderRadius: 80,
     width: BUTTON_SIZE,
     height: BUTTON_SIZE,
     borderRadius: BUTTON_SIZE / 2,
     backgroundColor: "#fff",
    // borderWidth: 4,
    // borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  punchButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9, // Reduce opacity when pressed
  },
  punchImage: {
    width: 34,
    height: 52,
    resizeMode: "contain",
  },
  punchText: {
    marginTop: 8,
    fontWeight: "bold",
    color: "#444",
  },
   countdownText: {
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "bold",
    fontSize: 14,
    color: "#D32F2F", // alert red
  },
  punchStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
    // marginTop:"auto"
  },
  stat: {
    alignItems: "center",
  },
  statTime: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#555",
  },
});































// import {
//   Clock3,
//   Clock8,
//   MapPin,
// } from "lucide-react-native";
// import { router, useFocusEffect, useNavigation } from "expo-router";
// import { useCallback, useEffect, useRef, useState } from "react";
// import { useTranslation } from "react-i18next";
// import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   Pressable,
//   Modal,
//   ActivityIndicator,
//   Linking,
//   Platform,
//   AppState,
// } from "react-native";
// import Toast from "react-native-toast-message";
// import { useColorScheme } from "react-native";


// import * as IntentLauncher from "expo-intent-launcher";
// import SwipeToConfirmModal from "./SwipeToConfirmModal";
// import * as Location from "expo-location";
// //import Geolocation from "react-native-geolocation-service";
// import { isCheckinAllowed } from "@/utils/isCheckInAllowed";
// import { Colors } from "@/constants/Colors";
// import dayjs from "dayjs";
// import { axiosInstance } from "@/libs/axios";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import CurrentLocationConfirmationModal from "./CurrentLocationConfirmationModal";
// import CTAButton from "../ui/CTAButton";
// import toastConfig from "@/utils/toastConfig";
// import { startForegroundTracking } from "@/index";
// import { SafeAreaView } from "react-native-safe-area-context";

// import { useSafeAreaInsets } from "react-native-safe-area-context";

// import { Dimensions } from "react-native";

// const { width } = Dimensions.get("window");

// const TAB_BAR_HEIGHT = 72;
// const BUTTON_SIZE = Math.min(width * 0.55, 170);

// export default function BeforeCheckInOut({
//   setIsShiftCompleted,
//   upcomingShiftData,
// }) {
//   console.log("upcoming shift data", upcomingShiftData);
//   const [hasPunchedIn, setHasPunchedIn] = useState(false);
//   const [hasPunchedOut, setHasPunchedOut] = useState(false);
//   const [showSwipeModal, setShowSwipeModal] = useState(false);
//   const [locationEnableModal, setLocationEnableModal] = useState(false);
//   const [location, setLocation] = useState();
//   const [isLoading, setIsLoading] = useState(false);
//   const [isAllowed, setIsAllowed] = useState(false);
//   const isMockLocation = useRef(false);
//   const [
//     showCurrentLocationConfirmationModal,
//     setShowCurrentLocationConfirmationModal,
//   ] = useState(false);
//    const insets = useSafeAreaInsets();
//   const navigation = useNavigation();
//   const queryClient = useQueryClient();
//   const { t } = useTranslation();

//   const tabBarHeight = useBottomTabBarHeight();
// //const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);


// const [secondsLeft, setSecondsLeft] = useState(7);
// const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
// const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);


// const [checkpointLocationName, setCheckpointLocationName] = useState("");
// const [currentLocationName, setCurrentLocationName] = useState("");
// const [distanceFromCheckpoint, setDistanceFromCheckpoint] = useState(0);


// const [gpsEnableModal, setGpsEnableModal] = useState(false);

// const theme = useColorScheme();
// const isDark = theme === "dark";





  
// const punchIn = useMutation({
//   mutationFn: async (punchInData: any) => {
//     console.log("👉 Punch In Payload:", punchInData); // ✅ payload print

//     const response = await axiosInstance.put(
//       "userApp/punch-in/",
//       punchInData
//     );

//     console.log("✅ Punch In API Response FULL:", response); // full response
//     console.log("✅ Punch In API Response DATA:", response.data); // actual data

//     if (response.status === 200) {
//       setHasPunchedIn(true);
//       queryClient.invalidateQueries({ queryKey: ["get-duties-list"] });

//       Toast.show({
//         type: "success",
//         text1: "Success!",
//         text2: "Punched in successfully.",
//       });
//     }

//     setIsLoading(false);
//     setShowSwipeModal(false);
//     setShowCurrentLocationConfirmationModal(false);
//   },
// });

//   const punchOut = useMutation({
//     mutationFn: async (punchInData: any) => {
//       const response = await axiosInstance.put(
//         "userApp/punch-out/",
//         punchInData
//       );
//       if (response.status === 200) {
//         setHasPunchedOut(true);
//         queryClient.invalidateQueries({ queryKey: ["get-duties-list"] });
//         Toast.show({
//           type: "success",
//           text1: "Success!",
//           text2: "Punched out successfully.",
//           visibilityTime: 10000,
//           autoHide: true,
//         });
//       }
//       setIsLoading(false);
//       setShowSwipeModal(false);
//       setShowCurrentLocationConfirmationModal(false);
//       console.log("response", response.data);
//       return;
//     },
//     onError: (error) => {
//       console.log("Error in punch flow:", error);
//       Toast.show({
//         type: "error",
//         text1: "Error while Punching Out",
//       });
//       setIsLoading(false);
//       setShowSwipeModal(false);
//       setShowCurrentLocationConfirmationModal(false);
//     },
//   });




// const fetchLocation = async () => {
//   try {
//     setIsLoading(true);

//     /* =========================
//        1. PERMISSION CHECK
//     ========================= */
//     const { status } =
//       await Location.requestForegroundPermissionsAsync();

//     if (status !== "granted") {
//       setIsLoading(false);

//       Toast.show({
//         type: "error",
//         text1: "Permission Required",
//         text2: "Enable location access",
//       });

//       return;
//     }

//     /* =========================
//        2. GPS ENABLE CHECK
//     ========================= */
//     const enabled = await Location.hasServicesEnabledAsync();

//     if (!enabled) {
//       setIsLoading(false);
//       setLocationEnableModal(true);
//  Toast.show({
//     type: "error",
//     text1: "GPS Disabled",
//     text2: "Please enable your GPS",
//     visibilityTime: 4000,
//   });
//       return;

//     }
   
//     setLocationEnableModal(false);




//     /* =========================
//        3. SINGLE LOCATION CALL ONLY
//     ========================= */
//     const location = await Location.getCurrentPositionAsync({});

//     console.log("location:", location);
//     console.log("mocked:", location?.mocked);

//     /* =========================
//        4. MOCK DETECTION
//     ========================= */
//     if (location?.mocked === true) {
//       setIsAllowed(false);
//       setIsLoading(false);

//       Toast.show({
//         type: "error",
//         text1: "Fake GPS Detected",
//         text2: "Please disable mock location",
//       });

//       return;
//     }

//     /* =========================
//        5. VALIDATE COORDS
//     ========================= */
//     const coords = location?.coords;

//     if (!coords?.latitude || !coords?.longitude) {
//       setIsLoading(false);

//       Toast.show({
//         type: "error",
//         text1: "Location unavailable",
//         text2: "Try again",
//       });

//       return;
//     }

//     const userLat = Number(coords.latitude);
//     const userLng = Number(coords.longitude);

//     /* =========================
//        6. CHECKPOINT
//     ========================= */
//     const cpLat = Number(
//       upcomingShiftData?.checkpointInTpam?.lattitude
//     );

//     const cpLng = Number(
//       upcomingShiftData?.checkpointInTpam?.longitude
//     );

//     if (!cpLat || !cpLng) {
//       throw new Error("Checkpoint missing");
//     }

//     /* =========================
//        7. DISTANCE
//     ========================= */
//     const distance = calculateDistance(
//       userLat,
//       userLng,
//       cpLat,
//       cpLng
//     );

//     setDistanceFromCheckpoint(Math.round(distance));

//     /* =========================
//        8. GEO CHECK
//     ========================= */
//     const ALLOWED_RADIUS = 300;

//     if (distance > ALLOWED_RADIUS) {
//       setIsAllowed(false);
//       setIsLoading(false);

//       Toast.show({
//         type: "error",
//         text1: "Outside checkpoint area",
//         text2: `${Math.round(distance)} meters away`,
//       });

//       return;
//     }

//     /* =========================
//        9. SUCCESS
//     ========================= */
//     setLocation(location);
//     setIsAllowed(true);

//     setShowCurrentLocationConfirmationModal(true);


// /* =========================
//    10. AUTO CLOSE TIMER
// ========================= */

// if (hasPunchedIn) {
//   setSecondsLeft(7);

//   // clear old timers
//   if (autoCloseTimer.current) {
//     clearTimeout(autoCloseTimer.current);
//   }

//   if (countdownInterval.current) {
//     clearInterval(countdownInterval.current);
//   }

//   countdownInterval.current = setInterval(() => {
//     setSecondsLeft((prev) => {
//       if (prev <= 1) {
//         if (countdownInterval.current) {
//           clearInterval(countdownInterval.current);
//         }
//         return 0;
//       }

//       return prev - 1;
//     });
//   }, 1000);

//   autoCloseTimer.current = setTimeout(() => {
//     setShowCurrentLocationConfirmationModal(false);

//     Toast.show({
//       type: "info",
//       text1: "Timed out",
//       text2: "Please confirm again",
//     });
//   }, 7000);
// }





//   } catch (error) {
//     console.log("Location error:", error);

//     //setIsLoading(false);

//     Toast.show({
//   type: "error",
//   text1: "Current Location Unavailable",
//   text2:
//     "If you were using a Fake GPS app, please disable it and try again.",
// });
//     // Toast.show({
//     //   type: "error",
//     //   text1: "Location Failed",
//     //   text2: error?.message || "Try again",
//     // });
//   }


// finally {
//     setIsLoading(false);
//   }

// };







//   useEffect(() => {
   

//     if (upcomingShiftData) {
//       // console.log("punch in", upcomingShiftData?.punchIn);
//       if (upcomingShiftData?.punchIn && !upcomingShiftData?.punchOut) {
//         setHasPunchedIn(true);
//       }
//     }
//   }, [upcomingShiftData]);

 






 
// useEffect(() => {
//   const subscription = AppState.addEventListener("change", async (state) => {
//     if (state === "active") {
//       console.log("🔁 App resumed — rechecking permission");

//       const { status } = await Location.getForegroundPermissionsAsync();
//       const enabled = await Location.hasServicesEnabledAsync();

//       // ✅ Permission handling
//       if (status === "granted") {
//         setLocationEnableModal(false);
//       } else {
//         setLocationEnableModal(true);
//       }

//       // ✅ Optional: GPS handling (if you added separate modal)
//       if (!enabled) {
//         setGpsEnableModal(true);
//       } else {
//         setGpsEnableModal(false);
//       }

//       // ✅ Always stop loader
//       // setIsLoading(false);
//       // setShowCurrentLocationConfirmationModal(false);
// // ✅ Only close modal if permission/GPS is actually unavailable
//       if (status !== "granted" || !enabled) {
//         setShowCurrentLocationConfirmationModal(false);
//       }

//     }
//   });

//   return () => subscription.remove();
// }, []);





//   const handleSwipeSuccess = async (state) => {
//     try {
//       const punchDateTime = new Date();
//       if (state === "punch-in") {
//         console.log("location", location?.coords);
      
//         punchIn.mutate({
//           punchInTime: punchDateTime,
//           punchInCoordinates: {
//             punchInLatitude: location?.coords?.latitude,
//             punchInLongitude: location?.coords?.longitude,
//           },
//           dutyId: upcomingShiftData?.id,
//         });
//       } else if (state === "punch-out") {
//         punchOut.mutate({
//           punchOutTime: punchDateTime,
//           punchOutCoordinates: {
//             punchOutLatitude: location?.coords?.latitude,
//             punchOutLongitude: location?.coords?.longitude,
//           },
//           dutyId: upcomingShiftData?.id,
//         });
//         // setIsShiftCompleted(true);
//       }
//     } catch (error) {
//       console.error("Error in punch flow:", error);
//       Toast.show({
//         type: "error",
//         text1: "Unexpected Error",
//         text2: "Could not complete punch action.",
//         visibilityTime: 10000,
//         autoHide: true,
//       });
//     }
//   };
//   // const handlePress = useCallback(() => {
//   //   if (Platform.OS === "android") {
//   //     try {
//   //       IntentLauncher.startActivityAsync(
//   //         IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
//   //       );
//   //     } catch (error) {
//   //       Toast.show({
//   //         type: "error",
//   //         text1: "Error opening location settings",
//   //         text2: "Please enable location manually.",
//   //       });
//   //     }
//   //   } else {
//   //     // iOS fallback: open app settings
//   //     Linking.openSettings().catch(() => {
//   //       Toast.show({
//   //         type: "error",
//   //         text1: "Failed to open settings",
//   //         text2: "Please open settings manually to enable location.",
//   //       });
//   //     });
//   //   }
//   // }, []);

// const handlePress = useCallback(() => {
//   setLocationEnableModal(false); // optional UX improvement

//   Linking.openSettings().catch(() => {
//     Toast.show({
//       type: "error",
//       text1: "Unable to open settings",
//       text2: "Please enable location permission manually.",
//     });
//   });
// }, []);




//   const handleLocationConfirmationModalBackPress = () => {

//  if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
//   if (countdownInterval.current) clearInterval(countdownInterval.current);
//     setShowCurrentLocationConfirmationModal(false);
//     // setShowSwipeModal(false);
//   };
  


// useEffect(() => {
//   return () => {
//     if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
//     if (countdownInterval.current) clearInterval(countdownInterval.current);
//   };
// }, []);

// //   useEffect(() => {
// //   return () => {
// //     if (autoCloseTimer.current) {
// //       clearTimeout(autoCloseTimer.current);
// //     }
// //   };
// // }, []);


// const calculateDistance = (lat1, lon1, lat2, lon2) => {
//   const toRad = (value) => (value * Math.PI) / 180;

//   const R = 6371e3; // meters
//   const φ1 = toRad(lat1);
//   const φ2 = toRad(lat2);

//   const Δφ = toRad(lat2 - lat1);
//   const Δλ = toRad(lon2 - lon1);

//   const a =
//     Math.sin(Δφ / 2) ** 2 +
//     Math.cos(φ1) * Math.cos(φ2) *
//     Math.sin(Δλ / 2) ** 2;

//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   return R * c;
// };


//   return (
//     <>
//       {upcomingShiftData ? (
//         <>
//           <View style={styles.clockContainer}>
//             <Text style={{ fontSize: 24, color: Colors.primary.color }}>
//               {upcomingShiftData?.shiftInTpam?.label
//                 ? upcomingShiftData?.shiftInTpam?.label
//                 : "--"}{" "}
//             </Text>
//             {/* <Text style={styles.time}>09:15 - 13:00</Text> */}
//             <Text style={styles.time}>
//               {upcomingShiftData?.startTime
//                 ? dayjs(upcomingShiftData?.startTime).format("HH:mm")
//                 : "--"}{" "}
//               -{" "}
//               {upcomingShiftData?.endTime
//                 ? dayjs(upcomingShiftData?.endTime).format("HH:mm")
//                 : "--"}
//             </Text>
//             <Text style={styles.date}>
//               {upcomingShiftData?.endTime
//                 ? dayjs(upcomingShiftData?.endTime).format(
//                     "MMM DD, YYYY - dddd"
//                   )
//                 : "--"}
//             </Text>
//             <Text style={styles.date}>
//               {upcomingShiftData?.checkpointInTpam?.name
//                 ? upcomingShiftData?.checkpointInTpam?.name
//                 : "--"}
//             </Text>
//           </View>
//           {/* Punch In/Out Button */}
//           {!hasPunchedOut && (
//             <View>
//               <Pressable
//                 testID="punch-in-button"
//                 onPress={() => {
//                fetchLocation(); 
//     //                setIsLoading(true);

//     // setTimeout(() => {
//     //   fetchLocation();
//     // }, 3000);

//                 }}
//                 style={({ pressed }) => [
//                   styles.outermostPunchinContainer,
//                   pressed && styles.punchButtonPressed,
//                 ]}
//               >
//                 <View style={styles.punchContainer}>
//                   <View>
//                     <View style={styles.punchButton}>
//                       <Image
//                         source={
//                           hasPunchedIn
//                             ? require("@/assets/images/punch-in.png")
//                             : require("@/assets/images/punch-out.png")
//                         } // Replace icon with image
//                         style={styles.punchImage} // Add a style for the image
//                       />
//                       <Text style={styles.punchText}>
//                         {hasPunchedIn ? t("punch-out") : t("punch-in")}
//                       </Text>
//                     </View>
//                   </View>
//                 </View>
//               </Pressable>
//             </View>
//           )}
//           {hasPunchedOut && <View style={{ height: 160 }}></View>}
          

//           {/** latest change **/}
//           <View style={[    styles.punchStats, { marginBottom: 72 + insets.bottom + 20, },]}>
          
//             <View style={styles.stat}>
//              <Clock3
//   size={24}
//   color={Colors.primary.textBlack}
//   strokeWidth={2}
// />
//               <Text style={styles.statTime}>
//                 {upcomingShiftData?.punchIn
//                   ? dayjs(upcomingShiftData?.punchIn).format("HH:mm")
//                   : "--"}
//               </Text>
//               <Text style={styles.statLabel}>{t("punch-in")}</Text>
//             </View>
//             <View style={styles.stat}>
//              <Clock8
//   size={24}
//   color={Colors.primary.textBlack}
//   strokeWidth={2}
// />
//               <Text style={styles.statTime}>
//                 {" "}
//                 {upcomingShiftData?.punchOut
//                   ? dayjs(upcomingShiftData?.punchOut).format("HH:mm")
//                   : "--"}
//               </Text>
//               <Text style={styles.statLabel}>{t("punch-out")}</Text>
//             </View>
         
//             <View style={styles.stat}>
//               <Pressable
//   style={styles.stat}
//   onPress={() => router.push("/location")}
// >
//   <MapPin
//     size={24}
//     color={Colors.primary.textBlack}
//     strokeWidth={2}
//   />
//   <Text style={styles.statTime}>{t("current")}</Text>
//   <Text style={styles.statLabel}>{t("location")}</Text>
// </Pressable>
//             </View>
//           </View>
//         </>
//       ) : (
//         <View
//           style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
//         >
//           <Text style={{ alignItems: "center", fontSize: 16, color: "gray" }}>
//             No upcoming shifts available for today
//           </Text>
//         </View>
//       )}

     

//       {showCurrentLocationConfirmationModal && (
//         <Modal
//           visible={showCurrentLocationConfirmationModal}
//           onRequestClose={handleLocationConfirmationModalBackPress}
//           animationType="fade"
//         >
//           {showCurrentLocationConfirmationModal && (
//             <SafeAreaView style={{ width: "100%", height: "100%" }}>
//               {/* <View style={{ flex: 1 }}> */}
//               <CurrentLocationConfirmationModal
//                 handleBackPress={handleLocationConfirmationModalBackPress}
//                 locationCoordinates={{
//                   latitude: location?.coords?.latitude,
//                   longitude: location?.coords?.longitude,
//                   latitudeDelta: 0.001,
//                   longitudeDelta: 0.001,
//                 }}
//                 modalOpenState={showCurrentLocationConfirmationModal}
//               >

//               </CurrentLocationConfirmationModal>
//               {/* </View> */}
             
//               {hasPunchedIn && (
//  <Text
//   style={[
//     styles.countdownText,
//     { color: secondsLeft <= 3 ? "#FF0000" : "#D32F2F" },
//   ]}
// >
//   Auto closing in {secondsLeft}s
// </Text>
// )}
             
//               <View
//                 style={{
//                   flexDirection: "row",
//                   padding: 16,
//                   // gap: 8,
//                   // justifyContent: ",
//                 }}
//               >
//                 {/* <View style={{ flexGrow: 1 }}>
//                   <CTAButton label="Close" type="bordered" />
//                 </View> */}
               
              
                
                
//                 <View style={{ flexGrow: 1 }}>
//                   <CTAButton
//                     disabled={
//                       !isAllowed ||
//                       //isLoading ||
//                       isMockLocation.current ||
//                       punchIn.isPending ||
//                       punchOut.isPending
//                     }
//                     label={
//                       punchIn.isPending
//                         ? "Punching in..."
//                         : punchOut.isPending
//                         ? "Punching out..."
//                         : "Confirm"
//                     }
//                     type="filled"
// onPress={() => {
//   if (autoCloseTimer.current) {
//     clearTimeout(autoCloseTimer.current);
//   }

//   if (countdownInterval.current) {
//     clearInterval(countdownInterval.current);
//   }

//   const punchInState = !hasPunchedIn
//     ? "punch-in"
//     : !hasPunchedOut
//     ? "punch-out"
//     : "";

//   handleSwipeSuccess(punchInState);
// }}

//                     //                     onPress={() => {
// //   // ✅ clear timeout
// //   if (autoCloseTimer.current) {
// //     clearTimeout(autoCloseTimer.current);
// //   }

// //   const punchInState = !hasPunchedIn
// //     ? "punch-in"
// //     : !hasPunchedOut
// //     ? "punch-out"
// //     : "";

// //   handleSwipeSuccess(punchInState);
// // }}
//                     // onPress={() => {
//                     //   const punchInState = !hasPunchedIn
//                     //     ? "punch-in"
//                     //     : !hasPunchedOut
//                     //     ? "punch-out"
//                     //     : "";
//                     //   handleSwipeSuccess(punchInState);
//                     // }}
//                   />
//                 </View>
//               </View>
//               <Toast config={toastConfig} />
            
//             </SafeAreaView>
//           )}
//         </Modal>
//       )}
//       <Modal visible={locationEnableModal} animationType="fade">
//         <View
//           style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
//         >
//           <Text>Please go to settings and enable location...</Text>
//           <Pressable onPress={handlePress}>
//             <View>
//               <Text
//                 style={{
//                   backgroundColor: Colors.primary.background,
//                   padding: 8,
//                   color: "white",
//                   marginVertical: 12,
//                 }}
//               >
//                 Go to settings
//               </Text>
//             </View>
//           </Pressable>
//         </View>
//       </Modal>



//  {/* ✅ ADD LOADER MODAL HERE 👇 */}

// <Modal
//   visible={isLoading }
//   transparent
//   animationType="fade"
// >
//   <View
//     style={{
//       flex: 1,
//       backgroundColor: isDark
//         ? "rgba(0,0,0,0.7)"
//         : "rgba(0,0,0,0.45)",
//       alignItems: "center",
//       justifyContent: "center",
//       padding: 20,
//     }}
//   >
//     {/* CARD */}
//     <View
//       style={{
//         width: "100%",
//         maxWidth: 340,
//         backgroundColor: isDark ? "#1E1E1E" : "#fff",
//         borderRadius: 16,
//         padding: 18,
//         elevation: 6,
//         shadowColor: "#000",
//         shadowOpacity: 0.2,
//         shadowRadius: 10,
//         shadowOffset: { width: 0, height: 4 },
//       }}
//     >
      
//       <View
//   style={{
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 14,
//   }}
// >
//   <Text
//     style={{
//       fontSize: 16,
//       fontWeight: "700",
//       color: isDark ? "#fff" : "#111",
//       marginRight: 8,
//     }}
//   >
//     📡 Wait! Fetching Location
//   </Text>

//   <ActivityIndicator
//     size="small"
//     color={isDark ? "#fff" : Colors.primary.color}
//   />
// </View>

//       {/* CHECKPOINT */}
//       <Text style={{ color: "#888", fontSize: 12 }}>
//         📍 Checkpoint (Expected)
//       </Text>
//       <Text
//         style={{
//           color: isDark ? "#ddd" : "#222",
//           fontSize: 13,
//           marginBottom: 12,
//           fontWeight: "500",
//         }}
//       >
//         {checkpointLocationName ||
//           upcomingShiftData?.checkpointInTpam?.name ||
//           "Loading..."}
//       </Text>

//       {/* USER LOCATION */}
//       <Text style={{ color: "#888", fontSize: 12 }}>
//         📌 Your Current Location
//       </Text>
//       <Text
//         style={{
//           color: isDark ? "#ddd" : "#222",
//           fontSize: 13,
//           marginBottom: 12,
//         }}
//       >
//         {currentLocationName || "Fetching location..."}
//       </Text>

//       {/* DISTANCE */}
//       <Text style={{ color: "#888", fontSize: 12 }}>
//         📏 Distance from checkpoint
//       </Text>
//       <Text
//         style={{
//           color:
//             distanceFromCheckpoint > 100
//               ? "#E53935"
//               : "#2E7D32",
//           fontSize: 14,
//           fontWeight: "700",
//         }}
//       >
//         {distanceFromCheckpoint
//           ? `${distanceFromCheckpoint} meters`
//           : "Calculating..."}
//       </Text>

//       {/* WARNING */}
//       {distanceFromCheckpoint > 100 && (
//         <Text
//           style={{
//             marginTop: 10,
//             fontSize: 12,
//             color: "#E53935",
//             textAlign: "center",
//             fontWeight: "600",
//           }}
//         >
//           ⚠ You are outside allowed checkpoint range
//         </Text>
//       )}
//     </View>
//   </View>
// </Modal>





//       {/* <SwipeToConfirmModal
//         state={!hasPunchedIn ? "punch-in" : !hasPunchedOut ? "punch-out" : ""}
//         showSwipeModal={showSwipeModal}
//         setShowSwipeModal={setShowSwipeModal}
//         onSwipeSuccess={handleSwipeSuccess}
//       /> */}
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "white",
//     padding: 16,
//     justifyContent: "space-between",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   profileInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//   },
//   name: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   id: {
//     fontSize: 12,
//     color: "#888",
//   },
//   clockContainer: {
//     alignItems: "center",
//   },
//   time: {
//     fontSize: 32,
//     fontWeight: "light",
//     color: Colors.primary.textBlack,
//     marginTop: 16,
//   },
//   date: {
//     color: "#666",
//     marginTop: 8,
//   },
//   outermostPunchinContainer: {
//     // backgroundColor: "red",
//   },
//   punchContainer: {
//     alignItems: "center",
//   },
//   punchButton: {
//     marginTop: "auto",
//     // width: 130,
//     // height: 130,
//     // borderRadius: 80,
//      width: BUTTON_SIZE,
//      height: BUTTON_SIZE,
//      borderRadius: BUTTON_SIZE / 2,
//      backgroundColor: "#fff",
//     // borderWidth: 4,
//     // borderColor: "#e0e0e0",
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 10,
//     elevation: 6,
//   },
//   punchButtonPressed: {
//     transform: [{ scale: 0.95 }],
//     opacity: 0.9, // Reduce opacity when pressed
//   },
//   punchImage: {
//     width: 34,
//     height: 52,
//     resizeMode: "contain",
//   },
//   punchText: {
//     marginTop: 8,
//     fontWeight: "bold",
//     color: "#444",
//   },
//    countdownText: {
//     textAlign: "center",
//     marginBottom: 12,
//     fontWeight: "bold",
//     fontSize: 14,
//     color: "#D32F2F", // alert red
//   },
//   punchStats: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     marginVertical: 16,
//     // marginTop:"auto"
//   },
//   stat: {
//     alignItems: "center",
//   },
//   statTime: {
//     fontSize: 12,
//     marginTop: 4,
//     fontWeight: "bold",
//   },
//   statLabel: {
//     fontSize: 12,
//     color: "#555",
//   },
// });







