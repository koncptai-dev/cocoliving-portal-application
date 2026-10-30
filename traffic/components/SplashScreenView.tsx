import React, { useEffect } from "react";
import { Image, StyleSheet, View, Text } from "react-native";

import { Colors } from "@/constants/Colors";

export default function SplashScreenView() {

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
        />
      </View>
      <View style={{ width: "90%", marginTop: 32 }}>
        <Text style={styles.title}>
          Ahmedabad Traffic Police Attendance System
        </Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary.background, // Light background color
  },
  logoContainer: {
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    borderRadius: "100%",
    padding: 16,
    justifyContent: "center",
  },
  logo: {
    width: 250, // Adjust size as needed
    height: 250,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white", // Dark text color
    textAlign: "center",
  },
});
