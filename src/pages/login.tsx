import React, { useState, useRef, useEffect } from 'react';
import { Linking, ToastAndroid } from 'react-native';
import RNOtpVerify from 'react-native-otp-verify';
import {
  requestNotificationPermission,
  getFcmToken,
  syncFcmTokenToBackend,
} from '../user/notificationservice';

import Icon from 'react-native-vector-icons/Ionicons';
import { StatusBar } from 'react-native';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
  Modal, Dimensions, Image, Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import OTPTextInput from 'react-native-otp-textinput';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const API_BASE_URL = 'https://staging.cocoliving.in';
const CHECK_IDENTIFIER_API = `${API_BASE_URL}/api/common/check-email`;
const LOGIN_SEND_OTP = `${API_BASE_URL}/api/common/login/request-otp`;
const LOGIN_VERIFY_OTP = `${API_BASE_URL}/api/common/login/verify-otp`;

const OTP_TIMER = 30;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');


const openTerms = () => Linking.openURL('https://cocoliving.in/terms-and-conditions');
const openPrivacy = () => Linking.openURL('https://cocoliving.in/privacy-policy');




const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verifiedIdentifier, setVerifiedIdentifier] = useState('');
  const [medium, setMedium] = useState<'email' | 'phone' | null>(null);

const [fakeLoading, setFakeLoading] = useState(false);


const [appHash, setAppHash] = useState<string | null>(null);

const handleBackToLogin = () => {
  setIsOTPSent(false);
  setOtp('');
  setErrors({});
  setTimer(OTP_TIMER);
  setCanResend(false);
};


const [allowAutoOtp, setAllowAutoOtp] = useState<boolean | null>(null);



  const [otp, setOtp] = useState('');
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  const [isAutoOtp, setIsAutoOtp] = useState(false);


  //const isButtonLoading = loading || verifying;

  const isButtonLoading = fakeLoading;

  const [errors, setErrors] = useState<{ identifier?: string; otp?: string }>({});
  const [timer, setTimer] = useState(OTP_TIMER);
  const [canResend, setCanResend] = useState(false);

  const [children, setChildren] = useState<any[]>([]);
  const [childId, setChildId] = useState<number | null>(null);
  const [showChildModal, setShowChildModal] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const emailRef = useRef('');
  const phoneRef = useRef('');
const autoOtpRef = useRef(false);



  


useEffect(() => {
  if (!isOTPSent) return;

  if (timer === 0) {
    setCanResend(true);
    return;
  }

  const interval = setInterval(() => {
    setTimer(t => t - 1);
  }, 1000);

  return () => clearInterval(interval);
}, [timer, isOTPSent]);


  
// useEffect(() => {
//   RNOtpVerify.getHash()
//     .then(hash => console.log("APP HASH:", hash))
//     .catch(console.log);
// }, []);


useEffect(() => {
  const getAppHash = async () => {
    try {
      const hash = await RNOtpVerify.getHash();
      // Usually backend needs the FIRST hash
      setAppHash(hash[0]);
      console.log('APP HASH:', hash[0]);
    } catch (e) {
      console.log('Hash error', e);
    }
  };

  getAppHash();
}, []);


useEffect(() => {
  if (!isOTPSent || medium !== 'phone') return;
  if (allowAutoOtp !== true) return; // 🔒 user did not consent

  const startOtpListener = async () => {
    try {
      await RNOtpVerify.getOtp();

      RNOtpVerify.addListener(message => {
        const otpMatch = message.match(/\b\d{6}\b/);
        if (otpMatch) {
          autoOtpRef.current = true;
          setIsAutoOtp(true);
          setOtp(otpMatch[0]);
          RNOtpVerify.removeListener();
        }
      });
    } catch (e) {
      console.log('OTP listener error:', e);
    }
  };

  startOtpListener();
  return () => RNOtpVerify.removeListener();
}, [isOTPSent, allowAutoOtp]);

// useEffect(() => {
//   if (!isOTPSent || medium !== 'phone') return;

//   const startOtpListener = async () => {
//     try {
//       await RNOtpVerify.getOtp(); // starts SMS Retriever


