import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,   // 👈 यह missing है
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";

import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
//import PhonePePaymentSDK from "react-native-phonepe-pg";
import Config from "react-native-config";
import RazorpayCheckout from "react-native-razorpay";

export const API_BASE_URL = Config.API_BASE_URL;
//export const MERCHANT_ID = Config.MERCHANT_ID;
//export const ENVIRONMENT = Config.ENVIRONMENT;
export const RAZORPAY_KEY_ID = Config.RAZORPAY_KEY_ID;
/* =====================
   RAZORPAYYY
===================== */

// Razorpay Test account details:
// key_id: rzp_test_TRZldTvHAtk42E
// key_secret: JqbC6786P3otZfp4ztQtBSpu



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
  const [couponCode , setCouponCode] = useState("");
  const [couponLoading , setCouponLoading] = useState(false);
  const [discountType , setDiscountType] = useState(null);
  const [discount ,setDiscount] = useState(0);
const [appliedCoupon, setAppliedCoupon] = useState("");

const [paymentMode, setPaymentMode] = useState("FULL"); 
// FULL | MONTHLY

//const [paymentMode, setPaymentMode] = useState("FULL"); // 👈 ADD THIS

useEffect(() => {
  if (paymentMode === "MONTHLY") {
    setCouponCode("");
    setDiscount(0);
    setDiscountType(null);
    setAppliedCoupon("");
  }
}, [paymentMode]);

  // Function to apply coupon
