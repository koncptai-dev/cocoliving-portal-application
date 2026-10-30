import React from "react";
import { Text, StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LegalScreen from "./LegalScreen";

const TermsConditions = () => {
  const isDark = useColorScheme() === "dark";

  return (
    <SafeAreaView style={styles.container}>
      <LegalScreen title="Terms & Conditions">

        <Text style={[styles.text, isDark && styles.darkText]}>
          Effective Date: 25/12/2025
        </Text>
       
        <Text style={[styles.heading, isDark && styles.darkText]}>
          1. Usage
        </Text>
        <Text style={[styles.text, isDark && styles.darkText]}>
          This app is for authorized personnel only.
        </Text>

        <Text style={[styles.heading, isDark && styles.darkText]}>
          2. Responsibility
        </Text>
        <Text style={[styles.text, isDark && styles.darkText]}>
          Users must use the app responsibly and maintain login security.
        </Text>

        <Text style={[styles.heading, isDark && styles.darkText]}>
          3. GPS Requirement
        </Text>
        <Text style={[styles.text, isDark && styles.darkText]}>
          GPS must be enabled during duty for verification.
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

export default TermsConditions;

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