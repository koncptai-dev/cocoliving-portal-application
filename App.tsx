import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { View, Text } from 'react-native';

import './global.css';
import AnimatedSplash from './src/components/AnimatedSplash';

// Auth / Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Navigation
import AuthStack from './src/navigation/AuthStack';
import BottomTabs from './src/components/BottomTabs';

// Screens (only detail / non-tab screens here)
import RaiseComplaint from './src/components/Support/RaiseComplaint';
import ComplaintStatus from './src/components/Support/ComplaintStatus';
import ComplaintHistory from './src/components/Support/ComplaintHistory';
import ProfileScreen from './src/components/ProfileScreen';
import PropertyDetailsScreen from './src/user/PropertyDetailsScreen';
import RoomDetailsScreen from './src/user/RoomDetailsScreen';
import SelectYourBedScreen from './src/user/SelectYourBedScreen';
import PayableAmountScreen from './src/user/PayableAmountScreen';
import EventDetailsScreen from './src/components/Events/eventsDetails';
import Profile from './src/user/Profile';
import CommunityRules from './src/components/CommunityRules';
import TermsConditions from './src/components/TermsConditions';
import VerificationStatusScreen from './src/components/verificationStatusScreen';
import MyBookings from './src/user/MyBookings';
import FoodMenuScreen from './src/user/FoodMenu';
import NoBookingProfileScreen from './src/components/NoBookingScreens/NoBookingProfileScreen';
import BookingSuccessScreen from './src/components/Payments/BookingSuccessScreen';
import PaymentFailedScreen from './src/components/Payments/PaymentFailedScreen';
import BookingDetailsScreen from './src/user/BookingDetailsScreen';
import PaymentHistoryScreen from './src/user/PaymentsScreen';
import GatepassScreen from './src/user/GatePassScreen';
import EditProfileScreen from './src/user/EditProfileScreen';
import AboutUsScreen from './src/components/AboutUsScreen';
import NotificationListScreen from './src/components/notificationIcon';
import Myvisit from './src/components/Myvisit';
import GuestVisit from './src/components/GuestVisit';
import VideoSplash from './src/components/AnimatedSplash';
import ContractSignScreen from './src/components/contactsign';
import {
  requestNotificationPermission,
  createNotificationChannel,
  getFcmToken,
  listenForegroundNotifications,
  listenNotificationOpen,
  listenForegroundClick
} from './src/user/notificationservice';
import SupportScreen from './src/user/Support';
import { navigationRef } from './src/user/NavigationService';

const Stack = createNativeStackNavigator();
const API_BASE_URL = 'https://staging.cocoliving.in';

// ---------------------------------------------------------
// APP NAVIGATOR
// ---------------------------------------------------------
const AppNavigator = () => {
  const { user, authLoading } = useAuth();
  const token = user?.token;

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);

  useEffect(() => {

  if (!user) {
    setLoadingInitial(false);
    return;
  }

  const checkBookingStatus = async () => {
    try {

      const response = await axios.get(
        `${API_BASE_URL}/api/book-room/getUserBookings?page=1&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bookings = response?.data?.bookings || [];

      const active = bookings.find((b) => {
        const status = b.displayStatus?.toLowerCase();
        return status === "active" || status === "approved";
      });

      setHasActiveBooking(!!active);

    } catch (error) {
      console.log("Booking check error:", error);
    } finally {
      setLoadingInitial(false);
    }
  };

  checkBookingStatus();

  // 🔥 every 5 sec re-check
  const interval = setInterval(checkBookingStatus, 5000);

  return () => clearInterval(interval);

}, [user, token]);

  // Show splash while auth is restoring
  if (authLoading) {
    return null;
  }

  // Show loader while checking booking status
  if (user && loadingInitial) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading App...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          {/* Main bottom tabs – visible on all logged-in screens */}
          <Stack.Screen name="HomeTabs">
            {(props) => (
              <BottomTabs
                key={hasActiveBooking ? 'booked' : 'notBooked'}
                {...props}
                hasBooking={hasActiveBooking}
              />
            )}
          </Stack.Screen>

          {/* All other screens – bottom tab bar will remain visible */}
          <Stack.Screen name="RaiseComplaint" component={RaiseComplaint} />
          <Stack.Screen name="ComplaintStatus" component={ComplaintStatus} />
          <Stack.Screen name="ComplaintHistory" component={ComplaintHistory} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
          <Stack.Screen name="RoomDetails" component={RoomDetailsScreen} />
          <Stack.Screen name="SelectYourBed" component={SelectYourBedScreen} />
          <Stack.Screen name="PayableAmountScreen" component={PayableAmountScreen} />
          <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="CommunityRules" component={CommunityRules} />
          <Stack.Screen name="TermsConditions" component={TermsConditions} />
          <Stack.Screen name="VerificationStatus" component={VerificationStatusScreen} />
          <Stack.Screen name="MyBookings" component={MyBookings} />
          <Stack.Screen name="FoodMenu" component={FoodMenuScreen} />
          <Stack.Screen name="NoProfileScreen" component={NoBookingProfileScreen} />
          <Stack.Screen name="BookingSuccessScreen" component={BookingSuccessScreen} />
          <Stack.Screen name="PaymentFailedScreen" component={PaymentFailedScreen} />
          <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
          <Stack.Screen name="PaymentScreen" component={PaymentHistoryScreen} />
          <Stack.Screen name="GatePassScreen" component={GatepassScreen} />
          <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
          <Stack.Screen name="AboutUsScreen" component={AboutUsScreen} />
          <Stack.Screen name="notificationListScreen" component={NotificationListScreen} />
          <Stack.Screen name="myVisit" component={Myvisit} />
          <Stack.Screen name="GuestVisit" component={GuestVisit} />
          <Stack.Screen name="Support" component ={SupportScreen}/>
          <Stack.Screen name="ContractSign" component={ContractSignScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

// ---------------------------------------------------------
// MAIN APP
// ---------------------------------------------------------
const App = () => {
  const [showSplash, setShowSplash] = useState(true);

useEffect(() => {
  createNotificationChannel();

  const unsubscribe = listenForegroundNotifications();

  listenNotificationOpen();  
  listenForegroundClick();    

  return unsubscribe;
}, []);

  return (
    <View style={{ flex: 1 }}>

      {/* MAIN APP ALWAYS MOUNTED */}
      <SafeAreaProvider>
        <AuthProvider>
        <NavigationContainer ref={navigationRef}>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
        <Toast />
      </SafeAreaProvider>

      {/* SPLASH OVERLAY */}
      {showSplash && (
        <VideoSplash onFinish={() => setShowSplash(false)} />
      )}

    </View>
  );
};

export default App;