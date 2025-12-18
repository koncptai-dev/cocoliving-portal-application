import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import HeaderGradient from "../components/HeaderGradient";
import DateTimePicker from "@react-native-community/datetimepicker";

const BASE_URL = "https://staging.cocoliving.in";

export default function EventsScreen() {
  const { user } = useAuth();
  const token = user?.token;
  const navigation = useNavigation();

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [showLocationList, setShowLocationList] = useState(false);

  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/events/allevents?page=1&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setEvents(res.data.events || []);
      setFilteredEvents(res.data.events || []);

      const locs = [
        ...new Set(res.data.events.map((e) => e.location || "Unknown")),
      ];
      setLocations(locs);
    } catch (e) {
      console.log("Events Error:", e);
      Alert.alert("Error", "Failed to fetch events");
    }
  };

  //handle Details
  const handleDetails = (event) => {
  navigation.navigate("EventDetails", { event });
};

  const handleJoin = async (eventId) => {
    try {
      await axios.post(
        `${BASE_URL}/api/events/${eventId}/join`,
        { userId: user?.id, status: "attending" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "You have marked as attending!");
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to join");
    }
  };

  const formatDate = (d) => {
    if (!d) return "TBD";
    return new Date(d).toDateString();
  };

  const formatTime = (t) => {
    if (!t || t === "00:00") return "TBD";
    return t;
  };

  // ⭐ FILTER LOGIC
  const handleFind = () => {
    // If no filters, show all
    if (!selectedDate && !selectedTime && !locationFilter) {
      setFilteredEvents(events);
      return;
    }

    let filtered = [...events];

    // DATE FILTER
    if (selectedDate) {
      filtered = filtered.filter((event) => {
        if (!event.eventDate) return false;
        const eventDate = new Date(event.eventDate).toDateString();
        return eventDate === selectedDate;
      });
    }

    // TIME SLOT FILTER
    if (selectedTime) {
      filtered = filtered.filter((event) => {
        if (!event.eventTime) return false;

        const [start, end] = selectedTime.split(" - ");
        return event.eventTime.includes(start) || event.eventTime.includes(end);
      });
    }

    // LOCATION FILTER
    if (locationFilter) {
      filtered = filtered.filter(
        (event) =>
          (event.location || "").toLowerCase() ===
          locationFilter.toLowerCase()
      );
    }

    setFilteredEvents(filtered);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <HeaderGradient
        image={require("../../assets/images/events.jpg")}
        title="Community Events"
      />

      {/* FILTERS */}
      <View style={styles.filterContainer}>

        {/* ROW 1 — DATE + TIME */}
        <View style={styles.filterRow}>

          {/* DATE */}
          <TouchableOpacity
            style={styles.filterInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.filterText}>
              {selectedDate || "Date"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#3C2A1E" />
          </TouchableOpacity>

          {/* TIME */}
          <TouchableOpacity
            style={styles.filterInput}
            onPress={() => setShowTimeSlots(!showTimeSlots)}
          >
            <Text style={styles.filterText}>
              {selectedTime || "Time"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#3C2A1E" />
          </TouchableOpacity>

        </View>

        {/* DATE PICKER */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="calendar"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date.toDateString());
            }}
          />
        )}

        {/* TIME SLOTS */}
        {showTimeSlots && (
          <View style={styles.slotContainer}>
            {["9 AM - 12 PM", "12 PM - 3 PM", "3 PM - 6 PM", "6 PM - 9 PM"].map(
              (slot) => (
                <TouchableOpacity
                  key={slot}
                  style={styles.slotButton}
                  onPress={() => {
                    setSelectedTime(slot);
                    setShowTimeSlots(false);
                  }}
                >
                  <Text style={styles.slotText}>{slot}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}

        {/* LOCATION — FULL WIDTH */}
        <TouchableOpacity
          style={styles.locationInput}
          onPress={() => setShowLocationList(!showLocationList)}
        >
          <Ionicons name="location-outline" size={18} color="#3C2A1E" />
          <Text style={[styles.filterText, { flex: 1, marginLeft: 10 }]}>
            {locationFilter || "Commerce Cross Road"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#3C2A1E" />
        </TouchableOpacity>

        {/* LOCATION LIST */}
        {showLocationList && (
          <View style={styles.listContainer}>
            {locations.map((loc, i) => (
              <TouchableOpacity
                key={i}
                style={styles.listItem}
                onPress={() => {
                  setLocationFilter(loc);
                  setShowLocationList(false);
                }}
              >
                <Text style={styles.listText}>{loc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* FIND BUTTON */}
        <TouchableOpacity style={styles.findButtonFull} onPress={handleFind}>
          <Text style={styles.findText}>Find</Text>
        </TouchableOpacity>
      </View>

      {/* EVENTS LIST */}
      {filteredEvents.length > 0 ? (
        filteredEvents.map((event) => (
          <View key={event.id} style={styles.card}>
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: `https://picsum.photos/300/150?random=${event.id}`,
                }}
                style={styles.eventImage}
              />
              <TouchableOpacity
                style={styles.detailsOverlay}
                onPress={() => handleDetails(event)}
              >
                <Text style={styles.detailsText}>Details ></Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{event.title}</Text>

              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={16} color="#3C2A1E" />
                <Text style={styles.detailText}>
                  {formatDate(event.eventDate)}
                </Text>
              </View>

              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={16} color="#3C2A1E" />
                <Text style={styles.detailText}>
                  {formatTime(event.eventTime)}
                </Text>
              </View>

              <View style={styles.bottomRow}>
                <View style={styles.participants}>
                  <Ionicons name="people-outline" size={16} color="#3C2A1E" />
                  <Text style={styles.participantText}>
                    {event.maxParticipants}
                  </Text>
                </View>
                <Text style={styles.price}>Free</Text>
              </View>

              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => handleJoin(event.id)}
              >
                <Text style={styles.joinText}>Count Me In!</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noData}>No Events Found 🔎</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F8F3EB" },

  filterContainer: {
    marginHorizontal: 15,
    marginVertical: 20,
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  filterInput: {
    flex: 0.48,
    height: 45,
    backgroundColor: "#FFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D8C6A3",
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  locationInput: {
    width: "100%",
    height: 45,
    backgroundColor: "#FFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D8C6A3",
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 12,
  },

  filterText: {
    fontSize: 14,
    color: "#3C2A1E",
  },

  listContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBBBA2",
    marginBottom: 10,
  },

  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  listText: { fontSize: 14, color: "#3C2A1E" },

  slotContainer: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBBBA2",
    padding: 10,
    marginBottom: 10,
  },

  slotButton: {
    paddingVertical: 8,
  },

  slotText: { fontSize: 14, color: "#3C2A1E" },

  findButtonFull: {
    width: "100%",
    backgroundColor: "#3C2A1E",
    paddingVertical: 14,
    borderRadius: 35,
    alignItems: "center",
    marginTop: 5,
  },

  findText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  card: {
    borderRadius: 14,
    marginHorizontal: 15,
    marginBottom: 18,
    backgroundColor: "#EDE7DF",
    overflow: "hidden",
  },

  imageContainer: { position: "relative" },

  eventImage: { width: "100%", height: 150 },

  detailsOverlay: {
    position: "absolute",
    bottom: 1,
    left: 1,
    backgroundColor: "#4F3421",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  detailsText: { color: "#FFF", fontSize: 12, fontWeight: "600" },

  cardContent: { padding: 16 },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#AC9478",
    marginBottom: 8,
  },

  dateRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },

  timeRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },

  detailText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#AC9478",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  participants: { flexDirection: "row", alignItems: "center" },

  participantText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#AC9478",
  },

  price: { fontSize: 14, fontWeight: "600", color: "#3C2A1E" },

  joinButton: {
    backgroundColor: "#8C8C8C",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },

  joinText: { color: "#000", fontSize: 16, fontWeight: "600" },

  noData: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#3C2A1E",
  },
});
