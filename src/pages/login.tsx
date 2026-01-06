import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import OTPTextInput from 'react-native-otp-textinput';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import AuthHeader from '../components/AuthHeader';
import { useAuth } from '../context/AuthContext';
import colors from '../constants/color';
import Config from "react-native-config";
import { getFcmToken, requestNotificationPermission, syncFcmTokenToBackend } from '../user/notificationservice';

export const API_BASE_URL = Config.API_BASE_URL;
const LOGIN_SEND_OTP = `${API_BASE_URL}/api/common/login/request-otp`;
const LOGIN_VERIFY_OTP = `${API_BASE_URL}/api/common/login/verify-otp`;

const OTP_TIMER = 30; // seconds

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [medium, setMedium] = useState<'email' | 'phone' | null>(null);
  const [sentIdentifier, setSentIdentifier] = useState('');
  const [sentMedium, setSentMedium] = useState<'email' | 'phone' | null>(null);
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; phone?: string; otp?: string }>({});
  const [generalError, setGeneralError] = useState('');
  const [timer, setTimer] = useState(OTP_TIMER);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation<any>();
  const { setUser } = useAuth();

  /* ---------------- MASK IDENTIFIER ---------------- */
  const maskIdentifier = (id: string, type: 'email' | 'phone') => {
    if (type === 'email') {
      const atIndex = id.indexOf('@');
      if (atIndex < 3) return id;
      return id.slice(0, 3) + '***' + id.slice(atIndex);
    } else {
      return '******' + id.slice(-4);
    }
  };

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isOTPSent && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    if (timer === 0) {
      setCanResend(true);
    }
    return () => interval && clearInterval(interval);
  }, [isOTPSent, timer]);

  const resetTimer = () => {
    setTimer(OTP_TIMER);
    setCanResend(false);
  };

  /* ---------------- SHAKE ---------------- */
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  /* ---------------- VALIDATION ---------------- */
 const validateIdentifier = () => {
  setErrors({});
  setGeneralError('');

  const trimmedPhone = phone.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedPhone && !trimmedEmail) {
    setGeneralError('Please enter mobile number or email');
    shake();
    return null;
  }

  if (trimmedPhone && trimmedEmail) {
    setGeneralError('Please enter either mobile number or email, not both');
    shake();
    return null;
  }

  if (trimmedPhone) {
    if (trimmedPhone.length !== 10) {
      setErrors({ phone: 'Enter a valid 10-digit mobile number' });
      shake();
      return null;
    }
    return { identifier: trimmedPhone, medium: 'phone' };
  }

  if (trimmedEmail) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrors({ email: 'Enter a valid email address' });
      shake();
      return null;
    }
    return { identifier: trimmedEmail, medium: 'email' };
  }

  return null;
};

  /* ---------------- SEND OTP ---------------- */
