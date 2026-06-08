import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import Config from "react-native-config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../ProfileScreen";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_WIDTH = SCREEN_WIDTH - 32;

 export const baseURL = Config.API_BASE_URL;
const PLACEHOLDERS = ["city", "room type"];

const FindStayScreen = ({ navigation }) => {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const sliderRefs = useRef({});

  const { user } = useAuth();
  const firstLetter = user?.fullName?.charAt(0)?.toUpperCase() || "U";
  const [notificationCount, setNotificationCount] = useState(0);



  const fetchNotifications = useCallback(async () => {
  try {
    const res = await axios.get(
      `${baseURL}/api/fcm/get-notifications`,
      {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      }
    );

    const notifications = res.data?.data || [];

    console.log("🔔 Notifications count:", notifications.length);

    const storedReadIds = await AsyncStorage.getItem("readNotifications");
const readIds = storedReadIds ? JSON.parse(storedReadIds) : [];

const unread = notifications.filter(
  (n) => !readIds.includes(n._id || n.id)
);

setNotificationCount(unread.length);
  } catch (err) {
    console.log("Notification API failed:", err?.response?.data || err.message);
    setNotificationCount(0);
  }
}, [user?.token]);

  /* ================= API ================= */
  const fetchProperties = useCallback(async () => {
    try {
      const res = await axios.get(
        `${baseURL}/api/property/getPropertiesForUser`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      const data = res.data?.properties || [];

      const filtered = data
        .map((p) => ({
          ...p,
          rateCard: p.rateCard?.filter(
            (r) => r.isAvailable === true && r.availableRooms > 0
          ),
        }))
        .filter((p) => p.rateCard?.length > 0);

      setProperties(filtered);
    } catch (e) {
      setProperties([]);
    }
  }, [user?.token]);

  useFocusEffect(
  useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications])
);

  useEffect(() => {
    fetchProperties();

    const interval = setInterval(() => {
      fetchProperties();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchProperties]);

  /* ================= Placeholder Animation ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      setPlaceholderIndex((p) => (p + 1) % PLACEHOLDERS.length);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  /* ================= AUTO SLIDER (Smooth ScrollView) ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      properties.forEach((property) => {
        property.rateCard?.forEach((room) => {
          const total = room.roomImages?.length || 0;
          if (total > 1) {
            const nextIndex = ((sliderRefs.current[room.id]?.currentIndex || 0) + 1) % total;

            sliderRefs.current[room.id]?.scrollTo({
              x: nextIndex * IMAGE_WIDTH,
              animated: true,
            });

            sliderRefs.current[room.id] = { ...sliderRefs.current[room.id], currentIndex: nextIndex };
          }
        });
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [properties]);

  /* ================= Search ================= */
  const filteredProperties = properties.filter((property) => {
    if (!search) return true;
    const text = search.toLowerCase();
    return (
      property.address?.toLowerCase().includes(text) ||
      property.rateCard?.some((r) =>
        r.roomType.toLowerCase().includes(text)
      )
    );
  });

  /* ================= ROOM CARD (Slider Fixed) ================= */
  const renderRoomCard = (property, room) => {
    const images = room.roomImages || [];
    const totalImages = images.length;

    return (
      <TouchableOpacity
        key={room.id}
        style={styles.card}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("RoomDetails", {
            room: { ...room, rateCardId: room.id },
            property,
          })
        }
      >
        {/* =============== IMAGE SECTION =============== */}
        <View style={{ width: IMAGE_WIDTH, height: 240, backgroundColor: "#f5f5f5" }}>
          {totalImages === 0 ? (
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85" }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : totalImages === 1 ? (
            /* SINGLE IMAGE */
            <Image
              source={{ uri: `${baseURL}${images[0]}` }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            /* 2+ IMAGES → AUTO SLIDER */
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              ref={(ref) => {
                if (ref) sliderRefs.current[room.id] = ref;
              }}
              scrollEventThrottle={16}
            >
              {images.map((imgPath, i) => (
                <View key={i} style={{ width: IMAGE_WIDTH, height: 240 }}>
                  <Image
                    source={{ uri: `${baseURL}${imgPath}` }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ================= CONTENT ================= */}
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.roomName}>{room.roomType}</Text>
              <Text style={styles.address} numberOfLines={2}>
                {property.address}
              </Text>
            </View>

            <View style={styles.priceBox}>
              <Text style={styles.price}>₹ {room.rent}</Text>
              <Text style={styles.perMonth}>per month</Text>
            </View>
          </View>

          <View style={styles.amenitiesRow}>
            {property.amenities
              ?.filter(Boolean)
              .slice(0, 4)
              .map((a, i) => (
                <View key={i} style={styles.amenityChip}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={14}
                    color="#F2A85B"
                  />
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER + SEARCH (same) exact */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.hey}>Hey there 👋</Text>

          <View style={styles.rightIcons}>
            <TouchableOpacity
              style={styles.profileCircle}
              onPress={() => navigation.navigate("ProfileScreen")}
              activeOpacity={0.8}
            >
              {user?.profileImage ? (
                <Image
                  source={{ uri: `${BASE_URL}${user.profileImage}` }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.profileLetter}>{firstLetter}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
  style={styles.notification}
  onPress={() => navigation.navigate("notificationListScreen")}
>
  <Ionicons name="notifications-outline" size={22} color="#fff" />

  {notificationCount > 0 && (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {notificationCount > 99 ? "99+" : notificationCount}
      </Text>
    </View>
  )}
</TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#999" />
          <TextInput
            testID="searchInput"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {!search && (
            <Animated.Text style={[styles.placeholder, { opacity: fadeAnim }]}>
              Search by{" "}
              <Text style={styles.placeholderHighlight}>
                {PLACEHOLDERS[placeholderIndex]}
              </Text>
            </Animated.Text>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          We've picked the best{"\n"}
          <Text style={styles.highlight}>Stay For You</Text>
        </Text>

        {/* ================= CARDS WITH SLIDER ================= */}
        {filteredProperties.map((property) =>
          property.rateCard?.map((room) => renderRoomCard(property, room))
        )}

        {/* STEPS, EVENTS, VISIT (same as before) */}
        <Text style={styles.sectionTitle}>Get your place in 3 Easy Steps</Text>
        <View style={styles.stepsRow}>
          {[
            { icon: "search-outline", label: "Find" },
            { icon: "calendar-outline", label: "Book" },
            { icon: "briefcase-outline", label: "Move-in" },
          ].map((s, i) => (
            <View key={i} style={styles.stepBox}>
              <Ionicons name={s.icon} size={32} color="#4B3426" />
              <Text style={styles.stepText}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.eventsHeader}>
          <Text style={styles.sectionTitle}>
            Experience the vibe at{"\n"}Community Events
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["Karaoke Night", "Group Study"].map((e, i) => (
            <View key={i} style={styles.eventCard}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
                }}
                style={styles.eventImg}
              />
              <Text style={styles.eventTitle}>{e}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.visitWrapper}>
          <View style={styles.visitHeaderRow}>
            <View>
              <Text style={styles.visitHeading}>Experience Coco Living</Text>
              <Text style={styles.visitSubHeading}>Make A Visit</Text>
            </View>

            <TouchableOpacity
              style={styles.visitBookBtn}
              onPress={() => navigation.navigate("myVisit")}
            >
              <Text style={styles.visitBookText}>Book</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.visitCard}>
            <View style={styles.visitTextBox}>
              <Text style={styles.visitDesc}>
                Don’t miss the vibe.{"\n"}
                Book a tour and see{"\n"}
                why Coco Living slays.
              </Text>
            </View>

            <Image
              source={require("../../../assets/images/add.png")}
              style={styles.visitImage}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default FindStayScreen;

/* ================= STYLES (same as you had) ================= */
const styles = StyleSheet.create({
  // ... pura styles same rakha hai (koi change nahi kiya)
  container: { flex: 1, backgroundColor: "#F7F7F7" },

  header: {
    height: 223,
    backgroundColor: "#5C4435",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: "space-between",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hey: { color: "#fff", fontSize: 25, fontWeight: "700", fontFamily: "RethnikSans-Regular" },
  rightIcons: { flexDirection: "row", gap: 14, alignItems: "center" },

  searchBox: {
    marginTop: 20,
    backgroundColor: "#d9d9d9",
    borderRadius: 14,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  placeholder: {
    position: "absolute",
    left: 38,
    color: "#b3b3b3",
    fontSize: 15,
  },
  placeholderHighlight: {
    color: "#4F3421",
    fontWeight: "500",
  },

  title: {
    margin: 16,
    fontSize: 24,
    color: "#444444",
    fontFamily: "Quicksand-SemiBold",
  },
  highlight: { color: "#4F3421", fontFamily: "Quicksand-Bold" },

  card: {
    backgroundColor: "#EFE8E2",
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
  },

  cardContent: {
    padding: 14,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  roomName: {
    fontSize: 18,
    color: "#3E3E3E",
    fontFamily: "Quicksand-Bold",
  },

  address: {
    marginTop: 4,
    fontSize: 13,
    color: "#6F6F6F",
    lineHeight: 18,
    fontFamily: "Quicksand-Regular",
  },

  priceBox: {
    alignItems: "flex-end",
  },

  price: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F2A85B",
    fontFamily: "Quicksand-Bold",
  },

  perMonth: {
    fontSize: 12,
    color: "#6F6F6F",
    fontFamily: "Quicksand-Bold",
  },

  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5D5C5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  amenityText: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#000000",
  },

  notification: { position: "relative" },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#E84C3D",
    borderRadius: 10,
    paddingHorizontal: 5,
  },
  badgeText: { color: "#fff", fontSize: 10 },

  sectionTitle: {
    margin: 16,
    fontSize: 24,
    color: "#444444",
    fontFamily: "Quicksand-SemiBold",
  },

  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 14,
  },
  stepBox: {
    width: "30%",
    backgroundColor: "#EFE8E2",
    borderRadius: 14,
    paddingVertical: 22,
    alignItems: "center",
  },
  stepText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#4B3426",
  },

  eventsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 30,
  },

  eventCard: {
    width: 220,
    marginLeft: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  eventImg: { width: "100%", height: 140 },
  eventTitle: { padding: 10, fontWeight: "700" },

  visitWrapper: {
    marginHorizontal: 16,
    marginTop: 30,
    marginBottom: 30,
  },

  visitHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  visitHeading: {
    fontSize: 18,
    color: "#4B3426",
    fontFamily: "Quicksand-SemiBold",
  },

  visitSubHeading: {
    fontSize: 20,
    color: "#4B3426",
    fontFamily: "Quicksand-Bold",
    marginTop: 2,
  },

  visitBookBtn: {
    backgroundColor: "#F2A85B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },

  visitBookText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
  },

  visitCard: {
    flexDirection: "row",
    backgroundColor: "#EFE8E2",
    borderRadius: 18,
    overflow: "hidden",
  },

  visitTextBox: {
    flex: 1,
    padding: 14,
    justifyContent: "center",
  },

  visitDesc: {
    fontSize: 14,
    color: "#5A5A5A",
    lineHeight: 20,
    fontFamily: "Quicksand-Regular",
  },

  visitImage: {
    width: 140,
    height: 120,
    resizeMode: "cover",
  },

  profileCircle: {
    width: 35,
    height: 35,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  profileLetter: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4b3426",
  },
});