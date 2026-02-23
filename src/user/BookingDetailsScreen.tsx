import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
  
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import PhonePePaymentSDK from "react-native-phonepe-pg";
import { useAuth } from "../context/AuthContext";

/* =====================
   CONSTANTS
===================== */
const BASE_URL = "https://staging.cocoliving.in";
const MERCHANT_ID = "M23E2LC5I15OA_2511281216";
const ENVIRONMENT = "SANDBOX";

/* =====================
   HELPERS
===================== */
const decodeJwtPayload = (token: string) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const padded = payload + "==".slice(0, (4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (e) {
    console.error("JWT decode failed:", e);
    return null;
  }
};

const getQueryParam = (url: string, param: string) => {
  const regex = new RegExp(`[?&]${param}=([^&]*)`);
  const match = regex.exec(url);
  return match ? decodeURIComponent(match[1]) : null;
};

const BookingDetailsScreen = ({ route }) => {
  const booking = route?.params?.booking;
  const { user } = useAuth();
  const token = user?.token;

  const [loading, setLoading] = useState(true);

  const [remainingLoading, setRemainingLoading] = useState(false);
  const [extendLoading, setExtendLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [paymentSummary, setPaymentSummary] = useState(null);
  const [extension, setExtension] = useState(null);
  const [extendMonths, setExtendMonths] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  /* =====================
     FETCH DETAILS
  ===================== */
  useEffect(() => {
    if (booking?.id) fetchDetails();
  }, [booking]);

  const fetchDetails = async () => {
    try {
      const [paymentRes, extensionRes] = await Promise.all([
        axios.get(
          `${BASE_URL}/api/booking-payments/${booking.id}/summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${BASE_URL}/api/admin-booking/getExtension/${booking.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      setPaymentSummary(paymentRes.data || null);
      setExtension(extensionRes.data?.extension || null);
    } catch (e) {
      console.error("Fetch details error:", e);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load booking details",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     PHONEPE FLOW - FORCE SDK FOR BOTH
  ===================== */
  const startPhonePeFlow = async (initiateUrl, payload, flowType = "Unknown") => {
    console.log(`\n=== Starting PhonePe Flow: ${flowType} ===`);
    console.log("Payload:", payload);
    console.log("Initiate URL:", initiateUrl);

    let merchantOrderId: string | null = null;

    try {
      // 1️⃣ Init SDK
      console.log("Initializing SDK...");
      await PhonePePaymentSDK.init(
        ENVIRONMENT,
        MERCHANT_ID,
        `FLOW_${Date.now()}`,
        true
      );
      console.log("✅ SDK Initialized");

      // 2️⃣ Initiate API
      console.log("Calling initiate API...");
      const res = await axios.post(
        `${BASE_URL}${initiateUrl}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-client": "mobile",
          },
        }
      );
      console.log("✅ Initiate Response:", JSON.stringify(res.data, null, 2));

      // Extract base data
      merchantOrderId = res.data?.merchantOrderId;
      let phoneToken = res.data?.phonepe?.token;
      let phoneOrderId = res.data?.phonepe?.orderId;
      const redirectUrl = res.data?.redirectUrl;

      // 🔴 If structured data missing but redirectUrl present → extract for SDK
      if (!phoneToken && redirectUrl) {
        console.log("🔴 redirectUrl detected - extracting token for SDK use");
        const extractedToken = getQueryParam(redirectUrl, "token");
        if (extractedToken) {
          phoneToken = extractedToken;
          const jwtPayload = decodeJwtPayload(phoneToken);
          console.log("Extracted JWT payload:", jwtPayload);

          if (jwtPayload?.merchantOrderId) {
            merchantOrderId = jwtPayload.merchantOrderId;
            phoneOrderId = jwtPayload.merchantOrderId;
            console.log(`✅ Extracted - token & orderId (${phoneOrderId}) for SDK`);
          }
        } else {
          console.error("No token in redirectUrl");
        }
      }

      // 🟢 Try SDK flow if we have token + orderId
      if (phoneToken && phoneOrderId) {
        console.log("🟢 Attempting native SDK flow");

        const requestObj = {
          orderId: phoneOrderId,
          merchantId: MERCHANT_ID,
          token: phoneToken,
          paymentMode: { type: "PAY_PAGE" },
        };

        console.log("startTransaction request:", requestObj);

        await PhonePePaymentSDK.startTransaction(
          JSON.stringify(requestObj),
          null
        );
        console.log("✅ startTransaction called - SDK should open now");
      } else {
        if (redirectUrl) {
          console.log("🟡 Falling back to web redirectUrl");
          const supported = await Linking.canOpenURL(redirectUrl);
          if (supported) {
            await Linking.openURL(redirectUrl);
            Toast.show({
              type: "info",
              text1: "Payment opened in browser",
              text2: "Complete & return to app",
            });
          } else {
            throw new Error("Cannot open payment URL");
          }
        } else {
          throw new Error("Invalid PhonePe response - no token/orderId");
        }
      }

      if (!merchantOrderId) {
        throw new Error("Missing merchantOrderId for status check");
      }

      // 3️⃣ Polling
      console.log("Starting polling for merchantOrderId:", merchantOrderId);
      for (let i = 0; i < 40; i++) {
        console.log(`Poll ${i + 1}/40`);
        const statusRes = await axios.get(
          `${BASE_URL}/api/payments/status/${encodeURIComponent(merchantOrderId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const tx = statusRes.data?.transaction;
        const phonepeBody = statusRes.data?.phonepe?.body;

        const state =
          tx?.status?.toUpperCase() ||
          phonepeBody?.state?.toUpperCase() ||
          phonepeBody?.data?.state?.toUpperCase();

        console.log("Status:", state);

        if (state === "SUCCESS" || state === "COMPLETED") {
          Toast.show({ type: "success", text1: "Payment Successful" });
          fetchDetails();
          return;
        }

        if (["FAILED", "DECLINED", "TIMED_OUT"].includes(state)) {
          Toast.show({ type: "error", text1: "Payment Failed" });
          return;
        }

        await new Promise((r) => setTimeout(r, 3000));
      }

      Toast.show({
        type: "info",
        text1: "Payment Pending",
        text2: "Check in My Bookings",
      });
    } catch (error) {
      console.error(`❌ ${flowType} Error:`, error);
      Toast.show({ type: "error", text1: "Payment initiation failed" });
      throw error;
    }
  };

  /* =====================
     ACTIONS
  ===================== */
  const payRemaining = async () => {
    console.log("\n=== Pay Remaining Pressed ===");
    try {
      setRemainingLoading(true);
      await startPhonePeFlow(
        "/api/booking-payments/initiate-remaining",
        { bookingId: booking.id },
        "Pay Remaining"
      );
    } catch {
    } finally {
      setRemainingLoading(false);
    }
  };

  const requestExtension = async () => {
    console.log("\n=== Extend Pressed ===");
    console.log("Months:", extendMonths);

    if (!isExtendValid) {
      Toast.show({ type: "info", text1: "Enter valid months (≥1)" });
      return;
    }

    try {
      setExtendLoading(true);
      await startPhonePeFlow(
        "/api/booking-payments/initiate-extension",
        {
          bookingId: booking.id,
          months: Number(extendMonths),
        },
        "Extension"
      );
    } catch {
    } finally {
      setExtendLoading(false);
    }
  };

  const requestCancellation = async () => {
    try {
      setCancelLoading(true);
      await axios.post(
        `${BASE_URL}/api/book-room/requestCancellation/${booking.id}`,
        { reason: cancelReason.trim() || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Cancellation request sent successfully",
      });
      setCancelReason("");
      fetchDetails();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.response?.data?.message || "Failed to request cancellation",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const isExtendValid = extendMonths !== "" && /^\d+$/.test(extendMonths) && Number(extendMonths) >= 1;

  const cancelRequestStatus = booking?.cancelRequestStatus || "NONE";
  const canRequestCancel = booking?.status?.toLowerCase() === "approved" && ["NONE", "REJECTED"].includes(cancelRequestStatus);

  /* =====================
     UI SAFETY
  ===================== */
  if (!booking) return <View style={styles.center}><Text>No booking data</Text></View>;
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#C97B63" /></View>;

  /* =====================
     UI
  ===================== */
  return (
   <KeyboardAvoidingView
   style={{ flex: 1 }}
   behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
   keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
 >
<ScrollView
  style={{ flex: 1 }}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
  contentContainerStyle={{
    paddingHorizontal: 16,   // 👈 ADD THIS
    paddingTop: 16,          // 👈 optional but recommended
    paddingBottom: 120,
    flexGrow: 1,
  }}
>
      <Text style={styles.title}>Booking Details</Text>

      <InfoCard label="Property" value={booking.rateCard?.property?.name} />
      <InfoCard label="Room Type" value={booking.rateCard?.roomType} />
      <InfoCard label="Status" value={booking.displayStatus} />

      {paymentSummary && (
        <View style={styles.card}>
          <Text style={styles.section}>Payments</Text>
          <Row
            label="Remaining"
            value={`₹${paymentSummary.totals?.remainingRupees}`}
          />
        </View>
      )}

      {/* PAY REMAINING */}
      {booking.bookingType === "PREBOOK" && booking.paymentStatus === "PARTIAL" && (
        <PrimaryButton
          text={remainingLoading ? "Processing..." : "Pay Remaining Amount"}
          onPress={payRemaining}
          disabled={remainingLoading}
        />
      )}

      {/* CANCELLATION REQUEST */}
      {booking.status && ["approved", "cancelled"].includes(booking.status.toLowerCase()) && (
        <View style={styles.card}>
          <Text style={styles.section}>Cancellation Request</Text>

          {canRequestCancel && (
            <>
              <Text style={styles.helper}>Reason for cancellation (optional)</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="Enter reason..."
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
                numberOfLines={4}
              />
              <DestructiveButton
                text={cancelLoading ? "Processing..." : "Request Cancellation"}
                onPress={requestCancellation}
                disabled={cancelLoading}
              />
            </>
          )}

          {cancelRequestStatus === "PENDING" && (
            <Text style={styles.helper}>
              Cancellation request sent. Awaiting admin approval.
            </Text>
          )}

          {cancelRequestStatus === "APPROVED" && (
            <Text style={styles.helper}>
              Cancellation request approved.
              {"\n"}
              <Text style={{ fontFamily: "Quicksand-Bold" }}>
                New checkout date: {booking.cancelEffectiveCheckOutDate || "N/A"}
              </Text>
            </Text>
          )}

          {cancelRequestStatus === "REJECTED" && (
            <Text style={[styles.helper, { color: "#d32f2f" }]}>
              Cancellation request was rejected by admin.
            </Text>
          )}
        </View>
      )}

      {/* EXTEND STAY */}
      <View style={styles.card}>
        <Text style={styles.section}>Extend Stay</Text>
        <Text style={styles.helper}>Enter months to extend (minimum 1)</Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. 1"
          keyboardType="numeric"
          value={extendMonths}
          onChangeText={(text) => {
            if (text === "" || /^\d+$/.test(text)) setExtendMonths(text);
          }}
        />

        <PrimaryButton
          text={extendLoading ? "Processing..." : "Pay & Extend"}
          onPress={requestExtension}
          disabled={extendLoading || !isExtendValid}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>

    </KeyboardAvoidingView>
  );
};

export default BookingDetailsScreen;

/* =====================
   UI COMPONENTS & STYLES
===================== */
const InfoCard = ({ label, value }) => (
  <View style={styles.block}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const PrimaryButton = ({ text, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.btn, disabled && { opacity: 0.6 }]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.btnText}>{text}</Text>
  </TouchableOpacity>
);

const DestructiveButton = ({ text, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.btn, { backgroundColor: "#d32f2f" }, disabled && { opacity: 0.6 }]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.btnText}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F2", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontFamily: "Quicksand-Bold", color: "#4B3426", marginBottom: 18 , marginTop:20 , textAlign:'center' },
  block: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10 },
  label: { fontSize: 12, fontFamily: "Quicksand-Medium", color: "#7A6658" },
  value: { fontSize: 15, fontFamily: "Quicksand-SemiBold", color: "#4B3426", marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 14 },
  section: { fontSize: 16, fontFamily: "Quicksand-Bold", marginBottom: 6, color: "#4B3426" },
  helper: { fontSize: 12, fontFamily: "Quicksand-Medium", color: "#777", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { fontFamily: "Quicksand-Medium", color: "#555" },
  rowValue: { fontFamily: "Quicksand-Bold" },
  input: { borderWidth: 1, borderColor: "#C9B297", borderRadius: 10, padding: 12, fontFamily: "Quicksand-Medium", marginBottom: 12 },
  btn: { backgroundColor: "#F6A452", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontFamily: "Quicksand-Bold", fontSize: 15 },
});