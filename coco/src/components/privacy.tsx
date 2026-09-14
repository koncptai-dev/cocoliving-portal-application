import React from "react";

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar backgroundColor="#4B3626" barStyle="light-content" />

      {/* TOP SAFE AREA */}
      <View style={styles.topSafeArea} />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Privacy Policy</Text>
        </View>
      </View>
<ScrollView contentContainerStyle={styles.content}>

  {/* Intro */}
  <View style={styles.whiteCard}>
    <Text style={styles.title}>Privacy Policy</Text>

    <Text style={styles.text}>
      COCO Living is managed by Collab Colony PVT. LTD. We are committed to
      protecting your personal information and ensuring transparency in how
      your data is collected and used.
    </Text>
  </View>

  {/* Info Collection */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>1. Information We Collect</Text>

    <Text style={styles.text}>Information You Provide:</Text>

    <Text style={styles.text}>• Name, Email, Phone Number</Text>
    <Text style={styles.text}>• Gender, Date of Birth</Text>
    <Text style={styles.text}>• Address</Text>
    <Text style={styles.text}>• Parent / Guardian Details</Text>
    <Text style={styles.text}>• College / Profession Details</Text>
    <Text style={styles.text}>• Food Preferences & Allergies</Text>
    <Text style={styles.text}>• Uploaded Documents (Aadhaar, PAN, KYC)</Text>
    <Text style={styles.text}>• Payment information via secure payment gateways</Text>

    <Text style={styles.text}>Third-Party Integrations:</Text>

    <Text style={styles.text}>• KYC verification partners</Text>
    <Text style={styles.text}>• Payment gateways</Text>
    <Text style={styles.text}>• OTP service providers</Text>
  </View>

  {/* Usage */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>

    <Text style={styles.text}>• Create and manage your account</Text>
    <Text style={styles.text}>• Verify identity through KYC</Text>
    <Text style={styles.text}>• Process bookings, payments, and refunds</Text>
    <Text style={styles.text}>• Enable room selection and property access</Text>
    <Text style={styles.text}>• Provide customer support</Text>
    <Text style={styles.text}>• Share food menus and announcements</Text>
    <Text style={styles.text}>• Manage housekeeping, events, and tickets</Text>
    <Text style={styles.text}>• Improve platform performance and user experience</Text>
    <Text style={styles.text}>• Comply with legal requirements</Text>
  </View>

  {/* Sharing */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>3. Sharing Your Information</Text>

    <Text style={styles.text}>
      We may share your information with trusted service providers:
    </Text>

    <Text style={styles.text}>• KYC verification partners</Text>
    <Text style={styles.text}>• Payment providers</Text>
    <Text style={styles.text}>• Cloud hosting services</Text>
    <Text style={styles.text}>• Property management staff</Text>
    <Text style={styles.text}>• Law enforcement if legally required</Text>

    <Text style={styles.text}>
      We never sell your personal information.
    </Text>
  </View>

  {/* Security */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>4. Data Security</Text>

    <Text style={styles.text}>
      We implement industry-standard security practices:
    </Text>

    <Text style={styles.text}>• End-to-end encryption</Text>
    <Text style={styles.text}>• Secure authentication systems</Text>
    <Text style={styles.text}>• Restricted internal access controls</Text>
    <Text style={styles.text}>• Regular security audits</Text>
  </View>

  {/* Rights */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>5. Your Rights</Text>

    <Text style={styles.text}>• Access your personal data</Text>
    <Text style={styles.text}>• Update or modify your profile</Text>
    <Text style={styles.text}>• Request deletion (where legally permitted)</Text>
    <Text style={styles.text}>• Withdraw consent for optional data processing</Text>
  </View>

  {/* Cookies */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>6. Cookies & Tracking</Text>

    <Text style={styles.text}>
      Cookies help improve your browsing experience, manage sessions, and
      enable analytics to enhance our platform.
    </Text>
  </View>

  {/* Updates */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>7. Changes to This Policy</Text>

    <Text style={styles.text}>
      We may update this Privacy Policy occasionally and notify users through
      the platform.
    </Text>
  </View>

  {/* Contact */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>8. Contact Us</Text>

    <Text style={styles.text}>
      For any queries or concerns, please contact us at:
    </Text>

  
<TouchableOpacity
  onPress={() => Linking.openURL("mailto:info@cocoliving.in")}
>
  <Text
    style={[
      styles.text,
      { fontFamily: "Quicksand-Bold", color: "#4B3626" },
    ]}
  >
    info@cocoliving.in
  </Text>
</TouchableOpacity>
  </View>

</ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F2EF",
  },

  topSafeArea: {
    backgroundColor: "#4B3626",
    height: Platform.OS === "android" ? StatusBar.currentHeight : 74,
  },

  headerContainer: {
    backgroundColor: "#4B3626",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 15,
  },

  headerTitle: {
    fontSize: 22,
    fontFamily: "Quicksand-Bold",
    color: "#fff",
  },

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  whiteCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  title: {
    fontSize: 20,
    fontFamily: "Quicksand-Bold",
    marginBottom: 10,
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: "Quicksand-Bold",
    marginBottom: 8,
    color: "#4f3421",
  },

  text: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    lineHeight: 22,
    color: "#444",
    marginBottom: 10,
  },

  footer: {
    backgroundColor: "#4B3626",
    borderRadius: 22,
    padding: 20,
    marginTop: 20,
  },

  footerLogo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },

  footerText: {
    color: "#E5E5E5",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },

  footerCopyright: {
    color: "#CFCFCF",
    fontSize: 12,
    marginTop: 14,
  },
});