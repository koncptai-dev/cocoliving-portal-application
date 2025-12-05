import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import OTPTextInput from 'react-native-otp-textinput';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../constants/color';
import AuthHeader from '../components/AuthHeader';
import { useAuth } from '../context/AuthContext';

// const API_BASE_URL = 'https://staging.cocoliving.in';
const API_BASE_URL="http://10.0.2.2:5001";

const LOGIN_SEND_OTP = `${API_BASE_URL}/api/common/login/request-otp`;
const LOGIN_VERIFY_OTP = `${API_BASE_URL}/api/common/login/verify-otp`;

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();
  const { setUser } = useAuth();

  const validateEmail = (value) => {
    if (!value.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter valid email";
    return "";
  };

const sendOTP = async () => {
  const err = validateEmail(email);
  if (err) return setErrors({ email: err });

  setErrors({});
  setSending(true);

  try {
    const res = await axios.post(LOGIN_SEND_OTP, { email });
    console.log("responseofLogin: ", res);

    Toast.show({ type: "success", text1: "OTP sent to your email" });
    setIsOTPSent(true);

  } catch (error) {
    const msg = error?.response?.data?.message || "";

    // 🟢 New user detection via error message
    if (msg === "Email not found") {
      Toast.show({ type: "info", text1: "Account not found — Please sign up" });
      navigation.navigate("Signup", { verifiedEmail: email });
      return; // Exit
    }

    // Other errors
    Toast.show({
      type: "error",
      text1: msg || "Couldn't send OTP"
    });

  } finally {
    setSending(false);
  }
};


  const verifyOTP = async () => {
    if (!otp.trim()) {
      return setErrors({ otp: "OTP is required" });
    }

    setErrors({});
    setVerifying(true);
    try {
      const res = await axios.post(LOGIN_VERIFY_OTP, { email, otp });

      if (res.data?.success) {
        const { token, account } = res.data;
        await setUser({ ...account, token });
        Toast.show({ type: "success", text1: "Login successful" });
        return;
      }

      Toast.show({ type: "error", text1: res.data?.message || "Invalid OTP" });

    } catch (error) {
      Toast.show({
        type: "error",
        text1: error?.response?.data?.message || "Invalid OTP"
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.backgroundMain }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AuthHeader />

        <View style={styles.formWrapper}>
          <Text style={styles.welcomeText}>{isOTPSent ? "Verify OTP" : "Login"}</Text>
          <Text style={styles.subtitle}>
            {isOTPSent
              ? "Enter the OTP sent to your email to proceed"
              : "Enter your email to receive login OTP"}
          </Text>

          {/* Email input (hide after OTP sent) */}
          {!isOTPSent && (
            <>
              <View style={styles.inputGroup}>
                <Icon name="mail-outline" size={20} color={colors.newPlaceHolder} />
                <View style={styles.verticalLine} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={colors.newPlaceHolder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text style={styles.error}>{errors.email}</Text>}
            </>
          )}

          {/* OTP Field */}
          {isOTPSent && (
            <>
              <Text style={styles.emailDisplay}>OTP sent to: {email}</Text>
              <OTPTextInput
                inputCount={6}
                handleTextChange={val => setOtp(val)}
                containerStyle={styles.otpContainer}
                textInputStyle={styles.otpInputBox}
                tintColor={colors.primary}
              />
              {errors.otp && <Text style={styles.error}>{errors.otp}</Text>}
            </>
          )}

          {/* Main Button */}
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={isOTPSent ? verifyOTP : sendOTP}
            disabled={sending || verifying}
          >
            {(sending || verifying)
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>{isOTPSent ? "Verify OTP" : "Send OTP"}</Text>
            }
          </TouchableOpacity>

          {/* Resend OTP */}
          {isOTPSent && (
            <TouchableOpacity onPress={sendOTP} disabled={sending}>
              <Text style={styles.resendLink}>{sending ? "Resending..." : "Resend OTP"}</Text>
            </TouchableOpacity>
          )}

          {/* Move to signup */}
          <View style={styles.loginContainer}>
            {/* <Text style={styles.loginText}>Don't have an account?</Text> */}
            <TouchableOpacity onPress={() => navigation.navigate("SignupVerification")}>
              {/* <Text style={styles.loginLink}>Sign Up</Text> */}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff', 
    paddingBottom: 30,
  },
  formWrapper: {
    alignItems: 'center', 
    width: '100%', 
    paddingHorizontal: 0,
    marginTop: -80, // Overlap effect
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4F3421',
    textAlign: 'center',
    marginTop: 10,
  },
  verticalLine: {
        width: 1,
        height: 24,
        backgroundColor: colors.newPlaceHolder,
        marginHorizontal: 8,
      },
      submitButton: {
        backgroundColor: colors.primary,
      },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    color: '#AC9478',
    paddingHorizontal: 40,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    height:45,
    backgroundColor: '#E2E2E2',
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#000000',
  },
  inputIcon: {
    marginRight: 10,

  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
  },
  togglePassword: {
    padding: 5,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginRight: '5%',
  },
  forgotPasswordText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    width: '90%',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    height:45
  },
  loginButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    height:22,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: colors.backgroundMain,
    borderColor: colors.border,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: '500',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    width: '90%',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    width: 50,
    textAlign: 'center',
    color: colors.border,
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  signupText: {
    color: colors.textDark,
    fontSize: 14,
  },
  signupLink: {
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 14,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: '5%',
  },
  emailDisplay: { // New style for displaying the email after code is sent
        color: colors.textDark,
        fontSize: 14,
        marginBottom: 10,
        width: '90%',
        textAlign: 'left',
      },
      resendLink: { // New style for Resend link
        color: colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: -5,
        marginBottom: 20,
      },
    otpContainer: {
    width: '90%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  otpInputBox: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: colors.newTextColor,
    backgroundColor: colors.newBackground,
    color: colors.newTextColor,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20,
      },
      loginText: {
        color: colors.textDark,
        fontSize: 14,
      },
      loginLink: {
        color: colors.primary,
        fontWeight: 'bold',
        marginLeft: 5,
        fontSize: 14,
      },
});

export default LoginScreen;
