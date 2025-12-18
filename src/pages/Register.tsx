import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import colors from '../constants/color';

const API_BASE_URL = 'https://staging.cocoliving.in';

const COLORS = {
  primary: '#5C4435',
  border: '#C9B297',
  bg: '#F7F7F7',
  text: '#3E2A1F',
  muted: '#9E9E9E',
  button: '#F6A452',
};

/* DEFAULT AVATAR */
const AVATAR_PLACEHOLDER =
  'https://cdn-icons-png.flaticon.com/512/847/847969.png';

/* ================= FLOATING INPUT (WITH PLACEHOLDER) ================= */
const FloatingInput = ({
  label,
  value = '',
  onChangeText,
  editable = true,
  onPress,
  keyboardType,
}) => {
  const placeholderHint = label.replace('*', '').trim();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => !editable && onPress && onPress()}
      style={styles.floatWrap}
    >
      <Text style={styles.floatLabelAlways}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        style={styles.floatInputAlways}
        pointerEvents={editable ? 'auto' : 'none'}
        placeholder={placeholderHint}
        placeholderTextColor={COLORS.muted}
      />
    </TouchableOpacity>
  );
};

const RegisterProfileScreen = ({ navigation, route }) => {
  const email = route?.params?.verifiedEmail || '';

  /* FORM STATES */
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [userType, setUserType] = useState('student');

  /* IMAGE STATES */
  const [profileImage, setProfileImage] = useState(null);
  const [profilePicUri, setProfilePicUri] = useState(AVATAR_PLACEHOLDER);
  const [openSheet, setOpenSheet] = useState(false);

  /* OTP */
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  /* DOB */
  const [showDOBPicker, setShowDOBPicker] = useState(false);

  const isDefaultAvatar = profilePicUri === AVATAR_PLACEHOLDER;

  /* IMAGE HANDLERS */
  const openCamera = async () => {
    setOpenSheet(false);
    const res = await launchCamera({ mediaType: 'photo', quality: 0.7 });
    if (res.assets?.length) {
      const img = res.assets[0];
      setProfilePicUri(img.uri);
      setProfileImage({
        uri: img.uri,
        type: img.type || 'image/jpeg',
        name: img.fileName || `photo_${Date.now()}.jpg`,
      });
    }
  };

  const openGallery = async () => {
    setOpenSheet(false);
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });
    if (res.assets?.length) {
      const img = res.assets[0];
      setProfilePicUri(img.uri);
      setProfileImage({
        uri: img.uri,
        type: img.type || 'image/jpeg',
        name: img.fileName || `photo_${Date.now()}.jpg`,
      });
    }
  };

  /* DOB */
  const onDOBChange = (_, date) => {
    setShowDOBPicker(false);
    if (date) {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      setDob(`${d}-${m}-${y}`);
    }
  };

  /* SEND OTP */
  const handleSendOTP = async () => {
    if (!firstName || !lastName) {
      Toast.show({ type: 'error', text1: 'Enter full name' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/user/send-otp`, {
        email,
        fullName: `${firstName} ${lastName}`,
      });
      setOtpSent(true);
      Toast.show({ type: 'success', text1: 'OTP sent to email' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to send OTP' });
    } finally {
      setLoading(false);
    }
  };

  const formatDOB = (d) => {
    if (!d) return '';
    const [day, month, year] = d.split('-');
    return `${year}-${month}-${day}`;
  };

  const handleSubmitProfile = async () => {
    if (!otp) {
      Toast.show({ type: 'error', text1: 'Enter OTP' });
      return;
    }

    const fullName = `${firstName} ${lastName}`.trim();

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('gender', gender);
    formData.append('userType', userType);
    formData.append('dateOfBirth', formatDOB(dob));
    formData.append('otp', otp);

    if (profileImage) {
      formData.append('profileImage', {
        uri: profileImage.uri,
        name: profileImage.name,
        type: profileImage.type,
      });
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/user/register`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (res.data?.success) {
        Toast.show({ type: 'success', text1: 'Registration successful 🎉' });
        navigation.replace('Login', { email });
      } else {
        Toast.show({ type: 'error', text1: res.data?.message });
      }
    } catch (e) {
      console.log('REGISTER ERROR:', e);
      Toast.show({
        type: 'error',
        text1: e?.response?.data?.message || 'Registration failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Looks like you are new</Text>

        {/* IMAGE + USER TYPE */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.avatar} onPress={() => setOpenSheet(true)}>
            <Image source={{ uri: profilePicUri }} style={styles.avatarImg} />
            <View style={styles.cameraBadge}>
              <Ionicons
                name={isDefaultAvatar ? 'camera' : 'create'}
                size={16}
                color="#fff"
              />
            </View>
          </TouchableOpacity>

          <View style={styles.toggleRow}>
            {['Student', 'Professional'].map(t => {
              const key = t.toLowerCase();
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.toggleBtn,
                    userType === key && styles.toggleActive,
                  ]}
                  onPress={() => setUserType(key)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      userType === key && styles.toggleTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* NAME */}
        <View style={styles.row}>
          <FloatingInput label="First Name*" value={firstName} onChangeText={setFirstName} />
          <FloatingInput label="Last Name*" value={lastName} onChangeText={setLastName} />
        </View>

        {/* DOB + GENDER */}
        <View style={styles.row}>
          <FloatingInput
            label="Date of Birth*"
            value={dob}
            editable={false}
            onPress={() => setShowDOBPicker(true)}
          />
          <FloatingInput
            label="Gender*"
            value={gender}
            editable={false}
            onPress={() => setGender(gender === 'Male' ? 'Female' : 'Male')}
          />
        </View>

        <FloatingInput
          label="Mobile Number*"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <FloatingInput label="Email ID*" value={email} editable={false} />

        {otpSent && (
          <FloatingInput
            label="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
          />
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={otpSent ? handleSubmitProfile : handleSendOTP}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {otpSent ? 'Save' : 'Send OTP'}
            </Text>
          )}
        </TouchableOpacity>

        {showDOBPicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            maximumDate={new Date()}
            onChange={onDOBChange}
          />
        )}
      </ScrollView>

      {/* IMAGE PICKER SHEET */}
      {openSheet && (
        <TouchableOpacity style={styles.overlay} onPress={() => setOpenSheet(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select Profile Photo</Text>

            <TouchableOpacity style={styles.sheetItem} onPress={openCamera}>
              <Ionicons name="camera" size={22} color={COLORS.primary} />
              <Text style={styles.sheetText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} onPress={openGallery}>
              <Ionicons name="image" size={22} color={COLORS.primary} />
              <Text style={styles.sheetText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetItem, { justifyContent: 'center' }]}
              onPress={() => setOpenSheet(false)}
            >
              <Text style={{ fontWeight: '700', color: COLORS.primary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      <Toast />
    </KeyboardAvoidingView>
  );
};

export default RegisterProfileScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F5F5F5' },

  title: {
    fontSize: 23,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 24,
    color: COLORS.text,
    fontFamily: 'RethnikSans-Medium',
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.nOrange,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  cameraBadge: {
    position: 'absolute',
    bottom: 3,
    right: 6,
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 14,
  },

  toggleRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    overflow: 'hidden',
  },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 18 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { color: COLORS.primary, fontWeight: '600' },
  toggleTextActive: { color: '#fff' },

  row: { flexDirection: 'row', gap: 12 },

  floatWrap: {
    borderWidth: 1,
    borderColor: colors.nBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 56,
    marginBottom: 14,
    backgroundColor: COLORS.bg,
    flex: 1,
    position: 'relative',
  },

  floatLabelAlways: {
    position: 'absolute',
    left: 12,
    top: -8,
    fontSize: 14,
    color: colors.nBlack,
    fontFamily: 'Quicksand-Medium',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 8,
    zIndex: 1,
  },

  floatInputAlways: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },

  button: {
    backgroundColor: COLORS.button,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: '600', fontFamily: 'Quicksand-Bold' },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  sheetText: { fontSize: 16, color: COLORS.text },
});