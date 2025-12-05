import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import DashboardHeader from "./dashboardHeader";
import { useAuth } from "../../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import axios from "axios";

const baseURL = "https://staging.cocoliving.in";
const HEADER_HEIGHT = 280;

const FindStayScreen = ({ navigation }) => {
  const { user } = useAuth();
  const username = user?.fullName || "User";
  const firstLetter = username.charAt(0).toUpperCase();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imgIndex, setImgIndex] = useState({});

  // 🟢 API CALL
 useFocusEffect(
  useCallback(() => {
    fetchProperty();
    return () => {};
  }, [])
);

 const fetchProperty = async () => {
    const apiURL = `${baseURL}/api/property/getAll`; // आपका वर्तमान URL
    
    // ⚙️ START LOG: API कॉल शुरू होने का लॉग
    console.log("--- fetchProperty Initiated ---");
    console.log(`API URL: ${apiURL}`);
    
    try {
      setLoading(true);
      
      // 🚀 AXIOS CALL
      const res = await axios.get(apiURL);
      
      // ✅ SUCCESS LOG: सफल रिस्पॉन्स का लॉग
      console.log("API Response Status:", res.status);
      console.log("API Response Headers:", res.headers);
      
      const propertiesArray = res.data?.properties;
      
      // 📊 DATA PROCESSING LOG
      console.log("Raw Response Data Keys:", Object.keys(res.data || {}));
      console.log("Properties Array Length:", propertiesArray?.length);

      if (propertiesArray && propertiesArray.length > 0) {
        setProperty(propertiesArray[0]); 
        
        // 🎯 FINAL DATA LOG
        console.log("SUCCESS: Property data set. Property Name:", propertiesArray[0].name);
      } else {
        setProperty(null);
        console.log("WARN: No properties array or properties found in response.");
      }

    } catch (err) {
        // ❌ ERROR LOG: विस्तृत एरर हैंडलिंग
        console.error("Property API Error: Request Failed");
        
        if (axios.isAxiosError(err)) {
            console.error("Axios Status Code:", err.response?.status); // 404 Status Code यहाँ दिखेगा
            console.error("Axios Response Data:", err.response?.data);
            console.error("Axios Config URL:", err.config.url);
        } else {
            console.error("Unknown Error:", err);
        }
        
        setProperty(null);
    } finally {
      // 🏁 FINAL LOG
      console.log("--- fetchProperty Finished ---");
      setLoading(false);
    }
  };

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

  // Helper function to derive beds/occupants from roomType string
  const getSharingCount = (roomType) => {
    // 1. "Double Sharing" या "4" जैसे नंबर को रेगुलर एक्सप्रेशन से निकालें
    const sharingMatch = roomType.match(/(\d+)\s*Sharing/i) || roomType.match(/(\d+)/);
    if (sharingMatch && parseInt(sharingMatch[1], 10) > 0) {
        return parseInt(sharingMatch[1], 10);
    }

    // 2. "Single", "Double" जैसे शब्दों को नंबर में बदलें
    const wordToNumber = {
        'single': 1, 'double': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6
    };
    const roomTypeLower = roomType.toLowerCase().split(' ')[0];
    
    return wordToNumber[roomTypeLower] || 1; // Default to 1 if no number/word is found
  };


  return (
    <View style={{ flex: 1, backgroundColor: "#EFEFEF" }}>
      <DashboardHeader
        username={username}
        firstLetter={firstLetter}
        navigation={navigation}
        showQuote={true}
      />

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#4B3426" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{  paddingHorizontal: 12 }}>
            {/* Steps Section ... (No Change) */}
            <Text style={styles.headerMini}>Get your place in 3 Easy Steps</Text>
            <View style={styles.stepsRow}>
              {[
                { icon: "search-outline", label: "Find" },
                { icon: "calendar-outline", label: "Book" },
                { icon: "cube-outline", label: "Move in" },
              ].map((s, i) => (
                <View key={i} style={styles.stepBox}>
                  <Ionicons name={s.icon} size={40} color="#A07355" />
                  <Text style={styles.stepTxt}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Rooms/Rate Card Section */}
            <Text style={styles.section}>We've picked the best Stay for you</Text>

            {property?.rateCard?.map((room) => {
              // ✅ Bed/Occupant लॉजिक यहाँ लागू किया गया
              const sharingCount = getSharingCount(room.roomType);
              const beds = sharingCount;
              const occupants = sharingCount;
                
              const images = room.roomImages || [];
              const current = imgIndex[room.id] || 0;
              const uri =
                images.length > 0
                  ? `${baseURL}${images[current]}`
                  : "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400"; // Fallback image

              return (
                <View key={room.id} style={styles.card}>
                  <Image source={{ uri }} style={styles.image} />

                  {/* Image Navigation Buttons */}
                  {images.length > 1 && (
                    <>
                      <TouchableOpacity
                        style={[styles.navBtn, { left: 10 }]}
                        onPress={() => prevImg(room.id, images.length)}
                      >
                        <Ionicons name="chevron-back" size={22} color="#333" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.navBtn, { right: 10 }]}
                        onPress={() => nextImg(room.id, images.length)}
                      >
                        <Ionicons name="chevron-forward" size={22} color="#333" />
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Details Button */}
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() =>
                      navigation.navigate("RoomDetails", {
                        room,
                        property,
                      })
                    }
                  >
                    <Text style={styles.detailsText}>Details</Text>
                  </TouchableOpacity>

                  {/* Info Box */}
                  <View style={styles.infoBox}>
                    <Text style={styles.roomName}>
                      {room.roomType.charAt(0).toUpperCase() +
                        room.roomType.slice(1)}
                    </Text>

                    <View style={styles.iconRow}>
                      {/* Bed Count */}
                      <Ionicons name="bed-outline" size={16} color="#6A5648" />
                      <Text style={styles.iconTxt}>{beds} beds</Text> 
                      
                      {/* Occupant Count */}
                      <Ionicons
                        name="person-outline"
                        size={16}
                        color="#6A5648"
                        style={{ marginLeft: 10 }}
                      />
                      <Text style={styles.iconTxt}>
                        {occupants} Occupant{occupants > 1 ? 's' : ''}
                      </Text>
                    </View>

                    <Text style={styles.price}>₹{room.rent}/month</Text>
                  </View>
                </View>
              );
            })}

            {/* ✅ 1. AMENITIES SECTION (Updated) */}
            {/* ======================================= */}
            <Text style={styles.sectionTitle}>Feel the comfy with Top amenities</Text>
            <View style={styles.amenitiesGrid}>
              {[
                { icon: "dumbbell-outline", title: "Gym", subtitle: "For your health" },
                { icon: "car-outline", title: "Parking", subtitle: "For your rides" },
                { icon: "wifi-outline", title: "Wifi", subtitle: "Stay connected." },
                { icon: "restaurant-outline", title: "Meals", subtitle: "For your cravings" },
                { icon: "bulb-outline", title: "Study Desk", subtitle: "Your focus zone" },
                { icon: "shield-checkmark-outline", title: "Security", subtitle: "Your peace of mind" },
              ].map((a, i) => (
                <View key={i} style={styles.amenityBox}>
                  <Text style={styles.amenityTitle}>{a.title}</Text>
                  <Text style={styles.amenitySubtitle}>{a.subtitle}</Text>
                  <Ionicons 
                    name={a.icon} 
                    size={38} 
                    color="#4B3426" // Dark Brown color for icons
                    style={styles.amenityIcon}
                  />
                </View>
              ))}
            </View>

            {/* ======================================= */}
            {/* ✅ 2. COMMUNITY EVENTS SECTION (Updated) */}
            {/* ======================================= */}
            <Text style={styles.sectionTitle}>Experience the Vibe at Community Events</Text>
            <View style={styles.eventsBlock}>
              <View style={styles.eventsHeader}>
                <Text style={styles.eventsHeaderText}>Events</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAllBtn}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.eventItem}>
                <Text style={styles.eventText}>Bcom Account Group Study</Text>
              </View>
              <View style={styles.eventItem}>
                <Text style={styles.eventText}>Karaoke Night</Text>
              </View>
            </View>

            {/* ======================================= */}
            {/* ✅ 3. BOOK VISIT SECTION (Updated) */}
            {/* ======================================= */}
            <Text style={styles.sectionTitle}>Experience Coco Living Firsthand <Text style={{fontWeight: '900', color: '#000'}}>Make a visit</Text></Text>
            <View style={styles.visitBlock}>
              <View style={styles.visitHeader}>
                <Text style={styles.visitHeaderText}>Book a visit</Text>
                <TouchableOpacity style={styles.bookBtn}>
                  <Text style={styles.bookBtnText}>Book</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.visitDescription}>
                Schedule a personalized tour to explore our vibrant common areas, modern amenities and available rooms. It's the best way to ensure your future home is the perfect fit before you make a booking.
              </Text>
            </View>

            <View style={{ height: 80 }} />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default FindStayScreen;

