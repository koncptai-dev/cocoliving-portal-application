import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance,EventType } from '@notifee/react-native';
import axios from 'axios';
import { PermissionsAndroid, Platform } from "react-native";
import { navigateFromNotification } from './NavigationService'


/* ----------------------------------------------------
 * PERMISSIONS
 * ---------------------------------------------------- */


export async function requestNotificationPermission(): Promise<boolean> {
  try {

    // ✅ ANDROID 13+ FIX
    if (Platform.OS === "android" && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log("❌ Android notification permission denied");
        return false;
      }
    }

    // ✅ iOS + fallback
    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    console.log(
      enabled
        ? "✅ Notification permission granted"
        : "❌ Notification permission denied"
    );

    return enabled;

  } catch (error) {
    console.log("❌ Permission error:", error);
    return false;
  }
}

/* ----------------------------------------------------
 * ANDROID CHANNEL
 * ---------------------------------------------------- */
export async function createNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Notifications',
    importance: AndroidImportance.HIGH,
  });
}

/* ----------------------------------------------------
 * GET FCM TOKEN
 * ---------------------------------------------------- */
export async function getFcmToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    console.log('🔥 FCM TOKEN:', token);
    return token;
  } catch (error) {
    console.log('❌ Error getting FCM token', error);
    return null;
  }
}

/* ----------------------------------------------------
 * SEND FCM TOKEN TO BACKEND (CALL AFTER LOGIN)
 * ---------------------------------------------------- */
export async function syncFcmTokenToBackend(
  authToken: string,
  fcmToken: string
): Promise<void> {
  if (!authToken || !fcmToken) {
    console.log('⚠️ Missing authToken or fcmToken');
    return;
  }

  try {
    console.log('📤 Syncing FCM token to backend:', fcmToken);

    const response = await axios.post(
      'https://staging.cocoliving.in/api/fcm/store-fcm-token',
      { fcmToken },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ FCM token synced successfully', response.data);
  } catch (error: any) {
    console.log(
      '❌ Failed to sync FCM token',
      error?.response?.data || error.message
    );
  }
}

/* ----------------------------------------------------
 * FOREGROUND NOTIFICATIONS
 * ---------------------------------------------------- */
export function listenForegroundNotifications(): () => void {
  return messaging().onMessage(
    async (remoteMessage) => {
      console.log('📩 Foreground notification:', remoteMessage);

      await notifee.displayNotification({
        title: remoteMessage.notification?.title ?? 'New Notification',
        body: remoteMessage.notification?.body ?? '',
        android: {
          channelId: 'default',
          pressAction: { id: 'default' },
        },
        data: remoteMessage.data,
      });

      // ❌ yaha navigation mat karo
    }
  );
}

export function listenForegroundClick() {
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log("👆 Foreground notification clicked");

      handleNavigation({
        data: detail.notification?.data
      });
    }
  });
}

/* ----------------------------------------------------
 * BACKGROUND & KILLED STATE
 * ---------------------------------------------------- */
export function listenNotificationOpen(): void {
  // App in background
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('📲 Background notification opened:', remoteMessage);
    handleNavigation(remoteMessage);
  });

  // App killed
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('📥 Killed notification opened:', remoteMessage);
        handleNavigation(remoteMessage);
      }
    });
}

/* ----------------------------------------------------
 * TOKEN REFRESH (IMPORTANT)
 * ---------------------------------------------------- */
export function listenTokenRefresh(authToken: string): void {
  messaging().onTokenRefresh(newToken => {
    console.log('🔁 FCM token refreshed:', newToken);
    syncFcmTokenToBackend(authToken, newToken);
  });
}

/* ----------------------------------------------------
 * NAVIGATION HANDLER
 * ---------------------------------------------------- */
function handleNavigation(remoteMessage) {
  const data = remoteMessage?.data;
  console.log("📦 Notification data:", data);

  navigateFromNotification(data);
}



