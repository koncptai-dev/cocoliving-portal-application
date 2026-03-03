import React, { useState,useEffect } from "react";
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
import axios from "axios";

const SelectYourBedScreen = ({ route, navigation }) => {
  const baseURL = "https://staging.cocoliving.in";

  const roomImages = {
  "Single Sharing": require("../../assets/images/one.jpg.jpeg"),
  "Double Sharing": require("../../assets/images/two.jpg.jpeg"),
  "Triple Sharing": require("../../assets/images/three.jpg.jpeg"),
  "Four Sharing": require("../../assets/images/four.jpeg"),
};

  const { user } = useAuth();

  const { room, property, rent, actionType } = route.params;

  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isoDate, setIsoDate] = useState("");
  const [showDuration, setShowDuration] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [durationSelected, setDurationSelected] = useState(false);
  const [dateSelected, setDateSelected] = useState(false);

const [availableRooms, setAvailableRooms] = useState([]);
const [availableFloors, setAvailableFloors] = useState([]);

const [preferredFloor, setPreferredFloor] = useState(null);
const [roomsOnFloor, setRoomsOnFloor] = useState([]);

const [preferredRoomId, setPreferredRoomId] = useState(null);
const [bedsInRoom, setBedsInRoom] = useState([]);

const [showFloorDD, setShowFloorDD] = useState(false);
const [showRoomDD, setShowRoomDD] = useState(false);
const [showBedDD, setShowBedDD] = useState(false);
const [selectedRoom, setSelectedRoom] = useState("");

const [preferredBedInventoryId, setPreferredBedInventoryId] = useState(null);

//getting floor from backend
useEffect(() => {
  if (!room?.roomType || !property?.id) return;

  axios
    .get(
      `${baseURL}/api/rooms/available/${property.id}/${room.roomType}`,
      { headers: { Authorization: `Bearer ${user?.token}` } }
    )
    .then(res => {
      const rooms = res.data.rooms || [];
      setAvailableRooms(rooms);

      const floors = [...new Set(
        rooms.map(r => r.floorNumber).filter(Boolean)
      )];
      setAvailableFloors(floors);
    });
}, []);

useEffect(() => {
  if (!preferredFloor) return;

  const filtered = availableRooms.filter(
    r => r.floorNumber === preferredFloor
  );

  setRoomsOnFloor(filtered);
  setPreferredRoomId(null);
  setBedsInRoom([]);
}, [preferredFloor]);

