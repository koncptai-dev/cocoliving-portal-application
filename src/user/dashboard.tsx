import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAuth } from "../context/AuthContext";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import axios from "axios";

const API_BASE_URL = "https://staging.cocoliving.in";

const HEADER_HEIGHT = 280;
const COLLAPSE_DISTANCE = 160;

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const token = user?.token;
  const username = user?.fullName || "User";
  const firstLetter = username.charAt(0).toUpperCase();

  const [roomNumber, setRoomNumber] = useState("#305");
  const [todayFood, setTodayFood] = useState(null);
  const [loadingFood, setLoadingFood] = useState(true);
  const [daysLeft, setDaysLeft] = useState(53);
  const [loadingStats, setLoadingStats] = useState(true);
  const [events, setEvents] = useState([]);
  const [location, setLocation] = useState("Navrangpura");
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [openRequests, setOpenRequests] = useState(0);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Reanimated values
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  /** HEADER COLLAPSE ANIMATION */
  const headerAnim = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, COLLAPSE_DISTANCE],
          [0, -COLLAPSE_DISTANCE],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  /** QUOTE FADE OUT */
  const quoteAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolate.CLAMP),
  }));

  /** STATS MOVE UP */
  const statsAnim = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, COLLAPSE_DISTANCE],
          [0, -COLLAPSE_DISTANCE],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  // ------------------ API CALLS ------------------

  // Today’s Food
  const fetchTodaysFood = async () => {
    try {
      setLoadingFood(true);

      const response = await axios.get(
        `${API_BASE_URL}/api/food-menu/user-menus`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const menus = response.data.menus || [];
      if (!menus.length) return setTodayFood(null);

      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const todayName = days[new Date().getDay()];
      const todayMenu = menus[0]?.weekMenu?.[todayName] || null;

      setTodayFood(todayMenu);
    } catch (err) {
      setTodayFood(null);
    } finally {
      setLoadingFood(false);
    }
  };

  // Support Requests
  const fetchSupportRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await axios.get(`${API_BASE_URL}/api/tickets/get-user-tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const tickets = res.data.tickets || [];
      const open = tickets.filter((t) => t.status?.toLowerCase() === "open");
      setOpenRequests(open.length);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Events
  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await axios.get(
        `${API_BASE_URL}/api/events/allevents?page=1&limit=2`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEvents(res.data.events || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Bookings
  const fetchUserBookings = async () => {
    try {
      setLoadingStats(true);

      const res = await axios.get(
        `${API_BASE_URL}/api/book-room/getUserBookings?page=1&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bookings = res.data.bookings || [];
      const active = bookings.find(
        (b) => b.displayStatus?.toLowerCase() === "active" || b.displayStatus?.toLowerCase() === "approved"
      );

      if (active) {
        setRoomNumber(`#${active.room?.roomNumber || "N/A"}`);
        setLocation(active.room?.property?.address || "N/A");

        // Days left
        if (active.checkOutDate) {
          const today = new Date();
          const end = new Date(active.checkOutDate);
          const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
          setDaysLeft(Math.max(0, diff));
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchUserBookings();
    fetchTodaysFood();
    fetchEvents();
    fetchSupportRequests();
  }, [token]);

  // ----------------------------------------------------

  return (
    <View style={{ flex: 1, backgroundColor: "#EFEFEF" }}>

      {/* ---------------- HEADER ---------------- */}
      <Animated.View style={[styles.header, headerAnim]}>

        {/* Header Row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.hello}>Hey {username.split(" ")[0]}!</Text>

            <View style={styles.locationRow}>
              {/* <Ionicons name="location-outline" size={12} color="#fff" /> */}
              {/* <Text style={styles.location}>{location}</Text> */}
            </View>
          </View>

          {/* ⭐ PROFILE LOGIC UPDATED */}
          <TouchableOpacity
            style={styles.profileCircle}
            onPress={() => navigation.navigate("ProfileScreen")}
            activeOpacity={0.8}
          >
            {user?.profileImage ? (
    <Image
      source={{ uri: `https://staging.cocoliving.in${user.profileImage}` }}
      style={styles.profileImage}
    />
            ) : (
              <Text style={styles.profileLetter}>{firstLetter}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quote */}
        <Animated.View style={[styles.quoteBlock, quoteAnim]}>
          <Text style={styles.quote1}>“ Unwind, recharge, repeat.”</Text>
          <Text style={styles.quote2}>That's the Coco Living way.</Text>
        </Animated.View>
      </Animated.View>

      {/* --------------- STATS ROW ---------------- */}
      <Animated.View style={[styles.statsRow, statsAnim]}>
        <TouchableOpacity style={styles.statsBox}>
          <Ionicons name="bed-outline" size={28} color="#8A6A53" />
          <Text style={styles.statsVal}>{roomNumber}</Text>
          <Text style={styles.statsTitle}>Room</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statsBox}>
          <Ionicons name="hourglass-outline" size={28} color="#8A6A53" />
          <Text style={styles.statsVal}>{daysLeft}</Text>
          <Text style={styles.statsTitle}>Days left</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statsBox}>
          <Ionicons name="chatbox-ellipses-outline" size={28} color="#8A6A53" />
          <Text style={styles.statsVal}>{openRequests}</Text>
          <Text style={styles.statsTitle}>Open Requests</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginTop: HEADER_HEIGHT - 100 }}>

          {/* ---------------- TODAY'S MENU ---------------- */}
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <Text style={styles.blockTitle}>Today's Menu</Text>

              {/* ⭐ VIEW ALL NOW WORKS */}
              <TouchableOpacity onPress={() => navigation.navigate("FoodMenu")}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {loadingFood ? (
              <Text style={{ textAlign: "center", marginTop: 10 }}>Loading...</Text>
            ) : todayFood ? (
              <>
                <View style={styles.menuCard}>
                  <Text style={styles.menuLabel}>Breakfast</Text>
                  <Text style={styles.menuFood}>
                    {todayFood.breakfast?.length
                      ? todayFood.breakfast.join(", ")
                      : "Not available"}
                  </Text>
                </View>

                <View style={styles.menuCard}>
                  <Text style={styles.menuLabel}>Lunch</Text>
                  <Text style={styles.menuFood}>
                    {todayFood.lunch?.length
                      ? todayFood.lunch.join(", ")
                      : "Not available"}
                  </Text>
                </View>

                <View style={styles.menuCard}>
                  <Text style={styles.menuLabel}>Dinner</Text>
                  <Text style={styles.menuFood}>
                    {todayFood.dinner?.length
                      ? todayFood.dinner.join(", ")
                      : "Not available"}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={{ textAlign: "center", marginTop: 10 }}>Menu not available</Text>
            )}
          </View>

          {/* ---------------- EVENTS ---------------- */}
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <Text style={styles.blockTitle}>Events</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Events")}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {loadingEvents ? (
              <Text style={{ textAlign: "center", marginTop: 10 }}>Loading...</Text>
            ) : events.length ? (
              events.map((event, index) => (
                <View key={index} style={styles.menuCard}>
                  <Text style={styles.menuFood}>{event.title}</Text>
                  <Text style={{ fontSize: 11, color: "#8A6A53", marginTop: 3 }}>
                    {event.eventDate} • {event.eventTime?.slice(0, 5)} • {event.location}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: "center", marginTop: 10 }}>No events available</Text>
            )}
          </View>

          {/* ---------------- GUEST ---------------- */}
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <Text style={styles.blockTitle}>Guest</Text>
              <TouchableOpacity>
                <Text style={styles.addBtn}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.guestNote}>
              Register your guest to grant them temporary access to Coco Living.
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default DashboardScreen;


