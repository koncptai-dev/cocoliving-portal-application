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

// map notification title to stack screen
const notificationScreenMap: Record<string, keyof RootStackParamList> = {
  "Booking Approved": "ContractSign",
  // Add more mappings if needed
};

export function navigateFromNotification(data: any) {
  if (!navigationRef.isReady()) return;

  const key = data?.notificationKey;

  switch (key) {
    case "booking":

  if (data?.bookingId) {
    navigationRef.navigate("ContractSign", {
      bookingId: data.bookingId,
    });
  } else {
    // fallback (safe)
    navigationRef.navigate("notificationListScreen");
  }

  break;

    case "complaint":
      navigationRef.navigate("ComplaintStatus");
      break;

    default:
      navigationRef.navigate("notificationListScreen");
  }
}

