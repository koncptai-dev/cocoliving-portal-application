import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
 import Config from "react-native-config";
 import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
export const baseURL = Config.API_BASE_URL;
 
const POLLING_INTERVAL = 10000; // 10 seconds
 
const NotificationListScreen = () => {
  const { user } = useAuth();
 
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const navigation = useNavigation();


  const markAllAsRead = async (notifications) => {
  try {
    const storedReadIds = await AsyncStorage.getItem("readNotifications");
    const readIds = storedReadIds ? JSON.parse(storedReadIds) : [];

    // ✅ merge old + new (IMPORTANT)
    const newIds = notifications.map((n) => n._id || n.id);

    const updatedReadIds = [...new Set([...readIds, ...newIds])];

    await AsyncStorage.setItem(
      "readNotifications",
      JSON.stringify(updatedReadIds)
    );

  } catch (e) {
    console.log("Mark read error:", e);
  }
};
 
  /* ---------------- FETCH NOTIFICATIONS ---------------- */
  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
 
    console.log("📡 Fetching notifications...");
    console.log("🔐 Token:", user?.token ? "Present" : "Missing");
 
    try {
      const res = await axios.get(
        `${baseURL}/api/fcm/get-notifications`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
 
      console.log("✅ API Success:", res.status);
      console.log("📦 Raw Data:", res.data);
 
     if (res.data?.success) {
  const data = res.data.data || [];
  setNotifications(data);

  // 🔥 mark read yahin karo
  markAllAsRead(data);
} else {
        Toast.show({
          type: "error",
          text1: "Invalid notification response",
        });
      }
    } catch (error: any) {
      console.log("❌ Notification fetch failed");
 
      if (error.response) {
        console.log("🚨 Status:", error.response.status);
        console.log("🚨 Data:", error.response.data);
      } else {
        console.log("🚨 Error:", error.message);
      }
 
      Toast.show({
        type: "error",
        text1: "Failed to load notifications",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };
 
  /* ---------------- INITIAL LOAD + POLLING ---------------- */
  useEffect(() => {
    fetchNotifications();
 
    const interval = setInterval(() => {
      fetchNotifications(true); // silent refresh
    }, POLLING_INTERVAL);
 
    return () => clearInterval(interval);
  }, []);


  // ReDirection
const handleNotificationPress = async (notification) => {
// *********************BOOKING NOTIFICATION******************//
  if (notification.notificationKey === "booking") {

    try {

      const res = await axios.get(
        `${baseURL}/api/book-room/getUserBookings?page=1&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const bookings = res.data?.bookings || [];

      const today = new Date();

     const upcomingBooking = bookings.find((b) => {
  const status = b.displayStatus?.toLowerCase();
  const checkIn = new Date(b.checkInDate);

  return status === "approved" && today < checkIn;
});

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

const bookingToShow = currentBooking || upcomingBooking;

     if (!bookingToShow){
        Toast.show({
          type: "info",
          text1: "No active booking found",
        });
        return;
      }

    if (bookingToShow.contractStatus === "SIGNED") {
        Toast.show({
          type: "info",
          text1: "Contract already signed",
        });
        return;
      }

      navigation.navigate("ContractSign", {
        bookingId: bookingToShow.id
      });

    } catch (error) {
      console.log("Booking check failed:", error);
    }
  }

  // *************EVENT NOTIFCATION*************//
 else if (notification.notificationKey === "event") {
  try {
    const res = await axios.get(
      `${baseURL}/api/events/allevents?page=1&limit=20`,
      {
        headers: { Authorization: `Bearer ${user.token}` },
      }
    );

    const fetchedEvents = res.data.events || [];

    // 🔥 same filter logic (IMPORTANT)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = fetchedEvents.filter((event) => {
      if (!event.eventDate) return false;

      const eventDate = new Date(event.eventDate);
      eventDate.setHours(0, 0, 0, 0);

      return eventDate >= today;
    });

    // 🔥 Extract event name from notification message
    const match = notification.message.match(/"([^"]+)"/);
    const eventName = match ? match[1] : null;

    // 🔥 Find correct event
    const selectedEvent = upcomingEvents.find(
      (e) => e.title === eventName
    );

    if (!selectedEvent) {
      Toast.show({
        type: "error",
        text1: "Event not found",
      });
      return;
    }

    // ✅ Navigate
    navigation.navigate("EventDetails", {
      event: selectedEvent,
    });

  } catch (error) {
    console.log("Event fetch failed:", error);
    Toast.show({
      type: "error",
      text1: "Failed to load event",
    });
  }


  
}

 // 🔥 TENURE ENDING (NEW)
  else if (notification.title.includes("tenure")) {
    console.log("✅ Tenure Ending → MyBookings");
    navigation.navigate("MyBookings");
  }

// *************GUEST NOTIFICATION*************//
  else if (
    notification.title?.toLowerCase().includes("guest")
  ) {
    navigation.navigate("GuestVisit");
  }

  // *************REQUEST UPDATE NOTIFICATION*************//
  else if (
    notification.title?.toLowerCase().includes("request")
  ) {
    navigation.navigate("ComplaintStatus");
  }

  // *************WELCOME NOTIFICATION*************//
// *************WELCOME NOTIFICATION*************//
else if (
  notification.title?.toLowerCase() === "welcome"
) {

  const message =
    notification.message?.toLowerCase() || "";

  // ⚡ Electricity recharge welcome notification
  if (message.includes("electricity recharge")) {

    navigation.navigate("RoomRechargeHistory");

    return;
  }

  // Default welcome navigation
  navigation.navigate("HomeTabs", {
    screen: "Center",
  });
}
  // *************RENT DUE NOTIFICATION*************//
 else if (
    notification.title?.toLowerCase().includes("rent")
  ) {
    navigation.navigate("MyBookings");
  }

else if (
  notification.title?.toLowerCase().includes("electricity")
) {

  try {

    const res = await axios.get(
      `${baseURL}/api/book-room/getUserBookings?page=1&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    const bookings = res.data?.bookings || [];

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
      const checkOut = b.checkOutDate
        ? new Date(b.checkOutDate)
        : null;

      return (
        ["approved", "active"].includes(status) &&
        today >= checkIn &&
        (checkOut ? today <= checkOut : true)
      );
    });

    const bookingToShow =
      currentBooking || upcomingBooking;

    if (!bookingToShow) {
      Toast.show({
        type: "info",
        text1: "No active booking found",
      });
      return;
    }

    navigation.navigate("BookingDetails", {
      booking: bookingToShow,
    });

  } catch (error) {

    console.log(
      "Electricity booking fetch failed:",
      error
    );

    Toast.show({
      type: "error",
      text1: "Failed to open booking",
    });
  }
}


  // *************CHECK-IN REMINDER*************//
else if (
  notification.title?.toLowerCase().includes("check-in")
) {
  navigation.navigate("MyBookings");
}
};

useFocusEffect(
  useCallback(() => {
    // sirf screen open hone par mark karo
    if (notifications.length > 0) {
      markAllAsRead(notifications);
    }
  }, []) 
);
 
  /* ---------------- RENDER ITEM ---------------- */
const renderItem = ({ item }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.8}
    onPress={() => handleNotificationPress(item)}
  >
    <View style={styles.iconWrap}>
      <Ionicons
        name="notifications-outline"
        size={22}
        color="#F4A261"
      />
    </View>

    <View style={styles.cardContent}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.message}>{item.message}</Text>
     <Text style={styles.date}>
  {new Date(item.createdAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // AM/PM ke liye
  })}
</Text>
    </View>
  </TouchableOpacity>
);
 
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#F4A261" />
      </SafeAreaView>
    );
  }
 
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
   <View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Ionicons name="chevron-back" size={26} color="#4C3D2A" />
  </TouchableOpacity>

  <Text style={styles.headerTitle}>Notifications</Text>
</View>
 
      {notifications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color="#C7C7C7"
          />
          <Text style={styles.emptyText}>No notifications found</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
};
 
export default NotificationListScreen;
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F7F9" },
 
  header: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 20,
  paddingHorizontal: 20,
  gap: 20,
  marginTop: 20,
},

headerTitle: {
  fontSize: 22,
  fontFamily: "Quicksand-Bold",
  color: "#4C3D2A",
},
 
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
 
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF3E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
 
  cardContent: { flex: 1 },
 
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
 
  message: {
    fontSize: 13,
    color: "#666",
    marginVertical: 4,
  },
 
  date: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
 
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
  },
});