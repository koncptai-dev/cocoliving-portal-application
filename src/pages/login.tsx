import React, { useState, useRef, useEffect } from 'react';
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

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verifiedIdentifier, setVerifiedIdentifier] = useState('');
  const [medium, setMedium] = useState<'email' | 'phone' | null>(null);

  const [otp, setOtp] = useState('');
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; otp?: string }>({});
  const [timer, setTimer] = useState(OTP_TIMER);
  const [canResend, setCanResend] = useState(false);

  const [children, setChildren] = useState<any[]>([]);
  const [childId, setChildId] = useState<number | null>(null);
  const [showChildModal, setShowChildModal] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const emailRef = useRef('');
  const phoneRef = useRef('');

  // TIMER
  useEffect(() => {
    let interval: any;
    if (isOTPSent && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    if (timer === 0) setCanResend(true);
    return () => interval && clearInterval(interval);
  }, [timer, isOTPSent]);

  const resetTimer = () => {
    setTimer(OTP_TIMER);
    setCanResend(false);
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
  const sendOTP = async (identifier: string, mediumType: 'email' | 'phone', selectedChildId: number | null) => {
    setLoading(true);
    setOtp('');
    try {
      await axios.post(LOGIN_SEND_OTP, {
        identifier,
        ...(selectedChildId !== null && { childId: selectedChildId }),
      });

      setChildId(selectedChildId);
      setIsOTPSent(true);
      setShowChildModal(false);
      resetTimer();

      Toast.show({ type: 'success', text1: `OTP sent to your ${mediumType === 'phone' ? 'mobile' : 'email'}` });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Failed to send OTP' });
    } finally {
      setLoading(false);
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
        Toast.show({ type: 'success', text1: 'Login successful' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'OTP verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  return (
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
          <Image source={{ uri: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg' }} style={styles.heroImage} />
          <Text style={styles.heroTitle}>Sign In</Text>
        </View>

        <View style={styles.sheet}>
          {!isOTPSent && (
            <>
              <View style={styles.inputBox}>
                <Text style={styles.code}>+91</Text>
                <View style={styles.divider} />
                <TextInput
                  placeholder="Mobile Number"
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

          {isOTPSent && (
            <>
              <Text style={styles.otpLabel}>Enter the code sent to your {medium}</Text>
              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <OTPTextInput inputCount={6} handleTextChange={setOtp} containerStyle={styles.otpRow} textInputStyle={styles.otpBox} />
              </Animated.View>
              {errors.otp && <Text style={styles.error}>{errors.otp}</Text>}
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={isOTPSent ? verifyOTP : checkAndProceed} disabled={loading || verifying}>
            {(loading || verifying) ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isOTPSent ? 'Verify' : 'Login'}</Text>}
          </TouchableOpacity>
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
  sheet: { marginTop: -80, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 24 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 12, height: 52, paddingHorizontal: 14, marginBottom: 4 },
  code: { color: '#7A7A7A', fontSize: 16 },
  divider: { width: 1, height: 24, backgroundColor: '#616161', marginHorizontal: 10 },
  input: { flex: 1, fontSize: 18, color: '#000' },
  button: { backgroundColor: '#F6A452', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
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
  heroImage: { width: '100%', height: SCREEN_HEIGHT * 0.5 },
  heroTitle: { position: 'absolute', top: 10, left: 20, color: '#fff', fontSize: 28, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  terms: { fontSize: 14, color: '#444', lineHeight: 16.5, marginBottom: 14, marginTop: 10, fontFamily: 'Quicksand-Regular' },
  link: { color: '#E94235', fontFamily: 'Quicksand-Medium' },
  childName: { fontSize: 16, color: '#000', textAlign: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
});















// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Keyboard,
//   Modal,
//   Dimensions,
//   Image,
//   Animated,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import OTPTextInput from 'react-native-otp-textinput';
// import Toast from 'react-native-toast-message';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import colors from '../constants/color';

// export const API_BASE_URL = 'https://staging.cocoliving.in';
// const CHECK_IDENTIFIER_API = `${API_BASE_URL}/api/common/check-email`;
// const LOGIN_SEND_OTP = `${API_BASE_URL}/api/common/login/request-otp`;
// const LOGIN_VERIFY_OTP = `${API_BASE_URL}/api/common/login/verify-otp`;

// const OTP_TIMER = 30;
// const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// const LoginScreen = () => {
//   const navigation = useNavigation<any>();
//   const { setUser } = useAuth();

//   const [email, setEmail] = useState('');
//   const [phone, setPhone] = useState('');
//   const [verifiedIdentifier, setVerifiedIdentifier] = useState('');
//   const [medium, setMedium] = useState<'email' | 'phone' | null>(null);

//   const [otp, setOtp] = useState('');
//   const [isOTPSent, setIsOTPSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [verifying, setVerifying] = useState(false);
//   const [errors, setErrors] = useState<{ identifier?: string; otp?: string }>({});
//   const [timer, setTimer] = useState(OTP_TIMER);
//   const [canResend, setCanResend] = useState(false);

//   const [children, setChildren] = useState<any[]>([]);
//   const [childId, setChildId] = useState<number | null>(null);
//   const [showChildModal, setShowChildModal] = useState(false);

//   const shakeAnim = useRef(new Animated.Value(0)).current;

//   // 🔹 refs to store latest input values
//   const emailRef = useRef('');
//   const phoneRef = useRef('');

//   /* ---------------- TIMER ---------------- */
//   useEffect(() => {
//     let interval: any;
//     if (isOTPSent && timer > 0) {
//       interval = setInterval(() => setTimer(t => t - 1), 1000);
//     }
//     if (timer === 0) setCanResend(true);
//     return () => interval && clearInterval(interval);
//   }, [timer, isOTPSent]);

//   const resetTimer = () => {
//     setTimer(OTP_TIMER);
//     setCanResend(false);
//   };

//   /* ---------------- SHAKE ---------------- */
//   const shake = () => {
//     Animated.sequence([
//       Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
//     ]).start();
//   };

//   /* ---------------- VALIDATION ---------------- */
//   const validateIdentifier = () => {
//     setErrors({});
//     const e = emailRef.current.trim().toLowerCase();
//     const p = phoneRef.current.trim();

//     if (!e && !p) {
//       setErrors({ identifier: 'Enter email or mobile number' });
//       shake();
//       return null;
//     }
//     if (e && p) {
//       setErrors({ identifier: 'Enter either email or mobile, not both' });
//       shake();
//       return null;
//     }
//     if (e) {
//       if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
//         setErrors({ identifier: 'Invalid email address' });
//         shake();
//         return null;
//       }
//       return { identifier: e, medium: 'email' as const };
//     }
//     if (p) {
//       if (p.length !== 10) {
//         setErrors({ identifier: 'Enter valid 10-digit mobile number' });
//         shake();
//         return null;
//       }
//       return { identifier: p, medium: 'phone' as const };
//     }
//     return null;
//   };

//   /* ---------------- CHECK & PROCEED WITH 5-SEC DELAY ---------------- */
//   const checkAndProceedSafe = () => {
//     Keyboard.dismiss();
//     setLoading(true); // show loader during delay

//     setTimeout(() => {
//       checkAndProceed();
//     }, 10000);
//   };

//   const checkAndProceed = async () => {
    
    
//       Keyboard.dismiss();   // ⭐ THIS LINE
 
        
//          await new Promise<void>((resolve) => setTimeout(() => resolve(), 50));
//     const result = validateIdentifier();



//     if (!result) {
//       setLoading(false);
//       return;
//     }

//     const { identifier, medium } = result;
//     setLoading(true);

//     try {
//       const res = await axios.post(CHECK_IDENTIFIER_API, { email: identifier });
//       const data = res.data;

//       if (!data.exists) {
//         Toast.show({ type: 'info', text1: 'Account not found — please sign up' });
//         navigation.navigate('Signup', { [medium === 'email' ? 'verifiedEmail' : 'phone']: identifier });
//         return;
//       }

//       setVerifiedIdentifier(identifier);
//       setMedium(medium);

//       if (data.loginAs === 'parent' && data.multipleChildren) {
//         setChildren(data.children || []);
//         setShowChildModal(true);
//         return;
//       }

//       sendOTP(null);
//     } catch (err: any) {
//       Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Something went wrong' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ---------------- SEND OTP ---------------- */
//   const sendOTP = async (selectedChildId: number | null) => {
//     setLoading(true);
//     setOtp('');
//     try {
//       await axios.post(LOGIN_SEND_OTP, {
//         identifier: verifiedIdentifier,
//         ...(selectedChildId !== null && { childId: selectedChildId }),
//       });

//       setChildId(selectedChildId);
//       setIsOTPSent(true);
//       setShowChildModal(false);
//       resetTimer();

//       Toast.show({ type: 'success', text1: `OTP sent to your ${medium === 'phone' ? 'mobile' : 'email'}` });
//     } catch (err: any) {
//       Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Failed to send OTP' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ---------------- VERIFY OTP ---------------- */
//   const verifyOTP = async () => {
//     if (!otp.trim()) {
//       setErrors({ otp: 'OTP is required' });
//       shake();
//       return;
//     }
//     setVerifying(true);
//     try {
//       const res = await axios.post(LOGIN_VERIFY_OTP, {
//         identifier: verifiedIdentifier,
//         otp,
//         ...(childId && { childId }),
//       });

//       if (res.data?.success) {
//         const { token, account, loginAs } = res.data;
//         await setUser({ ...account, token, loginAs });
//         Toast.show({ type: 'success', text1: 'Login successful' });
//       }
//     } catch (err: any) {
//       Toast.show({ type: 'error', text1: err?.response?.data?.message || 'OTP verification failed' });
//     } finally {
//       setVerifying(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//       <ScrollView contentContainerStyle={styles.container}>
//         <View style={styles.heroContainer}>
//           <Image
//             source={{ uri: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg' }}
//             style={styles.heroImage}
//             resizeMode="cover"
//           />
//           <Text style={styles.heroTitle}>Sign In</Text>
//         </View>

//         <View style={styles.sheet}>
//           {!isOTPSent && (
//             <>
//               {/* Mobile Input */}
//               <View style={styles.inputBox}>
//                 <Text style={styles.code}>+91</Text>
//                 <View style={styles.divider} />
//                 <TextInput
//                   placeholder="Mobile Number"
//                   keyboardType="numeric"
//                   maxLength={10}
//                   style={styles.input}
//                   value={phone}
//                   returnKeyType="done"
//                   onChangeText={t => {
//                     const val = t.replace(/\D/g, '');
//                     phoneRef.current = val;
//                     setPhone(val);
//                     if (val.length) {
//                       emailRef.current = '';
//                       setEmail('');
//                     }
//                   }}
    
                  
                  
//                   //onSubmitEditing={checkAndProceedSafe}
//                 />
//               </View>

//               {/* OR */}
//               <View style={styles.orContainer}>
//                 <View style={styles.orLine} />
//                 <Text style={styles.orText}>or</Text>
//                 <View style={styles.orLine} />
//               </View>

//               {/* Email Input */}
//               <View style={styles.inputBox}>
//                 <TextInput
//                   placeholder="Email ID"
//                   autoCapitalize="none"
//                   style={styles.input}
//                   value={email}
//                   returnKeyType="done"
//                   onChangeText={t => {
//                     const val = t.toLowerCase();
//                     emailRef.current = val;
//                     setEmail(val);
//                     if (val.length) {
//                       phoneRef.current = '';
//                       setPhone('');
//                     }
//                   }}
                  
//                    onEndEditing={(e) => {
//     emailRef.current = e.nativeEvent.text; // FINAL value
//   }}
//                   //onSubmitEditing={checkAndProceedSafe}
//                 />
//               </View>

//               {errors.identifier && <Text style={styles.error}>{errors.identifier}</Text>}
//             </>
//           )}

//           {/* OTP Input */}
//           {isOTPSent && (
//             <>
//               <Text style={styles.otpLabel}>Enter the code sent to your {medium}</Text>
//               <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
//                 <OTPTextInput inputCount={6} handleTextChange={setOtp} containerStyle={styles.otpRow} textInputStyle={styles.otpBox} />
//               </Animated.View>
//               {errors.otp && <Text style={styles.error}>{errors.otp}</Text>}
//             </>
//           )}









//           {/* Button */}
//           <TouchableOpacity style={styles.button} onPress={isOTPSent ? verifyOTP : checkAndProceed} disabled={loading || verifying}>
//             {(loading || verifying) ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isOTPSent ? 'Verify' : 'Login'}</Text>}
//           </TouchableOpacity>

//  {!isOTPSent && (
//    <Text style={styles.terms}>
//      By continuing, I agree to the{' '}
//      <Text style={styles.link}>Term of Use</Text>
//      {'\n'}
//      <Text style={styles.link}>Privacy Policy</Text>
//    </Text>
//  )}



//           {/* Timer */}
//           {isOTPSent && !canResend && <Text style={styles.timer}>0:{timer < 10 ? `0${timer}` : timer}</Text>}

//           <View style={{ marginTop: 16, alignItems: 'center' }}>
//             <Text style={{ fontFamily: 'Quicksand-Regular', color: '#444' }}>
//               Don’t have an account?{' '}
//               <Text style={{ fontFamily: 'Quicksand-Bold', fontWeight: '800', color: '#111' }} onPress={() => navigation.navigate('Signup')}>
//                 Sign up
//               </Text>
//             </Text>
//           </View>
//         </View>
//       </ScrollView>

//       {/* CHILD MODAL */}
//       <Modal visible={showChildModal} transparent animationType="fade">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalBox}>
//             <Text style={styles.modalTitle}>Select Child</Text>
//             {children.map(c => (
//               <TouchableOpacity key={c.id} onPress={() => sendOTP(c.id)}>
//                 <Text style={styles.childName}>{c.name}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>
//       </Modal>

//       <Toast />
//     </KeyboardAvoidingView>
//   );
// };

// export default LoginScreen;

// // ---------- STYLES ----------
// const styles = StyleSheet.create({
//   container: { flexGrow: 1, backgroundColor: '#fff' },
//   sheet: { marginTop: -80, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 24 },
//   inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 12, height: 52, paddingHorizontal: 14, marginBottom: 4 },
//   code: { color: '#7A7A7A', fontSize: 16 },
//   divider: { width: 1, height: 24, backgroundColor: '#616161', marginHorizontal: 10 },
//   input: { flex: 1, fontSize: 18, color: '#000' },
//   button: { backgroundColor: '#F6A452', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
//   buttonText: { color: '#fff', fontSize: 20, fontWeight: '600' },
//   error: { color: '#E94235', marginBottom: 8, marginTop: 4 },
//   otpLabel: { marginBottom: 10 },
//   otpRow: { justifyContent: 'space-between', marginBottom: 10 },
//   otpBox: { width: 45, height: 50, borderWidth: 1, borderColor: '#F2A65A', borderRadius: 10, textAlign: 'center', fontSize: 18 },
//   timer: { textAlign: 'center', color: '#000', marginTop: 4 },
//   orContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: 20 },
//   orLine: { width: '30%', height: 1, backgroundColor: '#111' },
//   orText: { marginHorizontal: 12, color: '#111', fontWeight: '800' },
//   heroContainer: { position: 'relative' },
//   heroImage: { width: '100%', height: SCREEN_HEIGHT * 0.5 },
//   heroTitle: { position: 'absolute', top: 10, left: 20, color: '#fff', fontSize: 28, fontWeight: '700' },
//   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
//   modalBox: { width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
//   modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
//   terms: {
//     fontSize: 14,
//     color: '#444',
//     lineHeight: 16.5,
//     letterSpacing: 0,
//     marginBottom: 14,
//     marginTop: 10,
//     fontFamily: 'Quicksand-Regular',
//   },
 
//   link: {
//     color: '#E94235',
//     fontFamily: 'Quicksand-Medium',
//   },

//   childName: { fontSize: 16, color: '#000', textAlign: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },

// });




























// import React, { useState, useEffect, useRef } from 'react';
// import { Image, Keyboard } from 'react-native';
// import { Dimensions } from 'react-native'; 
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   Platform,
//   KeyboardAvoidingView,
//   Animated,
//   Modal,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import OTPTextInput from 'react-native-otp-textinput';
// import Toast from 'react-native-toast-message';
// import axios from 'axios';
// import AuthHeader from '../components/AuthHeader';
// import { useAuth } from '../context/AuthContext';
// import colors from '../constants/color';
// import {
//   getFcmToken,
//   requestNotificationPermission,
//   syncFcmTokenToBackend,
// } from '../user/notificationservice';
 
// export const API_BASE_URL = 'https://staging.cocoliving.in';
 
// const CHECK_IDENTIFIER_API = `${API_BASE_URL}/api/common/check-email`;
// const LOGIN_SEND_OTP = `${API_BASE_URL}/api/common/login/request-otp`;
// const LOGIN_VERIFY_OTP = `${API_BASE_URL}/api/common/login/verify-otp`;
 
// const OTP_TIMER = 30;
 
 
// const { height: SCREEN_HEIGHT } = Dimensions.get('window');
 
 
// const LoginScreen = () => {
//   const navigation = useNavigation<any>();
//   const { setUser } = useAuth();
 
//   const [email, setEmail] = useState('');
//   const [phone, setPhone] = useState('');
//   const [verifiedIdentifier, setVerifiedIdentifier] = useState('');
//   const [medium, setMedium] = useState<'email' | 'phone' | null>(null);
 
//   const [otp, setOtp] = useState('');
//   const [isOTPSent, setIsOTPSent] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [verifying, setVerifying] = useState(false);
//   const [errors, setErrors] = useState<{ identifier?: string; otp?: string }>({});
//   const [timer, setTimer] = useState(OTP_TIMER);
//   const [canResend, setCanResend] = useState(false);
 
//   /* Parent–Child */
//   const [children, setChildren] = useState<any[]>([]);
//   const [childId, setChildId] = useState<number | null>(null);
//   const [showChildModal, setShowChildModal] = useState(false);
 
//   const shakeAnim = useRef(new Animated.Value(0)).current;
 
// const emailRef = useRef('');
// const phoneRef = useRef('');

// const checkAndProceedSafe = () => {
//   Keyboard.dismiss();
//   setTimeout(checkAndProceed, 50);
// };


//   /* ---------------- TIMER ---------------- */
//   useEffect(() => {
//     let interval: any;
//     if (isOTPSent && timer > 0) {
//       interval = setInterval(() => setTimer(t => t - 1), 1000);
//     }
//     if (timer === 0) setCanResend(true);
//     return () => interval && clearInterval(interval);
//   }, [timer, isOTPSent]);
 
//   const resetTimer = () => {
//     setTimer(OTP_TIMER);
//     setCanResend(false);
//   };
 
//   /* ---------------- SHAKE ---------------- */
//   const shake = () => {
//     Animated.sequence([
//       Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
//       Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
//     ]).start();
//   };
 
//   /* ---------------- VALIDATION ---------------- */
//   const validateIdentifier = () => {
//     setErrors({});
 
// //    const e = email.trim().toLowerCase();
//  //   const p = phone.trim();
 

// const e = emailRef.current.trim().toLowerCase();
// const p = phoneRef.current.trim();


//     if (!e && !p) {
//       setErrors({ identifier: 'Enter email or mobile number' });
//       shake();
//       return null;
//     }
 
//     if (e && p) {
//       setErrors({ identifier: 'Enter either email or mobile, not both' });
//       shake();
//       return null;
//     }
 
//     if (e) {
//       if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
//         setErrors({ identifier: 'Invalid email address' });
//         shake();
//         return null;
//       }
//       return { identifier: e, medium: 'email' as const };
//     }
 
//     if (p) {
//       if (p.length !== 10) {
//         setErrors({ identifier: 'Enter valid 10-digit mobile number' });
//         shake();
//         return null;
//       }
//       return { identifier: p, medium: 'phone' as const };
//     }
 
//     return null;
//   };
 
//   /* ---------------- CHECK & PROCEED (FIXED) ---------------- */
 
// const checkAndProceed = async () => {
//   const result = validateIdentifier();
//   if (!result) return;
 
//   const { identifier, medium } = result;
//   setLoading(true);
 
//   try {
//     // 🔑 BACKEND EXPECTS `email` KEY ALWAYS
//     const res = await axios.post(CHECK_IDENTIFIER_API, {
//       email: identifier,
//     });
 
//     const data = res.data;
 
//     if (!data.exists) {
//       Toast.show({ type: 'info', text1: 'Account not found — please sign up' });
//       navigation.navigate('Signup', {
//         [medium === 'email' ? 'verifiedEmail' : 'phone']: identifier,
//       });
//       return;
//     }
 
//     setVerifiedIdentifier(identifier);
//     setMedium(medium);
 
//     if (data.loginAs === 'parent' && data.multipleChildren) {
//       setChildren(data.children || []);
//       setShowChildModal(true);
//       return;
//     }
 
//     sendOTP(null);
 
//   } catch (err: any) {
//     Toast.show({
//       type: 'error',
//       text1: err?.response?.data?.message || 'Something went wrong',
//     });
//   } finally {
//     setLoading(false);
//   }
// };
 
 
 

 
//   /* ---------------- SEND OTP ---------------- */
//   const sendOTP = async (selectedChildId: number | null) => {
//     setLoading(true);
//     setOtp('');
 
//     try {
//       await axios.post(LOGIN_SEND_OTP, {
//         identifier: verifiedIdentifier,
//         ...(selectedChildId !== null && { childId: selectedChildId }),
//       });
 
//       setChildId(selectedChildId);
//       setIsOTPSent(true);
//       setShowChildModal(false);
//       resetTimer();
 
//       Toast.show({
//         type: 'success',
//         text1: `OTP sent to your ${medium === 'phone' ? 'mobile' : 'email'}`,
//       });
 
//     } catch (err: any) {
//       Toast.show({
//         type: 'error',
//         text1: err?.response?.data?.message || 'Failed to send OTP',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };
 
//   /* ---------------- VERIFY OTP ---------------- */
//   const verifyOTP = async () => {
//     if (!otp.trim()) {
//       setErrors({ otp: 'OTP is required' });
//       shake();
//       return;
//     }
 
//     setVerifying(true);
 
//     try {
//       const res = await axios.post(LOGIN_VERIFY_OTP, {
//         identifier: verifiedIdentifier,
//         otp,
//         ...(childId && { childId }),
//       });
 
//       if (res.data?.success) {
//         const { token, account, loginAs } = res.data;
//         await setUser({ ...account, token, loginAs });
 
//         const permission = await requestNotificationPermission();
//         if (permission) {
//           const fcmToken = await getFcmToken();
//           if (fcmToken) await syncFcmTokenToBackend(token, fcmToken);
//         }
 
//         Toast.show({ type: 'success', text1: 'Login successful' });
//       }
//     } catch (err: any) {
//       Toast.show({
//         type: 'error',
//         text1: err?.response?.data?.message || 'OTP verification failed',
//       });
//     } finally {
//       setVerifying(false);
//     }
//   };
 
//   return (
//     <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//       <ScrollView contentContainerStyle={styles.container}>
     
     
//      {/* <AuthHeader /> */}
 
 
 
 
 
       
//        <View style={styles.heroContainer}>
//   <Image
//     source={{ uri: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?cs=srgb&dl=pexels-pixabay-261102.jpg&fm=jpg' }}
//     style={styles.heroImage}
//     resizeMode="cover"
//   />
//   <Text style={styles.heroTitle}>Sign In</Text>
// </View>
 
 
 
 
 
//         <View style={styles.sheet}>
         
//         {/*<Text style={styles.title}>{isOTPSent ? 'Almost there' : 'Sign In'}</Text>*/}  
 
//           {!isOTPSent && (
//             <>
//               <View style={styles.inputBox}>
//                 <Text style={styles.code}>+91</Text>
//                 <View style={styles.divider} />
//                 {/* <TextInput
//                   placeholder="Mobile Number"
//                   keyboardType="numeric"
//                   maxLength={10}
//                   style={styles.input}
//                   value={phone}
//                   onChangeText={t => {
//                     setPhone(t.replace(/\D/g, ''));
//                     if (t.length) setEmail('');
//                   }}
//                 /> */}
              
//             <TextInput
//   placeholder="Mobile Number"
//   keyboardType="numeric"
//   maxLength={10}
//   style={styles.input}
//   value={phone}
//   returnKeyType="done"
//   onChangeText={t => {
//     const val = t.replace(/\D/g, '');
//     phoneRef.current = val;
//     setPhone(val);

//     if (val.length) {
//       emailRef.current = '';
//       setEmail('');
//     }
//   }}
//   onSubmitEditing={() => {
//     phoneRef.current = phone; // 🔒 force latest value
//     checkAndProceedSafe();
//   }}
// />

              
//               </View>
 
           
//                <View style={styles.orContainer}>
//   <View style={styles.orLine} />
//   <Text style={styles.orText}>or</Text>
//   <View style={styles.orLine} />
// </View>
 
 
 
 
//               <View style={styles.inputBox}>
//                 {/* <TextInput
//                   placeholder="Email ID"
//                   autoCapitalize="none"
//                   style={styles.input}
//                   value={email}
//                   onChangeText={t => {
//                     setEmail(t.toLowerCase());
//                     if (t.length) setPhone('');
//                   }}
//                 /> */}


// <TextInput
//   placeholder="Email ID"
//   autoCapitalize="none"
//   style={styles.input}
//   value={email}
//   returnKeyType="done"
//   onChangeText={t => {
//     const val = t.toLowerCase();
//     emailRef.current = val;
//     setEmail(val);

//     if (val.length) {
//       phoneRef.current = '';
//       setPhone('');
//     }
//   }}
//   onSubmitEditing={() => {
//     emailRef.current = email; // 🔒 force latest value
//     checkAndProceedSafe();
//   }}
// />


//               </View>
 
//               {errors.identifier && <Text style={styles.error}>{errors.identifier}</Text>}
//             </>
//           )}
 
//           {isOTPSent && (
//             <>
//               <Text style={styles.otpLabel}>
//                 Enter the code sent to your {medium}
//               </Text>
 
//               <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
//                 <OTPTextInput
//                   inputCount={6}
//                   handleTextChange={setOtp}
//                   containerStyle={styles.otpRow}
//                   textInputStyle={styles.otpBox}
//                 />
//               </Animated.View>
 
//               {errors.otp && <Text style={styles.error}>{errors.otp}</Text>}
//             </>
//           )}
 
 
 
 
//         {/*
// {!isOTPSent && (
//   <Text style={styles.terms}>
//     By continuing, I agree to the{' '}
//     <Text style={styles.link}>Term of Use</Text>
//     {'\n'}
//     <Text style={styles.link}>Privacy Policy</Text>
//   </Text>
// )}
// */}

 
 
 
 
//           <TouchableOpacity
//             style={styles.button}
//             onPress={isOTPSent ? verifyOTP : checkAndProceedSafe}
//             disabled={loading || verifying}
//           >
//             {(loading || verifying) ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.buttonText}>{isOTPSent ? 'Verify' : 'Login'}</Text>
//             )}
//           </TouchableOpacity>
 
//           {isOTPSent && !canResend && (
//             <Text style={styles.timer}>
//               0:{timer < 10 ? `0${timer}` : timer}
//             </Text>
//           )}
 
 
 
 
// <View style={{ marginTop: 16, alignItems: 'center' }}>
//   <Text style={{ fontFamily: 'Quicksand-Regular', color: '#444' }}>
//     Don’t have an account?{' '}
//     <Text
//       style={{ fontFamily: 'Quicksand-Bold', fontWeight: '800', color: '#111' }}
//       onPress={() => navigation.navigate('Signup')}
//     >
//       Sign up
//     </Text>
//   </Text>
// </View>
 
 
 
 
 
 
//         </View>
//       </ScrollView>
 
//       {/* CHILD MODAL */}
//       <Modal visible={showChildModal} transparent animationType="fade">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalBox}>
//             <Text style={styles.modalTitle}>Select Child</Text>
//             {children.map(c => (
//               <TouchableOpacity key={c.id} onPress={() => sendOTP(c.id)}>
//                 <Text style={styles.childName}>{c.name}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>
//       </Modal>
 
//       <Toast />
//     </KeyboardAvoidingView>
//   );
// };
 
// export default LoginScreen;
 
 
 
 
 
 
 
// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     backgroundColor: '#fff',
//   },
 
//   // sheet: {
//   //   marginTop: -60,
//   //   backgroundColor: '#fff',
//   //   borderTopLeftRadius: 24,
//   //   borderTopRightRadius: 24,
//   //   padding: 20,
//   // },
 
 
// sheet: {
//   marginTop: -80,   // 👈 updated
//   backgroundColor: '#fff',
//   borderTopLeftRadius: 24,
//   borderTopRightRadius: 24,
//   padding: 20,
//   paddingTop: 24,   // 👈 added
// },
 
 
 
//   title: {
//     fontSize: 26,
//     fontWeight: '700',
//     marginBottom: 20,
//     color: '#3E2A1F',
//     fontFamily: 'Quicksand-Bold',
//   },
 
//   inputBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 12,
//     height: 52,
//     paddingHorizontal: 14,
//     marginBottom: 4,
//   },
 
//   code: {
//     color: '#7A7A7A',
//     fontSize: 16,
//     fontFamily: 'Quicksand-Regular',
//   },
 
//   divider: {
//     width: 1,
//     height: 24,
//     backgroundColor: '#616161',
//     marginHorizontal: 10,
//   },
 
//   input: {
//     flex: 1,
//     fontSize: 18,
//     color: '#000',
//     fontFamily: 'Quicksand-Regular',
//   },
 
//   orRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 10,
//   },
 
//   line: {
//     flex: 1,
//     height: 1,
//     backgroundColor: '#E0E0E0',
//     marginHorizontal: 20,
//   },
 
//   or: {
//     marginHorizontal: 10,
//     color: '#616161',
//     fontFamily: 'Quicksand-Regular',
//   },
 
//   otpLabel: {
//     marginBottom: 10,
//     color: '#000000',
//     fontFamily: 'Quicksand-Medium',
//   },
 
//   otpRow: {
//     justifyContent: 'space-between',
//     marginBottom: 10,
//   },
 
//   otpBox: {
//     width: 45,
//     height: 50,
//     borderWidth: 1,
//     borderColor: '#F2A65A',
//     borderRadius: 10,
//     textAlign: 'center',
//     fontSize: 18,
//     color: '#000',
//     fontFamily: 'Quicksand-Bold',
//   },
 
//   resend: {
//     textAlign: 'center',
//     color: '#000000',
//     marginTop: 50,
//     fontSize: 16,
//     fontFamily: 'Quicksand-Medium',
//   },
 
//   resendSpan: {
//     color: '#000000',
//     fontWeight: '700',
//     fontFamily: 'Quicksand-Medium',
//   },
 
//   timer: {
//     textAlign: 'center',
//     color: '#000000',
//     marginTop: 4,
//     fontFamily: 'Quicksand-Regular',
//   },
 
//   terms: {
//     fontSize: 14,
//     color: '#444',
//     lineHeight: 16.5,
//     letterSpacing: 0,
//     marginBottom: 14,
//     marginTop: 10,
//     fontFamily: 'Quicksand-Regular',
//   },
 
//   link: {
//     color: '#E94235',
//     fontFamily: 'Quicksand-Medium',
//   },
 
//   button: {
//     backgroundColor: '#F6A452',
//     height: 52,
//     borderRadius: 14,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 10,
//   },
 
//   buttonText: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: '600',
//     fontFamily: 'Quicksand-Bold',
//   },
 
//   error: {
//     color: '#E94235',
//     marginBottom: 8,
//     marginTop: 4,
//     fontFamily: 'Quicksand-Regular',
//   },
 
//   /* ---------- CHILD MODAL ---------- */
 
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.45)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
 
//   modalBox: {
//     width: '85%',
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 20,
//   },
 
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     marginBottom: 12,
//     textAlign: 'center',
//     fontFamily: 'Quicksand-Bold',
//   },
 
//   childName: {
//     fontSize: 16,
//     color: '#000',
//     textAlign: 'center',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderColor: '#eee',
//     fontFamily: 'Quicksand-Medium',
//   },
 
 
 
//   heroContainer: {
//   position: 'relative',
// },
 
// heroImage: {
 
//     width: '100%',
//     height: SCREEN_HEIGHT * 0.5,
// },
 
// heroTitle: {
//   position: 'absolute',
//   top: 10,
//   left: 20,
//   color: '#fff',
//   fontSize: 28,
//   fontFamily: 'Quicksand-Bold',
// },
 
 
// orContainer: {
//   flexDirection: 'row',
//   alignItems: 'center',      // vertically center
//   justifyContent: 'center',  // horizontally center
//   alignSelf: 'center',       // center the whole block
//   marginVertical: 20,
// },
 
// orLine: {
//    width: '30%',                 // short / half line
//   height: 1,
//   backgroundColor: '#111',
// },
 
// orText: {
//   marginHorizontal: 12,
//   color: '#111',
//   fontFamily: 'Quicksand-Bold',
//   fontWeight: 800,
// },
 
 
 
// orline: {
//   width: '30%',
//   flex: 1,
//   height: 1,
//   backgroundColor: '#1E1E1E',
// },
 
 
 
 
 
 
// });
 