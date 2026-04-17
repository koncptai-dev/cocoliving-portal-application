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

const RefundPolicyScreen = ({ navigation }) => {
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

          <Text style={styles.headerTitle}>
            Refund & Cancellation
          </Text>
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.content}>

  {/* Intro */}
  <View style={styles.whiteCard}>
    <Text style={styles.title}>
      Refund & Cancellation Policy
    </Text>

    <Text style={styles.text}>
      This policy outlines the terms for cancellations, refunds, and related
      conditions applicable to bookings made with Coco Living.
    </Text>
  </View>

  {/* Booking Cancellation */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>
      1. Booking Cancellation
    </Text>

    <Text style={styles.text}>
      The pre-booking amount (10%) is non-refundable if cancelled by the user.
    </Text>

    <Text style={styles.text}>
      If full booking payment has been made:
    </Text>

    <Text style={styles.text}>• Cancellation before 15 days of check-in: 80% refund</Text>
    <Text style={styles.text}>• Cancellation 7–14 days before check-in: 50% refund</Text>
    <Text style={styles.text}>• Cancellation within 7 days: 40% refund</Text>
  </View>

  {/* Early Move-Out */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>
      2. Refund for Early Move-Out
    </Text>

    <Text style={styles.text}>
      If a resident vacates the property earlier than the booked stay:
    </Text>

    <Text style={styles.text}>
      Refunds are processed only after room inspection.
    </Text>

    <Text style={styles.text}>
      Deductions may include:
    </Text>

    <Text style={styles.text}>• Damaged inventory items</Text>
    <Text style={styles.text}>• Pending rent</Text>
    <Text style={styles.text}>• Unpaid food or utility charges</Text>
  </View>

  {/* Security Deposit */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>
      3. Security Deposit Refund
    </Text>

    <Text style={styles.text}>
      The security deposit will be refunded within 7–10 working days after
      check-out.
    </Text>

    <Text style={styles.text}>
      The amount will be adjusted against damages or any pending dues.
    </Text>
  </View>

  {/* Payment Charges */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>
      4. Payment Gateway Charges
    </Text>

    <Text style={styles.text}>
      Convenience fees and payment gateway charges are non-refundable.
    </Text>
  </View>

  {/* No Show */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>
      5. No-Show Policy
    </Text>

    <Text style={styles.text}>
      If the resident does not check in on the booking date, the booking will
      be marked as a "No Show".
    </Text>

    <Text style={styles.text}>
      In such cases, no refund will be provided.
    </Text>
  </View>

  {/* Refund Method */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>
      6. Refund Method
    </Text>

    <Text style={styles.text}>
      Refunds will be processed to the original payment method used during
      booking.
    </Text>

    <Text style={styles.text}>
      The process is typically completed within 5–7 working days after approval.
    </Text>
  </View>

  {/* Service Cancellation */}
  <View style={styles.whiteCard}>
    <Text style={styles.sectionTitle}>
      7. Service Cancellation by Coco Living
    </Text>

    <Text style={styles.text}>
      In rare circumstances where Coco Living cancels a booking due to
      operational issues or property unavailability, the resident will receive
      a full (100%) refund.
    </Text>
  </View>

</ScrollView>
    </SafeAreaView>
  );
};

export default RefundPolicyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F2EF",
  },

  /* ✅ TOP SAFE AREA (fix white issue) */
  topSafeArea: {
    backgroundColor: "#4B3626",
    height: Platform.OS === "android" ? StatusBar.currentHeight : 74,
  },

  /* ✅ CURVED HEADER */
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

  /* ✅ CONTENT */
  content: {
    padding: 16,
    paddingBottom: 30,
  },

  /* ✅ CARDS (with shadow) */
  whiteCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,

    elevation: 4, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  /* ✅ TITLES */
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

  /* ✅ TEXT */
  text: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    lineHeight: 22,
    color: "#444",
    marginBottom: 10,
  },

  /* ✅ FOOTER */
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


/* SAME STYLES AS BEFORE */