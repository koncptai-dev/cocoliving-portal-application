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

interface NotificationData {
  notificationKey?: string;
  type?: string;
  eventId?: string;
  bookingId?: string;
  requestId?: string;
  notification?: any;
  [key: string]: any;
}

/* ================= MAIN ENTRY ================= */
export function navigateFromNotification(data: NotificationData | null | undefined) {
  console.log("\n🚀 ===============================");
  console.log("🚀 navigateFromNotification CALLED");

  if (!data) {
    console.warn("❌ No notification data received");
    return;
  }

  console.log("📦 RAW DATA:", JSON.stringify(data, null, 2));

  if (!navigationRef.isReady()) {
    console.log("⏳ Navigation NOT ready → retrying...");

    setTimeout(() => {
      console.log("🔁 Retry triggered");

      if (navigationRef.isReady()) {
        console.log("✅ Navigation READY after delay");
        performNavigation(data);
      } else {
        console.warn("❌ Still NOT ready → fallback to notification list");
        navigationRef.navigate("notificationListScreen");
      }
    }, 1200);

    return;
  }

  console.log("✅ Navigation READY immediately");
  performNavigation(data);
}

/* ================= NAVIGATION LOGIC ================= */
function performNavigation(data: NotificationData) {
  console.log("\n🔥 =================================");
  console.log("🔥 performNavigation START");

  const rawKey = data?.notificationKey || data?.type || "";
  const key = rawKey.toString().trim().toLowerCase();

  const title =
    data?.title?.toLowerCase?.() ||
    data?.notification?.title?.toLowerCase?.() ||
    "";

  console.log("🧪 RAW KEY:", rawKey);
  console.log("🧹 CLEAN KEY:", key);
  console.log("📌 TITLE:", title);
  console.log("📦 FULL DATA:", JSON.stringify(data, null, 2));

  /* ================= KEY BASED HANDLING ================= */

  // 🔥 VISIT TODAY
  if (key === "visit_today") {
    console.log("✅ MATCH: VISIT TODAY");

    navigationRef.navigate("notificationListScreen");

    console.log("🚀 Navigated → myVisit");
    return;
  }

  // 🔥 CHECK-IN REMINDER
  if (key === "checkin_reminder") {
    console.log("✅ MATCH: CHECKIN REMINDER");

    navigationRef.navigate("MyBookings");

    console.log("🚀 Navigated → MyBookings");
    return;
  }

  // 🔥 ONBOARDING SUCCESS
  if (key === "onboarding_success") {
    console.log("✅ MATCH: ONBOARDING SUCCESS");

    navigationRef.reset({
      index: 0,
      routes: [
        {
          name: "HomeTabs",
          state: {
            routes: [{ name: "Center" }],
          },
        },
      ],
    });

    console.log("🚀 Reset → HomeTabs → Center");
    return;
  }

  // 🔥 SECURITY DEPOSIT
  if (key === "security_deposit") {
    console.log("✅ MATCH: SECURITY DEPOSIT");

        navigationRef.navigate("MyBookings");

    console.log("🚀 Navigated → PaymentScreen");
    return;
  }

  // 🔥 RENT DUE
  if (key === "rent_due_last_day") {
    console.log("✅ MATCH: RENT DUE");

        navigationRef.navigate("MyBookings");

    console.log("🚀 Navigated → PaymentScreen");
    return;
  }

  // 🔥 REQUEST UPDATE
  if (key === "request_update") {
    console.log("✅ MATCH: REQUEST UPDATE");

    navigationRef.navigate("ComplaintStatus", {
      requestId: data.requestId,
    });

    console.log("🚀 Navigated → ComplaintStatus");
    return;
  }

  // 🔥 GUEST UPDATE
  if (key === "guest_update") {
    console.log("✅ MATCH: GUEST UPDATE");

    navigationRef.navigate("GuestVisit");

    console.log("🚀 Navigated → GuestVisit");
    return;
  }

  // 🔥 TENURE ENDING
  if (key === "tenure_ending") {
    console.log("✅ MATCH: TENURE ENDING");

    navigationRef.navigate("MyBookings");

    console.log("🚀 Navigated → MyBookings");
    return;
  }

  // 🔥 BOOKING (old support)
  if (key === "booking") {
    console.log("➡️ MATCH: BOOKING");

    if (data?.bookingId) {
      navigationRef.navigate("ContractSign", {
        bookingId: data.bookingId,
      });
    } else {
      navigationRef.navigate("notificationListScreen");
    }

    return;
  }

  /* ================= FALLBACK ================= */

  console.log("➡️ FALLBACK → TITLE CHECK");

  if (title.includes("guest")) {
    navigationRef.navigate("GuestVisit");
    return;
  }

  if (title.includes("rent")) {
    navigationRef.navigate("PaymentScreen");
    return;
  }

  if (title.includes("check-in")) {
    navigationRef.navigate("MyBookings");
    return;
  }

  if (title === "welcome") {
    navigationRef.reset({
      index: 0,
      routes: [
        {
          name: "HomeTabs",
          state: {
            routes: [{ name: "Center" }],
          },
        },
      ],
    });
    return;
  }

  console.warn("❌ NO MATCH → notification list");
  navigationRef.navigate("notificationListScreen");

  console.log("🔥 performNavigation END");
  console.log("🔥 =================================\n");
}