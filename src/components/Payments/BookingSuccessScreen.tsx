import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const BookingSuccessScreen = ({ route, navigation }) => {
  const {
    amountPaid,
    transactionId,
    roomType,
    checkInDate,
    duration,
    userEmail,
    userPhone,
  } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Success Icon */}
          <Ionicons name="checkmark-circle" size={90} color="#2ECC71" />

          {/* Title */}
          <Text style={styles.title}>Payment Successful 🎉</Text>
          <Text style={styles.subtitle}>Your booking has been confirmed</Text>

          {/* Payment Details */}
          <View style={styles.card}>
            <Row label="Amount Paid" value={`₹ ${amountPaid?.toLocaleString()}`} />
            <Row label="Transaction ID" value={transactionId} />
            <Row label="Status" value="SUCCESS" highlight />
          </View>

          {/* Booking Details */}
          <View style={styles.card}>
            <Row label="Room Type" value={roomType} />
            <Row label="Check-in Date" value={checkInDate} />
            <Row label="Duration" value={duration} />
          </View>

          {/* Email / Phone Note */}
          <View style={styles.emailBox}>
            <Text style={styles.emailText}>
              Booking details have been sent to{"\n"}
              <Text style={{ fontWeight: "700" }}>
                {userPhone} | {userEmail}
              </Text>
            </Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.primaryBtnText}>Go to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("Bookings")}
          >
            <Text style={styles.secondaryBtnText}>View My Bookings</Text>
            <Ionicons name="arrow-forward" size={20} color="#3C2A1E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("Amenities")}
          >
            <Text style={styles.secondaryBtnText}>Explore Amenities</Text>
            <Ionicons name="arrow-forward" size={20} color="#3C2A1E" />
          </TouchableOpacity>
        </View>

        <Text style={styles.helpText}>
          Need help? <Text style={{ fontWeight: "bold" }}>Contact support</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const Row = ({ label, value, highlight }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, highlight && { color: "green", fontWeight: "800" }]}>
      {value}
    </Text>
  </View>
);

export default BookingSuccessScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1, padding: 22 },
  content: { alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#3C2A1E", marginTop: 20 },
  subtitle: { fontSize: 14, color: "#7D6C54", marginBottom: 20, marginTop: 6 },
  card: {
    width: "100%",
    backgroundColor: "#F6EFE6",
    borderRadius: 12,
    padding: 15,
    marginTop: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "#E5D8C3",
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  label: { color: "#3C2A1E", fontSize: 14 },
  value: { fontSize: 14, fontWeight: "700", color: "#3C2A1E" },
  emailBox: {
    marginTop: 20,
    backgroundColor: "#EADCC8",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  emailText: { fontSize: 13, color: "#5C4C3A", textAlign: "center", lineHeight: 18 },
  primaryBtn: {
    backgroundColor: "#3C2A1E",
    width: "100%",
    borderRadius: 10,
    padding: 16,
    marginTop: 30,
  },
  primaryBtnText: { textAlign: "center", color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F4F0",
    width: "100%",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600", color: "#3C2A1E" },
  helpText: { textAlign: "center", paddingVertical: 25, color: "#7D6C54" },
});
