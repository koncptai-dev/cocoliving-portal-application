import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import HeaderGradient from "../HeaderGradient";
import colors from "../../constants/color";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const ComplaintHistory = () => {
  const baseURL = "https://staging.cocoliving.in";
  const { user } = useAuth();
  const token = user?.token;

  const [tickets, setTickets] = useState([]);
  const [roomNumber, setRoomNumber] = useState("No room assigned");
  const [loadingRoom, setLoadingRoom] = useState(true);

  const [filterMonth, setFilterMonth] = useState("Month");
  const [filterStatus, setFilterStatus] = useState("Status");
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const statusOptions = ["open", "closed"];

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/tickets/get-user-tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(res.data.tickets || []);
    } catch (error) {
      console.log("❌ ERROR LOADING HISTORY:", error);
    }
  };

  const fetchUserBookings = async () => {
    try {
      setLoadingRoom(true);
      const response = await axios.get(
        `${baseURL}/api/book-room/getUserBookings?page=1&limit=30`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bookingData = response.data.bookings || [];
      const today = new Date();

      const currentBooking = bookingData.find((b) => {
        const status = b.displayStatus?.toLowerCase();
        const checkIn = b.checkInDate ? new Date(b.checkInDate) : null;
        const checkOut = b.checkOutDate ? new Date(b.checkOutDate) : null;

        return (
          ["approved", "active"].includes(status) &&
          checkIn &&
          today >= checkIn &&
          (checkOut ? today <= checkOut : true)
        );
      });

      setRoomNumber(currentBooking?.room?.roomNumber || "No room assigned");
    } catch {
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

  const filteredTickets = tickets.filter((t) => {
    let ok = true;

    if (filterStatus !== "Status") ok = ok && t.status === filterStatus;
    if (filterMonth !== "Month") {
      const m = new Date(t.date).getMonth();
      ok = ok && m === months.indexOf(filterMonth);
    }
    return ok;
  });

  return (
    <View style={styles.container}>
      <HeaderGradient
        image={require("../../../assets/images/support.png")}
        title="Help & Support"
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <Text style={styles.tagline}>
          Your comfort matters.{"\n"}Tell us what’s wrong, we’ll fix it soon.
        </Text>

        <Text style={styles.mainTitle}>Complaint History</Text>

        <Text style={styles.roomText}>
          Room No: {loadingRoom ? "Loading..." : roomNumber}
        </Text>

        {/* FILTER CARD */}
        <View style={styles.filterCard}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterInput}
              onPress={() => {
                setShowMonthDropdown(!showMonthDropdown);
                setShowStatusDropdown(false);
              }}
            >
              <Text style={styles.filterText}>{filterMonth}</Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterInput}
              onPress={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowMonthDropdown(false);
              }}
            >
              <Text style={styles.filterText}>{filterStatus}</Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.findBtn}>
            <Text style={styles.findText}>Find</Text>
          </TouchableOpacity>
        </View>

        {/* DROPDOWNS */}
        {showMonthDropdown && (
          <View style={styles.dropdown}>
            {months.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => {
                  setFilterMonth(m);
                  setShowMonthDropdown(false);
                }}
              >
                <Text style={styles.dropdownItem}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showStatusDropdown && (
          <View style={styles.dropdown}>
            {statusOptions.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  setFilterStatus(s);
                  setShowStatusDropdown(false);
                }}
              >
                <Text style={styles.dropdownItem}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* LIST */}
{filteredTickets.map((item) => (
  <View style={styles.card} key={item.id}>

    {/* Complaint No – single row */}
    <Text style={styles.code}>
      Complaint No: {item.supportCode}
    </Text>

    {/* Room No + Status – same row */}
    <View style={styles.row}>
      <Text style={styles.room}>
        ROOM NO: {item.roomNumber}
      </Text>

      <Text style={styles.status}>
        Status: {item.status === "open" ? "Pending" : "Closed"}
      </Text>
    </View>

    <Text style={styles.date}>
      Complaint Date: {item.date}
    </Text>

    {item.status === "closed" && (
      <Text style={styles.date}>
        Complaint Closed: {item.updatedAt?.split("T")[0]}
      </Text>
    )}

    <TouchableOpacity style={styles.detailsBtn}>
      <Text style={styles.detailsText}>Details</Text>
    </TouchableOpacity>
  </View>
))}
      </ScrollView>
    </View>
  );
};

export default ComplaintHistory;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

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
    paddingHorizontal:20,
    marginTop: 12,
   
    fontSize: 16,
    fontFamily: "Quicksand-Bold",
    color: "#4f3421",
  },

  filterCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },

  filterRow: { flexDirection: "row", gap: 12 },

  filterInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbb8a3",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fff",
  },

  filterText: {
    fontFamily: "Quicksand-Medium",
    fontSize: 15,
    color: "#555",
  },

  arrow: {
    position: "absolute",
    right: 12,
    top: 16,
    fontSize: 14,
    color: "#666",
  },

  findBtn: {
    marginTop: 16,
    backgroundColor: "#f1a85b",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  findText: {
    fontFamily: "Quicksand-Bold",
    fontSize: 19,
    color: "#fff",
  },

  dropdown: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },

  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
    fontFamily: "Quicksand-Regular",
  },

  card: {
    backgroundColor: "#f4efe8",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
  },

  row: { flexDirection: "row", justifyContent: "space-between" },

  code: {
    fontFamily: "Quicksand-Bold",
    fontSize: 14,
    color: "#4a3321",
  },

  status: {
    fontFamily: "Quicksand-Bold",
    fontSize: 13,
    color: "#4a3321",
  },

  room: {
    fontFamily: "Quicksand-Bold",
    fontSize: 13,
    marginTop: 6,
    color: "#4a3321",
  },

 date: {
    fontFamily: "Quicksand-Bold",
    fontSize: 12,
    marginTop: 8,
    color: "#444444",
  },

  detailsBtn: {
    position: "absolute",
    right: 16,
    bottom: 14,
    backgroundColor: "#f1a85b",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 5,
  },
  detailsText: {
    fontFamily: "Quicksand-SemiBold",
    fontSize: 14,
    color: "#fff",
  },
});
