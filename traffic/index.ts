import messaging from "@react-native-firebase/messaging";
import notifee, {
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import "expo-router/entry";
//import Geolocation from "react-native-geolocation-service";
import * as Location from "expo-location";
import { axiosInstance } from "./libs/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EventType } from "@notifee/react-native";

const logCurrentLocation = async (remoteMessage: any) => {
  try {
    // ✅ permission
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      console.log("❌ Location permission denied");
      return;
    }

    // ✅ get location
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    console.log("📍 Expo Location:", position);

    const payload = {
      userId: remoteMessage.data?.userId,
      dutyId: remoteMessage.data?.dutyId,
      shiftId: remoteMessage.data?.shiftId,
      checkpointId: remoteMessage.data?.checkpointId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    console.log("🚀 payload", payload);

    const response = await axiosInstance.post(
      `/userApp/log-current-location/`,
      payload
    );

    console.log("✅ response from api", response.data);
  } catch (error) {
    console.log("❌ log location error", error);
  }
};
// const logCurrentLocation = async (remoteMessage: any) => {
//   await Geolocation.getCurrentPosition(async (position) => {
//     console.log(position, "position data");
//     const payload = {
//       userId: remoteMessage.data?.userId,
//       dutyId: remoteMessage.data?.dutyId,
//       shiftId: remoteMessage.data?.shiftId,
//       checkpointId: remoteMessage.data?.checkpointId,
//       latitude: position.coords.latitude,
//       longitude: position.coords.longitude,
//     };
//     console.log("payload", payload);
//     try {
//       const response = await axiosInstance.post(
//         `/userApp/log-current-location/`,
//         payload
//       );
//       console.log("response form api", response.data);
//     } catch (error) {
//       console.log(error);
//     }
//   });
// };

const handleNotificationMessage = async (remoteMessage) => {
  console.log(
    "A new background FCM message arrived!",
    JSON.stringify(remoteMessage)
  );

  if (remoteMessage.data?.type === "log-current-location") {
    await logCurrentLocation(remoteMessage);
    return;
  }

  // Create a channel (required for Android)
  const channelId = await notifee.createChannel({
    id: "default",
    name: "Default Channel",
  });

  const date = new Date(Date.now());
  date.setMinutes(1);
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: remoteMessage.data?.reminderTime
      ? Number(remoteMessage.data?.reminderTime)
      : date.getTime(), // fire at 11:10am (10 minutes before meeting)
  };

  // Display a notification
  // await notifee.displayNotification(
  //   {
  //     title: remoteMessage.data?.title
  //       ? remoteMessage.data?.title
  //       : "Notification Title",
  //     body: remoteMessage.data?.body
  //       ? remoteMessage.data?.body
  //       : "Main body content of the notification",
  //     android: {
  //       channelId,
  //       // smallIcon: "name-of-a-small-icon", // optional, defaults to 'ic_launcher'.
  //       // pressAction is needed if you want the notification to open the app when pressed
  //       pressAction: {
  //         id: "default",
  //         launchActivity: "default",
  //       },
  //     },
  //   },
  // );

  //trigger notification
  await notifee.createTriggerNotification(
    {
      title: remoteMessage.data?.title
        ? remoteMessage.data?.title
        : "Notification Title",
      body: remoteMessage.data?.body
        ? remoteMessage.data?.body
        : "Main body content of the notification",
      android: {
        channelId,
        // smallIcon: "name-of-a-small-icon", // optional, defaults to 'ic_launcher'.
        // pressAction is needed if you want the notification to open the app when pressed
        pressAction: {
          id: "default",
          launchActivity: "default",
        },
      },
    },
    trigger
  );

  return;
};

async function checkNotificationPermission() {
  const settings = await notifee.getNotificationSettings();

  if (settings.authorizationStatus == AuthorizationStatus.AUTHORIZED) {
    console.log("Notification permissions has been authorized");
  } else if (settings.authorizationStatus == AuthorizationStatus.DENIED) {
    console.log("Notification permissions has been denied");
    await notifee.requestPermission();
  }
}

// Register background handler
messaging().setBackgroundMessageHandler(handleNotificationMessage);

