import { View, Text, ScrollView, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import HeaderGradient from "../HeaderGradient";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Toast from "react-native-toast-message";
import Config from "react-native-config";
   export const baseURL = Config.API_BASE_URL;

const ComplaintStatus = () => {

  const { user } = useAuth();
  const token = user?.token;

  const [tickets, setTickets] = useState([]);
  const [roomNumber, setRoomNumber] = useState("No room assigned");
  const [loadingRoom, setLoadingRoom] = useState(true);




  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/tickets/get-user-tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(res.data.tickets || []);
      console.log("Tickets Response:", res.data);   // ← Check this in console
    } catch (error) {
      console.log("❌ ERROR LOADING TICKETS:", error);
    }
  };

  const fetchUserBookings = async () => {
    try {
      setLoadingRoom(true);
      const response = await axios.get(
        `${baseURL}/api/book-room/getUserBookings?page=1&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bookings = response.data.bookings || [];
      const today = new Date();

      const validBookings = bookings.filter((b) => {
        const status = b.displayStatus?.toLowerCase();
        const checkIn = new Date(b.checkInDate);
        const checkOut = b.checkOutDate ? new Date(b.checkOutDate) : null;

        return (
          ["approved", "active"].includes(status) &&
          today >= checkIn &&
          (!checkOut || today <= checkOut)
        );
      });

      validBookings.sort(
        (a, b) => new Date(a.checkInDate) - new Date(b.checkInDate)
      );

      const activeBooking = validBookings[0];
      setRoomNumber(activeBooking?.room?.roomNumber || "No room assigned");
    } catch (error) {
      setRoomNumber("Error loading room");
    } finally {
      setLoadingRoom(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchUserBookings();
    fetchTickets();
  }, [token]);

  const ongoing = tickets.filter((t) => t.status === "open");
  const closed = tickets.filter((t) => t.status === "closed");


const formatDate = (date) => {
  if (!date) return "N/A";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "N/A";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};



  return (
    <View style={styles.container}>
      <HeaderGradient
        image={require("../../../assets/images/support.png")}
        title="Help & Support"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Tagline */}
        <Text style={styles.tagline}>
          Your comfort matters.{"\n"}
          Tell us what’s wrong, we’ll fix it soon.
        </Text>

        {/* Heading */}
        <Text style={styles.mainTitle}>Request Status</Text>

        <Text style={styles.roomText}>
          Room No: {loadingRoom ? "Loading..." : roomNumber}
        </Text>

        {/* ================= ONGOING ================= */}
        <Text style={styles.sectionTitle}>Ongoing Request</Text>

        {ongoing.length === 0 && (
          <Text style={styles.emptyText}>No ongoing Request</Text>
        )}

        {ongoing.map((item) => (
          <View style={styles.card} key={item.id}>
            <Text style={styles.code}>Request No: {item.supportCode}</Text>
            <Text style={styles.room}>ROOM NO: {item.roomNumber}</Text>

            <Text style={styles.infoText}>
              Category: <Text style={styles.highlight}>
                {item.category || item.complaintCategory || "N/A"}
              </Text>
            </Text>
            <Text style={styles.infoText}>
              Sub Category: <Text style={styles.highlight}>
                {item.subCategory || item.subcategory || item.subCategoryName || "N/A"}
              </Text>
            </Text>

           <Text style={styles.date}>Request Date: {formatDate(item.date)}</Text>

          </View>
        ))}

        {/* ================= CLOSED ================= */}
        <Text style={styles.sectionTitle}>Recently closed Request</Text>

        {closed.length === 0 && (
          <Text style={styles.emptyText}>No closed Request</Text>
        )}

        {closed.map((item) => (
          <View style={styles.card} key={item.id}>
            <Text style={styles.code}>Request No: {item.supportCode}</Text>
            <Text style={styles.room}>ROOM NO: {item.roomNumber}</Text>

            <Text style={styles.infoText}>
              Category: <Text style={styles.highlight}>
                {item.category || item.complaintCategory || "N/A"}
              </Text>
            </Text>
            <Text style={styles.infoText}>
              Sub Category: <Text style={styles.highlight}>
                {item.subCategory || item.subcategory || item.subCategoryName || "N/A"}
              </Text>
            </Text>

            <Text style={styles.date}>Request Date: {item.date}</Text>
           <Text style={styles.date}>
  Request Closed: {formatDate(item.updatedAt)}
</Text>

          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default ComplaintStatus;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    paddingBottom: 40,
  },
  tagline: {
    textAlign: "center",
    fontFamily: "Quicksand-Bold",
    fontSize: 16,
    color: "#444444",
    marginTop: 20,
  },
  mainTitle: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 20,
    fontFamily: "Quicksand-Bold",
    color: "#4a3321",
  },
  roomText: {
    textAlign: "left",
    paddingHorizontal: 20,
    marginTop: 12,
    fontSize: 16,
    fontFamily: "Quicksand-Bold",
    color: "#4f3421",
  },
  sectionTitle: {
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: "Quicksand-Bold",
    color: "#6b4b2c",
  },
  emptyText: {
    paddingHorizontal: 20,
    fontFamily: "Quicksand-Regular",
    color: "#888",
  },
  card: {
    backgroundColor: "#ede7df",
    marginHorizontal: 20,
    borderRadius: 9,
    padding: 16,
    marginBottom: 14,
  },
  code: {
    fontFamily: "Quicksand-Bold",
    fontSize: 16,
    color: "#444444",
  },
  room: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 12,
    marginTop: 4,
    color: "#000000",
  },
  date: {
    fontFamily: "Quicksand-Bold",
    fontSize: 12,
    marginTop: 8,
    color: "#444444",
  },
  infoText: {
    fontFamily: "Quicksand-Bold",
    fontSize: 13.5,
    marginTop: 7,
    color: "#4a3321",
  },
  highlight: {
    fontFamily: "Quicksand-SemiBold",
    color: "#e07a00",
  },
});