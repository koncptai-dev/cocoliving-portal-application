import React, { useState } from 'react';
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
  Alert,
  ScrollView,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';

const BASE_URL_APP = 'https://staging.cocoliving.in';
const DIGI_BASE = 'https://prod.idto.ai';
const DIGI_API_KEY = 'RulAcOY0Axe9nHs85tNQsP0gN6o2kzGrhrpWcOoLCWI';
const DIGI_CLIENT_ID = '8391f987-7531-4b74-bcef-d3607d9a6cab';

const VerificationStatusScreen = () => {
  const { user, refreshUser } = useAuth();

  const [otpFor, setOtpFor] = useState<null | 'phone' | 'email'>(null);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const [panNumber, setPanNumber] = useState('');
  const [panImage, setPanImage] = useState<any>(null);
  const [panUploading, setPanUploading] = useState(false);

  const [aadhaarFront, setAadhaarFront] = useState<any>(null);
  const [aadhaarBack, setAadhaarBack] = useState<any>(null);
  const [aadhaarUploading, setAadhaarUploading] = useState(false);
  const [aadhaarVerifying, setAadhaarVerifying] = useState(false);

  // ─── Smart Image Picker ────────────────────────────────────────────────────────────────
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

  const openCamera = async (setImageFn) => {
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

  const openGallery = async (setImageFn) => {
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

  const selectImage = (setImageFn) => {
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

  // ─── Upload Helper ────────────────────────────────────────────────────────────────
  const uploadDocument = async (asset: any, fieldName: string, endpoint: string) => {
    const formData = new FormData();

    formData.append(fieldName, {
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      name: asset.fileName || `img_${Date.now()}.jpg`,
    } as any);

    const res = await axios.post(`${BASE_URL_APP}${endpoint}`, formData, {
      headers: {
        Authorization: `Bearer ${user?.token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
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
// ─── PAN Submit ────────────────────────────────────────────────────────────────
const handlePanSubmit = async () => {
  if (!panNumber) {
    Toast.show({ type: 'error', text1: 'Enter PAN number' });
    return;
  }

  // Optional: Basic PAN format check (10 chars, alphanumeric)
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) {
    Toast.show({
      type: 'error',
      text1: 'Invalid PAN format',
      text2: 'Use format: ABCDE1234F',
    });
    return;
  }

  setPanUploading(true);

  try {
    const response = await axios.post(
      `${BASE_URL_APP}/api/pan/verify-pan`,
      {
        panNumber: panNumber.toUpperCase(),
      },
      {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Success case
    Toast.show({
      type: 'success',
      text1: 'PAN verified successfully',
    });

    setPanNumber('');
    setPanImage(null);     // agar image bhi reset karna hai to
    refreshUser();

  } catch (err: any) {
    const errorData = err?.response?.data;

    console.log('PAN submit error:', errorData || err.message);

    let toastMessage = 'PAN verification failed';
    let toastSubMessage = 'Please try again';

    // Web jaisa detailed failure reason dikhane ke liye
    if (errorData && errorData.success === false) {
      if (errorData.failureReason) {
        toastSubMessage = errorData.failureReason;
      } else if (errorData.message && errorData.message !== 'PAN verification failed') {
        toastSubMessage = errorData.message;
      }
    }

    Toast.show({
      type: 'error',
      text1: toastMessage,
      text2: toastSubMessage,
      visibilityTime: 5000,     
    });
  } finally {
    setPanUploading(false);
  }
};

  // ─── Aadhaar Image Upload ──────────────────────────────────────────────────────
  const handleAadhaarUpload = async () => {
    if (!aadhaarFront || !aadhaarBack) {
      Toast.show({ type: 'error', text1: 'Both front & back required' });
      return;
    }

    setAadhaarUploading(true);

    try {
      await Promise.all([
        uploadDocument(aadhaarFront, 'aadhaarFront', '/api/kyc/upload-aadhaar-front'),
        uploadDocument(aadhaarBack, 'aadhaarBack', '/api/kyc/upload-aadhaar-back'),
      ]);

      Toast.show({ type: 'success', text1: 'Aadhaar images submitted' });
      setAadhaarFront(null);
      setAadhaarBack(null);
      refreshUser();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: err?.response?.data?.message || err.message,
      });
    } finally {
      setAadhaarUploading(false);
    }
  };

  // ─── DigiLocker Flow ────────────────────────────────────────────────────────────
  const startAadhaarFlow = async () => {
    try {
      setAadhaarVerifying(true);
      const res = await axios.post(
        `${DIGI_BASE}/verify/digilocker/initiate_session`,
        {
          consent: true,
          consent_purpose: 'KYC Verification',
          redirect_url: 'cocoliving://digilocker/callback',
          documents_for_consent: ['aadhaar'],
        },
        {
          headers: {
            'X-API-KEY': DIGI_API_KEY,
            'X-Client-ID': DIGI_CLIENT_ID,
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (res?.data?.url) {
        Linking.openURL(res.data.url);
      } else {
        throw new Error('No redirect URL');
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to start DigiLocker' });
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chevron-back" size={28} color="#7A5F4A" />
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
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#7A5F4A" />
            </View>
            <Text style={styles.label}>PAN Card</Text>
            {getStatusIcon(user?.isPanVerified)}
          </View>

          {!user?.isPanVerified && (
            <View style={styles.actionArea}>
              <TextInput
                style={styles.input}
                placeholder="PAN Number (ABCDE1234F)"
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

        {/* Aadhaar Card */}
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
              <TouchableOpacity
                style={styles.actionButton}
                onPress={startAadhaarFlow}
                disabled={aadhaarVerifying}
              >
                {aadhaarVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Verify via DigiLocker (Recommended)</Text>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E5D8CF' }} />
                <Text style={{ marginHorizontal: 16, color: '#777', fontSize: 14 }}>OR</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E5D8CF' }} />
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

              <TouchableOpacity
                style={[styles.actionButton, { marginTop: 16 }]}
                onPress={handleAadhaarUpload}
                disabled={aadhaarUploading || !aadhaarFront || !aadhaarBack}
              >
                {aadhaarUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Submit Aadhaar Images</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Toast />
    </SafeAreaView>
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
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
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