// // src/user/notificationservice.ts
// import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
// import notifee, { AndroidImportance } from '@notifee/react-native';
// import { navigateFromNotification } from '../navigation/NavigationService';

// /* ---------- PERMISSIONS & CHANNEL ---------- */
// export async function requestNotificationPermission(): Promise<boolean> {
//   const authStatus = await messaging().requestPermission();
//   const enabled =
//     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//   console.log(
//     enabled
//       ? '✅ Notification permission granted'
//       : '❌ Notification permission denied'
//   );

//   return enabled;
// }

// export async function createNotificationChannel(): Promise<void> {
//   await notifee.createChannel({
//     id: 'default',
//     name: 'Default Notifications',
//     importance: AndroidImportance.HIGH,
//   });
// }

// /* ---------- GET FCM TOKEN ---------- */
// export async function getFcmToken(): Promise<string | null> {
//   try {
//     const token = await messaging().getToken();
//     console.log('🔥 FCM TOKEN:', token);
//     return token;
//   } catch (e) {
//     console.log('❌ Error getting FCM token', e);
//     return null;
//   }
// }

// /* ---------- FOREGROUND NOTIFICATIONS ---------- */
// export function listenForegroundNotifications(): () => void {
//   return messaging().onMessage(
//     async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
//       console.log('📩 Foreground notification:', remoteMessage);

//       // show local notification
//       await notifee.displayNotification({
//         title: remoteMessage.notification?.title ?? 'New Notification',
//         body: remoteMessage.notification?.body ?? '',
//         android: { channelId: 'default', pressAction: { id: 'default' } },
//         data: remoteMessage.data,
//       });

//       // auto navigate if needed
//       handleNavigation(remoteMessage);
//     }
//   );
// }

// /* ---------- BACKGROUND & KILLED ---------- */
// export function listenNotificationOpen(): void {
//   // app in background
//   messaging().onNotificationOpenedApp(remoteMessage => {
//     console.log('📲 Background notification opened:', remoteMessage);
//     handleNavigation(remoteMessage);
//   });

//   // app killed
//   messaging()
//     .getInitialNotification()
//     .then(remoteMessage => {
//       if (remoteMessage) {
//         console.log('📥 Killed notification opened:', remoteMessage);
//         handleNavigation(remoteMessage);
//       }
//     });
// }

// /* ---------- NAVIGATION LOGIC ---------- */
// function handleNavigation(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
//   const title = remoteMessage?.notification?.title ?? '';
//   navigateFromNotification(title);
// }








// // import messaging, {
// //   FirebaseMessagingTypes,
// // } from '@react-native-firebase/messaging';
// // import notifee, { AndroidImportance } from '@notifee/react-native';
// // import axios from 'axios';

// // /**
// //  * 🔐 Request notification permission
// //  */


// // import { navigate } from '../navigation/NavigationService';

// // export function listenNotificationOpen(): void {
// //   // App in background
// //   messaging().onNotificationOpenedApp(remoteMessage => {
// //     handleNavigation(remoteMessage);
// //   });

// //   // App killed
// //   messaging().getInitialNotification().then(remoteMessage => {
// //     if (remoteMessage) handleNavigation(remoteMessage);
// //   });
// // }

// // function handleNavigation(remoteMessage: any) {
// //   const title = remoteMessage?.notification?.title;

// //   if (title === 'Booking Approved') {
// //     navigate('ContractSign', {
// //       bookingId: remoteMessage?.data?.bookingId || remoteMessage?.notification?.id,
// //       roomNumber: remoteMessage?.data?.roomNumber || 2,
// //     });
// //   } else {
// //     navigate('notificationListScreen');
// //   }
// // }



// // export async function requestNotificationPermission(): Promise<boolean> {
// //   const authStatus = await messaging().requestPermission();

// //   const enabled =
// //     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
// //     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

// //   console.log(
// //     enabled
// //       ? '✅ Notification permission granted'
// //       : '❌ Notification permission denied'
// //   );

