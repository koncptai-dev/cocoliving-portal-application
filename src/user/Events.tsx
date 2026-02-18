import React, { useEffect, useState, useCallback } from "react";
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import HeaderGradient from "../components/HeaderGradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import colors from "../constants/color";

const BASE_URL = "https://staging.cocoliving.in";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7";

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

  // Refetch events every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  useEffect(() => {
    fetchEvents();
  }, []);

 const fetchEvents = async () => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/events/allevents?page=1&limit=20`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const fetchedEvents = res.data.events || [];

    // 🔥 CHANGE HERE: Sirf future ya aaj ke events dikhane ke liye filter logic
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Sirf date compare karne ke liye time 0 kar diya

    const upcomingEvents = fetchedEvents.filter((event) => {
      if (!event.eventDate) return false;
      const eventDate = new Date(event.eventDate);
      eventDate.setHours(0, 0, 0, 0); 
      
      return eventDate >= today; // Aaj ki date ya badi date honi chahiye
    });

    setEvents(upcomingEvents); // Sirf filtered events state mein jayenge
    setFilteredEvents(upcomingEvents);

    const locs = [
      ...new Set(upcomingEvents.map((e) => e.location || "Unknown")),
    ];
    setLocations(locs);
  } catch (e) {
    console.log("Events Error:", e?.response?.data || e);
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Failed to fetch events",
    });
  }
};

  const handleJoinEvent = async (event) => {
    if (!user?.id) return;

    const currentParticipation = event.EventParticipations?.find(
      (p) => p.userId === user.id
    );
    const isCurrentlyAttending = currentParticipation?.status === "attending";

    const newAttending = !isCurrentlyAttending;
    const statusToSend = newAttending ? "attending" : "not_attending";
    const delta = newAttending ? 1 : -1;

    const updateEventsList = (prev) =>
      prev.map((e) =>
        e.id === event.id
          ? {
              ...e,
              attendingCount: e.attendingCount + delta,
              EventParticipations: newAttending
                ? [
                    ...(e.EventParticipations?.filter(
                      (p) => p.userId !== user.id
                    ) || []),
                    { userId: user.id, status: "attending" },
                  ]
                : e.EventParticipations?.filter((p) => p.userId !== user.id) ||
                  [],
            }
          : e
      );

    setEvents(updateEventsList);
    setFilteredEvents(updateEventsList);

    try {
      await axios.post(
        `${BASE_URL}/api/events/${event.id}/join`,
        { userId: user.id, status: statusToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({
        type: "success",
        text1: newAttending ? "You're In!" : "Attendance Cancelled",
      });

      fetchEvents();
    } catch (e) {
      console.log(e);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update attendance",
      });
      fetchEvents();
    }
  };

  const formatDate = (d) => {
    if (!d) return "TBD";
    return new Date(d).toDateString();
  };

  const formatTime = (t) => {
    if (!t || t === "00:00:00") return "TBD";
    const [hour, minute] = t.split(":");
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const handleFind = () => {
    if (!selectedDate && !selectedTime && !locationFilter) {
      setFilteredEvents(events);
      return;
    }

    let filtered = [...events];

    if (selectedDate) {
      filtered = filtered.filter((event) => {
        if (!event.eventDate) return false;
        const eventDate = new Date(event.eventDate).toDateString();
        return eventDate === selectedDate;
      });
    }

    if (selectedTime) {
      filtered = filtered.filter((event) => {
        if (!event.eventTime) return false;
        const [start] = selectedTime.split(" - ");
        const startHour = start.replace(/ [AP]M$/, "");
        return event.eventTime.startsWith(startHour.padStart(2, "0"));
      });
    }

    if (locationFilter) {
      filtered = filtered.filter(
        (event) =>
          (event.location || "").toLowerCase() === locationFilter.toLowerCase()
      );
    }

    setFilteredEvents(filtered);
  };

  // NEW: Clear Filters Function
  const handleClearFilters = () => {
    setSelectedDate("");
    setSelectedTime("");
    setLocationFilter("");
    setFilteredEvents(events);
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <HeaderGradient
          image={require("../../assets/images/events.jpg")}
          title="Community Events"
        />

        {/* FILTERS */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.filterText}>
                {selectedDate || "Date"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#3C2A1E" />
            </TouchableOpacity>

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

          {/* <TouchableOpacity
            style={styles.locationInput}
            onPress={() => setShowLocationList(!showLocationList)}
          >
            <Ionicons name="location-outline" size={18} color="#3C2A1E" />
            <Text style={[styles.filterText, { flex: 1, marginLeft: 10 }]}>
              {locationFilter || "Location"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#3C2A1E" />
          </TouchableOpacity> */}

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

          {/* NEW: Clear and Find buttons side by side */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearFilters}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.findButton} onPress={handleFind}>
              <Text style={styles.findText}>Find</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* EVENTS LIST */}
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const participation = event.EventParticipations?.find(
              (p) => p.userId === user?.id
            );
            const isAttending = participation?.status === "attending";

            const eventDateTime = new Date(
              `${event.eventDate}T${event.eventTime || "00:00:00"}`
            );
            const isPast = eventDateTime < new Date();

            return (
              <TouchableOpacity
                key={event.id}
                activeOpacity={0.95}
                onPress={() => navigation.navigate("EventDetails", { event })}
              >
                <View style={styles.card}>
                  <Image
                    source={{
                      uri: event.eventImage
                        ? `${BASE_URL}${event.eventImage}`
                        : FALLBACK_IMAGE,
                    }}
                    style={styles.eventImage}
                    resizeMode="cover"
                  />

                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{event.title}</Text>

                    {/* Location - moved right below title, fontSize 12 */}
                    <View style={styles.locationRow}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={colors.nOrange}
                      />
                      <Text style={styles.locationText}>
                        {event.location || "TBD"}
                      </Text>
                    </View>

                    {/* Date */}
                    <View style={styles.dateRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={colors.nOrange}
                      />
                      <Text style={styles.detailText}>
                        {formatDate(event.eventDate)}
                      </Text>
                    </View>

                    {/* Time */}
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={16} color={colors.nOrange} />
                      <Text style={styles.detailText}>
                        {formatTime(event.eventTime)}
                      </Text>
                    </View>

                    {/* Attending Count */}
                    <View style={styles.participantsRow}>
                      <Ionicons name="people-outline" size={16} color={colors.nOrange} />
                      <Text style={styles.detailText}>
                        {event.attendingCount || 0}/{event.maxParticipants} attending
                      </Text>
                    </View>

                    {/* Join Button */}
                    {isPast ? (
                      <TouchableOpacity
                        style={styles.completedButton}
                        disabled
                      >
                        <Text style={styles.completedText}>Completed</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.joinButton,
                          isAttending ? styles.greenButton : styles.grayButton,
                        ]}
                        onPress={(e) => {
                          e.stopPropagation(); // Prevent card navigation when pressing button
                          handleJoinEvent(event);
                        }}
                      >
                        <Text
                          style={[
                            styles.joinText,
                            isAttending && styles.greenText,
                          ]}
                        >
                          {isAttending ? "See You There!" : "Count Me In!"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.noData}>No Events Found 🔎</Text>
        )}
      </ScrollView>

      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbfbfb" },

  filterContainer: {
    backgroundColor: "#fff",
    margin: 12,
    borderRadius: 14,
    elevation: 4,
    padding: 16,
  },

  filterRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  filterInput: {
    flex: 1,
    height: 45,
    backgroundColor: "#FFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#616161",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily:'Quicksand-Regular'
  },

  locationInput: {
    height: 45,
    backgroundColor: "#FFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#616161",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
        fontFamily:'Quicksand-Regular'
  },

  filterText: {
    fontSize: 14,
    color: "#616161",
   fontFamily:'Quicksand-Regular'
  },

  listContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBBBA2",
    marginBottom: 12,
  },

  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  listText: { fontSize: 14, color: "#616161",    fontFamily:'Quicksand-Regular' },

  slotContainer: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBBBA2",
    padding: 10,
    marginBottom: 12,
  },

  slotButton: { paddingVertical: 8 },

  slotText: { fontSize: 14, color: "#3C2A1E" },

  // NEW: Button row for Clear + Find
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },

  clearButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: colors.nOrange,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  clearText: {
    color: colors.nOrange,
    fontSize: 19,
    fontFamily: 'Quicksand-Bold',
  },

  findButton: {
    flex: 1,
    backgroundColor: colors.nOrange,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  findText: {
    color: "#FFF",
    fontSize: 19,
    fontFamily:'Quicksand-Bold'
  },

  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#EDE7DF",
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  eventImage: {
    width: "100%",
    height: 240,
  },

  cardContent: { padding: 20 },

  cardTitle: {
    fontSize: 20,
    fontFamily:'Quicksand-Bold',
    color: "#444444",
    marginBottom: 8,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  locationText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#444444",
    fontFamily:'Quicksand-Regular'
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  participantsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  detailText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#444444",
    fontFamily:'Quicksand-Regular'
  },

  joinButton: {
    width: "100%",
    paddingVertical: 16,
    alignItems: "center",
  },

  grayButton: {
    backgroundColor: "#8C8C8C",
  },

  greenButton: {
    backgroundColor: "#4CAF50",
  },

  completedButton: {
    width: "100%",
    backgroundColor: "#DDDDDD",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  joinText: {
    fontSize: 16,
    fontFamily:'Quicksand-Bold',
    color: "#000",
  },

  greenText: {
    color: "#FFFFFF",
  },

  completedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#777777",
  },

  noData: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "#3C2A1E",
  },
});