// 🎨 Styles (No Change)
const styles = StyleSheet.create({
  headerMini: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4B3426",
    marginTop: 6,
    marginBottom: 20,
  },

  /* Steps */
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  stepBox: {
    backgroundColor: "#fff",
    width: "31%",
    alignItems: "center",
    paddingVertical: 22,
    borderRadius: 16,
    elevation: 4,
  },
  stepTxt: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#6A5648",
  },

  /* Section title */
 section: {
  fontSize: 18,
  fontWeight: "800",
  color: "#4B3426",
  marginBottom: 14,
  marginTop: 28,
},
// पुराने 'section' style को बदलकर नए 'sectionTitle' का उपयोग करें
sectionTitle: {
  fontSize: 18,
  fontWeight: "800",
  color: "#4B3426",
  marginBottom: 14,
  marginTop: 28,
},

  /* ROOM CARD */
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 5,
  },
  image: {
    width: "100%",
    height: 195,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  navBtn: {
    position: "absolute",
    top: "43%",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 30,
    padding: 6,
  },

  /* DETAILS TAG */
  detailsBtn: {
    position: "absolute",
    top: 150,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  infoBox: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  roomName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4B3426",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  iconTxt: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6A5648",
  },
  price: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "900",
    color: "#4B3426",
  },

  /* AMENITIES */
  amenRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  amenBox: {
    width: "30%",
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 14,
    alignItems: "center",
    elevation: 4,
  },
  amenTxt: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#6A5746",
    textAlign: "center",
  },
  amenitiesGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginBottom: 20,
},
amenityBox: {
  width: "31%", // 3 items per row
  backgroundColor: "#fff",
  padding: 12,
  borderRadius: 12,
  marginBottom: 14,
  alignItems: "center",
  elevation: 4,
  height: 120, // Fixed height for uniform look
},
amenityTitle: {
  fontSize: 14,
  fontWeight: "700",
  color: "#4B3426",
},
amenitySubtitle: {
  fontSize: 11,
  fontWeight: "500",
  color: "#6A5648",
  marginBottom: 8,
},
amenityIcon: {
    position: 'absolute',
    bottom: 10,
    right: '50%',
    color: '#000' // Icon color matching the screenshot
},

  /* EVENTS */
  block: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    elevation: 4,
    marginBottom: 22,
  },
  event: {
    backgroundColor: "#F6F3EC",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
    fontSize: 13,
    color: "#4B3426",
    fontWeight: "600",
  },
  eventsBlock: {
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 16,
  elevation: 4,
  marginBottom: 22,
},
eventsHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
  paddingBottom: 8,
},
eventsHeaderText: {
  fontSize: 16,
  fontWeight: '800',
  color: '#4B3426',
},
viewAllBtn: {
  color: "#D07D23",
  fontWeight: "600",
  fontSize: 13,
},
eventItem: {
  backgroundColor: "#F6F3EC",
  paddingVertical: 12,
  paddingHorizontal: 12,
  borderRadius: 8,
  marginBottom: 10,
},
eventText: {
  fontSize: 13,
  color: "#4B3426",
  fontWeight: "600",
},

  /* VISIT */
  visitBlock: {
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 16,
  elevation: 4,
  marginBottom: 22,
},
visitHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},
visitHeaderText: {
  fontSize: 16,
  fontWeight: '800',
  color: '#4B3426',
},
visitDescription: {
  fontSize: 13,
  color: "#6A5648",
  lineHeight: 20,
},
bookBtn: {
  backgroundColor: "#D07D23",
  paddingHorizontal: 18,
  paddingVertical: 6,
  borderRadius: 8,
},
bookBtnText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 13,
},
});