//      RNOtpVerify.addListener(message => {
//   const otpMatch = message.match(/\b\d{6}\b/);
//   if (otpMatch) {
//     const code = otpMatch[0];

//     autoOtpRef.current = true; // 🔒 lock source
//     setIsAutoOtp(true);
//     setOtp(code);

//     RNOtpVerify.removeListener();
//   }
// });






//     } catch (e) {
//       console.log("OTP Listener error:", e);
//     }
//   };

//   startOtpListener();

//   return () => RNOtpVerify.removeListener();
// }, [isOTPSent]);


useEffect(() => {
    const showHash = async () => {
      try {
        const hash = await RNOtpVerify.getHash();

        console.log('HASH KEY:', hash);

        if (Platform.OS === 'android') {
          ToastAndroid.show(
            `App Hash: ${hash.join(', ')}`,
            ToastAndroid.LONG
          );
        }
      } catch (e) {
        console.log('Hash error', e);
      }
    };

    showHash();
  }, []);


useEffect(() => {
  if (isAutoOtp && otp.length === 6 && isOTPSent) {
    // optional: keyboard dismiss (no flicker here)
    Keyboard.dismiss();

    verifyOTP();
  }
}, [otp, isAutoOtp, isOTPSent]);






const handleOtpChange = (value: string) => {
  setOtp(value);

  // 🔐 If this change came from SMS auto-fill, ignore
  if (autoOtpRef.current) return;

  // otherwise manual typing
  setIsAutoOtp(false);
};

  const resetTimer = () => {
    setTimer(OTP_TIMER);
    setCanResend(false);
  };

