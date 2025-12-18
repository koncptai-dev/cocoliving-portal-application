import React from "react";
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
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const BASE_URL = "https://staging.cocoliving.in";

const EventDetailsScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { event } = route.params;

  const handleJoin = async (eventId) => {
    try {
      await axios.post(`${BASE_URL}/api/events/${eventId}/join`, { userId: user?.id, status: "attending" }, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      Alert.alert("Success", "You have marked as attending!");
      navigation.goBack();
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to join the event");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBD";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr.startsWith("00:00")) return "TBD";
    const time = new Date(`1970-01-01T${timeStr}`);
    return time.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  return (
    <ScrollView style={styles.container}>
      {/* BACK BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#3C2A1E" />
        </TouchableOpacity>
      </View>

      {/* IMAGE */}
      <Image
        source={{ uri: `https://picsum.photos/300/200?random=${event.id}` }}
        style={styles.eventImage}
        resizeMode="cover"
      />

      {/* TITLE AND SUBTITLE */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.subtitle}>{event.location}, {event.property?.name || "N/A"}</Text>
      </View>

      {/* DESCRIPTION */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionLabel}>Description</Text>
        <Text style={styles.descriptionText}>
          {event.description || "No description available."}
        </Text>
      </View>

      {/* DETAILS */}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsLabel}>Details:</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{formatDate(event.eventDate)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time:</Text>
          <Text style={styles.detailValue}>{formatTime(event.eventTime)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Participants:</Text>
          <Text style={styles.detailValue}>{event.maxParticipants}</Text>
        </View>
      </View>

      {/* PRICE AND BUTTON */}
      <View style={styles.bottomContainer}>
        <Text style={styles.price}>FREE</Text>
        <TouchableOpacity style={styles.joinButton} onPress={() => handleJoin(event.id)}>
          <Text style={styles.joinText}>I'm in!</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6E3E0",
  },

  header: {
    position: "absolute",
    top: 50,
    left: 15,
    zIndex: 1,
    backgroundColor: "#E6E3E0",
    borderRadius: 20,
    padding: 5,
  },

  backButton: {
    padding: 5,
  },

  eventImage: {
    width: "100%",
    height: 250,
  },

  titleContainer: {
    padding: 16,
    backgroundColor: "#E6E3E0",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    fontWeight:"500",
    color: "#AC9478",
  },

  descriptionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#E6E3E0",
  },

  descriptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F3421",
    marginBottom: 8,
  },

  descriptionText: {
    fontSize: 14,
    color: "#5E5B5B",
    lineHeight: 20,
  },

  detailsContainer: {
    paddingHorizontal: 16,
    backgroundColor: "#E6E3E0",
  },

  detailsLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F3421",
    marginBottom: 8,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  detailItem: {
    flex: 0.48,
  },

  detailLabel: {
    fontSize: 14,
    color: "#555555",
    fontWeight: "500",
  },

  detailValue: {
    fontSize: 11,
    color: "#AC9478",
    fontWeight: "600",
  },

  bottomContainer: {
    padding: 16,
    backgroundColor: "#E6E3E0",
    alignItems: "center",
  },

  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3C2A1E",
    marginBottom: 16,
  },

  joinButton: {
    backgroundColor: "#3C2A1E",
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },

  joinText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default EventDetailsScreen;