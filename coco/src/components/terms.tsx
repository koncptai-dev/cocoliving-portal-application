import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";

const TermsScreen = ({ navigation }) => {
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

          <Text style={styles.headerTitle}>Terms & Conditions</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

  {/* Intro */}
  <View style={styles.whiteCard}>
    <Text style={styles.title}>Terms & Conditions</Text>

    <Text style={styles.text}>
      COCO Living is managed by Collab Colony PVT. LTD.
    </Text>

    <Text style={styles.text}>
      By registering or using COCO Living (“Service”), you agree to these
      Terms & Conditions (“Terms”).
    </Text>
  </View>

  {/* 1. Eligibility */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>1. Eligibility</Text>

    <Text style={styles.text}>• Users must be 15+ years old to register</Text>
    <Text style={styles.text}>
      • Students below 18 must have parental or guardian consent
    </Text>
  </View>

  {/* 2. Account Responsibilities */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>2. Account Responsibilities</Text>

    <Text style={styles.text}>You agree to:</Text>

    <Text style={styles.text}>• Provide accurate information</Text>
    <Text style={styles.text}>• Not share your login credentials</Text>
    <Text style={styles.text}>• Maintain account confidentiality</Text>
    <Text style={styles.text}>• Use the platform responsibly</Text>

    <Text style={styles.text}>
      COCO Living reserves the right to suspend accounts for misuse or
      fraudulent activity.
    </Text>
  </View>

  {/* 3. Booking & Payment */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>3. Booking & Payment</Text>

    <Text style={styles.text}>
      • Booking is confirmed only after payment
    </Text>
    <Text style={styles.text}>
      • Users may pre-book by paying 10% of the total amount
    </Text>
    <Text style={styles.text}>
      • Remaining payment must be completed before check-in
    </Text>
    <Text style={styles.text}>
      • Prices vary depending on property, room type, and availability
    </Text>
  </View>

  {/* 4. Check-In & Stay Rules */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>4. Check-In & Stay Rules</Text>

    <Text style={styles.text}>
      • KYC verification is mandatory before stay
    </Text>
    <Text style={styles.text}>
      • Residents must follow property rules and guidelines
    </Text>
    <Text style={styles.text}>
      • Damage to property items will be chargeable
    </Text>
    <Text style={styles.text}>
      • Unauthorized visitors are not allowed without QR approval
    </Text>
  </View>

  {/* 5. Inventory */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>5. Inventory & Amenities</Text>

    <Text style={styles.text}>
      Room items are recorded under property inventory.
    </Text>
    <Text style={styles.text}>
      Damaged or missing items may be deducted from the security deposit.
    </Text>
  </View>

  {/* 6. Food */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>6. Food Services</Text>

    <Text style={styles.text}>• Menus are updated daily</Text>
    <Text style={styles.text}>
      • Food availability depends on property and selected plan
    </Text>
  </View>

  {/* 7. Support */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>7. Support Tickets</Text>

    <Text style={styles.text}>
      Residents may raise tickets for maintenance issues.
    </Text>
    <Text style={styles.text}>
      Resolution timelines may vary based on severity.
    </Text>
  </View>

  {/* 8. Events */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>8. Events & Activities</Text>

    <Text style={styles.text}>
      Some events may require RSVP confirmation or additional payment.
    </Text>
  </View>

  {/* 9. Payment Gateway */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>9. Payment Gateway & OTP</Text>

    <Text style={styles.text}>
      Payments are processed via third-party payment gateways.
    </Text>
    <Text style={styles.text}>
      COCO Living does not store card or banking information.
    </Text>
  </View>

  {/* 10. Cancellation */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>10. Cancellation & Refund</Text>

    <Text style={styles.text}>
      Please refer to our Refund & Cancellation Policy for complete details.
    </Text>
  </View>

  {/* 11. Termination */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>11. Termination</Text>

    <Text style={styles.text}>COCO Living may terminate user accounts for:</Text>

    <Text style={styles.text}>• Fraudulent activities</Text>
    <Text style={styles.text}>• Policy violations</Text>
    <Text style={styles.text}>• Illegal or unsafe behavior</Text>
  </View>

  {/* 12. Liability */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>12. Limitation of Liability</Text>

    <Text style={styles.text}>
      • COCO Living is not responsible for personal belongings
    </Text>
    <Text style={styles.text}>
      • We are not liable for service interruptions due to technical issues
    </Text>
    <Text style={styles.text}>
      • We are not liable for failures caused by third-party services
    </Text>
  </View>

  {/* 13. Law */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>13. Governing Law</Text>

    <Text style={styles.text}>
      These Terms & Conditions are governed by the laws of India.
    </Text>
  </View>

</ScrollView>
    </SafeAreaView>
  );
};

export default TermsScreen;

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
    fontSize: 20,
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
    color: "#4B3626",
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