checkNotificationPermission();
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  console.log("notitefee", notification, pressAction);
  if (type === EventType.DISMISSED) {
    console.log("[Notifee] notification dismissed", detail?.notification?.id);

    // read persisted state to decide whether we actually want to restore
    const state = await readTrackingState(); // your AsyncStorage function
    if (state?.active) {
      // small delay to avoid a rapid swipe loop; you can tune this
      await new Promise((r) => setTimeout(r, 500));
      await restoreFgsNotification();
    }
  }

  // handle press actions e.g. stop-tracking
  if (type === EventType.PRESS && detail?.pressAction?.id === "stop-tracking") {
    // call your stop routine
    await stopForegroundTracking();
  }
  //   // Check if the user pressed the "Mark as read" action
  //   if (type === EventType.ACTION_PRESS && pressAction.id === 'mark-as-read') {
  //     // Update external API
  //     await fetch(`https://my-api.com/chat/${notification.data.chatId}/read`, {
  //       method: 'POST',
  //     });

  //     // Remove the notification
  //     await notifee.cancelNotification(notification.id);
  //   }
  // });

  return () => {};
});

// Listen for background (and foreground) events
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DISMISSED) {
    console.log("[Notifee] notification dismissed", detail?.notification?.id);

    // read persisted state to decide whether we actually want to restore
    const state = await readTrackingState(); // your AsyncStorage function
    console.log("state", state);
    if (state?.active) {
      // small delay to avoid a rapid swipe loop; you can tune this
      await new Promise((r) => setTimeout(r, 500));
      await restoreFgsNotification();
    }
  }

  // // handle press actions e.g. stop-tracking
  // if (type === EventType.PRESS && detail?.pressAction?.id === "stop-tracking") {
  //   // call your stop routine
  //   await stopForegroundTracking();
  // }
});

async function restoreFgsNotification() {
  await notifee.createChannel({ id: FG_CHANNEL_ID, name: "Location tracking" });
  await notifee.displayNotification({
    id: FG_NOTIFICATION_ID,
    title: "Duty started — tracking active",
    body: "Tap to open (do not dismiss)",
    android: {
      channelId: FG_CHANNEL_ID,
      asForegroundService: true,
      ongoing: true,
      smallIcon: "ic_launcher", // ensure resource exists
      /* optionally: add an action button to stop cleanly */
      showChronometer: true, // show the timer UI
      chronometerDirection: "down", // count down to the timestamp
      actions: [
        {
          title: "Stop",
          pressAction: { id: "stop-tracking" },
        },
      ],
    },
  });
}

// ---------- FGS robust runner + storage ----------

// Storage keys / defaults
const STORAGE_KEY = "@fg_tracking_state_v1";
const FG_CHANNEL_ID = "tracking-channel";
const FG_NOTIFICATION_ID = "tracking-service";
// const DEFAULT_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
const DEFAULT_INTERVAL_MS = 60 * 1000; // 2 hours

type TrackingState = {
  active: boolean;
  intervalMs?: number;
  payload?: Record<string, any>;
  shiftEndTs?: number; // epoch ms when shift should end
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function saveTrackingState(state: TrackingState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function readTrackingState(): Promise<TrackingState | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TrackingState;
  } catch {
    return null;
  }
}

