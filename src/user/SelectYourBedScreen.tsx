import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";

import colors from "../constants/color";

const SelectYourBedScreen = ({ route, navigation }) => {

    const baseURL = __DEV__ ? 'https://staging.cocoliving.in' : 'https://your-production-api.com';

    const { user } = useAuth();
const token = user?.token;
const [loading, setLoading] = useState(false);
  const { room, property, rent,actionType } = route.params;

  const [duration, setDuration] = useState("1 Year");
  const [startDate, setStartDate] = useState("1st December");
  const [showDuration, setShowDuration] = useState(false);
  const [showMonth, setShowMonth] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
const [selectedDate, setSelectedDate] = useState(startDate);
const [isoDate, setIsoDate] = useState("");

const submitBooking = async () => {
  if (!isoDate || !duration) {
    Toast.show({
      type: "error",
      text1: "Missing Information",
      text2: "Please select both duration and date.",
    });
    return;
  }

  setLoading(true);

  try {
    const monthsNumber = duration.includes("3") ? 3 : duration.includes("6") ? 6 : 12;

    const payload = {
      userId: Number(user.id),
      rateCardId: room.rateCardId,
      propertyId: room.propertyId,
      checkInDate: isoDate,   // <-- FIXED
      monthlyRent: rent,
      duration: monthsNumber,
      status: "pending",
      roomType: room.roomType,
    };

    console.log("Payload while submitting: ", payload);

    const result = await axios.post(`${baseURL}/api/book-room/add`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Data received after Booking submit: ", result);

    Toast.show({
      type: "success",
      text1: "Booking Submitted",
      text2: "Your booking request has been submitted.",
    });

    navigation.goBack();
  } catch (err) {
    Toast.show({
      type: "error",
      text1: "Booking Failed",
      text2: err?.response?.data?.message || "Something went wrong.",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={26} color="#3C2A1E" />
      </TouchableOpacity>

      <Text style={styles.heading}>Select your bed</Text>

      {/* Card */}
      <View style={styles.roomCard}>
        <Image
          source={{
            uri:
              room.roomImages?.length > 0
                ? `https://staging.cocoliving.in${room.roomImages[0]}`
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

      {/* Duration */}
      <View style={styles.inputBlock}>
  <Text style={styles.label}>BOOKING DURATION</Text>

  <TouchableOpacity
    style={styles.dropdown}
    onPress={() => setShowDuration(!showDuration)}
  >
    <Text style={styles.dropdownText}>{duration}</Text>
    <Ionicons name="chevron-down" size={20} color="#6C5840" />
  </TouchableOpacity>
</View>

     {showDuration && (
  <View style={styles.dropdownList}>
    {["3 Months", "6 Months", "12 Months"].map((item) => (
      <TouchableOpacity
        key={item}
        style={styles.selectItem}
        onPress={() => {
          setDuration(item);
          setShowDuration(false);
        }}
      >
        <Text style={styles.selectText}>{item}</Text>
      </TouchableOpacity>
    ))}
  </View>
)}

      {/* Months */}
      <View style={[styles.inputBlock, { marginTop: 18 }]}>
        <Text style={styles.label}>STARTING MONTH/DATE</Text>

      <TouchableOpacity
  style={styles.dropdown}
  onPress={() => setShowCalendar(true)}
>
  <Text style={styles.dropdownText}>{startDate}</Text>
  <Ionicons name="calendar-outline" size={20} color="#6C5840" />
</TouchableOpacity>
      </View>

      {/* Continue */}
      <TouchableOpacity
        style={styles.continueBtn}
      onPress={() => {
  if (!isoDate || !duration) {
    return Toast.show({
      type: "error",
      text1: "Missing Information",
      text2: "Please select both duration and date."
    });
  }

  const monthsNumber = duration.includes("3") ? 3 : duration.includes("6") ? 6 : 12;
  const securityDeposit = rent * 2;         // 2 months rent
  const netPayable = rent * monthsNumber + securityDeposit;
  const preBookAmount = Math.round(netPayable * 0.10); // 10%

  navigation.navigate("PayableAmountScreen", {
    room,
    property,
    rent,
    monthsNumber,
    isoDate,
    netPayable,
    preBookAmount,
    actionType: actionType,
  });
}}
      >
       <Text style={styles.continueText}>
  {loading ? "Submitting..." : "Continue"}
</Text>
      </TouchableOpacity>
      {showCalendar && (
  <DateTimePicker
    value={new Date()}
    mode="date"
    display="spinner"
    minimumDate={new Date()}
    onChange={(event, date) => {
      setShowCalendar(false);
      if (date) {
        // UI display format -> example: 1 January 2026
        const formattedUI = date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        setStartDate(formattedUI);

        // backend required format -> example: 2026-01-01
        const iso = date.toISOString().split("T")[0];
        setIsoDate(iso);
      }
    }}
  />
)}

    </ScrollView>
  );
};

export default SelectYourBedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6EFE7",
    padding: 20,
  },
  backBtn: {
    marginBottom: 10,
    marginTop: 10,
    width: 34,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#3C2A1E",
    textAlign: "center",
    marginBottom: 20,
  },
  roomCard: {
    flexDirection: "row",
    backgroundColor: "#EDE1CF",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  roomType: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3C2A1E",
  },
  propertyName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3C2A1E",
    marginTop: 2,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  addressText: {
    fontSize: 13,
    color: "#7D6C54",
    marginLeft: 4,
  },
  inputBlock: {
    marginTop: 30,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6C5840",
    marginBottom: 6,
  },
  dropdown: {
    borderWidth: 1.4,
    borderColor: "#BAA789",
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 15,
    color: "#3C2A1E",
  },
  continueBtn: {
    backgroundColor: "#3C2A1E",
    borderRadius: 50,
    marginTop: 90,
    paddingVertical: 14,
  },
  continueText: {
    color: "#fff",
    fontSize: 17,
    textAlign: "center",
    fontWeight: "700",
  },
  dropdownList: {
  backgroundColor: "#FFF",
  borderWidth: 1.4,
  borderColor: "#BAA789",
  borderRadius: 12,
  marginTop: 6,
  overflow: "hidden",
},
selectItem: {
  paddingVertical: 12,
  paddingHorizontal: 18,
},
selectText: {
  fontSize: 15,
  color: "#3C2A1E",
  fontWeight: "600",
},
});
