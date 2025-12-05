import React, { useState, useEffect, useCallback } from "react";
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
import HeaderGradient from "../components/HeaderGradient";

const baseURL = "https://staging.cocoliving.in";

const BrowsePropertiesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const token = user?.token;

  const [properties, setProperties] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageIndex, setImageIndex] = useState({});

  // Filter states
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [location, setLocation] = useState("");

  // Dropdown toggles
  const [roomTypeOpen, setRoomTypeOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);

  // Dropdown options
  const priceOptions = ["5000", "10000", "15000", "20000", "25000"];
  const roomTypeOptions = [
    "Single sharing",
    "Double sharing",
    "Triple sharing",
    "Four sharing",
  ];

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/api/property/getAll`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response?.data?.properties?.map((p) => ({
        ...p,
        rateCard:
          p.rateCard?.map((rc) => ({
            ...rc,
            propertyId: p.id,
            rateCardId: rc.id,
            images: rc.roomImages,
            roomAmenities: rc.roomAmenities,
            rent: rc.rent,
          })) || [],
      }));

      setProperties(data);
      setFilteredList(data);
    } catch {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load properties",
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Apply filters function
  const applyFilters = () => {
    let filteredProperties = properties.filter((p) =>
      !location || p.address?.toLowerCase().includes(location.toLowerCase())
    );

    const filteredWithRooms = filteredProperties
      .map((p) => ({
        ...p,
        rateCard: p.rateCard.filter((r) => {
          const typeMatch =
            !selectedRoomType ||
            r.roomType.toLowerCase().trim() === selectedRoomType.toLowerCase().trim();
          const priceMatch =
            !selectedPrice || Number(r.rent) <= Number(selectedPrice);
          return typeMatch && priceMatch;
        }),
      }))
      .filter((p) => p.rateCard.length > 0);

    setFilteredList(filteredWithRooms);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedPrice(null);
    setSelectedRoomType(null);
    setLocation("");
    setFilteredList(properties);
    setPriceOpen(false);
    setRoomTypeOpen(false);
  };

  // Render each room card
  const renderRoomCard = ({ room, property }) => {
    const images = room.images || [];
    const idx = imageIndex[`${room.propertyId}-${room.rateCardId}`] || 0;
    const imgUrl =
      images.length > 0
        ? `${baseURL}${images[idx]}`
        : "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400";

    return (
      <TouchableOpacity
        style={roomCard.card}
        onPress={() => navigation.navigate("RoomDetails", { room, property })}
        activeOpacity={0.8}
      >
        <View style={roomCard.imageBox}>
          <Image source={{ uri: imgUrl }} style={roomCard.image} />
          <TouchableOpacity style={roomCard.detailsBtn}>
            <Text style={roomCard.detailsText}>Details</Text>
            <Ionicons name="chevron-forward" size={15} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={roomCard.bottom}>
          <Text style={roomCard.title}>{room.roomType}</Text>
          <View style={roomCard.rightBlock}>
            <View style={roomCard.iconRow}>
              <Ionicons name="wifi" size={18} color="#5C4636" />
              <Ionicons name="car" size={18} color="#5C4636" />
              <Ionicons name="restaurant" size={18} color="#5C4636" />
            </View>
            <Text style={roomCard.price}>₹{room.rent}/month</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render property block
  const renderPropertySection = ({ item: property }) => {
    if (!property.rateCard?.length) return null;

    return (
      <View style={propertySectionStyles.propertySection}>
        <View style={propertySectionStyles.propertyHeader}>
          <Text style={propertySectionStyles.propertyTitle}>{property.name}</Text>
          {property.address && (
            <Text style={propertySectionStyles.propertyAddress} numberOfLines={1}>
              {property.address}
            </Text>
          )}
        </View>

        <FlatList
          data={property.rateCard}
          keyExtractor={(room) => room.rateCardId.toString()}
          renderItem={({ item }) => renderRoomCard({ room: item, property })}
          contentContainerStyle={propertySectionStyles.roomsContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderGradient title="Connect, Learn, Celebrate! join Your Community"  />

      {/* -------- FILTER BLOCK -------- */}
      <View style={filterStyles.filterWrapper}>
        <View style={filterStyles.container}>
          {/* First Row */}
          <View style={filterStyles.row}>
            {/* Price filter */}
            <TouchableOpacity
              style={filterStyles.dropDown}
              onPress={() => {
                setPriceOpen(!priceOpen);
                setRoomTypeOpen(false);
              }}
            >
              <Text style={filterStyles.dropText}>
                {selectedPrice ? `₹${selectedPrice}` : "Price range"}
              </Text>
              <Ionicons 
                name={priceOpen ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#5C4636" 
              />
            </TouchableOpacity>

            {/* Room type filter */}
            <TouchableOpacity
              style={filterStyles.dropDown}
              onPress={() => {
                setRoomTypeOpen(!roomTypeOpen);
                setPriceOpen(false);
              }}
            >
              <Text style={filterStyles.dropText}>
                {selectedRoomType ? selectedRoomType : "Room type"}
              </Text>
              <Ionicons 
                name={roomTypeOpen ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#5C4636" 
              />
            </TouchableOpacity>
          </View>

          {/* Price Options */}
          {priceOpen && (
            <View style={filterStyles.optionsBox}>
              {priceOptions.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    filterStyles.optionItem,
                    idx === priceOptions.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => {
                    setSelectedPrice(opt);
                    setPriceOpen(false);
                  }}
                >
                  <Text style={filterStyles.optionText}>₹{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Room Type Options */}
          {roomTypeOpen && (
            <View style={filterStyles.optionsBox}>
              {roomTypeOptions.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    filterStyles.optionItem,
                    idx === roomTypeOptions.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => {
                    setSelectedRoomType(opt);
                    setRoomTypeOpen(false);
                  }}
                >
                  <Text style={filterStyles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Location */}
          <View style={filterStyles.locationBox}>
            <Ionicons name="location" size={18} color="#5C4636" />
            <TextInput
              placeholder="Enter location"
              value={location}
              onChangeText={setLocation}
              style={filterStyles.locationInput}
            />
          </View>

          {/* Buttons Row */}
          <View style={filterStyles.buttonsRow}>
            <TouchableOpacity 
              style={[filterStyles.applyBtn, filterStyles.btn]} 
              onPress={applyFilters}
            >
              <Text style={filterStyles.btnText}>Apply Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[filterStyles.clearBtn, filterStyles.btn]} 
              onPress={clearFilters}
            >
              <Text style={filterStyles.btnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
        </View>
      ) : (
        <FlatList
          style={styles.flatList}
          data={filteredList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPropertySection}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
        />
      )}
    </View>
  );
};

export default BrowsePropertiesScreen;

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 14,
    height: 42,
    marginTop: 8,
    marginHorizontal: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },
});

const propertySectionStyles = StyleSheet.create({
  propertySection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 4,
  },
  propertyHeader: {
    padding: 14,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  propertyTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.primary,
  },
  propertyAddress: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  roomsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});

const roomCard = StyleSheet.create({
  card: {
    width: '100%',
    height: 210,
    backgroundColor: "#FFF7EC",
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: "center",
    overflow: "hidden",
    borderWidth: 1.2,
    borderColor: "#E2D6C4",
  },
  imageBox: {
    width: "100%",
    height: 135,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  detailsBtn: {
    position: "absolute",
    bottom: 8,
    left: 10,
    backgroundColor: "#5C4636",
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailsText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  bottom: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "700", color: "#3C2A1E" },
  rightBlock: { alignItems: "flex-end" },
  iconRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  price: { fontSize: 17, fontWeight: "900", color: "#3C2A1E" },
});

const filterStyles = StyleSheet.create({
  filterWrapper: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 14,
    elevation: 4,
  },
  container: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  dropDown: {
    flex: 1,
    height: 44,
    borderRadius: 28,
    paddingHorizontal: 16,
    backgroundColor: "#F4EDE5",
    borderWidth: 1.3,
    borderColor: "#D5C3AC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropText: {
    fontSize: 14,
    color: "#5C4636",
    fontWeight: "500",
  },
  optionsBox: {
    backgroundColor: "#F4EDE5",
    borderRadius: 12,
    paddingVertical: 8,
    maxHeight: 150,
  },
  optionItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#D5C3AC",
  },
  optionText: {
    fontSize: 14,
    color: "#5C4636",
    fontWeight: "500",
  },
  locationBox: {
    height: 44,
    borderRadius: 28,
    backgroundColor: "#F4EDE5",
    borderWidth: 1.3,
    borderColor: "#D5C3AC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    color: "#5C4636",
    paddingVertical: 0,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtn: {
    backgroundColor: "#5C4636",
  },
  clearBtn: {
    backgroundColor: "#D5C3AC",
  },
  btnText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
});