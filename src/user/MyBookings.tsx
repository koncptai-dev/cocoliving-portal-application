import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Feather'; // npm i react-native-vector-icons
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext'; // adjust path
import colors from '../constants/color';

const API_BASE_URL='https://staging.cocoliving.in'

const MyBookings = () => {
  const { user } = useAuth();
  const token = user?.token;
  const navigation = useNavigation();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [BookingPages, setBookingPages] = useState(1);
  const [BookingTotalPages, setBookingTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async (page = 1, limit = 3) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/book-room/getUserBookings?page=${page}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Response of My Bookings: ",MyBookings);
      const { bookings: BookingData = [], totalPages = 1 } = response.data;

      setBookings(BookingData);
      setBookingPages(page);
      setBookingTotalPages(totalPages || 1);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch bookings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await axios.put(
                `${API_BASE_URL}/api/book-room/bookings/${bookingId}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Success', 'Booking cancelled successfully');
              fetchBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const renderBookingCard = ({ item }) => {
    const booking = item;
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {booking.room?.property?.name} - Room {booking.room?.roomNumber}
            </Text>
            <View style={styles.locationRow}>
              <Icon name="map-pin" size={14} color="#777" />
              <Text style={styles.locationText}>
                {booking.room?.property?.address}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.badge,
              booking.displayStatus?.toLowerCase() === 'active'
                ? styles.badgeActive
                : booking.displayStatus?.toLowerCase() === 'upcoming'
                ? styles.badgeUpcoming
                : styles.badgeOutline,
            ]}
          >
            <Text style={styles.badgeText}>
              {booking.displayStatus
                ? booking.displayStatus.charAt(0).toUpperCase() +
                  booking.displayStatus.slice(1)
                : ''}
            </Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Icon name="calendar" size={16} color="#555" />
            <View>
              <Text style={styles.detailLabel}>Start Date</Text>
              <Text style={styles.detailValue}>{booking.checkInDate}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Icon name="clock" size={16} color="#555" />
            <View>
              <Text style={styles.detailLabel}>End Date</Text>
              <Text style={styles.detailValue}>{booking.checkOutDate}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Icon name="users" size={16} color="#555" />
            <View>
              <Text style={styles.detailLabel}>Room Type</Text>
              <Text style={styles.detailValue}>{booking.room?.roomType}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Icon name="credit-card" size={16} color="#555" />
            <View>
              <Text style={styles.detailLabel}>Monthly Rent</Text>
              <Text style={styles.detailValue}>₹{booking.room?.monthlyRent}</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            onPress={() => {
              setSelectedBooking(booking);
              setModalVisible(true);
            }}
          >
            <Text style={styles.buttonText}>View Details</Text>
          </TouchableOpacity>

          {booking.displayStatus === 'upcoming' && (
            <TouchableOpacity
              style={[styles.button, styles.destructiveButton]}
              onPress={() => handleCancelBooking(booking.id)}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>
                Cancel Booking
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Bookings</Text>

      {bookings.length === 0 ? (
        <Text>No Bookings Found.</Text>
      ) : (
        <>
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderBookingCard}
            contentContainerStyle={{ paddingBottom: 40 }}
          />

          <View style={styles.pagination}>
            <TouchableOpacity
              disabled={BookingPages === 1}
              onPress={() => fetchBookings(BookingPages - 1)}
            >
              <Text
                style={[
                  styles.pageButton,
                  BookingPages === 1 && { opacity: 0.5 },
                ]}
              >
                Prev
              </Text>
            </TouchableOpacity>

            <Text>
              Page {BookingPages} of {BookingTotalPages}
            </Text>

            <TouchableOpacity
              disabled={BookingPages === BookingTotalPages}
              onPress={() => fetchBookings(BookingPages + 1)}
            >
              <Text
                style={[
                  styles.pageButton,
                  BookingPages === BookingTotalPages && { opacity: 0.5 },
                ]}
              >
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Booking Details Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Booking Details</Text>

              <View style={styles.modalGrid}>
                <Text>Property: {selectedBooking?.room?.property?.name}</Text>
                <Text>Room No: {selectedBooking?.room?.roomNumber}</Text>
                <Text>Check-in: {selectedBooking?.checkInDate}</Text>
                <Text>Check-out: {selectedBooking?.checkOutDate}</Text>
                <Text>Room Type: {selectedBooking?.room?.roomType}</Text>
                <Text>Monthly Rent: ₹{selectedBooking?.room?.monthlyRent}</Text>
                <Text>Duration: {selectedBooking?.duration} Months</Text>
                <Text>Address: {selectedBooking?.room?.property?.address}</Text>
              </View>

              <TouchableOpacity
                style={[styles.button, styles.outlineButton, { marginTop: 20 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MyBookings;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.backgroundMain },
  heading: { fontSize: 26, fontWeight: 'bold', marginBottom: 16 },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { color: '#666', marginLeft: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 12, color: '#fff' },
  badgeActive: { backgroundColor: '#4CAF50' },
  badgeUpcoming: { backgroundColor: colors.textDark },
  badgeOutline: { backgroundColor: '#9E9E9E' },
  detailGrid: { marginVertical: 10 },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  detailLabel: { fontSize: 12, color: '#333' },
  detailValue: { fontSize: 13, color: '#777' },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  button: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#333',
  },
  destructiveButton: {
    backgroundColor: '#E53935',
  },
  buttonText: { fontWeight: '600' },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  pageButton: { color: '#000', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  modalGrid: { gap: 6 },
});
