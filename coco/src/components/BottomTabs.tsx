import React from "react";
import axios from "axios";
import { View, Image, StyleSheet, Platform, Linking } from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context"; // add this import

// Screens
import BrowsePropertiesScreen from "../user/BrowsePropertiesScreen";
import EventsScreen from "../user/Events";
import DashboardScreen from "../user/dashboard";
import FindStayScreen from "./Dashboard/FindStayScreen";
import SupportScreen from "../user/Support";

// Hidden Screens 
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
import NotificationListScreen from './notificationScreen';
import Myvisit from '../components/Myvisit';
import GuestVisit from '../components/GuestVisit';
import Config from "react-native-config";
const Tab = createBottomTabNavigator();
   export const baseURL = Config.API_BASE_URL;

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
        `${baseURL}/api/book-room/getUserBookings?page=1&limit=5`,
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



const openDialer = async () => {
  const phoneNumber = "+918141676967";
  const url = `tel:${phoneNumber}`;

  try {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Toast.show({
        type: "error",
        text1: "Unable to open dialer",
        text2: "Phone dialer is not available",
      });
    }
  } catch (error) {
    console.log("Dialer error:", error);

    Toast.show({
      type: "error",
      text1: "Unable to open dialer",
    });
  }
};



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
    name="Contact"
    component={View}
    options={{
      tabBarLabel: "Contact",
      tabBarIcon: ({ color }) => (
        <Ionicons
          name="call-outline"
          size={23}
          color={color}
        />
      ),
    }}
    listeners={{
      tabPress: (e) => {
        e.preventDefault();
        openDialer();
      },
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