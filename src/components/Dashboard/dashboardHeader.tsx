// components/DashboardHeader.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Animated from "react-native-reanimated";

const HEADER_HEIGHT = 280;

const DashboardHeader = ({ username, firstLetter, headerAnim, quoteAnim, navigation }) => {
  return (
    <Animated.View style={[styles.header, headerAnim]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.hello}>Hey {username.split(" ")[0]}!</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#fff" />
            <Text style={styles.location}>Navrangpura</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileCircle}
          onPress={() => navigation.navigate("ProfileScreen")}
          activeOpacity={0.8}
        >
          <Text style={styles.profileLetter}>{firstLetter}</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.quoteBlock, quoteAnim]}>
        <Text style={styles.quote1}>“ Unwind, recharge, repeat.”</Text>
        <Text style={styles.quote2}>That's the Coco Living way.</Text>
      </Animated.View>
    </Animated.View>
  );
};

export default DashboardHeader;

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: "#4b3426",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 55,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hello: { fontSize: 26, fontWeight: "700", color: "#fff" },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  location: { fontSize: 13, color: "#fff", marginLeft: 3 },
  profileCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  profileLetter: { fontSize: 24, fontWeight: "700", color: "#4b3426" },
  quoteBlock: {
    position: "absolute",
    bottom: 75,
    alignSelf: "center",
    alignItems: "center",
  },
  quote1: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  quote2: {
    fontSize: 17,
    marginTop: 3,
    color: "#E8A371",
    fontStyle: "italic",
  },
});
