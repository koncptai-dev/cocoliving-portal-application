import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
// Assuming you have these files setup correctly:
import './global.css'; 
import { CustomDrawerContent } from './src/components/CustomDrawerContent';
import AnimatedSplash from './src/components/AnimatedSplash'; 

// Navigators
import AuthStack from './src/navigation/AuthStack'; // Imported Auth Stack

// User/Drawer Screens (Using placeholders since you only provided names)
import DashboardScreen from './src/user/dashboard';
import Profile from './src/user/Profile';
import MyBookings from './src/user/MyBookings';
import Payments from './src/user/Payments';
import AccessHistory from './src/user/AccessHistory';
import Support from './src/user/Support';
import Events from './src/user/Events';
import BrowseRooms from './src/user/BrowseRooms';
import RaiseComplaint from './src/components/Support/RaiseComplaint';
import ComplaintStatus from './src/components/Support/ComplaintStatus';
import ComplaintHistory from './src/components/Support/ComplaintHistory';
import ProfileScreen from './src/components/ProfileScreen';
import BrowsePropertiesScreen from './src/user/BrowsePropertiesScreen';
import PropertyDetailsScreen from './src/user/PropertyDetailsScreen';
import RoomDetailsScreen from './src/user/RoomDetailsScreen';
import SelectYourBedScreen from './src/user/SelectYourBedScreen';
import PayableAmountScreen from './src/user/PayableAmountScreen';
import BookingSuccessScreen from './src/components/Payments/BookingSuccessScreen';
import PaymentFailedScreen from './src/components/Payments/PaymentFailedScreen';
import PaymentWebViewScreen from './src/components/Payments/PaymentWebViewScreen';
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Placeholder for the Main App's Drawer Navigation
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="DashboardScreen"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerStyle: { width: 250 },
      }}
    >
      <Drawer.Screen name="DashboardScreen" component={DashboardScreen} />
      <Drawer.Screen name="Profile" component={Profile} />
     <Drawer.Screen name="BrowseProperties" component={BrowsePropertiesScreen} />
      <Drawer.Screen name="MyBookings" component={MyBookings} />
      <Drawer.Screen name="Payments" component={Payments} />
      <Drawer.Screen name="AccessHistory" component={AccessHistory} />
      <Drawer.Screen name="Support" component={Support} />
      <Drawer.Screen name="Events" component={Events} />
    </Drawer.Navigator>
  );
};

// Main App Navigator (Switch between Auth and Main App)
const AppNavigator = () => {
  const { user } = useAuth(); // Get user state from context

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Drawer" component={DrawerNavigator} />
          
      
          <Stack.Screen name="RaiseComplaint" component={RaiseComplaint} />
          {/* <Stack.Screen name="FindStay" component={FindStayScreen} />  */}
          <Stack.Screen name="ComplaintStatus" component={ComplaintStatus} />
          <Stack.Screen name="ComplaintHistory" component={ComplaintHistory} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen}/>
          <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
          <Stack.Screen name="RoomDetails" component={RoomDetailsScreen} />
          <Stack.Screen name="SelectYourBed" component={SelectYourBedScreen} /> 
          <Stack.Screen name="PayableAmountScreen" component={PayableAmountScreen}/>
          <Stack.Screen name="BookingSuccessScreen" component={BookingSuccessScreen}/>
          <Stack.Screen name="PaymentFailedScreen" component={PaymentFailedScreen}/>
          <Stack.Screen name="PaymentWebViewScreen" component={PaymentWebViewScreen}/>
           <Stack.Screen name="Support" component={Support}/>
          
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    // Ensure AnimatedSplash is fully implemented to avoid blocking the app
    return <AnimatedSplash onFinish={handleSplashFinish} />;
  }
  
  return (
        // ❌ Try: Toast ko SafeAreaProvider ke bahar nikalo
        <>
            <SafeAreaProvider>
                <AuthProvider>
                    <NavigationContainer>
                        <AppNavigator />
                    </NavigationContainer>
                </AuthProvider>
            </SafeAreaProvider>
            
            {/* 🟢 Is position par Toast hamesha sabke upar dikhega */}
            <Toast /> 
        </>
  );
};

export default App;
