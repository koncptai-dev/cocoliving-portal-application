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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';
import colors from '../constants/color';
const COLORS = {
  textDark: '#5C4435',
  textMedium: '#8A7160',
  background: '#F7F7F7',
  inputBg: '#EFE8E2',
  brown: '#5C4435',
  lightBrown: '#BBAA8B',
  border: '#C9B297',
  primary: '#5C4435',
  success: '#1BA100',
  error: '#B00020',
  icon: '#BBAA8B'
};

const PROFILE_PLACEHOLDER = 'https://placehold.co/100x100/808080/FFFFFF?text=PIC';

// const API_BASE_URL ='https://staging.cocoliving.in'
const API_BASE_URL="http://10.0.2.2:5001";

const RegisterProfileScreen = ({ 
    navigation = { navigate: defaultNavigate }, 
    route = { params: {} }
}) => {
  const verifiedEmail = route?.params?.verifiedEmail || 'user.email@default.com';
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicUri, setProfilePicUri] = useState(PROFILE_PLACEHOLDER);
  const [uploading, setUploading] = useState(false);
  const [email] = useState(verifiedEmail);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [userType, setUserType] = useState('student');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
const [otpSent, setOtpSent] = useState(false);
const [otp, setOtp] = useState("");
const [sendingOtp, setSendingOtp] = useState(false);
const [phone, setPhone] = useState('');

  // Password requirements
  const isLengthValid = password.length >= 8;
  const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);

  // Launch image picker
  const handlePicPress = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });
    if (result.assets && result.assets.length > 0) {
      setProfilePic(result.assets[0]);
      setProfilePicUri(result.assets[0].uri);
    }
  };


  const formatDOB = (val) => {
  const parts = val.split("-");
  // if user enters DD-MM-YYYY convert → YYYY-MM-DD
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};
const handleSendOTP = async () => {
  setSendingOtp(true);
  try {
    const res = await axios.post(`http://10.0.2.2:5001/api/user/send-otp`, { email, fullName });
    setOtpSent(true);

    Toast.show({
      type: "success",
      text1: "OTP Sent",
      text2: res.data?.message || "OTP sent successfully"
    });

  } catch (e) {
    Toast.show({
      type: "error",
      text1: "Failed",
      text2: e.response?.data?.message || "Unable to send OTP"
    });
  } finally {
    setSendingOtp(false);
  }
};
  // Save profile (POST API)
const handleSubmitProfile = async () => {
  if (!otp) {
    Toast.show({
      type: "error",
      text1: "OTP Required",
      text2: "Please enter OTP",
    });
    return;
  }

  setUploading(true);

  try {
    const payload = {
      fullName,
      email,
      phone,
      gender,
      userType,
      dateOfBirth: formatDOB(dob),
      otp
    };

    const res = await axios.post(`${API_BASE_URL}/api/user/register`, payload);
    console.log("REGISTER RESPONSE → ", res.data);

    if (res.data?.success) {
      Toast.show({
        type: "success",
        text1: "Registration successful! 🎉",
        text2: "Please login to continue",
      });
      setUploading(false); // Add yeh line
      navigation.navigate("Login", {
        email,
        fullName,
      });
      return;
    }

    // Non-success case
    Toast.show({
      type: "error",
      text1: "Failed",
      text2: res.data?.message || "Registration failed",
    });
    setUploading(false); // Add yeh

  } catch (err) {
    console.log("REGISTER ERR → ", err?.response?.data);
    setUploading(false); // Yeh sabse important - catch ke start mein hi reset kar do, taaki loading ruk jaaye

    const data = err?.response?.data;
console.log("🔥 About to show toast: ", data.message);
    if (data?.message) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: data.message,
      });
      // return;
    }

    // case 1: multiple validation errors
    if (data?.errors && Array.isArray(data.errors)) {
      data.errors.forEach((e) => {
        Toast.show({
          type: "error",
          text1: "Validation Error",
          text2: e.msg,
        });
      });
      return;
    }

    // case 2: single message (Incorrect OTP, OTP expired etc.)
    if (data?.message) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: data.message,
      });
      return;
    }

    // fallback
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Something went wrong",
    });
  }
};





  // UI for requirements
  const renderRequirement = (label, valid) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <Ionicons
        name={valid ? 'checkmark-circle' : 'close-circle'}
        size={16}
        color={valid ? COLORS.success : COLORS.icon}
        style={{ marginRight: 6 }}
      />
      <Text style={{ color: valid ? COLORS.success : COLORS.textMedium, fontSize: 13 }}>{label}</Text>
    </View>
  );