const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: "#4b3426",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 55,
    overflow: "hidden",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileImage: {
  width: "100%",
  height: "100%",
  borderRadius: 28,
},

  hello: { fontSize: 26, fontWeight: "700", color: "#fff" },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  location: { fontSize: 13, color: "#fff", marginLeft: 3 },

  profileCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  profileLetter: { fontSize: 24, fontWeight: "700", color: "#4b3426" },

  quoteBlock: {
    position: "absolute",
    bottom: 75,
    alignSelf: "center",
    alignItems: "center",
  },
  quote1: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Lora-Bold",
    textAlign: "center",
  },
  quote2: {
    fontSize: 17,
    marginTop: 3,
    color: "#E8A371",
    fontStyle: "italic",
    fontFamily: "Lora-Regular",
    textAlign: "center",
  },

  /* Stats under header curve */
  statsRow: {
    position: "absolute",
    top: HEADER_HEIGHT +5,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 14,
    // marginHorizontal: 14,
    elevation: 4,
  },
  statsBox: { alignItems: "center" },
  statsVal: { fontSize: 16, fontWeight: "700", marginTop: 3, color: "#8A6A53" },
  statsTitle: { fontSize: 12, color: "#8A6A53" },

  /* Content */
  block: {
    backgroundColor: "#fff",
    // marginTop: -150,
    marginHorizontal: 10,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  blockHead: { flexDirection: "row", justifyContent: "space-between" },
  blockTitle: { fontSize: 15, fontWeight: "700", color: "#6A5748" },
  viewAll: { color: "#D07D23", fontWeight: "700", fontSize: 12 },

  menuCard: {
    backgroundColor: "#F6F3EC",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  menuLabel: { fontSize: 14, fontWeight: "700", color: "#5A493B" },
  menuFood: { marginTop: 3, fontSize: 13, color: "#6A5648" },

  addBtn: {
    backgroundColor: "#D07D23",
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderRadius: 10,
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  guestNote: {
    marginTop: 8,
    fontSize: 13,
    color: "#6A5648",
    lineHeight: 18,
  },
});