const startFiveSecLoader = () => {
  setFakeLoading(true);
  setTimeout(() => {
    setFakeLoading(false);
  }, 5000); // 5 seconds
};


  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // ---------------- CHECK & PROCEED ----------------
  const checkAndProceed = async () => {
    Keyboard.dismiss();
    const e = emailRef.current.trim().toLowerCase();
    const p = phoneRef.current.trim();
    setErrors({});

    if (!e && !p) {
      setErrors({ identifier: 'Enter email or mobile number' });
      shake();
      return;
    }
    if (e && p) {
      setErrors({ identifier: 'Enter either email or mobile, not both' });
      shake();
      return;
    }

    let identifier: string;
    let mediumType: 'email' | 'phone';

    if (e) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        setErrors({ identifier: 'Invalid email address' });
        shake();
        return;
      }
      identifier = e;
      mediumType = 'email';
    } else {
      if (p.length !== 10) {
        setErrors({ identifier: 'Enter valid 10-digit mobile number' });
        shake();
        return;
      }
      identifier = p;
      mediumType = 'phone';
    }

    setLoading(true);

    try {
      const res = await axios.post(CHECK_IDENTIFIER_API, { email: identifier });
      const data = res.data;

      if (!data.exists) {
        Toast.show({ type: 'info', text1: 'Account not found — please sign up' });
        navigation.navigate('Signup', { [mediumType === 'email' ? 'verifiedEmail' : 'phone']: identifier });
        return;
      }

      setVerifiedIdentifier(identifier);
      setMedium(mediumType);

      if (data.loginAs === 'parent' && data.multipleChildren) {
        setChildren(data.children || []);
        setShowChildModal(true);
        return;
      }

      sendOTP(identifier, mediumType, null);
    } catch {
      Toast.show({ type: 'error', text1: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SEND OTP ----------------
  // const sendOTP = async (identifier: string, mediumType: 'email' | 'phone', selectedChildId: number | null) => {
  //  // setLoading(true);
  //   setOtp('');
  //   try {
  //     await axios.post(LOGIN_SEND_OTP, {
  //       identifier,
  //       ...(selectedChildId !== null && { childId: selectedChildId }),
  //     });

  //     setChildId(selectedChildId);
  //     setIsOTPSent(true);
  //     setShowChildModal(false);
  //     resetTimer();

  //     Toast.show({ type: 'success', text1: `OTP sent to your ${mediumType === 'phone' ? 'mobile' : 'email'}` });
  //   } catch (err: any) {
  //     Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Failed to send OTP' });
  //   } finally {
  //    // setLoading(false);
  //   }
  // };

 const sendOTP = async (
  identifier: string,
  mediumType: 'email' | 'phone',
  selectedChildId: number | null
) => {
  setOtp('');

  // 👇 build payload first
  const payload: any = {
    identifier,
    ...(mediumType === 'phone' && Platform.OS === 'android' && {
      appHash,
      platform: 'android',
    }),
    ...(selectedChildId !== null && { childId: selectedChildId }),
  };

  // 🔍 LOG REQUEST PAYLOAD
  console.log('📤 SEND OTP REQUEST PAYLOAD:', JSON.stringify(payload, null, 2));

  try {
    await axios.post(LOGIN_SEND_OTP, payload);

    setChildId(selectedChildId);
    setIsOTPSent(true);
    setShowChildModal(false);
    resetTimer();

    Toast.show({
      type: 'success',
      text1: `OTP sent to your ${mediumType === 'phone' ? 'mobile' : 'email'}`,
    });
  } catch (err: any) {
    console.log('❌ SEND OTP ERROR:', err?.response?.data || err);
    Toast.show({
      type: 'error',
      text1: err?.response?.data?.message || 'Failed to send OTP',
    });
  }
};
  // ---------------- VERIFY OTP ----------------
  const verifyOTP = async () => {
    if (!otp.trim()) {
      setErrors({ otp: 'OTP is required' });
      shake();
      return;
    }
    setVerifying(true);
    try {
      const res = await axios.post(LOGIN_VERIFY_OTP, {
        identifier: verifiedIdentifier,
        otp,
        ...(childId && { childId }),
      });

      if (res.data?.success) {
        const { token, account, loginAs } = res.data;
        await setUser({ ...account, token, loginAs });

 // 🔥 FCM FLOW STARTS HERE
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        const fcmToken = await getFcmToken();
        if (fcmToken) {

          await syncFcmTokenToBackend(token, fcmToken);
    console.log(' Failed to sync FCM token -- to backend');
        }
      }


        Toast.show({ type: 'success', text1: 'Login successful' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'OTP verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    
    // <KeyboardAvoidingView style={{ flex: 1 }} 
    //  behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
>


      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        >

      <View style={styles.heroContainer}>
  <Image
    source={require('../../assets/images/mainImage.jpeg')}
    style={styles.heroImage}
    resizeMode="cover"
  />

  {/* Overlay for softness */}
  <View style={styles.heroOverlay} />

 

  {isOTPSent && (
    <TouchableOpacity style={styles.backBtn} onPress={handleBackToLogin}>
      <Icon name="arrow-back" size={26} color="#fff" />
    </TouchableOpacity>
  )}
</View>

        {/* <View style={styles.heroContainer}>
        <Image
  source={require('../../assets/images/premium.png')}
  style={styles.heroImage}
  resizeMode="cover"
/>


        {isOTPSent && (
    <TouchableOpacity style={styles.backBtn} onPress={handleBackToLogin}>
      <Icon name="arrow-back" size={26} color="#fff" />
    </TouchableOpacity>
  )}
  <Text style={styles.heroTitle}>
    {isOTPSent ? '' : 'Sign In'}
  </Text>
              
        </View> */}

    
    
    
    
        <View style={styles.sheet}>
          {!isOTPSent && (
            <>
              <View style={styles.inputBox}>
                <Text style={styles.code}>+91</Text>
                <View style={styles.divider} />
                <TextInput
                  placeholder="Mobile Number"
                  placeholderTextColor="#9E9E9E"
                  keyboardType="numeric"
                  maxLength={10}
                  style={styles.input}
                  value={phone}
                  onChangeText={t => {
                    const val = t.replace(/\D/g, '');
                    phoneRef.current = val;
                    setPhone(val);
                    if (val.length) { emailRef.current = ''; setEmail(''); }
                  }}
                  onSubmitEditing={checkAndProceed}
                />
              </View>

              <View style={styles.orContainer}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.orLine} />
              </View>

              <View style={styles.inputBox}>
                <TextInput
                  placeholder="Email ID"
                  placeholderTextColor="#9E9E9E"
                  autoCapitalize="none"
                  style={styles.input}
                  value={email}
                  onChangeText={t => {
                    const val = t.toLowerCase();
                    emailRef.current = val;
                    setEmail(val);
                    if (val.length) { phoneRef.current = ''; setPhone(''); }
                  }}
                  onSubmitEditing={e => { emailRef.current = e.nativeEvent.text.trim().toLowerCase(); checkAndProceed(); }}
                />
              </View>

              {errors.identifier && <Text style={styles.error}>{errors.identifier}</Text>}
            </>
          
          
          
          )}


{!isOTPSent && (
  <Text style={styles.termsText}>
    By continuing, I agree to the{' '}
    <Text style={styles.linkText} onPress={openTerms}>
      Term of Use
    </Text>{' '}
    &{'\n'}
    <Text style={styles.linkText} onPress={openPrivacy}>
      Privacy Policy
    </Text>
  </Text>
)}




         

{isOTPSent && (
  <>
    <Text style={styles.otpLabel}>Enter the code sent to your {medium}</Text>

    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <OTPTextInput
  key={medium === 'phone' && isAutoOtp ? otp : 'manual'}
  inputCount={6}
  handleTextChange={handleOtpChange}
  defaultValue={otp}
  containerStyle={styles.otpRow}
  textInputStyle={styles.otpBox}
  autoFocus
  blurOnSubmit={false}
/>

     
    </Animated.View>

    {errors.otp && <Text style={styles.error}>{errors.otp}</Text>}

    {/* 👇 ADD TIMER + RESEND HERE */}
    <Text style={styles.timer}>
      {canResend ? "Didn't receive code?" : `Resend OTP in ${timer}s`}
    </Text>

    {canResend && (
      <TouchableOpacity
        onPress={() => sendOTP(verifiedIdentifier, medium!, childId)}
      >
        <Text style={{
          textAlign: 'center',
          color: '#F6A452',
          fontWeight: '600',
          marginTop: 6
        }}>
          Resend OTP
        </Text>
      </TouchableOpacity>
    )}
  </>
)}

<TouchableOpacity
  style={[
    styles.button,
    isButtonLoading && { opacity: 0.7 }
  ]}
  onPress={() => {
    Keyboard.dismiss();  
    startFiveSecLoader();           // show loader 5 sec
    isOTPSent ? verifyOTP() : checkAndProceed();
  }}
  disabled={isButtonLoading}
  activeOpacity={0.8}
>
  {isButtonLoading ? (
    <ActivityIndicator size="small" color="#fff" />
  ) : (
    <Text style={styles.buttonText}>
      {isOTPSent ? 'Verify' : 'Login'}
    </Text>
  )}
</TouchableOpacity>



{!isOTPSent && (
<TouchableOpacity
  onPress={() => navigation.navigate('Signup')}
  style={{ marginTop: 18 }}
>
  <Text style={styles.signupText}>
    Don’t have an account?{' '}
    <Text style={styles.signupLink}>Sign up</Text>
  </Text>
</TouchableOpacity>
)}




{isOTPSent && medium === 'phone' && allowAutoOtp === null && (
  <Modal transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalBox}>
        <Text style={styles.modalTitle}>Auto-detect OTP?</Text>

        <Text style={{ textAlign: 'center', marginBottom: 16 }}>
          We can automatically read the OTP from SMS to speed up login.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setAllowAutoOtp(true)}
        >
          <Text style={styles.buttonText}>Allow</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setAllowAutoOtp(false)}
          style={{ marginTop: 12 }}
        >
          <Text style={{ textAlign: 'center', color: '#555' }}>
            I’ll enter manually
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}



        </View>
      </ScrollView>

      <Modal visible={showChildModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Child</Text>
            {children.map(c => (
              <TouchableOpacity key={c.id} onPress={() => sendOTP(verifiedIdentifier, medium!, c.id)}>
                <Text style={styles.childName}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Toast />
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;


// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff' },
//  sheet: { marginTop: -80, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 24 },
sheet: {
  marginTop: -64,
  backgroundColor: '#fff',
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  paddingHorizontal: 22,
  paddingTop: 28,
  paddingBottom: 24,
},  
inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 12, height: 52, paddingHorizontal: 14, marginBottom: 4 },
  code: { color: '#7A7A7A', fontSize: 16 },
  divider: { width: 1, height: 24, backgroundColor: '#616161', marginHorizontal: 10 },
  input: { flex: 1, fontSize: 18, color: '#000',includeFontPadding: false, textAlignVertical: 'center' },
  button: { backgroundColor: '#F6A452', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10 ,flexDirection: 'row'},
  buttonText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  error: { color: '#E94235', marginBottom: 8, marginTop: 4 },
  otpLabel: { marginBottom: 10 },
  otpRow: { justifyContent: 'space-between', marginBottom: 10 },
  otpBox: { width: 45, height: 50, borderWidth: 1, borderColor: '#F2A65A', borderRadius: 10, textAlign: 'center', fontSize: 18 },
  timer: { textAlign: 'center', color: '#000', marginTop: 4 },
  orContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: 20 },
  orLine: { width: '30%', height: 1, backgroundColor: '#111' },
  orText: { marginHorizontal: 12, color: '#111', fontWeight: '800' },
  heroContainer: { position: 'relative' },
 // heroImage: { width: '100%', height: SCREEN_HEIGHT * 0.5 },
//  heroTitle: { position: 'absolute', top: 10, left: 20, color: '#fff', fontSize: 28, fontWeight: '700' },
 heroTitle: {
  position: 'absolute',
  top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 30,
  left: 20,
  color: '#fff',
  fontSize: 28,
  fontWeight: '700',
},
// heroOverlay: {
//   position: 'absolute',
//   top: 0,
//   left: 0,
//   right: 0,
//   bottom: 0,
//   backgroundColor: 'rgba(0,0,0,0.25)', // soft dark overlay
// },

// logoWrapper: {
//   position: 'absolute',
//   top: '35%',
//   alignSelf: 'center',
//   backgroundColor: 'rgba(255,255,255,0.85)',
//   paddingHorizontal: 28,
//   paddingVertical: 18,
//   borderRadius: 24,
// },

// logo: {
//   width: 160,
//   height: 60,
// },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  terms: { fontSize: 14, color: '#444', lineHeight: 16.5, marginBottom: 14, marginTop: 10, fontFamily: 'Quicksand-Regular' },
  link: { color: '#E94235', fontFamily: 'Quicksand-Medium' },
 termsText: {
  fontSize: 13,
  color: '#555',
  marginBottom: 14,
  marginTop: 6,
  lineHeight: 18,
  textAlign: 'left',
  paddingHorizontal: 4, // adjust 2–6 if needed
},


linkText: {
  color: '#E94235',
  fontWeight: '600',
},
signupText: {
  textAlign: 'center',
  color: '#333',
  fontSize: 14,
},
backBtn: {
  position: 'absolute',
  top: 40,
  left: 16,
  zIndex: 10,
  backgroundColor: 'rgba(0,0,0,0.35)',
  padding: 8,
  borderRadius: 20,
},


heroImage: {
  width: '100%',
  height: SCREEN_HEIGHT * 0.42, // ↓ slightly smaller
},

heroOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.18)', // softer
},

// logoWrapper: {
//   position: 'absolute',
//   top: '30%', // ↑ feels more premium
//   alignSelf: 'center',
//   backgroundColor: 'rgba(255,255,255,0.92)', // cleaner
//   paddingHorizontal: 32,
//   paddingVertical: 16,
//   borderRadius: 22,
// },
logoWrapper: {
  position: 'absolute',
  top: '30%',
  alignSelf: 'center',
  backgroundColor: 'rgba(255,255,255,0.94)',
  paddingHorizontal: 32,
  paddingVertical: 16,
  borderRadius: 22,
  opacity: 0.9,
},
logo: {
  width: 150,
  height: 52,
opacity: 0.85,
},

signupLink: {
  fontWeight: '700',
  color: '#000',
},

  childName: { fontSize: 16, color: '#000', textAlign: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
});













