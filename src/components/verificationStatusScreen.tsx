import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  TextInput,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";

/* ---------------------- Constants ---------------------- */
const baseURLN = "https://staging.cocoliving.in";
const baseURL = "https://prod.idto.ai";
const DIGI_API_KEY = "myXTggzjQ37FWJKfwvVWIqu7TbFdgclZaWskIzY2SCg";
const DIGI_CLIENT_ID = "07e90e88-a3ff-48ed-9a30-8716060a8af2";

/* ---------------------- LIST ---------------------- */
const DATA = [
  { id: "1", label: "Mobile Number", icon: "call-outline", library: "Ionicons" },
  { id: "2", label: "Email ID", icon: "mail-outline", library: "Ionicons" },
  {
    id: "3",
    label: "KYC",
    icon: "card-account-details-outline",
    library: "MaterialCommunityIcons",
  },
];

const VerificationStatusScreen = () => {
  const { user, refreshUser } = useAuth();

  const [showKycOptions, setShowKycOptions] = useState(false);

  /* OTP states (common for phone + email) */
  const [showOTPFor, setShowOTPFor] = useState(null); // "phone" | "email"
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  /* PAN & Aadhaar */
  const [panLoading, setPanLoading] = useState(false);
  const [aadhaarLoading, setAadhaarLoading] = useState(false);
  const [panNumber, setPanNumber] = useState("");

  /* ---------------------- STATUS LOGIC ---------------------- */
  const isItemVerified = (item) => {
    if (item.id === "1") return user?.isPhoneVerified;
    if (item.id === "2") return user?.isEmailVerified;
    if (item.id === "3")
      return user?.isPanVerified && user?.isAadhaarVerified;
    return false;
  };

  /* ---------------------- SEND OTP ---------------------- */
  const sendOTP = async (type) => {
    try {
      setOtpLoading(true);

      await axios.post(
        `${baseURLN}/api/user/profile/verify/send-otp`,
        {
          type,
          identifier: type === "phone" ? user.phone : user.email,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      Toast.show({ type: "success", text1: "OTP sent" });
      setShowOTPFor(type);
    } catch {
      Toast.show({ type: "error", text1: "Failed to send OTP" });
    } finally {
      setOtpLoading(false);
    }
  };

  /* ---------------------- VERIFY OTP ---------------------- */
  const verifyOTP = async () => {
    if (!otp) {
      Toast.show({ type: "error", text1: "Enter OTP" });
      return;
    }

    try {
      setOtpLoading(true);

      const res = await axios.post(
        `${baseURLN}/api/user/profile/verify/verify-otp`,
        {
          type: showOTPFor,
          identifier:
            showOTPFor === "phone" ? user.phone : user.email,
          otp,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (
        (showOTPFor === "phone" && res.data?.isPhoneVerified) ||
        (showOTPFor === "email" && res.data?.isEmailVerified)
      ) {
        Toast.show({ type: "success", text1: "Verified successfully" });
        setShowOTPFor(null);
        setOtp("");
        await refreshUser(); // 🔥 refresh auth user
      }
    } catch {
      Toast.show({ type: "error", text1: "Invalid OTP" });
    } finally {
      setOtpLoading(false);
    }
  };

  /* ---------------------- KYC ---------------------- */
  const handleVerifyPan = async () => {
    if (!panNumber) {
      Toast.show({ type: "error", text1: "Enter PAN Number" });
      return;
    }
    try {
      setPanLoading(true);
      await axios.post(
        `${baseURLN}/api/pan/verify-pan`,
        { panNumber },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      Toast.show({ type: "success", text1: "PAN Verified" });
      refreshUser();
    } catch {
      Toast.show({ type: "error", text1: "PAN verification failed" });
    } finally {
      setPanLoading(false);
    }
  };

  const startAadhaarVerification = async () => {
    try {
      setAadhaarLoading(true);
      const res = await axios.post(
        `${baseURL}/verify/digilocker/initiate_session`,
        {
          consent: true,
          consent_purpose: "KYC Verification",
          redirect_url: "cocoliving://digilocker/callback",
          documents_for_consent: ["aadhaar"],
        },
        {
          headers: {
            "X-API-KEY": DIGI_API_KEY,
            "X-Client-ID": DIGI_CLIENT_ID,
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      if (res?.data?.url) Linking.openURL(res.data.url);
    } catch {
      Toast.show({ type: "error", text1: "Aadhaar verification failed" });
    } finally {
      setAadhaarLoading(false);
    }
  };

  /* ---------------------- RENDER ITEM ---------------------- */
  const renderItem = ({ item }) => {
    const verified = isItemVerified(item);
    const isKYC = item.id === "3";

    return (
      <View>
        {/* MAIN ROW */}
        <TouchableOpacity
          style={styles.rowCard}
          activeOpacity={0.7}
          onPress={() => isKYC && setShowKycOptions(!showKycOptions)}
        >
          <View style={styles.leftRow}>
            <View style={styles.iconBox}>
              {item.library === "Ionicons" ? (
                <Ionicons name={item.icon} size={20} color="#7A5F4A" />
              ) : (
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color="#7A5F4A"
                />
              )}
            </View>
            <Text style={styles.itemLabel}>{item.label}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              verified ? styles.greenBadge : styles.redBadge,
            ]}
          >
            <Ionicons
              name={verified ? "checkmark" : "close"}
              size={16}
              color="#fff"
            />
          </View>
        </TouchableOpacity>

        {/* EMAIL / PHONE VERIFY */}
        {!verified && !isKYC && (
          <View style={{ marginTop: 12 }}>
            {showOTPFor !== (item.id === "1" ? "phone" : "email") ? (
              <TouchableOpacity
                style={styles.bigButton}
                onPress={() =>
                  sendOTP(item.id === "1" ? "phone" : "email")
                }
                disabled={otpLoading}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.bigButtonText}>
                    Verify {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <TextInput
                  placeholder="Enter OTP"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  style={styles.panInput}
                />
                <TouchableOpacity
                  style={[styles.bigButton, { marginTop: 10 }]}
                  onPress={verifyOTP}
                  disabled={otpLoading}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.bigButtonText}>Submit OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* KYC OPTIONS */}
        {isKYC && showKycOptions && (
          <View style={{ marginTop: 14 }}>
            <TextInput
              placeholder="Enter PAN Number"
              value={panNumber}
              onChangeText={setPanNumber}
              style={styles.panInput}
            />

            <TouchableOpacity
              style={styles.bigButton}
              onPress={handleVerifyPan}
            >
              {panLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bigButtonText}>Verify PAN</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bigButton, { marginTop: 16 }]}
              onPress={startAadhaarVerification}
            >
              {aadhaarLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.bigButtonText}>
                  Verify Aadhaar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chevron-back" size={26} color="#7A5F4A" />
        <Text style={styles.headerTitle}>Verification Status</Text>
      </View>

      <Text style={styles.subtitle}>
        Your secure profile ensures a trusted community experience.
      </Text>

      <FlatList
        data={DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      <Toast />
    </SafeAreaView>
  );
};

export default VerificationStatusScreen;

/* ---------------------- Styles ---------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
    marginTop: 30,
  },
  header: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    color: "#4F3421",
    marginRight: 26,
    fontFamily:'Quicksand-Bold'
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    color: "#AC9478",
    marginBottom: 16,
    fontFamily:'Quicksand-Bold'
  },
  rowCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftRow: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#FBF6F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemLabel: { fontSize: 16, color: "#3E2B24" },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  greenBadge: { backgroundColor: "#2AA84F" },
  redBadge: { backgroundColor: "#D64545" },
  bigButton: {
    backgroundColor: "#5A3F2E",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  bigButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  panInput: {
    backgroundColor: "#f3f3f3",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 4,
  },
});