// Function to apply coupon
const applyCoupon = async () => {
  if (!couponCode.trim()) {
    Toast.show({ type: "error", text1: "Enter coupon code" });
    return;
  }

  try {
    setCouponLoading(true);

    const res = await axios.post(
      `${API_BASE_URL}/api/coupons/validate`,
      {
        code: couponCode.trim().toUpperCase(),
        propertyId: room.propertyId,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const couponData = res.data?.coupon;
    if (!couponData?.discountValue) {
      Toast.show({ type: "error", text1: "Invalid Coupon" });
      return;
    }

    const value = Number(couponData.discountValue);
    const type = couponData.discountType.toUpperCase();

    setDiscount(value);
    setDiscountType(type);
    setAppliedCoupon(couponCode.trim().toUpperCase());

    Toast.show({
      type: "success",
      text1: "Coupon applied successfully",
    });

  } catch (err: any) {
    const backendMessage = err?.response?.data?.message || "Something went wrong";
    Toast.show({
      type: "error",
      text1: backendMessage,
    });
  } finally {
    setCouponLoading(false);
  }
};





  /* =====================
     CALCULATIONS
  ===================== */
/* =====================
   CALCULATIONS
===================== */
const securityDeposit = rent * 2;
//const finalPayable = actionType === "PreBook" ? preBookAmount : netPayable;

const finalPayable =
  actionType === "PreBook"
    ? preBookAmount
    : paymentMode === "MONTHLY"
    ? securityDeposit
    : netPayable;

    const discountedAmount = React.useMemo(() => {
  const dVal = Number(discount) || 0;
  const dType = discountType?.toUpperCase();

  // ✅ PREBOOK CASE (FIXED)
  if (actionType === "PreBook") {
    const base = preBookAmount;

    if (dVal <= 0 || !dType) return base;

    let result = base;

    if (dType === "PERCENTAGE") {
      result = base - (base * dVal) / 100;
    } else {
      result = base - dVal;
    }

    return Math.max(0, Math.round(result));
  }

  // ✅ BOOK CASE (your custom logic)
  const rentTotal = rent * monthsNumber;
  const deposit = securityDeposit;

  if (dVal <= 0 || !dType) {
    return paymentMode === "FULL"
      ? rentTotal + deposit
      : deposit;
  }

  let discountedRent = rentTotal;

  if (dType === "PERCENTAGE") {
    discountedRent = rentTotal - (rentTotal * dVal) / 100;
  } else {
    discountedRent = rentTotal - dVal;
  }

  return Math.max(0, Math.round(discountedRent + deposit));
}, [
  actionType,
  preBookAmount,
  rent,
  monthsNumber,
  securityDeposit,
  discount,
  discountType,
  paymentMode,
]);

//   const base = Number(finalPayable) || 0;
//   const dVal = Number(discount) || 0;
//   const dType = discountType?.toUpperCase();

//   // DEBUG: Check if values are reaching here
//   console.log("Memo Input:", { base, dVal, dType });

//   if (dVal <= 0 || !dType) return base;

//   let result = base;
//   if (dType === "PERCENTAGE") {
//     result = base - (base * dVal) / 100;
//   } else {
//     // FLAT / AMOUNT / FIXED
//     result = base - dVal;
//   }

//   console.log("Memo Result:", result);
//   return Math.max(0, Math.round(result));
// }, [finalPayable, discount, discountType]);


// const discountedAmount = React.useMemo(() => {
//   const rentTotal = rent * monthsNumber;   // ✅ only rent
//   const deposit = securityDeposit;

//   const dVal = Number(discount) || 0;
//   const dType = discountType?.toUpperCase();

//   if (dVal <= 0 || !dType) {
//     return paymentMode === "FULL"
//       ? rentTotal + deposit
//       : finalPayable;
//   }

//   let discountedRent = rentTotal;

//   if (dType === "PERCENTAGE") {
//     discountedRent = rentTotal - (rentTotal * dVal) / 100;
//   } else {
//     discountedRent = rentTotal - dVal;
//   }

//   const final = discountedRent + deposit;

//   return Math.max(0, Math.round(final));
// }, [rent, monthsNumber, securityDeposit, discount, discountType, paymentMode]);


console.log("Current Discount State:", discount);
console.log("Current DiscountedAmount:", discountedAmount);
  const proceedBtnText =
    actionType === "PreBook"
      ? "Proceed To Pre-book"
      : "Proceed To Book";

  /* =====================
     PAYMENT FLOW
  ===================== */
//   const startPayment = async () => {
//     let merchantOrderId = null;

//     console.log("ENVIRONMENT:", ENVIRONMENT);
// console.log("MERCHANT_ID:", MERCHANT_ID);
// console.log("API_BASE_URL:", API_BASE_URL);

//     try {
//       setLoading(true);

//       console.log("[PhonePe] Starting payment flow");

//       // 1️⃣ SDK Init
//       console.log("[PhonePe] Initializing SDK");
//       // await PhonePePaymentSDK.init(
//       //   ENVIRONMENT,
//       //   MERCHANT_ID,
//       //   `FLOW_${Date.now()}`,
//       //   true
//       // ).then(result => { console.log("result" + JSON.stringify(result)); }).catch(error => {   console.log("error:" + error.message); });
//       // console.log("[PhonePe] SDK initialized");
// try {
//   const initResult = await PhonePePaymentSDK.init(
//     ENVIRONMENT,
//     MERCHANT_ID,
//     `FLOW_${Date.now()}`,
//     true
//   );

//   console.log("[PhonePe] SDK init success:", initResult);
// } catch (error) {
//   console.log("[PhonePe] SDK init error:", error?.message || error);
// }

// //console.log("[PhonePe] SDK initialized");
//       // 2️⃣ Initiate API
//           // 2️⃣ Initiate API
//       const payload = {
//         userId: Number(user.id),
//         bookingType: actionType === "PreBook" ? "PREBOOK" : "BOOK",
//         paymentMode: actionType === "Book" ? paymentMode : undefined,
//         //couponCode: discount > 0 ? appliedCoupon : null,   // ← Yeh sahi rahega
//          // ❌ coupon not allowed in MONTHLY
//         couponCode: paymentMode === "MONTHLY" ? null : discount > 0 ? appliedCoupon: null,
//         amount: discountedAmount,                          // ← Yeh important hai (backend ko discounted amount bhejo)

//         metadata: {
//           rateCardId: room.rateCardId,
//           propertyId: room.propertyId,
//           roomType: room.roomType,
//           checkInDate: isoDate,
//           duration: monthsNumber,
//           monthlyRent: rent,
//           originalAmount: finalPayable,
//           discountedAmount: discountedAmount,   // extra help ke liye
          
//           preferredFloor: preferredFloor ?? null,
//           preferredRoomNumber: preferredRoomNumber ?? null,
//           preferredBed: preferredBed ?? null,
//         },

//         clientType: "mobile",
//       };
//       console.log("Payload which will sent: ",payload)

//       //console.log("[PhonePe] Sending initiate payload:", payload);

//       const res = await axios.post(
//         `${API_BASE_URL}/api/booking-payments/initiate`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "x-client": "mobile",
//           },
//         }
//       );

//       console.log("[PhonePe] Initiate response:", res.data);

//       merchantOrderId = res.data?.merchantOrderId;
//       const phoneToken = res.data?.phonepe?.token;
//       const phoneOrderId = res.data?.phonepe?.orderId;

//       if (!phoneToken || !phoneOrderId || !merchantOrderId) {
//         throw new Error("Missing required PhonePe data");
//       }

//       console.log("[PhonePe] merchantOrderId:", merchantOrderId);
//       console.log("[PhonePe] phoneOrderId:", phoneOrderId);
//       console.log("[PhonePe] Token length:", phoneToken.length);

//       // 3️⃣ Prepare & Start Transaction
//       const requestObj = {
//         orderId: phoneOrderId,
//         merchantId: MERCHANT_ID,
//         token: phoneToken,
//         paymentMode: { type: "PAY_PAGE" },
//       };
//       const requestString = JSON.stringify(requestObj);

//       console.log("[PhonePe] Starting transaction with:", requestObj);

//       const sdkResult = await PhonePePaymentSDK.startTransaction(requestString, null);

//       console.log("[PhonePe] SDK returned (ignored in sandbox):", sdkResult);

//       // 4️⃣ Web-like polling using SAME API as web (/api/payments/status/)
//       console.log("[PhonePe] Starting polling with web's status API");

//       let attempts = 0;
//       const maxAttempts = 40; // ~120 seconds like web
//       const pollInterval = 3000;
//       let stopped = false;

//       while (attempts < maxAttempts && !stopped) {
//         attempts++;
//         console.log(`[PhonePe] Poll attempt #${attempts}`);

//         const statusRes = await axios.get(
//           `${API_BASE_URL}/api/payments/status/${encodeURIComponent(merchantOrderId)}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );

//         console.log("[PhonePe] Status API response:", statusRes.data);

//         const tx = statusRes.data?.transaction;
//         const state =
//           tx?.status?.toUpperCase() ||
//           statusRes.data?.phonepe?.body?.state?.toUpperCase() ||
//           "UNKNOWN";

//         console.log("[PhonePe] Detected state:", state);

//         // SUCCESS
//         if (state === "SUCCESS" || state === "COMPLETED") {
//           console.log("[PhonePe] Payment SUCCESS confirmed");
//           Toast.show({
//             type: "success",
//             text1: "Payment Successful!",
//             text2: "Redirecting...",
//           });

//           stopped = true;

//          setTimeout(() => {
//       navigation.reset({
//         index: 0,
//         routes: [
//           {
//             name: "BookingSuccessScreen",
//             params: {
//               bookingId: statusRes.data.bookingId || tx?.bookingId,
//               amountPaid: discountedAmount,
//               transactionId: merchantOrderId,
//               userEmail: user.email,
//               userPhone: user.phone,
//               roomType: room.roomType,
//               checkInDate: isoDate,
//               duration: monthsNumber,
//             },
//           },
//         ],
//       });
//     }, 2500);

//     return;
//   }

//         // FAILED
//         if (state === "FAILED" || state === "DECLINED" || state === "TIMED_OUT") {
//           console.log("[PhonePe] Payment FAILED confirmed");
//           stopped = true;
       
//   //         navigation.reset({
//   //     index: 0,
//   //     routes: [
//   //       {
//   //         name: "PaymentFailedScreen",
//   //         params: {
//   //           room,
//   // property,
//   // amountPaid: discountedAmount,
//   // rent,
//   // monthsNumber,
//   // isoDate,
//   // netPayable,
//   // preBookAmount,
//   // actionType,
//   //         },
//   //       },
//   //     ],
//   //   });

//   navigation.reset({
//   index: 0,
//   routes: [
//     {
//       name: "PaymentFailedScreen",
//       params: {
//         room,
//         property,
//         amountPaid: discountedAmount,
//         rent,
//         monthsNumber,
//         isoDate,
//         netPayable,
//         preBookAmount,
//         actionType,

//         // ✅ ADD THESE (MISSING)
//         preferredFloor,
//         preferredRoomNumber,
//         preferredBed,
//         paymentMode,
//       },
//     },
//   ],
// });
//     return;
//   }

//         // Continue polling
//         await new Promise(resolve => setTimeout(resolve, pollInterval));
//       }

//       // Timeout
//       if (!stopped) {
//         console.log("[PhonePe] Polling timeout");
//         // navigation.replace("PaymentFailedScreen", {
//         //   transactionId: merchantOrderId,
//         //   amountPaid: discountedAmount,        // ← change kiya
//         //   reason: "Timeout while waiting for status. Check My Bookings later.",
//         // });
//         navigation.replace("PaymentFailedScreen", {
//   room,
//   property,
//   amountPaid: discountedAmount,
//   rent,
//   monthsNumber,
//   isoDate,
//   netPayable,
//   preBookAmount,
//   actionType,

//   preferredFloor,
//   preferredRoomNumber,
//   preferredBed,
//   paymentMode,

//   transactionId: merchantOrderId,
//   reason: "Timeout while waiting for status. Check My Bookings later.",
// });
//       }

// } catch (err: any) {
//   console.log("[PhonePe] Exception:", err?.response?.data || err);

//   const errorData = err?.response?.data;
//   const backendMessage =
//     errorData?.message || "Something went wrong. Please try again.";

//   if (
//     errorData?.code === "KYC_REQUIRED" ||
//     backendMessage.toLowerCase().includes("kyc")
//   ) {
//     Toast.show({
//       type: "info",
//       text1: "KYC Required",
//       text2: "Please complete KYC to continue booking",
//     });
//     setLoading(false);
//     navigation.replace("VerificationStatus");
//     return;
//   }

//   if (
//     backendMessage.includes("already have an active") ||
//     backendMessage.includes("pending booking")
//   ) {
//     Toast.show({ type: "info", text1: backendMessage });
//     setLoading(false);
//     return;
//   }

//   Toast.show({
//     type: "error",
//     text1: "Booking Error",
//     text2: backendMessage,
//   });

//   // ✅ FIXED
// // navigation.replace("PaymentFailedScreen", {
// //   room,
// //   property,
// //   amountPaid: discountedAmount,             // ← yahan bhi amountPaid
// //   rent,
// //   monthsNumber,
// //   isoDate,
// //   netPayable,
// //   preBookAmount,
// //   actionType,
// //   transactionId: merchantOrderId || "unknown",
// //   reason: backendMessage,
// // });
// navigation.replace("PaymentFailedScreen", {
//   room,
//   property,
//   amountPaid: discountedAmount,
//   rent,
//   monthsNumber,
//   isoDate,
//   netPayable,
//   preBookAmount,
//   actionType,

//   // ✅ ADD THESE
//   preferredFloor,
//   preferredRoomNumber,
//   preferredBed,
//   paymentMode,

//   transactionId: merchantOrderId || "unknown",
//   reason: backendMessage,
// });
// } finally {
//   setLoading(false);
//   console.log("[PhonePe] Flow ended");
// }
//   };

  // Calculation related to coupon
  


  //razor




//   const startPayment = async () => {
//   let merchantOrderId = null;

//   try {
//     setLoading(true);

//     console.log("[Razorpay] Starting payment flow");

//     // 1️⃣ Prepare payment initiation payload
//     const payload = {
//       userId: Number(user.id),

//       bookingType:
//         actionType === "PreBook"
//           ? "PREBOOK"
//           : "BOOK",

//       paymentMode:
//         actionType === "Book"
//           ? paymentMode
//           : undefined,

//       couponCode:
//         paymentMode === "MONTHLY"
//           ? null
//           : discount > 0
//           ? appliedCoupon
//           : null,

//       amount: discountedAmount,

//       metadata: {
//         rateCardId: room.rateCardId,
//         propertyId: room.propertyId,
//         roomType: room.roomType,
//         checkInDate: isoDate,
//         duration: monthsNumber,
//         monthlyRent: rent,

//         originalAmount: finalPayable,
//         discountedAmount: discountedAmount,

//         preferredFloor: preferredFloor ?? null,
//         preferredRoomNumber: preferredRoomNumber ?? null,
//         preferredBed: preferredBed ?? null,
//       },

//       clientType: "mobile",
//     };

//     console.log("[Razorpay] Payload:", payload);

//     // 2️⃣ Ask backend to create Razorpay Order
//     const res = await axios.post(
//       `${API_BASE_URL}/api/booking-payments/initiate`,
//       payload,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "x-client": "mobile",
//         },
//       }
//     );

//     console.log(
//       "[Razorpay] Initiate response:",
//       res.data
//     );

//     // 3️⃣ Get backend payment information
//     const razorpayData = res.data?.razorpay;

//     merchantOrderId = res.data?.merchantOrderId;

//     const razorpayOrderId = razorpayData?.orderId;
//     const razorpayAmount = razorpayData?.amount;
//     const razorpayCurrency = razorpayData?.currency;

//     if (
//       !res.data?.success ||
//       !razorpayOrderId ||
//       !razorpayAmount ||
//       !razorpayCurrency ||
//       !merchantOrderId
//     ) {
//       throw new Error(
//         "Missing required Razorpay payment data"
//       );
//     }

//     console.log(
//       "[Razorpay] Order ID:",
//       razorpayOrderId
//     );

//     console.log(
//       "[Razorpay] Amount:",
//       razorpayAmount
//     );

//     console.log(
//       "[Razorpay] Currency:",
//       razorpayCurrency
//     );

//     console.log(
//       "[Razorpay] Merchant Order ID:",
//       merchantOrderId
//     );

//     // 4️⃣ Open Razorpay Checkout
//     const options = {
//       key: RAZORPAY_KEY_ID,

//       amount: razorpayAmount,

//       currency: razorpayCurrency,

//       name: "CocoLiving",

//       description:
//         actionType === "PreBook"
//           ? "Pre-book Payment"
//           : "Booking Payment",

//       order_id: razorpayOrderId,

//       prefill: {
//         name: user?.name || "",
//         email: user?.email || "",
//         contact: user?.phone || "",
//       },

//       theme: {
//         color: "#4F3421",
//       },
//     };

//     console.log(
//       "[Razorpay] Opening checkout:",
//       options
//     );

//     const paymentData =
//       await RazorpayCheckout.open(options);

//     console.log(
//       "[Razorpay] Payment success:",
//       paymentData
//     );




//    await new Promise<void>((resolve) => setTimeout(resolve, 5000));

// console.log("[Razorpay] Starting payment status polling...");
//     // 5️⃣ Payment successful on Razorpay
//     //
//     // IMPORTANT:
//     // Do NOT directly mark booking as successful here.
//     // Send Razorpay details to backend for verification.


  
//     // 7️⃣ Payment confirmed by backend
//     Toast.show({
//       type: "success",
//       text1: "Payment Successful!",
//       text2: "Redirecting...",
//     });


// // 5️⃣ Check payment status using existing status API

// console.log(
//   "[Razorpay] Starting payment status polling..."
// );

// let attempts = 0;
// const maxAttempts = 40; // 40 × 3 sec = ~120 seconds
// const pollInterval = 5000;
// let stopped = false;

// while (attempts < maxAttempts && !stopped) {
//   attempts++;

//   console.log(
//     `[Razorpay] Status poll attempt #${attempts}`
//   );

//   try {
//     const statusRes = await axios.get(
//       `${API_BASE_URL}/api/payments/status/${encodeURIComponent(
//         merchantOrderId
//       )}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "x-client": "mobile",
//         },
//       }
//     );

//     console.log(
//       "[Razorpay] Status API response:",
//       statusRes.data
//     );

//     const tx = statusRes.data?.transaction;

//     const state =
//       tx?.status?.toUpperCase() ||
//       statusRes.data?.razorpay?.status?.toUpperCase() ||
//       "UNKNOWN";

//     console.log(
//       "[Razorpay] Detected state:",
//       state
//     );

//     // =========================
//     // PAYMENT SUCCESS
//     // =========================

//     if (
//       state === "SUCCESS" ||
//       state === "COMPLETED"
//     ) {
//       console.log(
//         "[Razorpay] Payment SUCCESS confirmed"
//       );

//       stopped = true;

//       Toast.show({
//         type: "success",
//         text1: "Payment Successful!",
//         text2: "Redirecting...",
//       });

//       setTimeout(() => {
//         navigation.reset({
//           index: 0,
//           routes: [
//             {
//               name: "BookingSuccessScreen",
//               params: {
//                 bookingId:
//                   statusRes.data?.bookingId ||
//                   tx?.bookingId,

//                 amountPaid: discountedAmount,

//                 transactionId:
//                   paymentData?.razorpay_payment_id ||
//                   merchantOrderId,

//                 userEmail: user.email,

//                 userPhone: user.phone,

//                 roomType: room.roomType,

//                 checkInDate: isoDate,

//                 duration: monthsNumber,
//               },
//             },
//           ],
//         });
//       }, 2500);

//       return;
//     }

//     // =========================
//     // PAYMENT FAILED
//     // =========================

//     if (
//       state === "FAILED" ||
//       state === "DECLINED" ||
//       state === "TIMED_OUT"
//     ) {
//       console.log(
//         "[Razorpay] Payment FAILED confirmed"
//       );

//       stopped = true;

//       navigation.reset({
//         index: 0,
//         routes: [
//           {
//             name: "PaymentFailedScreen",
//             params: {
//               room,
//               property,

//               amountPaid: discountedAmount,

//               rent,
//               monthsNumber,
//               isoDate,
//               netPayable,
//               preBookAmount,
//               actionType,

//               preferredFloor,
//               preferredRoomNumber,
//               preferredBed,

//               paymentMode,

//               transactionId:
//                 merchantOrderId,

//               reason:
//                 "Payment failed or was declined.",
//             },
//           },
//         ],
//       });

//       return;
//     }

//     // =========================
//     // STILL PROCESSING
//     // =========================

//     console.log(
//       `[Razorpay] Payment still processing: ${state}`
//     );

//     await new Promise(resolve =>
//       setTimeout(resolve, pollInterval)
//     );

//   } catch (statusError: any) {
//     console.log(
//       "[Razorpay] Status API error:",
//       statusError?.response?.data ||
//       statusError?.message ||
//       statusError
//     );

//     // Don't immediately fail the payment.
//     // Try status API again.
//     await new Promise(resolve =>
//       setTimeout(resolve, pollInterval)
//     );
//   }
// }

// // =========================
// // STATUS CHECK TIMEOUT
// // =========================

// if (!stopped) {
//   console.log(
//     "[Razorpay] Payment status polling timeout"
//   );

//   navigation.replace(
//     "PaymentFailedScreen",
//     {
//       room,
//       property,

//       amountPaid: discountedAmount,

//       rent,
//       monthsNumber,
//       isoDate,
//       netPayable,
//       preBookAmount,
//       actionType,

//       preferredFloor,
//       preferredRoomNumber,
//       preferredBed,

//       paymentMode,

//       transactionId:
//         merchantOrderId || "unknown",

//       reason:
//         "Payment is still being processed. Please check My Bookings later.",
//     }
//   );
// }

 

//   } catch (err: any) {

//     console.log(
//       "[Razorpay] Exception:",
//       err?.response?.data || err
//     );

//     const errorData =
//       err?.response?.data;

//     const backendMessage =
//       errorData?.message ||
//       err?.message ||
//       "Something went wrong. Please try again.";

//     // Razorpay checkout cancelled
//     if (
//       err?.code === 2 ||
//       err?.description
//         ?.toLowerCase()
//         ?.includes("cancel")
//     ) {
//       Toast.show({
//         type: "info",
//         text1: "Payment Cancelled",
//         text2: "You cancelled the payment.",
//       });

//       return;
//     }

//     if (
//       errorData?.code === "KYC_REQUIRED" ||
//       backendMessage
//         .toLowerCase()
//         .includes("kyc")
//     ) {
//       Toast.show({
//         type: "info",
//         text1: "KYC Required",
//         text2:
//           "Please complete KYC to continue booking",
//       });

//       navigation.replace(
//         "VerificationStatus"
//       );

//       return;
//     }

//     if (
//       backendMessage.includes(
//         "already have an active"
//       ) ||
//       backendMessage.includes(
//         "pending booking"
//       )
//     ) {
//       Toast.show({
//         type: "info",
//         text1: backendMessage,
//       });

//       return;
//     }

//     Toast.show({
//       type: "error",
//       text1: "Payment Error",
//       text2: backendMessage,
//     });

//     navigation.replace(
//       "PaymentFailedScreen",
//       {
//         room,
//         property,
//         amountPaid: discountedAmount,

//         rent,
//         monthsNumber,
//         isoDate,
//         netPayable,
//         preBookAmount,
//         actionType,

//         preferredFloor,
//         preferredRoomNumber,
//         preferredBed,

//         paymentMode,

//         transactionId:
//           merchantOrderId || "unknown",

//         reason: backendMessage,
//       }
//     );

//   } finally {
//     setLoading(false);

//     console.log(
//       "[Razorpay] Flow ended"
//     );
//   }
// };




const startPayment = async () => {
  let merchantOrderId: string | null = null;

  try {
    setLoading(true);

    console.log("[Razorpay] Starting payment flow");

    // 1️⃣ Prepare payment initiation payload
    const payload = {
      userId: Number(user.id),

      bookingType:
        actionType === "PreBook"
          ? "PREBOOK"
          : "BOOK",

      ...(actionType === "Book" && {
        paymentMode,
      }),

      couponCode:
        paymentMode === "MONTHLY"
          ? null
          : discount > 0
          ? appliedCoupon
          : null,

      amount: discountedAmount,

      metadata: {
        rateCardId: room.rateCardId,
        propertyId: room.propertyId,
        roomType: room.roomType,
        checkInDate: isoDate,
        duration: monthsNumber,
        monthlyRent: rent,

        originalAmount: finalPayable,
        discountedAmount: discountedAmount,

        preferredFloor: preferredFloor ?? null,
        preferredRoomNumber: preferredRoomNumber ?? null,
        preferredBed: preferredBed ?? null,
      },

      clientType: "mobile",
    };

    console.log("[Razorpay] Payload:", payload);

    // 2️⃣ Ask backend to create Razorpay Order
    const res = await axios.post(
      `${API_BASE_URL}/api/booking-payments/initiate`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-client": "mobile",
        },
      }
    );

    console.log(
      "[Razorpay] Initiate response:",
      res.data
    );

    // 3️⃣ Get Razorpay payment information
    const razorpayData = res.data?.razorpay;

    merchantOrderId = res.data?.merchantOrderId || null;

    const razorpayOrderId = razorpayData?.orderId;
    const razorpayAmount = razorpayData?.amount;
    const razorpayCurrency = razorpayData?.currency;

    if (
      !res.data?.success ||
      !razorpayOrderId ||
      razorpayAmount == null ||
      !razorpayCurrency ||
      !merchantOrderId
    ) {
      throw new Error(
        "Missing required Razorpay payment data"
      );
    }

    console.log(
      "[Razorpay] Order ID:",
      razorpayOrderId
    );

    console.log(
      "[Razorpay] Amount:",
      razorpayAmount
    );

    console.log(
      "[Razorpay] Currency:",
      razorpayCurrency
    );

    console.log(
      "[Razorpay] Merchant Order ID:",
      merchantOrderId
    );

    // 4️⃣ Open Razorpay Checkout
    const options = {
      key: RAZORPAY_KEY_ID,

      amount: razorpayAmount,

      currency: razorpayCurrency,

      name: "CocoLiving",

      description:
        actionType === "PreBook"
          ? "Pre-book Payment"
          : "Booking Payment",

      order_id: razorpayOrderId,

      prefill: {
        name: user?.name || "",
        email: user?.email || "",
        contact: user?.phone || "",
      },

      theme: {
        color: "#4F3421",
      },
    };

    console.log(
      "[Razorpay] Opening checkout:",
      options
    );

    // 5️⃣ Open Razorpay
    const paymentData =
      await RazorpayCheckout.open(options);

    console.log(
      "[Razorpay] Payment success:",
      paymentData
    );

    /*
     * IMPORTANT:
     *
     * RazorpayCheckout.open() resolved successfully.
     * Do NOT call the payment status API here and then
     * treat its failure as Razorpay payment failure.
     *
     * Your backend/webhook can process the payment in
     * the background.
     */

    Toast.show({
      type: "success",
      text1: "Payment Successful!",
      text2: "",
    });

    // 6️⃣ Navigate immediately after Razorpay success
    navigation.reset({
      index: 0,
      routes: [
        {
          name: "BookingSuccessScreen",
          params: {
            bookingId:
              res.data?.bookingId ||
              res.data?.booking?.id ||
              undefined,

            amountPaid: discountedAmount,

            transactionId:
              paymentData?.razorpay_payment_id ||
              merchantOrderId,

            merchantOrderId: merchantOrderId,

            userEmail: user.email,

            userPhone: user.phone,

            roomType: room.roomType,

            checkInDate: isoDate,

            duration: monthsNumber,
          },
        },
      ],
    });

    return;

  } catch (err: any) {

    console.log(
      "[Razorpay] Exception:",
      err?.response?.data || err
    );

    const errorData =
      err?.response?.data;

    const backendMessage =
      errorData?.message ||
      err?.message ||
      "Something went wrong. Please try again.";

    // 7️⃣ Razorpay checkout cancelled
    if (
      err?.code === 2 ||
      err?.description
        ?.toLowerCase()
        ?.includes("cancel")
    ) {
      Toast.show({
        type: "info",
        text1: "Payment Cancelled",
        text2: "You cancelled the payment.",
      });

      return;
    }

    // 8️⃣ KYC required
    if (
      errorData?.code === "KYC_REQUIRED" ||
      backendMessage
        .toLowerCase()
        .includes("kyc")
    ) {
      Toast.show({
        type: "info",
        text1: "KYC Required",
        text2:
          "Please complete KYC to continue booking",
      });

      navigation.replace(
        "VerificationStatus"
      );

      return;
    }

    // 9️⃣ Already active/pending booking
    if (
      backendMessage
        .toLowerCase()
        .includes("already have an active") ||
      backendMessage
        .toLowerCase()
        .includes("pending booking")
    ) {
      Toast.show({
        type: "info",
        text1: backendMessage,
      });

      return;
    }

    // 🔟 Other errors
    Toast.show({
      type: "error",
      text1: "Payment Error",
      text2: backendMessage,
    });

    navigation.replace(
      "PaymentFailedScreen",
      {
        room,
        property,

        amountPaid: discountedAmount,

        rent,
        monthsNumber,
        isoDate,
        netPayable,
        preBookAmount,
        actionType,

        preferredFloor,
        preferredRoomNumber,
        preferredBed,

        paymentMode,

        transactionId:
          merchantOrderId || "unknown",

        reason: backendMessage,
      }
    );

  } finally {
    setLoading(false);

    console.log(
      "[Razorpay] Flow ended"
    );
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
                      ? `${API_BASE_URL}${room.roomImages[0]}`
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
  <>
    <Row
      title="Net Payable"
      subtitle="Total Booking Value"
      value={`₹ ${netPayable.toLocaleString()}`}
      bold
    />

    <View style={styles.dashedLine} />

    {/* PAYMENT MODE */}
    <View style={{ marginTop: 20 }}>
      <Text style={styles.couponTitle}>Choose Rent Payment Mode</Text>

      <View style={styles.paymentModeBox}>

        <TouchableOpacity
          style={[
            styles.modeBtn,
            paymentMode === "FULL" && styles.activeModeBtn
          ]}
          onPress={() => setPaymentMode("FULL")}
        >
          <Text
            style={[
              styles.modeText,
              paymentMode === "FULL" && styles.activeModeText
            ]}
          >
            Pay in Full
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeBtn,
            paymentMode === "MONTHLY" && styles.activeModeBtn
          ]}
          onPress={() => setPaymentMode("MONTHLY")}
        >
          <Text
            style={[
              styles.modeText,
              paymentMode === "MONTHLY" && styles.activeModeText
            ]}
          >
            Pay Monthly
          </Text>
        </TouchableOpacity>

      </View>
    </View>

    <View style={styles.dashedLine} />
  </>
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






