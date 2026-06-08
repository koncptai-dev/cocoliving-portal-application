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
  Alert,
  
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import PhonePePaymentSDK from "react-native-phonepe-pg";
import { useAuth } from "../context/AuthContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import Config from "react-native-config";



import { Modal } from "react-native";
import { WebView } from "react-native-webview";

/* =====================
   CONSTANTS
===================== */
export const BASE_URL = Config.API_BASE_URL;
export const MERCHANT_ID = Config.MERCHANT_ID;
export const ENVIRONMENT = Config.ENVIRONMENT;

const capitalizeFirst = (text: string) => {
  if (!text) return "--";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const getNextRentDueDate = (checkInDate, installmentsPaid) => {

  const start = new Date(checkInDate);

  const nextDue = new Date(start);
  nextDue.setMonth(start.getMonth() + installmentsPaid);
  nextDue.setDate(1);

  return nextDue.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

};

const isWithin7DaysOfCheckout = (checkOutDate) => {
  if (!checkOutDate) return false;

  const today = new Date();
  const checkout = new Date(checkOutDate);

  const diff = checkout.getTime() - today.getTime();
  const days = diff / (1000 * 60 * 60 * 24);

  return days <= 7 && days >= 0;
};

const isPaymentWindowOpen = () => {

  const today = new Date().getDate();

  return today >= 1 && today <= 7;

};

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
  const [bookingData, setBookingData] = useState(route?.params?.booking);
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

  const [depositLoading, setDepositLoading] = useState(false);
const [monthlyPlanLoading, setMonthlyPlanLoading] = useState(false);
const [monthlyRentLoading, setMonthlyRentLoading] = useState(false);

//Electricity recharge
const [electricityLoading, setElectricityLoading] = useState(false);
const [electricityPaymentUrl, setElectricityPaymentUrl] = useState("");
const [showElectricityWebview, setShowElectricityWebview] = useState(false);
const [electricityAmount, setElectricityAmount] = useState("");
//const isOfflineOnly = bookingData?.offlinePaymentsRecieved === true;

const isOfflineOnly =
  bookingData?.bookingSource === "OFFLINE";



// const showOfflinePaymentAlert = () => {
//   Alert.alert(
//     "Offline Payments Only",
//     "All payments should be done offline"
//   );
// };



const showOfflinePaymentAlert = () => {
  Alert.alert(
    "Offline Payment",
    "Payments will be done offline",
    [{ text: "OK" }],
    { cancelable: true }
  );
};


  const navigation = useNavigation();


 //calculation of Installment progress
const totalInstallments = bookingData.duration;
const paidInstallments = bookingData.installmentsPaid;

const nextRentDue = getNextRentDueDate(
  bookingData.checkInDate,
  paidInstallments
);

const paymentWindowOpen = isPaymentWindowOpen();

// 🔥 IMPROVED NEXT RENT DUE + UNPAID MONTHS
const today = new Date();
const checkIn = new Date(bookingData.checkInDate);


const monthsElapsed =
  (today.getFullYear() - checkIn.getFullYear()) * 12 +
  (today.getMonth() - checkIn.getMonth()) +
  1;
const unpaidMonths = Math.max(
  monthsElapsed - bookingData.installmentsPaid,
  0
);

const canPayRent = bookingData.monthlyPlanSelected && bookingData.contractStatus === "SIGNED";
//&& bookingData.securityDepositPaid && bookingData.installmentsPaid < bookingData.duration;



const initiateElectricityRecharge = async () => {
  try {

    // Validation
    // if (
    //   !electricityAmount ||
    //   Number(electricityAmount) < 300
    // ) {
    //   Alert.alert(
    //     "Invalid Amount",
    //     "Minimum recharge amount is ₹300"
    //   );
    //   return;
    // }

    if (!electricityAmount || Number(electricityAmount) < 100) {
  Alert.alert(
    "Invalid Amount",
    "Minimum recharge amount is ₹100"
  );
  return;
}

    setElectricityLoading(true);

    // Payload
    const payload = {
      amount: Number(electricityAmount),
    };

    console.log(
      "⚡ Electricity Recharge Payload:",
      JSON.stringify(payload, null, 2)
    );

    const res = await axios.post(
      `${BASE_URL}/api/booking-payments/initiate-electricity-recharge`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-client": "mobile",
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "⚡ Electricity recharge response:",
      JSON.stringify(res.data, null, 2)
    );

    // Open payment page
    if (res.data?.redirectUrl) {

      setElectricityPaymentUrl(
        res.data.redirectUrl
      );

      setShowElectricityWebview(true);

    } else {

      Alert.alert(
        "Error",
        "Payment URL not received"
      );

    }

  } catch (error) {

    console.log(
      "❌ Electricity recharge error:",
      error?.response?.data || error
    );

    Alert.alert(
      "Error",
      error?.response?.data?.message ||
      "Failed to initiate recharge"
    );

  } finally {

    setElectricityLoading(false);

  }
};

const isContractSigned = bookingData?.contractStatus?.toUpperCase() === "SIGNED";
 
console.log("canPayRent:", canPayRent); 
console.log("contract Signed:", isContractSigned); 

// 🔥 LATE FEE CALCULATION (backend exact same)
const calculateLateFeeAndTotal = () => {
  if (!bookingData.monthlyPlanSelected) return { lateFee: 0, totalPayable: 0 };

  const lastPaidMonth = bookingData.installmentsPaid;
  const dueDate = new Date(checkIn);
  dueDate.setMonth(dueDate.getMonth() + lastPaidMonth);
  dueDate.setDate(7);

  let lateFee = 0;
  if (today > dueDate) {
    const lateDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const lateFeePerDay = bookingData.rateCard?.property?.lateFeePerDay || 100;
    lateFee = lateDays * lateFeePerDay;
  }

  const monthlyRent = bookingData.monthlyRent || 0;
  const totalPayable = monthlyRent + lateFee;

  return { lateFee, totalPayable };
};

const { lateFee, totalPayable } = calculateLateFeeAndTotal();

useEffect(() => {
  if (bookingData) {
    console.log(
      "========== FIRST BOOKING DETAILS =========="
    );

    console.log(
      JSON.stringify(bookingData, null, 2)
    );
  }
}, []);



useEffect(() => {
  if (
    electricityPaymentUrl &&
    electricityPaymentUrl !== ""
  ) {
    setElectricityAmount("");
  }
}, [electricityPaymentUrl]);
  /* =====================
     FETCH DETAILS
  ===================== */
  useEffect(() => {
    if (bookingData?.id) fetchDetails();
  }, [bookingData]);

  const fetchDetails = async () => {
    try {
      const [paymentRes, extensionRes] = await Promise.all([
        axios.get(
          `${BASE_URL}/api/booking-payments/${bookingData.id}/summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${BASE_URL}/api/admin-booking/getExtension/${bookingData.id}`,
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
   
    // console.log(`\n=== Starting PhonePe Flow: ${flowType} ===`);
    // console.log("Payload:", payload);
    // console.log("Initiate URL:", initiateUrl);


console.log("🚀 Sending initiate request...");
console.log("URL:", `${BASE_URL}${initiateUrl}`);
console.log("Payload:", payload);


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
      console.log("BASE_URL: ",BASE_URL)
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
        console.log("Response of BASE_URL: ",BASE_URL)
      console.log("✅ Initiate Response:", JSON.stringify(res.data, null, 2));


  console.log("✅ API SUCCESS");
  console.log("Status:", res.status);
  console.log("Data:", res.data);


  // ✅ HANDLE OFFLINE FLOW HERE
if (res.data?.success && res.data?.isOfflineFlow) {

  Alert.alert(
    "Success",
    res.data?.message ||
      "Extension request submitted successfully"
  );

  fetchDetails();

  return;
}


    if (!res.data?.success) {

  Toast.show({
    type: "info",
    text1: res.data?.message || "Payment cannot be initiated"
  });
  console.log("Response of failure payment: ",res.data?.message);
  return;
}

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
      } 
      else {
         // ❌ No browser, show error instead
  Toast.show({
    type: "error",
    text1: "Payment unavailable",
    text2: "Please try again later",
  });

  console.error("Missing token/orderId — cannot proceed");
  return;
        // if (redirectUrl) {
        //   console.log("🟡 Falling back to web redirectUrl");
        //   const supported = await Linking.canOpenURL(redirectUrl);
        //   if (supported) {
        //     await Linking.openURL(redirectUrl);
        //     Toast.show({
        //       type: "info",
        //       text1: "Payment opened in browser",
        //       text2: "Complete & return to app",
        //     });
        //   } else {
        //     throw new Error("Cannot open payment URL");
        //   }
        // } else {
        //   throw new Error("Invalid PhonePe response - no token/orderId");
        // }
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

  Toast.show({ 
    type: "success", 
    text1: flowType === "Security Deposit" 
      ? "Security Deposit Paid Successfully" 
      : "Payment Successful" 
  });

  // 🔥 Security Deposit ke liye special update
  if (flowType === "Security Deposit") {
    setBookingData(prev => ({
      ...prev,
      securityDepositPaid: true
    }));
  } 
  // Monthly Rent ke liye
  else {
    setBookingData(prev => ({
      ...prev,
      installmentsPaid: prev.installmentsPaid + 1
    }));
  }

  fetchDetails();   // fresh data laao
  
  
    // 🔥 NAVIGATION ADDED HERE
  setTimeout(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: "MyBookings" }],
    });
  }, 1200);
  
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
    } catch (err) {
       console.log("❌ API FAILED");
       console.log("Error:", err?.message);
       console.log("Response:", err?.response?.data);
    
      Toast.show({ type: "error", text1: "Payment initiation failed" });
      throw err;
    }
  };

  /* =====================
     ACTIONS
  ===================== */
