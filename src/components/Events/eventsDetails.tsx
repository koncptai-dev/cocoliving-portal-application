import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import colors from "../../constants/color";

const BASE_URL = "https://staging.cocoliving.in";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7";

const EventDetailsScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const token = user?.token;
  const initialEvent = route.params?.event;

  const [localEvent, setLocalEvent] = useState(initialEvent);

  // Refetch on focus for real-time admin changes
  useFocusEffect(
    useCallback(() => {
      const fetchLatest = async () => {
        try {
          const res = await axios.get(
            `${BASE_URL}/api/events/allevents?page=1&limit=50`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const updated = res.data.events?.find((e) => e.id === initialEvent.id);
          if (updated) {
            setLocalEvent(updated);
          } else {
            Toast.show({
              type: "info",
              text1: "Event no longer available",
            });
            navigation.goBack();
          }
        } catch (e) {
          console.log("Refetch error:", e);
        }
      };

      if (initialEvent) fetchLatest();
    }, [initialEvent, token, navigation])
  );

  const handleJoinEvent = async () => {
    if (!user?.id || !localEvent) return;

    const currentParticipation = localEvent.EventParticipations?.find(
      (p) => p.userId === user.id
    );
    const isCurrentlyAttending = currentParticipation?.status === "attending";

    const newAttending = !isCurrentlyAttending;
    const statusToSend = newAttending ? "attending" : "not_attending";
    const delta = newAttending ? 1 : -1;

    // Optimistic update
    setLocalEvent((prev) => ({
      ...prev,
      attendingCount: prev.attendingCount + delta,
      EventParticipations: newAttending
        ? [
            ...(prev.EventParticipations?.filter((p) => p.userId !== user.id) || []),
            { userId: user.id, status: "attending" },
          ]
        : prev.EventParticipations?.filter((p) => p.userId !== user.id) || [],
    }));

    try {
      await axios.post(
        `${BASE_URL}/api/events/${localEvent.id}/join`,
        { userId: user.id, status: statusToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Toast.show({
        type: "success",
        text1: newAttending ? "You're In!" : "Attendance Cancelled",
      });
    } catch (e) {
      console.log(e);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update attendance",
      });
      // Revert
      setLocalEvent(initialEvent);
    }
  };

  if (!localEvent) {
    return null;
  }

  const isAttending = localEvent.EventParticipations?.some(
    (p) => p.userId === user?.id && p.status === "attending"
  );

  const eventDateTime = new Date(
    `${localEvent.eventDate}T${localEvent.eventTime || "00:00:00"}`
  );
  const isPast = eventDateTime < new Date();

  const formatDate = (d) => {
    if (!d) return "TBD";
    const date = new Date(d);
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (t) => {
    if (!t || t === "00:00:00") return "TBD";
    const [hour, minute] = t.split(":");
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

 return (
  <>
    <View style={{ flex: 1, backgroundColor: "#F6F3EC" }}>
      
      {/* 🔒 FIXED HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {localEvent.title}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* 📜 SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Image */}
        <View style={styles.imageWrapper}>
          <Image
            source={{
              uri: localEvent.eventImage
                ? `${BASE_URL}${localEvent.eventImage}`
                : FALLBACK_IMAGE,
            }}
            style={styles.eventImage}
            resizeMode="cover"
          />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{localEvent.title}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={colors.nOrange} />
            <Text style={styles.locationText}>
              {localEvent.location || "TBD"}
            </Text>
          </View>

          <Text style={styles.quickPeekTitle}>Quick Peek</Text>
          <Text style={styles.description}>
            {localEvent.description || "No description available."}
          </Text>

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.nOrange} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(localEvent.eventDate)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={18} color={colors.nOrange} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
                  {formatTime(localEvent.eventTime)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={18} color={colors.nOrange} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Participants</Text>
                <Text style={styles.detailValue}>
                  {localEvent.attendingCount || 0} /{" "}
                  {localEvent.maxParticipants} attending
                </Text>
              </View>
            </View>
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[
              styles.joinButton,
              isPast
                ? styles.completedButton
                : isAttending
                ? styles.greenButton
                : styles.brownButton,
            ]}
            onPress={handleJoinEvent}
            disabled={isPast}
          >
            <Text style={styles.joinText}>
              {isPast
                ? "Completed"
                : isAttending
                ? "You're In!"
                : "I'm In!"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>

    <Toast />
  </>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F3EC",
  },

  header: {
    backgroundColor: "#4b3426",
    height: 120,
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  headerTitle: {
    fontSize: 24,
    fontFamily: "Quicksand-Bold",
    color: "#FFF",
    flex: 1,
    textAlign: "center",
    marginRight: -28,
  },

  imageWrapper: {
    paddingHorizontal: 12,
    marginTop: 10, // Slight overlap with header for premium feel
  },

  eventImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  title: {
    fontSize: 26,
    fontFamily: "Quicksand-Bold",
    color: "#3C2A1E",
    marginBottom: 10,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  locationText: {
    fontSize: 16,
    color: "#5E5B5B",
    marginLeft: 8,
    fontFamily: "Quicksand-Regular",
  },

  quickPeekTitle: {
    fontSize: 20,
    fontFamily: "Quicksand-Bold",
    color: "#3C2A1E",
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    color: "#5E5B5B",
    lineHeight: 22,
    fontFamily: "Quicksand-Regular",
    marginBottom: 30,
  },

  detailsSection: {
    marginBottom: 20,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  detailContent: {
    marginLeft: 12,
  },

  detailLabel: {
    fontSize: 14,
    color: "#777777",
    fontFamily: "Quicksand-Medium",
  },

  detailValue: {
    fontSize: 16,
    color: "#3C2A1E",
    fontFamily: "Quicksand-Bold",
    marginTop: 2,
  },

 joinButton: {
  width: "100%",
  paddingVertical: 18,
  borderRadius: 30,
  alignItems: "center",
  elevation: 6,
  marginBottom: 40, // 👈 add this
},

  brownButton: {
    backgroundColor: "#4b3426",
  },

  greenButton: {
    backgroundColor: "#4CAF50",
  },

  completedButton: {
    backgroundColor: "#DDDDDD",
  },

  joinText: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "Quicksand-Bold",
  },
});

export default EventDetailsScreen;