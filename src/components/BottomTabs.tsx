import React from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { View, Image, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // add this import

// Screens
import BrowsePropertiesScreen from "../user/BrowsePropertiesScreen";
import EventsScreen from "../user/Events";
import DashboardScreen from "../user/dashboard";
import FindStayScreen from "./Dashboard/FindStayScreen";
import AccessHistory from "../user/AccessHistory";
import SupportScreen from "../user/Support";

// Hidden Screens (Jo har screen par bar dikhayengi)
import RaiseComplaint from '../components/Support/RaiseComplaint';
import ComplaintStatus from '../components/Support/ComplaintStatus';
import ComplaintHistory from '../components/Support/ComplaintHistory';
import ProfileScreen from '../components/ProfileScreen';
import PropertyDetailsScreen from '../user/PropertyDetailsScreen';
import RoomDetailsScreen from '../user/RoomDetailsScreen';
import SelectYourBedScreen from '../user/SelectYourBedScreen';
import PayableAmountScreen from '../user/PayableAmountScreen';
import EventDetailsScreen from '../components/Events/eventsDetails';
import Profile from '../user/Profile';
import CommunityRules from '../components/CommunityRules';
import TermsConditions from '../components/TermsConditions';
import VerificationStatusScreen from '../components/verificationStatusScreen';
import MyBookings from '../user/MyBookings';
import FoodMenuScreen from '../user/FoodMenu';
import NoBookingProfileScreen from '../components/NoBookingScreens/NoBookingProfileScreen';
import BookingSuccessScreen from '../components/Payments/BookingSuccessScreen';
import PaymentFailedScreen from '../components/Payments/PaymentFailedScreen';
import BookingDetailsScreen from '../user/BookingDetailsScreen';
import PaymentHistoryScreen from '../user/PaymentsScreen';
import GatepassScreen from '../user/GatePassScreen';
import EditProfileScreen from '../user/EditProfileScreen';
import AboutUsScreen from '../components/AboutUsScreen';
import NotificationListScreen from '../components/notificationIcon';
import Myvisit from '../components/Myvisit';
import GuestVisit from '../components/GuestVisit';

const Tab = createBottomTabNavigator();

export default function BottomTabs({ hasBooking }) {
  const insets = useSafeAreaInsets(); // agar use kar rahe ho toh rakho

  const { user } = useAuth();
const token = user?.token;

const [hasBookingState, setHasBookingState] = useState(hasBooking);

useEffect(() => {
  if (!token) return;

  const checkBooking = async () => {
    try {
      const res = await axios.get(
        "https://staging.cocoliving.in/api/book-room/getUserBookings?page=1&limit=5",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const bookings = res.data?.bookings || [];

      const approvedBooking = bookings.find((b) => {
        const status = b.displayStatus?.toLowerCase();
        return ["approved", "active"].includes(status);
      });

      setHasBookingState(!!approvedBooking);

    } catch (err) {
      console.log("BottomTabs booking check failed");
    }
  };

  checkBooking();

}, [token]);

  return (
    <Tab.Navigator
      initialRouteName="Center"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#4B3426",
        tabBarInactiveTintColor: "#AFAFAF",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: -4,
        },
        tabBarStyle: {
          height: 65 + (insets?.bottom || 0),
          paddingBottom: insets?.bottom || 0,
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 15,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
      }}
    >
      <Tab.Screen
        name="Rooms"
        component={BrowsePropertiesScreen}
        options={{
          tabBarLabel: "Room",
          tabBarIcon: ({ color }) => <Ionicons name="bed-outline" size={23} color={color} />,
        }}
      />

      {hasBookingState && (
        <Tab.Screen
          name="Events"
          component={EventsScreen}
          options={{
            tabBarLabel: "Events",
            tabBarIcon: ({ color }) => <Ionicons name="star-outline" size={23} color={color} />,
          }}
        />
      )}

   
  <Tab.Screen
  key={hasBookingState ? "booking" : "nobooking"}
  name="Center"
  component={hasBookingState ? DashboardScreen : FindStayScreen}
  options={{
    tabBarLabel: "",
    tabBarIcon: () => (
      <View style={styles.centerIconWrapper}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.centerIcon}
        />
      </View>
    ),
  }}
/>


      {hasBookingState && (
        <Tab.Screen
          name="Logs"
          component={AccessHistory}
          options={{
            tabBarLabel: "Logs",
            tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={23} color={color} />,
          }}
        />
      )}

      <Tab.Screen
        name="Support"
        component={SupportScreen}
        options={{
          tabBarLabel: "Support",
          tabBarIcon: ({ color }) => <Ionicons name="headset-outline" size={23} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  centerIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#4B3426",
    justifyContent: "center",
    alignItems: "center",
    // elevation + shadow for floating feel
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 4,
    borderColor: "#fff", // white ring like in screenshot
  },
  centerIcon: {
    width: 42,
    height: 42,
    resizeMode: "contain",
  },
});