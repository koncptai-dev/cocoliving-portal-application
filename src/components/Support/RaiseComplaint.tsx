import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
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
  const [urgency, setUrgency] = useState('Low');
  const [showUrgencyOptions, setShowUrgencyOptions] = useState(false);

  const [issue, setIssue] = useState('');
  const [description, setDescription] = useState('');

  const [uploadedImage, setUploadedImage] = useState(null); // for preview

  const [roomNumber, setRoomNumber] = useState('');
  const [loadingRoom, setLoadingRoom] = useState(true);

  const today = new Date().toLocaleDateString();

  const openGallery = () => {
  launchImageLibrary(
    {
      mediaType: 'photo',
      quality: 1,
    },
    (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) return;

      const uri = response.assets[0].uri;
      setUploadedImage(uri);
    }
  );
};
const openCamera = () => {
  launchCamera(
    {
      mediaType: 'photo',
      quality: 1,
      saveToPhotos: true,
    },
    (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) return;

      const uri = response.assets[0].uri;
      setUploadedImage(uri);
    }
  );
};

// Fetch active room number
useEffect(() => {
  if (!token) {
    setLoadingRoom(false);
    return;
  }
  fetchUserBookings();
}, [token]);

const fetchUserBookings = async () => {
  try {
    setLoadingRoom(true);
    const response = await axios.get(
      `${baseURL}/api/book-room/getUserBookings?page=1&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { bookings: bookingData = [] } = response.data;

    // Find active/approved booking
    const activeBooking = bookingData.find(booking => 
      booking.displayStatus?.toLowerCase() === 'active' || 
      booking.displayStatus?.toLowerCase() === 'approved'
    );

    if (activeBooking && activeBooking.room?.roomNumber) {
      setRoomNumber(`#${activeBooking.room.roomNumber}`);
    } else {
      setRoomNumber('No room assigned');
    }
  } catch (error) {
    console.error('Error fetching bookings for complaint:', error);
    setRoomNumber('Error loading room');
  } finally {
    setLoadingRoom(false);
  }
};

//Final Ticket submission:
const handleSubmit = async () => {
  console.log("🚀 Submit button pressed");

  if (!roomNumber || roomNumber === 'No room assigned' || roomNumber === 'Error loading room') {
    console.log("❌ No room assigned");
    Toast.show({ type: "error", text1: "No room assigned" });
    return;
  }
  if (!issue.trim()) {
    console.log("❌ Issue empty");
    Toast.show({ type: "error", text1: "Issue required" });
    return;
  }
  if (!description.trim()) {
    console.log("❌ Description empty");
    Toast.show({ type: "error", text1: "Description required" });
    return;
  }

  try {
    const formData = new FormData();

    // DATE - 100% backend ko yahi pasand hai
    const today = new Date();
    const dateString = today.toISOString().slice(0, 10); // 2025-11-20
    console.log("📅 Date bhej rahe:", dateString);

    formData.append("roomNumber", roomNumber.replace('#', '')); // Remove # if present
    formData.append("date", dateString);
    formData.append("issue", issue.trim());
    formData.append("description", description.trim());
    formData.append("priority", urgency.toUpperCase()); 

    if (uploadedImage) {
      const uri = Platform.OS === "android" ? uploadedImage : uploadedImage.replace("file://", "");
      const filename = uploadedImage.split("/").pop() || "photo.jpg";
      const type = filename.endsWith(".png") ? "image/png" : "image/jpeg";

      console.log("🖼️ Image URI:", uri);
      console.log("🖼️ Image name:", filename);

      formData.append("ticketImage", {
        uri,
        name: filename,
        type,
      } as any);
    } else {
      console.log("🖼️ No image attached");
    }

    // Yeh line daal do - sabse important for React Native
    // @ts-ignore
    formData._parts && console.log("FormData parts:", formData._parts);

    console.log("🔥 FINAL REQUEST JA RAHA HAI...");

    const response = await axios.post(
      `${baseURL}/api/tickets/create`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        transformRequest: [(data) => data], // <-- yeh nahi hataana kabhi
        timeout: 30000,
      }
    );

    console.log("✅ SUCCESS:", response.data);
    Toast.show({ type: "success", text1: "Ho gaya bhai!" });
    navigation.goBack();

  }catch (error: any) {
  console.log("❌ FULL ERROR:", error);

  const backend = error?.response?.data;
  const status = error?.response?.status;

  console.log("🟥 STATUS:", status);
  console.log("🟥 BACKEND RAW:", backend);

  // Sequelize validation errors
  if (backend?.errors && Array.isArray(backend.errors)) {
    backend.errors.forEach((err: any, index: number) => {
      console.log(`🔎 Sequelize Error ${index + 1}:`, err.message);
    });
  }

  // Nested message check
  const message =
    backend?.message ||
    backend?.error ||
    backend?.errors?.[0]?.message ||
    error?.message ||
    "Unknown server error";

  console.log("💬 Final extracted message:", message);

  Toast.show({
    type: "error",
    text1: "Failed",
    text2: message,
  });
}
};



  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <HeaderGradient title="Help & Support" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        {/* Tagline */}
        <Text style={styles.tagline}>
          Your comfort matters.{"\n"}Tell us what's wrong, we'll fix it soon.
        </Text>

        <Text style={styles.screenTitle}>Raise New Complaint</Text>

        <View style={styles.body}>

          {/* ROOM NUMBER */}
          <View style={styles.dropdownBox}>
            <Text style={styles.smallLabel}>ROOM NUMBER</Text>
            <Text style={styles.dropdownText}>
              {loadingRoom ? 'Loading...' : roomNumber}
            </Text>
          </View>

          {/* DATE */}
          <View style={styles.dropdownBox}>
            <Text style={styles.smallLabel}>DATE</Text>
            <Text style={styles.dropdownText}>{today}</Text>
          </View>

          {/* ISSUE */}
          <View style={styles.textBox}>
            <Text style={styles.smallLabel}>ISSUE</Text>
            <TextInput
              placeholder="Enter issue"
              style={styles.textInput}
              value={issue}
              onChangeText={setIssue}
            />
          </View>

          {/* DESCRIPTION */}
          <View style={styles.textAreaBox}>
            <Text style={styles.smallLabel}>DESCRIPTION</Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Describe your issue here..."
              value={description}
              onChangeText={setDescription}
            />
          </View>

       {/* UPLOAD PHOTO */}
