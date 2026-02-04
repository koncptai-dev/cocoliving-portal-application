import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
const baseURL = "https://staging.cocoliving.in";
const PLACEHOLDERS = ["city", "room type"];

const FindStayScreen = ({ navigation }) => {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [imageIndexes, setImageIndexes] = useState({});

  const { user } = useAuth();
  const firstLetter = user?.fullName?.charAt(0)?.toUpperCase() || "U";

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

    // ✅ ONLY AVAILABLE ROOMS
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

useEffect(() => {
  fetchProperties();

  const interval = setInterval(() => {
    fetchProperties();
  }, 10000); // every 10 sec

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

  /* ================= Auto Image Slider ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndexes((prev) => {
        const next = { ...prev };
        properties.forEach((property) => {
          property.rateCard?.forEach((room) => {
            const total = room.roomImages?.length || 0;
            if (total > 1) {
              next[room.id] = ((next[room.id] || 0) + 1) % total;
            }
          });
        });
        return next;
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

  return (
    <View style={styles.container}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.hey}>Hey there 👋</Text>

          <View style={styles.rightIcons}>
             <TouchableOpacity
                          style={styles.profileCircle}
                          onPress={() => navigation.navigate('ProfileScreen')}
                          activeOpacity={0.8}
                        >
                          {user?.profileImage ? (
                            <Image
                              source={{ uri: `https://staging.cocoliving.in${user.profileImage}` }}
                              style={styles.profileImage}
                            />
                          ) : (
                            <Text style={styles.profileLetter}>{firstLetter}</Text>
                          )}
                        </TouchableOpacity>
            <Ionicons name="notifications-outline" size={28} color="#fff" />
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#999" />
          <TextInput
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
        {/* ================= TITLE ================= */}
        <Text style={styles.title}>
          We've picked the best{"\n"}
          <Text style={styles.highlight}>Stay For You</Text>
        </Text>

        {/* ================= PROPERTY CARDS ================= */}
        {filteredProperties.map((property) =>
          property.rateCard?.map((room) => {
            const images = room.roomImages || [];
            const index = imageIndexes[room.id] || 0;
            const img =
              images.length > 0
                ? `${baseURL}${images[index]}`
                : "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85";

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
                {/* IMAGE */}
                <Image source={{ uri: img }} style={styles.image} />

                {/* CONTENT */}
                <View style={styles.cardContent}>
                  <View style={styles.titleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roomName}>
                        {room.roomType} 
                      </Text>
                      <Text style={styles.address} numberOfLines={2}>
                        {property.address}
                      </Text>
                    </View>

                    <View style={styles.priceBox}>
                      <Text style={styles.price}>₹ {room.rent}</Text>
                      <Text style={styles.perMonth}>per month</Text>
                    </View>
                  </View>

                  {/* AMENITIES (PROPERTY LEVEL) */}
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
          })
        )}

        {/* ================= STEPS ================= */}
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

        {/* ================= EVENTS ================= */}
        <View style={styles.eventsHeader}>
          <Text style={styles.sectionTitle}>
            Experience the vibe at{"\n"}Community Events
          </Text>
          {/* <Text style={styles.viewAll}>View All</Text> */}
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

        {/* ================= VISIT ================= */}
      {/* ================= MAKE A VISIT (STATIC) ================= */}
<View style={styles.visitWrapper}>
  <View style={styles.visitHeaderRow}>
    <View>
      <Text style={styles.visitHeading}>Experience Coco Living</Text>
      <Text style={styles.visitSubHeading}>Make A Visit</Text>
    </View>

    {/* <TouchableOpacity style={styles.visitBookBtn}>
      <Text style={styles.visitBookText}>Book</Text>
    </TouchableOpacity> */}
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





const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },

 header: {
  height: 223,              // ✅ FIXED HEIGHT
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
  hey: { color: "#fff", fontSize: 25, fontWeight: "700",fontFamily:'RethnikSans-Regular' },
  rightIcons: { flexDirection: "row", gap: 14, alignItems: "center" },
  profile: { width: 34, height: 34, borderRadius: 17 },

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
  color: '#4F3421',   // figma orange
  fontWeight: "500",
},
  title: {
    margin: 16,
    fontSize: 24,
    // fontWeight: "700",
    color: "#444444",
    fontFamily:'Quicksand-SemiBold'
  },
  highlight: { color: "#4F3421", fontFamily:'Quicksand-Bold' },

  card: {
    backgroundColor: "#EDE7DF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 4,
  },
  card: {
  height: 400,                // ✅ FIXED HEIGHT
  backgroundColor: "#EFE8E2",
  marginHorizontal: 16,
  marginBottom: 18,
  borderRadius: 20,
  overflow: "hidden",
  elevation: 4,
},

image: {
  width: "100%",
  height: 240,                // ✅ FIGMA IMAGE HEIGHT
},

cardContent: {
  flex: 1,
  padding: 14,
  justifyContent: "space-between",
},

titleRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
},

roomName: {
  fontSize: 18,
  // fontWeight: "700",
  color: "#3E3E3E",
  fontFamily:"Quicksand-Bold"
},

address: {
  marginTop: 4,
  fontSize: 13,
  color: "#6F6F6F",
  lineHeight: 18,
  fontFamily:'Quicksand-Regular'
},

priceBox: {
  alignItems: "flex-end",
},

price: {
  fontSize: 20,
  fontWeight: "800",
  color: "#F2A85B",
   fontFamily:"Quicksand-Bold"

},

perMonth: {
  fontSize: 12,
  color: "#6F6F6F",
   fontFamily:"Quicksand-Bold"
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
  // backgroundColor: "#F6F3EC",
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 12,
},

amenityText: {
  fontSize: 12,
  fontWeight: "600",
  color: "#000000",
},

  cardInfo: { padding: 12 },


  sectionTitle: {
    margin: 16,
    fontSize: 24,
    // fontWeight: "700",
    color: "#444444",
    fontFamily:'Quicksand-SemiBold'
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
  viewAll: { color: "#F2A85B", fontWeight: "700" },
  eventCard: {
    width: 220,
    marginLeft: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  eventImg: { width: "100%", height: 140 },
  eventTitle: { padding: 10, fontWeight: "700" },

  visit: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
  },
  visitTitle: { fontSize: 18, fontWeight: "800" },
  visitSub: { marginTop: 6, color: "#D07D23", fontWeight: "700" },
    profileCircle: {
    width: 35,
    height: 35,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  profileLetter: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4b3426',
  },
  visitWrapper: {
  marginHorizontal: 16,
  marginTop: 30,
  marginBottom:30
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
});
