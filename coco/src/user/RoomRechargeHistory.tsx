import React, { useEffect, useState,useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";


//import { useNavigation } from "@react-navigation/native";
import Config from "react-native-config";
import { useAuth } from "../context/AuthContext";

const BASE_URL = Config.API_BASE_URL;

const RoomRechargeHistoryScreen = () => {
  const navigation: any = useNavigation();

  const { user } = useAuth();
  const token = user?.token;
const loginAs = user?.loginAs || "student";
const isParentLogin = loginAs === "parent";
  const [loading, setLoading] = useState(true);
  const [recharges, setRecharges] = useState<any[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [booking, setBooking] = useState<any>(null);
  const [roomId, setRoomId] = useState<number | null>(null);

  // useEffect(() => {
  //   fetchRechargeHistory();
  // }, []);


  useFocusEffect(
  useCallback(() => {
    fetchRechargeHistory();
  }, [])
);

  const fetchRechargeHistory = async () => {
    try {
      setLoading(true);

      // ================= FETCH BOOKINGS =================
      const bookingRes = await axios.get(
        `${BASE_URL}/api/book-room/getUserBookings?page=1&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const bookings = bookingRes?.data?.bookings || [];

      console.log("FULL BOOKINGS 👉", bookings);

      // FIND ACTIVE / APPROVED BOOKING
      const matchedBooking = bookings.find(
        (b: any) =>
          b?.displayStatus?.toLowerCase() === "active" ||
          b?.displayStatus?.toLowerCase() === "approved"
      );

      console.log("MATCHED BOOKING 👉", matchedBooking);

      if (!matchedBooking) {
        console.log("No active booking found");
        setLoading(false);
        return;
      }

      setBooking(matchedBooking);

      // ================= ROOM ID =================
      const fetchedRoomId =
        matchedBooking?.roomId ||
        matchedBooking?.room?.id ||
        matchedBooking?.room?._id;

      setRoomId(fetchedRoomId);

      console.log("ROOM ID 👉", fetchedRoomId);

      if (!fetchedRoomId) {
        console.log("Room ID missing");
        setLoading(false);
        return;
      }

      // ================= RECHARGE HISTORY =================
      const res = await axios.get(
        `${BASE_URL}/api/rooms/recharge-history/${fetchedRoomId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Recharge History 👉", res.data);

      setRecharges(res?.data?.data?.recharges || []);
      setCurrentBalance(res?.data?.data?.currentBalance || 0);

    } catch (error: any) {
      console.log("STATUS 👉", error?.response?.status);

      console.log("BACKEND RESPONSE 👉", error?.response?.data);

      console.log("FULL ERROR 👉", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "--";

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const renderRechargeItem = ({ item }: any) => {
    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item?.userName?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>
                {item?.userName || "Unknown User"}
              </Text>

              <Text style={styles.dateText}>
                {formatDate(item?.rechargeDate)}
              </Text>
            </View>
          </View>

          <View style={styles.amountBadge}>
            <Text style={styles.amountText}>
              ₹{Number(item?.amount || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#F6A452" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="chevron-back"
            size={26}
            color="#4B3426"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Room Electricity Recharge History
        </Text>
      </View>

      {/* BALANCE CARD */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>
          Current Electricity Balance
        </Text>

        <Text style={styles.balanceAmount}>
          ₹{Number(currentBalance).toFixed(2)}
        </Text>
      </View>

      {/* LIST */}
      <FlatList
        data={recharges}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderRechargeItem}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={55}
              color="#C9B297"
            />

            <Text style={styles.emptyTitle}>
              No Recharge History Found
            </Text>

            <Text style={styles.emptySubtitle}>
              Electricity recharge history will appear here.
            </Text>
          </View>
        )}
      />

      {/* BUTTON */}
    <TouchableOpacity
  style={[
    styles.rechargeButton,
    (!booking || isParentLogin) && { opacity: 0.6 },
  ]}
  disabled={!booking || isParentLogin}
  onPress={() => {
    console.log(
      "BOOKING DETAILS DATA 👉",
      JSON.stringify(booking, null, 2)
    );

    if (!booking) {
      console.log("Booking not available");
      return;
    }

    navigation.navigate("BookingDetails", {
      booking: booking,
    });
  }}
>
  <Ionicons
    name="flash-outline"
    size={20}
    color="#fff"
    style={{ marginRight: 8 }}
  />

  <Text style={styles.rechargeButtonText}>
    Recharge Electricity Account
  </Text>
</TouchableOpacity>
    </View>
  );
};

export default RoomRechargeHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 20,
  },

  headerTitle: {
    fontSize: 22,
    fontFamily: "Quicksand-Bold",
    color: "#4B3426",
    flex: 1,
  },

  balanceCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    paddingVertical: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  balanceLabel: {
    fontSize: 15,
    color: "#7A6658",
    fontFamily: "Quicksand-Medium",
    marginBottom: 8,
  },

  balanceAmount: {
    fontSize: 34,
    color: "#F6A452",
    fontFamily: "Quicksand-Bold",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  userSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F6A452",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Quicksand-Bold",
  },

  userName: {
    fontSize: 16,
    fontFamily: "Quicksand-Bold",
    color: "#4B3426",
    marginBottom: 4,
  },

  dateText: {
    fontSize: 13,
    color: "#7A6658",
    fontFamily: "Quicksand-Medium",
  },

  amountBadge: {
    backgroundColor: "#FFF3E7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginLeft: 10,
  },

  amountText: {
    color: "#F6A452",
    fontSize: 16,
    fontFamily: "Quicksand-Bold",
  },

  emptyContainer: {
    marginTop: 120,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 18,
    color: "#4B3426",
    fontFamily: "Quicksand-Bold",
  },

  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    textAlign: "center",
    color: "#7A6658",
    fontFamily: "Quicksand-Medium",
  },

  rechargeButton: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#F6A452",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },

  rechargeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Quicksand-Bold",
  },
});