return (
  <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.background }}>
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

      {/* Profile Section Wrapper START */}
      <View style={{ marginBottom: 20 }}>

        <Text style={{
          fontSize: 21,
          fontWeight: '700',
          color: COLORS.textDark,
          textAlign: 'center',
          marginBottom: 16,
          marginTop: 8
        }}>
          Profile
        </Text>

        {/* 🟢 I am (Student/Professional) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ flex: 1, alignItems: 'flex-end', marginLeft: 20 }}>
            <Text style={[styles.iamText, { textAlign: 'right', marginBottom: 6 }]}>I am</Text>
            <View style={[styles.userTypeRow, { alignSelf: 'flex-end' }]}>
              <TouchableOpacity
                style={[styles.userTypeButton, userType === 'student' && styles.activeType]}
                onPress={() => setUserType('student')}
              >
                <Text style={[styles.userTypeText, userType === 'student' && styles.activeTypeText]}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.userTypeButton, userType === 'professional' && styles.activeType]}
                onPress={() => setUserType('professional')}
              >
                <Text style={[styles.userTypeText, userType === 'professional' && styles.activeTypeText]}>Professional</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 🟢 Email (non editable) */}
        <View style={[styles.iconInput, { opacity: 0.7 }]}>
          <MaterialCommunityIcons name="email-outline" size={18} color={colors.newPlaceHolder}/>
          <View style={styles.verticalDivider}/>
          <TextInput
            style={styles.inputField}
            placeholder="Email Address"
            placeholderTextColor={colors.newPlaceHolder}
            value={email}
            editable={false}
          />
        </View>

        {/* 🟢 Full Name */}
        <View style={styles.iconInput}>
          <Ionicons name="person-outline" size={18} color={colors.newPlaceHolder}/>
          <View style={styles.verticalDivider}/>
          <TextInput
            style={styles.inputField}
            placeholder="Full Name"
            placeholderTextColor={colors.newPlaceHolder}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* 🟢 Phone */}
        <View style={styles.iconInput}>
          <Ionicons name="call-outline" size={18} color={colors.newPlaceHolder}/>
          <View style={styles.verticalDivider}/>
          <TextInput
            style={styles.inputField}
            placeholder="Phone Number"
            placeholderTextColor={colors.newPlaceHolder}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* 🟢 DOB */}
        <View style={styles.iconInput}>
          <MaterialCommunityIcons name="calendar-account-outline" size={18} color={colors.newPlaceHolder}/>
          <View style={styles.verticalDivider}/>
          <TextInput
  placeholder="DD-MM-YYYY"
  value={dob}
  onChangeText={setDob}
