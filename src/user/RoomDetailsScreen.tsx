import React, { useState } from "react";
import { Linking } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");
const baseURL = "https://staging.cocoliving.in";

const RoomDetailsScreen = ({ route, navigation }) => {
  const { room, property } = route.params;
  const { user } = useAuth();

  const gallery =
    room.roomImages?.length > 0
      ? room.roomImages.map((img) => `${baseURL}${img}`)
      : [];

  const [activeIndex, setActiveIndex] = useState(0);

const handleAction = (actionType) => {

  if (!user) return;

  const { 
    userType, 
    parentName, 
    parentMobile, 
    parentEmail, 
    foodPreference, 
    allergies 
  } = user;

  // ---------------- STUDENT CHECK ----------------
  if (userType === "student") {

    if (
      !parentName ||
      !parentMobile ||
      !parentEmail ||
      !foodPreference ||
      !allergies
    ) {
      Toast.show({
        type: "error",
        text1: "Complete Student Profile",
        text2: "Please fill parent details & food information before booking.",
      });

      navigation.navigate("Profile"); // apna profile screen name confirm kar lena
      return;
    }
  }

  // ---------------- PROFESSIONAL CHECK ----------------
  if (userType === "professional") {

    if (!foodPreference || !allergies) {
      Toast.show({
        type: "error",
        text1: "Complete Profile",
        text2: "Please fill food preference & allergy details before booking.",
      });

      navigation.navigate("Profile");
      return;
    }
  }

  // ---------------- SUCCESS FLOW ----------------
  navigation.navigate("SelectYourBed", {
    room,
    property,
    rent: room.rent,
    actionType: actionType,
  });
};
  return (
    <View style={styles.container}>
      {/* ================= HEADER ================= */}
      <LinearGradient
        colors={["#6B4A2E", "#3C2A1E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {room.roomType} 
        </Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180 }}
      >
        {/* ================= IMAGE SLIDER ================= */}
       <View style={styles.sliderOuter}>
           <View style={styles.sliderWrapper}>
          <FlatList
            data={gallery}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            onMomentumScrollEnd={(e) =>
              setActiveIndex(
                Math.round(e.nativeEvent.contentOffset.x / width)
              )
            }
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.sliderImg} />
            )}
          />

          <View style={styles.dotsRow}>
            {gallery.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>
        </View>
       

        {/* ================= TITLE + PRICE ================= */}
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Text style={styles.title}>{room.roomType} Sharing Space</Text>
          

<TouchableOpacity
  onPress={() => {
    console.log("Address clicked:", property.address);

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      property.address
    )}`;

    Linking.openURL(url).catch(err =>
      console.log("Map open error:", err)
    );
  }}
>
  <Text
    style={[
      styles.address,
      { color: "#2E86DE", textDecorationLine: "underline" },
    ]}
    numberOfLines={2}
  >
    <Ionicons name="location" size={12} /> {property.address}
  </Text>
</TouchableOpacity>



          </View>

          <View style={styles.infoRight}>
            <Text style={styles.price}>₹ {room.rent}</Text>
            <Text style={styles.perMonth}>per month</Text>
          </View>
        </View>

        {/* ================= PROPERTY FACILITIES ================= */}
        <View style={styles.facilityBox}>
          {property.amenities?.filter(Boolean).map((f, i) => (
            <View key={i} style={styles.facilityChip}>
              <Text style={styles.facilityText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* ================= SERVICES ================= */}
        <View style={styles.servicesSection}>
          <View style={styles.servicesHeader}>
            <Text style={styles.servicesTitle}>Services</Text>
            {/* <Text style={styles.viewAll}>View All</Text> */}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.servicesRow}>
              {room.roomAmenities?.map((a, i) => (
                <View key={i} style={styles.serviceItem}>
                  <View style={styles.serviceIcon}>
                    <Ionicons name="checkmark" size={20} color="#3C2A1E" />
                  </View>
                  <Text style={styles.serviceText}>{a}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ================= LINKS ================= */}
        {/* <TouchableOpacity style={styles.linkRow} onPress={()=>navigation.navigate("FoodMenu")}>
          <Text style={styles.linkText}>Food Menu</Text>
          <Ionicons name="chevron-forward" size={18} />
        </TouchableOpacity> */}

        <TouchableOpacity style={styles.linkRow} onPress={()=>navigation.navigate("CommunityRules")}>
          <Text style={styles.linkText}>Policies & House rules</Text>
          <Ionicons name="chevron-forward" size={18} />
        </TouchableOpacity>
      </ScrollView>

      {/* ================= BOTTOM BAR ================= */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPrice}>₹ {room.rent}/month</Text>
          <Text style={styles.deposit}>
            + ₹ {room.rent * 2} Security Deposit
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <TouchableOpacity style={styles.bookBtn} onPress={() => handleAction('Book')}>
            <Text style={styles.bookText}>Book</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.preBtn} onPress={() => handleAction('PreBook')}>
            <Text style={styles.preText}>Pre-book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default RoomDetailsScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2"  },

  /* HEADER */
  header: {
    height: 120,
    paddingTop: 40,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  backBtn: { padding: 6 },
  headerTitle: {
    marginLeft: 10,
    fontSize: 18,
   fontFamily:'Quicksand-Bold',
    color: "#fff",
    textAlign:'center'
  },
sliderOuter: {
  paddingHorizontal: 10,
  marginTop: 10,
},
  /* SLIDER */
  sliderWrapper: {
    // marginTop: -18,
    borderRadius:10,
    overflow: "hidden",
  },
  sliderImg: { width, height: 300 },
  dotsRow: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#ddd",
  },
  dotActive: { backgroundColor: "#F4A85E" },

  /* INFO */
  infoRow: {
    flexDirection: "row",
    padding: 16,
    justifyContent: "space-between",
  },
  infoLeft: { flex: 1, paddingRight: 10 },
  infoRight: { alignItems: "flex-end" },
  title: { fontSize: 20, fontFamily:'Quicksand-Bold' , color:'#000000' },
  address: { fontSize: 12, color: "#ac9478", marginTop: 6,fontFamily: "Quicksand-Medium", },
  price: { fontSize: 20, fontFamily:'Quicksand-Bold',color:'#4f3421'},
  perMonth: { fontSize: 14, color: "#616161",fontFamily:"Quicksand-Medium" },

  /* FACILITIES */
  facilityBox: {
    marginHorizontal: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#b3b3b3",
    borderRadius: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  facilityChip: {
    borderWidth: 1,
    borderColor: "#b3b3b3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  facilityText: { fontSize: 12, fontFamily:"Inter-Regular", color: "#000000" },

  /* SERVICES */
  servicesSection: { marginTop: 20 },
  servicesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  servicesTitle: { fontSize: 16, fontFamily:'Quicksand-Bold'},
  viewAll: { color: "#F4A85E" },

  servicesRow: {
    flexDirection: "row",
    gap:5,
    paddingHorizontal:16 ,
    marginTop: 12,
  },
  serviceItem: { alignItems: "center", width: 80 },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FCF8F3",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8DCC6",
  },
  serviceText: {
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
    color: "#3C2A1E",
    fontFamily:"Quicksand-Bold"
  },

  /* LINKS */
  linkRow: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8DCC6",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  linkText: { fontSize: 14, fontWeight: "600" },

  /* BOTTOM BAR */
  bottomBar: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#E8DCC6",
    backgroundColor: "#fff",
  },
  bottomPrice: { fontSize: 24, fontFamily:"RethinkSans-Bold" },
  deposit: { fontSize: 13, color: "#8c8c8c",fontFamily:"RethinkSans-Medium" },

  bookBtn: {
    backgroundColor: "#3C2A1E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  bookText: { color: "#fff", fontFamily:"RethinkSans-ExtraBold",textAlign:'center',fontSize:16 },

  preBtn: {
    backgroundColor: "#F4A85E",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 30,
  
  },
  preText: { color: "#fff", fontFamily:"RethinkSans-ExtraBold",textAlign:'center',fontSize:16 },
});