//  const payRemaining = async () => {
//   console.log("\n=== Pay Remaining Pressed ===");

//   try {

//     setRemainingLoading(true);

//     await startPhonePeFlow(
//       "/api/booking-payments/initiate-remaining",
//       { bookingId: bookingData.id },
//       "Pay Remaining"
//     );

//   } catch (err) {

//     console.log("❌ Pay Remaining Error:", err?.response?.data);

//     const message =
//     err?.response?.data?.message || "Failed to initiate remaining payment";

//     Alert.alert(
//     "Payment Error",
//     message
//   );

//   } finally {
//     setRemainingLoading(false);
//   }
// };

//new
const payRemaining = async () => {

  if (isOfflineOnly) {
    showOfflinePaymentAlert();
    return;
  }

  console.log("\n=== Pay Remaining Pressed ===");

  try {

    setRemainingLoading(true);

    await startPhonePeFlow(
      "/api/booking-payments/initiate-remaining",
      { bookingId: bookingData.id },
      "Pay Remaining"
    );

  } catch (err) {

    console.log("❌ Pay Remaining Error:", err?.response?.data);

    const message =
      err?.response?.data?.message ||
      "Failed to initiate remaining payment";

    Alert.alert("Payment Error", message);

  } finally {
    setRemainingLoading(false);
  }
};






  //pay security deposte








