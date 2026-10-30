import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, SafeAreaView, StatusBar, Platform } from "react-native";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* <StatusBar barStyle="dark-content" backgroundColor="white" /> */}
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: true, headerTitle: "Current Location" }}
        />
      </Stack>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f8fc",
    // paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});
