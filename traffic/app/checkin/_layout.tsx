import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, SafeAreaView, StatusBar, Platform } from "react-native";
// import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f8fc" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      {children}
    </SafeAreaView>
    // </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f8fc",
    // paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});
