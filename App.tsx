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

// User Screens
import DashboardScreen from './src/user/dashboard';
import Profile from './src/user/Profile';
import MyBookings from './src/user/MyBookings';
import Payments from './src/user/Payments';
import AccessHistory from './src/user/AccessHistory';
import Support from './src/user/Support';
import EventsScreen from './src/user/Events';
import FoodMenuScreen from './src/user/FoodMenu';
import BrowsePropertiesScreen from './src/user/BrowsePropertiesScreen';
import PropertyDetailsScreen from './src/user/PropertyDetailsScreen';
import RoomDetailsScreen from './src/user/RoomDetailsScreen';
import SelectYourBedScreen from './src/user/SelectYourBedScreen';
import PayableAmountScreen from './src/user/PayableAmountScreen';
import FindStayScreen from './src/components/Dashboard/FindStayScreen';
import EventDetailsScreen from './src/components/Events/eventsDetails';
import RaiseComplaint from './src/components/Support/RaiseComplaint';
import ComplaintStatus from './src/components/Support/ComplaintStatus';
import ComplaintHistory from './src/components/Support/ComplaintHistory';
import ProfileScreen from './src/components/ProfileScreen';
import CommunityRules from './src/components/CommunityRules';
import TermsConditions from './src/components/TermsConditions';
import VerificationStatusScreen from './src/components/verificationStatusScreen';
import NoBookingProfileScreen from './src/components/NoBookingScreens/NoBookingProfileScreen';
const Stack = createNativeStackNavigator();
const API_BASE_URL = 'https://staging.cocoliving.in';

// ---------------------------------------------------------
//               APP NAVIGATOR (REPLACES DRAWER)
// ---------------------------------------------------------

const AppNavigator = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);

  const checkBookingStatus = async () => {
    if (!token) {
      setLoadingInitial(false);
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/book-room/getUserBookings?page=1&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bookings = response?.data?.bookings || [];

      const active = bookings.find(
        (b: any) =>
          b.displayStatus?.toLowerCase() === "active" ||
          b.displayStatus?.toLowerCase() === "approved"
      );

      setHasActiveBooking(!!active);
    } catch (error) {
      console.log("Booking check error:", error);
      setHasActiveBooking(false);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    if (user) checkBookingStatus();
    else setLoadingInitial(false);
  }, [user]);

  if (user && loadingInitial) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading App...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          {/* MAIN NAVIGATION NOW HANDLED BY BOTTOM TABS */}
         <Stack.Screen name="HomeTabs">
  {(props) => (
    <BottomTabs 
      key={hasActiveBooking ? "booked" : "notBooked"}  
      {...props} 
      hasBooking={hasActiveBooking} 
    />
  )}
</Stack.Screen>

          {/* ALL OTHER SCREENS */}
          <Stack.Screen name="RaiseComplaint" component={RaiseComplaint} />
          <Stack.Screen name="ComplaintStatus" component={ComplaintStatus} />
          <Stack.Screen name="ComplaintHistory" component={ComplaintHistory} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
          <Stack.Screen name="RoomDetails" component={RoomDetailsScreen} />
          <Stack.Screen name="SelectYourBed" component={SelectYourBedScreen} />
          <Stack.Screen name="PayableAmountScreen" component={PayableAmountScreen} />
          <Stack.Screen name="Support" component={Support} />
          <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="CommunityRules" component={CommunityRules} />
          <Stack.Screen name="TermsConditions" component={TermsConditions} />
          <Stack.Screen name="VerificationStatus" component={VerificationStatusScreen} />
          <Stack.Screen name="MyBookings" component={MyBookings}/>
          <Stack.Screen name="FoodMenu" component={FoodMenuScreen}/>
          <Stack.Screen name="NoProfileScreen" component={NoBookingProfileScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

// ---------------------------------------------------------
//                       MAIN APP
// ---------------------------------------------------------

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SafeAreaProvider> {/* ✅ Provider अब सबसे बाहर है – splash के time भी active रहेगा */}
      {showSplash ? (
        <AnimatedSplash onFinish={() => setShowSplash(false)} />
      ) : (
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      )}

      {/* Toast हमेशा top level पर रहेगा, splash के बाद भी visible */}
      <Toast />
    </SafeAreaProvider>
  );
};

export default App;