// //   return enabled;
// // }

// // /**
// //  * 📢 Create Android notification channel
// //  */
// // export async function createNotificationChannel(): Promise<void> {
// //   await notifee.createChannel({
// //     id: 'default',
// //     name: 'Default Notifications',
// //     importance: AndroidImportance.HIGH,
// //   });
// // }

// // /**
// //  * 📲 Get FCM token (NO backend call here)
// //  */
// // export async function getFcmToken(): Promise<string | null> {
// //   try {
// //     const token = await messaging().getToken();
// //     console.log('🔥 FCM TOKEN:', token);
// //     return token;
// //   } catch (e) {
// //     console.log('❌ Error getting FCM token', e);
// //     return null;
// //   }
// // }

// // /**
// //  * 🔁 Sync FCM token to backend (CALL AFTER LOGIN)
// //  */

// // export async function syncFcmTokenToBackend(
// //   authToken: string,
// //   fcmToken: string,
// // ) {
// //   if (!authToken || !fcmToken) {
// //     console.log('⚠️ Missing authToken or fcmToken', {
// //       authTokenExists: !!authToken,
// //       fcmTokenExists: !!fcmToken,
// //     });
// //     return;
// //   }

// //   try {
// //     console.log('📤 Sending FCM token to backend:', fcmToken);

// //     const response = await axios.post(
// //       'https://staging.cocoliving.in/api/fcm/store-fcm-token',
// //       { fcmToken },
// //       {
// //         headers: {
// //           Authorization: `Bearer ${authToken}`,
// //           'Content-Type': 'application/json',
// //         },
// //         timeout: 10000,
// //       },
// //     );

// //     console.log('✅ FCM token synced successfully');
// //     console.log('📥 Backend response:', response.data);
// //   } catch (error: any) {
// //     console.log('❌ Failed to sync FCM token');

// //     if (error.response) {
// //       // Backend responded with error
// //       console.log('🚨 Response status:', error.response.status);
// //       console.log('🚨 Response data:', error.response.data);
// //     } else if (error.request) {
// //       // Request made but no response
// //       console.log('🚨 No response from backend:', error.request);
// //     } else {
// //       // Something else went wrong
// //       console.log('🚨 Error message:', error.message);
// //     }
// //   }
// // }



// // // export async function syncFcmTokenToBackend(
// // //   authToken: string,
// // //   fcmToken: string,
// // // ) {
// // //   try {
// // //     await axios.post(
// // //       'https://staging.cocoliving.in/api/fcm/store-fcm-token',
// // //       { 
// // //         fcmToken },
// // //       {
// // //         headers: {
// // //           Authorization: `Bearer ${authToken}`,
// // //         },
// // //       },
// // //     );

// // //     console.log('✅ FCM token synced to backend');
// // //   } catch (e) {
// // //     console.log('❌ Failed to sync FCM token', e);
// // //   }
// // // }

// // /**
// //  * 🔔 Foreground notification listener
// //  */
// // export function listenForegroundNotifications(): () => void {
// //   return messaging().onMessage(
// //     async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
// //       console.log('📩 Foreground message:', remoteMessage);

// //       await notifee.displayNotification({
// //         title: remoteMessage.notification?.title ?? 'New Notification',
// //         body: remoteMessage.notification?.body ?? '',
// //         android: {
// //           channelId: 'default',
// //           pressAction: { id: 'default' },
// //         },
// //         data: remoteMessage.data,
// //       });
// //     },
// //   );
// // }

// // /**
// //  * 👉 Handle notification tap (background & quit)
// //  */
// // // export function listenNotificationOpen(navigation: any): void {
// // //   messaging().onNotificationOpenedApp(() => {
// // //     navigation.navigate('Notification');
// // //   });

// // //   messaging()
// // //     .getInitialNotification()
// // //     .then((remoteMessage) => {
// // //       if (remoteMessage) {
// // //         navigation.navigate('Notification');
// // //       }
// // //     });
// // // }



