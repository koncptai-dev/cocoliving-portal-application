import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Image,
  Platform,
  PermissionsAndroid,
  KeyboardAvoidingView,
  Alert,
  ScrollView,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const BASE_URL_APP = 'https://staging.cocoliving.in';
const DIGI_BASE = 'https://prod.idto.ai';
const DIGI_API_KEY = 'RulAcOY0Axe9nHs85tNQsP0gN6o2kzGrhrpWcOoLCWI';
const DIGI_CLIENT_ID = '8391f987-7531-4b74-bcef-d3607d9a6cab';




const VerificationStatusScreen = () => {
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation();

  const [otpFor, setOtpFor] = useState<null | 'phone' | 'email'>(null);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const [panNumber, setPanNumber] = useState('');
  const [panImage, setPanImage] = useState<any>(null);
  const [panUploading, setPanUploading] = useState(false);

  const [aadhaarFront, setAadhaarFront] = useState<any>(null);
  const [aadhaarBack, setAadhaarBack] = useState<any>(null);
  const [aadhaarMobile, setAadhaarMobile] = useState(user?.phone || ''); // Web jaisa mobile input
  const [aadhaarVerifying, setAadhaarVerifying] = useState(false);

  const [isPanVerifiedLocal, setIsPanVerifiedLocal] = useState(user?.isPanVerified || false);
const [verifiedPanNumber, setVerifiedPanNumber] = useState('');

useEffect(() => {
  if (user?.isPanVerified !== isPanVerifiedLocal) {
    setIsPanVerifiedLocal(user?.isPanVerified || false);
    if (user?.isPanVerified) {
      setVerifiedPanNumber(user?.panNumber || ''); // if you have panNumber in user object
    }
  }
}, [user?.isPanVerified]);

useEffect(() => {
  const checkPanStatus = async () => {
    if (!user?.token) return;
    
    try {
      const res = await axios.get(`${BASE_URL_APP}/api/pan/pan-status`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      
      if (res.data?.panStatus === 'verified') {
        setIsPanVerifiedLocal(true);
        setVerifiedPanNumber(res.data?.panNumber || '');
        // Optional: also update context if needed
        refreshUser();
      }
    } catch (err) {
      console.log('PAN status check failed', err);
    }
  };

  checkPanStatus();
}, [user?.token]);

  // Deep link handling for DigiLocker callback
useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      console.log('Deep link received:', url);
      if (!url || !url.includes('digilocker/callback')) return;

      try {
        const uri = new URL(url);
        const params = new URLSearchParams(uri.search);

        const code = params.get('code');
        const codeVerifier = params.get('codeVerifier'); // web mein decodeURIComponent tha, yahan direct le rahe

        if (!code || !codeVerifier) {
          throw new Error('Missing code or codeVerifier in callback');
        }

        console.log('Code:', code);
        console.log('Code Verifier:', codeVerifier);

        // Step 1: Get reference key (same as web)
        const refRes = await axios.post(
          `${BASE_URL_APP}/api/digilocker/get-reference`,
          {
            code,
            code_verifier: codeVerifier,
          },
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          }
        );

        const referenceKey = refRes.data?.data?.reference_key;
        console.log('Reference Key:', referenceKey);

        if (!referenceKey) {
          throw new Error('Reference key not received from backend');
        }

        // Step 2: Fetch Aadhaar data + complete verification
        const aadhaarRes = await axios.post(
          `${BASE_URL_APP}/api/digilocker/fetch-aadhaar`,
          { reference_key: referenceKey },
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          }
        );

        console.log('Aadhaar fetch response:', aadhaarRes.data);

        if (aadhaarRes.data?.ekycStatus === 'verified') {
          Toast.show({
            type: 'success',
            text1: 'Aadhaar Verified Successfully!',
            text2: 'DigiLocker se KYC complete',
          });
          refreshUser();
        } else {
          const reason = aadhaarRes.data?.failureReason || 'Verification failed';
          Toast.show({
            type: 'error',
            text1: 'Aadhaar Verification Failed',
            text2: reason,
          });
        }

      } catch (err: any) {
        console.error('DigiLocker callback failed:', err);
        Toast.show({
          type: 'error',
          text1: 'Callback Processing Failed',
          text2: err?.response?.data?.message || err.message || 'Please try again',
        });
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then(initialUrl => {
      if (initialUrl) handleDeepLink({ url: initialUrl });
    });

    return () => subscription.remove();
  }, [user?.token, refreshUser]);

  // ─── Image Picker ────────────────────────────────────────────────────────────────
  const pickImage = async (setImageFn: (img: any) => void) => {
    if (Platform.OS === 'android') {
      let permissions: string[] = [PermissionsAndroid.PERMISSIONS.CAMERA];

      if (Platform.Version < 33) {
        permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      } else {
        permissions.push('android.permission.READ_MEDIA_IMAGES');
      }

      try {
        const granted = await PermissionsAndroid.requestMultiple(permissions);

        const denied = Object.entries(granted).filter(
          ([_, status]) => status !== PermissionsAndroid.RESULTS.GRANTED
        );

        if (denied.length > 0) {
          Toast.show({
            type: 'error',
            text1: 'Permission Denied',
            text2: 'Photos & camera access needed. Please enable in settings.',
          });

          Alert.alert(
            'Permission Required',
            'Allow access to photos/camera to upload documents?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
      } catch (err) {
        console.warn('Permission request failed:', err);
      }
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) {
          console.log('Image picker cancelled');
          return;
        }

        if (response.errorCode) {
          console.log('ImagePicker error:', response.errorCode, response.errorMessage);
          Toast.show({
            type: 'error',
            text1: 'Could not open gallery',
            text2: response.errorMessage || 'Unknown error',
          });
          return;
        }

        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          console.log('Picked image:', {
            uri: asset.uri,
            name: asset.fileName,
            type: asset.type,
            size: asset.fileSize,
          });
          setImageFn(asset);
        }
      }
    );
  };

  const imagePickerOptions = {
    mediaType: 'photo',
    quality: 0.8,
    includeBase64: false,
  };

  const openCamera = async (setImageFn: (img: any) => void) => {
    const res = await launchCamera(imagePickerOptions);

    if (res.didCancel) return;

    if (res.errorCode) {
      Toast.show({ type: 'error', text1: 'Camera error' });
      return;
    }

    if (res.assets?.[0]) {
      setImageFn(res.assets[0]);
    }
  };

  const openGallery = async (setImageFn: (img: any) => void) => {
    const res = await launchImageLibrary(imagePickerOptions);

    if (res.didCancel) return;

    if (res.errorCode) {
      Toast.show({ type: 'error', text1: 'Gallery error' });
      return;
    }

    if (res.assets?.[0]) {
      setImageFn(res.assets[0]);
    }
  };

  const selectImage = (setImageFn: (img: any) => void) => {
    Alert.alert(
      'Upload Document',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => openCamera(setImageFn) },
        { text: 'Gallery', onPress: () => openGallery(setImageFn) },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // ─── OTP Functions ────────────────────────────────────────────────────────────────
  const sendOTP = async (type: 'phone' | 'email') => {
    try {
      setOtpLoading(true);
      await axios.post(
        `${BASE_URL_APP}/api/user/profile/verify/send-otp`,
        { type, identifier: type === 'phone' ? user?.phone : user?.email },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      Toast.show({ type: 'success', text1: 'OTP Sent' });
      setOtpFor(type);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to send OTP',
        text2: err?.response?.data?.message || 'Try again',
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim()) {
      Toast.show({ type: 'error', text1: 'Enter OTP' });
      return;
    }

    try {
      setOtpLoading(true);
      const res = await axios.post(
        `${BASE_URL_APP}/api/user/profile/verify/verify-otp`,
        {
          type: otpFor,
          identifier: otpFor === 'phone' ? user?.phone : user?.email,
          otp,
        },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      if (
        (otpFor === 'phone' && res.data?.isPhoneVerified) ||
        (otpFor === 'email' && res.data?.isEmailVerified)
      ) {
        Toast.show({ type: 'success', text1: 'Verified' });
        setOtpFor(null);
        setOtp('');
        refreshUser();
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: err?.response?.data?.message || undefined,
      });
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── PAN Submit ────────────────────────────────────────────────────────────────
const handlePanSubmit = async () => {
  if (!panNumber.trim()) {
    Toast.show({ type: 'error', text1: 'Please Enter PAN Number' });
    return;
  }

  if (!panImage) {
    Toast.show({ type: 'error', text1: 'Please Upload PAN Card Image' });
    return;
  }

  const upperPan = panNumber.trim().toUpperCase();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(upperPan)) {
    Toast.show({
      type: 'error',
      text1: 'Invalid PAN format',
      text2: 'Example: ABCDE1234F',
    });
    return;
  }

  setPanUploading(true);

  try {
    const formData = new FormData();
    formData.append('panNumber', upperPan);
   formData.append('pan_image', {
  uri: panImage.uri,
  type: panImage.type || 'image/jpeg',
  name: panImage.fileName || `pan_${Date.now()}.jpg`,
} as any);

    const res = await axios.post(
      `${BASE_URL_APP}/api/pan/verify-pan`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    console.log("Response of PAN: ",res)

    // Web jaisa success/failure handling
if (res.data?.success || res.data?.panStatus === 'verified') {

  console.log("PAN SUCCESS - Local state set to true");
  console.log("Current user.isPanVerified before refresh:", user?.isPanVerified)
  Toast.show({
    type: 'success',
    text1: 'PAN Verified Successfully!',
    text2: res.data?.message || 'Verification complete',
  });

  setPanNumber('');
  setPanImage(null);

  // Immediately reflect in UI (optimistic update)
  setIsPanVerifiedLocal(true);
  setVerifiedPanNumber(upperPan);

  // Then refresh global user
  refreshUser();
    } else {
      const reason = res.data?.failureReason || res.data?.message || 'Verification failed';
      Toast.show({
        type: 'error',
        text1: 'PAN Verification Failed',
        text2: reason,
      });
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message ||
                err?.response?.data?.failureReason ||
                'Something went wrong. Try again.';
    Toast.show({
      type: 'error',
      text1: 'Error during verification',
      text2: msg,
    });
  } finally {
    setPanUploading(false);
  }
};

  // ─── DigiLocker Flow (Web jaisa - ek hi button) ─────────────────────────────────
  const startAadhaarFlow = async () => {
    if (aadhaarVerifying) return;

    const mobileToUse = aadhaarMobile.trim();
    if (mobileToUse.length !== 10 || !/^[6-9]\d{9}$/.test(mobileToUse)) {
      Toast.show({
        type: 'error',
        text1: 'Valid 10-digit mobile number daalo',
        text2: 'Aadhaar se linked number hone chahiye',
      });
      return;
    }

    setAadhaarVerifying(true);

    try {
      // 1. Verify account
      const verifyRes = await axios.post(
        `${BASE_URL_APP}/api/digilocker/verify-account`,
        { mobile_number: mobileToUse },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const accountFound = verifyRes.data?.data?.result?.registered ?? false;

      // 2. Initiate session
      const formData = new FormData();
      formData.append('consent', 'true');
      formData.append('consent_purpose', 'KYC Verification');
      formData.append('redirect_url', 'cocoliving://digilocker/callback');
      formData.append('redirect_to_signup', String(!accountFound));
      formData.append('documents_for_consent', JSON.stringify(['aadhaar']));

      // Images optional (web jaisa)
      if (aadhaarFront && aadhaarBack) {
        formData.append('aadhaar_front', {
          uri: aadhaarFront.uri,
          type: aadhaarFront.type || 'image/jpeg',
          name: aadhaarFront.fileName || `aadhaar_front_${Date.now()}.jpg`,
        } as any);

        formData.append('aadhaar_back', {
          uri: aadhaarBack.uri,
          type: aadhaarBack.type || 'image/jpeg',
          name: aadhaarBack.fileName || `aadhaar_back_${Date.now()}.jpg`,
        } as any);
      }

      const sessionRes = await axios.post(
        `${BASE_URL_APP}/api/digilocker/initiate-session`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );


console.log('🧪 initiate-session FULL response:', sessionRes.data);
console.log('🧪 initiate-session data:', sessionRes.data?.data);
console.log('🧪 DigiLocker URL:', sessionRes.data?.data?.url);

      // const digilockerUrl = sessionRes.data?.data?.url;

      // if (!digilockerUrl) {
      //   throw new Error('No DigiLocker URL');
      // }

      // Linking.openURL(digilockerUrl);

//const digilockerUrl = sessionRes.data?.data?.url;


const digilockerUrl =
  sessionRes.data?.data?.url ||
  sessionRes.data?.url ||
  sessionRes.data?.digilockerUrl;

console.log('🔗 DigiLocker URL:', digilockerUrl);

if (!digilockerUrl) {
  throw new Error('No DigiLocker URL');
}

const canOpen = await Linking.canOpenURL(digilockerUrl);
console.log('✅ canOpenURL:', canOpen);

if (!canOpen) {
  Alert.alert(
    'Cannot Open DigiLocker',
    'Device cannot open DigiLocker link'
  );
  return;
}

await Linking.openURL(digilockerUrl);


    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to start DigiLocker',
        text2: err?.response?.data?.message || 'Try again',
      });
    } finally {
      setAadhaarVerifying(false);
    }
  };

  const getStatusIcon = (verified?: boolean) =>
    verified ? (
      <Ionicons name="checkmark-circle" size={24} color="#2AA84F" />
    ) : (
      <Ionicons name="close-circle" size={24} color="#D64545" />
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={{ padding: 4 }}
          >
            <Ionicons name="chevron-back" size={28} color="#7A5F4A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification Status</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            Keep your profile verified for better trust & faster bookings
          </Text>

          {/* Mobile Number */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <Ionicons name="call-outline" size={22} color="#7A5F4A" />
              </View>
              <Text style={styles.label}>Mobile Number</Text>
              {getStatusIcon(user?.isPhoneVerified)}
            </View>

            {!user?.isPhoneVerified && (
              <View style={styles.actionArea}>
                {otpFor !== 'phone' ? (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => sendOTP('phone')}
                    disabled={otpLoading}
                  >
                    {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify Mobile</Text>}
                  </TouchableOpacity>
                ) : (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="#aaa"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                    />
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={verifyOTP}
                      disabled={otpLoading}
                    >
                      {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit OTP</Text>}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Email */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail-outline" size={22} color="#7A5F4A" />
              </View>
              <Text style={styles.label}>Email ID</Text>
              {getStatusIcon(user?.isEmailVerified)}
            </View>

            {!user?.isEmailVerified && (
              <View style={styles.actionArea}>
                {otpFor !== 'email' ? (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => sendOTP('email')}
                    disabled={otpLoading}
                  >
                    {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify Email</Text>}
                  </TouchableOpacity>
                ) : (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="#aaa"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                    />
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={verifyOTP}
                      disabled={otpLoading}
                    >
                      {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit OTP</Text>}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>

          {/* PAN Card */}
      {/* PAN Card */}
<View style={styles.card}>
  <View style={styles.row}>
    <View style={styles.iconContainer}>
      <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#7A5F4A" />
    </View>
    <Text style={styles.label}>PAN Card</Text>

    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {isPanVerifiedLocal ? (
        <>
          {/* <Text style={{ color: '#2AA84F', fontWeight: '600' }}>Verified</Text> */}
          {getStatusIcon(true)}
        </>
      ) : (
        <>
          {/* <Text style={{ color: '#D64545', fontWeight: '500' }}>Pending</Text> */}
          {getStatusIcon(false)}
        </>
      )}
    </View>
  </View>

  {!isPanVerifiedLocal && (
    <View style={styles.actionArea}>
      <TextInput
        style={styles.input}
        placeholder="PAN Number (ABCDE1234F)"
        placeholderTextColor="#616161"
        value={panNumber}
        onChangeText={(t) => setPanNumber(t.toUpperCase())}
        maxLength={10}
        autoCapitalize="characters"
      />

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => selectImage(setPanImage)}
      >
        <Ionicons name="cloud-upload-outline" size={20} color="#5A3F2E" />
        <Text style={styles.uploadText}>
          {panImage ? 'Change PAN Image' : 'Upload PAN Card'}
        </Text>
      </TouchableOpacity>

      {panImage?.uri && (
        <Image source={{ uri: panImage.uri }} style={styles.preview} resizeMode="contain" />
      )}

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handlePanSubmit}
        disabled={panUploading}
      >
        {panUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Submit PAN</Text>
        )}
      </TouchableOpacity>
    </View>
  )}
</View>

          {/* Aadhaar Card - Web jaisa flow (ek hi button) */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <Ionicons name="finger-print-outline" size={22} color="#7A5F4A" />
              </View>
              <Text style={styles.label}>Aadhaar Card</Text>
              {getStatusIcon(user?.isAadhaarVerified)}
            </View>

            {!user?.isAadhaarVerified && (
              <View style={styles.actionArea}>
                <TextInput
                  style={styles.input}
                  placeholder="Mobile number linked with Aadhaar"
                  placeholderTextColor="#aaa"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={aadhaarMobile}
                  onChangeText={(text) => setAadhaarMobile(text.replace(/[^0-9]/g, ''))}
                />

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={startAadhaarFlow}
                  disabled={aadhaarVerifying}
                >
                  {aadhaarVerifying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Verify via DigiLocker</Text>
                  )}
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
                  {/* <View style={{ flex: 1, height: 1, backgroundColor: '#E5D8CF' }} /> */}
                  {/* <Text style={{ marginHorizontal: 16, color: '#777', fontSize: 14 }}>OR</Text> */}
                  {/* <View style={{ flex: 1, height: 1, backgroundColor: '#E5D8CF' }} /> */}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={styles.uploadButtonHalf}
                    onPress={() => selectImage(setAadhaarFront)}
                  >
                    <Ionicons name="image-outline" size={20} color="#5A3F2E" />
                    <Text style={styles.uploadTextSmall}>
                      {aadhaarFront ? 'Front ✓' : 'Upload Front'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.uploadButtonHalf}
                    onPress={() => selectImage(setAadhaarBack)}
                  >
                    <Ionicons name="image-outline" size={20} color="#5A3F2E" />
                    <Text style={styles.uploadTextSmall}>
                      {aadhaarBack ? 'Back ✓' : 'Upload Back'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                  {aadhaarFront?.uri && (
                    <Image source={{ uri: aadhaarFront.uri }} style={styles.previewSmall} />
                  )}
                  {aadhaarBack?.uri && (
                    <Image source={{ uri: aadhaarBack.uri }} style={styles.previewSmall} />
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    // marginTop:20,
    fontWeight: '700',
    color: '#4F3421',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#8C7A6A',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0E8E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FBF6F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  label: {
    fontSize: 16,
    color: '#3E2B24',
    fontWeight: '600',
    flex: 1,
  },
  actionArea: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0E8E0',
  },
  input: {
    backgroundColor: '#FAF8F6',
    borderWidth: 1,
    borderColor: '#E5D8CF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#3E2B24',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#5A3F2E',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF6F2',
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5D8CF',
  },
  uploadButtonHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF6F2',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5D8CF',
  },
  uploadText: {
    color: '#5A3F2E',
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadTextSmall: {
    color: '#5A3F2E',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  previewSmall: {
    flex: 1,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
});

export default VerificationStatusScreen;




// import React, { useState, useEffect } from 'react';
// import {
//   SafeAreaView,
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   ActivityIndicator,
//   Linking,
//   Image,
//   Platform,
//   PermissionsAndroid,
//   KeyboardAvoidingView,
//   Alert,
//   ScrollView,
// } from 'react-native';
// import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// import axios from 'axios';
// import Toast from 'react-native-toast-message';
// import { useAuth } from '../context/AuthContext';
// import { useNavigation } from '@react-navigation/native';

// const BASE_URL_APP = 'https://staging.cocoliving.in';
// const DIGI_BASE = 'https://prod.idto.ai';
// const DIGI_API_KEY = 'RulAcOY0Axe9nHs85tNQsP0gN6o2kzGrhrpWcOoLCWI';
// const DIGI_CLIENT_ID = '8391f987-7531-4b74-bcef-d3607d9a6cab';

// const VerificationStatusScreen = () => {
//   const { user, refreshUser } = useAuth();
//   const navigation = useNavigation();

//   const [otpFor, setOtpFor] = useState<null | 'phone' | 'email'>(null);
//   const [otp, setOtp] = useState('');
//   const [otpLoading, setOtpLoading] = useState(false);

//   const [panNumber, setPanNumber] = useState('');
//   const [panImage, setPanImage] = useState<any>(null);
//   const [panUploading, setPanUploading] = useState(false);

//   const [aadhaarFront, setAadhaarFront] = useState<any>(null);
//   const [aadhaarBack, setAadhaarBack] = useState<any>(null);
//   const [aadhaarMobile, setAadhaarMobile] = useState(user?.phone || ''); // Web jaisa mobile input
//   const [aadhaarVerifying, setAadhaarVerifying] = useState(false);

//   const [isPanVerifiedLocal, setIsPanVerifiedLocal] = useState(user?.isPanVerified || false);
// const [verifiedPanNumber, setVerifiedPanNumber] = useState('');

// useEffect(() => {
//   if (user?.isPanVerified !== isPanVerifiedLocal) {
//     setIsPanVerifiedLocal(user?.isPanVerified || false);
//     if (user?.isPanVerified) {
//       setVerifiedPanNumber(user?.panNumber || ''); // if you have panNumber in user object
//     }
//   }
// }, [user?.isPanVerified]);

// useEffect(() => {
//   const checkPanStatus = async () => {
//     if (!user?.token) return;
    
//     try {
//       const res = await axios.get(`${BASE_URL_APP}/api/pan/pan-status`, {
//         headers: { Authorization: `Bearer ${user.token}` },
//       });
      
//       if (res.data?.panStatus === 'verified') {
//         setIsPanVerifiedLocal(true);
//         setVerifiedPanNumber(res.data?.panNumber || '');
//         // Optional: also update context if needed
//         refreshUser();
//       }
//     } catch (err) {
//       console.log('PAN status check failed', err);
//     }
//   };

//   checkPanStatus();
// }, [user?.token]);

//   // Deep link handling for DigiLocker callback
// useEffect(() => {
//     const handleDeepLink = async ({ url }: { url: string }) => {
//       console.log('Deep link received:', url);
//       if (!url || !url.includes('digilocker/callback')) return;

//       try {
//         const uri = new URL(url);
//         const params = new URLSearchParams(uri.search);

//         const code = params.get('code');
//         const codeVerifier = params.get('codeVerifier'); // web mein decodeURIComponent tha, yahan direct le rahe

//         if (!code || !codeVerifier) {
//           throw new Error('Missing code or codeVerifier in callback');
//         }

//         console.log('Code:', code);
//         console.log('Code Verifier:', codeVerifier);

//         // Step 1: Get reference key (same as web)
//         const refRes = await axios.post(
//           `${BASE_URL_APP}/api/digilocker/get-reference`,
//           {
//             code,
//             code_verifier: codeVerifier,
//           },
//           {
//             headers: { Authorization: `Bearer ${user?.token}` },
//           }
//         );

//         const referenceKey = refRes.data?.data?.reference_key;
//         console.log('Reference Key:', referenceKey);

//         if (!referenceKey) {
//           throw new Error('Reference key not received from backend');
//         }

//         // Step 2: Fetch Aadhaar data + complete verification
//         const aadhaarRes = await axios.post(
//           `${BASE_URL_APP}/api/digilocker/fetch-aadhaar`,
//           { reference_key: referenceKey },
//           {
//             headers: { Authorization: `Bearer ${user?.token}` },
//           }
//         );

//         console.log('Aadhaar fetch response:', aadhaarRes.data);

//         if (aadhaarRes.data?.ekycStatus === 'verified') {
//           Toast.show({
//             type: 'success',
//             text1: 'Aadhaar Verified Successfully!',
//             text2: 'DigiLocker se KYC complete',
//           });
//           refreshUser();
//         } else {
//           const reason = aadhaarRes.data?.failureReason || 'Verification failed';
//           Toast.show({
//             type: 'error',
//             text1: 'Aadhaar Verification Failed',
//             text2: reason,
//           });
//         }

//       } catch (err: any) {
//         console.error('DigiLocker callback failed:', err);
//         Toast.show({
//           type: 'error',
//           text1: 'Callback Processing Failed',
//           text2: err?.response?.data?.message || err.message || 'Please try again',
//         });
//       }
//     };

//     const subscription = Linking.addEventListener('url', handleDeepLink);
//     Linking.getInitialURL().then(initialUrl => {
//       if (initialUrl) handleDeepLink({ url: initialUrl });
//     });

//     return () => subscription.remove();
//   }, [user?.token, refreshUser]);

//   // ─── Image Picker ────────────────────────────────────────────────────────────────
//   const pickImage = async (setImageFn: (img: any) => void) => {
//     if (Platform.OS === 'android') {
//       let permissions: string[] = [PermissionsAndroid.PERMISSIONS.CAMERA];

//       if (Platform.Version < 33) {
//         permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
//       } else {
//         permissions.push('android.permission.READ_MEDIA_IMAGES');
//       }

//       try {
//         const granted = await PermissionsAndroid.requestMultiple(permissions);

//         const denied = Object.entries(granted).filter(
//           ([_, status]) => status !== PermissionsAndroid.RESULTS.GRANTED
//         );

//         if (denied.length > 0) {
//           Toast.show({
//             type: 'error',
//             text1: 'Permission Denied',
//             text2: 'Photos & camera access needed. Please enable in settings.',
//           });

//           Alert.alert(
//             'Permission Required',
//             'Allow access to photos/camera to upload documents?',
//             [
//               { text: 'Cancel', style: 'cancel' },
//               { text: 'Open Settings', onPress: () => Linking.openSettings() },
//             ]
//           );
//           return;
//         }
//       } catch (err) {
//         console.warn('Permission request failed:', err);
//       }
//     }

//     launchImageLibrary(
//       {
//         mediaType: 'photo',
//         quality: 0.8,
//         includeBase64: false,
//       },
//       (response) => {
//         if (response.didCancel) {
//           console.log('Image picker cancelled');
//           return;
//         }

//         if (response.errorCode) {
//           console.log('ImagePicker error:', response.errorCode, response.errorMessage);
//           Toast.show({
//             type: 'error',
//             text1: 'Could not open gallery',
//             text2: response.errorMessage || 'Unknown error',
//           });
//           return;
//         }

//         if (response.assets && response.assets[0]) {
//           const asset = response.assets[0];
//           console.log('Picked image:', {
//             uri: asset.uri,
//             name: asset.fileName,
//             type: asset.type,
//             size: asset.fileSize,
//           });
//           setImageFn(asset);
//         }
//       }
//     );
//   };

//   const imagePickerOptions = {
//     mediaType: 'photo',
//     quality: 0.8,
//     includeBase64: false,
//   };

//   const openCamera = async (setImageFn: (img: any) => void) => {
//     const res = await launchCamera(imagePickerOptions);

//     if (res.didCancel) return;

//     if (res.errorCode) {
//       Toast.show({ type: 'error', text1: 'Camera error' });
//       return;
//     }

//     if (res.assets?.[0]) {
//       setImageFn(res.assets[0]);
//     }
//   };

//   const openGallery = async (setImageFn: (img: any) => void) => {
//     const res = await launchImageLibrary(imagePickerOptions);

//     if (res.didCancel) return;

//     if (res.errorCode) {
//       Toast.show({ type: 'error', text1: 'Gallery error' });
//       return;
//     }

//     if (res.assets?.[0]) {
//       setImageFn(res.assets[0]);
//     }
//   };

//   const selectImage = (setImageFn: (img: any) => void) => {
//     Alert.alert(
//       'Upload Document',
//       'Choose an option',
//       [
//         { text: 'Camera', onPress: () => openCamera(setImageFn) },
//         { text: 'Gallery', onPress: () => openGallery(setImageFn) },
//         { text: 'Cancel', style: 'cancel' },
//       ],
//       { cancelable: true }
//     );
//   };

//   // ─── OTP Functions ────────────────────────────────────────────────────────────────
//   const sendOTP = async (type: 'phone' | 'email') => {
//     try {
//       setOtpLoading(true);
//       await axios.post(
//         `${BASE_URL_APP}/api/user/profile/verify/send-otp`,
//         { type, identifier: type === 'phone' ? user?.phone : user?.email },
//         { headers: { Authorization: `Bearer ${user?.token}` } }
//       );
//       Toast.show({ type: 'success', text1: 'OTP Sent' });
//       setOtpFor(type);
//     } catch (err: any) {
//       Toast.show({
//         type: 'error',
//         text1: 'Failed to send OTP',
//         text2: err?.response?.data?.message || 'Try again',
//       });
//     } finally {
//       setOtpLoading(false);
//     }
//   };

//   const verifyOTP = async () => {
//     if (!otp.trim()) {
//       Toast.show({ type: 'error', text1: 'Enter OTP' });
//       return;
//     }

//     try {
//       setOtpLoading(true);
//       const res = await axios.post(
//         `${BASE_URL_APP}/api/user/profile/verify/verify-otp`,
//         {
//           type: otpFor,
//           identifier: otpFor === 'phone' ? user?.phone : user?.email,
//           otp,
//         },
//         { headers: { Authorization: `Bearer ${user?.token}` } }
//       );

//       if (
//         (otpFor === 'phone' && res.data?.isPhoneVerified) ||
//         (otpFor === 'email' && res.data?.isEmailVerified)
//       ) {
//         Toast.show({ type: 'success', text1: 'Verified' });
//         setOtpFor(null);
//         setOtp('');
//         refreshUser();
//       }
//     } catch (err: any) {
//       Toast.show({
//         type: 'error',
//         text1: 'Invalid OTP',
//         text2: err?.response?.data?.message || undefined,
//       });
//     } finally {
//       setOtpLoading(false);
//     }
//   };

//   // ─── PAN Submit ────────────────────────────────────────────────────────────────
// const handlePanSubmit = async () => {
//   if (!panNumber.trim()) {
//     Toast.show({ type: 'error', text1: 'Please Enter PAN Number' });
//     return;
//   }

//   if (!panImage) {
//     Toast.show({ type: 'error', text1: 'Please Upload PAN Card Image' });
//     return;
//   }

//   const upperPan = panNumber.trim().toUpperCase();
//   if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(upperPan)) {
//     Toast.show({
//       type: 'error',
//       text1: 'Invalid PAN format',
//       text2: 'Example: ABCDE1234F',
//     });
//     return;
//   }

//   setPanUploading(true);

//   try {
//     const formData = new FormData();
//     formData.append('panNumber', upperPan);
//    formData.append('pan_image', {
//   uri: panImage.uri,
//   type: panImage.type || 'image/jpeg',
//   name: panImage.fileName || `pan_${Date.now()}.jpg`,
// } as any);

//     const res = await axios.post(
//       `${BASE_URL_APP}/api/pan/verify-pan`,
//       formData,
//       {
//         headers: {
//           Authorization: `Bearer ${user?.token}`,
//           'Content-Type': 'multipart/form-data',
//         },
//       }
//     );
//     console.log("Response of PAN: ",res)

//     // Web jaisa success/failure handling
// if (res.data?.success || res.data?.panStatus === 'verified') {

//   console.log("PAN SUCCESS - Local state set to true");
//   console.log("Current user.isPanVerified before refresh:", user?.isPanVerified)
//   Toast.show({
//     type: 'success',
//     text1: 'PAN Verified Successfully!',
//     text2: res.data?.message || 'Verification complete',
//   });

//   setPanNumber('');
//   setPanImage(null);

//   // Immediately reflect in UI (optimistic update)
//   setIsPanVerifiedLocal(true);
//   setVerifiedPanNumber(upperPan);

//   // Then refresh global user
//   refreshUser();
//     } else {
//       const reason = res.data?.failureReason || res.data?.message || 'Verification failed';
//       Toast.show({
//         type: 'error',
//         text1: 'PAN Verification Failed',
//         text2: reason,
//       });
//     }
//   } catch (err: any) {
//     const msg = err?.response?.data?.message ||
//                 err?.response?.data?.failureReason ||
//                 'Something went wrong. Try again.';
//     Toast.show({
//       type: 'error',
//       text1: 'Error during verification',
//       text2: msg,
//     });
//   } finally {
//     setPanUploading(false);
//   }
// };

//   // ─── DigiLocker Flow (Web jaisa - ek hi button) ─────────────────────────────────
//   const startAadhaarFlow = async () => {
//     if (aadhaarVerifying) return;

//     const mobileToUse = aadhaarMobile.trim();
//     if (mobileToUse.length !== 10 || !/^[6-9]\d{9}$/.test(mobileToUse)) {
//       Toast.show({
//         type: 'error',
//         text1: 'Valid 10-digit mobile number daalo',
//         text2: 'Aadhaar se linked number hone chahiye',
//       });
//       return;
//     }

//     setAadhaarVerifying(true);

//     try {
//       // 1. Verify account
//       const verifyRes = await axios.post(
//         `${BASE_URL_APP}/api/digilocker/verify-account`,
//         { mobile_number: mobileToUse },
//         { headers: { Authorization: `Bearer ${user.token}` } }
//       );

//       const accountFound = verifyRes.data?.data?.result?.registered ?? false;

//       // 2. Initiate session
//       const formData = new FormData();
//       formData.append('consent', 'true');
//       formData.append('consent_purpose', 'KYC Verification');
//       formData.append('redirect_url', 'cocoliving://digilocker/callback');
//       formData.append('redirect_to_signup', String(!accountFound));
//       formData.append('documents_for_consent', JSON.stringify(['aadhaar']));

//       // Images optional (web jaisa)
//       if (aadhaarFront && aadhaarBack) {
//         formData.append('aadhaar_front', {
//           uri: aadhaarFront.uri,
//           type: aadhaarFront.type || 'image/jpeg',
//           name: aadhaarFront.fileName || `aadhaar_front_${Date.now()}.jpg`,
//         } as any);

//         formData.append('aadhaar_back', {
//           uri: aadhaarBack.uri,
//           type: aadhaarBack.type || 'image/jpeg',
//           name: aadhaarBack.fileName || `aadhaar_back_${Date.now()}.jpg`,
//         } as any);
//       }

//       const sessionRes = await axios.post(
//         `${BASE_URL_APP}/api/digilocker/initiate-session`,
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${user.token}`,
//             'Content-Type': 'multipart/form-data',
//           },
//         }
//       );

//       const digilockerUrl = sessionRes.data?.data?.url;

//       if (!digilockerUrl) {
//         throw new Error('No DigiLocker URL');
//       }

//       Linking.openURL(digilockerUrl);

//     } catch (err: any) {
//       Toast.show({
//         type: 'error',
//         text1: 'Failed to start DigiLocker',
//         text2: err?.response?.data?.message || 'Try again',
//       });
//     } finally {
//       setAadhaarVerifying(false);
//     }
//   };

//   const getStatusIcon = (verified?: boolean) =>
//     verified ? (
//       <Ionicons name="checkmark-circle" size={24} color="#2AA84F" />
//     ) : (
//       <Ionicons name="close-circle" size={24} color="#D64545" />
//     );

//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1 }}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
//     >
//       <ScrollView contentContainerStyle={styles.container}>
//         <View style={styles.header}>
//           <TouchableOpacity
//             onPress={() => navigation.goBack()}
//             activeOpacity={0.7}
//             style={{ padding: 4 }}
//           >
//             <Ionicons name="chevron-back" size={28} color="#7A5F4A" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Verification Status</Text>
//           <View style={{ width: 28 }} />
//         </View>

//         <ScrollView
//           style={{ flex: 1 }}
//           contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
//           keyboardShouldPersistTaps="handled"
//         >
//           <Text style={styles.subtitle}>
//             Keep your profile verified for better trust & faster bookings
//           </Text>

//           {/* Mobile Number */}
//           <View style={styles.card}>
//             <View style={styles.row}>
//               <View style={styles.iconContainer}>
//                 <Ionicons name="call-outline" size={22} color="#7A5F4A" />
//               </View>
//               <Text style={styles.label}>Mobile Number</Text>
//               {getStatusIcon(user?.isPhoneVerified)}
//             </View>

//             {!user?.isPhoneVerified && (
//               <View style={styles.actionArea}>
//                 {otpFor !== 'phone' ? (
//                   <TouchableOpacity
//                     style={styles.actionButton}
//                     onPress={() => sendOTP('phone')}
//                     disabled={otpLoading}
//                   >
//                     {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify Mobile</Text>}
//                   </TouchableOpacity>
//                 ) : (
//                   <>
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Enter 6-digit OTP"
//                       placeholderTextColor="#aaa"
//                       keyboardType="number-pad"
//                       maxLength={6}
//                       value={otp}
//                       onChangeText={setOtp}
//                     />
//                     <TouchableOpacity
//                       style={styles.actionButton}
//                       onPress={verifyOTP}
//                       disabled={otpLoading}
//                     >
//                       {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit OTP</Text>}
//                     </TouchableOpacity>
//                   </>
//                 )}
//               </View>
//             )}
//           </View>

//           {/* Email */}
//           <View style={styles.card}>
//             <View style={styles.row}>
//               <View style={styles.iconContainer}>
//                 <Ionicons name="mail-outline" size={22} color="#7A5F4A" />
//               </View>
//               <Text style={styles.label}>Email ID</Text>
//               {getStatusIcon(user?.isEmailVerified)}
//             </View>

//             {!user?.isEmailVerified && (
//               <View style={styles.actionArea}>
//                 {otpFor !== 'email' ? (
//                   <TouchableOpacity
//                     style={styles.actionButton}
//                     onPress={() => sendOTP('email')}
//                     disabled={otpLoading}
//                   >
//                     {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify Email</Text>}
//                   </TouchableOpacity>
//                 ) : (
//                   <>
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Enter 6-digit OTP"
//                       placeholderTextColor="#aaa"
//                       keyboardType="number-pad"
//                       maxLength={6}
//                       value={otp}
//                       onChangeText={setOtp}
//                     />
//                     <TouchableOpacity
//                       style={styles.actionButton}
//                       onPress={verifyOTP}
//                       disabled={otpLoading}
//                     >
//                       {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit OTP</Text>}
//                     </TouchableOpacity>
//                   </>
//                 )}
//               </View>
//             )}
//           </View>

//           {/* PAN Card */}
//       {/* PAN Card */}
// <View style={styles.card}>
//   <View style={styles.row}>
//     <View style={styles.iconContainer}>
//       <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#7A5F4A" />
//     </View>
//     <Text style={styles.label}>PAN Card</Text>

//     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
//       {isPanVerifiedLocal ? (
//         <>
//           {/* <Text style={{ color: '#2AA84F', fontWeight: '600' }}>Verified</Text> */}
//           {getStatusIcon(true)}
//         </>
//       ) : (
//         <>
//           {/* <Text style={{ color: '#D64545', fontWeight: '500' }}>Pending</Text> */}
//           {getStatusIcon(false)}
//         </>
//       )}
//     </View>
//   </View>

//   {!isPanVerifiedLocal && (
//     <View style={styles.actionArea}>
//       <TextInput
//         style={styles.input}
//         placeholder="PAN Number (ABCDE1234F)"
//         value={panNumber}
//         onChangeText={(t) => setPanNumber(t.toUpperCase())}
//         maxLength={10}
//         autoCapitalize="characters"
//       />

//       <TouchableOpacity
//         style={styles.uploadButton}
//         onPress={() => selectImage(setPanImage)}
//       >
//         <Ionicons name="cloud-upload-outline" size={20} color="#5A3F2E" />
//         <Text style={styles.uploadText}>
//           {panImage ? 'Change PAN Image' : 'Upload PAN Card'}
//         </Text>
//       </TouchableOpacity>

//       {panImage?.uri && (
//         <Image source={{ uri: panImage.uri }} style={styles.preview} resizeMode="contain" />
//       )}

//       <TouchableOpacity
//         style={styles.actionButton}
//         onPress={handlePanSubmit}
//         disabled={panUploading}
//       >
//         {panUploading ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <Text style={styles.btnText}>Submit PAN</Text>
//         )}
//       </TouchableOpacity>
//     </View>
//   )}
// </View>

//           {/* Aadhaar Card - Web jaisa flow (ek hi button) */}
//           <View style={styles.card}>
//             <View style={styles.row}>
//               <View style={styles.iconContainer}>
//                 <Ionicons name="finger-print-outline" size={22} color="#7A5F4A" />
//               </View>
//               <Text style={styles.label}>Aadhaar Card</Text>
//               {getStatusIcon(user?.isAadhaarVerified)}
//             </View>

//             {!user?.isAadhaarVerified && (
//               <View style={styles.actionArea}>
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Mobile number linked with Aadhaar"
//                   placeholderTextColor="#aaa"
//                   keyboardType="phone-pad"
//                   maxLength={10}
//                   value={aadhaarMobile}
//                   onChangeText={(text) => setAadhaarMobile(text.replace(/[^0-9]/g, ''))}
//                 />

//                 <TouchableOpacity
//                   style={styles.actionButton}
//                   onPress={startAadhaarFlow}
//                   disabled={aadhaarVerifying}
//                 >
//                   {aadhaarVerifying ? (
//                     <ActivityIndicator color="#fff" />
//                   ) : (
//                     <Text style={styles.btnText}>Verify via DigiLocker</Text>
//                   )}
//                 </TouchableOpacity>

//                 <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
//                   {/* <View style={{ flex: 1, height: 1, backgroundColor: '#E5D8CF' }} /> */}
//                   {/* <Text style={{ marginHorizontal: 16, color: '#777', fontSize: 14 }}>OR</Text> */}
//                   {/* <View style={{ flex: 1, height: 1, backgroundColor: '#E5D8CF' }} /> */}
//                 </View>

//                 <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//                   <TouchableOpacity
//                     style={styles.uploadButtonHalf}
//                     onPress={() => selectImage(setAadhaarFront)}
//                   >
//                     <Ionicons name="image-outline" size={20} color="#5A3F2E" />
//                     <Text style={styles.uploadTextSmall}>
//                       {aadhaarFront ? 'Front ✓' : 'Upload Front'}
//                     </Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={styles.uploadButtonHalf}
//                     onPress={() => selectImage(setAadhaarBack)}
//                   >
//                     <Ionicons name="image-outline" size={20} color="#5A3F2E" />
//                     <Text style={styles.uploadTextSmall}>
//                       {aadhaarBack ? 'Back ✓' : 'Upload Back'}
//                     </Text>
//                   </TouchableOpacity>
//                 </View>

//                 <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
//                   {aadhaarFront?.uri && (
//                     <Image source={{ uri: aadhaarFront.uri }} style={styles.previewSmall} />
//                   )}
//                   {aadhaarBack?.uri && (
//                     <Image source={{ uri: aadhaarBack.uri }} style={styles.previewSmall} />
//                   )}
//                 </View>
//               </View>
//             )}
//           </View>
//         </ScrollView>

//         <Toast />
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8F5F2',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 30,
//     marginBottom: 20,
//     paddingHorizontal: 20,
//   },
//   headerTitle: {
//     flex: 1,
//     fontSize: 22,
//     // marginTop:20,
//     fontWeight: '700',
//     color: '#4F3421',
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 15,
//     color: '#8C7A6A',
//     textAlign: 'center',
//     marginBottom: 24,
//     lineHeight: 22,
//   },
//   card: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: '#F0E8E0',
//     elevation: 1,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.06,
//     shadowRadius: 4,
//   },
//   row: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   iconContainer: {
//     width: 44,
//     height: 44,
//     borderRadius: 12,
//     backgroundColor: '#FBF6F2',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 14,
//   },
//   label: {
//     fontSize: 16,
//     color: '#3E2B24',
//     fontWeight: '600',
//     flex: 1,
//   },
//   actionArea: {
//     marginTop: 16,
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: '#F0E8E0',
//   },
//   input: {
//     backgroundColor: '#FAF8F6',
//     borderWidth: 1,
//     borderColor: '#E5D8CF',
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     fontSize: 16,
//     color: '#3E2B24',
//     marginBottom: 12,
//   },
//   actionButton: {
//     backgroundColor: '#5A3F2E',
//     borderRadius: 30,
//     paddingVertical: 16,
//     alignItems: 'center',
//   },
//   btnText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   uploadButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#FBF6F2',
//     padding: 14,
//     borderRadius: 12,
//     marginVertical: 8,
//     borderWidth: 1,
//     borderColor: '#E5D8CF',
//   },
//   uploadButtonHalf: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#FBF6F2',
//     padding: 12,
//     borderRadius: 10,
//     marginHorizontal: 4,
//     borderWidth: 1,
//     borderColor: '#E5D8CF',
//   },
//   uploadText: {
//     color: '#5A3F2E',
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   uploadTextSmall: {
//     color: '#5A3F2E',
//     fontSize: 13,
//     fontWeight: '600',
//     marginLeft: 6,
//   },
//   preview: {
//     width: '100%',
//     height: 180,
//     borderRadius: 8,
//     marginVertical: 8,
//     backgroundColor: '#f9f9f9',
//   },
//   previewSmall: {
//     flex: 1,
//     height: 120,
//     borderRadius: 8,
//     backgroundColor: '#f9f9f9',
//   },
// });

// export default VerificationStatusScreen;