import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import Config from "react-native-config";
import RazorpayCheckout from "react-native-razorpay";
import { useNavigation } from "@react-navigation/native";
import HeaderGradient from "../components/HeaderGradient";
import colors from "../constants/color";
import { useAuth } from "../context/AuthContext";

export const API_BASE_URL = Config.API_BASE_URL;
export const RAZORPAY_KEY_ID = Config.RAZORPAY_KEY_ID;

type MealPlan = "2_TIMES" | "4_TIMES";

// Only two meal plans are available
const PLANS: MealPlan[] = ["2_TIMES", "4_TIMES"];

const PLAN_LABEL: Record<MealPlan, string> = {
  "2_TIMES": "2 Times / Day",
  "4_TIMES": "4 Times / Day",
};

// Fallback rates when the API doesn't send them (e.g. mealPlan is NONE)
const DEFAULT_RATES: Record<MealPlan, number> = {
  "2_TIMES": 4000,
  "4_TIMES": 6000,
};

// Fixed meal plan shown for ONLINE bookings
const ONLINE_MEAL_PLAN = "4 Times / Day";

// A meal plan can only be started if it can cover at least this many months
const MIN_MONTHS = 3;

const formatMonth = (ym: string) => {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-IN", {
    month: "short",
    year: "numeric",
  });
};

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "—";

const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();

// "YYYY-MM" -> month index
const ymIndex = (ym: string) => {
  const [y, m] = ym.split("-");
  return Number(y) * 12 + Number(m) - 1;
};

