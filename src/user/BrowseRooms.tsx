import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import axios from 'axios';
import Modal from 'react-native-modal';
import Toast from 'react-native-toast-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import colors from '../constants/color';
import { useAuth } from '../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import jwt_decode from 'jwt-decode' // ✅ Added for token decode logging

// =================================================================
// TOAST HOOK (outside component)
// =================================================================
const useToast = () => {
  const toast = useCallback(({ title, description, variant = 'info' }) => {
    const type = variant === 'destructive' ? 'error' : variant === 'success' ? 'success' : 'info';
    Toast.show({
      type,
      text1: title,
      text2: description,
      visibilityTime: 4000,
    });
  }, []);

  return { toast };
};

const baseURL = 'https://staging.cocoliving.in';

// =================================================================
// Helper Components
// =================================================================

const Card = ({ children, style, onPress }) => (
  <TouchableOpacity onPress={onPress} disabled={!onPress} style={[styles.card, style]}>
    {children}
  </TouchableOpacity>
);

const Badge = ({ children, style, variant = 'default' }) => {
  let badgeStyle = styles.badge;
  if (variant === 'secondary') badgeStyle = styles.badgeSecondary;
  
  const finalStyle = [badgeStyle, style];

  return (
    <View style={finalStyle}>
      <Text style={[styles.badgeText, { color: colors.textDark }]}>{children}</Text>
    </View>
  );
};

const RNButton = ({ children, onPress, disabled, variant = 'primary', style }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.button,
      variant === 'outline' && styles.buttonOutline,
      disabled && styles.buttonDisabled,
      style,
    ]}
  >
    {typeof children === 'string' ? (
        <Text style={[styles.buttonText, variant === 'outline' && styles.buttonOutlineText]}>{children}</Text>
    ) : (
        children
    )}
  </TouchableOpacity>
);

// =================================================================
// Main Component: BrowseRooms
// =================================================================

