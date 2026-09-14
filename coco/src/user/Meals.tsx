import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import axios from "axios";
import Config from "react-native-config";
import HeaderGradient from "../components/HeaderGradient";
import { useAuth } from "../context/AuthContext";

export const API_BASE_URL = Config.API_BASE_URL;

const MealsScreen = ({ route }: any) => {
  const { bookingId } = route.params;
  const { user } = useAuth();

  const token = user?.token;

  const [loading, setLoading] = useState(true);
  const [mealData, setMealData] = useState<any>(null);

  useEffect(() => {
    fetchMealSubscription();
  }, []);

  const fetchMealSubscription = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/bookings/${bookingId}/meal-subscription`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Meal Subscription:", res.data);
      setMealData(res.data);
    } catch (error: any) {
      console.log(
        "Meal Subscription Error:",
        error?.response?.data || error.message
      );

      Alert.alert(
        "",
        error?.response?.data?.message ||
          "Unable to fetch meal subscription details."
      );
    } finally {
      setLoading(false);
    }
  };

  const getMealPlan = (plan: string) => {
    switch (plan) {
      case "two_times":
        return "2 Meals / Day";
      case "four_times":
        return "4 Meals / Day";
      default:
        return "No Meal Plan";
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#F6A452" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderGradient title="Meals" />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.card}>
          <InfoRow
            label="Meal Included"
            value={mealData?.mealIncluded ? "Yes" : "No"}
          />

          <InfoRow
            label="Meal Plan"
            value={getMealPlan(mealData?.mealPlan)}
          />

          <InfoRow
            label="Subscription Duration"
            value={`${mealData?.mealSubscriptionPaidDuration ?? 0} Month(s)`}
          />

          <InfoRow
            label="Amount Paid"
            value={`₹${mealData?.mealSubscriptionPaidAmount ?? 0}`}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ label, value }: any) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export default MealsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F3EC",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    elevation: 2,
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

  value: {
    fontSize: 17,
    color: "#3C2A1E",
    fontFamily: "Quicksand-Bold",
  },
});