// month index -> "YYYY-MM"
const idxToYM = (i: number) =>
  `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;

const currentYM = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const MealsScreen = ({ route }: any) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const token = user?.token;

  // use route param if passed, otherwise fetch the active booking
  const [bookingId, setBookingId] = useState<number | null>(
    route?.params?.bookingId ?? null
  );
  const [loadingBooking, setLoadingBooking] = useState(
    !route?.params?.bookingId
  );
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const payingRef = useRef(false); // synchronous lock against double taps
  const [data, setData] = useState<any>(null);

  const [selectedPlan, setSelectedPlan] = useState<MealPlan>("2_TIMES");
  // How many months the user commits to when STARTING a new plan
  const [planMonths, setPlanMonths] = useState(MIN_MONTHS);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  // 1. Fetch active booking ID
  useEffect(() => {
    if (bookingId) return;

    if (!token) {
      setLoadingBooking(false);
      setLoading(false);
      return;
    }

    const fetchActiveBooking = async () => {
      try {
        setLoadingBooking(true);
        const res = await axios.get(
          `${API_BASE_URL}/api/book-room/active-booking`,
          { headers: authHeaders }
        );

        if (res.data?.bookingId) {
          setBookingId(res.data.bookingId);
        } else {
          setLoading(false);
          Alert.alert(
            "No Active Booking",
            "Meals are only available during an active booking."
          );
        }
      } catch (err: any) {
        console.log(
          "ACTIVE BOOKING ERROR:",
          err?.response?.data || err.message
        );
        setLoading(false);
        Alert.alert(
          "Active Booking Error",
          err?.response?.data?.message ||
            `Request failed with status ${err?.response?.status || "unknown"}`
        );
      } finally {
        setLoadingBooking(false);
      }
    };

    fetchActiveBooking();
  }, [token, bookingId, authHeaders]);

  // 2. Fetch meal subscription
  const fetchMealSubscription = useCallback(async () => {
    if (!token || !bookingId) return;
    try {
      const url = `${API_BASE_URL}/api/book-room/meal-subscription/${bookingId}`;
      const res = await axios.get(url, { headers: authHeaders });

      if (__DEV__) console.log("MEAL DATA:", JSON.stringify(res.data, null, 2));
      setData(res.data);

      // default the selector to the user's current plan
      const plan = res.data?.booking?.mealPlan;
      if (plan === "2_TIMES" || plan === "4_TIMES") setSelectedPlan(plan);
    } catch (error: any) {
      console.log("MEAL ERROR:", error?.response?.data || error.message);
      Alert.alert(
        "Failed to Load Meals",
        error?.response?.data?.message ||
          "Unable to fetch meal subscription details."
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId, token, authHeaders]);

  useEffect(() => {
    if (bookingId) fetchMealSubscription();
  }, [bookingId, fetchMealSubscription]);

  const booking = data?.booking;
  const meal = data?.meal;

  const isOnline = booking?.bookingSource === "ONLINE";
  const isOffline = booking?.bookingSource === "OFFLINE";

  // Meal payments only for OFFLINE bookings where rent does NOT include meals
  const canRecharge = isOffline && booking?.isRentIncludingMeals === false;

  // Use API rates if present, otherwise fall back
  const rates: Record<string, number> = meal?.rates ?? DEFAULT_RATES;

  // ---- Client meal plan rules ----
  // 1. A plan must be at least 3 months. The user picks the duration when
  //    starting; they can't top up with a shorter plan afterwards.
  // 2. Payment is collected monthly (1 month per payment).
  // 3. A full month is charged even if starting mid-month.
  // 4. Plan ends at its own end month (never beyond booking checkout).
  // 5. If the booking is extended, the old plan is NOT extended; a separate
  //    new plan must be taken (min 3 months again).
  //
  // Backend should return:
  // meal.plan = { mealPlan, startMonth, endMonth, months, paidMonths,
  //               nextUnpaidMonth }   (latest plan for this booking)
  const plan = meal?.plan;

  // Months paid (legacy fallback if API has no plan object)
  const paidMonths: number = plan
    ? plan.paidMonths ?? 0
    : meal?.installmentsPaid ??
      (meal?.subscriptions ?? [])
        .filter((s: any) => s.status === "PAID")
        .reduce((sum: number, s: any) => sum + (s.monthsCount ?? 0), 0);

  const totalPlanMonths: number = plan
    ? plan.months ?? 0
    : booking?.duration ?? 0;

  // A plan the user committed to and hasn't finished paying for
  const hasOpenPlan: boolean = plan
    ? (plan.paidMonths ?? 0) < (plan.months ?? 0)
    : paidMonths > 0 && totalPlanMonths - paidMonths > 0;

  // First month a NEW plan could cover: not in the past, not before check-in,
  // and not overlapping a previous plan (this prevents auto-extension).
  let startIdx = monthIndex(new Date());
  if (booking?.checkInDate) {
    startIdx = Math.max(startIdx, monthIndex(new Date(booking.checkInDate)));
  }
  if (plan?.endMonth) {
    startIdx = Math.max(startIdx, ymIndex(plan.endMonth) + 1);
  }

  // Months available for a new plan, through the checkout month (inclusive)
  const availableMonths = booking?.checkOutDate
    ? Math.max(monthIndex(new Date(booking.checkOutDate)) - startIdx + 1, 0)
    : 0;

  // No open plan and fewer than 3 months available -> cannot buy a plan
  const planBlocked = !hasOpenPlan && availableMonths < MIN_MONTHS;

  // Duration the user is committing to (clamped to 3..available)
  const effectivePlanMonths = Math.min(
    Math.max(planMonths, MIN_MONTHS),
    Math.max(availableMonths, MIN_MONTHS)
  );

  // Month that will be billed next
  const payMonth: string = hasOpenPlan
    ? plan?.nextUnpaidMonth ?? meal?.nextUnpaidMonth ?? currentYM()
    : idxToYM(startIdx);

  // Last month of the plan being shown / about to be bought
  const planEndLabel = hasOpenPlan
    ? plan?.endMonth
      ? formatMonth(plan.endMonth)
      : "your booking end"
    : formatMonth(idxToYM(startIdx + effectivePlanMonths - 1));

  // Monthly collection: only payable once that month has started
  const isDue = ymIndex(payMonth) <= ymIndex(currentYM());

  const canPay =
    canRecharge && isDue && (hasOpenPlan || availableMonths >= MIN_MONTHS);

  // Plan type is fixed once the user has an open plan
  const lockedPlan: MealPlan | null =
    hasOpenPlan && (plan?.mealPlan || booking?.mealPlan)
      ? ((plan?.mealPlan ?? booking?.mealPlan) as MealPlan)
      : null;
  const planOptions: MealPlan[] =
    lockedPlan === "2_TIMES" || lockedPlan === "4_TIMES"
      ? [lockedPlan]
      : PLANS;

  // Keep the selector valid when the plan is locked
  useEffect(() => {
    if (lockedPlan === "2_TIMES" || lockedPlan === "4_TIMES") {
      setSelectedPlan(lockedPlan);
    }
  }, [lockedPlan]);

  const rate: number = rates[selectedPlan] ?? 0;
  const total = rate; // always one full month per payment

  // Meal plan label: fixed for ONLINE, from API for OFFLINE
  const mealPlanLabel = isOnline
    ? ONLINE_MEAL_PLAN
    : PLAN_LABEL[booking?.mealPlan as MealPlan] ?? "No Meal Plan";

  const handleRecharge = async () => {
    // Synchronous lock: blocks rapid double taps instantly
    if (payingRef.current) return;

    if (!bookingId) {
      Alert.alert("No Active Booking", "No active booking found.");
      return;
    }

    if (planBlocked) {
      Alert.alert(
        "Meal Plan Unavailable",
        `A meal plan needs a minimum of ${MIN_MONTHS} months, and your booking ends too soon.`
      );
      return;
    }

    if (!canPay) {
      Alert.alert(
        "Payment Not Available",
        "No meal payment is due right now."
      );
      return;
    }

    payingRef.current = true;
    setPaying(true);
    try {
      // create order (monthly payment = 1 month).
      // planMonths is sent only when STARTING a new plan.
      const { data: order } = await axios.post(
        `${API_BASE_URL}/api/booking-payments/initiate-meal-recharge`,
        {
          bookingId,
          months: 1,
          mealPlan: selectedPlan,
          ...(hasOpenPlan ? {} : { planMonths: effectivePlanMonths }),
        },
        { headers: authHeaders }
      );

      if (__DEV__) console.log("ORDER RESPONSE:", JSON.stringify(order, null, 2));

      if (!order?.success) {
        throw new Error(order?.message || "Could not start payment.");
      }

      // open Razorpay (amount is already in paise)
      await RazorpayCheckout.open({
        key: RAZORPAY_KEY_ID,
        order_id: order.razorpay.orderId,
        amount: order.razorpay.amount,
        currency: order.razorpay.currency,
        name: "Meal Subscription",
        description: `${PLAN_LABEL[selectedPlan]} • ${order.billingMonths
          .map(formatMonth)
          .join(", ")}`,
        prefill: {
          email: user?.email,
          contact: user?.phone,
        },
        theme: { color: colors.nOrange },
      });

      Alert.alert("Payment Successful", "Your meal plan has been updated.");
      setPlanMonths(MIN_MONTHS);
      await fetchMealSubscription();
    } catch (error: any) {
      // Razorpay cancel = code 0
      if (error?.code === 0) return;

      console.log("RECHARGE ERROR:", error?.response?.data || error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.description ||
        error?.message ||
        "Something went wrong.";

      setTimeout(() => {
        Alert.alert("Payment Failed", String(msg));
      }, 100);
    } finally {
      payingRef.current = false; // release the lock
      setPaying(false);
    }
  };

  if (loadingBooking || loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.nOrange} />
        <Text style={styles.loadingText}>Loading meals...</Text>
      </View>
    );
  }

  if (!bookingId || !booking) {
    return (
      <View style={styles.noBookingContainer}>
        <Text style={styles.noBookingText}>No active booking found.</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderGradient title="Meals" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Summary (ONLINE + OFFLINE) */}
        <View style={styles.card}>
          <InfoRow
            label="Booking Duration"
            value={`${booking.duration ?? 0} Month(s)`}
          />
          <InfoRow
            label="Check-in Date"
            value={formatDate(booking.checkInDate)}
          />
          <InfoRow
            label="Check-out Date"
            value={formatDate(booking.checkOutDate)}
          />
          <InfoRow
            label="Meal Plan"
            value={mealPlanLabel}
            last={!canRecharge}
          />

          {/* Extra rows only when meal payments apply */}
          {canRecharge && (
            <>
              <InfoRow
                label="Months Paid"
                value={`${paidMonths} of ${totalPlanMonths}`}
              />
              <InfoRow
                label={hasOpenPlan ? "Next Unpaid Month" : "Next Plan Starts"}
                value={
                  hasOpenPlan
                    ? formatMonth(payMonth)
                    : availableMonths > 0
                    ? formatMonth(idxToYM(startIdx))
                    : "—"
                }
                last
              />
            </>
          )}
        </View>

        {/* Blocked: fewer than 3 months available for a new plan */}
        {canRecharge && !hasOpenPlan && planBlocked && availableMonths > 0 && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Meal Plan Unavailable</Text>
            <Text style={styles.subText}>
              A meal plan needs a minimum of {MIN_MONTHS} months. Fewer than{" "}
              {MIN_MONTHS} months remain after your current plan or check-in, so
              a new plan can't be started.
            </Text>
          </View>
        )}

        {/* Next month's payment is not due yet */}
        {canRecharge &&
          !isDue &&
          (hasOpenPlan || availableMonths >= MIN_MONTHS) && (
            <View style={[styles.card, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>Next Payment</Text>
              <Text style={styles.subText}>
                Your next meal payment is for {formatMonth(payMonth)}. It can be
                paid once that month starts.
              </Text>
            </View>
          )}

        {/* Meal plan selection / monthly payment */}
        {canPay && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>
              {hasOpenPlan ? "Pay Monthly Meals" : "Select Meal Plan"}
            </Text>

            <Text style={[styles.subText, { marginBottom: 12 }]}>
              {hasOpenPlan
                ? `Payment for ${formatMonth(payMonth)}. Your plan ends in ${planEndLabel}.`
                : `Minimum ${MIN_MONTHS} months, paid monthly. The full month's amount is charged even if you start mid-month. If your booking is extended, the plan is not extended automatically.`}
            </Text>

            <View style={styles.planRow}>
              {planOptions.map((p) => {
                const active = p === selectedPlan;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.planChip, active && styles.planChipActive]}
                    onPress={() => setSelectedPlan(p)}
                    disabled={paying || !!lockedPlan}
                  >
                    <Text
                      style={[styles.planText, active && styles.planTextActive]}
                    >
                      {PLAN_LABEL[p]}
                    </Text>
                    <Text
                      style={[styles.planRate, active && styles.planTextActive]}
                    >
                      ₹{rates[p] ?? DEFAULT_RATES[p]}/mo
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Duration commitment: only when starting a new plan */}
            {!hasOpenPlan && (
              <>
                <View style={styles.stepperRow}>
                  <Text style={styles.label}>Plan Duration (months)</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      disabled={effectivePlanMonths <= MIN_MONTHS || paying}
                      onPress={() =>
                        setPlanMonths(Math.max(MIN_MONTHS, effectivePlanMonths - 1))
                      }
                    >
                      <Text
                        style={[
                          styles.stepText,
                          effectivePlanMonths <= MIN_MONTHS && { opacity: 0.3 },
                        ]}
                      >
                        −
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.stepValue}>{effectivePlanMonths}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      disabled={effectivePlanMonths >= availableMonths || paying}
                      onPress={() =>
                        setPlanMonths(
                          Math.min(availableMonths, effectivePlanMonths + 1)
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.stepText,
                          effectivePlanMonths >= availableMonths && {
                            opacity: 0.3,
                          },
                        ]}
                      >
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.subText, { marginTop: 8 }]}>
                  {formatMonth(idxToYM(startIdx))} – {planEndLabel} (
                  {effectivePlanMonths} months). Billed monthly.
                </Text>
              </>
            )}

            <TouchableOpacity
              style={[styles.payBtn, paying && { opacity: 0.6 }]}
              onPress={handleRecharge}
              disabled={paying}
              activeOpacity={0.8}
            >
              {paying ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.payText}>
                  Pay ₹{total} for {formatMonth(payMonth)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Timeline: only if meal payments apply and API sent a timeline */}
        {canRecharge && meal?.timeline?.length > 0 && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Billing Timeline</Text>
            {meal.timeline.map((t: any, i: number) => {
              const paid = t.status === "PAID";
              return (
                <View
                  key={t.billingMonth}
                  style={[
                    styles.timelineRow,
                    i === meal.timeline.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View>
                    <Text style={styles.value}>
                      {formatMonth(t.billingMonth)}
                    </Text>
                    {paid && (
                      <Text style={styles.subText}>
                        {PLAN_LABEL[t.mealPlan as MealPlan]} • ₹{t.monthlyRate}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.badge,
                      paid ? styles.badgePaid : styles.badgeUnpaid,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: paid ? "#1E7B3A" : "#B45309" },
                      ]}
                    >
                      {t.isWaived ? "WAIVED" : t.status}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ label, value, last }: any) => (
  <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export default MealsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F3EC" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.nOrange,
    fontFamily: "Quicksand-Medium",
  },
  noBookingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noBookingText: {
    fontSize: 16,
    textAlign: "center",
    color: "#444",
    marginBottom: 20,
    fontFamily: "Quicksand-Medium",
  },
  backBtn: {
    backgroundColor: colors.nOrange,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  backBtnText: { color: "#fff", fontSize: 16, fontFamily: "Quicksand-Bold" },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#3C2A1E",
    fontFamily: "Quicksand-Bold",
    marginBottom: 12,
  },
  row: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  label: {
    fontSize: 13,
    color: "#888",
    fontFamily: "Quicksand-Medium",
    marginBottom: 6,
  },
  value: { fontSize: 17, color: "#3C2A1E", fontFamily: "Quicksand-Bold" },
  subText: {
    fontSize: 12,
    color: "#888",
    fontFamily: "Quicksand-Medium",
    marginTop: 2,
  },

  planRow: { flexDirection: "row", gap: 10 },
  planChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#EFEFEF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  planChipActive: { borderColor: colors.nOrange, backgroundColor: "#FFF4E8" },
  planText: { fontSize: 14, color: "#3C2A1E", fontFamily: "Quicksand-Bold" },
  planRate: {
    fontSize: 12,
    color: "#888",
    fontFamily: "Quicksand-Medium",
    marginTop: 4,
  },
  planTextActive: { color: "#C97A1E" },

  stepperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },
  stepper: { flexDirection: "row", alignItems: "center" },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F6F3EC",
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { fontSize: 20, color: "#3C2A1E", fontFamily: "Quicksand-Bold" },
  stepValue: {
    minWidth: 40,
    textAlign: "center",
    fontSize: 17,
    color: "#3C2A1E",
    fontFamily: "Quicksand-Bold",
  },

  payBtn: {
    marginTop: 20,
    backgroundColor: colors.nOrange,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  payText: { color: "#FFF", fontSize: 16, fontFamily: "Quicksand-Bold" },

  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgePaid: { backgroundColor: "#E6F6EC" },
  badgeUnpaid: { backgroundColor: "#FEF3E2" },
  badgeText: { fontSize: 11, fontFamily: "Quicksand-Bold" },
});


// import React, { useCallback, useEffect, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   TouchableOpacity,
// } from "react-native";
// import axios from "axios";
// import Config from "react-native-config";
// import RazorpayCheckout from "react-native-razorpay";
// import { useNavigation } from "@react-navigation/native";
// import HeaderGradient from "../components/HeaderGradient";
// import colors from "../constants/color";
// import { useAuth } from "../context/AuthContext";

// export const API_BASE_URL = Config.API_BASE_URL;
// //export const MERCHANT_ID = Config.MERCHANT_ID;
// //export const ENVIRONMENT = Config.ENVIRONMENT;
// export const RAZORPAY_KEY_ID = Config.RAZORPAY_KEY_ID;

// type MealPlan = "2_TIMES" | "4_TIMES";

// // Only two meal plans are available
// const PLANS: MealPlan[] = ["2_TIMES", "4_TIMES"];

// const PLAN_LABEL: Record<MealPlan, string> = {
//   "2_TIMES": "2 Times / Day",
//   "4_TIMES": "4 Times / Day",
// };

// // Fallback rates when the API doesn't send them (e.g. mealPlan is NONE)
// const DEFAULT_RATES: Record<MealPlan, number> = {
//   "2_TIMES": 4000,
//   "4_TIMES": 6000,
// };

// // Fixed meal plan shown for ONLINE bookings
// const ONLINE_MEAL_PLAN = "4 Times / Day";

// // A meal plan can only be started if at least this many months are available
// const MIN_MONTHS = 3;

// const formatMonth = (ym: string) => {
//   const [y, m] = ym.split("-");
//   return new Date(Number(y), Number(m) - 1).toLocaleString("en-IN", {
//     month: "short",
//     year: "numeric",
//   });
// };

// const formatDate = (d?: string) =>
//   d ? new Date(d).toLocaleDateString("en-GB") : "—";

// const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();

// // "YYYY-MM" -> month index
// const ymIndex = (ym: string) => {
//   const [y, m] = ym.split("-");
//   return Number(y) * 12 + Number(m) - 1;
// };

// const currentYM = () => {
//   const d = new Date();
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
// };

// // Calendar months from now (or check-in, if in the future) through the
// // checkout month, inclusive. The current month always counts as a full month.
// //   Today Oct 31, checkout Dec 31 or Dec 7 -> Oct, Nov, Dec = 3
// //   Today Nov 1,  checkout Dec 31 or Dec 7 -> Nov, Dec      = 2
// const getBillableMonthsLeft = (checkOut?: string, checkIn?: string) => {
//   if (!checkOut) return 0;
//   let start = monthIndex(new Date());
//   if (checkIn) start = Math.max(start, monthIndex(new Date(checkIn)));
//   return Math.max(monthIndex(new Date(checkOut)) - start + 1, 0);
// };

// const MealsScreen = ({ route }: any) => {
//   const navigation = useNavigation();
//   const { user } = useAuth();
//   const token = user?.token;

//   // use route param if passed, otherwise fetch the active booking
//   const [bookingId, setBookingId] = useState<number | null>(
//     route?.params?.bookingId ?? null
//   );
//   const [loadingBooking, setLoadingBooking] = useState(
//     !route?.params?.bookingId
//   );
//   const [loading, setLoading] = useState(true);
//   const [paying, setPaying] = useState(false);
//   const payingRef = useRef(false); // synchronous lock against double taps
//   const [data, setData] = useState<any>(null);

//   const [selectedPlan, setSelectedPlan] = useState<MealPlan>("2_TIMES");

//   const authHeaders = { Authorization: `Bearer ${token}` };

//   // 1. Fetch active booking ID
//   useEffect(() => {
//     if (bookingId) return;

//     if (!token) {
//       setLoadingBooking(false);
//       setLoading(false);
//       return;
//     }

//     const fetchActiveBooking = async () => {
//       try {
//         setLoadingBooking(true);
//         const res = await axios.get(
//           `${API_BASE_URL}/api/book-room/active-booking`,
//           {
//             headers: authHeaders,
//           }
//         );

//         if (res.data?.bookingId) {
//           setBookingId(res.data.bookingId);
//         } else {
//           setLoading(false);
//           Alert.alert(
//             "No Active Booking",
//             "Meals are only available during an active booking."
//           );
//         }
//       } catch (err: any) {
//         console.log(
//           "ACTIVE BOOKING ERROR:",
//           err?.response?.data || err.message
//         );
//         setLoading(false);
//         Alert.alert(
//           "Active Booking Error",
//           err?.response?.data?.message ||
//             `Request failed with status ${err?.response?.status || "unknown"}`
//         );
//       } finally {
//         setLoadingBooking(false);
//       }
//     };

//     fetchActiveBooking();
//   }, [token, bookingId]);

//   // 2. Fetch meal subscription
//   const fetchMealSubscription = useCallback(async () => {
//     if (!token || !bookingId) return;
//     try {
//       const url = `${API_BASE_URL}/api/book-room/meal-subscription/${bookingId}`;
//       const res = await axios.get(url, { headers: authHeaders });

//       console.log(`curl -X GET "${url}" -H "Authorization: Bearer ${token}"`);
//       console.log("MEAL DATA:", JSON.stringify(res.data, null, 2));
//       setData(res.data);

//       // default the selector to the user's current plan
//       const plan = res.data?.booking?.mealPlan;
//       if (plan === "2_TIMES" || plan === "4_TIMES") setSelectedPlan(plan);
//     } catch (error: any) {
//       console.log("MEAL ERROR:", error?.response?.data || error.message);
//       Alert.alert(
//         "Failed to Load Meals",
//         error?.response?.data?.message ||
//           "Unable to fetch meal subscription details."
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [bookingId, token]);

//   useEffect(() => {
//     if (bookingId) fetchMealSubscription();
//   }, [bookingId, fetchMealSubscription]);

//   const booking = data?.booking;
//   const meal = data?.meal;

//   const isOnline = booking?.bookingSource === "ONLINE";
//   const isOffline = booking?.bookingSource === "OFFLINE";

//   // Meal payments only for OFFLINE bookings where rent does NOT include meals
//   const canRecharge = isOffline && booking?.isRentIncludingMeals === false;

//   // Use API rates if present, otherwise fall back
//   const rates: Record<string, number> = meal?.rates ?? DEFAULT_RATES;

//   // Months already paid: from API, or counted from PAID subscriptions
//   const paidMonths: number =
//     meal?.installmentsPaid ??
//     (meal?.subscriptions ?? [])
//       .filter((s: any) => s.status === "PAID")
//       .reduce((sum: number, s: any) => sum + (s.monthsCount ?? 0), 0);

//   // Months left: from API, or booking duration minus paid months
//   const remaining: number =
//     meal?.installmentsRemaining ??
//     Math.max((booking?.duration ?? 0) - paidMonths, 0);

//   // ---- Client meal plan rules ----
//   // 1. Plan can only be STARTED if at least 3 months are available
//   //    (current month counts fully, even if started mid-month).
//   // 2. Payment is collected monthly (1 month per payment).
//   // 3. Plan ends with the booking checkout month.
//   const billableMonthsLeft = getBillableMonthsLeft(
//     booking?.checkOutDate,
//     booking?.checkInDate
//   );

//   const isStarted = paidMonths > 0;

//   // Not started and fewer than 3 months left -> cannot select a plan
//   const planBlocked = !isStarted && billableMonthsLeft < MIN_MONTHS;

//   // Month that will be billed next (API value, else the current month)
//   const payMonth: string = meal?.nextUnpaidMonth ?? currentYM();

//   // Monthly collection: only payable once that month has started
//   const isDue = ymIndex(payMonth) <= ymIndex(currentYM());

//   const canPay =
//     canRecharge &&
//     remaining > 0 &&
//     billableMonthsLeft > 0 &&
//     !planBlocked &&
//     isDue;

//   // Plan is fixed once the user has started paying
//   const lockedPlan: MealPlan | null =
//     isStarted &&
//     (booking?.mealPlan === "2_TIMES" || booking?.mealPlan === "4_TIMES")
//       ? booking.mealPlan
//       : null;
//   const planOptions: MealPlan[] = lockedPlan ? [lockedPlan] : PLANS;

//   const rate: number = rates[selectedPlan] ?? 0;
//   const total = rate; // always one full month per payment

//   // Meal plan label: fixed for ONLINE, from API for OFFLINE
//   const mealPlanLabel = isOnline
//     ? ONLINE_MEAL_PLAN
//     : PLAN_LABEL[booking?.mealPlan as MealPlan] ?? "No Meal Plan";

//   const handleRecharge = async () => {
//     // Synchronous lock: blocks rapid double taps instantly
//     if (payingRef.current) return;

//     if (!bookingId) {
//       Alert.alert("No Active Booking", "No active booking found.");
//       return;
//     }

//     if (planBlocked) {
//       Alert.alert(
//         "Meal Plan Unavailable",
//         `A meal plan needs a minimum of ${MIN_MONTHS} months, and your booking ends too soon.`
//       );
//       return;
//     }

//     if (!canPay) {
//       Alert.alert(
//         "Payment Not Available",
//         "No meal payment is due right now."
//       );
//       return;
//     }

//     payingRef.current = true;
//     setPaying(true);
//     try {
//       // create order (monthly payment = 1 month)
//       const { data: order } = await axios.post(
//         `${API_BASE_URL}/api/booking-payments/initiate-meal-recharge`,
//         { bookingId, months: 1, mealPlan: selectedPlan },
//         { headers: authHeaders }
//       );

//       console.log("ORDER RESPONSE:", JSON.stringify(order, null, 2));

//       if (!order?.success) {
//         throw new Error(order?.message || "Could not start payment.");
//       }

//       // open Razorpay (amount is already in paise)
//       await RazorpayCheckout.open({
//         key: RAZORPAY_KEY_ID,
//         order_id: order.razorpay.orderId,
//         amount: order.razorpay.amount,
//         currency: order.razorpay.currency,
//         name: "Meal Subscription",
//         description: `${PLAN_LABEL[selectedPlan]} • ${order.billingMonths
//           .map(formatMonth)
//           .join(", ")}`,
//         prefill: {
//           email: user?.email,
//           contact: user?.phone,
//         },
//         theme: { color: colors.nOrange },
//       });

//       Alert.alert("Payment Successful", "Your meal plan has been updated.");
//       await fetchMealSubscription();
//     } catch (error: any) {
//       // Razorpay cancel = code 0
//       if (error?.code === 0) return;

//       console.log("RECHARGE ERROR:", error?.response?.data || error);
//       const msg =
//         error?.response?.data?.message ||
//         error?.response?.data?.error ||
//         error?.description ||
//         error?.message ||
//         "Something went wrong.";

//       setTimeout(() => {
//         Alert.alert("Payment Failed", String(msg));
//       }, 100);
//     } finally {
//       payingRef.current = false; // release the lock
//       setPaying(false);
//     }
//   };

//   if (loadingBooking || loading) {
//     return (
//       <View style={styles.loader}>
//         <ActivityIndicator size="large" color={colors.nOrange} />
//         <Text style={styles.loadingText}>Loading meals...</Text>
//       </View>
//     );
//   }

//   if (!bookingId || !booking) {
//     return (
//       <View style={styles.noBookingContainer}>
//         <Text style={styles.noBookingText}>No active booking found.</Text>
//         <TouchableOpacity
//           style={styles.backBtn}
//           onPress={() => navigation.goBack()}
//         >
//           <Text style={styles.backBtnText}>Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <HeaderGradient title="Meals" />

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
//       >
//         {/* Summary (ONLINE + OFFLINE) */}
//         <View style={styles.card}>
//           <InfoRow
//             label="Booking Duration"
//             value={`${booking.duration ?? 0} Month(s)`}
//           />
//           <InfoRow
//             label="Check-in Date"
//             value={formatDate(booking.checkInDate)}
//           />
//           <InfoRow
//             label="Check-out Date"
//             value={formatDate(booking.checkOutDate)}
//           />
//           <InfoRow
//             label="Meal Plan"
//             value={mealPlanLabel}
//             last={!canRecharge}
//           />

//           {/* Extra rows only when meal payments apply */}
//           {canRecharge && (
//             <>
//               <InfoRow
//                 label="Months Paid"
//                 value={`${paidMonths} of ${booking.duration ?? 0}`}
//               />
//               <InfoRow
//                 label="Next Unpaid Month"
//                 value={
//                   meal?.nextUnpaidMonth
//                     ? formatMonth(meal.nextUnpaidMonth)
//                     : "—"
//                 }
//                 last
//               />
//             </>
//           )}
//         </View>

//         {/* Blocked: fewer than 3 months left to start a plan */}
//         {canRecharge && remaining > 0 && planBlocked && (
//           <View style={[styles.card, { marginTop: 16 }]}>
//             <Text style={styles.sectionTitle}>Meal Plan Unavailable</Text>
//             <Text style={styles.subText}>
//               A meal plan needs a minimum of {MIN_MONTHS} months. Your booking
//               ends too soon to start one.
//             </Text>
//           </View>
//         )}

//         {/* Started, but next month's payment is not due yet */}
//         {canRecharge &&
//           remaining > 0 &&
//           !planBlocked &&
//           billableMonthsLeft > 0 &&
//           !isDue && (
//             <View style={[styles.card, { marginTop: 16 }]}>
//               <Text style={styles.sectionTitle}>Next Payment</Text>
//               <Text style={styles.subText}>
//                 Your next meal payment is for {formatMonth(payMonth)}. It can
//                 be paid once that month starts.
//               </Text>
//             </View>
//           )}

//         {/* Meal plan selection / monthly payment */}
//         {canPay && (
//           <View style={[styles.card, { marginTop: 16 }]}>
//             <Text style={styles.sectionTitle}>
//               {isStarted ? "Pay Monthly Meals" : "Select Meal Plan"}
//             </Text>

//             <Text style={[styles.subText, { marginBottom: 12 }]}>
//               {isStarted
//                 ? `Payment for ${formatMonth(payMonth)}. Plan ends with your booking.`
//                 : `Minimum ${MIN_MONTHS} months, paid monthly. The full month's amount is charged even if you start mid-month. The plan ends with your booking.`}
//             </Text>

//             <View style={styles.planRow}>
//               {planOptions.map((plan) => {
//                 const active = plan === selectedPlan;
//                 return (
//                   <TouchableOpacity
//                     key={plan}
//                     style={[styles.planChip, active && styles.planChipActive]}
//                     onPress={() => setSelectedPlan(plan)}
//                     disabled={paying || !!lockedPlan}
//                   >
//                     <Text
//                       style={[styles.planText, active && styles.planTextActive]}
//                     >
//                       {PLAN_LABEL[plan]}
//                     </Text>
//                     <Text
//                       style={[styles.planRate, active && styles.planTextActive]}
//                     >
//                       ₹{rates[plan] ?? DEFAULT_RATES[plan]}/mo
//                     </Text>
//                   </TouchableOpacity>
//                 );
//               })}
//             </View>

//             <TouchableOpacity
//               style={[styles.payBtn, paying && { opacity: 0.6 }]}
//               onPress={handleRecharge}
//               disabled={paying}
//               activeOpacity={0.8}
//             >
//               {paying ? (
//                 <ActivityIndicator color="#FFF" />
//               ) : (
//                 <Text style={styles.payText}>
//                   Pay ₹{total} for {formatMonth(payMonth)}
//                 </Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Timeline: only if meal payments apply and API sent a timeline */}
//         {canRecharge && meal?.timeline?.length > 0 && (
//           <View style={[styles.card, { marginTop: 16 }]}>
//             <Text style={styles.sectionTitle}>Billing Timeline</Text>
//             {meal.timeline.map((t: any, i: number) => {
//               const paid = t.status === "PAID";
//               return (
//                 <View
//                   key={t.billingMonth}
//                   style={[
//                     styles.timelineRow,
//                     i === meal.timeline.length - 1 && { borderBottomWidth: 0 },
//                   ]}
//                 >
//                   <View>
//                     <Text style={styles.value}>
//                       {formatMonth(t.billingMonth)}
//                     </Text>
//                     {paid && (
//                       <Text style={styles.subText}>
//                         {PLAN_LABEL[t.mealPlan as MealPlan]} • ₹{t.monthlyRate}
//                       </Text>
//                     )}
//                   </View>
//                   <View
//                     style={[
//                       styles.badge,
//                       paid ? styles.badgePaid : styles.badgeUnpaid,
//                     ]}
//                   >
//                     <Text
//                       style={[
//                         styles.badgeText,
//                         { color: paid ? "#1E7B3A" : "#B45309" },
//                       ]}
//                     >
//                       {t.isWaived ? "WAIVED" : t.status}
//                     </Text>
//                   </View>
//                 </View>
//               );
//             })}
//           </View>
//         )}
//       </ScrollView>
//     </View>
//   );
// };

// const InfoRow = ({ label, value, last }: any) => (
//   <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
//     <Text style={styles.label}>{label}</Text>
//     <Text style={styles.value}>{value}</Text>
//   </View>
// );

// export default MealsScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F6F3EC" },
//   loader: { flex: 1, justifyContent: "center", alignItems: "center" },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: colors.nOrange,
//     fontFamily: "Quicksand-Medium",
//   },
//   noBookingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   noBookingText: {
//     fontSize: 16,
//     textAlign: "center",
//     color: "#444",
//     marginBottom: 20,
//     fontFamily: "Quicksand-Medium",
//   },
//   backBtn: {
//     backgroundColor: colors.nOrange,
//     paddingVertical: 14,
//     paddingHorizontal: 30,
//     borderRadius: 10,
//   },
//   backBtnText: { color: "#fff", fontSize: 16, fontFamily: "Quicksand-Bold" },

//   card: {
//     backgroundColor: "#FFF",
//     borderRadius: 18,
//     padding: 18,
//     elevation: 2,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     color: "#3C2A1E",
//     fontFamily: "Quicksand-Bold",
//     marginBottom: 12,
//   },
//   row: {
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#EFEFEF",
//   },
//   label: {
//     fontSize: 13,
//     color: "#888",
//     fontFamily: "Quicksand-Medium",
//     marginBottom: 6,
//   },
//   value: { fontSize: 17, color: "#3C2A1E", fontFamily: "Quicksand-Bold" },
//   subText: {
//     fontSize: 12,
//     color: "#888",
//     fontFamily: "Quicksand-Medium",
//     marginTop: 2,
//   },

//   planRow: { flexDirection: "row", gap: 10 },
//   planChip: {
//     flex: 1,
//     borderWidth: 1.5,
//     borderColor: "#EFEFEF",
//     borderRadius: 14,
//     padding: 12,
//     alignItems: "center",
//   },
//   planChipActive: { borderColor: colors.nOrange, backgroundColor: "#FFF4E8" },
//   planText: { fontSize: 14, color: "#3C2A1E", fontFamily: "Quicksand-Bold" },
//   planRate: {
//     fontSize: 12,
//     color: "#888",
//     fontFamily: "Quicksand-Medium",
//     marginTop: 4,
//   },
//   planTextActive: { color: "#C97A1E" },

//   payBtn: {
//     marginTop: 20,
//     backgroundColor: colors.nOrange,
//     borderRadius: 14,
//     paddingVertical: 14,
//     alignItems: "center",
//   },
//   payText: { color: "#FFF", fontSize: 16, fontFamily: "Quicksand-Bold" },

//   timelineRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#EFEFEF",
//   },
//   badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
//   badgePaid: { backgroundColor: "#E6F6EC" },
//   badgeUnpaid: { backgroundColor: "#FEF3E2" },
//   badgeText: { fontSize: 11, fontFamily: "Quicksand-Bold" },
// });

// // import React, { useCallback, useEffect, useRef, useState } from "react";
// // import {
// //   View,
// //   Text,
// //   StyleSheet,
// //   ActivityIndicator,
// //   Alert,
// //   ScrollView,
// //   TouchableOpacity,
// // } from "react-native";
// // import axios from "axios";
// // import Config from "react-native-config";
// // import RazorpayCheckout from "react-native-razorpay";
// // import { useNavigation } from "@react-navigation/native";
// // import HeaderGradient from "../components/HeaderGradient";
// // import colors from "../constants/color";
// // import { useAuth } from "../context/AuthContext";

// // export const API_BASE_URL = Config.API_BASE_URL;
// // //export const MERCHANT_ID = Config.MERCHANT_ID;
// // //export const ENVIRONMENT = Config.ENVIRONMENT;
// // export const RAZORPAY_KEY_ID = Config.RAZORPAY_KEY_ID;

// // type MealPlan = "2_TIMES" | "4_TIMES";

// // const PLAN_LABEL: Record<MealPlan, string> = {
// //   "2_TIMES": "2 Meals / Day",
// //   "4_TIMES": "4 Meals / Day",
// // };

// // // Fallback rates when the API doesn't send them (e.g. mealPlan is NONE)
// // const DEFAULT_RATES: Record<MealPlan, number> = {
// //   "2_TIMES": 4000,
// //   "4_TIMES": 6000,
// // };

// // // Fixed meal plan shown for ONLINE bookings
// // const ONLINE_MEAL_PLAN = "4 Meals / Day";

// // const formatMonth = (ym: string) => {
// //   const [y, m] = ym.split("-");
// //   return new Date(Number(y), Number(m) - 1).toLocaleString("en-IN", {
// //     month: "short",
// //     year: "numeric",
// //   });
// // };

// // const formatDate = (d?: string) =>
// //   d ? new Date(d).toLocaleDateString("en-GB") : "—";

// // const MealsScreen = ({ route }: any) => {
// //   const navigation = useNavigation();
// //   const { user } = useAuth();
// //   const token = user?.token;

// //   // use route param if passed, otherwise fetch the active booking
// //   const [bookingId, setBookingId] = useState<number | null>(
// //     route?.params?.bookingId ?? null
// //   );
// //   const [loadingBooking, setLoadingBooking] = useState(
// //     !route?.params?.bookingId
// //   );
// //   const [loading, setLoading] = useState(true);
// //   const [paying, setPaying] = useState(false);
// //   const payingRef = useRef(false); // synchronous lock against double taps
// //   const [data, setData] = useState<any>(null);

// //   const [selectedPlan, setSelectedPlan] = useState<MealPlan>("2_TIMES");
// //   const [months, setMonths] = useState(1);

// //   const authHeaders = { Authorization: `Bearer ${token}` };

// //   // 1. Fetch active booking ID
// //   useEffect(() => {
// //     if (bookingId) return;

// //     if (!token) {
// //       setLoadingBooking(false);
// //       setLoading(false);
// //       return;
// //     }

// //     const fetchActiveBooking = async () => {
// //       try {
// //         setLoadingBooking(true);
// //         const res = await axios.get(
// //           `${API_BASE_URL}/api/book-room/active-booking`,
// //           {
// //             headers: authHeaders,
// //           }
// //         );

// //         if (res.data?.bookingId) {
// //           setBookingId(res.data.bookingId);
// //         } else {
// //           setLoading(false);
// //           Alert.alert(
// //             "No Active Booking",
// //             "Meals are only available during an active booking."
// //           );
// //         }
// //       } catch (err: any) {
// //         console.log(
// //           "ACTIVE BOOKING ERROR:",
// //           err?.response?.data || err.message
// //         );
// //         setLoading(false);
// //         Alert.alert(
// //           "Active Booking Error",
// //           err?.response?.data?.message ||
// //             `Request failed with status ${err?.response?.status || "unknown"}`
// //         );
// //       } finally {
// //         setLoadingBooking(false);
// //       }
// //     };

// //     fetchActiveBooking();
// //   }, [token, bookingId]);

// //   // 2. Fetch meal subscription
// //   const fetchMealSubscription = useCallback(async () => {
// //     if (!token || !bookingId) return;
// //     try {
// //       const url = `${API_BASE_URL}/api/book-room/meal-subscription/${bookingId}`;
// //       const res = await axios.get(url, { headers: authHeaders });

// //       console.log(`curl -X GET "${url}" -H "Authorization: Bearer ${token}"`);
// //       console.log("MEAL DATA:", JSON.stringify(res.data, null, 2));
// //       setData(res.data);

// //       // default the selector to the user's current plan
// //       const plan = res.data?.booking?.mealPlan;
// //       if (plan === "2_TIMES" || plan === "4_TIMES") setSelectedPlan(plan);
// //     } catch (error: any) {
// //       console.log("MEAL ERROR:", error?.response?.data || error.message);
// //       Alert.alert(
// //         "Failed to Load Meals",
// //         error?.response?.data?.message ||
// //           "Unable to fetch meal subscription details."
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [bookingId, token]);