const BrowseRooms = () => {
  // =================================================================
  // ALL useStates (unconditional, at top)
  // =================================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [favorites, setFavorites] = useState({});
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cardImageIndex, setCardImageIndex] = useState({});
  const [checkInDate, setCheckInDate] = useState('');
  const [duration, setDuration] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [properties, setProperties] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  // =================================================================
  // ALL custom hooks (unconditional, after useStates)
  // =================================================================
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const token = user?.token;
  

  // =================================================================
  // ALL useCallbacks (after custom hooks)
  // =================================================================
  const getImageUrl = useCallback((path) => {
    if (!path) {
        return `https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=250&fit=crop`;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseURL}${cleanPath}`;
  }, []);

  const onDateChange = useCallback((event, selectedDate) => {
    const currentDate = selectedDate || tempDate;
    setShowDatePicker(Platform.OS === 'ios');
    setTempDate(currentDate);
    setCheckInDate(currentDate.toISOString().split('T')[0]);
  }, [tempDate]);

  const showDatepicker = useCallback(() => {
    setShowDatePicker(true);
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseURL}/api/rooms/getall`);
      setRooms(res.data.rooms || []);
      console.log("rooms wala data: ", res.data.rooms); // Fixed: Log res.data, not rooms
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load rooms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchProperties = useCallback(async () => {
    if (!token) {
      console.log("No token, skipping properties fetch");
      toast({ title: "Auth Required", description: "Please log in to view properties.", variant: "destructive" });
      return;
    }
    try {
      console.log("response of property karne se pehle");
      const response = await axios.get(`${baseURL}/api/property/getall`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("response properties ka : ", response);

      // Fixed: Check if data is array
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error(`Invalid response: Expected array, got ${typeof response.data}`);
      }

      const data = response.data.map((p) => ({
        ...p,
        amenities: typeof p.amenities === "string" ? p.amenities.split(",").map((a) => a.trim()) : p.amenities,
      }));
      setProperties(data);
    } catch (error) {
      console.error("Error fetching properties:", error);
      const status = error.response?.status;
      if (status === 401) {
        toast({ 
          title: "Session Expired", 
          description: "Please log in again.", 
          variant: "destructive" 
        });
        // Optional: Trigger logout (requires useAuth again, but since it's hook, call from context if needed)
      } else {
        toast({ title: "Error", description: "Failed to fetch properties", variant: "destructive" });
      }
    }
  }, [token, toast]);

  // =================================================================
  // ALL useMemos (after useCallbacks)
  // =================================================================
  const processedRooms = useMemo(() => rooms.map(room => ({
    ...room,
    property: room.property || { name: 'Unknown Property', address: '' },
    amenities: Array.isArray(room.amenities) ? room.amenities : [],
    images: Array.isArray(room.images) ? room.images : [],
  })), [rooms]);

  const uniqueRoomTypes = useMemo(() => Array.from(new Set(properties.flatMap(p => p.rateCard?.map((rc) => rc.roomType) || [])))
    .filter(Boolean).sort(), [properties]);

  const priceFilters = [
    { label: 'All Prices', value: 'all' },
    { label: 'Under ₹700', value: 'under-700' },
    { label: '₹700 - ₹900', value: '700-900' },
    { label: '₹900 - ₹1200', value: '900-1200' },
    { label: 'Above ₹1200', value: 'above-1200' },
  ];

  const filteredRooms = useMemo(() => processedRooms.filter(room => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = room.roomNumber.toString().includes(term) ||
      (room.description && room.description.toLowerCase().includes(term)) ||
      (room.property.name && room.property.name.toLowerCase().includes(term)) ||
      (room.property.address && room.property.address.toLowerCase().includes(term));
    const matchesType = selectedType === 'all' || room.roomType === selectedType;
    const matchesPrice = priceRange === 'all' ||
      (priceRange === 'under-700' && room.monthlyRent < 700) ||
      (priceRange === '700-900' && room.monthlyRent >= 700 && room.monthlyRent <= 900) ||
      (priceRange === '900-1200' && room.monthlyRent > 900 && room.monthlyRent <= 1200) ||
      (priceRange === 'above-1200' && room.monthlyRent > 1200);

    return matchesSearch && matchesType && matchesPrice;
  }), [processedRooms, searchTerm, selectedType, priceRange]);

  // =================================================================
  // useEffects (after useMemos)
  // =================================================================
  useEffect(() => {
    console.log("token fetch kar rhe h: ", token ? token.substring(0, 20) + '...' : 'No token'); // ✅ Safe token preview log
  }, [token]);

  useEffect(() => {
    fetchRooms();
    fetchProperties();
  }, [fetchRooms, fetchProperties]); // Fixed: Depend on callbacks to avoid stale closures

  // =================================================================
  // Handlers (regular functions, after hooks)
  // =================================================================
  const toggleFavorite = (roomId) => {
    setFavorites(prev => ({
        ...prev,
        [roomId]: !prev[roomId]
    }));
  };

  const handleViewRoom = (room) => {
    setSelectedRoom(room);
    setCurrentImageIndex(0);
    setShowRoomDetails(true);
  };

  const handleBookRoom = (room) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a room.",
        variant: "destructive",
      });
      return;
    }
    setSelectedRoom(room);
    setShowBookingModal(true);
    setCheckInDate('');
    setTempDate(new Date());
    setDuration('');
    setBookingNotes('');
    setShowDatePicker(false);
  };

