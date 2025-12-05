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
import colors from "../constants/color";

// const baseURL = "https://staging.cocoliving.in";
const baseURL = "http://10.0.2.2:5001"; // backend

const PropertyDetailsScreen = ({ route, navigation }) => {
  const { property } = route.params; // property received from previous screen
  const [imgIndex, setImgIndex] = useState({});
  const [expandedAmenities, setExpandedAmenities] = useState(null);

  const nextImg = (roomId, total) =>
    setImgIndex((prev) => ({
      ...prev,
      [roomId]: prev[roomId] >= total - 1 ? 0 : prev[roomId] + 1,
    }));

  const prevImg = (roomId, total) =>
    setImgIndex((prev) => ({
      ...prev,
      [roomId]: prev[roomId] <= 0 ? total - 1 : prev[roomId] - 1,
    }));

  return (
    <ScrollView style={styles.container}>
      {/* Property Title */}
      <Text style={styles.title}>{property.name}</Text>
      {property.address && (
        <Text style={styles.address}>{property.address}</Text>
      )}

      <Text style={styles.sectionHeader}>Available Rooms</Text>

      {property.rateCard?.length === 0 && (
        <Text style={{ textAlign: "center", marginTop: 30, color: "gray" }}>
          No rooms available under this property.
        </Text>
      )}

      {property.rateCard?.map((room) => {
        const images = room.roomImages || [];
        const current = imgIndex[room.id] || 0;
        const uri =
          images.length > 0
            ? `${baseURL}${images[current]}`
            : "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400";

        return (
          <View key={room.id} style={styles.card}>
            {/* Image */}
            <View style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />

              {/* Slider buttons */}
              {images.length > 1 && (
                <>
                  <TouchableOpacity
                    style={[styles.navBtn, { left: 10 }]}
                    onPress={() => prevImg(room.id, images.length)}
                  >
                    <Ionicons name="chevron-back" size={20} color="#333" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.navBtn, { right: 10 }]}
                    onPress={() => nextImg(room.id, images.length)}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#333" />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.roomType}>
                Room Type: {room.roomType.charAt(0).toUpperCase() + room.roomType.slice(1)}
              </Text>

              <Text style={styles.rent}>₹{room.rent} / month</Text>

              {/* Amenities */}
              {Array.isArray(room.roomAmenities) &&
              room.roomAmenities.filter((a) => a.trim() !== "").length > 0 ? (
                <View style={styles.amenitiesWrap}>
                  {(expandedAmenities === room.id
                    ? room.roomAmenities
                    : room.roomAmenities.slice(0, 3)
                  ).map((a, i) => (
                    <View key={i} style={styles.badge}>
                      <Text style={styles.badgeText}>{a}</Text>
                    </View>
                  ))}

                  {room.roomAmenities.length > 3 && (
                    <TouchableOpacity
                      onPress={() =>
                        setExpandedAmenities(
                          expandedAmenities === room.id ? null : room.id
                        )
                      }
                    >
                      <Text style={styles.moreBadge}>
                        {expandedAmenities === room.id
                          ? "Show Less"
                          : `+${room.roomAmenities.length - 3} more`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <Text style={styles.noAmen}>No amenities</Text>
              )}

              {/* Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.outline]}
                  onPress={() =>
                    navigation.navigate("RoomDetails", { room, property })
                  }
                >
                  <Ionicons name="eye-outline" size={18} color="#007BFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btn}
                  onPress={() =>
                    navigation.navigate("RoomDetails", { room, property })
                  }
                >
                  <Ionicons name="calendar-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

export default PropertyDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMain, padding: 16 },
  title: { fontSize: 26, fontWeight: "800", color: colors.primary },
  address: { fontSize: 14, color: colors.textDark, marginBottom: 20 },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 4,
  },
  imageContainer: { height: 200, position: "relative" },
  image: { width: "100%", height: "100%" },
  navBtn: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -15 }],
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 16,
    padding: 5,
  },
  content: { padding: 15 },
  roomType: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  rent: { fontSize: 20, color: colors.error, fontWeight: "800" },

  amenitiesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 8,
  },
  badge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.inputBackground,
  },
  badgeText: { fontSize: 12, color: colors.textDark, fontWeight: "600" },
  moreBadge: { fontSize: 12, color: "#007BFF", marginLeft: 4 },

  noAmen: { fontSize: 12, color: "#999", marginVertical: 6 },

  btnRow: { flexDirection: "row", marginTop: 12, justifyContent: "space-between" },
  btn: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  outline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#007BFF",
    marginRight: 8,
  },
});