// //   useEffect(() => {
// //     if (bookingId) fetchMealSubscription();
// //   }, [bookingId, fetchMealSubscription]);

// //   const booking = data?.booking;
// //   const meal = data?.meal;

// //   const isOnline = booking?.bookingSource === "ONLINE";
// //   const isOffline = booking?.bookingSource === "OFFLINE";

// //   // Recharge only for OFFLINE bookings where rent does NOT include meals
// //   const canRecharge = isOffline && booking?.isRentIncludingMeals === false;

// //   // Use API rates if present, otherwise fall back
// //   const rates: Record<string, number> = meal?.rates ?? DEFAULT_RATES;

// //   // Months already paid: from API, or counted from PAID subscriptions
// //   const paidMonths: number =
// //     meal?.installmentsPaid ??
// //     (meal?.subscriptions ?? [])
// //       .filter((s: any) => s.status === "PAID")
// //       .reduce((sum: number, s: any) => sum + (s.monthsCount ?? 0), 0);

// //   // Months left: from API, or booking duration minus paid months
// //   const remaining: number =
// //     meal?.installmentsRemaining ??
// //     Math.max((booking?.duration ?? 0) - paidMonths, 0);

// //   const rate: number = rates[selectedPlan] ?? 0;
// //   const total = rate * months;

