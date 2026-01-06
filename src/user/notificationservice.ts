import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import axios from 'axios';

/**
 * 🔐 Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();

  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  console.log(
    enabled
      ? '✅ Notification permission granted'
      : '❌ Notification permission denied'
  );

  return enabled;
}

/**
 * 📢 Create Android notification channel
 */
export async function createNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Notifications',
    importance: AndroidImportance.HIGH,
  });
}

/**
 * 📲 Get FCM token (NO backend call here)
 */
export async function getFcmToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    console.log('🔥 FCM TOKEN:', token);
    return token;
  } catch (e) {
    console.log('❌ Error getting FCM token', e);
    return null;
  }
}

/**
 * 🔁 Sync FCM token to backend (CALL AFTER LOGIN)
 */
export async function syncFcmTokenToBackend(
  authToken: string,
  fcmToken: string,
) {
  try {
    await axios.post(
      'https://staging.cocoliving.in/api/fcm/store-fcm-token',
      { 
        fcmToken },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    console.log('✅ FCM token synced to backend');
  } catch (e) {
    console.log('❌ Failed to sync FCM token', e);
  }
}

/**
 * 🔔 Foreground notification listener
 */
export function listenForegroundNotifications(): () => void {
  return messaging().onMessage(
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('📩 Foreground message:', remoteMessage);

      await notifee.displayNotification({
        title: remoteMessage.notification?.title ?? 'New Notification',
        body: remoteMessage.notification?.body ?? '',
        android: {
          channelId: 'default',
          pressAction: { id: 'default' },
        },
        data: remoteMessage.data,
      });
    },
  );
}

/**
 * 👉 Handle notification tap (background & quit)
 */
export function listenNotificationOpen(navigation: any): void {
  messaging().onNotificationOpenedApp(() => {
    navigation.navigate('Notification');
  });

  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        navigation.navigate('Notification');
      }
    });
}


// import messaging, {
//   FirebaseMessagingTypes,
// } from '@react-native-firebase/messaging';
// import notifee, { AndroidImportance } from '@notifee/react-native';

// /**
//  * 🔐 Request notification permission
//  */
// export async function requestNotificationPermission(): Promise<void> {
//   const authStatus = await messaging().requestPermission();

//   const enabled =
//     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//   console.log(
//     enabled
//       ? '✅ Notification permission granted'
//       : '❌ Notification permission denied'
//   );
// }

// /**
//  * 📢 Create Android notification channel
//  */
// export async function createNotificationChannel(): Promise<void> {
//   await notifee.createChannel({
//     id: 'default',
//     name: 'Default Notifications',
//     importance: AndroidImportance.HIGH,
//   });
// }

// /**
//  * 📲 Get FCM token
//  */
// export async function getFcmToken(): Promise<string | null> {
//   const token = await messaging().getToken();
//   console.log('🔥 FCM TOKEN:', token);

//   // Optional: send token to backend
//   return token;
// }

// /**
//  * 🔔 Foreground notification listener
//  */
// export function listenForegroundNotifications(): () => void {
//   return messaging().onMessage(
//     async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
//       console.log('📩 Foreground message:', remoteMessage);

//       await notifee.displayNotification({
//         title: remoteMessage.notification?.title ?? 'New Notification',
//         body: remoteMessage.notification?.body ?? '',
//         android: {
//           channelId: 'default',
//           pressAction: { id: 'default' },
//         },
//         data: remoteMessage.data,
//       });
//     },
//   );
// }

// /**
//  * 👉 Handle notification tap (background & quit)
//  */
// export function listenNotificationOpen(
//   navigation: any,
// ): void {
//   messaging().onNotificationOpenedApp(
//     (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
//       console.log('📲 Notification opened (background)');
//       navigation.navigate('Notification');
//     },
//   );

//   messaging()
//     .getInitialNotification()
//     .then((remoteMessage) => {
//       if (remoteMessage) {
//         console.log('📲 Notification opened (quit)');
//         navigation.navigate('Notification');
//       }
//     });
// }