// Inside your BrowseRooms component
const submitBooking = async () => {
  if (!user || !token || !selectedRoom || !checkInDate || !duration) {
    toast({
      title: "Missing Information",
      description: "Please fill in the check-in date and duration.",
      variant: "destructive",
    });
    return;
  }

  setIsBooking(true);
  try {
    // ✅ Token logging first (as requested)
    console.log('Token being sent to backend:', token ? token.substring(0, 50) + '...' : 'No token found'); // Safe preview (first 50 chars)
    console.log('Full token length:', token ? token.length : 0); // Expected ~300-500 chars

    // ✅ Optional: Decode for claims (non-verifying) - Using correct import name
    try {
      const decoded = jwt_decode(token); // Use jwt_decode (with underscore)
      console.log('Decoded Token Claims (frontend):', {
        id: decoded.id,
        role: decoded.role,
        iat: new Date(decoded.iat * 1000).toLocaleString(),
        exp: new Date(decoded.exp * 1000).toLocaleString(),
        isExpired: Date.now() > decoded.exp * 1000,
      });
    } catch (decodeErr) {
      console.error('Token decode failed (frontend):', decodeErr);
    }

    // ✅ Payload aligned with backend: Only roomId, checkInDate, duration
    const bookingData = {
      roomId: Number(selectedRoom.id), // Ensure it's a number
      checkInDate: checkInDate, // YYYY-MM-DD - Sent as is, backend will parse
      duration: Number(duration), // Ensure it's a number (e.g., 3, 6, 12)
      // notes: bookingNotes || undefined, // Backend doesn't seem to expect 'notes' based on provided code
    };

    console.log('Frontend Booking Payload (aligned with backend):', bookingData); // For debug

    const response = await axios.post(`${baseURL}/api/book-room/add`, bookingData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Booking Success Response:', response.data);

    toast({
      title: "Booking Submitted",
      description: "Your booking has been created successfully!", // Matches backend message
      variant: "success",
    });

    // Reset form
    setShowBookingModal(false);
    setSelectedRoom(null);
    setCheckInDate('');
    setDuration('');
    setBookingNotes(''); // Reset notes as well if the field exists
    fetchRooms(); // Refresh rooms list

  } catch (error) {
    // Enhanced error logging
    console.error('Full Booking Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: error.config, // Log request details (be careful with sensitive data)
    });

    let errorMessage = "An error occurred while submitting your booking.";
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const serverMessage = error.response.data?.message || "Server Error";
      errorMessage = `Server Error (${status}): ${serverMessage}`;
      if (status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (status === 400) {
        errorMessage = `Bad Request: ${serverMessage}`;
      } else if (status === 404) {
        errorMessage = `Not Found: ${serverMessage}`;
      } else if (status === 500) {
        errorMessage = `Internal Server Error: ${serverMessage}`;
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
      errorMessage = "No response from the server. Please check your connection.";
    } else {
      // Something else happened
      console.error('Request setup error:', error.message);
      errorMessage = `Request setup error: ${error.message}`;
    }

    toast({
      title: "Booking Failed",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsBooking(false);
  }
};

  const nextCardImage = (roomId, totalImages) => {
    setCardImageIndex(prev => ({
      ...prev,
      [roomId]: (prev[roomId] === undefined || prev[roomId] === totalImages - 1)
        ? 0
        : prev[roomId] + 1
    }));
  };

  const prevCardImage = (roomId, totalImages) => {
    setCardImageIndex(prev => ({
      ...prev,
      [roomId]: (prev[roomId] === undefined || prev[roomId] === 0)
        ? totalImages - 1
        : prev[roomId] - 1
    }));
  };

  // =================================================================
  // Renderer Components (functions, after handlers)
  // =================================================================
  const renderRoomCard = ({ item: room }) => {
    const totalImages = room.images?.length || 0;
    const currentCardImgIndex = cardImageIndex[room.id] || 0;
    
    const imageUrl = getImageUrl(room.images[currentCardImgIndex]);

    const occupiedSeats = Number(room.occupancy.split('/')[0]);

    const capacity = room.capacity;

    const isAvailable = room.status === "available" && occupiedSeats < capacity;
    const isFavorite = favorites[room.id] === true;

    return (
      

      <Card style={styles.roomCard} onPress={() => handleViewRoom(room)}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.cardImage} 
            resizeMode="cover"
            onError={(e) => console.log(`Image Load Error for Room ${room.roomNumber}:`, e.nativeEvent.error)}
          />

          {/* Image Navigation */}
          {totalImages > 1 && (
            <>
              <TouchableOpacity
                style={[styles.imageNavButton, styles.imageNavLeft]}
                onPress={() => prevCardImage(room.id, totalImages)}
              >
                <Ionicons name="chevron-back" size={20} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.imageNavButton, styles.imageNavRight]}
                onPress={() => nextCardImage(room.id, totalImages)}
              >
                <Ionicons name="chevron-forward" size={20} color="#333" />
              </TouchableOpacity>
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>{currentCardImgIndex + 1} / {totalImages}</Text>
              </View>
            </>
          )}

          {/* Favorite Button */}
          <TouchableOpacity
            style={[styles.favButton, { backgroundColor: isFavorite ? '#FFEBEE' : 'rgba(255,255,255,0.7)' }]}
            onPress={() => toggleFavorite(room.id)}
          >
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? '#F44336' : '#757575'} />
          </TouchableOpacity>
          
          {/* Status Badge */}
          <Badge
            style={[styles.cardStatusBadge, { backgroundColor: isAvailable ? '#4CAF50' : colors.buttonInput }]}
          >
            {isAvailable ? 'Available' : 'Occupied'}
          </Badge>
        </View>

        {/* Content Section */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.roomTitle} numberOfLines={1}>Room {room.roomNumber}</Text>
            <Badge variant="outline">{room.roomType}</Badge>
          </View>

          {room.property && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color="#757575" />
              <Text style={styles.cardAddress} numberOfLines={1}>{room.property.name}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-group-outline" size={14} color="#757575" />
            <Text style={styles.cardOccupancy}>
              {room.occupancy} occupied {room.floorNumber && `• Floor ${room.floorNumber}`}
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.cardDescription} numberOfLines={2}>
            {room.description || 'No description available.'}
          </Text>
          
          {/* Amenities */}
          {room.amenities.length > 0 && (
            <View style={styles.amenitiesContainer}>
                {room.amenities.slice(0, 3).map((amenity, index) => (
                    <Badge key={`${room.id}-amenity-${index}`} variant="secondary" style={{marginRight: 4, marginBottom: 4}}>
                        {amenity}
                    </Badge>
                ))}
                {room.amenities.length > 3 && (
                    <Badge variant="secondary" style={styles.amenitiesMoreBadge}>
                        <Text style={styles.badgeText}>+{room.amenities.length - 3} more</Text>
                    </Badge>
                )}
            </View>
          )}

          {/* Price & Actions */}
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.cardPrice}>₹{room.monthlyRent}</Text>
              <Text style={styles.cardPriceSubText}>/month</Text>
              <Text style={styles.cardPriceSubText}>Deposit: ₹{room.depositAmount}</Text>
            </View>
            <View style={styles.actionButtons}>
              <RNButton variant="outline" onPress={() => handleViewRoom(room)} style={{ marginRight: 8, height: 36 }}>
                <MaterialCommunityIcons name="eye-outline" size={18} color="#007BFF" />
              </RNButton>
              <RNButton
                onPress={() => handleBookRoom(room)}
                disabled={!isAvailable}
                style={{ height: 36 }}
              >
                <MaterialCommunityIcons name="calendar-check-outline" size={18} color="#fff" />
              </RNButton>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderRoomDetailsModal = () => {
    if (!selectedRoom) return null;

    const totalImages = selectedRoom.images?.length || 0;
    const imageUrl = getImageUrl(selectedRoom.images[currentImageIndex]);
      
    const isAvailable = selectedRoom.status === "available" && selectedRoom.occupancy < selectedRoom.capacity;
    
    return (
      <Modal
        isVisible={showRoomDetails}
        onBackdropPress={() => setShowRoomDetails(false)}
        style={styles.modal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            
            {/* Header */}
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Room {selectedRoom.roomNumber} Details</Text>
                <Badge variant="secondary">{selectedRoom.roomType}</Badge>
            </View>

            {/* Image Gallery */}
            <View style={styles.modalImageContainer}>
                <Image source={{ uri: imageUrl }} style={styles.modalImage} resizeMode="cover" />
                {totalImages > 1 && (
                    <>
                        <TouchableOpacity
                            style={[styles.imageNavButton, styles.imageNavLeft, {left: 10}]}
                            onPress={() => setCurrentImageIndex(prev => prev === 0 ? totalImages - 1 : prev - 1)}
                        >
                            <Ionicons name="chevron-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.imageNavButton, styles.imageNavRight, {right: 10}]}
                            onPress={() => setCurrentImageIndex(prev => prev === totalImages - 1 ? 0 : prev + 1)}
                        >
                            <Ionicons name="chevron-forward" size={24} color="#333" />
                        </TouchableOpacity>
                        <View style={styles.modalImageCounter}>
                            <Text style={styles.imageCounterText}>{currentImageIndex + 1} / {totalImages}</Text>
                        </View>
                    </>
                )}
            </View>

            <View style={styles.modalBody}>
                {/* Property & Room Info */}
                <Text style={styles.sectionTitle}>Room Information</Text>
                <View style={styles.detailGrid}>
                    {selectedRoom.property && (
                        <>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Property:</Text>
                            <Text style={styles.detailValue}>{selectedRoom.property.name}</Text>
                        </View>
                        {selectedRoom.property.address && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Address:</Text>
                                <Text style={styles.detailValueSmall}>{selectedRoom.property.address}</Text>
                            </View>
                        )}
                         <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Room Number:</Text>
                            <Text style={styles.detailValue}>{selectedRoom.roomNumber}</Text>
                        </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Room Type:</Text>
                            <Text style={styles.detailValue}>{selectedRoom.roomType}</Text>
                        </View>
                        </>
                    )}
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Capacity:</Text>
                        <Text style={styles.detailValue}>{selectedRoom.capacity} person(s)</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Current Occupancy:</Text>
                        <Text style={styles.detailValue}>{selectedRoom.occupancy}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Availability:</Text>
                        <Badge style={{backgroundColor: isAvailable ? '#E8F5E9' : '#FFEBEE' }}>
                            {selectedRoom.status === "available" ? 'Available' : 'Occupied'}
                        </Badge>
                    </View>
                     <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Preferred For:</Text>
                        <Text style={styles.detailValue}>{selectedRoom.preferredUserType}</Text>
                    </View>
                </View>

                {/* Pricing */}
                <Text style={[styles.sectionTitle, {marginTop: 20}]}>Pricing</Text>
                <View style={styles.pricingContainer}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Monthly Rent:</Text>
                        <Text style={styles.priceHighlight}>₹{selectedRoom.monthlyRent}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Security Deposit:</Text>
                        <Text style={styles.detailValue}>₹{selectedRoom.depositAmount}</Text>
                    </View>
                </View>

                {/* Description */}
                <Text style={[styles.sectionTitle, {marginTop: 20}]}>Description</Text>
                <Text style={styles.descriptionText}>
                    {selectedRoom.description || 'No description available.'}
                </Text>

                {/* Amenities */}
                {selectedRoom.amenities.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, {marginTop: 20}]}>Amenities</Text>
                        <View style={styles.amenitiesContainerModal}>
                            {selectedRoom.amenities.map((amenity, index) => (
                                <Badge key={index} variant="secondary" style={{marginRight: 6, marginBottom: 6}}>
                                    {amenity}
                                </Badge>
                            ))}
                        </View>
                    </>
                )}
            </View>

          </ScrollView>

          {/* Action Buttons in Footer */}
          <View style={styles.modalFooter}>
            <RNButton variant="outline" onPress={() => setShowRoomDetails(false)} style={{flex: 1, marginRight: 10}}>
              Close
            </RNButton>
            <RNButton
              onPress={() => {
                setShowRoomDetails(false);
                handleBookRoom(selectedRoom);
              }}
              disabled={!isAvailable}
              style={{flex: 1}}
            >
              <MaterialCommunityIcons name="calendar-check-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Book This Room</Text>
            </RNButton>
          </View>
        </View>
      </Modal>
    );
  };

  const renderBookingModal = () => {
    if (!selectedRoom) return null;

    const totalPayable = (checkInDate && duration)
      ? (selectedRoom.monthlyRent * Number(duration) + selectedRoom.depositAmount)
      : 0;

    const formattedCheckInDate = checkInDate ? new Date(checkInDate).toLocaleDateString('en-IN') : '';

    return (
      <Modal
        isVisible={showBookingModal}
        onBackdropPress={() => setShowBookingModal(false)}
        style={styles.modal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalContentSmall}>
          <Text style={styles.modalTitle}>Book Room {selectedRoom.roomNumber}</Text>

          <View style={styles.bookingSummaryCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Monthly Rent:</Text>
              <Text style={styles.priceHighlightSmall}>₹{selectedRoom.monthlyRent}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Security Deposit:</Text>
              <Text style={styles.detailValue}>₹{selectedRoom.depositAmount}</Text>
            </View>
            <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 10, paddingTop: 10 }]}>
              <Text style={styles.detailLabelBold}>Total Payable (Estimated):</Text>
              <Text style={styles.priceHighlightTotal}>₹{totalPayable}</Text>
            </View>
          </View>

          <ScrollView style={{maxHeight: 300, paddingVertical: 10}}>
            {/* Check-in Date with Date Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Check-in Date *</Text>
              <TouchableOpacity
                style={styles.dateInputContainer}
                onPress={showDatepicker}
                activeOpacity={0.7}
              >
                <Text style={styles.dateInputText}>
                  {formattedCheckInDate || 'Select Check-in Date'}
                </Text>
                <MaterialCommunityIcons name="calendar" size={20} color="#757575" />
              </TouchableOpacity>
              
              {/* Date Picker Component */}
              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={tempDate}
                  mode="date"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Duration Dropdown (Picker) - Same as before */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Duration *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={duration}
                  onValueChange={(itemValue) => setDuration(itemValue)}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label="Select Duration" value="" />
                  <Picker.Item label="3 Months" value="3" />
                  <Picker.Item label="6 Months" value="6" />
                  <Picker.Item label="12 Months" value="12" />
                </Picker>
              </View>
            </View>

            {/* Additional Notes - Same as before */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Additional Notes</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Any special requests or notes for your booking..."
                value={bookingNotes}
                onChangeText={setBookingNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <RNButton onPress={submitBooking} disabled={!checkInDate || !duration || isBooking} style={{marginTop: 20}}>
            {isBooking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit Booking Request</Text>
            )}
          </RNButton>
        </View>
      </Modal>
    );
  };

  // =================================================================
  // CONDITIONAL RENDERS (AFTER ALL HOOKS)
  // =================================================================
  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007BFF" style={{ flex: 1, justifyContent: "center" }} />
        <Text style={{ textAlign: "center", marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 50, fontSize: 18 }}>Please log in to browse rooms.</Text>
        {/* Add login navigation here if needed */}
      </View>
    );
  }

  // =================================================================
  // Main Render (JSX)
  // =================================================================
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header and Filters */}
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Browse Rooms</Text>
          <Text style={styles.subTitle}>Find your perfect co-living space from our curated selection.</Text>
        </View>
        
        <View style={styles.filtersContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#757575" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search rooms or locations..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#757575"
            />
          </View>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedType}
              onValueChange={(itemValue) => setSelectedType(itemValue)}
              style={styles.picker}
              mode="dropdown"
            >
              <Picker.Item label="All Types" value="all" />
              {uniqueRoomTypes.map((type) => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={priceRange}
              onValueChange={(itemValue) => setPriceRange(itemValue)}
              style={styles.picker}
              mode="dropdown"
            >
              {priceFilters.map(filter => (
                <Picker.Item key={filter.value} label={filter.label} value={filter.value} />
              ))}
            </Picker>
          </View>
        </View>
        
        <Text style={styles.resultsInfo}>
          Showing {filteredRooms.length} of {processedRooms.length} available rooms
        </Text>

        {/* Loading State */}
        {loading && (
          <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 50 }} />
        )}

        {/* Rooms Grid (FlatList) */}
        {!loading && filteredRooms.length > 0 && (
          <FlatList
            data={filteredRooms}
            renderItem={renderRoomCard}
            keyExtractor={item => item.id.toString()}
            extraData={{ favorites, cardImageIndex }} 
            numColumns={Platform.OS === 'web' ? 3 : 1} 
            contentContainerStyle={styles.roomsGrid}
            scrollEnabled={false}
          />
        )}
        
        {/* No Results */}
        {!loading && filteredRooms.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-circle-outline" size={60} color="#BDBDBD" />
            <Text style={styles.noResultsTitle}>No rooms found</Text>
            <Text style={styles.noResultsText}>
              Try adjusting your search criteria or filters.
            </Text>
            <RNButton variant="outline" onPress={() => {
              setSearchTerm('');
              setSelectedType('all');
              setPriceRange('all');
            }} style={{ marginTop: 15 }}>
              Clear Filters
            </RNButton>
          </View>
        )}

        {filteredRooms.length > 0 && (
            <View style={{paddingVertical: 30, alignItems: 'center'}}>
                <RNButton variant="outline" style={{width: '60%'}}>
                    <Text style={styles.buttonOutlineText}>Load More Rooms</Text>
                </RNButton>
            </View>
        )}

      </ScrollView>

      {/* Modals */}
      {renderRoomDetailsModal()}
      {renderBookingModal()}
    </View>
  );
};

