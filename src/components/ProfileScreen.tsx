import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import Ionicons from "react-native-vector-icons/Ionicons";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const userName = user?.fullName || "User";
  const userEmail = user?.email || "youremail@domain.com";
  const userPhone = user?.phone || "+91 XXXXXXXXXX";
  const firstLetter = userName.charAt(0);

  const MenuItem = ({ icon, label, onPress = () => {} }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons name={icon} size={22} color="#4b3426" />
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color="#4b3426" />
  </TouchableOpacity>
);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f3f3f3" }}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#4b3426" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* User Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{firstLetter}</Text>
        </View>

        <View style={{ marginLeft: 15 }}>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.phone}>{userPhone}</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>

        <TouchableOpacity style={styles.cameraBtn}>
          <Ionicons name="camera-outline" size={20} color="#4b3426" />
        </TouchableOpacity>
      </View>

      {/* MENU CARDS */}
      <View style={styles.card}>
        <MenuItem
          icon="create-outline"
          label="Edit profile information"
          onPress={() => navigation.navigate("EditProfile")}
        />
        <MenuItem icon="card-outline" label="Payment history" />
        <MenuItem icon="finger-print-outline" label="Verification Status" />
      </View>

      <View style={styles.card}>
<MenuItem
  icon="headset-outline"
  label="Support"
  onPress={() =>
    navigation.navigate("Support")
  }
/>       
<MenuItem icon="book-outline" label="Rules" />
        <MenuItem icon="document-text-outline" label="Terms & Conditions" />
      </View>

      <View style={styles.card}>
        <MenuItem icon="settings-outline" label="Settings" />
        <MenuItem icon="log-out-outline" label="Logout" />
      </View>

    </ScrollView>
  );
};

// const MenuItem = ({ icon, label, onPress }) => (
//   <TouchableOpacity style={styles.menuItem} onPress={onPress}>
//     <Ionicons name={icon} size={22} color="#4b3426" />
//     <Text style={styles.menuLabel}>{label}</Text>
//     <Ionicons name="chevron-forward" size={20} color="#4b3426" />
//   </TouchableOpacity>
// );

export default ProfileScreen;

const styles = StyleSheet.create({
  header: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4b3426",
  },

  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
    position: "relative",
  },

  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 35,
    fontWeight: "700",
    color: "#4b3426",
  },

  cameraBtn: {
    position: "absolute",
    right: 40,
    top: 65,
    backgroundColor: "#fff",
    padding: 7,
    borderRadius: 20,
    elevation: 3,
  },

  name: { fontSize: 20, fontWeight: "700", color: "#4b3426" },
  phone: { color: "#4b3426", marginTop: 4 },
  email: { color: "#4b3426", marginTop: 2, fontSize: 13 },

  card: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 14,
    paddingVertical: 8,
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