// //   // Meal plan label: fixed for ONLINE, from API for OFFLINE
// //   const mealPlanLabel = isOnline
// //     ? ONLINE_MEAL_PLAN
// //     : PLAN_LABEL[booking?.mealPlan as MealPlan] ?? "No Meal Plan";

// //   const handleRecharge = async () => {
// //     // Synchronous lock: blocks rapid double taps instantly
// //     if (payingRef.current) return;

// //     if (!bookingId) {
// //       Alert.alert("No Active Booking", "No active booking found.");
// //       return;
// //     }

// //     payingRef.current = true;
// //     setPaying(true);
// //     try {
// //       // create order
// //       const { data: order } = await axios.post(
// //         `${API_BASE_URL}/api/booking-payments/initiate-meal-recharge`,
// //         { bookingId, months, mealPlan: selectedPlan },
// //         { headers: authHeaders }
// //       );

// //       console.log("ORDER RESPONSE:", JSON.stringify(order, null, 2));

// //       if (!order?.success) {
// //         throw new Error(order?.message || "Could not start payment.");
// //       }

// //       // open Razorpay (amount is already in paise)
// //       await RazorpayCheckout.open({
// //         key: RAZORPAY_KEY_ID,
// //         order_id: order.razorpay.orderId,
// //         amount: order.razorpay.amount,
// //         currency: order.razorpay.currency,
// //         name: "Meal Subscription",
// //         description: `${PLAN_LABEL[selectedPlan]} • ${order.billingMonths
// //           .map(formatMonth)
// //           .join(", ")}`,
// //         prefill: {
// //           email: user?.email,
// //           contact: user?.phone,
// //         },
// //         theme: { color: colors.nOrange },
// //       });