<View style={styles.dashedLine} />

          </>
        )}


       {discount > 0 && paymentMode !== "MONTHLY" && (
  <>
    <Row
      title="Coupon Discount"
      subtitle={
        discountType === "PERCENTAGE"
          ? `${discount}% OFF`
          : "Coupon Applied"
      }
      // value={`- ₹ ${
      //   discountType === "PERCENTAGE"
      //     ? (
      //       //(finalPayable * discount) / 100)
      //       (rent * monthsNumber * discount) / 100).toLocaleString()
      //     : discount.toLocaleString()
      // }`}
value={`- ₹ ${
  discountType === "PERCENTAGE"
    ? (
        actionType === "PreBook"
          ? (preBookAmount * discount) / 100
          : (rent * monthsNumber * discount) / 100
      ).toLocaleString()
    : discount.toLocaleString()
}`}

      
    />
    <View style={styles.dashedLine} />
  </>
)}

{/* FINAL PAYABLE — ALWAYS SHOW */}
<Row
  title="Final Payable"
  subtitle="Amount to be paid now"
  value={`₹ ${discountedAmount.toLocaleString()}`}
  bold
/>
      </View>


      {/* COUPON */}
<View style={styles.couponBox}>

  <Text style={styles.couponTitle}>Have a Coupon?</Text>

  <View style={styles.couponRow}>
    
    

