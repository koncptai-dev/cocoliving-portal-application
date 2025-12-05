import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Import all necessary pages
import Login from '../pages/login'; 
import Register from '../pages/Register'; // Using Register as the filename for Signup
import ForgotPassword from '../pages/forgotPassword';
import SignupVerificationScreen from '../pages/signupVerification';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false, // Hide the default header so AuthHeader component can be used
      }}
    >
      {/* Screens that share the custom image/logo header */}
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Register} /> 
       <Stack.Screen name="SignupVerification" component={SignupVerificationScreen} /> 
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    </Stack.Navigator>
  );
};

export default AuthStack;