// //       Alert.alert("Payment Successful", "Your meal plan has been updated.");
// //       setMonths(1);
// //       await fetchMealSubscription();
// //     } catch (error: any) {
// //       // Razorpay cancel = code 0
// //       if (error?.code === 0) return;

// //       console.log("RECHARGE ERROR:", error?.response?.data || error);
// //       const msg =
// //         error?.response?.data?.message ||
// //         error?.response?.data?.error ||
// //         error?.description ||
// //         error?.message ||
// //         "Something went wrong.";

// //       setTimeout(() => {
// //         Alert.alert("Payment Failed", String(msg));
// //       }, 100);
// //     } finally {
// //       payingRef.current = false; // release the lock
// //       setPaying(false);
// //     }
// //   };

// //   if (loadingBooking || loading) {
// //     return (
// //       <View style={styles.loader}>
// //         <ActivityIndicator size="large" color={colors.nOrange} />
// //         <Text style={styles.loadingText}>Loading meals...</Text>
// //       </View>
// //     );
// //   }

// //   if (!bookingId || !booking) {
// //     return (
// //       <View style={styles.noBookingContainer}>
// //         <Text style={styles.noBookingText}>No active booking found.</Text>
// //         <TouchableOpacity
// //           style={styles.backBtn}
// //           onPress={() => navigation.goBack()}
// //         >
// //           <Text style={styles.backBtnText}>Go Back</Text>
// //         </TouchableOpacity>
// //       </View>
// //     );
// //   }