//   const paySecurityDeposit = async () => {
//   try {
//     setDepositLoading(true);

//     await startPhonePeFlow(
//       "/api/booking-payments/initiate-security-deposit",
//       { bookingId: bookingData.id },
//       "Security Deposit"
//     );

//   } catch (err) {
//     //console.log("❌ Security Deposit Error:", err?.response?.data);
   
//   // console.dir(err?.response?.data, { depth: null });
//    console.log(JSON.stringify(err?.response?.data, null, 2));
   
//     // Toast.show({
//     //   type: "error",
//     //   text1: err?.response?.data?.message || "Failed to initiate security deposit payment"
//     // });
//    const message =
//     err?.response?.data?.message || "Failed to initiate remaining payment";

//     Alert.alert(
//     "Payment Error",
//     message
//   );
 
//   } finally {
//     setDepositLoading(false);
//   }
// };


const paySecurityDeposit = async () => {

  if (isOfflineOnly) {
    showOfflinePaymentAlert();
    return;
  }

  try {

    setDepositLoading(true);

    await startPhonePeFlow(
      "/api/booking-payments/initiate-security-deposit",
      { bookingId: bookingData.id },
      "Security Deposit"
    );

  } catch (err) {

    console.log(JSON.stringify(err?.response?.data, null, 2));

    const message =
      err?.response?.data?.message ||
      "Failed to initiate remaining payment";

    Alert.alert("Payment Error", message);

  } finally {
    setDepositLoading(false);
  }
};






