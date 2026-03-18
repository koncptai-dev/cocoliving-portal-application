// src/navigation/NavigationService.ts
import { createNavigationContainerRef } from '@react-navigation/native';

export type RootStackParamList = {
  HomeTabs: undefined;
  RaiseComplaint: undefined;
  ComplaintStatus: undefined;
  ComplaintHistory: undefined;
  ProfileScreen: undefined;
  PropertyDetails: undefined;
  RoomDetails: undefined;
  SelectYourBed: undefined;
  PayableAmountScreen: undefined;
  EventDetails: undefined;
  Profile: undefined;
  CommunityRules: undefined;
  TermsConditions: undefined;
  VerificationStatus: undefined;
  MyBookings: undefined;
  FoodMenu: undefined;
  NoProfileScreen: undefined;
  BookingSuccessScreen: undefined;
  PaymentFailedScreen: undefined;
  BookingDetails: undefined;
  PaymentScreen: undefined;
  GatePassScreen: undefined;
  EditProfileScreen: undefined;
  AboutUsScreen: undefined;
  notificationListScreen: undefined;
  myVisit: undefined;
  GuestVisit: undefined;
  Support: undefined;
  ContractSign: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Optional: Map notification titles to screens (agar future mein title-based navigation chahiye)
const notificationScreenMap: Record<string, keyof RootStackParamList> = {
  "Booking Approved": "ContractSign",
  // Add more if needed in future
};

interface NotificationData {
  notificationKey?: string;
  type?: string;
  eventId?: string;
  bookingId?: string;
  // Add other possible fields from your FCM payload
  [key: string]: any;
}

/**
 * Navigates to the appropriate screen based on push notification data.
 * Handles both app foreground/background and quit states safely.
 */
export function navigateFromNotification(data: NotificationData | null | undefined) {
  if (!data) {
    console.warn("No notification data received");
    return;
  }

  if (!navigationRef.isReady()) {
    console.log("Navigation container not ready yet → scheduling retry");

    // Retry after a short delay (common for app launch from quit state)
    setTimeout(() => {
      if (navigationRef.isReady()) {
        console.log("Navigation now ready → performing navigation");
        performNavigation(data);
      } else {
        console.warn("Navigation still not ready after delay → fallback to notification list");
        if (navigationRef.isReady()) {
          navigationRef.navigate("notificationListScreen");
        }
      }
    }, 1200); // 1.2 seconds – adjust between 800-2000ms if needed

    return;
  }

  performNavigation(data);
}

function performNavigation(data: NotificationData) {
  const key = data?.notificationKey || data?.type;

  console.log("🔥 FULL PUSH NOTIFICATION DATA:", JSON.stringify(data, null, 2));
  console.log("👉 Detected notification key/type:", key);

  switch (key?.toLowerCase()) {  // case-insensitive for safety

    /* ================= BOOKING ================= */
    case "booking":
      console.log("📌 Booking notification clicked");

      if (data?.bookingId) {
        console.log("✅ Navigating to ContractSign with bookingId:", data.bookingId);
        navigationRef.navigate("ContractSign", {
          bookingId: data.bookingId,
        });
      } else {
        console.warn("⚠️ bookingId missing in payload → fallback");
        navigationRef.navigate("notificationListScreen");
      }
      break;

    /* ================= EVENT ================= */
case "event":
  console.log("📌 Event notification clicked → redirecting to list");

  navigationRef.navigate("notificationListScreen");
  break;

    /* ================= COMPLAINT ================= */
    case "complaint":
      console.log("📌 Complaint notification clicked → navigating to ComplaintStatus");
      navigationRef.navigate("ComplaintStatus");
      break;

    /* ================= DEFAULT / UNKNOWN ================= */
    default:
      console.warn("⚠️ Unknown or unmapped notification key/type:", key);
      navigationRef.navigate("notificationListScreen");
      break;
  }
}