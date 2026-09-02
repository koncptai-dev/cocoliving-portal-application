import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; // Yeh wala use kar rahe
import HeaderGradient from './HeaderGradient';
import colors from '../constants/color';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Config from 'react-native-config';

export const BASE_URL = Config.API_BASE_URL;

const GuestVisit = () => {
  const { user } = useAuth();
  const token = user?.token;
  const navigation = useNavigation();

  const [bookingId, setBookingId] = useState<number | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [visits, setVisits] = useState<any[]>([]);
const [loadingVisits, setLoadingVisits] = useState(true);

  const [form, setForm] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    visitDate: new Date(),
    purpose: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

const isParent = user?.loginAs === "parent";

  // Fetch guest visits history
useEffect(() => {
  if (!token || !bookingId) return;

  const fetchGuestVisits = async () => {
    try {
      setLoadingVisits(true);
      const res = await axios.get(`${BASE_URL}/api/guest-visits/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("response of guest list: ",res)
      setVisits(res.data.visits || []);
    } catch (err: any) {
      console.log('Guest visits fetch error:', err);
   Alert.alert(
  'Failed to Load Guest History',
  err?.response?.data?.message || 'Try again later'
);
 
      // Toast.show({
      //   type: 'error',
      //   text1: 'Failed to load guest history',
      //   text2: err?.response?.data?.message || 'Try again later',
      // });
    } finally {
      setLoadingVisits(false);
    }
  };

  fetchGuestVisits();
}, [token, bookingId]);

  // Fetch active booking ID
  useEffect(() => {
    if (!token) {
      setLoadingBooking(false);
      return;
    }

    const fetchActiveBooking = async () => {
      try {
        setLoadingBooking(true);
        const res = await axios.get(`${BASE_URL}/api/book-room/active-booking`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.bookingId) {
          setBookingId(res.data.bookingId);
        } else {
        Alert.alert(
    'No Active Booking',
    'Guest visit is only available during an active booking.'
  ); 
          // Toast.show({
          //   type: 'error',
          //   text1: 'No Active Booking',
          //   text2: 'Guest visit is only during active state',
          // });
        }
      } catch (err: any) {
        console.log('Booking fetch error:', err);
        // Toast.show({
        //   type: 'error',
        //   text1: 'Failed to load booking',
        //   text2: 'Please try again later',
        // });
        
  Alert.alert(
    'Failed to Load Guest History',
    err?.response?.data?.message || 'Try again later'
  );
      } finally {
        setLoadingBooking(false);
      }
    };

    fetchActiveBooking();
  }, [token]);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || form.visitDate;
    setShowDatePicker(Platform.OS === 'ios'); // iOS pe hamesha dikhega
    handleChange('visitDate', currentDate);
  };

  // const handleSubmit = async () => {
  //   if (!bookingId || submitting) return;

  //   if (!form.guestName.trim()) {
  //     Toast.show({ type: 'error', text1: 'Guest name daalo' });
  //     return;
  //   }

  //   if (!form.guestPhone.trim() || form.guestPhone.length !== 10) {
  //     Toast.show({ type: 'error', text1: 'Valid 10-digit guest phone daalo' });
  //     return;
  //   }

  //   if (!form.visitDate) {
  //     Toast.show({ type: 'error', text1: 'please select visit date' });
  //     return;
  //   }

  //   setSubmitting(true);

  //   try {
  //     const payload = {
  //       permitType: 'guest',
  //       bookingId,
  //       guestName: form.guestName.trim(),
  //       guestPhone: form.guestPhone.trim(),
  //       guestEmail: form.guestEmail.trim() || undefined,
  //       visitDate: form.visitDate.toISOString().split('T')[0], // YYYY-MM-DD
  //       purpose: form.purpose.trim(),
  //     };

  //     await axios.post(`${BASE_URL}/api/guest-visits`, payload, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     Toast.show({
  //       type: 'success',
  //       text1: 'Guest Visit Created!',
  //       text2: 'QR code sent on Mail',
  //     });

  //     setForm({
  //       guestName: '',
  //       guestPhone: '',
  //       guestEmail: '',
  //       visitDate: new Date(),
  //       purpose: '',
  //     });

  //     navigation.goBack();

  //   } catch (err: any) {
  //     const msg = err?.response?.data?.message || 'Failed to create guest visit';
  //     Toast.show({
  //       type: 'error',
  //       text1: 'Failed',
  //       text2: msg,
  //     });
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };


//  const handleSubmit = async () => {
//   if (!bookingId || submitting) return;

//   if (
//     !form.guestName?.trim() ||
//     !form.guestPhone?.trim() ||
//     !form.guestEmail?.trim() ||
//     !form.purpose?.trim()
//   ) {
//     Alert.alert("Incomplete Form", "Fill all fields.");
//     return;
//   }

//   if (form.guestPhone.length !== 10) {
//     Alert.alert("Invalid Phone", "Please enter a valid phone number.");
//     return;
//   }

//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(form.guestEmail.trim())) {
//     Alert.alert("Invalid Email", "Enter a valid email address");
//     return;
//   }

//   if (!form.visitDate) {
//    Alert.alert("Date Required", "Select a visit date.");
//     return;
//   }

//   setSubmitting(true);

//   try {
//     const payload = {
//       permitType: "guest",
//       bookingId,
//       guestName: form.guestName.trim(),
//       guestPhone: form.guestPhone.trim(),
//       guestEmail: form.guestEmail.trim(),
//       visitDate: form.visitDate.toISOString().split("T")[0],
//       purpose: form.purpose.trim(),
//     };

//     await axios.post(`${BASE_URL}/api/guest-visits`, payload, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     Alert.alert(
//       "Success",
//       "Guest Visit Created!\nQR code sent on Mail",
//       [
//         {
//           text: "OK",
//           onPress: () => {
//             setForm({
//               guestName: "",
//               guestPhone: "",
//               guestEmail: "",
//               visitDate: new Date(),
//               purpose: "",
//             });

//             navigation.goBack();
//           },
//         },
//       ]
//     );
//   } catch (err: any) {
//     const msg =
//       err?.response?.data?.message || "Failed to create guest visit";

//     Alert.alert("Failed", msg);
//   } finally {
//     setSubmitting(false);
//   }
// };
const handleSubmit = async () => {
  console.log('Create Guest Pass clicked');
  console.log('bookingId:', bookingId);
  console.log('token exists:', !!token);
  console.log('form:', form);
 if (isParent) {
    Alert.alert(
      "Not Available",
      "Guest Pass is only available for students."
    );
    return;
  }

  if (submitting) {
    console.log('Already submitting...');
    return;
  }

  if (!bookingId) {
    Alert.alert(
      'No Active Booking',
      'No active booking found. Please make sure you have an active booking.'
    );
    return;
  }

  if (
    !form.guestName?.trim() ||
    !form.guestPhone?.trim() ||
    !form.guestEmail?.trim() ||
    !form.purpose?.trim()
  ) {
    Alert.alert(
      'Incomplete Form',
      'Please fill all fields.'
    );
    return;
  }

  if (form.guestPhone.trim().length !== 10) {
    Alert.alert(
      'Invalid Phone',
      'Please enter a valid 10-digit phone number.'
    );
    return;
  }


const purpose = form.purpose?.trim() || '';

if (purpose.length < 10) {
  Alert.alert(
    'Invalid Purpose',
    'Purpose of visit must be at least 10 characters.'
  );
  return;
}

if (purpose.length > 100) {
  Alert.alert(
    'Invalid Purpose',
    'Purpose of visit must not exceed 100 characters.'
  );
  return;
}



  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(form.guestEmail.trim())) {
    Alert.alert(
      'Invalid Email',
      'Please enter a valid email address.'
    );
    return;
  }

  if (!form.visitDate) {
    Alert.alert(
      'Date Required',
      'Please select a visit date.'
    );
    return;
  }

  setSubmitting(true);

  try {
    const payload = {
      permitType: 'guest',
      bookingId: bookingId,
      guestName: form.guestName.trim(),
      guestPhone: form.guestPhone.trim(),
      guestEmail: form.guestEmail.trim(),
      visitDate: form.visitDate.toISOString().split('T')[0],
      purpose: form.purpose.trim(),
    };

    console.log('Sending guest visit payload:', payload);
    console.log('API URL:', `${BASE_URL}/api/guest-visits`);

    const response = await axios.post(
      `${BASE_URL}/api/guest-visits`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Guest visit API response:', response);
    console.log('Guest visit response data:', response.data);

    Alert.alert(
      'Success',
      response.data?.message ||
        'Guest Visit Created Successfully!\nQR code sent on Mail.',
      [
        {
          text: 'OK',
          onPress: () => {
            setForm({
              guestName: '',
              guestPhone: '',
              guestEmail: '',
              visitDate: new Date(),
              purpose: '',
            });

            navigation.goBack();
          },
        },
      ]
    );
} catch (err: any) {
  console.log('Guest visit API ERROR:', err);

  const msg =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    'Failed to create guest visit.';

  console.log('ALERT MESSAGE:', msg);

  setTimeout(() => {
    Alert.alert(
      'Failed',
      String(msg),
      [
        {
          text: 'OK',
        },
      ]
    );
  }, 100);
} finally {
  setSubmitting(false);
}

};

  if (loadingBooking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.nOrange} />
        <Text style={styles.loadingText}>Loading active booking...</Text>
      </View>
    );
  }

  if (!bookingId) {
    return (
      <View style={styles.noBookingContainer}>
        <Text style={styles.noBookingText}>
          No active booking found.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <HeaderGradient
        image={require('../../assets/images/a4.png')}
        title="Create Guest Pass"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <Text style={styles.tagline}>
          Invite your guest with ease.{"\n"}The QR code will be sent to their email.
        </Text>

        <View style={styles.formContainer}>
          {/* Guest Name */}
          <View style={styles.inputBox}>
            <Text style={styles.smallLabel}>Guest Name</Text>
            <TextInput
              style={styles.input}
              value={form.guestName}
              onChangeText={(text) => handleChange('guestName', text)}
              placeholder="Full name"
              placeholderTextColor="#aaa"
            />
          </View>

          {/* Guest Phone */}
          <View style={styles.inputBox}>
            <Text style={styles.smallLabel}>Guest Phone</Text>
            <TextInput
              style={styles.input}
              value={form.guestPhone}
              onChangeText={(text) => {
                const numeric = text.replace(/[^0-9]/g, '');
                if (numeric.length <= 10) handleChange('guestPhone', numeric);
              }}
              placeholder="10-digit number"
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor="#aaa"
            />
          </View>

          {/* Guest Email */}
          <View style={styles.inputBox}>
            <Text style={styles.smallLabel}>Guest Email</Text>
            <TextInput
              style={styles.input}
              value={form.guestEmail}
              onChangeText={(text) => handleChange('guestEmail', text)}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#aaa"
            />
          </View>

          {/* Visit Date - Normal Calendar Picker */}
          <TouchableOpacity
            style={styles.inputBox}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.smallLabel}>Visit Date</Text>
            <Text style={styles.dateText}>
              {form.visitDate.toLocaleDateString('en-GB')}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={form.visitDate}
              mode="date"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()} // Aaj se pehle nahi
            />
          )}

          {/* Purpose */}
        <View style={styles.textAreaBox}>
  <Text style={styles.smallLabel}>Purpose of Visit</Text>

  <TextInput
    style={styles.textArea}
    multiline
    numberOfLines={4}
    maxLength={100}
    value={form.purpose}
    onChangeText={(text) => handleChange('purpose', text)}
    placeholder="Reason for visit..."
    placeholderTextColor="#aaa"
    textAlignVertical="top"
  />

  <Text style={styles.charCount}>
    {form.purpose.length}/100
  </Text>
</View>


       <TouchableOpacity
  style={[
    styles.submitBtn,
    (submitting || isParent) && styles.submitBtnDisabled,
  ]}
  onPress={handleSubmit}
  disabled={submitting || isParent}
>
  {submitting ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={styles.submitText}>
      {isParent ? "Guest Pass Not Available" : "Create Guest Pass"}
    </Text>
  )}
</TouchableOpacity>



          {/* <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Create Guest Pass</Text>
            )}
          </TouchableOpacity> */}
        </View>

        {/* Guest History - Horizontal Scroll (no extra package needed) */}
<View style={styles.historySection}>
  <Text style={styles.sectionTitle}>Your Guest Passes</Text>

  {loadingVisits ? (
    <ActivityIndicator size="small" color={colors.nOrange} style={{ marginTop: 20 }} />
  ) : visits.length === 0 ? (
    <Text style={styles.noVisitsText}>No guest visits found yet</Text>
  ) : (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalList}
    >
      {visits.map((visit) => (
        <View key={visit.id} style={styles.visitCard}>
          <Text style={styles.guestName}>{visit.guestName || 'Unknown Guest'}</Text>
          <Text style={styles.visitDetail}>
            Date: {visit.visitDate ? new Date(visit.visitDate).toLocaleDateString('en-GB') : 'N/A'}
          </Text>
          <Text style={[
            styles.visitDetail,
            visit.status?.toLowerCase() === 'approved' && { color: '#22c55e' },
            visit.status?.toLowerCase() === 'pending' && { color: '#f59e0b' },
            visit.status?.toLowerCase() === 'rejected' && { color: '#ef4444' },
          ]}>
            Status: {visit.status || 'Pending'}
          </Text>
        </View>
      ))}
    </ScrollView>
  )}
</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/* ─── STYLES (RaiseComplaint se match kiye) ────────────────────────────────────── */
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.nOrange,
    fontFamily: 'Quicksand-Medium',
  },
  noBookingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noBookingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#444',
    marginBottom: 20,
    fontFamily: 'Quicksand-Medium',
  },
  backBtn: {
    backgroundColor: colors.nOrange,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
  tagline: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10,
    color: '#444',
    fontFamily: 'Quicksand-Bold',
  },
  formContainer: {
    padding: 20,
  },
  submitBtnDisabled: {
  opacity: 0.5,
  backgroundColor: "#999",
},

  smallLabel: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Quicksand-Medium',
    zIndex: 1,
  },
  charCount: {
  textAlign: 'right',
  fontSize: 12,
  color: '#777',
  fontFamily: 'Quicksand-Medium',
  marginTop: 5,
},

  inputBox: {
    borderWidth: 1,
    borderColor: '#616161',
    borderRadius: 10,
    padding: 15,
    marginBottom: 18,
    position: 'relative',
  },
  input: {
    fontSize: 16,
    color: '#444',
    fontFamily: 'Quicksand-Medium',
  },
  dateText: {
    fontSize: 16,
    color: '#444',
    fontFamily: 'Quicksand-Medium',
  },
  textAreaBox: {
    borderWidth: 1,
    borderColor: '#616161',
    borderRadius: 10,
    padding: 15,
    marginBottom: 18,
    position: 'relative',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
  },
  submitBtn: {
    backgroundColor: colors.nOrange,
    paddingVertical: 18,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },

  submitText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
  },
  historySection: {
  marginTop: 30,
  paddingHorizontal: 20,
},
sectionTitle: {
  fontSize: 20,
  fontFamily: 'Quicksand-Bold',
  color: colors.nOrange,
  marginBottom: 16,
  textAlign: 'center',
},
horizontalList: {
  paddingRight: 20, // last card ke right space
},
visitCard: {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#E5D8CF',
  borderRadius: 12,
  padding: 16,
  marginRight: 16,
  width: 220, // card width – adjust kar sakte ho
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
},
guestName: {
  fontSize: 16,
  fontFamily: 'Quicksand-Bold',
  color: '#3E2B24',
  marginBottom: 8,
},
visitDetail: {
  fontSize: 14,
  fontFamily: 'Quicksand-Medium',
  color: '#555',
  marginBottom: 4,
},
noVisitsText: {
  fontSize: 16,
  color: '#777',
  textAlign: 'center',
  fontFamily: 'Quicksand-Medium',
  marginTop: 20,
},
});

export default GuestVisit;