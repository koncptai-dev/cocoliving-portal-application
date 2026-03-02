import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Image
} from "react-native";
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import Config from 'react-native-config';
import { launchCamera } from 'react-native-image-picker';  // ← ONLY CAMERA
import colors from '../constants/color';

export const API_BASE_URL = Config.API_BASE_URL;
const SIGNUP_SEND_OTP = `${API_BASE_URL}/api/user/send-otp`;
const SIGNUP_REGISTER = `${API_BASE_URL}/api/user/register`;

const COLORS = {
  primary: '#5C4435',
  border: '#C9B297',
  bg: '#F7F7F7',
  text: '#3E2A1F',
  muted: '#9E9E9E',
  button: '#F6A452',
};

const AVATAR_PLACEHOLDER = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';

const FloatingInput = ({ label, value = '', onChangeText, editable = true, onPress, keyboardType }) => {
  const placeholderHint = label.replace('*', '').trim();

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => !editable && onPress && onPress()} style={styles.floatWrap}>
      <Text style={styles.floatLabelAlways}>{label}</Text>
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
  const params = route.params || {};
  const prefilledEmail = params.verifiedEmail || '';
  const prefilledPhone = params.phone || '';

  const prefilledMedium: 'email' | 'phone' | null = prefilledEmail ? 'email' : prefilledPhone ? 'phone' : null;
  const prefilledIdentifier = prefilledEmail || prefilledPhone;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [phone, setPhone] = useState(prefilledPhone);
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [userType, setUserType] = useState<'student' | 'professional'>('student');

  // const [parentName, setParentName] = useState('');
  // const [parentEmail, setParentEmail] = useState('');
  // const [parentMobile, setParentMobile] = useState('');

  const [profileImage, setProfileImage] = useState<any>(null);
  const [profilePicUri, setProfilePicUri] = useState(AVATAR_PLACEHOLDER);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const [showDOBPicker, setShowDOBPicker] = useState(false);

  const isDefaultAvatar = profilePicUri === AVATAR_PLACEHOLDER;

  // 🔥 DIRECT CAMERA ONLY (NO GALLERY, NO BOTTOM SHEET)
  const takePhoto = async () => {
    const res = await launchCamera({
      mediaType: 'photo',
      quality: 0.7,
      cameraType: 'front',  // front camera by default for better selfies/live photo
    });

    if (res.didCancel) {
      console.log('User cancelled camera');
      return;
    }

    if (res.errorCode) {
      console.log('Camera error:', res.errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Camera Error',
        text2: res.errorMessage || 'Unable to open camera',
      });
      return;
    }

    if (res.assets?.length) {
      const img = res.assets[0];
      setProfilePicUri(img.uri!);
      setProfileImage({
        uri: img.uri,
        type: img.type || 'image/jpeg',
        name: img.fileName || `photo_${Date.now()}.jpg`,
      });
      Toast.show({
        type: 'success',
        text1: 'Photo captured!',
        text2: 'Live photo ready',
      });
    }
  };

  const onDOBChange = (_: any, date?: Date) => {
    setShowDOBPicker(false);
    if (date) {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      setDob(`${d}-${m}-${y}`);
    }
  };

  const handleSendOTP = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Toast.show({ type: 'error', text1: 'Enter full name' });
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Toast.show({ type: 'error', text1: 'Enter a valid email address' });
      return;
    }

    if (!phone.trim() || phone.length !== 10) {
      Toast.show({ type: 'error', text1: 'Enter a valid 10-digit mobile number' });
      return;
    }

    if (!prefilledIdentifier) {
      Toast.show({ type: 'error', text1: 'Missing prefilled identifier' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(SIGNUP_SEND_OTP, { identifier: prefilledIdentifier });

      setOtpSent(true);
      Toast.show({
        type: 'success',
        text1: `OTP sent to your ${prefilledMedium === 'phone' ? 'mobile' : 'email'}`,
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to send OTP';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  const formatDOB = (d: string) => {
    if (!d) return '';
    const [day, month, year] = d.split('-');
    return `${year}-${month}-${day}`;
  };

const handleSubmitProfile = async () => {
    if (!otp.trim()) {
      Toast.show({ type: 'error', text1: 'Enter OTP' });
      return;
    }

    if (!dob) {
      Toast.show({ type: 'error', text1: 'Select date of birth' });
      return;
    }

    if (!gender) {
      Toast.show({ type: 'error', text1: 'Select gender' });
      return;
    }

    // if (userType === 'student') {
    //   if (!parentName.trim()) {
    //     Toast.show({ type: 'error', text1: 'Enter parent name' });
    //     return;
    //   }
    //   if (!parentEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
    //     Toast.show({ type: 'error', text1: 'Enter valid parent email' });
    //     return;
    //   }
    // }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email.trim());
    formData.append('phone', phone);
    formData.append('gender', gender);
    formData.append('userType', userType);
    formData.append('dateOfBirth', formatDOB(dob));
    formData.append('otp', otp);
    formData.append('type', prefilledMedium!);

    // if (userType === 'student') {
    //   formData.append('parentName', parentName.trim());
    //   formData.append('parentEmail', parentEmail.trim());
      // if (parentMobile.trim()) {
      //   formData.append('parentMobile', parentMobile);
      // }
    

    if (profileImage) {
      formData.append('profileImage', profileImage as any);
    }

    setLoading(true);
    try {
      const res = await axios.post(SIGNUP_REGISTER, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        Toast.show({ type: 'success', text1: 'Registration successful 🎉' });
        navigation.replace('Login');
      } else {
        Toast.show({ type: 'error', text1: res.data?.message || 'Registration failed' });
      }
    } catch (e: any) {
  console.log("===== REGISTER ERROR START =====");

  if (e.response) {
    console.log("Status:", e.response.status);
    console.log("Headers:", e.response.headers);
    console.log("Data:", JSON.stringify(e.response.data, null, 2));
  } else if (e.request) {
    console.log("No response received:", e.request);
  } else {
    console.log("Error message:", e.message);
  }

  console.log("Full error object:", e);
  console.log("===== REGISTER ERROR END =====");

  Toast.show({
    type: 'error',
    text1: e?.response?.data?.message || e.message || 'Registration failed',
  });
} finally {
      setLoading(false);
    }
  };


    return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
  >

    {/* 🔒 FIXED TITLE */}
    <View style={styles.header}>
      <Text style={styles.title}>Looks like you are new</Text>
    </View>

    {/* 📜 SCROLLABLE CONTENT */}
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >

        <View style={styles.topRow}>
        <TouchableOpacity style={styles.avatar} onPress={takePhoto}>
  <View style={styles.avatarImageWrapper}>
    <Image source={{ uri: profilePicUri }} style={styles.avatarImg} />
  </View>

  <View style={styles.cameraBadge}>
    <Ionicons name="camera" size={16} color="#fff" />
  </View>
</TouchableOpacity>

          <View style={styles.toggleRow}>
            {['Student', 'Professional'].map((t) => {
              const key = t.toLowerCase() as 'student' | 'professional';
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.toggleBtn, userType === key && styles.toggleActive]}
                  onPress={() => setUserType(key)}
                >
                  <Text style={[styles.toggleText, userType === key && styles.toggleTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.row}>
          <FloatingInput label="First Name*" value={firstName} onChangeText={setFirstName} />
          <FloatingInput label="Last Name*" value={lastName} onChangeText={setLastName} />
        </View>

        <FloatingInput
          label="Mobile Number*"
          value={phone}
          onChangeText={prefilledMedium !== 'phone' ? (text) => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10)) : undefined}
          editable={prefilledMedium !== 'phone'}
          keyboardType="phone-pad"
        />

        <FloatingInput
          label="Email ID*"
          value={email}
          onChangeText={prefilledMedium !== 'email' ? (text) => setEmail(text.toLowerCase().trim()) : undefined}
          editable={prefilledMedium !== 'email'}
          keyboardType="email-address"
        />

        <FloatingInput
          label="Date of Birth*"
          value={dob}
          editable={false}
          onPress={() => setShowDOBPicker(true)}
        />

        <View style={styles.floatWrap}>
          <Text style={styles.floatLabelAlways}>Gender*</Text>

          <View style={styles.genderRow}>
            {['Male', 'Female'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderBtn,
                  gender === g && styles.genderBtnActive,
                ]}
                onPress={() => setGender(g)}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === g && styles.genderTextActive,
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
{/* 
        {userType === 'student' && (
          <>
            <Text style={styles.sectionHeading}>Parents Information</Text>
            <FloatingInput label="Parent Name*" value={parentName} onChangeText={setParentName} />
            <FloatingInput
              label="Parent Email*"
              value={parentEmail}
              onChangeText={(text) => setParentEmail(text.toLowerCase().trim())}
              keyboardType="email-address"
            />
            <FloatingInput
              label="Parent Mobile"
              value={parentMobile}
              onChangeText={(text) => setParentMobile(text.replace(/[^0-9]/g, '').slice(0, 10))}
              keyboardType="phone-pad"
            />
          </>
        )} */}

        {otpSent && (
          <FloatingInput
            label={`Enter OTP (sent to ${prefilledMedium === 'phone' ? 'mobile' : 'email'})*`}
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={otpSent ? handleSubmitProfile : handleSendOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {otpSent ? 'Complete Registration' : 'Send OTP'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 80 }} />

        {showDOBPicker && (
          <DateTimePicker value={new Date()} mode="date" maximumDate={new Date()} onChange={onDOBChange} />
        )}
      </ScrollView>

      <Toast />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F5F5F5' },
 
  title: {
    fontSize: 23,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 24,
    color: COLORS.text,
    fontFamily: 'RethinkSans-ExtraBold',
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
  position: 'relative',   // ✅ important
},
avatarImageWrapper: {
  width: '100%',
  height: '100%',
  borderRadius: 50,
  overflow: 'hidden',     // ✅ image yahin clip hogi
},
header: {
  paddingTop: 24,
  paddingBottom: 10,
  backgroundColor: '#F5F5F5',
  alignItems: 'center',
},
avatarImg: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},
  cameraBadge: {
 position: 'absolute',
    bottom: -5,     // ← neeche shift kiya taaki half outside
    right: -5,      // ← right shift kiya taaki half outside
    backgroundColor: COLORS.primary,
    width: 35,       // ← fixed size for better control
    height: 35,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,  // ← white border taaki overlap clean dikhe
    borderColor: '#fff',
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
  toggleText: { color: COLORS.primary, fontFamily:'RethinkSans-Bold' },
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
    fontFamily:'Quicksand-Regular',
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
 
  genderRow: {
    flexDirection: 'row',
    flex: 1,
    marginTop: 12,
    // padding:7,
    gap: 10,
  },

  genderBtn: {
    flex: 1,
    height: 35,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  genderBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sectionHeading: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 10,
    marginLeft: 4,
    marginTop: 10,
    fontFamily: 'Quicksand-Bold',
  },

  genderText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'Quicksand-Medium',
  },

  genderTextActive: {
    color: '#fff',
  },
});

export default RegisterProfileScreen;