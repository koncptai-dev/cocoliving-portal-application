import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import colors from "../constants/color";

const SelectYourBedScreen = ({ route, navigation }) => {
  const baseURL = "https://staging.cocoliving.in";

  const { user } = useAuth();

  const { room, property, rent, actionType } = route.params;

  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isoDate, setIsoDate] = useState("");
  const [showDuration, setShowDuration] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [durationSelected, setDurationSelected] = useState(false);
  const [dateSelected, setDateSelected] = useState(false);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ================= HEADER ================= */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#3C2A1E" />
        </TouchableOpacity>

        <Text style={styles.heading}>
          {actionType === "PreBook" ? "Pre-book" : "Select your stay time"}
        </Text>

        <View style={styles.rightSpacer} />
      </View>

      {/* ================= PREBOOK DESCRIPTION ================= */}
      {actionType === "PreBook" && (
        <Text style={styles.prebookDesc}>
          Lock in your preferred room with a small 10% deposit.{"\n"}
          Complete your booking and final payment when{"\n"}
          you're ready to move in.{"\n"}
          Easy and flexible!
        </Text>
      )}

      {/* ================= ROOM CARD (PreBook only) ================= */}
      {actionType === "PreBook" && (
        <View style={styles.roomCard}>
          <Image
            source={{
              uri:
                room.roomImages?.length > 0
                  ? `${baseURL}${room.roomImages[0]}`
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
      )}

      {/* ================= BOOKING DURATION ================= */}
      <View style={styles.fieldWrapper}>
        <Text
          style={[
            styles.floatingLabel,
            durationSelected && styles.floatingLabelActive,
          ]}
        >
          Booking Duration
        </Text>

        <TouchableOpacity
          style={[
            styles.fieldInput,
            durationSelected && styles.fieldInputActive,
          ]}
          onPress={() => setShowDuration(!showDuration)}
        >
          <Text
            style={[
              styles.fieldText,
              !duration && styles.placeholderText,
            ]}
          >
            {duration || "Select duration"}
          </Text>
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
                setDurationSelected(true);
                setShowDuration(false);
              }}
            >
              <Text style={styles.selectText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ================= START DATE ================= */}
      <View style={styles.fieldWrapper}>
        <Text
          style={[
            styles.floatingLabel,
            dateSelected && styles.floatingLabelActive,
          ]}
        >
          Starting Month / Date
        </Text>

        <TouchableOpacity
          style={[
            styles.fieldInput,
            dateSelected && styles.fieldInputActive,
          ]}
          onPress={() => setShowCalendar(true)}
        >
          <Text
            style={[
              styles.fieldText,
              !startDate && styles.placeholderText,
            ]}
          >
            {startDate || "Select starting date"}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#6C5840" />
        </TouchableOpacity>
      </View>

      {/* ================= CONTINUE ================= */}
      <TouchableOpacity
        style={styles.continueBtn}
        onPress={() => {
          if (!isoDate || !duration) {
            return Toast.show({
              type: "error",
              text1: "Missing Information",
              text2: "Please select both duration and date.",
            });
          }

          const monthsNumber = duration.includes("3")
            ? 3
            : duration.includes("6")
            ? 6
            : 12;

          const securityDeposit = rent * 2;
          const netPayable = rent * monthsNumber + securityDeposit;
          const preBookAmount = Math.round(netPayable * 0.1);

          navigation.navigate("PayableAmountScreen", {
            room,
            property,
            rent,
            monthsNumber,
            isoDate,
            netPayable,
            preBookAmount,
            actionType,
          });
        }}
      >
        <Text style={styles.continueText}>
          {actionType === "PreBook"
            ? "Proceed to Pre-book"
            : "Proceed to Payment"}
        </Text>
      </TouchableOpacity>

      {/* ================= CALENDAR ================= */}
      {showCalendar && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowCalendar(false);
            if (date) {
              const formattedUI = date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              setStartDate(formattedUI);
              setIsoDate(date.toISOString().split("T")[0]);
              setDateSelected(true);
            }
          }}
        />
      )}
    </ScrollView>
  );
};

export default SelectYourBedScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20,
  },

  backBtn: { width: 34 },
  rightSpacer: { width: 34 },

  heading: {
    fontSize: 24,
    fontFamily: "Quicksand-Bold",
    color: "#4F3421",
  },

  prebookDesc: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Quicksand-Regular",
    marginBottom: 20,
    color: "#000",
  },

  roomCard: {
    flexDirection: "row",
    backgroundColor: "#EDE7DF",
    // padding: 10,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "center",
  },

  thumb: {
    width: 120,
    height: 120,
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

  fieldWrapper: {
    position: "relative",
    marginTop: 30,
  },

  floatingLabel: {
    position: "absolute",
    left: 20,
    top: -10,
    fontSize: 13,
    fontFamily: "Quicksand-Medium",
    color: "#888888",
    backgroundColor: "#FFF",
    paddingHorizontal: 10,
    zIndex: 2,
  },
  

  floatingLabelActive: {
    color: "#3C2A1E",
    fontWeight: "700",
  },

  fieldInput: {
    height: 52,
    backgroundColor: "#FFF",
    borderWidth: 1.4,
    borderColor: "#616161",
    borderRadius: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  fieldInputActive: {
    borderColor: "#3C2A1E",
    borderWidth: 2,
  },

  fieldText: {
    fontSize: 15,
    color: "#3C2A1E",
  },

  placeholderText: {
    color: "#9E9E9E",
  },

  continueBtn: {
    backgroundColor: colors.nOrange,
    borderRadius: 10,
    marginTop: 60,
    paddingVertical: 16,
  },

  continueText: {
    color: "#FFF",
    fontSize: 17,
    textAlign: "center",
    fontFamily: "Quicksand-Bold",
  },

  dropdownList: {
    backgroundColor: "#FFF",
    borderWidth: 1.4,
    borderColor: "#BAA789",
    borderRadius: 12,
    marginTop: 6,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  selectItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },

  selectText: {
    fontSize: 15,
    color: "#3C2A1E",
    fontFamily: "Quicksand-SemiBold",
  },
});