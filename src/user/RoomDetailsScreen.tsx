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
import Toast from "react-native-toast-message";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Animated } from "react-native";


const baseURL = "https://staging.cocoliving.in";

const fallbackGallery = [
  "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg",
  "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg",
  "https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg",
  "https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg",
];

const iconMap = {
  wifi: "wifi",
  meals: "restaurant",
  parking: "car",
  security: "shield-checkmark",
  gym: "barbell",
  study: "school",
};

const RoomDetailsScreen = ({ route, navigation }) => {
  const { room, property } = route.params;
  const { user } = useAuth();
  const token = user?.token;

  const amenities = room.roomAmenities?.filter((a) => a && a.trim() !== "") || [];

  const galleryImgs =
    room.roomImages?.length > 0
      ? room.roomImages.map((img) => `${baseURL}${img}`)
      : fallbackGallery;

 const handleAction = (actionType) => { // <-- यहाँ बदलाव
    navigation.navigate("SelectYourBed", {
      room,
      property,
      rent: room.rent,
      actionType: actionType, // <-- नया पैरामीटर पास करें
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Image + Back Button */}
        <View style={styles.topImageBox}>
          <Image
            source={{
              uri:
                galleryImgs.length > 0
                  ? galleryImgs[0]
                  : fallbackGallery[0],
            }}
            style={styles.topImage}
          />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Title + Price */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.roomTitle}>{room.roomType}</Text>
            <Text style={styles.addressText}>
              {property?.address || ""}
            </Text>
          </View>

          <Text style={styles.priceText}>₹ {room.rent}/month</Text>
        </View>

        {/* Amenities */}
        <View style={styles.sectionBlock}>
          <View style={styles.secRow}>
            <Text style={styles.secTitle}>Amenities</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.amenitiesRow}>
            {amenities.map((a, i) => {
  const key = a.toLowerCase();
  const icon = iconMap[key] || "checkmark-circle";

  const scale = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.88,
      speed: 20,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 20,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      key={i}
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ alignItems: "center" }}
    >
      {/* Animation wrapper */}
      <Animated.View style={[styles.amenCard, { transform: [{ scale }] }]}>
        <Ionicons name={icon} size={28} color="#3C2A1E" />
      </Animated.View>

      <Text style={styles.amenText}>{a}</Text>
    </TouchableOpacity>
  );
})}

            </View>
          </ScrollView>
        </View>

        {/* Description */}
        <View style={styles.sectionBlock}>
          <Text style={styles.secTitle}>Descriptions</Text>
          <Text style={styles.descText}>
            {property.description ||
              "A cozy private space designed for comfort and focus — perfect for peaceful living."}
          </Text>
        </View>

        {/* Gallery */}
        <View style={styles.sectionBlock}>
          <Text style={styles.secTitle}>Gallery</Text>
          <View style={styles.galleryGrid}>
            {galleryImgs.slice(0, 4).map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.galleryImg} />
            ))}
          </View>
        </View>

        {/* Details */}
        <View style={styles.sectionBlock}>
          <Text style={styles.secTitle}>Details:</Text>
          <Text style={styles.subHeading}>Room Basics & Occupancy:</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Room Type:</Text>
            <Text style={styles.detailValue}>{room.roomType}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Minimum Duration:</Text>
            <Text style={styles.detailValue}>3 months</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Deposit Required:</Text>
            <Text style={styles.detailValue}>2 month’s rent</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPrice}>₹ {room.rent}/month</Text>
          <Text style={styles.bottomDeposit}>+ {room.rent*2} Security Deposite</Text>
          <Text style={styles.bottomMiddle}>OR</Text>
          <Text style={styles.bottomDescription}>Secure this room today with just {"\n"}10% upfront!</Text>
          
        </View>

      <View style={styles.buttonsContainer}>
          {/* 'Book Now' बटन पर 'Book' actionType पास करें */}
          <TouchableOpacity style={styles.bookBtn} onPress={() => handleAction('Book')}>
            <Text style={styles.bookBtnText}>Book Now</Text>
          </TouchableOpacity>
          {/* 'Pre-book' बटन पर 'PreBook' actionType पास करें */}
          <TouchableOpacity style={styles.preBookBtn} onPress={() => handleAction('PreBook')}>
            <Text style={styles.preBookBtnText}>Pre-book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default RoomDetailsScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#ECECEC" 
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  topImageBox: { height: 320, width: "100%", position: "relative" },
  topImage: { width: "100%", height: "100%" },
  backBtn: {
    position: "absolute",
    top: 40,
    left: 15,
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 8,
    borderRadius: 25,
  },

  headerRow: {
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomTitle: { fontSize: 20, fontWeight: "700", color: "#1f1f1f" },
  addressText: { fontSize: 14, color: "#AC9478", marginTop: 4 },
  priceText: { fontSize: 20, fontWeight: "500", color: "#000000" },

  sectionBlock: { paddingHorizontal: 18, marginTop: 10 },
  secRow: { flexDirection: "row", justifyContent: "space-between" },
  secTitle: { fontSize: 14, fontWeight: "700", color: "#4F3421" },

  amenitiesRow: { flexDirection: "row", gap:2, marginTop: 14 },
 amenCard: {
  width: 44,
  height: 44,
  borderRadius: 50,
  borderWidth: 2,
  borderColor: "#E8DCC6",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#FCF8F3",
},
 amenText: {
  marginTop: 8,
  fontSize: 12,
  color: "#3C2A1E",
  fontWeight: "600",
  textAlign: "center",
  width: 74,
},

  descText: { marginTop: 8, fontSize: 14, color: "#3C2A1E", lineHeight: 20 },

  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  galleryImg: {
    width: "47%",
    height: 120,
    borderRadius: 12,
  },

  subHeading: { marginTop: 8, fontSize: 15, fontWeight: "700", color: "#3C2A1E" },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  detailLabel: { fontSize: 14, fontWeight: "600", color: "#3C2A1E" },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#A07B54" },

  bottomBar: {
    position: "absolute",
  
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1.4,
    borderColor: "#E3D6C8",
    backgroundColor: "#EFE7DD",
  },
  bottomPrice: { fontSize: 24, fontWeight: "500", color: "#0000000" },
  bottomDeposit: { fontSize: 12, color: "#8c8c8c" },
  bottomDescription:{fontSize:12,left:'2%'},
  bottomMiddle:{left:'20%'},

  buttonsContainer: {
    alignItems: "flex-end",
    gap: 8,
  },
  bookBtn: {
    backgroundColor: "#3C2A1E",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    width: 120,
    alignItems: "center",
  },
  bookBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  preBookBtn: {
    backgroundColor: "#A07B54",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    width: 120,
    alignItems: "center",
  },
  preBookBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
});