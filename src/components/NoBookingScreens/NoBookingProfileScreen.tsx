import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

const NoBookingProfileScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const name = user?.fullName || "User";
  const firstLetter = name.charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F7F7" }}>
      {/* ===== HEADER (same as FindStay) ===== */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.hey}>Hey {name.split(" ")[0]} 👋</Text>

          <View style={styles.profileCircle}>
            <Text style={styles.profileLetter}>{firstLetter}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* ===== EMPTY STATE ===== */}
        <View style={styles.emptyBox}>
          <Ionicons name="home-outline" size={60} color="#D07D23" />
          <Text style={styles.emptyTitle}>No booking yet</Text>

          <Text style={styles.emptyText}>
            You haven’t booked a stay with Coco Living yet.
            Find the perfect space and make yourself at home.
          </Text>

          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => navigation.navigate("HomeTabs")}
          >
            <Text style={styles.ctaText}>Find a Stay</Text>
          </TouchableOpacity>
        </View>

        {/* ===== BASIC OPTIONS ===== */}
        <View style={styles.card}>
          <MenuItem
            icon="person-outline"
            label="Personal Information"
            onPress={() => navigation.navigate("Profile")}
          />
          <MenuItem
            icon="headset-outline"
            label="Support"
            onPress={() => navigation.navigate("Support")}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms & Conditions"
            onPress={() => navigation.navigate("TermsConditions")}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const MenuItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons name={icon} size={22} color="#4b3426" />
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color="#4b3426" />
  </TouchableOpacity>
);

export default NoBookingProfileScreen;

const styles = StyleSheet.create({
  header: {
    height: 223,
    backgroundColor: "#5C4435",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: "flex-end",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hey: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  profileLetter: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4b3426",
  },

  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4b3426",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#6F6F6F",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  ctaBtn: {
    marginTop: 20,
    backgroundColor: "#D07D23",
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 24,
    paddingVertical: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#4b3426",
    fontWeight: "600",
  },
});

