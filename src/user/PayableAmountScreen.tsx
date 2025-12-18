import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";

const BASE_URL = "https://staging.cocoliving.in";

const PayableAmountScreen = ({ route, navigation }) => {
  const { room, property, rent, monthsNumber, isoDate, netPayable, preBookAmount, actionType } =
    route.params;

  const { user} = useAuth();
  const token = user?.token
  const [loading, setLoading] = useState(false);

  // -------------------------
  //  ✅ BOOKING API (NO PAYMENT)
  // -------------------------
  const submitBooking = async () => {
    try {
      setLoading(true);

      const payload = {
        userId: Number(user.id),
        rateCardId: room.rateCardId,
        propertyId: room.propertyId,
        roomType: room.roomType,
        checkInDate: isoDate,
        duration: monthsNumber,
        monthlyRent: rent,
        status: "pending",
        bookingType: actionType === "PreBook" ? "PREBOOK" : "BOOK",
      };

      console.log("📌 Booking Payload:", payload);

      const res = await axios.post(
        `${BASE_URL}/api/book-room/add`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Toast.show({
        type: "success",
        text1: "Booking Submitted",
        text2: "Your booking request has been submitted.",
      });

      navigation.replace("BookingSuccessScreen", {
        roomType: room.roomType,
        checkInDate: isoDate,
        duration: `${monthsNumber} months`,
        amountPaid: finalPayable,
        userEmail: user.email,
        userPhone: user.phone,
      });

    } catch (error) {
      console.log("❌ Booking Error:", error?.response?.data || error);

      Toast.show({
        type: "error",
        text1: "Booking Failed",
        text2: error?.response?.data?.message || "Something went wrong!",
      });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  //  Amount Calculations
  // -------------------------

  const finalPayable = actionType === "PreBook" ? preBookAmount : netPayable;

  const proceedBtnText =
    actionType === "PreBook"
      ? "Proceed To Pre-book"
      : "Proceed To Book";

  const securityDeposit = rent * 2;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={26} color="#3C2A1E" />
      </TouchableOpacity>

      <Text style={styles.heading}>Payable Amount</Text>

      {/* Room Card */}
      <View style={styles.roomCard}>
        <Image
          source={{
            uri:
              room.roomImages?.length > 0
                ? `https://staging.cocoliving.in${room.roomImages[0]}`
                : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600",
          }}
          style={styles.thumb}
        />

        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={styles.roomType}>{room.roomType}</Text>
          <Text style={styles.propertyName}>{property?.name}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={14} color="#7D6C54" />
            <Text style={styles.addressText}>{property?.address}</Text>
          </View>
        </View>
      </View>

      {/* Price Breakdown Box */}
      <View style={styles.box}>
        <Row
          label={`Rent\n₹ ${rent} x ${monthsNumber} months`}
          value={`₹ ${(rent * monthsNumber).toLocaleString()}`}
        />
        <Row
          label={"Security Deposit\n2 months rent"}
          value={`₹ ${securityDeposit.toLocaleString()}`}
        />

        <View style={styles.dashedLine} />

        {actionType === "Book" && (
          <Row label={"Net Payable\nTotal Booking Value"} value={`₹ ${netPayable.toLocaleString()}`} bold />
        )}

        {actionType === "PreBook" && (
          <>
            <Row label={"Total Booking Value"} value={`₹ ${netPayable.toLocaleString()}`} />
            <View style={styles.dashedLine} />
            <Row label={"Pre-Book @ 10%"} value={`₹ ${preBookAmount.toLocaleString()}`} bold />
          </>
        )}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          Booking details will be sent to{"\n"}
          {user.phone} | {user.email}
        </Text>
      </View>

      {/* Policy */}
      <Text style={styles.sectionTitle}>Cancellation Policy</Text>
      <Text style={styles.policyText}>
        • All bookings are non-refundable.{"\n"}
        • Rooms are subject to availability.{"\n"}
        • No changes once confirmed.{"\n"}
        • By proceeding, you agree to the terms.
      </Text>

      {/* Proceed */}
      <TouchableOpacity
        style={styles.proceedBtn}
        onPress={submitBooking}
        disabled={loading}
      >
        <Text style={styles.proceedText}>
          {loading
            ? "Processing..."
            : `${proceedBtnText} ₹ ${finalPayable.toLocaleString()}`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const Row = ({ label, value, bold }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, bold && { fontWeight: "800" }]}>{label}</Text>
    <Text style={[styles.rowValue, bold && { fontWeight: "800" }]}>{value}</Text>
  </View>
);

export default PayableAmountScreen;

// ---------------------------
//  STYLES
// ---------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  backBtn: { width: 34, marginTop: 10, marginBottom: 10 },
  heading: { fontSize: 22, fontWeight: "800", color: "#3C2A1E", marginBottom: 16 },
  roomCard: {
    flexDirection: "row",
    backgroundColor: "#EDE1CF",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
  },
  thumb: { width: 80, height: 80, borderRadius: 10 },
  roomType: { fontSize: 16, fontWeight: "700", color: "#3C2A1E" },
  propertyName: { fontSize: 18, fontWeight: "700", color: "#3C2A1E", marginTop: 2 },
  addressRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  addressText: { fontSize: 13, color: "#7D6C54", marginLeft: 4 },

  box: {
    backgroundColor: "#FFF",
    marginTop: 20,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0CDB1",
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  rowLabel: { fontSize: 12, color: "#3C2A1E" },
  rowValue: { fontSize: 15, color: "#3C2A1E" },
  dashedLine: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: "#BAA789",
    marginBottom: 14,
  },

  infoRow: {
    marginTop: 10,
    backgroundColor: "#EDE1CF",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  infoText: { color: "#7D6C54", fontSize: 12, textAlign: "center", lineHeight: 17 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#3C2A1E", marginTop: 26 },
  policyText: { marginTop: 10, fontSize: 14, lineHeight: 21, color: "#3C2A1E" },

  proceedBtn: {
    backgroundColor: "#3C2A1E",
    borderRadius: 50,
    paddingVertical: 14,
    marginTop: 30,
    marginBottom: 30,
  },
  proceedText: { color: "#fff", textAlign: "center", fontSize: 17, fontWeight: "700" },
});
