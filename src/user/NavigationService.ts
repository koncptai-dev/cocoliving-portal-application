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

  /* ---------- CLEAN KEY ---------- */
  const rawKey = data?.notificationKey || data?.type || "";
  const key = rawKey.toString().trim().toLowerCase();

  /* ---------- EXTRACT TITLE ---------- */
  const title =
    data?.title?.toLowerCase?.() ||
    data?.notification?.title?.toLowerCase?.() ||
    "";

  console.log("🧪 RAW KEY:", rawKey);
  console.log("🧹 CLEAN KEY:", key);
  console.log("📌 TITLE:", title);
  console.log("📦 FULL DATA:", JSON.stringify(data, null, 2));

  /* ================= KEY BASED HANDLING ================= */

  // 🔥 REQUEST UPDATE
  if (key === "request_update") {
    console.log("✅ MATCH: REQUEST_UPDATE");

    navigationRef.navigate("ComplaintStatus", {
      requestId: data.requestId,
    });

    console.log("🚀 Navigated → ComplaintStatus");
    return;
  }

  // 🔥 ONBOARDING SUCCESS
  if (key === "onboarding_success") {
    console.log("✅ MATCH: ONBOARDING_SUCCESS");

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

  // 🔥 BOOKING
  if (key === "booking") {
    console.log("➡️ MATCH: BOOKING");

    if (data?.bookingId) {
      navigationRef.navigate("ContractSign", {
        bookingId: data.bookingId,
      });
      console.log("🚀 Navigated → ContractSign");
    } else {
      console.warn("⚠️ bookingId missing → fallback");
      navigationRef.navigate("notificationListScreen");
    }

    return;
  }

  // 🔥 EVENT
  if (key === "event") {
    console.log("➡️ MATCH: EVENT");
    navigationRef.navigate("notificationListScreen");
    return;
  }

  // 🔥 COMPLAINT
  if (key === "complaint") {
    console.log("➡️ MATCH: COMPLAINT");
    navigationRef.navigate("ComplaintStatus");
    return;
  }

  /* ================= TITLE BASED FALLBACK ================= */

  console.log("➡️ FALLBACK → TITLE BASED CHECK");

  if (title.includes("guest")) {
    console.log("✅ TITLE MATCH: GUEST");
    navigationRef.navigate("GuestVisit");
    return;
  }

  if (title.includes("request")) {
    console.log("✅ TITLE MATCH: REQUEST");
    navigationRef.navigate("ComplaintStatus");
    return;
  }

  if (title.includes("rent")) {
    console.log("✅ TITLE MATCH: RENT");
    navigationRef.navigate("PaymentScreen");
    return;
  }

  if (title === "welcome") {
    console.log("✅ TITLE MATCH: WELCOME");

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

  /* ================= FINAL FALLBACK ================= */

  console.warn("❌ NO MATCH FOUND → notification list");
  navigationRef.navigate("notificationListScreen");

  console.log("🔥 performNavigation END");
  console.log("🔥 =================================\n");
}