// //   return (
// //     <View style={styles.container}>
// //       <HeaderGradient title="Meals" />

// //       <ScrollView
// //         showsVerticalScrollIndicator={false}
// //         contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
// //       >
// //         {/* Summary (ONLINE + OFFLINE) */}
// //         <View style={styles.card}>
// //           <InfoRow
// //             label="Booking Duration"
// //             value={`${booking.duration ?? 0} Month(s)`}
// //           />
// //           <InfoRow
// //             label="Check-in Date"
// //             value={formatDate(booking.checkInDate)}
// //           />
// //           <InfoRow
// //             label="Check-out Date"
// //             value={formatDate(booking.checkOutDate)}
// //           />
// //           <InfoRow
// //             label="Meal Plan"
// //             value={mealPlanLabel}
// //             last={!canRecharge}
// //           />

// //           {/* Extra rows only when recharge is possible */}
// //           {canRecharge && (
// //             <>
// //               <InfoRow
// //                 label="Months Paid"
// //                 value={`${paidMonths} of ${booking.duration ?? 0}`}
// //               />
// //               <InfoRow
// //                 label="Next Unpaid Month"
// //                 value={
// //                   meal?.nextUnpaidMonth
// //                     ? formatMonth(meal.nextUnpaidMonth)
// //                     : "—"
// //                 }
// //                 last
// //               />
// //             </>
// //           )}
// //         </View>

