import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Image,
  Platform,
} from 'react-native';
import HeaderGradient from '../HeaderGradient';
import colors from '../../constants/color';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';

const RaiseComplaint = () => {

  const baseURL = 'https://staging.cocoliving.in';
  const navigation = useNavigation();

  const { user } = useAuth();
  const token = user?.token;

  const urgencyOptions = ['Low', 'High', 'Priority'];

  const CATEGORY_MAP = {
    "Maintenance": [
      "Plumbing",
      "Electrical",
      "Appliance Issue",
      "Roommate Issue",
      "Other",
    ],
    "Payments & Refunds": [
      "Payment Not Reflecting Correctly",
      "Refund Not Received",
      "Request Refund",
      "Remaining Payment Issue",
      "Other",
    ],
    "Food Issue": [
      "Food Quality is not good",
      "Food Taste not good",
      "Other",

    ],
    "Other": [
      "Suggestion",
      "Complaint",
      "Feedback",
      "Other",
    ],
  };

  const [urgency, setUrgency] = useState('Low');
  const [showUrgencyOptions, setShowUrgencyOptions] = useState(false);

  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [showCategoryOptions, setShowCategoryOptions] = useState(false);
  const [showSubCategoryOptions, setShowSubCategoryOptions] = useState(false);

  const [issue, setIssue] = useState('');
  const [description, setDescription] = useState('');

  const [uploadedImage, setUploadedImage] = useState(null);

  const [roomNumber, setRoomNumber] = useState('');
  const [loadingRoom, setLoadingRoom] = useState(true);

  const [complaintDate] = useState(new Date());

  const openGallery = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 1 }, (response) => {
      if (response.didCancel || response.errorMessage) return;
      if (response.assets && response.assets.length > 0) {
        setUploadedImage(response.assets[0].uri);
      }
    });
  };

  const openCamera = () => {
    launchCamera({ mediaType: 'photo', quality: 1, saveToPhotos: true }, (response) => {
      if (response.didCancel || response.errorMessage) return;
      if (response.assets && response.assets.length > 0) {
        setUploadedImage(response.assets[0].uri);
      }
    });
  };

  useEffect(() => {
    if (!token) return;
    fetchUserBookings();
  }, [token]);

  const fetchUserBookings = async () => {
    try {
      setLoadingRoom(true);
      const response = await axios.get(
        `${baseURL}/api/book-room/getUserBookings?page=1&limit=30`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const bookingData = response.data.bookings || [];
      const today = new Date();
      const activeBookings = bookingData.filter((b) => {
        const status = b.displayStatus?.toLowerCase();
        const checkIn = new Date(b.checkInDate);
        const checkOut = b.checkOutDate ? new Date(b.checkOutDate) : null;
        return (
          ["approved", "active"].includes(status) &&
          checkIn <= today &&
          (checkOut ? today <= checkOut : true)
        );
      });

      activeBookings.sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate));
      const activeBooking = activeBookings[0];

      setRoomNumber(activeBooking?.room?.roomNumber ? `#${activeBooking.room.roomNumber}` : "No room assigned");
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setRoomNumber("Error loading room");
    } finally {
      setLoadingRoom(false);
    }
  };

  const handleSubmit = async () => {
    if (!roomNumber || roomNumber === 'No room assigned' || roomNumber === 'Error loading room') {
      return Toast.show({ type: "error", text1: "No room assigned" });
    }
    if (!category) return Toast.show({ type: "error", text1: "Category is required" });
    if (!subCategory) return Toast.show({ type: "error", text1: "Sub Category is required" });
    if (!issue.trim()) return Toast.show({ type: "error", text1: "Issue required" });
    if (!description.trim()) return Toast.show({ type: "error", text1: "Description required" });

    try {
      const formData = new FormData();
      formData.append("date", complaintDate.toISOString().slice(0, 10));
      formData.append("roomNumber", roomNumber.replace('#', ''));
      formData.append("issue", issue.trim());
      formData.append("description", description.trim());
      formData.append("priority", urgency.toUpperCase());
      formData.append("category", category);
      formData.append("subCategory", subCategory);

      if (uploadedImage) {
        const uri = Platform.OS === "android" ? uploadedImage : uploadedImage.replace("file://", "");
        const filename = uploadedImage.split("/").pop() || "photo.jpg";
        const type = filename.endsWith(".png") ? "image/png" : "image/jpeg";
        formData.append("ticketImage", { uri, name: filename, type } as any);
      }

      const response = await axios.post(`${baseURL}/api/tickets/create`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        transformRequest: [(data) => data],
      });
      console.log("Response of raising request: ",response)

      Toast.show({ type: "success", text1: "Ticket Raised Success" });
      navigation.goBack();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Unknown server error";
      Toast.show({ type: "error", text1: "Failed", text2: message });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <HeaderGradient
        image={require("../../../assets/images/support.png")}
        title="Help & Support"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <Text style={styles.tagline}>
          Your comfort matters.{"\n"}Tell us what's wrong, we'll fix it soon.
        </Text>

        <Text style={styles.screenTitle}>Raise New Request</Text>

        <View style={styles.body}>

          {/* ROOM NUMBER */}
          <View style={styles.inputWrap}>
            <Text style={styles.floatingLabel}>Room Number</Text>
            <Text style={styles.inputText}>
              {loadingRoom ? 'Loading...' : roomNumber}
            </Text>
          </View>

          {/* DATE */}
          <View style={styles.inputWrap}>
            <Text style={styles.floatingLabel}>Date</Text>
            <Text style={styles.inputText}>
              {complaintDate.toLocaleDateString('en-GB')}
            </Text>
          </View>

          {/* CATEGORY */}
          <TouchableOpacity
            style={styles.inputWrap}
            onPress={() => {
              setShowCategoryOptions(!showCategoryOptions);
              setShowSubCategoryOptions(false);
              setShowUrgencyOptions(false);
            }}
          >
            <Text style={styles.floatingLabel}>Category</Text>
            <Text style={styles.inputText}>
              {category || 'Select Category'}
            </Text>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>

          {showCategoryOptions && (
            <View style={styles.optionList}>
              {Object.keys(CATEGORY_MAP).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => {
                    setCategory(cat);
                    setSubCategory('');
                    setShowCategoryOptions(false);
                  }}
                >
                  <Text style={styles.optionItem}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* SUB CATEGORY */}
          <TouchableOpacity
            style={[styles.inputWrap, !category && { opacity: 0.8 }]}
            onPress={() => {
              if (!category) return;
              setShowSubCategoryOptions(!showSubCategoryOptions);
              setShowCategoryOptions(false);
              setShowUrgencyOptions(false);
            }}
            disabled={!category}
          >
            <Text style={styles.floatingLabel}>Sub Category</Text>
            <Text style={styles.inputText}>
              {subCategory || 'Select Sub Category'}
            </Text>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>

          {showSubCategoryOptions && category && (
            <View style={styles.optionList}>
              {CATEGORY_MAP[category].map((sub) => (
                <TouchableOpacity
                  key={sub}
                  onPress={() => {
                    setSubCategory(sub);
                    setShowSubCategoryOptions(false);
                  }}
                >
                  <Text style={styles.optionItem}>{sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ISSUE */}
          <View style={styles.inputWrap}>
            <Text style={styles.floatingLabel}>Issue</Text>
            <TextInput
              placeholder="Enter issue"
              placeholderTextColor="#616161"
              style={styles.inputText}
              value={issue}
              onChangeText={setIssue}
            />
          </View>

          {/* DESCRIPTION */}
          <View style={styles.textAreaWrap}>
            <Text style={styles.floatingLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Describe your issue here..."
              placeholderTextColor="#616161"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* ==================== UPLOAD PHOTO - FIXED WITH PROPER WRAPPER ==================== */}
          <View style={styles.uploadWrap}>
            <Text style={styles.floatingLabel}>Upload Photo (Optional)</Text>

            {!uploadedImage && (
              <TouchableOpacity 
                onPress={openGallery} 
                style={styles.uploadTapArea}   // ← yeh line tap area bada aur center karta hai
              >
                <Text style={styles.uploadText}>Tap to upload photo</Text>
                <Text style={styles.uploadSub}>PNG, JPG or PDF (Max: 5MB)</Text>
              </TouchableOpacity>
            )}

            {uploadedImage && (
              <View style={{ width: '100%' }}>
                <TouchableOpacity onPress={() => setUploadedImage(null)} style={styles.crossBtn}>
                  <Text style={styles.crossText}>✕</Text>
                </TouchableOpacity>
                <Image source={{ uri: uploadedImage }} style={styles.previewImage} resizeMode="cover" />
              </View>
            )}

            {!uploadedImage && (
              <>
                <View style={styles.orLineContainer}>
                  <View style={styles.line} />
                  <Text style={styles.orText}>or</Text>
                  <View style={styles.line} />
                </View>

                <TouchableOpacity onPress={openCamera} style={styles.cameraBtn}>
                  <Text style={styles.cameraText}>Open camera</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          {/* ================================================================================== */}

          {/* URGENCY */}
          {/* <TouchableOpacity
            style={styles.inputWrap}
            onPress={() => {
              setShowUrgencyOptions(!showUrgencyOptions);
              setShowCategoryOptions(false);
              setShowSubCategoryOptions(false);
            }}
          >
            <Text style={styles.floatingLabel}>Urgency</Text>
            <Text style={styles.inputText}>{urgency}</Text>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>

          {showUrgencyOptions && (
            <View style={styles.optionList}>
              {urgencyOptions.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    setUrgency(item);
                    setShowUrgencyOptions(false);
                  }}
                >
                  <Text style={styles.optionItem}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )} */}

          {/* SUBMIT */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RaiseComplaint;

/* --------------- STYLES ---------------- */
const styles = StyleSheet.create({
  tagline: { textAlign: 'center', fontSize: 16, marginTop: 10, fontFamily: 'Quicksand-Bold' },
  screenTitle: { textAlign: 'center', marginTop: 15, fontSize: 20, color: colors.primary, fontFamily: 'Quicksand-Bold' },
  body: { padding: 20, backgroundColor: '#F5F5F5' },

  inputWrap: {
    borderWidth: 1,
    borderColor: '#616161',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    marginBottom: 16,
    backgroundColor: '#F7F7F7',
    position: 'relative',
  },

  textAreaWrap: {
    borderWidth: 1,
    borderColor: '#616161',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
    marginBottom: 16,
    backgroundColor: '#F7F7F7',
    position: 'relative',
  },

  uploadWrap: {                    // ← SPECIAL WRAPPER FOR UPLOAD (fix)
    borderWidth: 1,
    borderColor: '#616161',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
    marginBottom: 16,
    backgroundColor: '#F7F7F7',
    position: 'relative',
  },

  uploadTapArea: {                 // ← yeh tap area bada aur center karta hai
    alignItems: 'center',
    paddingVertical: 25,
    width: '100%',
  },

  floatingLabel: {
    position: 'absolute',
    left: 16,
    top: -9,
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Quicksand-Medium',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 8,
    zIndex: 2,
  },

  inputText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Quicksand-Medium',
  },

  arrow: {
    position: 'absolute',
    right: 20,
    top: 19,
    fontSize: 14,
    color: '#555',
  },

  textArea: {
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
    color: '#000000'
  },

  optionList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    marginTop: -10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  optionItem: { padding: 12, fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },

  uploadText: {
    fontSize: 16,
    color: '#4f3421',
    fontFamily:'Quicksand-Bold',
    textAlign:'center'
  },

  uploadSub: {
    fontSize: 16,
    color: '#8c8c8c',
    marginTop: 5,
    fontFamily:'Quicksand-Regular',
    textAlign:'center'
  },

  orLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#616161',
  },
  orText: { marginHorizontal: 10, color: '#616161', fontFamily: 'Quicksand-SemiBold' },

  cameraBtn: {
    backgroundColor: colors.nOrange,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: 'center',
  },

  cameraText: {
    color: '#fff',
    fontFamily:'Quicksand-Bold',
    textAlign:'center'
  },

  submitBtn: {
    backgroundColor: colors.nOrange,
    paddingVertical: 18,
    borderRadius: 10,
    marginTop: 10,
  },
  submitText: { textAlign: 'center', color: '#fff', fontSize: 20, fontFamily: 'Quicksand-Bold' },

  previewImage: { width: '100%', height: 180, borderRadius: 15, marginTop: 10 },
  crossBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossText: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: -2 },
});