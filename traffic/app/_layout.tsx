import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "@/hooks/useColorScheme";
import SplashScreenView from "@/components/SplashScreenView";
import "@/libs/i18n";
import { updateSavedLanguagePreference } from "@/utils/translation";
import Toast from "react-native-toast-message";
import toastConfig from "@/utils/toastConfig";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/libs/authContext";
import { Alert, Linking, PermissionsAndroid } from "react-native";
import messaging from "@react-native-firebase/messaging";
import notifee, {
  TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import { axiosInstance } from "@/libs/axios";
import * as Location from "expo-location";
import { requestLocationPermissions } from "@/utils/permissions";
import NetInfo from "@react-native-community/netinfo";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();


/* -----------------------------
   LOCATION HELPER (INLINE ONLY)
------------------------------*/
const getCurrentLocation = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status !== "granted") {
      const req = await Location.requestForegroundPermissionsAsync();
      if (req.status !== "granted") return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      mayShowUserSettingsDialog: true,
    });

    return position;
  } catch (error) {
    console.log("❌ Location error:", error);
    return null;
  }
};

/* -----------------------------
   FCM LOCATION LOGGING
------------------------------*/
const logCurrentLocation = async (remoteMessage: any) => {
  try {
    const position = await getCurrentLocation();

    if (!position?.coords) {
      console.log("❌ No location found");
      return;
    }

    const payload = {
      userId: remoteMessage.data?.userId,
      dutyId: remoteMessage.data?.dutyId,
      shiftId: remoteMessage.data?.shiftId,
      checkpointId: remoteMessage.data?.checkpointId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    const response = await axiosInstance.post(
      `/userApp/log-current-location/`,
      payload
    );

    console.log("✅ API response:", response.data);
  } catch (error) {
    console.log("❌ log location error", error);
  }
};

/* -----------------------------
   NOTIFICATION HANDLER
------------------------------*/
const handleNotificationMessage = async (remoteMessage: any) => {
  console.log("📩 Foreground FCM:", JSON.stringify(remoteMessage));

  // ✅ Special case: backend wants location
  if (remoteMessage.data?.type === "log-current-location") {
    await logCurrentLocation(remoteMessage);
    return;
  }

  const channelId = await notifee.createChannel({
    id: "default",
    name: "Default Channel",
  });

  // ✅ FIXED TIME LOGIC
  const fallbackDate = new Date();
  fallbackDate.setMinutes(fallbackDate.getMinutes() + 10);
  fallbackDate.setSeconds(0);

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: remoteMessage.data?.reminderTime
      ? Number(remoteMessage.data?.reminderTime)
      : fallbackDate.getTime(),
  };

  await notifee.createTriggerNotification(
    {
      title: remoteMessage.data?.title || "Notification Title",
      body: remoteMessage.data?.body || "Main body content",
      android: {
        channelId,
        pressAction: {
          id: "default",
          launchActivity: "default",
        },
      },
    },
    trigger
  );
};

/* -----------------------------
   APP LAYOUT
------------------------------*/
// export default function Layout({ children }: any) {
export default function Layout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);




const [isConnected, setIsConnected] = useState<boolean | null>(true);

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    setIsConnected(state.isConnected);
  });

  return unsubscribe;
}, []);


const theme =
  colorScheme === "dark" && isConnected === false
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: "#000000", // ✅ black when offline + dark mode
          card: "#000000",
          text: "#ffffff",
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: "#ffffff", // ✅ always white otherwise
          card: "#ffffff",
          text: "#000000",
        },
      };




  /* Splash + language init */
  useEffect(() => {
    const init = async () => {
      await updateSavedLanguagePreference();
      setIsReady(true);
      await SplashScreen.hideAsync();
    };

    init();

    PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
  }, []);

  

  /* FCM token + listener */
  useEffect(() => {
    const initFCM = async () => {
      await messaging().registerDeviceForRemoteMessages();
      const token = await messaging().getToken();
      console.log("🔥 FCM Token:", token);
    };

    initFCM();

    const unsubscribe = messaging().onMessage(handleNotificationMessage);

    return unsubscribe;
  }, []);

  if (!isReady) return <SplashScreenView />;

  return (
   <ThemeProvider value={theme}>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          statusBarStyle: "dark",
          statusBarColor: "#ffffff",
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="(admin)"
          options={{ contentStyle: { backgroundColor: "white" } }}
        />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  </QueryClientProvider>

  <Toast config={toastConfig} />
</ThemeProvider>
   
  );
}