// =================================================================
// Styles
// =================================================================

const PRIMARY_COLOR = '#007BFF';
const SECONDARY_COLOR = '#FF9800';
const BORDER_COLOR = '#E0E0E0';
const BACKGROUND_COLOR = '#F5F5F5';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.primary,
  },
  subTitle: {
    fontSize: 15,
    color: colors.primary,
  },
  
  // --- Filters ---
  filtersContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.backgroundMain,
    backgroundColor:colors.backgroundMain,
    borderRadius: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    paddingVertical: 0,
    color: colors.primary
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#fff',
    height: 50, 
    justifyContent: 'center',
  },
  picker: {
    color: '#333',
    height: Platform.OS === 'ios' ? 50 : undefined, 
    paddingHorizontal: Platform.OS === 'ios' ? 10 : 0, 
  },
  resultsInfo: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 15,
  },

  // --- Card / Grid ---
  roomsGrid: {
  },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
    backgroundColor: '#eee'
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -15 }],
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 3
  },
  imageNavLeft: { left: 10 },
  imageNavRight: { right: 10 },
  imageCounter: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  imageCounterText: {
    color: colors.primary,
    fontSize: 12,
  },
  favButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    elevation: 3,
  },
  cardStatusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  
  cardContent: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    flexShrink: 1,
    marginRight: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 15,
    color: colors.textDark,
    marginLeft: 5,
    flexShrink: 1,
  },
  cardOccupancy: {
    fontSize: 13,
    color: colors.textDark,
    marginLeft: 5,
  },
  cardDescription: {
    fontSize: 13,
    color: '#616161',
    marginTop: 8,
    marginBottom: 10,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  amenitiesMoreBadge: {
    borderColor: colors.inputBackground,
    borderWidth: 1,
  },
  
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  cardPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.inputBackground,
  },
  cardPriceSubText: {
    fontSize: 14,
    color: colors.textDark,
  },
  actionButtons: {
    flexDirection: 'row',
  },

  // --- Buttons / Badges ---
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 15,
    borderWidth:2,
    borderColor:colors.inputBackground,
  },
  badgeSecondary: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.inputBackground,
    borderRadius:10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textDark,
  },
  button: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 3,
  },
  buttonOutline: {
    backgroundColor: colors.backgroundMain,
    borderWidth: 1,
    borderColor: colors.inputBackground,
    elevation: 0,
  },
  buttonDisabled: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4
  },
  buttonOutlineText: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // --- No Results ---
  noResultsContainer: {
    alignItems: 'center',
    padding: 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
    elevation: 2,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    marginTop: 10,
  },
  noResultsText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 15,
  },

  // --- Modal Styles ---
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: colors.backgroundMain,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingTop: 15,
    height: '90%',
    width: '100%',
    overflow: 'hidden',
  },
  modalContentSmall: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    alignSelf: 'center',
    elevation: 5,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingBottom: 10
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
  },
  modalImageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#eee',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalImageCounter: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  modalBody: {
      paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_COLOR,
    paddingLeft: 8
  },
  detailGrid: {
    paddingHorizontal: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomColor: '#F5F5F5',
  },
  detailLabel: {
    fontSize: 17,
    fontWeight:'500',
    color: colors.primary,
  },
  detailLabelBold: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '600'
  },
  detailValue: {
    fontSize: 17,
    fontWeight: '500',
    color: '#212121',
    textAlign: 'right',
  },
  detailValueSmall: {
    fontSize: 13,
    fontWeight: '500',
    color: '#212121',
    flexShrink: 1,
    maxWidth: '70%',
    textAlign: 'right',
  },
  priceHighlight: {
    fontSize: 22,
    fontWeight: 'bold',
    color: SECONDARY_COLOR,
  },
  descriptionText: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 20,
  },
  amenitiesContainerModal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 10,
    paddingHorizontal: 5
  },
  
  modalFooter: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    backgroundColor: '#fff',
  },

  // --- Booking Modal Specific ---
  bookingSummaryCard: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  pricingContainer: {
    paddingHorizontal: 5,
  },
  priceHighlightSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: SECONDARY_COLOR,
  },
  priceHighlightTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#212121',
  },
  textArea: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#212121',
    textAlignVertical: 'top',
  },
  dateInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderWidth: 1,
  borderColor: BORDER_COLOR,
  borderRadius: 6,
  paddingHorizontal: 12,
  height: 40,
  backgroundColor: '#fff',
},
dateInputText: {
  fontSize: 14,
  color: '#212121',
  flex: 1,
},
});

export default BrowseRooms;