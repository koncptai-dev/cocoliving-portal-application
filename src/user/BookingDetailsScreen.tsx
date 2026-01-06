import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const BookingDetailsScreen = ({ route }) => {
  const { booking } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Booking Details</Text>

      <Detail label="Property">
        {booking.rateCard?.property?.name}
      </Detail>

      <Detail label="Room Number">
        {booking.room?.roomNumber || "Not assigned"}
      </Detail>

      <Detail label="Room Type">
        {booking.rateCard?.roomType}
      </Detail>

      <Detail label="Check-in Date">
        {booking.checkInDate}
      </Detail>

      <Detail label="Check-out Date">
        {booking.checkOutDate}
      </Detail>

      <Detail label="Duration">
        {booking.duration} months
      </Detail>

      <Detail label="Monthly Rent">
        ₹{booking.rateCard?.rent}
      </Detail>

      <Detail label="Address">
        {booking.rateCard?.property?.address}
      </Detail>

      <Detail label="Status">
        {booking.displayStatus}
      </Detail>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default BookingDetailsScreen;

/* ---------- SMALL COMPONENT ---------- */
const Detail = ({ label, children }) => (
  <View style={styles.detailBlock}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{children}</Text>
  </View>
);

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4b3426",
    marginBottom: 20,
  },

  detailBlock: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    color: "#7A6658",
  },

  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4b3426",
    marginTop: 4,
  },
});
