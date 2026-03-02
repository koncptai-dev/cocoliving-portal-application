import React, { useState, useEffect, useCallback } from "react";
import { Linking } from "react-native";


import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import colors from "../constants/color";
import Config from "react-native-config";
import HeaderGradient from "../components/HeaderGradient";

export const baseURL = Config.API_BASE_URL;

const BrowsePropertiesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const token = user?.token;

  const [properties, setProperties] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageIndex, setImageIndex] = useState({});

  // Filters
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [location, setLocation] = useState("");
  const [roomTypeOpen, setRoomTypeOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);

  const priceOptions = ["5000", "10000", "15000", "20000", "25000"];
  const roomTypeOptions = ["Single", "Double", "Triple", "Four"];

  /* ================= API ================= */
 const fetchProperties = useCallback(async () => {
  try {
    setLoading(true);

    const res = await axios.get(
      `${baseURL}/api/property/getPropertiesForUser`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = res.data?.properties || [];

    // ✅ ONLY AVAILABLE RATE CARDS
    const cleaned = data
      .map((p) => ({
        ...p,
        rateCard: (p.rateCard || []).filter(
          (r) => r.isAvailable && r.availableRooms > 0
        ),
      }))
      .filter((p) => p.rateCard.length > 0);

    setProperties(cleaned);
    setFilteredList(cleaned);
  } catch (e) {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Failed to load properties",
    });
  } finally {
    setLoading(false);
  }
}, [token]);


  /* ================= IMAGE AUTO SLIDER ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => {
        const next = { ...prev };
        filteredList.forEach((p) => {
          p.rateCard?.forEach((r) => {
            const total = r.roomImages?.length || 0;
            if (total > 1) {
              next[r.id] = ((next[r.id] || 0) + 1) % total;
            }
          });
        });
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [filteredList]);

  /* ================= APPLY FILTER ================= */
  const applyFilters = () => {
    let list = properties.filter(
      (p) =>
        !location ||
        p.address?.toLowerCase().includes(location.toLowerCase())
    );

    list = list
      .map((p) => ({
        ...p,
        rateCard: p.rateCard?.filter((r) => {
         const typeOk =
  !selectedRoomType ||
  r.roomType.toLowerCase().includes(selectedRoomType.toLowerCase());
          const priceOk =
            !selectedPrice || Number(r.rent) <= Number(selectedPrice);
          return typeOk && priceOk;
        }),
      }))
      .filter((p) => p.rateCard?.length);

    setFilteredList(list);
  };

  useEffect(() => {
  fetchProperties();
}, [fetchProperties]);

  const clearFilters = () => {
    setSelectedPrice(null);
    setSelectedRoomType(null);
    setLocation("");
    setFilteredList(properties);
    setRoomTypeOpen(false);
    setPriceOpen(false);
  };

  /* ================= ROOM CARD (DASHBOARD STYLE) ================= */
  const renderRoomCard = ({ room, property }) => {
    const images = room.roomImages || [];
    const idx = imageIndex[room.id] || 0;

    const img =
      images.length > 0
        ? `${baseURL}${images[idx]}`
        : "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85";

    return (
      <TouchableOpacity
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
             

<TouchableOpacity
  onPress={() => {
    console.log("Address clicked:", property.address);

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      property.address
    )}`;

    Linking.openURL(url).catch(err =>
      console.log("Error opening maps:", err)
    );
  }}
>
  <Text
    style={[styles.address, { color: "#2E86DE", textDecorationLine: "underline" }]}
    numberOfLines={2}
  >
    {property.address}
  </Text>
</TouchableOpacity>




            </View>

            <View style={styles.priceBox}>
              <Text style={styles.price}>₹ {room.rent}</Text>
              <Text style={styles.perMonth}>per month</Text>
            </View>
          </View>

          {/* PROPERTY AMENITIES */}
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

  /* ================= PROPERTY SECTION ================= */
  const renderPropertySection = ({ item: property }) => {
    if (!property.rateCard?.length) return null;

    return (
      <View style={styles.propertySection}>
        <Text style={styles.propertyTitle}>{property.name}</Text>

        {property.rateCard.map((room) => (
          <View key={room.id}>
            {renderRoomCard({ room, property })}
          </View>
        ))}
      </View>
    );
  };

  /* ================= FILTER HEADER ================= */
  const FilterHeader = () => (
    <View style={filterStyles.filterContainer}>
      {/* Price + Room Type Row */}
      <View style={filterStyles.filterRow}>
        <TouchableOpacity
          style={filterStyles.filterInput}
          onPress={() => {
            setPriceOpen(!priceOpen);
            setRoomTypeOpen(false);
          }}
        >
          <Text style={filterStyles.filterText}>
            {selectedPrice ? `Under ₹${selectedPrice}` : "Price"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#616161" />
        </TouchableOpacity>

        <TouchableOpacity
          style={filterStyles.filterInput}
          onPress={() => {
            setRoomTypeOpen(!roomTypeOpen);
            setPriceOpen(false);
          }}
        >
          <Text style={filterStyles.filterText}>
            {selectedRoomType || "Room Type"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#616161" />
        </TouchableOpacity>
      </View>

      {/* Price Dropdown */}
      {priceOpen && (
        <View style={filterStyles.listContainer}>
          {priceOptions.map((p) => (
            <TouchableOpacity
              key={p}
              style={filterStyles.listItem}
              onPress={() => {
                setSelectedPrice(p);
                setPriceOpen(false);
              }}
            >
              <Text style={filterStyles.listText}>Under ₹{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Room Type Dropdown */}
      {roomTypeOpen && (
        <View style={filterStyles.listContainer}>
          {roomTypeOptions.map((t) => (
            <TouchableOpacity
              key={t}
              style={filterStyles.listItem}
              onPress={() => {
                setSelectedRoomType(t);
                setRoomTypeOpen(false);
              }}
            >
              <Text style={filterStyles.listText}>{t} Sharing</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Location Input
      <TouchableOpacity style={filterStyles.locationInput}>
        <Ionicons name="location-outline" size={18} color="#616161" />
        <TextInput
          placeholder="Location"
          placeholderTextColor="#888"
          value={location}
          onChangeText={setLocation}
          style={filterStyles.locationTextInput}
        />
      </TouchableOpacity> */}

      {/* Clear + Apply Buttons */}
      <View style={filterStyles.buttonRow}>
        <TouchableOpacity
          style={filterStyles.clearButton}
          onPress={clearFilters}
        >
          <Text style={filterStyles.clearText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={filterStyles.applyButton}
          onPress={applyFilters}
        >
          <Text style={filterStyles.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <HeaderGradient title="Premium Spaces" />

      <FlatList
        data={loading ? [] : filteredList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPropertySection}
        ListHeaderComponent={<FilterHeader />}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator size="large" />
            ) : (
              <Text>No properties found</Text>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
};

export default BrowsePropertiesScreen;

/* ================= MAIN STYLES (UNCHANGED) ================= */
const styles = StyleSheet.create({
  propertySection: {
    marginBottom: 10,
  },
  propertyTitle: {
    marginLeft: 16,
    marginBottom: 10,
    fontSize: 20,
    fontFamily:'Quicksand-Bold',
    color: "#4B3426",
  },

 card: {
  backgroundColor: "#EFE8E2",
  marginHorizontal: 16,
  marginBottom: 18,
  borderRadius: 20,
  overflow: "hidden",
  elevation: 4,
},

  image: {
    width: "100%",
    height: 240,
  },

  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between",
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  roomName: {
    fontSize: 18,
    fontFamily:'Quicksand-Bold',
    color: "#3E3E3E",
  },

  address: {
    marginTop: 4,
    fontSize: 13,
    color: "#6F6F6F",
    fontFamily:'Quicksand-Regular'
  },

  priceBox: {
    alignItems: "flex-end",
  },

  price: {
    fontSize: 20,
    fontFamily:'Quicksand-Bold',
    color: "#F2A85B",
  },

  perMonth: {
    fontSize: 12,
    color: "#6F6F6F",
    fontFamily:'Quicksand-Regular'
  },

  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
    fontFamily:'Quicksand-Medium',
    color: "#4B3426",
  },

  empty: {
    alignItems: "center",
    marginTop: 80,
  },
});

/* ================= FILTER STYLES - NOW EXACT SAME AS EVENTS SCREEN ================= */
const filterStyles = StyleSheet.create({
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
    fontFamily: "Quicksand-Regular",
  },

  filterText: {
    fontSize: 14,
    color: "#616161",
    fontFamily: "Quicksand-Regular",
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

  listText: {
    fontSize: 14,
    color: "#616161",
    fontFamily: "Quicksand-Regular",
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
  },

  locationTextInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#616161",
    fontFamily: "Quicksand-Regular",
  },

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
    fontFamily: "Quicksand-Bold",
  },

  applyButton: {
    flex: 1,
    backgroundColor: colors.nOrange,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  applyText: {
    color: "#FFF",
    fontSize: 19,
    fontFamily: "Quicksand-Bold",
  },
});