//monthly plan activate function
// const activateMonthlyPlan = async () => {

//   try {

//     setMonthlyPlanLoading(true);

//     const res = await axios.post(
//       `${BASE_URL}/api/booking-payments/initiate-remaining`,
//       {
//         bookingId: bookingData.id,
//         paymentMode: "MONTHLY"
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "x-client": "mobile"
//         }
//       }
//     );

//     console.log("Monthly plan response:", res.data);

//     Toast.show({
//       type: "success",
//       text1: res.data?.message || "Monthly plan activated"
//     });

//     // UI update
//     setBookingData(prev => ({
//       ...prev,
//       monthlyPlanSelected: true,
//       monthlyInstallment: prev.monthlyRent
//     }));

//   } catch (err) {

//     console.log("❌ Activate Monthly Plan Error:", err?.response?.data);

//     // Toast.show({
//     //   type: "error",
//     //   text1: err?.response?.data?.message || "Failed to activate monthly plan"
//     // });
//       const message = err?.response?.data?.message || "Failed to initiate remaining payment";

//     Alert.alert(
//     "Payment Error",
//     message
//   );

//   } finally {
//     setMonthlyPlanLoading(false);
//   }

// };


const activateMonthlyPlan = async () => {

  if (isOfflineOnly) {
    showOfflinePaymentAlert();
    return;
  }

  try {

    setMonthlyPlanLoading(true);

    const res = await axios.post(
      `${BASE_URL}/api/booking-payments/initiate-remaining`,
      {
        bookingId: bookingData.id,
        paymentMode: "MONTHLY"
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-client": "mobile"
        }
      }
    );

    console.log("Monthly plan response:", res.data);

    Toast.show({
      type: "success",
      text1: res.data?.message || "Monthly plan activated"
    });

    setBookingData(prev => ({
      ...prev,
      monthlyPlanSelected: true,
      monthlyInstallment: prev.monthlyRent
    }));

  } catch (err) {

    console.log("❌ Activate Monthly Plan Error:", err?.response?.data);

    const message =
      err?.response?.data?.message ||
      "Failed to initiate remaining payment";

    Alert.alert("Payment Error", message);

  } finally {
    setMonthlyPlanLoading(false);
  }
};








//pay monthly rent function 
// const payMonthlyRent = async () => {

//   try {

//     setMonthlyRentLoading(true);

//     await startPhonePeFlow(
//       "/api/booking-payments/initiate-monthly-rent",
//       { bookingId: bookingData.id },
//       "Monthly Rent"
//     );

//   } catch (err) {

//     console.log("❌ Monthly Rent Error:", err?.response?.data);

//     // Toast.show({
//     //   type: "error",
//     //   text1: err?.response?.data?.message || "Failed to initiate monthly rent payment"
//     // });
//       const message = err?.response?.data?.message || "Failed to initiate remaining payment";

//     Alert.alert(
//     "Payment Error",
//     message
//   );

//   } finally {
//     setMonthlyRentLoading(false);
//   }

// };


const payMonthlyRent = async () => {

  if (isOfflineOnly) {
    showOfflinePaymentAlert();
    return;
  }

  try {

    setMonthlyRentLoading(true);

    await startPhonePeFlow(
      "/api/booking-payments/initiate-monthly-rent",
      { bookingId: bookingData.id },
      "Monthly Rent"
    );

  } catch (err) {

    console.log("❌ Monthly Rent Error:", err?.response?.data);

    const message =
      err?.response?.data?.message ||
      "Failed to initiate remaining payment";

    Alert.alert("Payment Error", message);

  } finally {
    setMonthlyRentLoading(false);
  }
};







// const requestExtension = async () => {
//   console.log("\n=== Extend Pressed ===");
//   console.log("Months:", extendMonths);

