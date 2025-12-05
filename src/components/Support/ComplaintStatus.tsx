import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import HeaderGradient from "../HeaderGradient";
import colors from "../../constants/color";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const ComplaintStatus = () => {
  const baseURL = "https://staging.cocoliving.in";

  const { user } = useAuth();
  const token = user?.token;

  const [tickets, setTickets] = useState([]);



  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/tickets/get-user-tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Respones of fetching tickets: ",res);
      setTickets(res.data.tickets || []);

    } catch (error) {
      console.log("❌ ERROR LOADING TICKETS:", error);
    }
  };
    useEffect(() => {
    fetchTickets();
  }, []);

  const ongoing = tickets.filter((t) => t.status === "open");
  const closed = tickets.filter((t) => t.status === "closed");

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <HeaderGradient title="Help & Support" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* Tagline */}
        <Text style={styles.tagline}>
          Your comfort matters.{"\n"}Tell us what’s wrong, we’ll fix it soon.
        </Text>

        {/* Top buttons */}
        <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryText}>Complaint Status</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Room No: 305</Text>
          </TouchableOpacity>
        </View>

        {/* ----------- ONGOING COMPLAINT ----------- */}
        <Text style={styles.sectionTitle}>Ongoing complaint</Text>

        {ongoing.length === 0 && (
          <Text style={{ paddingHorizontal: 20, color: "#777" }}>No ongoing complaint</Text>
        )}

        {ongoing.map((item) => (
          <View style={styles.card} key={item.id}>
            <Text style={styles.code}>Complaint No: {item.supportCode}</Text>
            <Text style={styles.room}>ROOM NO: {item.roomNumber}</Text>

            <Text style={styles.date}>Complaint Date: {item.date}</Text>

            <TouchableOpacity style={styles.detailsBtn}>
              <Text style={styles.detailsText}>DETAILS ›››</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* ----------- RECENTLY CLOSED ----------- */}
        <Text style={styles.sectionTitle}>Recently closed complaint</Text>

        {closed.length === 0 && (
          <Text style={{ paddingHorizontal: 20, color: "#777" }}>No closed complaint</Text>
        )}

        {closed.map((item) => (
          <View style={styles.card} key={item.id}>
            <Text style={styles.code}>Complaint No: {item.supportCode}</Text>
            <Text style={styles.room}>ROOM NO: {item.roomNumber}</Text>

            <Text style={styles.date}>Complaint Date: {item.date}</Text>
            <Text style={styles.date}>Complaint Closed: {item.updatedAt?.split("T")[0]}</Text>

            <TouchableOpacity style={styles.detailsBtn}>
              <Text style={styles.detailsText}>DETAILS ›››</Text>
            </TouchableOpacity>
          </View>
        ))}

      </ScrollView>
    </View>
  );
};

export default ComplaintStatus;

// ----------- STYLES -----------
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
  primaryText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
  },

  secondaryBtn: {
    backgroundColor: "#b79e81",
    padding: 18,
    borderRadius: 30,
    marginTop: 10,
    alignItems: "center",
  },
  secondaryText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
  },

  sectionTitle: {
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#8d6c3c",
  },

  card: {
    backgroundColor: colors.border,
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
  },

  code: { fontSize: 14, fontWeight: "700", color: "#fff" },
  room: { fontSize: 14, fontWeight: "700", color: colors.primary, marginTop: 4 },
  date: { fontSize: 12,fontWeight:700, color: "#fff", marginTop: 10 },

  detailsBtn: {
    position: "absolute",
    right: 20,
    bottom: 15,
  },
  detailsText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
