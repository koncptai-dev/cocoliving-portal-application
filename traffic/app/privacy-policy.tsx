import React from "react";
import { Text, StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LegalScreen from "./LegalScreen";

const PrivacyPolicy = () => {
  const isDark = useColorScheme() === "dark";

  return (
    <SafeAreaView style={styles.container}>
      <LegalScreen title="Privacy Policy">

        <Text style={[styles.text, isDark && styles.darkText]}>
          Effective Date: 25/12/2025
        </Text>
        <Text style={[styles.heading, isDark && styles.darkText]}>
          1. Information We Collect
        </Text>
        <Text style={[styles.text, isDark && styles.darkText]}>
          We collect user details, GPS location, and usage data for duty tracking.
        </Text>

        <Text style={[styles.heading, isDark && styles.darkText]}>
          2. Data Usage
        </Text>
        <Text style={[styles.text, isDark && styles.darkText]}>
          Data is used for attendance verification, monitoring, and app improvement.
        </Text>

        <Text style={[styles.heading, isDark && styles.darkText]}>
          3. Location
        </Text>
        <Text style={[styles.text, isDark && styles.darkText]}>
          Location is used only during duty. We do not track users outside duty.
        </Text>

        <Text style={[styles.heading, isDark && styles.darkText]}>
          4. Contact
        </Text>
        <Text style={[styles.text, isDark && styles.darkText]}>
          contact@praman.info
        </Text>
        <Text style={[styles.text, isDark && styles.darkText]}>
          dcp-admntraffic-ahd@gujarat.gov.in
        </Text>

      </LegalScreen>
    </SafeAreaView>
  );
};

export default PrivacyPolicy;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
    color: "#000",
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    color: "#000",
  },
  darkText: {
    color: "#fff",
  },
});