<TextInput
  placeholder={
    paymentMode === "MONTHLY"
      ? "Coupon not applicable for monthly plan"
      : "Enter coupon code"
  }
  value={couponCode}
  editable={paymentMode !== "MONTHLY"}   // ❗ disable input
  onChangeText={(text) =>
    setCouponCode(text.replace(/\s/g, '').toUpperCase())
  }
  style={[
    styles.couponInput,
    paymentMode === "MONTHLY" && { backgroundColor: "#eee" }
  ]}
/>


   
<TouchableOpacity
  style={[
    styles.applyBtn,
    paymentMode === "MONTHLY" && { opacity: 0.5 }
  ]}
  onPress={applyCoupon}
  disabled={couponLoading || paymentMode === "MONTHLY"}
>
  <Text style={styles.applyText}>
    {couponLoading ? "..." : "Apply"}
  </Text>
</TouchableOpacity>




  </View>

</View>

      {/* Info */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          Booking details will be sent to{"\n"}
           {user.email}
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

// proceedBtn: {
//   backgroundColor: "#f6a452",
//   borderRadius: 10,
//   paddingVertical: 14,
//   marginTop: 30,
//   marginBottom: 40,   // 👈 extra margin so it doesn't merge with nav
// },

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
  couponBox: {
  marginTop: 20,
},

couponTitle: {
  fontFamily: "Quicksand-Bold",
  fontSize: 14,
  marginBottom: 6,
},

couponRow: {
  flexDirection: "row",
},

couponInput: {
  flex: 1,
  borderWidth: 1,
  borderColor: "#D2C3AD",
  borderRadius: 8,
  paddingHorizontal: 12,
  height: 45,
  marginRight: 10,
  fontFamily: "Quicksand-Regular",
},

applyBtn: {
  backgroundColor: "#4F3421",
  paddingHorizontal: 16,
  justifyContent: "center",
  borderRadius: 8,
},

applyText: {
  color: "#fff",
  fontFamily: "Quicksand-Bold",
},

paymentModeBox: {
  flexDirection: "row",
  gap: 10,
},

modeBtn: {
  flex: 1,
  borderWidth: 1,
  borderColor: "#D2C3AD",
  paddingVertical: 12,
  borderRadius: 8,
  alignItems: "center",
},

activeModeBtn: {
  backgroundColor: "#4F3421",
},

modeText: {
  fontFamily: "Quicksand-Regular",
  color: "#4F3421",
},

activeModeText: {
  color: "#fff",
  fontFamily: "Quicksand-Bold",
},


});