import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Linking,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Toast from "react-native-toast-message";
import axios from "axios";
import colors from "../constants/color";
import Config from "react-native-config";

export const BASE_URL = Config.API_BASE_URL;

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const token = user?.token;

  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const userName = user?.fullName || "User";
  const userType = user?.userType || "Professional";
  const firstLetter = userName.charAt(0).toUpperCase();

  // Check active booking (same logic as App.tsx)
  const checkBookingStatus = async () => {
    if (!token) {
      setHasActiveBooking(false);
      setLoadingBooking(false);
      return;
    }

    try {
      const response = await axios.get(
        `${BASE_URL}/api/book-room/getUserBookings?page=1&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bookings = response?.data?.bookings || [];

      const active = bookings.find(
        (b: any) =>
          b.displayStatus?.toLowerCase() === "active" ||
          b.displayStatus?.toLowerCase() === "approved"
      );

      setHasActiveBooking(!!active);
    } catch (error) {
      console.log("Booking check error:", error);
      setHasActiveBooking(false);
    } finally {
      setLoadingBooking(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkBookingStatus();
    }, [token])
  );

  useEffect(() => {
    checkBookingStatus();
  }, []);

  const performLogout = () => {
    setShowLogoutModal(false);
    logout();
    Toast.show({
      type: "success",
      text1: "Logged out successfully",
    });
  };

const openWhatsApp = async () => {
  const phoneNumber = "918141676967"; // 91 + number
  const url = `https://wa.me/${phoneNumber}`;

  const supported = await Linking.canOpenURL(url);

  if (supported) {
    Linking.openURL(url);
  } else {
    Toast.show({
      type: "error",
      text1: "WhatsApp not available",
      text2: "Please install WhatsApp to continue",
    });
  }
};
  const MenuItem = ({ icon, label, onPress = () => {} }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#4b3426" />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#4b3426" />
    </TouchableOpacity>
  );

  // Booked User Menu Items
  const bookedMenu = (
    <>
      <MenuItem
        icon="create-outline"
        label="Edit profile information"
        onPress={() => navigation.navigate("Profile")}
      />
        <MenuItem
        icon="call-outline"
        label="Contact Us"
        onPress={() => Linking.openURL("tel:+918141676967")}
      />
      <MenuItem
  icon="mail-outline"
  label="Email Us"
  onPress={() => Linking.openURL("mailto:info@cocoliving.in")}
/>
      <MenuItem
        icon="card-outline"
        label="Payment history"
        onPress={() => navigation.navigate("PaymentScreen")}
      />
      <MenuItem
        icon="finger-print-outline"
        label="Verification Status"
        onPress={() => navigation.navigate("VerificationStatus")}
      />
      <MenuItem
        icon="home-outline"
        label="My Bookings"
        onPress={() => navigation.navigate("MyBookings")}
      />
       <MenuItem
        icon="home-outline"
        label="Guest Pass"
        onPress={() => navigation.navigate("GuestVisit")}
      />
      <MenuItem
        icon="headset-outline"
        label="Support"
        onPress={() => navigation.navigate("Support")}
      />
      <MenuItem
        icon="book-outline"
        label="Rules"
        onPress={() => navigation.navigate("CommunityRules")}
      />
      <MenuItem
        icon="document-text-outline"
        label="Terms & Conditions"
        onPress={() => navigation.navigate("TermsConditions")}
      />
      {/* <MenuItem
        icon="car-outline"
        label="Gate Pass"
        onPress={() => navigation.navigate("GatePassScreen")}
      /> */}
      {/* <MenuItem
  icon="finger-print-outline"
  label="Sign Contract"
  onPress={() => navigation.navigate("ContractSign")}
/> */}
      {/* <MenuItem icon="settings-outline" label="Settings" onPress={()=>navigation.navigate("notificationSettingScreen")} /> */}
    </>
  );

  // Non-Booked User Menu Items (exact as screenshot)
  const nonBookedMenu = (
    <>
      <MenuItem
        icon="person-outline"
        label="Personal Information"
        onPress={() => navigation.navigate("Profile")}
      />
      <MenuItem icon="calendar-outline" label="Visit"
      onPress={()=> navigation.navigate("myVisit")} />
      <MenuItem
        icon="call-outline"
        label="Contact Us"
        onPress={() => Linking.openURL("tel:+918141676967")}
      />
      <MenuItem
  icon="mail-outline"
  label="Email Us"
  onPress={() => Linking.openURL("mailto:info@cocoliving.in")}
/>
      <MenuItem icon="information-circle-outline" label="About Us" onPress={()=>navigation.navigate("AboutUsScreen")} />

       <MenuItem
        icon="finger-print-outline"
        label="Verification Status"
        onPress={() => navigation.navigate("VerificationStatus")}
      />
    </>
  );

  if (loadingBooking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

return (
  <View style={styles.container}>
    
    {/* ================= STATIC HEADER ================= */}
    <LinearGradient
      colors={["#855838", "#4F3421"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradientHeader}
    >
     <View style={styles.topRow}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Ionicons name="chevron-back" size={26} color="#fff" />
  </TouchableOpacity>

  <Text style={styles.headerTitle}>Profile</Text>

  <View style={{ width: 26 }} />
</View>

      <View style={styles.profileRow}>
        <View style={styles.avatarWrapper}>
          {user?.profileImage ? (
            <Image
              source={{ uri: `${BASE_URL}${user.profileImage}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstLetter}</Text>
            </View>
          )}
        </View>

        <View style={{ marginLeft: 14 }}>
          <Text style={styles.name}>{userName}</Text>
          <View style={styles.roleRow}>
  <Text style={styles.role}>
    {userType ? userType.charAt(0).toUpperCase() + userType.slice(1) : ""}
  </Text>
</View>
        </View>
      </View>
    </LinearGradient>

    {/* ================= SCROLLABLE SECTION ================= */}
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* MENU CARD */}
      <View style={styles.mainCard}>
        {hasActiveBooking ? bookedMenu : nonBookedMenu}

        <MenuItem
          icon="log-out-outline"
          label="Logout"
          onPress={() => setShowLogoutModal(true)}
        />
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialItem}
            onPress={() => Linking.openURL("https://www.facebook.com/share/1Ae125fc77/")}
          >
            <Image
              source={require("../../assets/images/fb.png")}
              style={styles.socialIcon}
            />
          </TouchableOpacity>

          <View style={styles.verticalBorder} />

          <TouchableOpacity
            style={styles.socialItem}
            onPress={() => Linking.openURL("https://www.instagram.com/cocoliving.in?igsh=MWlxeDNxOTJ1ZTZ0bQ==")}
          >
            <Image
              source={require("../../assets/images/instagram.png")}
              style={styles.socialIcon}
            />
          </TouchableOpacity>

          <View style={styles.verticalBorder} />

          <View style={styles.socialItem}>
            <Image
              source={require("../../assets/images/cocoLogo.png")}
              style={styles.cocoLogo}
            />
          </View>

          <View style={styles.verticalBorder} />

          <TouchableOpacity onPress={openWhatsApp}>
            <View style={styles.socialItem}>
              <Image
                source={require("../../assets/images/whatsapp.png")}
                style={styles.cocoLogo}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.poweredRow}>
          <Text style={styles.poweredBy}>Powered by </Text>
          <Image
            source={require("../../assets/images/koncpt.png")}
            style={styles.koncptImage}
          />
        </View>
      </View>
    </ScrollView>

    {/* ================= LOGOUT MODAL ================= */}
    <Modal transparent visible={showLogoutModal} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Confirm Logout</Text>
          <Text style={styles.modalMessage}>
            Are you sure you want to logout?
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelBtn]}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, styles.logoutBtn]}
              onPress={performLogout}
            >
              <Text style={styles.logoutTextBtn}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    <Toast />
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  gradientHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

 topRow: {
  flexDirection: "row",
  alignItems: "center",
  gap:20,
  paddingHorizontal: 4,  // optional slight balance
},

  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "Quicksand-Bold",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10,
  },

  avatarWrapper: {
    position: "relative",
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E6D6C7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: colors.nOrange,
  },

  avatarText: {
    fontSize: 40,
    fontFamily: "Quicksand-Bold",
    color: "#4F3421",
  },

  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
  },

  name: {
    fontSize: 24,
    fontFamily: "Quicksand-Bold",
    color: "#fff",
  },

  roleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  role: {
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#fff",
  },

  mainCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    paddingVertical: 8,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
    marginHorizontal: 5,
    marginVertical: 4,
    borderRadius: 12,
  },

  menuLabel: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#4b3426",
  },

  footer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },

  /* NEW: White container with vertical borders */
  socialContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 30,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginHorizontal:20,
    shadowOffset: { width: 0, height: 2 },
  },

  socialItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  verticalBorder: {
    width: 1,
    backgroundColor: "#ddd",
  },

  socialIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },

  cocoLogo: {
    width: 80,
    height: 28,
    resizeMode: "contain",
  },

  poweredRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  poweredBy: {
    fontSize: 14,
    color: "#888",
    fontFamily: "Quicksand-Regular",
  },

  koncptImage: {
    width: 60,
    height: 18,
    resizeMode: "contain",
    marginLeft: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
  },

  modalTitle: {
    fontSize: 20,
    fontFamily: "Quicksand-Bold",
    color: "#4b3426",
    textAlign: "center",
  },

  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 16,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },

  modalBtn: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
  },

  cancelBtn: {
    backgroundColor: "#ddd",
  },

  logoutBtn: {
    backgroundColor: "#4b3426",
  },

  cancelText: {
    fontFamily: "Quicksand-SemiBold",
    color: "#333",
  },

  logoutTextBtn: {
    fontFamily: "Quicksand-Bold",
    color: "#fff",
  },
});

export default ProfileScreen;