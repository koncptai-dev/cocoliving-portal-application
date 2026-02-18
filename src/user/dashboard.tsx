import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

import colors from "../constants/color";
import { useFocusEffect } from "@react-navigation/native";

const API_BASE_URL = "https://staging.cocoliving.in";

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const token = user?.token;

  const username = user?.fullName || "User";
  const firstName = username.split(" ")[0];
  const firstLetter = username.charAt(0).toUpperCase();

  const [roomNumber, setRoomNumber] = useState("#N/A");
  const [daysLeft, setDaysLeft] = useState(0);
  const [openRequests, setOpenRequests] = useState(0);

  const [todayFood, setTodayFood] = useState(null);
  const [events, setEvents] = useState([]);

  // Debug: Events state değiştiğinde logla
  useEffect(() => {
    console.log("Events state updated:", events);
    console.log("Events count:", events.length);
  }, [events]);

  useFocusEffect(
    useCallback(() => {
      if (token) fetchDashboardData();
    }, [token])
  );

  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token]);

  /* ---------------- API CALLS (HER BİRİ BAĞIMSIZ TRY-CATCH) ---------------- */
  const fetchDashboardData = async () => {
    const today = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = days[today.getDay()];

    /* ---------- BOOKINGS ---------- */
    try {
      const bookingRes = await axios.get(
        `${API_BASE_URL}/api/book-room/getUserBookings?page=1&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allBookings = bookingRes.data.bookings || [];
      console.log("Bookings fetched successfully. Count:", allBookings.length);

      const active = allBookings.find((b) => {
        const status = b.displayStatus?.toLowerCase();
        const checkIn = new Date(b.checkInDate);
        const checkOut = b.checkOutDate ? new Date(b.checkOutDate) : null;

        return (
          ["approved", "active"].includes(status) &&
          today >= checkIn &&
          (checkOut ? today <= checkOut : true)
        );
      });

      if (active) {
        const newRoomNumber = `#${active.room?.roomNumber || "N/A"}`;
        let newDaysLeft = 0;

        if (active.checkOutDate) {
          const diff = (new Date(active.checkOutDate) - today) / (1000 * 60 * 60 * 24);
          newDaysLeft = Math.max(0, Math.ceil(diff));
        }

        setRoomNumber(newRoomNumber);
        setDaysLeft(newDaysLeft);
        console.log("Active booking found → Room:", newRoomNumber, "Days left:", newDaysLeft);
      } else {
        console.log("No active booking found");
        setRoomNumber("#N/A");
        setDaysLeft(0);
      }
    } catch (err) {
      console.log("Bookings API failed:", err?.response?.data || err.message || err);
    }

    /* ---------- TODAY FOOD ---------- */
    try {
      const foodRes = await axios.get(
        `${API_BASE_URL}/api/food-menu/user-menus`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const menus = foodRes.data.menus || [];
      console.log("Food menus fetched successfully. Count:", menus.length);

      const todayMenu = menus[0]?.weekMenu?.[todayName] || null;
      setTodayFood(todayMenu);
      console.log("Today's food set:", todayMenu);
    } catch (err) {
      console.log("Food menu API failed:", err?.response?.data || err.message || err);
      setTodayFood(null);
    }

    /* ---------- EVENTS ---------- */
    try {
      const eventRes = await axios.get(
        `${API_BASE_URL}/api/events/allevents`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const fetchedEvents = eventRes.data?.events || [];
      console.log("Events API success. Raw response:", eventRes.data);
      console.log("Events count received:", fetchedEvents.length);
      console.log("Events list:", fetchedEvents);

      setEvents(fetchedEvents);
    } catch (err) {
      console.log("Events API failed:", err?.response?.data || err.message || err);
      setEvents([]);
    }

    /* ---------- SUPPORT TICKETS ---------- */
    try {
      const ticketRes = await axios.get(
        `${API_BASE_URL}/api/tickets/get-user-tickets`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const tickets = ticketRes.data.tickets || [];
      console.log("Tickets fetched successfully. Count:", tickets.length);

      const openCount = tickets.filter(
        (t) => t.status?.toLowerCase() === "open"
      ).length;

      setOpenRequests(openCount);
      console.log("Open requests count:", openCount);
    } catch (err) {
      console.log("Tickets API failed:", err?.response?.data || err.message || err);
      setOpenRequests(0);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ---------------- HEADER ---------------- */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.hello}>Hey, {firstName}! 👋</Text>

          <View style={styles.rightIcons}>
            <TouchableOpacity
              style={styles.profileCircle}
              onPress={() => navigation.navigate("ProfileScreen")}
            >
              {user?.profileImage ? (
                <Image
                  source={{
                    uri: `${API_BASE_URL}${user.profileImage}`,
                  }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.profileLetter}>{firstLetter}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.notification}>
              <Ionicons name="notifications-outline" size={22} color="#fff" onPress={()=>navigation.navigate("notificationListScreen")} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>4</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ---------------- MY STAY STATUS ---------------- */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>My Stay Status</Text>

        <View style={styles.statusRow}>
          <StatusItem
            image={require("../../assets/icons/rooms.png")}
            value={roomNumber}
            label="Room"
          />
          <StatusItem
            image={require("../../assets/icons/days.png")}
            value={daysLeft}
            label="Days left"
          />
          <StatusItem
            image={require("../../assets/icons/tools.png")}
            value={openRequests}
            label="Request Open"
          />
        </View>
      </View>

      {/* ---------------- TODAY'S FUEL ---------------- */}
      <SectionHeader
        title="Today’s Fuel"
        onPress={() => navigation.navigate("FoodMenu")}
      />

      <View style={styles.foodRow}>
        <FoodCard
          title="Breakfast"
          subtitle={
            todayFood?.breakfast?.length
              ? todayFood.breakfast.join(", ")
              : "Not available"
          }
          image={require("../../assets/images/breakfastt.png")}
        />

        <FoodCard
          title="Lunch"
          subtitle={
            todayFood?.lunch?.length
              ? todayFood.lunch.join(", ")
              : "Not available"
          }
          image={require("../../assets/images/lunch.png")}
        />

        <FoodCard
          title="Dinner"
          subtitle={
            todayFood?.dinner?.length
              ? todayFood.dinner.join(", ")
              : "Not available"
          }
          image={require("../../assets/images/dinner.png")}
        />
      </View>

      {/* ---------------- EVENTS ---------------- */}
      <SectionHeader title="What’s Happening" onPress={() => navigation.navigate("Events")} />

      <View style={{ marginHorizontal: 16, marginTop: 10 }}>
        {events.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {events.map((event, index) => (
              <TouchableOpacity
                key={event._id || event.id || index}
                style={styles.eventCard}
                onPress={() => navigation.navigate("EventDetails", { event })}
              >
                <Image
                  source={{
                    uri: event.eventImage
                      ? `${API_BASE_URL}${event.eventImage}`
                      : "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
                  }}
                  style={styles.eventImage}
                />
                <Text style={styles.eventTitle}>{event.title || "Untitled Event"}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={{ paddingVertical: 30, alignItems: "center" }}>
            <Text style={{ color: "#888", fontSize: 16, fontStyle: "italic" }}>
              No events happening right now
            </Text>
          </View>
        )}
      </View>

      {/* ---------------- MAKE A VISIT ---------------- */}
      <View style={styles.visitWrapper}>
        <View style={styles.visitHeaderRow}>
          <View>
            <Text style={styles.visitHeading}>Experience Coco Living</Text>
            <Text style={styles.visitSubHeading}>Invite Guest</Text>
          </View>

           <TouchableOpacity style={styles.visitBookBtn}
           onPress={()=>navigation.navigate("GuestVisit")}>
             <Text style={styles.visitBookText}>Add</Text> 
          </TouchableOpacity>   
        </View>

        <View style={styles.visitCard}>
          <View style={styles.visitTextBox}>
            <Text style={styles.visitDesc}>
           Register your guest to grant them temporary access to Coco Living.
            </Text>
          </View>

          <Image
            source={require("../../assets/images/add.png")}
            style={styles.visitImage}
          />
        </View>
      </View>
    </ScrollView>
  );
};

/* ---------------- COMPONENTS ---------------- */
const StatusItem = ({ image, value, label }) => (
  <View style={styles.statusItem}>
    <Image source={image} style={styles.statusIcon} resizeMode="contain" />
    <Text style={styles.statusValue}>{value}</Text>
    <Text style={styles.statusLabel}>{label}</Text>
  </View>
);

const SectionHeader = ({ title, onPress }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.viewAll}>View All</Text>
    </TouchableOpacity>
  </View>
);

const FoodCard = ({ title, subtitle, image }) => (
  <View style={styles.foodCard}>
    <Image source={image} style={styles.foodImage} />
    <Text style={styles.foodTitle}>{title}</Text>
    <Text style={styles.foodSubtitle}>{subtitle}</Text>
  </View>
);

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F3EC" },

  header: {
    backgroundColor: "#4b3426",
    paddingTop: 55,
    height: 223,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  hello: { fontSize: 25, fontFamily: "RethinkSans-SemiBold", color: "#fff" },

  rightIcons: { flexDirection: "row", alignItems: "center", gap: 14 },

  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  profileImage: { width: "100%", height: "100%", borderRadius: 20 },

  profileLetter: { fontWeight: "700", color: "#4b3426" },

  notification: { position: "relative" },

  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#E84C3D",
    borderRadius: 10,
    paddingHorizontal: 5,
  },

  badgeText: { color: "#fff", fontSize: 10 },

  statusCard: {
    backgroundColor: "#EDE7DF",
    marginHorizontal: 20,
    marginTop: -60,
    borderRadius: 24,
    height: 170,
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  statusIcon: {
    width: 44,
    height: 44,
    marginBottom: 6,
  },

  statusTitle: { fontSize: 20, color: "#4f321", fontFamily: "Quicksand-SemiBold" },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  statusItem: { alignItems: "center", width: "30%" },

  statusValue: { fontSize: 16, fontFamily: "RethinkSans-Medium", marginTop: 6, color: "#000000" },

  statusLabel: { fontSize: 12, color: "#5E5B5B", fontFamily: "RethinkSans-Medium" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 24,
  },

  sectionTitle: { fontSize: 24, fontFamily: "Quicksand-SemiBold", color: "#4b3426" },

  viewAll: { color: "#ffffff", backgroundColor: colors.nOrange, padding: 5, borderRadius: 8, fontFamily: "RethinkSans-Bold" },

  foodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 14,
  },

  foodCard: {
    width: "30%",
    backgroundColor: "#EFE8E2",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 14,
  },

  foodImage: { width: 60, height: 60, borderRadius: 30 },

  foodTitle: { fontFamily: "Quicksand-SemiBold", marginTop: 8, color: "#444444", fontSize: 16 },

  foodSubtitle: {
    fontSize: 14,
    color: "#5E5B5B",
    textAlign: "center",
    marginTop: 4,
    fontFamily: "Quicksand-Medium",
  },

  eventCard: {
    width: 220,
    marginLeft: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },

  eventImage: { width: "100%", height: 140 },

  eventTitle: { padding: 10, fontFamily: "Quicksand-Bold", fontSize: 16 },

  visitWrapper: {
    marginHorizontal: 16,
    marginTop: 30,
    marginBottom: 30,
  },

  visitHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  visitHeading: {
    fontSize: 18,
    color: "#4B3426",
    fontFamily: "Quicksand-SemiBold",
  },

  visitSubHeading: {
    fontSize: 20,
    color: "#4B3426",
    fontFamily: "Quicksand-Bold",
    marginTop: 2,
  },

  visitBookBtn: {
    backgroundColor: "#F2A85B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },

  visitBookText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
  },

  visitCard: {
    flexDirection: "row",
    backgroundColor: "#EFE8E2",
    borderRadius: 18,
    overflow: "hidden",
  },

  visitTextBox: {
    flex: 1,
    padding: 14,
    justifyContent: "center",
  },

  visitDesc: {
    fontSize: 14,
    color: "#5A5A5A",
    lineHeight: 20,
    fontFamily: "Quicksand-Regular",
  },

  visitImage: {
    width: 140,
    height: 120,
    resizeMode: "cover",
  },
});

export default DashboardScreen;