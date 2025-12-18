import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import HeaderGradient from "../components/HeaderGradient";

const BASE_URL = "https://staging.cocoliving.in";

const days = [
  { id: "01", short: "Mon", full: "Monday" },
  { id: "02", short: "Tue", full: "Tuesday" },
  { id: "03", short: "Wed", full: "Wednesday" },
  { id: "04", short: "Thu", full: "Thursday" },
  { id: "05", short: "Fri", full: "Friday" },
  { id: "06", short: "Sat", full: "Saturday" },
  { id: "07", short: "Sun", full: "Sunday" },
];

export default function FoodMenuScreen() {
  const { user } = useAuth();
  const token = user?.token;

  const [menus, setMenus] = useState([]);
  const [activeDay, setActiveDay] = useState(
    days[new Date().getDay()]?.full || "Monday"
  );

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/food-menu/user-menus`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMenus(res.data.menus || []);

    } catch (e) {
      console.log("Food Menu Error: ", e?.response?.data || e);
    }
  };

  const getMenus = () => {
    return menus
      .map((menuObj) => {
        const dayData = menuObj?.weekMenu?.[activeDay];
        if (!dayData) return null;

        return {
          breakfast: dayData.breakfast || [],
          lunch: dayData.lunch || [],
          dinner: dayData.dinner || [],
        };
      })
      .filter(Boolean)[0];
  };

  const todayMenu = getMenus();

  const join = (arr) => (arr?.length ? arr.join(", ") : "Not Available");

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER IMAGE */}
      <HeaderGradient
        image={require("../../assets/images/breakfast.jpg")}
        title="Food Menu"
      />
{/* 
      <Text style={styles.title}>Food Menu</Text> */}

      {/* DAY SCROLL */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
        {days.map((d) => (
          <TouchableOpacity
            key={d.id}
            style={[
              styles.dayBox,
              activeDay === d.full && styles.dayBoxActive,
            ]}
            onPress={() => setActiveDay(d.full)}
          >
            <Text style={[styles.dayId, activeDay === d.full && styles.white]}>
              {d.id}
            </Text>
            <Text
              style={[styles.dayName, activeDay === d.full && styles.white]}
            >
              {d.short}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {todayMenu ? (
        <>
          {/* BREAKFAST */}
          <View style={[styles.card, styles.card1]}>
            <View style={styles.cardTop}>
              <Ionicons name="sunny-outline" size={26} color="#3C2A1E" />
              <Text style={styles.cardTitle}>Breakfast</Text>
            </View>

            <Text style={styles.time}>08:00 - 10:00</Text>

            <View style={styles.line} />

            <View style={styles.foodContainer}>
              <Text style={styles.foodText}>{join(todayMenu.breakfast)}</Text>
            </View>
          </View>

          {/* LUNCH */}
          <View style={[styles.card, styles.card2]}>
            <View style={styles.cardTop}>
              <Ionicons name="sunny" size={26} color="#3C2A1E" />
              <Text style={styles.cardTitle}>Lunch</Text>
            </View>

            <Text style={styles.time}>12:00 - 14:00</Text>

            <View style={styles.line} />

            <View style={styles.foodContainer}>
              <Text style={styles.foodText}>{join(todayMenu.lunch)}</Text>
            </View>
          </View>

          {/* DINNER */}
          <View style={[styles.card, styles.card1]}>
            <View style={styles.cardTop}>
              <Ionicons name="moon" size={26} color="#3C2A1E" />
              <Text style={styles.cardTitle}>Dinner</Text>
            </View>

            <Text style={styles.time}>20:00 - 23:00</Text>

            <View style={styles.line} />

            <View style={styles.foodContainer}>
              <Text style={styles.foodText}>{join(todayMenu.dinner)}</Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.noData}>No Menu Available</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F8F3EB" },

  headerImg: {
    width: "100%",
    height: 150,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },

  title: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "700",
    color: "#3C2A1E",
    marginVertical: 10,
  },

  dayScroll: {
    marginTop:20,
    flexDirection: "row",
    paddingHorizontal: 10,
    marginBottom: 20,
    
  },

  dayBox: {
    width: 45,
    height: 54,
    borderWidth: 1,
    borderColor: "#CBBBA2",
    borderRadius: 10,
    marginRight: 10,
    backgroundColor:'#AC9478',
    alignItems: "center",
    justifyContent: "center",
    
  },

  dayBoxActive: {
    backgroundColor: "#3C2A1E",
    borderColor: "#3C2A1E",
  },

  dayId: { fontSize: 16, fontWeight: "800", color: "#F7F7F7" },
  dayName: { fontSize: 13, color: "#F7F7F7" },
  white: { color: "#FFF" },

  card: {
    padding: 16,
    borderRadius: 14,
    marginHorizontal: 15,
    marginBottom: 18,
  },

  card1: {
    backgroundColor: "#AC9478",
  },

  card2: {
    backgroundColor: "#D1C1AA",
  },

  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 6 },

  cardTitle: { marginLeft: 10, fontSize: 15, fontWeight: "700", color: "#3C2A1E" },

  time: { color: "#3C2A1E", marginBottom: 10 ,fontSize:12, textAlign: 'center'},

  line: {
    borderBottomWidth: 1,
    borderColor: "#8B7355",
    marginVertical: 10,
  },

  foodContainer: { 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },

  foodText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 18,
  },

  noData: {
    textAlign: "center",
    color: "#3C2A1E",
    marginTop: 20,
    fontSize: 16,
  },
});