/>
        </View>

        {/* 🟢 Gender */}
        <View style={[styles.iconInput, { alignItems: 'center', marginBottom: 15 }]}>
          <MaterialCommunityIcons name="human-male-female" size={18} color={colors.newPlaceHolder}/>
          <View style={styles.verticalDivider}/>
          <View style={{ flexDirection: 'row', marginLeft: 6 }}>
            {['Male', 'Female', 'Other'].map(g => (
              <TouchableOpacity key={g} style={styles.genderButton} onPress={() => setGender(g)}>
                <Ionicons
                  name={gender === g ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={gender === g ? COLORS.primary : colors.newPlaceHolder}
                />
                <Text style={[styles.genderLabel, gender === g && { color: COLORS.primary }]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 🟢 OTP FLOW */}
        {!otpSent ? (
          <TouchableOpacity style={styles.saveButton} onPress={handleSendOTP}>
            {sendingOtp
              ? <ActivityIndicator color="#fff"/>
              : <Text style={styles.saveText}>Send OTP</Text>}
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.iconInput}>
              <MaterialCommunityIcons name="key-outline" size={18} color={colors.newPlaceHolder}/>
              <View style={styles.verticalDivider}/>
              <TextInput
                style={styles.inputField}
                placeholder="Enter OTP"
                placeholderTextColor={colors.newPlaceHolder}
                keyboardType="numeric"
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSubmitProfile}>
              {uploading
                ? <ActivityIndicator color="#fff"/>
                : <Text style={styles.saveText}>Submit</Text>}
            </TouchableOpacity>
          </>
        )}

      </View>  {/* ← MISSING CLOSING VIEW FIXED HERE */}
      {/* END PROFILE SECTION */}

    </ScrollView>
  </KeyboardAvoidingView>
);

};

const styles = StyleSheet.create({
  container: {
  flexGrow: 1,
  paddingHorizontal: 15, // ya jitna bhi margin chahiye
  backgroundColor: COLORS.background
},
  picContainer: { position: 'relative', width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  profilePic: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.newTextColor },
  picIconOverlay: {
    position: 'absolute',
    bottom: 1, right: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 5,
  },
  iamText: { fontSize: 15, fontWeight: 'bold', color:colors.backgroundLight},
  userTypeRow: {
    flexDirection: 'row',
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
    alignSelf: 'flex-start',
    
  },
  userTypeButton: { paddingVertical: 7, paddingHorizontal: 17, backgroundColor: colors.newPlaceHolder },

  activeType: { backgroundColor: COLORS.brown },

  userTypeText: { fontSize: 16, fontWeight: '500', color: '#fff' },

  activeTypeText: { color: '#fff' },
  
 iconInput: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.newBackground,
  borderWidth: 1,
  borderColor: colors.newTextColor,
  borderRadius: 9,
  paddingHorizontal: 10,
  marginBottom: 13,
  height: 40,
  width: '100%',            // fix here
  marginHorizontal: 1,      // same as requirementsBox
  alignSelf: 'stretch',     // so it uses parent width
},
nameRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
  width: '100%',
  marginHorizontal: 1,
  alignSelf: 'stretch',
},
iconInputHalf: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.newBackground,
  borderWidth: 1,
  borderColor: colors.newTextColor,
  borderRadius: 9,
  paddingHorizontal: 10,
  height: 40,
  flex: 1,                  // automatic 50% width
  marginRight: 5,           // thoda gap chahiye to
},
nameInput: {
  flex: 1,
  fontSize: 15,
  color: colors.newTextColor,
  backgroundColor: 'transparent',
  paddingHorizontal: 7,
  height: 40,
},
inputField: {
  flex: 1,
  fontSize: 15,
  color: colors.newTextColor,
  backgroundColor: 'transparent',
  paddingHorizontal: 10,
  height: 40,        // <-- Ensure height here
  // width: '100%'     // optional
},
  rowDivider: {
    width: 1,
    height: 43,
    backgroundColor: COLORS.border,
    marginHorizontal: 7,
    alignSelf: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.newPlaceHolder,
    marginHorizontal: 7,
  },
  // inputField: {
  //   flex: 1,
  //   paddingVertical: 10,
  //   fontSize: 15,
  //   width:345,
  //   height:40,
  //   color: COLORS.textDark,
  //   backgroundColor: 'transparent',
  //   paddingHorizontal: 10,
  // },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 17,
    marginLeft: 0,
  },
  genderLabel: { marginLeft: 3, fontSize: 15, color: COLORS.textDark },
  requirementsBox: {
    marginTop: 2,
    padding: 12,
    // borderRadius: 9,
    // backgroundColor: COLORS.inputBg,
    // borderWidth: 1,
    width:338,
    // borderColor: COLORS.border,
    marginBottom: 18,
    // marginHorizontal: 1
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 11,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 25,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});

export default RegisterProfileScreen;