useEffect(() => {
  if (!preferredRoomId) return;

  axios
    .get(
      `${baseURL}/api/inventory/available/${preferredRoomId}`,
      { headers: { Authorization: `Bearer ${user?.token}` } }
    )
    .then(res => {
      const beds = (res.data.items || []).filter(i =>
        i.itemName?.toLowerCase().includes("bed")
      );
      setBedsInRoom(beds);
    });
}, [preferredRoomId]);


 return (
  <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>

    {/* 🔒 FIXED HEADER */}
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={26} color="#3C2A1E" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>
        {actionType === "PreBook" ? "Pre-book" : "Select your stay time"}
      </Text>
    </View>

    {/* SCROLLABLE CONTENT */}
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: 140,   // 👈 IMPORTANT for bottom button
      }}
    >

      {/* ================= PREBOOK DESCRIPTION ================= */}
      {actionType === "PreBook" && (
        <Text style={styles.prebookDesc}>
          Lock in your preferred room with a small deposit.{"\n"}
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

  <View style={styles.fieldWrapper}>
  <Text style={styles.floatingLabel}>
    Preferred Floor (Optional)
  </Text>

  <TouchableOpacity
    style={styles.fieldInput}
    onPress={() => setShowFloorDD(!showFloorDD)}
  >
    <Text style={[styles.fieldText, !preferredFloor && styles.placeholderText]}>
      {preferredFloor ? `Floor ${preferredFloor}` : "Select Floor"}
    </Text>
    <Ionicons name="chevron-down" size={20} color="#6C5840" />
  </TouchableOpacity>
</View>

{showFloorDD && (
  <View style={styles.dropdownList}>
    {availableFloors.map(f => (
      <TouchableOpacity
        key={f}
        style={styles.selectItem}
        onPress={() => {
          setPreferredFloor(f);
          setShowFloorDD(false);
        }}
      >
        <Text style={styles.selectText}>Floor {f}</Text>
      </TouchableOpacity>
    ))}
  </View>
)}


<View style={styles.fieldWrapper}>
  <Text style={styles.floatingLabel}>
    Preferred Room (Optional)
  </Text>

  <TouchableOpacity
    style={[
      styles.fieldInput,
      !preferredFloor && { opacity: 0.5 },
    ]}
    disabled={!preferredFloor}
    onPress={() => setShowRoomDD(!showRoomDD)}
  >
    <Text style={[styles.fieldText, !preferredRoomId && styles.placeholderText]}>
      {preferredRoomId
        ? `Room ${roomsOnFloor.find(r => r.id === preferredRoomId)?.roomNumber}`
        : "Select Room"}
    </Text>
    <Ionicons name="chevron-down" size={20} color="#6C5840" />
  </TouchableOpacity>
</View>

{showRoomDD && preferredFloor && (
  <View style={styles.dropdownList}>
    {roomsOnFloor.map(r => (
      <TouchableOpacity
        key={r.id}
        style={styles.selectItem}
        onPress={() => {
          setPreferredRoomId(r.id);
          setShowRoomDD(false);
        }}
      >
        <Text style={styles.selectText}>Room {r.roomNumber}</Text>
      </TouchableOpacity>
    ))}
  </View>
)}


<View style={styles.fieldWrapper}>
  <Text style={styles.floatingLabel}>
    Preferred Bed (Optional)
  </Text>

  <TouchableOpacity
    style={[
      styles.fieldInput,
      !preferredRoomId && { opacity: 0.5 },
    ]}
    disabled={!preferredRoomId}
    onPress={() => setShowBedDD(!showBedDD)}
  >
    <Text style={[styles.fieldText, !preferredBedInventoryId && styles.placeholderText]}>
      {preferredBedInventoryId
        ? bedsInRoom.find(b => b.id === preferredBedInventoryId)?.inventoryCode
        : "Select Bed"}
    </Text>
    <Ionicons name="chevron-down" size={20} color="#6C5840" />
  </TouchableOpacity>
  <Text style={{ fontSize: 11, color: "#777", marginTop: 6 }}>
  Preferences are not guaranteed. Final allocation is done by admin.
</Text>
</View>

{showBedDD && preferredRoomId && (
  <View style={styles.dropdownList}>
    {bedsInRoom.map(b => (
      <TouchableOpacity
        key={b.id}
        style={styles.selectItem}
        onPress={() => {
          setPreferredBedInventoryId(b.id);
          setShowBedDD(false);
        }}
      >
        <Text style={styles.selectText}>
          {b.inventoryCode ?? `Bed ${b.id}`}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
)}


{/* ================= ROOM TYPE IMAGE ================= */}
{room?.roomType && roomImages[room.roomType] && (
  <Image
    source={roomImages[room.roomType]}
    style={styles.roomTypeImage}
    resizeMode="cover"
  />
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
          {[ "6 Months", "12 Months"].map((item) => (
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
          const preBookAmount = 5000;

          navigation.navigate("PayableAmountScreen", {
  room,
  property,
  rent,
  monthsNumber,
  isoDate,
  netPayable,
  preBookAmount,
  actionType,

  // ✅ PREFERENCES (NEW)
  preferredFloor,

  preferredRoomNumber:
    roomsOnFloor.find(r => r.id === preferredRoomId)?.roomNumber ?? null,

  preferredBed:
    bedsInRoom.find(b => b.id === preferredBedInventoryId)?.inventoryCode ?? null,
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
    maximumDate={
      new Date(
        new Date().setMonth(new Date().getMonth() + 1)
      )
    }
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
    </View>
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
  header: {
  flexDirection: "row",
  alignItems: "center",
  gap: 20,
  paddingHorizontal: 20,
  marginTop: 30,
  marginBottom: 10,
},

headerTitle: {
  fontSize: 22,
  fontFamily: "Quicksand-Bold",
  color: "#4F3421",
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
    color: "#000000",
    backgroundColor: "#F5F5F5",
    // paddingHorizontal: 10,
    zIndex: 1,
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
  marginTop: 40,
  marginBottom: 20,   // 👈 add this
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
  roomTypeImage: {
  width: "100%",
  height: 200,
  borderRadius: 14,
  marginTop: 15,
  marginBottom: 10,
},
});