const sendOTP = async () => {
  setErrors({});
  setGeneralError('');

  let useIdentifier;
  let useMedium;

  if (!isOTPSent) {
    const result = validateIdentifier();
    if (!result) return;

    useIdentifier = result.identifier;
    useMedium = result.medium;

    // UI ke liye state
    setIdentifier(useIdentifier);
    setMedium(useMedium);
  } else {
    useIdentifier = sentIdentifier;
    useMedium = sentMedium;
  }

  setLoading(true);

  try {
    await axios.post(LOGIN_SEND_OTP, { identifier: useIdentifier });

    Toast.show({
      type: 'success',
      text1: `${isOTPSent ? 'OTP resent to' : 'OTP sent to'} your ${
        useMedium === 'phone' ? 'mobile' : 'email'
      }`,
    });

    setSentIdentifier(useIdentifier);
    setSentMedium(useMedium);
    setIsOTPSent(true);
    resetTimer();

  } catch (e) {
    const msg = e?.response?.data?.message || 'Failed to send OTP';

    // ✅ NEW USER REDIRECTION (RESTORED)
    if (!isOTPSent && msg === 'User not found') {
      navigation.navigate('Signup', {
        [useMedium === 'phone' ? 'phone' : 'verifiedEmail']: useIdentifier,
      });
      return;
    }

    Toast.show({
      type: 'error',
      text1: msg,
    });
    setGeneralError(msg);

  } finally {
    setLoading(false);
  }
};


  /* ---------------- VERIFY OTP ---------------- */
  const verifyOTP = async () => {
    if (!otp.trim()) {
      setErrors({ otp: 'OTP is required' });
      shake();
      Toast.show({ type: 'error', text1: 'OTP is required' });
      return;
    }

    setErrors({});
    setVerifying(true);

    Toast.show({ type: 'info', text1: 'Verifying OTP...' });

    try {
      const res = await axios.post(LOGIN_VERIFY_OTP, { identifier: sentIdentifier, otp });

      if (res.data?.success) {
        const { token, account, loginAs } = res.data;

        await setUser({
          ...account,
          token,
          loginAs,
        });

        const permissionGranted = await requestNotificationPermission();

        if (permissionGranted) {
          const fcmToken = await getFcmToken();
          if (fcmToken) {
            await syncFcmTokenToBackend(token, fcmToken);
          }
        }

        Toast.show({ type: 'success', text1: 'Login successful' });
        return;
      }

      Toast.show({
        type: 'error',
        text1: 'OTP verification failed',
        text2: res.data?.message || 'Invalid OTP',
      });

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Network or server error',
        text2: error?.response?.data?.message || error.message || 'Something went wrong',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <AuthHeader />

        <View style={styles.sheet}>
          <Text style={styles.title}>
            {isOTPSent ? 'Almost there' : 'Sign In'}
          </Text>

          {/* -------- IDENTIFIER SCREEN -------- */}
          {!isOTPSent && (
            <>
              <View style={styles.inputBox}>
                <Text style={styles.code}>+91</Text>
                <View style={styles.divider} />
                <TextInput
                  placeholder="Enter Mobile Number"
                  placeholderTextColor="#B5B5B5"
                  style={styles.input}
                  value={phone}
                  onChangeText={(text) => {
                    const numeric = text.replace(/[^0-9]/g, '').slice(0, 10);
                    setPhone(numeric);
                    if (numeric.length > 0) setEmail('');
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

              <View style={styles.orRow}>
                <View style={styles.line} />
                <Text style={styles.or}>or</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.inputBox}>
                <TextInput
                  placeholder="Enter Email ID"
                  placeholderTextColor="#B5B5B5"
                  style={styles.input}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text.toLowerCase());
                    if (text.trim().length > 0) setPhone('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.email && <Text style={styles.error}>{errors.email}</Text>}
              {generalError && <Text style={styles.error}>{generalError}</Text>}

              <Text style={styles.terms}>
                By continuing, I agree to the{' '}
                <Text style={styles.link}>Term of Use</Text> &{' '}
                <Text style={styles.link}>Privacy Policy</Text>
              </Text>
            </>
          )}

          {/* -------- OTP SCREEN -------- */}
          {isOTPSent && sentIdentifier && sentMedium && (
            <>
              <Text style={styles.otpLabel}>
                Enter the code sent to {maskIdentifier(sentIdentifier, sentMedium)}
              </Text>

              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <OTPTextInput
                  inputCount={6}
                  handleTextChange={setOtp}
                  containerStyle={styles.otpRow}
                  textInputStyle={[
                    styles.otpBox,
                    errors.otp && { borderColor: '#E94235' },
                  ]}
                />
              </Animated.View>

              {errors.otp && <Text style={styles.error}>{errors.otp}</Text>}
            </>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={isOTPSent ? verifyOTP : sendOTP}
            disabled={loading || verifying}
          >
            {(loading || verifying) ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isOTPSent ? 'Verify' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>

          {isOTPSent && (
            <>
              <TouchableOpacity onPress={sendOTP} disabled={!canResend}>
                <Text style={styles.resend}>
                  Didn’t receive {sentMedium === 'phone' ? 'SMS' : 'email'}?{' '}
                  <Text style={[styles.resendSpan, !canResend && { opacity: 0.5 }]}>
                    Resend
                  </Text>
                </Text>
              </TouchableOpacity>

              {!canResend && (
                <Text style={styles.timer}>
                  0:{timer < 10 ? `0${timer}` : timer}
                </Text>
              )}
            </>
          )}
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff' },
  sheet: { marginTop: -60, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 20, color: '#3E2A1F' },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#616161', borderRadius: 12, height: 52, paddingHorizontal: 14, marginBottom: 14 },
  code: { color: '#7A7A7A', fontSize: 16,fontFamily:'Quicksand-Regular' },
  divider: { width: 1, height: 24, backgroundColor: '#616161', marginHorizontal: 10 },
  input: { flex: 1, fontSize: 18,fontFamily:'Quicksand-Regular' },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  line: { flex: 1, height: 1, backgroundColor: '#E0E0E0',marginHorizontal:20, },
  or: { marginHorizontal: 10, color: '#616161' },
  otpLabel: { marginBottom: 10, color: colors.nBlack, fontFamily: 'Quicksand-Medium' },
  otpRow: { justifyContent: 'space-between', marginBottom: 10 },
  otpBox: { width: 45, height: 50, borderWidth: 1, borderColor: '#F2A65A', borderRadius: 10, textAlign: 'center', fontSize: 18 },
  resend: { textAlign: 'center', color: colors.nBlack, marginTop: 50, fontSize: 16, fontFamily: 'Quicksand-Medium' },
  resendSpan: { color: colors.nSlate, fontWeight: '700', fontFamily: 'Quicksand-Medium' },
  timer: { textAlign: 'center', color: colors.nTimer, marginTop: 4 },
  terms: { fontSize: 14, color: '#444', lineHeight: 16.5, letterSpacing: 0, marginBottom: 14, marginTop: 10, fontFamily: 'Quicksand-Regular' },
  link: { color: '#E94235' },
  button: { backgroundColor: '#F6A452', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: '600', fontFamily: 'Quicksand-Bold' },
  error: { color: '#E94235', marginBottom: 8, marginTop: 4 },
});

export default LoginScreen;