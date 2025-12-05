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
  const [filterMonth, setFilterMonth] = useState("Month");
  const [filterStatus, setFilterStatus] = useState("Status");
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const statusOptions = ["open", "closed"];

  // ----------- FETCH TICKETS -----------
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

  useEffect(() => {
    fetchTickets();
  }, []);

  // ----------- APPLY FILTERS -----------
  const filteredTickets = tickets.filter((t) => {
    let match = true;

    if (filterStatus !== "Status") {
      match = match && t.status === filterStatus;
    }

    if (filterMonth !== "Month") {
      const ticketMonth = new Date(t.date).getMonth();
      match = match && ticketMonth === months.indexOf(filterMonth);
    }

    return match;
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <HeaderGradient title="Help & Support" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <Text style={styles.tagline}>
          Your comfort matters.{"\n"}Tell us what's wrong, we'll fix it soon.
        </Text>

        {/* Top Buttons */}
        <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryText}>Complaint History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Room No: 305</Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- FILTER BOX ---------------- */}
        <View style={styles.filterContainer}>
          {/* Month Filter */}
          <TouchableOpacity
            style={styles.filterBox}
            onPress={() => {
              setShowMonthDropdown(!showMonthDropdown);
              setShowStatusDropdown(false);
            }}
          >
            <Text style={styles.filterText}>{filterMonth}</Text>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>

          {/* Status Filter */}
          <TouchableOpacity
            style={styles.filterBox}
            onPress={() => {
              setShowStatusDropdown(!showStatusDropdown);
              setShowMonthDropdown(false);
            }}
          >
            <Text style={styles.filterText}>{filterStatus}</Text>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Month Dropdown */}
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

        {/* Status Dropdown */}
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

        {/* FIND BUTTON */}
        <TouchableOpacity style={styles.findBtn}>
          <Text style={styles.findText}>Find</Text>
        </TouchableOpacity>

        {/* ---------------- LIST ---------------- */}
        {filteredTickets.map((item) => (
          <View style={styles.card} key={item.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.code}>Complaint No: {item.supportCode}</Text>
              <Text style={styles.status}>
                Status: {item.status === "open" ? "Pending" : "Closed"}
              </Text>
            </View>

            <Text style={styles.room}>ROOM NO: {item.roomNumber}</Text>

            <Text style={styles.date}>Complaint Date: {item.date}</Text>

            {item.status === "closed" && (
              <Text style={styles.date}>
                Complaint Closed: {item.updatedAt?.split("T")[0]}
              </Text>
            )}

            <TouchableOpacity style={styles.detailsBtn}>
              <Text style={styles.detailsText}>DETAILS ›››</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default ComplaintHistory;

const styles = StyleSheet.create({
  tagline: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 10,
    fontWeight: "700",
  },

  primaryBtn: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  primaryText: { fontSize: 20, color: "#fff", fontWeight: "600" },

  secondaryBtn: {
    backgroundColor: "#b79e81",
    padding: 18,
    borderRadius: 30,
    marginTop: 10,
    alignItems: "center",
  },
  secondaryText: { fontSize: 20, color: "#fff", fontWeight: "600" },

  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
    paddingHorizontal: 20,
  },

  filterBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#c9b7a2",
    borderRadius: 12,
    padding: 14,
    marginRight: 10,
    backgroundColor: "#fff",
  },

  filterText: { fontSize: 16, color: "#000" },

  arrow: {
    position: "absolute",
    right: 12,
    top: 15,
    fontSize: 15,
    color: "#555",
  },

  dropdown: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c9b7a2",
    marginTop: 8,
    overflow: "hidden",
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    fontSize: 14,
  },

  findBtn: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 15,
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  findText: { fontSize: 18, color: "#fff", fontWeight: "700" },

  card: {
    backgroundColor: colors.border,
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 18,
    marginTop: 15,
    position: "relative",
  },

  code: { fontSize: 14, fontWeight: "700", color: "#fff" },
  room: { fontSize: 14, fontWeight:"700", color: colors.primary, marginTop: 6 },
  status: { fontSize: 14, fontWeight: "700", color: "#fff" },

  date: { fontSize: 12, fontWeight: "700", color: "#fff", marginTop: 10 },

  detailsBtn: { position: "absolute", right: 20, bottom: 15 },
  detailsText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
});