async function clearTrackingState() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// Register Notifee Foreground Service runner
notifee.registerForegroundService(async (notification) => {
  console.log("[FGS] started - robust runner");

  // Load persisted config on start
  let state = (await readTrackingState()) || { active: false };

  // Ensure quick globals (immediate access)
  (global as any).FG_TRACKING_RUN = !!state.active;
  (global as any).FG_LOCATION_INTERVAL_MS =
    state.intervalMs ?? DEFAULT_INTERVAL_MS;
  (global as any).FG_TRACKING_PAYLOAD = state.payload ?? {};

  // The promise resolves when the service stops
  return new Promise<void>(async (resolve) => {
    try {
      while ((global as any).FG_TRACKING_RUN) {
        // Re-read persisted config to pick up UI/FCM updates
        const persisted = await readTrackingState();
        if (!persisted || !persisted.active) {
          console.log("[FGS] persisted state indicates stop; exiting loop");
          (global as any).FG_TRACKING_RUN = false;
          break;
        }
        state = persisted;

        // Auto-stop if shift end time reached
        // if (state.shiftEndTs && Date.now() >= state.shiftEndTs) {
        if (false) {
          console.log("[FGS] shiftEnd reached -> stopping automatically");
          // clear persisted state then stop
          await clearTrackingState();
          (global as any).FG_TRACKING_RUN = false;
          try {
            await notifee.stopForegroundService();
          } catch (e) {
            console.warn("[FGS] stopForegroundService error", e);
          }
          break;
        }

        // Call your existing log function; ensure payload shape matches
        try {
          await logCurrentLocation({ data: state.payload ?? {} });
        } catch (err) {
          console.warn("[FGS] logCurrentLocation error", err);
        }

        // Update persistent notification with last-run info
        try {
          await notifee.displayNotification({
            id: FG_NOTIFICATION_ID,
            title: "Duty tracking active",
            body: `Last update: ${new Date().toLocaleTimeString()}`,
            android: {
              channelId: FG_CHANNEL_ID,
              asForegroundService: true,
              ongoing: true,
              smallIcon: "ic_launcher", // ensure resource exists or use 'ic_launcher'
              showChronometer: true, // show the timer UI
              chronometerDirection: "down", // count down to the timestamp
            },
          });
        } catch (e) {
          console.warn("[FGS] displayNotification error", e);
        }

        // sleep until next iteration (re-read persisted config next loop)
        const interval = state.intervalMs ?? DEFAULT_INTERVAL_MS;
        await sleep(interval);
      }
    } catch (err) {
      console.warn("[FGS] unexpected runner error", err);
    } finally {
      console.log("[FGS] runner resolve");
      resolve();
    }
  });
});

// ---------- API: start / stop functions to call from UI ----------
/**
 * Start foreground tracking
 * @param payload - data that your logCurrentLocation expects (userId, dutyId, etc)
 * @param intervalMs - polling interval in ms (optional)
 * @param shiftEndTs - epoch ms when shift ends (optional) -> auto-stop
 */
export async function startForegroundTracking(
  payload: Record<string, any>,
  intervalMs?: number,
  shiftEndTs?: number
) {
  const state: TrackingState = {
    active: true,
    payload,
    intervalMs: intervalMs ?? DEFAULT_INTERVAL_MS,
    shiftEndTs,
  };

  // persist
  await saveTrackingState(state);

  // also set quick globals for immediate effect
  (global as any).FG_TRACKING_RUN = true;
  (global as any).FG_TRACKING_PAYLOAD = payload;
  (global as any).FG_LOCATION_INTERVAL_MS = state.intervalMs;

  // create channel and start FGS by displaying notification
  await notifee.createChannel({ id: FG_CHANNEL_ID, name: "Location tracking" });

  await notifee.displayNotification({
    id: FG_NOTIFICATION_ID,
    title: "Duty started — tracking active",
    body: "Tap to open",
    android: {
      channelId: FG_CHANNEL_ID,
      asForegroundService: true,
      ongoing: true,
      smallIcon: "ic_launcher",
      timestamp: shiftEndTs, // epoch ms (Number)
      showChronometer: true, // show the timer UI
      chronometerDirection: "down", // count down to the timestamp
    },
  });
}

/** Stop foreground tracking (manual punch-out or immediate stop) */
export async function stopForegroundTracking() {
  // clear persisted state first
  await clearTrackingState();

  // clear globals
  (global as any).FG_TRACKING_RUN = false;
  (global as any).FG_TRACKING_PAYLOAD = {};
  delete (global as any).FG_LOCATION_INTERVAL_MS;

  try {
    await notifee.stopForegroundService();
  } catch (e) {
    console.warn("stopForegroundService err", e);
  }
  try {
    await notifee.cancelNotification(FG_NOTIFICATION_ID);
  } catch (e) {}
}

// Optionally export read function
export async function isTrackingActive(): Promise<boolean> {
  const s = await readTrackingState();
  return !!(s && s.active);
}