<View style={styles.uploadBox}>
  <Text style={styles.smallLabel}>UPLOAD PHOTO (OPTIONAL)</Text>

  {/* No image */}
  {!uploadedImage && (
    <TouchableOpacity onPress={openGallery}>
      <Text style={styles.uploadText}>Tap to upload photo</Text>
      <Text style={styles.uploadSub}>PNG, JPG or PDF (Max: 5MB)</Text>
    </TouchableOpacity>
  )}

  {/* Image preview */}
  {uploadedImage && (
    <View style={{ width: '100%' }}>
      <TouchableOpacity
        onPress={() => setUploadedImage(null)}
        style={styles.crossBtn}
      >
        <Text style={styles.crossText}>✕</Text>
      </TouchableOpacity>

      <Image
        source={{ uri: uploadedImage }}
        style={styles.previewImage}
        resizeMode="cover"
      />
    </View>
  )}

  {/* OR + camera only if no image */}
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



          {/* URGENCY */}
          <TouchableOpacity
            style={styles.dropdownBox}
            onPress={() => setShowUrgencyOptions(!showUrgencyOptions)}
          >
            <Text style={styles.smallLabel}>URGENCY</Text>
            <Text style={styles.dropdownText}>{urgency}</Text>
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
          )}

          {/* SUBMIT */}
          <TouchableOpacity style={styles.submitBtn}
          onPress={handleSubmit}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
};

export default RaiseComplaint;

/* --------------- STYLES ---------------- */
const styles = StyleSheet.create({
  tagline: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 10,
    fontWeight: '700',
  },
  screenTitle: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 22,
    color: colors.primary,
    fontWeight: '700',
  },
  body: {
    padding: 20,
  },

  smallLabel: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 5,
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
  },

  dropdownBox: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    padding: 15,
    marginBottom: 18,
    position: 'relative',
  },

  dropdownText: {
    fontSize: 15,
    color: '#000',
  },

  arrow: {
    position: 'absolute',
    right: 20,
    top: 14,
    fontSize: 14,
    color: '#555',
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

  optionItem: {
    padding: 12,
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  textBox: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    padding: 15,
    position: 'relative',
    marginBottom: 18,
  },

  textInput: {
    fontSize: 15,
    color: '#000',
  },

  textAreaBox: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    padding: 15,
    marginBottom: 18,
  },

  textArea: {
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  uploadText: {
    fontSize: 15,
    color: '#444',
    marginTop: 12,
  },

  uploadSub: {
    fontSize: 11,
    color: '#777',
    marginTop: 5,
  },

  orLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },

  orText: {
    marginHorizontal: 10,
    color: '#666',
  },

  cameraBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 30,
  },

  cameraText: {
    color: '#fff',
    fontWeight: '700',
  },

  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    marginTop: 10,
  },

  submitText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  uploadBox: {
  borderWidth: 1,
  borderColor: colors.primary,
  borderRadius: 20,
  padding: 15,
  marginBottom: 18,
  position: 'relative',
  alignItems: 'center',
},
previewImage: {
  width: '100%',
  height: 180,      // FIXED, clean, responsive
  borderRadius: 15,
  marginTop: 10,
},
crossBtn: {
  position: 'absolute',
  top: 0,
  right: 10,
  zIndex: 10,
  backgroundColor: 'rgba(255, 0, 0, 0.9)',
  width: 28,
  height: 28,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
},
crossText: {
  color: '#fff',
  fontSize: 18,
  fontWeight: '800',
  marginTop: -2,
},

});