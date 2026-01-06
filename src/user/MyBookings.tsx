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

const API_BASE_URL = "https://staging.cocoliving.in";

const MyBookings = ({ navigation }) => {
  const { user } = useAuth();
  const token = user?.token;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchBookings();
  }, [token]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/book-room/getUserBookings?page=1&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(res.data.bookings || []);
    } catch (e) {
      console.log("Booking fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();

  // 🔒 CURRENT STAY (UNCHANGED LOGIC)
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

  const otherBookings = bookings.filter((b) => b !== currentBooking);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#C97B63" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F3EC" }}>
      <HeaderGradient title="My Bookings" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Your stays, beautifully organised ✨
        </Text>

        {/* ===== CURRENT STAY ===== */}
        {currentBooking && (
          <>
            <Text style={styles.sectionTitle}>Current Stay</Text>

            <View style={styles.currentCard}>
              <Text style={styles.propertyName}>
                {currentBooking.rateCard?.property?.name}
              </Text>

              <Text style={styles.roomType}>
                {currentBooking.roomType} Room
              </Text>

              <View style={styles.row}>
                <Info
                  icon="calendar-outline"
                  label="Check-in"
                  value={formatDate(currentBooking.checkInDate)}
                />
                <Info
                  icon="calendar-clear-outline"
                  label="Check-out"
                  value={formatDate(currentBooking.checkOutDate)}
                />
              </View>

              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>ACTIVE</Text>
              </View>
            </View>
          </>
        )}

        {/* ===== ALL BOOKINGS ===== */}
        <Text style={styles.sectionTitle}>All Bookings</Text>

        {otherBookings.map((b, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.85}
            style={styles.card}
            onPress={() =>
              navigation.navigate("BookingDetails", { booking: b })
            }
          >
            <Text style={styles.propertyName}>
              {b.rateCard?.property?.name}
            </Text>

            <Text style={styles.address}>
              {b.rateCard?.property?.address}
            </Text>

            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                {b.roomType} • {b.bookingType}
              </Text>

              <View
                style={[
                  styles.badge,
                  badgeColor(b.displayStatus),
                ]}
              >
                <Text style={styles.badgeText}>
                  {b.displayStatus?.toUpperCase()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

/* ===== HELPERS ===== */

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN") : "--";

const badgeColor = (status = "") => {
  switch (status.toLowerCase()) {
    case "approved":
      return { backgroundColor: "#DFF3E4" };
    case "upcoming":
      return { backgroundColor: "#FFF3CD" };
    case "pending":
      return { backgroundColor: "#E3F2FD" };
    default:
      return { backgroundColor: "#EEE" };
  }
};

const Info = ({ icon, label, value }) => (
  <View style={styles.info}>
    <Ionicons name={icon} size={16} color="#5C4435" />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

/* ===== STYLES ===== */

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  subtitle: {
    textAlign: "center",
    marginTop: 12,
    fontFamily: "Quicksand-Medium",
    color: "#6B5A4A",
  },

  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 26,
    marginBottom: 12,
    fontFamily: "Quicksand-Bold",
    fontSize: 20,
    color: "#4B3426",
  },

  currentCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 18,
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50",
  },

  propertyName: {
    fontFamily: "Quicksand-Bold",
    fontSize: 16,
    color: "#4B3426",
  },

  roomType: {
    fontFamily: "Quicksand-SemiBold",
    fontSize: 15,
    marginTop: 4,
    color: "#6B4E3D",
  },

  address: {
    fontFamily: "Quicksand-Medium",
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  info: { width: "48%" },

  infoLabel: {
    fontSize: 11,
    fontFamily: "Quicksand-Medium",
    color: "#777",
  },

  infoValue: {
    fontFamily: "Quicksand-SemiBold",
    fontSize: 13,
    marginTop: 2,
  },

  activeBadge: {
    backgroundColor: "#DFF3E4",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 14,
  },

  activeText: {
    color: "#2E7D32",
    fontFamily: "Quicksand-Bold",
    fontSize: 12,
  },

  card: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  meta: {
    fontFamily: "Quicksand-Medium",
    fontSize: 13,
    color: "#555",
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },

  badgeText: {
    fontFamily: "Quicksand-Bold",
    fontSize: 11,
    color: "#4B3426",
  },
});

export default MyBookings;