//   if (!isExtendValid) {
//     Toast.show({
//       type: "info",
//       text1: "Invalid Input",
//       text2: "Enter valid months (≥1)",
//     });
//     return;
//   }

//   try {
//     setExtendLoading(true);

//     await startPhonePeFlow(
//       "/api/booking-payments/initiate-extension",
//       {
//         bookingId: bookingData.id,
//         months: Number(extendMonths),
//       },
//       "Extension"
//     );

//     // ❗ No Toast here → already handled inside flow

//   }   
//   catch (error) {
//   console.log("❌ ERROR:", error?.response || error);

//   const message =  error?.response?.data?.message || "Something went wrong";

//   Alert.alert(
//     "Extension Failed",
//     message
//   );
// }
  
  
//   finally {
//     setExtendLoading(false);
//   }
// };


const requestExtension = async () => {

  // if (isOfflineOnly) {
  //   showOfflinePaymentAlert();
  //   return;
  // }

  console.log("\n=== Extend Pressed ===");
  console.log("Months:", extendMonths);

  if (!isExtendValid) {
    Toast.show({
      type: "info",
      text1: "Invalid Input",
      text2: "Enter valid months (≥1)",
    });
    return;
  }

  try {

    setExtendLoading(true);

    await startPhonePeFlow(
      "/api/booking-payments/initiate-extension",
      {
        bookingId: bookingData.id,
        months: Number(extendMonths),
      },
      "Extension"
    );

  } catch (error) {

    console.log("❌ ERROR:", error?.response || error);

    const message =
      error?.response?.data?.message ||
      "Something went wrong";

    Alert.alert("Extension Failed", message);

  } finally {
    setExtendLoading(false);
  }
};





  const requestCancellation = async () => {
    try {
      setCancelLoading(true);
      await axios.post(
        `${BASE_URL}/api/book-room/requestCancellation/${bookingData.id}`,
        { reason: cancelReason.trim() || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Toast.show({
      //   type: "success",
      //   text1: "Success",
      //   text2: "Cancellation request sent successfully",
      // });
    Alert.alert(
      "Success",
      "Cancellation request sent successfully",
      [
        {
          text: "OK",
          onPress: () => navigation.navigate("MyBookings") // redirect
        }
      ]
    );
   
      // ✅ Show Alert instead of Toast
    // Alert.alert(
    //   "Success",
    //   "Cancellation request sent successfully",
    //   [{ text: "OK" }]
    // );
      setCancelReason("");
      fetchDetails();
    } catch (error: any) {
      // Toast.show({
      //   type: "error",
      //   text1: "Error",
      //   text2: error?.response?.data?.message || "Failed to request cancellation",
      // });

  const message =
    error?.response?.data?.message || "Failed to initiate remaining payment";

    Alert.alert(
    "Payment Error",
    message
  );


    } finally {
      setCancelLoading(false);
    }
  };

  const isExtendValid = extendMonths !== "" && /^\d+$/.test(extendMonths) && Number(extendMonths) >= 1;

  const cancelRequestStatus = bookingData?.cancelRequestStatus || "NONE";
  const canRequestCancel =bookingData?.status?.toLowerCase() === "approved" && ["NONE", "REJECTED"].includes(cancelRequestStatus);

  /* =====================
     UI SAFETY
  ===================== */
  if (!bookingData) return <View style={styles.center}><Text>No booking data</Text></View>;
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#C97B63" /></View>;

  const isFirstInstallment = bookingData.installmentsPaid === 0;

const showLateFee =
  bookingData.monthlyPlanSelected &&
  !isFirstInstallment &&
  lateFee > 0;

  /* =====================
     UI
  ===================== */
return (
  <KeyboardAvoidingView
    style={{ flex: 1, backgroundColor: "#F2F2F2" }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
  >

    {/* 🔒 FIXED HEADER */}
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={26} color="#4B3426" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Booking Details</Text>
    </View>

    {/* 📜 SCROLLABLE CONTENT */}
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 120,
        flexGrow: 1,
      }}
    >

      

<InfoCard
  label="Property"
  value={bookingData.rateCard?.property?.name}
/>

<InfoCard
  label="Room Type"
  value={bookingData.rateCard?.roomType}
/>

<InfoCard
      label="Status"
      value={capitalizeFirst(bookingData.displayStatus   )}
/>

{bookingData?.bookingSource === "OFFLINE" && (
  <InfoCard
    label="Booking Payment Mode"
    value="Offline"
  />
)}








 {paymentSummary && bookingData.monthlyPlanSelected &&(
  <View style={styles.card}>
    <Text style={styles.section}>Payments</Text>

    <Row
      label="Installment Progress"
      value={`${paidInstallments} / ${totalInstallments}`}
    />

    <View style={styles.progressBarContainer}>
      <View
        style={[
          styles.progressBarFill,
          {
            width: `${(paidInstallments / totalInstallments) * 100}%`,
          },
        ]}
      />
    </View>

    <Row
      label="Remaining Amount"
      value={`₹${paymentSummary.totals?.remainingRupees || 0}`}
    />

    <Row
      label="Security Deposit"
      value={bookingData.securityDepositPaid ? "Paid" : "Pending"}
    />

    {/* Monthly Plan Details */}
    {bookingData.monthlyPlanSelected && (
      <>
        <Row
          label="Monthly Plan"
          value="Active"
        />

        <Row
          label="Monthly Installment"
          value={`₹${bookingData.monthlyInstallment}`}
        />

        <Row
          label="Installments Paid"
          value={`${bookingData.installmentsPaid}`}
        />
      </>
    )}

    {/* Late Fee (only after first installment) */}
    {showLateFee && (
      <>
        <Row
          label="Late Fee"
          value={`₹${lateFee}`}
        />

        <Row
          label="Total Payable"
          value={`₹${totalPayable}`}
        />
      </>
    )}

    {/* Payment Window Message */}
    {bookingData.monthlyPlanSelected && (
      <View style={styles.paymentWindow}>
        {paymentWindowOpen ? (
          <Text style={styles.windowOpen}>
            Rent payment window is open (1st – 7th)
          </Text>
        ) : (
          <Text style={styles.windowClosed}>
            Rent can still be paid. Late fee may apply.
          </Text>
        )}
      </View>
    )}
  </View>
)}

{/* 
{bookingData.monthlyPlanSelected &&
 paymentWindowOpen === false &&
(

  // <Text style={styles.lateFeeWarning}>
  //   Late fee may apply if payment is delayed.
  // </Text>

)} */}
      {/* PAY REMAINING new*/}
    
     {/* {
    bookingData.bookingType === "PREBOOK" &&
    bookingData.paymentStatus === "PARTIAL" && 
    bookingData.contractStatus==="SIGNED" && ( */}


{
  (
    isOfflineOnly ||

    (
      bookingData.bookingType === "PREBOOK" &&
      bookingData.paymentStatus === "PARTIAL" &&
      bookingData.contractStatus === "SIGNED"
    )
  ) && (

  <>
  
  {/* SECURITY DEPOSIT */}
  {/* {!bookingData.securityDepositPaid && ( */}

{(isOfflineOnly || !bookingData.securityDepositPaid) && (
    <View style={{ marginBottom: 10 }}>
   {/* <PrimaryButton
      text={depositLoading ? "Processing..." : "Pay Security Deposit"}
      onPress={paySecurityDeposit}
      disabled={depositLoading}
    /> */}

<PrimaryButton
  text={depositLoading ? "Processing..." : "Pay Security Deposit"}
  onPress={paySecurityDeposit}
  disabled={depositLoading}
  offlineDisabled={isOfflineOnly}
/>

</View>
  )}

  {/* AFTER DEPOSIT PAID */}
  {/* {bookingData.securityDepositPaid && !bookingData.monthlyPlanSelected && ( */}

{(
  isOfflineOnly ||
  (
    bookingData.securityDepositPaid &&
    !bookingData.monthlyPlanSelected
  )
) && (
    <>
    <View style={{ marginBottom: 10 }}>
      {/* <PrimaryButton
        text={remainingLoading ? "Processing..." : "Pay Remaining Amount"}
        onPress={payRemaining}
        disabled={remainingLoading}
      /> */}

<PrimaryButton
  text={remainingLoading ? "Processing..." : "Pay Remaining Amount"}
  onPress={payRemaining}
  disabled={remainingLoading}
  offlineDisabled={isOfflineOnly}
/>

      </View>
    
     <Text style={[styles.or, { marginVertical: 5 }]}>OR</Text>

      <View style={{ marginBottom: 10 }}>
      {/* <PrimaryButton
        text={monthlyPlanLoading ? "Processing..." : "Activate Monthly Plan"}
        onPress={activateMonthlyPlan}
        disabled={monthlyPlanLoading}
      /> */}

<PrimaryButton
  text={monthlyPlanLoading ? "Processing..." : "Activate Monthly Plan"}
  onPress={activateMonthlyPlan}
  disabled={monthlyPlanLoading}
  offlineDisabled={isOfflineOnly}
/>

      </View>
    </>

  )}



  </>

  

)}

  {/* MONTHLY PLAN ACTIVE */}
{/* {canPayRent && ( */}
{(isOfflineOnly || canPayRent) && (
  // <PrimaryButton
  //   text={monthlyRentLoading ? "Processing..." : "Pay Monthly Rent"}
  //   onPress={payMonthlyRent}
  //   disabled={monthlyRentLoading}
  // />

  <PrimaryButton
  text={monthlyRentLoading ? "Processing..." : "Pay Monthly Rent"}
  onPress={payMonthlyRent}
  disabled={monthlyRentLoading}
  offlineDisabled={isOfflineOnly}
/>

)}



{/* ELECTRICITY METER RECHARGE */}
{new Date() >= new Date(bookingData?.checkInDate) && (
  <View style={styles.card}>

    <Text style={styles.section}>
      Electricity Meter Recharge
    </Text>

    <Text style={styles.helper}>
      *Minimum recharge amount is ₹100
    </Text>



    <TextInput
      style={styles.input}
      placeholder="Enter recharge amount"
      keyboardType="numeric"
      value={electricityAmount}
      onChangeText={setElectricityAmount}
    />

    {electricityAmount !== "" &&
      Number(electricityAmount) < 100 && (
        <Text
          style={{
            color: "#d32f2f",
            marginBottom: 10,
            fontFamily: "Quicksand-Bold",
            fontSize: 12,
          }}
        >
          Recharge amount must be equal to or greater than ₹100
        </Text>
      )}

    <PrimaryButton
      text={
        electricityLoading
          ? "Processing..."
          : "Recharge Electricity Meter"
      }
      disabled={
        electricityLoading ||
        !electricityAmount ||
        Number(electricityAmount) < 100
      }
      onPress={initiateElectricityRecharge}
    />

  </View>
)}





      {/* CANCELLATION REQUEST */}
      {bookingData.status && ["approved", "cancelled"].includes(bookingData.status.toLowerCase()) && (
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
                New checkout date: {bookingData.cancelEffectiveCheckOutDate || "N/A"}
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

     
{/* <View style={styles.card}>
    <Text style={styles.section}>Extend Stay</Text>
    <Text style={styles.helper}>Please enter the extension duration (6 or 12 months only)</Text>

    <TextInput
      style={styles.input}
      placeholder="e.g. 6"
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
  </View> */}

{isContractSigned && (
  <View style={styles.card}>
    <Text style={styles.section}>Extend Stay</Text>
    <Text style={styles.helper}>
      Please enter the extension duration (6 or 12 months only)
    </Text>

    <TextInput
      style={styles.input}
      placeholder="e.g. 6"
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
)}

{/* 
{isWithin7DaysOfCheckout(bookingData.checkOutDate) && (
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
)} */}


      <View style={{ height: 40 }} />
    </ScrollView>



<Modal
  visible={showElectricityWebview}
  animationType="slide"
>
  <View style={{ flex: 1 }}>

    <TouchableOpacity
      onPress={() => setShowElectricityWebview(false)}
      style={{
        padding: 15,
        backgroundColor: "#fff",
        zIndex: 1,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "bold",
          color: "red",
        }}
      >
        Close
      </Text>
    </TouchableOpacity>

    <WebView
      source={{ uri: electricityPaymentUrl }}
      startInLoadingState={true}
    />

  </View>
</Modal>


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

// const PrimaryButton = ({ text, onPress, disabled }) => (
//   <TouchableOpacity
//     style={[styles.btn, disabled && { opacity: 0.6 }]}
//     onPress={onPress}
//     disabled={disabled}
//   >
//     <Text style={styles.btnText}>{text}</Text>
//   </TouchableOpacity>
// );


// const PrimaryButton = ({
//   text,
//   onPress,
//   disabled,
//   offlineDisabled = false,
// }) => (
//   <View style={{ marginBottom: 10 }}>
//     <TouchableOpacity
//       activeOpacity={offlineDisabled ? 1 : 0.7}
//       style={[
//         styles.btn,
//         offlineDisabled && styles.offlineBtn,
//         disabled && { opacity: 0.6 },
//       ]}
//       onPress={offlineDisabled ? undefined : onPress}
//       disabled={disabled}
//     >
//       <Text
//         style={[
//           styles.btnText,
//           offlineDisabled && styles.offlineBtnText,
//         ]}
//       >
//         {text}
//       </Text>
//     </TouchableOpacity>

//     {offlineDisabled && (
//       <Text style={styles.offlineNote}>
//         Payments will be done offline
//       </Text>
//     )}
//   </View>
// );


const PrimaryButton = ({
  text,
  onPress,
  disabled,
  offlineDisabled = false,
}) => (
  <View style={styles.primaryBtnWrapper}>
    <TouchableOpacity
      activeOpacity={offlineDisabled ? 1 : 0.7}
      style={[
        styles.btn,
        offlineDisabled && styles.offlineBtn,
        disabled && { opacity: 0.6 },
      ]}
      onPress={offlineDisabled ? undefined : onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.btnText,
          offlineDisabled && styles.offlineBtnText,
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>

    {offlineDisabled && (
      <Text style={styles.offlineNote}>
        Payments will be done offline
      </Text>
    )}
  </View>
);


// const DestructiveButton = ({ text, onPress, disabled }) => (
//   <TouchableOpacity
//     style={[styles.btn, { backgroundColor: "#d32f2f" }, disabled && { opacity: 0.6 }]}
//     onPress={onPress}
//     disabled={disabled}
//   >
//     <Text style={styles.btnText}>{text}</Text>
//   </TouchableOpacity>
// );

const DestructiveButton = ({ text, onPress, disabled }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    style={[
      styles.btn,
      { backgroundColor: "#d32f2f" },
      disabled && { opacity: 0.6 },
    ]}
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
  header: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 30,
  paddingHorizontal: 16,
  marginBottom: 10,
  gap: 20, // 👈 as requested
},
primaryBtnWrapper: {
  marginBottom: 10,
  width: "100%",
},
offlineBtn: {
  backgroundColor: "#f0e2d3ff",
},


offlineBtnText: {
  color: "#8A5A2B",
},

offlineNote: {
  marginTop: 6,
  fontSize: 12,
  fontFamily: "Quicksand-Bold",
  color: "#d32f2f",
  textAlign: "center",

},

headerTitle: {
  fontSize: 25,
  fontFamily: "Quicksand-Bold",
  color: "#4B3426",
},
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
  or:{textAlign:'center',padding:10,fontFamily:'Quicksand-Bold'},
  progressBarContainer: {
  height: 8,
  backgroundColor: "#E0E0E0",
  borderRadius: 10,
  marginTop: 8,
  overflow: "hidden"
},

progressBarFill: {
  height: "100%",
  backgroundColor: "#F6A452"
},

paymentWindow: {
  marginTop: 10
},

windowOpen: {
  color: "#2e7d32",
  fontFamily: "Quicksand-Bold"
},

windowClosed: {
  color: "#d32f2f",
  fontFamily: "Quicksand-Bold"
},

lateFeeWarning: {
  marginTop: 6,
  color: "#ff6f00",
  fontFamily: "Quicksand-Bold"
},
});