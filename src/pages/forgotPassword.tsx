import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../constants/color';
import AuthHeader from '../components/AuthHeader';

// const API_BASE_URL =
//   Platform.OS === 'android'
//     ? 'http://10.0.2.2:5001'
//     : 'http://localhost:5001';
const API_BASE_URL='https://staging.cocoliving.in';
const FORGOT_PASSWORD_URL = `${API_BASE_URL}/api/common/forgot-password`;
const RESET_PASSWORD_URL = `${API_BASE_URL}/api/common/reset-password`;

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();

  const validate = (field, value) => {
    let msg = '';
    if (field === 'email') {
      if (!value.trim()) msg = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = 'Enter a valid email';
    }
    if (field === 'newPassword') {
      if (!value) msg = 'New Password is required';
      else if (value.length < 6) msg = 'Password must be at least 6 characters';
    }
    if (field === 'resetCode' && !value.trim()) msg = 'Reset Code is required';
    return msg;
  };

  const handleSendResetCode = async () => {
    const emailError = validate('email', email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }
    setErrors({});
    setIsSendingCode(true);
    try {
      const res = await axios.post(FORGOT_PASSWORD_URL, { email });
      if (res.status === 200) {
        Toast.show({ type: 'success', text1: 'Code Sent!', text2: res.data.message || 'Check your email for the reset code.' });
        setIsCodeSent(true);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Error sending code. Email not found or server error.' });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isCodeSent) {
      Toast.show({ type: 'error', text1: 'Action Required', text2: 'Please verify email and send the code first.' });
      return;
    }
    const newErrors = {};
    ['email', 'newPassword', 'resetCode'].forEach(field => {
      let value = field === 'email' ? email : field === 'newPassword' ? newPassword : resetCode;
      const err = validate(field, value);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setLoading(true);
    try {
      const res = await axios.post(RESET_PASSWORD_URL, {
        email,
        newPassword,
        resetCode,
      });
      if (res.status === 200) {
        Toast.show({ type: 'success', text1: 'Password Reset Successful!', text2: res.data.message || 'You can now sign in with your new password.' });
        navigation.navigate('Login');
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Password reset failed. Check code and try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.backgroundMain }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AuthHeader />
        <View style={styles.formWrapper}>
          <Text style={styles.welcomeText}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email to receive a password reset code.
          </Text>
          {/* Email field with icon and vertical divider */}
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
              editable={!isCodeSent && !isSendingCode}
            />
          </View>
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}
          {/* OTP field */}
          {isCodeSent && (
            <>
              <View style={styles.inputGroup}>
                <Icon name="key-outline" size={20} color={colors.newPlaceHolder} style={styles.inputIcon} />
                <View style={styles.verticalLine} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter Reset Code"
                  placeholderTextColor={colors.newPlaceHolder}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={resetCode}
                  onChangeText={setResetCode}
                  editable={isCodeSent}
                />
              </View>
              {errors.resetCode && <Text style={styles.error}>{errors.resetCode}</Text>}
              {/* Password field */}
              <View style={styles.inputGroup}>
                <Icon name="lock-closed-outline" size={20} color={colors.newPlaceHolder} style={styles.inputIcon} />
                <View style={styles.verticalLine} />
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor={colors.newPlaceHolder}
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPasswordToggle}>
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={24}
                    color={colors.textDark}
                  />
                </TouchableOpacity>
              </View>
              {errors.newPassword && <Text style={styles.error}>{errors.newPassword}</Text>}
            </>
          )}
          {/* Dynamic Button */}
          <TouchableOpacity
            style={[styles.button, styles.submitButton, (isSendingCode || loading) && styles.buttonDisabled]}
            onPress={isCodeSent ? handleResetPassword : handleSendResetCode}
            disabled={isSendingCode || loading}
          >
            {(isSendingCode || loading) ? (
              <ActivityIndicator color={colors.backgroundMain} />
            ) : (
              <Text style={styles.buttonText}>
                {isCodeSent ? 'Reset Password' : 'Send Code'}
              </Text>
            )}
          </TouchableOpacity>
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Remembered your password?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
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
    // color:colors.newPlaceHolder
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
});

export default ForgotPasswordScreen;
