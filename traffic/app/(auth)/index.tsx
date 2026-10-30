import React, { useEffect } from "react";
import { Image, StyleSheet, View, Text } from "react-native";

import { Colors } from "@/constants/Colors";
import LoginScreen from "@/components/Login/LoginScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth } from "@/libs/authContext";
import { Redirect } from "expo-router";

export default function Home() {
  const { isAuthenticated, userDetails } = useAuth();

  if (isAuthenticated)
    if (userDetails?.role == "admin") return <Redirect href="/(admin)" />;
    else return <Redirect href="/(tabs)/home" />;
  return (
    // <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={styles.container}>
      <LoginScreen />
    </View>
    // </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    padding: 16,
    backgroundColor: Colors.primary.background, // Light background color
  },
});
