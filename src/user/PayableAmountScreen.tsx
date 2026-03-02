import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import PhonePePaymentSDK from "react-native-phonepe-pg";

/* =====================
   CONSTANTS
===================== */
const MERCHANT_ID = "M23E2LC5I15OA_2511281216";
const ENVIRONMENT = "SANDBOX";
const BASE_URL = "https://staging.cocoliving.in";

/* =====================
   SCREEN
===================== */
const PayableAmountScreen = ({ route, navigation }) => {
 const {
  room,
  property,
  rent,
  monthsNumber,
  isoDate,
  netPayable,
  preBookAmount,
  actionType,

  // ✅ RECEIVED HERE
  preferredFloor,
  preferredRoomNumber,
  preferredBed,
} = route.params;

  const { user } = useAuth();
  const token = user?.token;
  const [loading, setLoading] = useState(false);

  /* =====================
     CALCULATIONS
  ===================== */
  const securityDeposit = rent * 2;
  const finalPayable =
    actionType === "PreBook" ? preBookAmount : netPayable;

  const proceedBtnText =
    actionType === "PreBook"
      ? "Proceed To Pre-book"
      : "Proceed To Book";

  /* =====================
     PAYMENT FLOW
  ===================== */
  const startPayment = async () => {
    let merchantOrderId = null;

    try {
      setLoading(true);

      console.log("[PhonePe] Starting payment flow");

      // 1️⃣ SDK Init
      console.log("[PhonePe] Initializing SDK");
      await PhonePePaymentSDK.init(
        ENVIRONMENT,
        MERCHANT_ID,
        `FLOW_${Date.now()}`,
        true
      );
      console.log("[PhonePe] SDK initialized");

      // 2️⃣ Initiate API
      const payload = {
        userId: Number(user.id),
        bookingType: actionType === "PreBook" ? "PREBOOK" : "BOOK",
       metadata: {
  rateCardId: room.rateCardId,
  propertyId: room.propertyId,
  roomType: room.roomType,
  checkInDate: isoDate,
  duration: monthsNumber,
  monthlyRent: rent,

  // ✅ PREFERENCES (MISSING PART)
  preferredFloor: preferredFloor ?? null,
  preferredRoomNumber: preferredRoomNumber ?? null,
  preferredBed: preferredBed ?? null,
},
        clientType: "mobile",
      };
      console.log("Payload which will sent: ",payload)

      console.log("[PhonePe] Sending initiate payload:", payload);

      const res = await axios.post(
        `${BASE_URL}/api/booking-payments/initiate`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-client": "mobile",
          },
        }
      );

      console.log("[PhonePe] Initiate response:", res.data);

      merchantOrderId = res.data?.merchantOrderId;
      const phoneToken = res.data?.phonepe?.token;
      const phoneOrderId = res.data?.phonepe?.orderId;

      if (!phoneToken || !phoneOrderId || !merchantOrderId) {
        throw new Error("Missing required PhonePe data");
      }

      console.log("[PhonePe] merchantOrderId:", merchantOrderId);
      console.log("[PhonePe] phoneOrderId:", phoneOrderId);
      console.log("[PhonePe] Token length:", phoneToken.length);

      // 3️⃣ Prepare & Start Transaction
      const requestObj = {
        orderId: phoneOrderId,
        merchantId: MERCHANT_ID,
        token: phoneToken,
        paymentMode: { type: "PAY_PAGE" },
      };
      const requestString = JSON.stringify(requestObj);

      console.log("[PhonePe] Starting transaction with:", requestObj);

      const sdkResult = await PhonePePaymentSDK.startTransaction(requestString, null);

      console.log("[PhonePe] SDK returned (ignored in sandbox):", sdkResult);

      // 4️⃣ Web-like polling using SAME API as web (/api/payments/status/)
      console.log("[PhonePe] Starting polling with web's status API");

      let attempts = 0;
      const maxAttempts = 40; // ~120 seconds like web
      const pollInterval = 3000;
      let stopped = false;

      while (attempts < maxAttempts && !stopped) {
        attempts++;
        console.log(`[PhonePe] Poll attempt #${attempts}`);

        const statusRes = await axios.get(
          `${BASE_URL}/api/payments/status/${encodeURIComponent(merchantOrderId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("[PhonePe] Status API response:", statusRes.data);

        const tx = statusRes.data?.transaction;
        const state =
          tx?.status?.toUpperCase() ||
          statusRes.data?.phonepe?.body?.state?.toUpperCase() ||
          "UNKNOWN";

        console.log("[PhonePe] Detected state:", state);

        // SUCCESS
        if (state === "SUCCESS" || state === "COMPLETED") {
          console.log("[PhonePe] Payment SUCCESS confirmed");
          Toast.show({
            type: "success",
            text1: "Payment Successful!",
            text2: "Redirecting...",
          });

          stopped = true;

         setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "BookingSuccessScreen",
            params: {
              bookingId: statusRes.data.bookingId || tx?.bookingId,
              amountPaid: finalPayable,
              transactionId: merchantOrderId,
              userEmail: user.email,
              userPhone: user.phone,
              roomType: room.roomType,
              checkInDate: isoDate,
              duration: monthsNumber,
            },
          },
        ],
      });
    }, 2500);

    return;
  }

        // FAILED
        if (state === "FAILED" || state === "DECLINED" || state === "TIMED_OUT") {
          console.log("[PhonePe] Payment FAILED confirmed");
          stopped = true;
          navigation.reset({
      index: 0,
      routes: [
        {
          name: "PaymentFailedScreen",
          params: {
            transactionId: merchantOrderId,
            amount: finalPayable,
            reason: "Payment Failed",
          },
        },
      ],
    });

    return;
  }

        // Continue polling
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      // Timeout
      if (!stopped) {
        console.log("[PhonePe] Polling timeout");
        navigation.replace("PaymentFailedScreen", {
          transactionId: merchantOrderId,
          amount: finalPayable,
          reason: "Timeout while waiting for status. Check My Bookings later.",
        });
      }

} catch (err: any) {
  console.log("[PhonePe] Exception:", err?.response?.data || err);

  const errorData = err?.response?.data;
  const backendMessage =
    errorData?.message || "Something went wrong. Please try again.";

  // ✅ CASE 1: KYC REQUIRED
  if (
    errorData?.code === "KYC_REQUIRED" ||
    backendMessage.toLowerCase().includes("kyc")
  ) {
    Toast.show({
      type: "info",
      text1: "KYC Required",
      text2: "Please complete KYC to continue booking",
    });

    setLoading(false);

    // 👉 Direct KYC screen
    navigation.replace("VerificationStatus");
    return;
  }

  // ✅ CASE 2: Already active / pending booking
  if (
    backendMessage.includes("already have an active") ||
    backendMessage.includes("pending booking")
  ) {
    Toast.show({
      type: "info",
      text1: backendMessage,
    });
    setLoading(false);
    return;
  }

  // ❌ बाकी सभी errors
  Toast.show({
    type: "error",
    text1: "Booking Error",
    text2: backendMessage,
  });

  navigation.replace("PaymentFailedScreen", {
    transactionId: merchantOrderId || "unknown",
    amount: finalPayable,
    reason: backendMessage,
  });

} finally {
      setLoading(false);
      console.log("[PhonePe] Flow ended");
    }
  };

  /* =====================
     UI (full detailed version)
  ===================== */
return (
  <View style={{ flex: 1, backgroundColor: "#fff" }}>

    {/* 🔒 FIXED HEADER */}
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={26} color="#3C2A1E" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Payable Amount</Text>
    </View>

    {/* SCROLLABLE CONTENT */}
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: 120,   // 👈 extra space for bottom
      }}
    >

      {/* Room Card */}
    <View style={styles.roomCard}>
              <Image
                source={{
                  uri:
                    room.roomImages?.length > 0
                      ? `${BASE_URL}${room.roomImages[0]}`
                      : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600",
                }}
                style={styles.thumb}
              />
    
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text style={styles.roomType}>{room.roomType}</Text>
                <Text style={styles.propertyName}>{property?.name}</Text>
    
                <View style={styles.addressRow}>
                  <Ionicons name="location" size={14} color="#7D6C54" />
                  <Text style={styles.addressText}>{property?.address}</Text>
                </View>
              </View>
            </View>

      {/* Price Breakdown */}
      <View style={styles.box}>
       <Row
  title="Rent"
  subtitle={`₹ ${rent} x ${monthsNumber} months`}
  value={`₹ ${(rent * monthsNumber).toLocaleString()}`}
/>

       <Row
  title="Security Deposit"
  subtitle="2 months rent"
  value={`₹ ${securityDeposit.toLocaleString()}`}
/>

        <View style={styles.dashedLine} />

        {actionType === "Book" && (
         <Row
  title="Net Payable"
  subtitle="Total Booking Value"
  value={`₹ ${netPayable.toLocaleString()}`}
  bold
/>
        )}

        {actionType === "PreBook" && (
          <>
            <Row
  title="Total Booking Value"
  subtitle="Including Taxes"
  value={`₹ ${netPayable.toLocaleString()}`}
/>
            <View style={styles.dashedLine} />
            <Row
  title="Pre-Book "
  subtitle="Amount Payable Now"
  value={`₹ ${preBookAmount.toLocaleString()}`}
  bold
/>
          </>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          Booking details will be sent to{"\n"}
          {user.phone} | {user.email}
        </Text>
      </View>

      {/* Policy */}
      <Text style={styles.sectionTitle}>Cancellation Policy</Text>
      <Text style={styles.policyText}>
      <Text style={styles.subCancel}>Please review carefully before confirming {"\n"} your booking:

</Text> 
        {"\n"}
        • All bookings are non-refundable.{"\n"}
        • Rooms are subject to availability.{"\n"}
        • No changes once confirmed.{"\n"}
        • By proceeding, you agree to the terms.
      </Text>

      {/* Proceed */}
      <TouchableOpacity
        style={styles.proceedBtn}
        onPress={startPayment}
        disabled={loading}
      >
        <Text style={styles.proceedText}>
          {loading
            ? "Processing... Please wait"
            : `${proceedBtnText} `}
        </Text>
      </TouchableOpacity>
      </ScrollView>
  </View>
);
};

/* =====================
   ROW COMPONENT
===================== */
const Row = ({ title, subtitle, value, bold }) => (
  <View style={styles.row}>
    
    {/* Left side */}
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowTitle, bold && styles.boldText]}>
        {title}
      </Text>

      {subtitle && (
        <Text style={styles.rowSubText}>
          {subtitle}
        </Text>
      )}
    </View>

    {/* Right side */}
    <View style={{ justifyContent: "flex-end" }}>
      <Text style={[styles.rowValue, bold && styles.boldText]}>
        {value}
      </Text>
    </View>

  </View>
);

export default PayableAmountScreen;

/* =====================
   STYLES
===================== */
const styles = StyleSheet.create({

header: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 20,
  marginTop: 30,
  marginBottom: 10,
  gap: 20,
},

headerTitle: {
  fontSize: 22,
  fontFamily: "Quicksand-Bold",
  color: "#4f3421",
},

proceedBtn: {
  backgroundColor: "#f6a452",
  borderRadius: 10,
  paddingVertical: 14,
  marginTop: 30,
  marginBottom: 40,   // 👈 extra margin so it doesn't merge with nav
},

  roomCard: {
    flexDirection: "row",
    backgroundColor: "#EDE7DF",
    // padding: 10,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "center",
    marginTop:5
  },


  thumb: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },

  roomType: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#8C8C8C",
  },

  propertyName: {
    fontSize: 18,
    fontFamily: "Quicksand-Medium",
    color: "#4F3421",
  },

  addressRow: { flexDirection: "row", marginTop: 4 },
  addressText: {
    fontSize: 12,
    marginLeft: 4,
    color: "#AC9478",
    fontFamily: "Quicksand-Medium",
  },

box: {
  backgroundColor: "#fff",
  marginTop: 10,
  borderRadius: 16,
  paddingVertical: 16,
  paddingHorizontal: 10,

  // Android
  elevation: 8,

  // iOS (very important for same feel)
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
},

 row: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 18,
},
rowTitle: {
  fontSize: 12,
  color: "#3C2A1E",
  fontFamily: "Quicksand-Bold",
},

rowSubText: {
  marginTop: 2,
  fontSize: 10,
  color: "#000000", // 👈 lighter color (difference visible)
  fontFamily: "Quicksand-Regular",
},

boldText: {
  fontFamily: "Quicksand-Bold",
},

 rowLabel: {
  fontSize: 13,
  color: "#6F5A44",
  lineHeight: 18,
  fontFamily: "Quicksand-Regular",
},

rowValue: {
  fontSize: 16,
  color: "#3C2A1E",
  fontFamily: "Quicksand-Bold",
},

 dashedLine: {
  borderBottomWidth: 1,
  borderStyle: "dashed",
  borderColor: "#D2C3AD",
  marginVertical: 8,
},

  infoRow: {
    marginTop: 20,
    backgroundColor: "#EDE7DF",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  infoText: {
    color: "#4f3421",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily:'Quicksand-Bold',
    color: "#3C2A1E",
    marginTop: 26,
  },
  subCancel:{
    fontFamily:'Quicksand-Regular',
    fontSize:14,
    color: "#000000",
  },

  policyText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    fontFamily:'Quicksand-Regular',
    color: "#000000",
  },

  proceedBtn: {
    backgroundColor: '#f6a452',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 30,
    marginBottom: 30,
  },

  proceedText: {
    color: "#fff",
    textAlign: "center",
    fontFamily:'Quicksand-Bold',
    fontSize: 20,
  
  },
});