// //         {/* Recharge: OFFLINE && isRentIncludingMeals === false */}
// //         {canRecharge && remaining > 0 && (
// //           <View style={[styles.card, { marginTop: 16 }]}>
// //             <Text style={styles.sectionTitle}>Recharge Meals</Text>

// //             <View style={styles.planRow}>
// //               {(Object.keys(rates) as MealPlan[]).map((plan) => {
// //                 const active = plan === selectedPlan;
// //                 return (
// //                   <TouchableOpacity
// //                     key={plan}
// //                     style={[styles.planChip, active && styles.planChipActive]}
// //                     onPress={() => setSelectedPlan(plan)}
// //                     disabled={paying}
// //                   >
// //                     <Text
// //                       style={[styles.planText, active && styles.planTextActive]}
// //                     >
// //                       {PLAN_LABEL[plan]}
// //                     </Text>
// //                     <Text
// //                       style={[styles.planRate, active && styles.planTextActive]}
// //                     >
// //                       ₹{rates[plan]}/mo
// //                     </Text>
// //                   </TouchableOpacity>
// //                 );
// //               })}
// //             </View>

// //             <View style={styles.stepperRow}>
// //               <Text style={styles.label}>Months</Text>
// //               <View style={styles.stepper}>
// //                 <TouchableOpacity
// //                   style={styles.stepBtn}
// //                   disabled={months <= 1 || paying}
// //                   onPress={() => setMonths((m) => Math.max(1, m - 1))}
// //                 >
// //                   <Text
// //                     style={[styles.stepText, months <= 1 && { opacity: 0.3 }]}
// //                   >
// //                     −
// //                   </Text>
// //                 </TouchableOpacity>
// //                 <Text style={styles.stepValue}>{months}</Text>
// //                 <TouchableOpacity
// //                   style={styles.stepBtn}
// //                   disabled={months >= remaining || paying}
// //                   onPress={() => setMonths((m) => Math.min(remaining, m + 1))}
// //                 >
// //                   <Text
// //                     style={[
// //                       styles.stepText,
// //                       months >= remaining && { opacity: 0.3 },
// //                     ]}
// //                   >
// //                     +
// //                   </Text>
// //                 </TouchableOpacity>
// //               </View>
// //             </View>

