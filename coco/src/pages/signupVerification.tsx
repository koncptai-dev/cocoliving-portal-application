import React, { useState } from 'react';
import {  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform,KeyboardAvoidingView,} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import OTPTextInput from 'react-native-otp-textinput';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../constants/color';
import AuthHeader from '../components/AuthHeader';

// --- API Configuration (Placeholder for Signup Verification) ---
const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5001' 
    : 'http://localhost:5001'; 

// Placeholder URLs - Assume these endpoints handle OTP sending and verification for new signups
const SIGNUP_SEND_CODE_URL = `${API_BASE_URL}/api/user/send-otp`; 
const SIGNUP_VERIFY_CODE_URL = `${API_BASE_URL}/api/user/verifyOTP`;

// ------------------------------------------------

const SignupVerificationScreen = () => {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState(''); // Using resetCode for OTP
  
  const [isCodeSent, setIsCodeSent] = useState(false); 
  const [isSendingCode, setIsSendingCode] = useState(false); 
  const [loading, setLoading] = useState(false); 
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const navigation = useNavigation();

  // Custom alert/confirm replacement for environment restrictions
  const customConfirm = (message: string) => {
    console.warn(`CONFIRMATION: ${message}. Proceeding...`);
    return true; 
  };


  const validate = (field: string, value: string) => {
    let msg = '';
    if (field === 'email') {
      if (!value.trim()) msg = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = 'Enter a valid email';
    }
    if (field === 'resetCode' && !value.trim()) msg = 'Verification Code is required';
    return msg;
  };

  // 1. Send Verification Code (Initial Step)
  const handleSendCode = async () => {
    const emailError = validate('email', email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }
    
    // Allow Resend if already sent
    if (isCodeSent && !customConfirm('Are you sure you want to resend the code? This will invalidate the previous code.')) {
        return;
    }

    setErrors({});
    setIsSendingCode(true);
    try {
      // Check if email already exists or send OTP
      const res = await axios.post(SIGNUP_SEND_CODE_URL, { email });
      
      if (res.status === 200) {
        Toast.show({ type: 'success', text1: 'Code Sent!', text2: res.data.message || 'Check your email for the verification code.' });
        setIsCodeSent(true); 
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Error sending code. Email might already be registered or server error.' });
    } finally {
      setIsSendingCode(false);
    }
  };

  // 2. Verify Code and Proceed to Signup (Final Submit)
  const handleVerifyCode = async () => {
    // 1. Basic Validation
    if (!isCodeSent) {
        Toast.show({ type: 'error', text1: 'Action Required', text2: 'Please send the verification code first.' });
        return;
    }
      
    const newErrors: any = {};
    const codeError = validate('resetCode', resetCode);
    if (codeError) newErrors.resetCode = codeError;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      // API call to verify the code
      const res = await axios.post(SIGNUP_VERIFY_CODE_URL, { 
          email, 
          otp: resetCode,
      });
      
      if (res.status === 200) {
        Toast.show({ type: 'success', text1: 'Verification Successful!', text2: res.data.message || 'Proceeding to registration details.' });
        
        // Success: Redirect to the main Signup screen, passing the verified email
        navigation.navigate('Signup', { verifiedEmail: email }); 
      }
    } catch (err: any) {
      // Backend will handle verification code validation (correctness and expiration)
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Verification failed. Check code and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = isSendingCode || loading; 

  return (
    <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.backgroundMain }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AuthHeader />

        <View style={styles.formWrapper}>
          <Text style={styles.welcomeText}>
            {isCodeSent ? 'Verify Your Email' : 'Sign Up'}
          </Text>
          <Text style={styles.subtitle}>
            {isCodeSent 
                ? 'Enter the code sent to your email to continue registration.'
                : 'Enter your email to receive a verification code.'
            }
          </Text>

          {/* 1. Email Field (Hidden once code is sent) */}
          {!isCodeSent && (
            <>
              <View style={styles.inputGroup}>
                <Icon name="mail-outline" size={20} color={colors.newPlaceHolder} style={styles.inputIcon} />
                <View style={styles.verticalLine} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={colors.newPlaceHolder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSendingCode} 
                />
              </View>
              {errors.email && <Text style={styles.error}>{errors.email}</Text>}
            </>
          )}
          
          {/* 2. Reset Code Field (Visible only after code is sent) */}
          {isCodeSent && (
            <>
              <Text style={styles.emailDisplay}>Code sent to: {email}</Text>

              {/* NEW OTP BOX INPUT */}
              <OTPTextInput
                inputCount={5}
                handleTextChange={(val) => setResetCode(val)}
                containerStyle={styles.otpContainer}
                textInputStyle={styles.otpInputBox}
                tintColor={colors.primary}
              />

              {errors.resetCode && <Text style={styles.error}>{errors.resetCode}</Text>}
            </>
          )}
          
          {/* Dynamic Action Button (Send Code or Verify Code) */}
          <TouchableOpacity 
              style={[styles.button, styles.submitButton, isButtonDisabled && styles.buttonDisabled]} 
              onPress={isCodeSent ? handleVerifyCode : handleSendCode} 
              disabled={isButtonDisabled}
          >
              {isButtonDisabled ? (
                  <ActivityIndicator color={colors.backgroundMain} />
              ) : (
                  <Text style={styles.buttonText}>
                      {/* Simplified button text logic */}
                      {isCodeSent ? 'Verify Code' : 'Send Code'} 
                  </Text>
              )}
          </TouchableOpacity>

          {/* Resend Link (Visible when code is sent) */}
          {isCodeSent && (
            <TouchableOpacity onPress={handleSendCode} disabled={isSendingCode}>
                <Text style={styles.resendLink}>
                    {isSendingCode ? 'Resending...' : 'Resend Code'}
                </Text>
            </TouchableOpacity>
          )}

          
          {/* Back to Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={()=>navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};

// Reusing styles from forgotPassword.js
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
        marginTop: -80,
      },
      welcomeText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
        marginTop: 10,
      },
      subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 25,
        color: colors.border,
        paddingHorizontal: 40,
      },
      verticalLine: {
        width: 1,
        height: 24,
        backgroundColor: colors.newPlaceHolder,
        marginHorizontal: 8,
      },
      inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        height:45,
        backgroundColor: colors.newBackground,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: colors.newTextColor,
      },
      inputIcon: {
        marginRight: 10,
      },
      input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.newTextColor,
      },
      showPasswordToggle: {
        padding: 5,
      },
      button: {
        width: '90%',
        padding: 10,
        height:40,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 15,
      },
      submitButton: {
        backgroundColor: colors.primary,
      },
      buttonDisabled: {
        backgroundColor: colors.border,
      },
      buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
      error: {
        color: colors.error,
        fontSize: 12,
        marginBottom: 5,
        width: '90%',
        textAlign: 'left',
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
});

export default SignupVerificationScreen;
