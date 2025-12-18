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
// const API_BASE_URL = "http://10.0.2.2:5001"; // backend
const API_BASE_URL = 'https://staging.cocoliving.in';
const LOGIN_SEND_OTP = `${API_BASE_URL}/api/common/login/request-otp`;
const LOGIN_VERIFY_OTP = `${API_BASE_URL}/api/common/login/verify-otp`;

const OTP_TIMER = 30; // seconds

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(OTP_TIMER);
  const [canResend, setCanResend] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();
  const { setUser } = useAuth();

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    let interval;
    if (isOTPSent && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }

    if (timer === 0) {
      setCanResend(true);
    }

    return () => clearInterval(interval);
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
  const validateEmail = () => {
    if (!email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return 'Enter valid email';
    return '';
  };

  /* ---------------- SEND OTP ---------------- */
 const sendOTP = async () => {
  const err = validateEmail();
  if (err) return setErrors({ email: err });

  setErrors({});
  setLoading(true);

  try {
    const res=await axios.post(LOGIN_SEND_OTP, { email });
    console.log("Response of login: ",res)

    Toast.show({
      type: 'success',
      text1: 'OTP sent to your email',
    });

    setIsOTPSent(true);
    resetTimer();

  } catch (e) {
    const msg = e?.response?.data?.message || '';

    // 🔥 IMPORTANT: First-time user case
    if (msg === 'Email not found') {
      Toast.show({
        type: 'info',
        text1: 'Account not found',
        text2: 'Please sign up to continue',
      });

      navigation.navigate('Signup', {
        verifiedEmail: email, 
      });
      return;
    }

    // Other errors
    Toast.show({
      type: 'error',
      text1: msg || 'Failed to send OTP',
    });
  } finally {
    setLoading(false);
  }
};

  /* ---------------- VERIFY OTP ---------------- */
  const verifyOTP = async () => {
    if (!otp.trim()) {
      setErrors({ otp: 'Enter OTP' });
      shake();
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await axios.post(LOGIN_VERIFY_OTP, { email, otp });
      const { token, account } = res.data;

      await setUser({ ...account, token });

      Toast.show({ type: 'success', text1: 'Login successful' });

      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeTabs' }],
      });
    } catch (e) {
      setErrors({ otp: 'Wrong code, Please try again!' });
      shake();
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
        <AuthHeader />

        <View style={styles.sheet}>
          <Text style={styles.title}>
            {isOTPSent ? 'Almost there' : 'Sign In'}
          </Text>

          {/* -------- EMAIL SCREEN -------- */}
          {!isOTPSent && (
            <>
              <View style={styles.inputBox}>
                <Text style={styles.code}>+91</Text>
                <View style={styles.divider} />
                <TextInput
                  placeholder="Enter Mobile Number"
                  placeholderTextColor="#B5B5B5"
                  style={styles.input}
                  editable={false}
                />
              </View>

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
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>

              {errors.email && <Text style={styles.error}>{errors.email}</Text>}

              <Text style={styles.terms}>
                By continuing, I agree to the{' '}
                <Text style={styles.link}>Term of Use</Text> &{' '}
                <Text style={styles.link}>Privacy Policy</Text>
              </Text>
            </>
          )}

          {/* -------- OTP SCREEN -------- */}
         {isOTPSent && (
  <>
    <Text style={styles.otpLabel}>
      Enter code sent on your email
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
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isOTPSent ? 'Verify' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          {isOTPSent && (
  <>
    <TouchableOpacity
      onPress={sendOTP}
      disabled={!canResend}
    >
    <Text style={styles.resend}>
        Didn’t receive email?{' '}
        <Text
          style={[
            styles.resendSpan,
            !canResend && { opacity: 0.5 },
          ]}
        >
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

  sheet: {
    marginTop: -60,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    color: '#3E2A1F',
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#616161',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  code: { color: '#7A7A7A', fontSize: 16 },
  divider: { width: 1, height: 24, backgroundColor: '#616161', marginHorizontal: 10 },
  input: { flex: 1, fontSize: 16 },

  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  line: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  or: { marginHorizontal: 10, color: '#616161' },

  otpLabel: { marginBottom: 10, color: colors.nBlack,fontFamily: 'Quicksand-Medium'
 },

  otpRow: { justifyContent: 'space-between', marginBottom: 10 },
  otpBox: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: '#F2A65A',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
  },

  resend: {
  textAlign: 'center',
  color: colors.nBlack,
  marginTop: 50,
  fontSize:16,
  letterSpacing: 0,
  fontFamily: 'Quicksand-Medium'

},
resendSpan: {
  color: colors.nSlate,     // 🔥 brand / highlight color
  fontWeight: '700',
  letterSpacing: 0,
  fontFamily: 'Quicksand-Medium'

},

timer: {
  textAlign: 'center',
  color: colors.nTimer,
  marginTop: 4,
  letterSpacing: 0,
},

 terms: {
  fontSize: 14,
  color: '#444',
  lineHeight: 16.5,      // ✅ Figma exact
  letterSpacing: 0,     // ✅ 0px
  marginBottom: 14,
  fontFamily: 'Quicksand-Regular'

},
  link: { color: '#E94235' },

  button: {
    backgroundColor: '#F6A452',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: { color: '#fff', fontSize: 20, fontWeight: '600', fontFamily: 'Quicksand-Bold' },

  error: { color: '#E94235', marginBottom: 8 },

});

export default LoginScreen;