// //             <TouchableOpacity
// //               style={[styles.payBtn, paying && { opacity: 0.6 }]}
// //               onPress={handleRecharge}
// //               disabled={paying}
// //               activeOpacity={0.8}
// //             >
// //               {paying ? (
// //                 <ActivityIndicator color="#FFF" />
// //               ) : (
// //                 <Text style={styles.payText}>Pay ₹{total}</Text>
// //               )}
// //             </TouchableOpacity>
// //           </View>
// //         )}

// //         {/* Timeline: only if recharge applies and API sent a timeline */}
// //         {canRecharge && meal?.timeline?.length > 0 && (
// //           <View style={[styles.card, { marginTop: 16 }]}>
// //             <Text style={styles.sectionTitle}>Billing Timeline</Text>
// //             {meal.timeline.map((t: any, i: number) => {
// //               const paid = t.status === "PAID";
// //               return (
// //                 <View
// //                   key={t.billingMonth}
// //                   style={[
// //                     styles.timelineRow,
// //                     i === meal.timeline.length - 1 && { borderBottomWidth: 0 },
// //                   ]}
// //                 >
// //                   <View>
// //                     <Text style={styles.value}>
// //                       {formatMonth(t.billingMonth)}
// //                     </Text>
// //                     {paid && (
// //                       <Text style={styles.subText}>
// //                         {PLAN_LABEL[t.mealPlan as MealPlan]} • ₹{t.monthlyRate}
// //                       </Text>
// //                     )}
// //                   </View>
// //                   <View
// //                     style={[
// //                       styles.badge,
// //                       paid ? styles.badgePaid : styles.badgeUnpaid,
// //                     ]}
// //                   >
// //                     <Text
// //                       style={[
// //                         styles.badgeText,
// //                         { color: paid ? "#1E7B3A" : "#B45309" },
// //                       ]}
// //                     >
// //                       {t.isWaived ? "WAIVED" : t.status}
// //                     </Text>
// //                   </View>
// //                 </View>
// //               );
// //             })}
// //           </View>
// //         )}
// //       </ScrollView>
// //     </View>
// //   );
// // };

// // const InfoRow = ({ label, value, last }: any) => (
// //   <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
// //     <Text style={styles.label}>{label}</Text>
// //     <Text style={styles.value}>{value}</Text>
// //   </View>
// // );

// // export default MealsScreen;

// // const styles = StyleSheet.create({
// //   container: { flex: 1, backgroundColor: "#F6F3EC" },
// //   loader: { flex: 1, justifyContent: "center", alignItems: "center" },
// //   loadingText: {
// //     marginTop: 16,
// //     fontSize: 16,
// //     color: colors.nOrange,
// //     fontFamily: "Quicksand-Medium",
// //   },
// //   noBookingContainer: {
// //     flex: 1,
// //     justifyContent: "center",
// //     alignItems: "center",
// //     padding: 20,
// //   },
// //   noBookingText: {
// //     fontSize: 16,
// //     textAlign: "center",
// //     color: "#444",
// //     marginBottom: 20,
// //     fontFamily: "Quicksand-Medium",
// //   },
// //   backBtn: {
// //     backgroundColor: colors.nOrange,
// //     paddingVertical: 14,
// //     paddingHorizontal: 30,
// //     borderRadius: 10,
// //   },
// //   backBtnText: { color: "#fff", fontSize: 16, fontFamily: "Quicksand-Bold" },

// //   card: {
// //     backgroundColor: "#FFF",
// //     borderRadius: 18,
// //     padding: 18,
// //     elevation: 2,
// //   },
// //   sectionTitle: {
// //     fontSize: 16,
// //     color: "#3C2A1E",
// //     fontFamily: "Quicksand-Bold",
// //     marginBottom: 12,
// //   },
// //   row: {
// //     paddingVertical: 16,
// //     borderBottomWidth: 1,
// //     borderBottomColor: "#EFEFEF",
// //   },
// //   label: {
// //     fontSize: 13,
// //     color: "#888",
// //     fontFamily: "Quicksand-Medium",
// //     marginBottom: 6,
// //   },
// //   value: { fontSize: 17, color: "#3C2A1E", fontFamily: "Quicksand-Bold" },
// //   subText: {
// //     fontSize: 12,
// //     color: "#888",
// //     fontFamily: "Quicksand-Medium",
// //     marginTop: 2,
// //   },

// //   planRow: { flexDirection: "row", gap: 10 },
// //   planChip: {
// //     flex: 1,
// //     borderWidth: 1.5,
// //     borderColor: "#EFEFEF",
// //     borderRadius: 14,
// //     padding: 12,
// //     alignItems: "center",
// //   },
// //   planChipActive: { borderColor: colors.nOrange, backgroundColor: "#FFF4E8" },
// //   planText: { fontSize: 14, color: "#3C2A1E", fontFamily: "Quicksand-Bold" },
// //   planRate: {
// //     fontSize: 12,
// //     color: "#888",
// //     fontFamily: "Quicksand-Medium",
// //     marginTop: 4,
// //   },
// //   planTextActive: { color: "#C97A1E" },

// //   stepperRow: {
// //     flexDirection: "row",
// //     justifyContent: "space-between",
// //     alignItems: "center",
// //     marginTop: 18,
// //   },
// //   stepper: { flexDirection: "row", alignItems: "center" },
// //   stepBtn: {
// //     width: 36,
// //     height: 36,
// //     borderRadius: 18,
// //     backgroundColor: "#F6F3EC",
// //     alignItems: "center",
// //     justifyContent: "center",
// //   },
// //   stepText: { fontSize: 20, color: "#3C2A1E", fontFamily: "Quicksand-Bold" },
// //   stepValue: {
// //     minWidth: 40,
// //     textAlign: "center",
// //     fontSize: 17,
// //     color: "#3C2A1E",
// //     fontFamily: "Quicksand-Bold",
// //   },

// //   payBtn: {
// //     marginTop: 20,
// //     backgroundColor: colors.nOrange,
// //     borderRadius: 14,
// //     paddingVertical: 14,
// //     alignItems: "center",
// //   },
// //   payText: { color: "#FFF", fontSize: 16, fontFamily: "Quicksand-Bold" },

// //   timelineRow: {
// //     flexDirection: "row",
// //     justifyContent: "space-between",
// //     alignItems: "center",
// //     paddingVertical: 12,
// //     borderBottomWidth: 1,
// //     borderBottomColor: "#EFEFEF",
// //   },
// //   badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
// //   badgePaid: { backgroundColor: "#E6F6EC" },
// //   badgeUnpaid: { backgroundColor: "#FEF3E2" },
// //   badgeText: { fontSize: 11, fontFamily: "Quicksand-Bold" },
// // });
