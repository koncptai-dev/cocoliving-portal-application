import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import HeaderGradient from "../components/HeaderGradient";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const API_BASE_URL = "https://staging.cocoliving.in";

const MyBookings = ({ navigation }: any) => {
  const { user } = useAuth();
  const token = user?.token;

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
 

 useFocusEffect(
  useCallback(() => {
    if (token) {
      fetchBookings();
    }
  }, [token])
);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/book-room/getUserBookings?page=1&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBookings(res.data?.bookings || []);
    } catch (e) {
      console.log("Booking fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();

/* UPCOMING BOOKING */
const upcomingBooking = bookings.find((b) => {
  const status = b.displayStatus?.toLowerCase();
  const checkIn = new Date(b.checkInDate);

  return status === "approved" && today < checkIn;
});

/* CURRENT BOOKING */
const currentBooking = bookings.find((b) => {
  const status = b.displayStatus?.toLowerCase();
  const checkIn = new Date(b.checkInDate);
  const checkOut = b.checkOutDate ? new Date(b.checkOutDate) : null;

  return (
    ["approved", "active"].includes(status) &&
    today >= checkIn &&
    (checkOut ? today <= checkOut : true)
  );
});

/* BOOKING TO SHOW */
const bookingToShow = currentBooking || upcomingBooking;
  const pastBookings = bookings.filter((b) => b !== currentBooking);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F3EC" }}>
      <HeaderGradient title="My Bookings" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ===== CURRENT BOOKING ===== */}
        {(currentBooking || upcomingBooking) && (
          <View style={styles.currentWrap}>
            <Text style={styles.currentTitle}>Current Booking</Text>

            <View style={styles.currentCard}>
              <Text style={styles.roomNumber}>
                Room {bookingToShow.room?.roomNumber || "--"}
              </Text>

              <View style={styles.infoGrid}>
                <Info
                  label="Last Payment"
                  value={formatDate(bookingToShow.updatedAt)}
                />
                <Info
                  label="Duration"
                  value={`${bookingToShow.duration} months`}
                />
                <Info
              label={currentBooking ? "Days Left" : "Check-in Date"}
              value={
                currentBooking
                  ? daysLeft(bookingToShow.checkOutDate)
                  : formatDate(bookingToShow.checkInDate)
              }
            />
              </View>

              {/* ACTION BUTTONS */}
<View style={styles.actionRow}>
  {bookingToShow.bookingType === "PREBOOK" &&
    bookingToShow.paymentStatus === "PARTIAL" && bookingToShow.contractStatus==="SIGNED" && (
      <PrimaryBtn
        title="Pay Remaining"
        onPress={() =>
          navigation.navigate("BookingDetails", {
            booking: bookingToShow,
          })
        }
      />
    )}

  {bookingToShow.bookingType === "BOOK" && (
    <PrimaryBtn
      title="Extend Stay"
      onPress={() =>
        navigation.navigate("BookingDetails", {
          booking: bookingToShow,
        })
      }
    />
  )}

  {/* SIGN CONTRACT BUTTON */}
  {bookingToShow?.contractStatus !== "SIGNED" && (
    <PrimaryBtn
      title="Sign Contract"
      onPress={() =>
        navigation.navigate("ContractSign", {
          bookingId: bookingToShow.id,
        })
      }
    />
  )}

  <OutlineBtn
    title="Cancel"
    onPress={() =>
      navigation.navigate("BookingDetails", {
        booking: bookingToShow,
      })
    }
  />
</View>
            </View>
          </View>
        )}

        {/* ===== BOOKING HISTORY ===== */}
        <Text style={styles.historyTitle}>Booking History</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {pastBookings.map((b, i) => (
            <TouchableOpacity
              key={i}
              style={styles.historyCard}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate("BookingDetails", { booking: b })
              }
            >
              <Text style={styles.propertyName}>
                {b.rateCard?.property?.name}
              </Text>

              <Text style={styles.smallText}>
                Room {b.room?.roomNumber || "--"}
              </Text>

              <Text style={styles.smallText}>
                {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
              </Text>

              <View style={[styles.badge, badgeColor(b.displayStatus)]}>
                <Text style={styles.badgeText}>
                  {b.displayStatus?.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

export default MyBookings;

/* ================= COMPONENTS ================= */

const Info = ({ label, value }: any) => (
  <View style={styles.infoBox}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const PrimaryBtn = ({ title, onPress }: any) => (
  <TouchableOpacity style={styles.primaryBtn} onPress={onPress}>
    <Text style={styles.primaryBtnText}>{title}</Text>
  </TouchableOpacity>
);

const OutlineBtn = ({ title, onPress }: any) => (
  <TouchableOpacity style={styles.outlineBtn} onPress={onPress}>
    <Text style={styles.outlineBtnText}>{title}</Text>
  </TouchableOpacity>
);

/* ================= HELPERS ================= */

const formatDate = (d: any) =>
  d ? new Date(d).toLocaleDateString("en-IN") : "--";

const daysLeft = (d: any) => {
  if (!d) return "--";
  const diff = new Date(d).getTime() - new Date().getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
};

const badgeColor = (status = "") => {
  switch (status.toLowerCase()) {
    case "approved":
    case "active":
      return { backgroundColor: "#DFF3E4" };
    case "cancelled":
      return { backgroundColor: "#FDECEA" };
    default:
      return { backgroundColor: "#EEE" };
  }
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  currentWrap: {
    paddingHorizontal: 16,
    marginTop: 10,
  },

  currentTitle: {
    fontSize: 20,
    fontFamily: "Quicksand-Bold",
    color: "#4B3426",
    marginBottom: 12,
  },

  currentCard: {
    backgroundColor: "#FFF",
    borderRadius: 26,
    padding: 18,
  },

  roomNumber: {
    fontSize: 18,
    fontFamily: "Quicksand-Bold",
    color: "#3C2A1E",
    marginBottom: 14,
  },

  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  infoBox: {
    backgroundColor: "#F6F1EA",
    borderRadius: 14,
    padding: 10,
    width: "32%",
    alignItems: "center",
  },

  infoLabel: {
    fontSize: 11,
    color: "#777",
    fontFamily: "Quicksand-Medium",
  },

  infoValue: {
    fontSize: 13,
    fontFamily: "Quicksand-Bold",
    marginTop: 4,
  },

  actionRow: {
    marginTop: 18,
  },

  primaryBtn: {
    backgroundColor: "#F6A452",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 10,
  },

  primaryBtnText: {
    color: "#FFF",
    fontFamily: "Quicksand-Bold",
  },

  outlineBtn: {
    borderWidth: 1,
    borderColor: "#C97B63",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },

  outlineBtnText: {
    color: "#C97B63",
    fontFamily: "Quicksand-Bold",
  },

  historyTitle: {
    marginLeft: 16,
    marginTop: 26,
    marginBottom: 12,
    fontSize: 18,
    fontFamily: "Quicksand-Bold",
  },

  historyCard: {
    width: 240,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginRight: 14,
  },

  propertyName: {
    fontFamily: "Quicksand-Bold",
    fontSize: 15,
  },

  smallText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  badge: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  badgeText: {
    fontSize: 11,
    fontFamily: "Quicksand-Bold",
  },
});
