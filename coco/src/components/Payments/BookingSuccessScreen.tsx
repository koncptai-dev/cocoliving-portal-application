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

  const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Success Icon */}
          <Ionicons name="checkmark-circle" size={90} color="#2ECC71" />

          {/* Title */}
          <Text style={styles.title}>Payment Successful 🎉</Text>
          <Text style={styles.subtitle}>Thanku! Your Payment was successfully processed</Text>

          {/* Payment Details */}
          <View style={styles.card}>
            <Row label="Amount Paid" value={`₹ ${amountPaid?.toLocaleString()}`} />
            <Row label="Transaction ID" value={transactionId} />
            <Row label="Status" value="SUCCESS" highlight />
          </View>

          {/* Booking Details */}
          <View style={styles.card}>
            <Row label="Room Type" value={roomType} />
          <Row label="Check-in Date" value={formatDate(checkInDate)} />
           <Row label="Duration" value={`${duration} month${duration > 1 ? "s" : ""}`} />
          </View>

          {/* Email / Phone Note */}
          <View style={styles.emailBox}>
            <Text style={styles.emailText}>
              Booking details have been sent to{"\n"}
              <Text style={{ fontFamily:'Quicksand-Bold', }}>
               {userEmail}
              </Text>
            </Text>
          </View>

          {/* Buttons */}
          {/* Buttons Container */}
<View style={styles.buttonContainer}>

  <TouchableOpacity
    style={styles.secondaryBtn}
    onPress={() => navigation.navigate("HomeTabs")}
  >
    <Text style={styles.secondaryBtnText}>Go to Home</Text>
    <Ionicons name="arrow-forward" size={20} color="#3C2A1E" />
  </TouchableOpacity>

  {/* <TouchableOpacity
    style={styles.secondaryBtn}
    onPress={() => navigation.navigate("MyBookings")}
  >
    <Text style={styles.secondaryBtnText}>View My Bookings</Text>
    <Ionicons name="arrow-forward" size={20} color="#3C2A1E" />
  </TouchableOpacity> */}

  {/* <TouchableOpacity
    style={styles.secondaryBtn}
    onPress={() => navigation.navigate("Amenities")}
  >
    <Text style={styles.secondaryBtnText}>Explore Amenities</Text>
    <Ionicons name="arrow-forward" size={20} color="#3C2A1E" />
  </TouchableOpacity> */}

</View>
        </View>

        <TouchableOpacity onPress={()=>navigation.navigate("Support")}>
          <Text style={styles.helpText}>
          Need help? <Text style={{ fontFamily:'Quicksand-Bold' }}>Contact support</Text>
        </Text>
        </TouchableOpacity>
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
content: {
  alignItems: "center",
  paddingTop: 40
},
scrollContent: {
  flexGrow: 1,
  padding: 22,
  paddingBottom: 40
},
 
  title: { fontSize: 24, fontFamily:'Quicksand-Bold', color: "#4f3421", marginTop: 20 },
  subtitle: { fontSize: 14, color: "#8c8c8c",fontFamily:'Quicksand-Regular', marginBottom: 20 },
  card: {
    width: "100%",
    backgroundColor: "#FFF",
    // borderRadius: 12,
    elevation:6,
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
  label: { color: "#000000", fontSize: 14,fontFamily:'Quicksand-Regular' },
  value: { fontSize: 14, fontFamily:'Quicksand-Bold', color: "#000000" },
  emailBox: {
    marginTop: 20,
    backgroundColor: "#ede7df",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  emailText: { fontSize: 13, color: "#5C4C3A", textAlign: "center", lineHeight: 18,fontFamily:'Quicksand-Regular' },
  buttonContainer: {
  width: "100%",
  marginTop: 25,
  backgroundColor: "#ede7df",
  borderRadius: 14,
  padding: 14,

  // Android
  elevation: 6,

  // iOS
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
},


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
  secondaryBtnText: { fontSize: 15, fontFamily:'Quicksand-Medium', color: "#3C2A1E" },
  helpText: { textAlign: "center", paddingVertical: 25, color: "#7D6C54",fontFamily:'Quicksand-Medium' },
});
