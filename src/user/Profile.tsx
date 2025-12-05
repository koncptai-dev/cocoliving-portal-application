import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import colors from '../constants/color';

const { width } = Dimensions.get('window');
const isLargeScreen = width > 768;

const baseURL = 'https://staging.cocoliving.in' 

// Simple Dropdown Component (simulating a basic dropdown for this example)
const Dropdown = ({ label, value, options, onSelect, editable, error }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                style={[
                    styles.dropdownButton,
                    error && styles.inputError,
                    !editable && styles.dropdownDisabled,
                ]}
                onPress={() => editable && setIsOpen(!isOpen)}
                disabled={!editable}
            >
                <Text style={styles.dropdownText}>
                    {value || `Select ${label.toLowerCase()}`}
                </Text>
                <Ionicons
                    name={isOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                    size={16}
                    color={colors.textDark}
                />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {isOpen && editable && (
                <View style={styles.dropdownOptions}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={styles.dropdownItem}
                            onPress={() => {
                                onSelect(option.value);
                                setIsOpen(false);
                            }}
                        >
                            <Text style={styles.dropdownItemText}>{option.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [localImageUri, setLocalImageUri] = useState(null);
  
  // UPDATED: Removed bio, emergencyContact, livingPreferences. Added foodPreference, allergies.
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    profileImage: '',
    parentName: '',
    parentMobile: '',
    collegeName: '',
    course: '',
    companyName: '',
    position: '',
    foodPreference: '', // New field for Jain/Non-Jain
    allergies: '',      // New field for allergies
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  const fetchUserProfile = async () => {
    try {
      if (!user?.id || !user?.token) return;
      const res = await axios.get(`${baseURL}/api/user/getUser/${user.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      console.log("User profile picture response: ",res)
      // Filter out fields that no longer exist on the form but might be in the database
      const { bio, emergencyContact, livingPreferences, ...restData } = res.data.user;
      setFormData(prev => ({
          ...prev, 
          ...restData, 
          // Ensure new fields are initialized even if not in DB response yet
          profileImage: profileImage || '',
          foodPreference: restData.foodPreference || '', 
          allergies: restData.allergies || ''
      }));
      console.log("profile image checking: ",res.data.user.profileImage)
      setLocalImageUri(res.data.user.profileImage || null);
      if (typeof res.data.user.profileImage !== 'string' && res.data.user.profileImage !== null) {
          console.error("Profile Image URL is not a valid string or null:", res.data.user.profileImage);
          setLocalImageUri(null); // Force it to null to skip rendering
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to load profile data.' });
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user]);

  const handleImageChange = () => {
    if (!isEditing) return;
    const options = {
      mediaType: 'photo',
      quality: 1,
    };
    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setProfileImage(asset);
        setLocalImageUri(asset.uri);
      }
    });
  };

  const validateField = (name, value) => {
    let message = '';
    if (name === 'fullName' && !value.trim()) {
      message = 'Full Name is required.';
    }
    if (name === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) message = 'Invalid email format.';
    }
    if (name === 'phone' && value) {
      if (!/^\d{10}$/.test(value)) message = 'Phone must be 10 digits.';
    }
    if (name === 'parentPhone' && value) {
      if (!/^\d{10}$/.test(value)) message = 'Parent Phone must be 10 digits.';
    }
    return message;
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    const errorMessage = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: errorMessage }));
  };
  
  // Placeholder function for password change
  const handleChangePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Toast.show({ type: 'error', text1: 'All fields are required' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }
    try {
      await axios.post(
        `${baseURL}/api/common/change-password`,
        { oldPassword, newPassword, confirmPassword },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      Toast.show({ type: 'success', text1: 'Password changed successfully!' });
      setShowPasswordForm(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Failed to change password.',
      });
    }
  };


  const handleSave = async () => {
    try {
      let newErrors = {};
      
      // Validation check
      Object.keys(formData).forEach((key) => {
        // Skip validation for fields that are conditionally present or optional
        if (!['parentName', 'parentMobile', 'collegeName', 'course', 'companyName', 'position'].includes(key)) {
            const msg = validateField(key, formData[key]);
            if (msg) newErrors[key] = msg;
        }
      });
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        Toast.show({ type: 'error', text1: 'Please fix validation errors.' });
        return;
      }
      
      const data = new FormData();
      
      // Ensure only the current form fields are sent
      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (value !== null && value !== undefined && String(value).trim() !== '') {
            // Exclude student/professional fields if not applicable
            const isUserTypeField = (isStudent && ['companyName', 'position'].includes(key)) || (isProfessional && ['parentName', 'parentPhone', 'collegeName', 'course'].includes(key));
            if (!isUserTypeField) {
                data.append(key, value);
            }
        }
      });

      if (profileImage) {
        data.append('profileImage', {
          uri: profileImage.uri,
          type: profileImage.type,
          name: profileImage.fileName,
        });
      }
      
      await axios.put(`${baseURL}/api/user/update-profile/${user.id}`, data, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      Toast.show({ type: 'success', text1: 'Profile updated successfully!' });
      setIsEditing(false);
      setProfileImage(null);
      // setLocalImageUri(null);
      await fetchUserProfile();
      
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        Toast.show({
          type: 'error',
          text1: error.response?.data?.message || 'Update failed',
        });
      }
    }
  };

  const getUserTypeInfo = () => {
    if (user?.userType === 'student') {
      return {
        label: 'Student',
        color: colors.primary,
        description: 'Verified student account with special rates',
      };
    }
    if (user?.userType === 'professional') {
      return {
        label: 'Professional',
        color: colors.accent,
        description: 'Working professional account',
      };
    }
    return {
      label: 'User',
      color: colors.border,
      description: 'Standard user account',
    };
  };

  const userTypeInfo = getUserTypeInfo();
  const displayUri = localImageUri || formData.profileImage;
  const initial = formData?.fullName?.charAt(0)?.toUpperCase() || 'U';
  const showImage = !!displayUri;
  const isStudent = user?.userType === 'student';
  const isProfessional = user?.userType === 'professional';
  
  const foodPreferenceOptions = [
      { label: 'Jain', value: 'Jain' },
      { label: 'Non-Jain', value: 'Non-Jain' },
  ];

  // Render
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile Settings</Text>
        <Text style={styles.subtitle}>
          Manage your personal information and account preferences.
        </Text>
      </View>

      <View style={styles.mainSection}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="person" size={20} color={colors.border} style={styles.icon} />
              <Text style={styles.cardTitle}>Personal Information</Text>
            </View>
            <TouchableOpacity
              style={[styles.editButton, isEditing && styles.saveButton]}
              onPress={isEditing ? handleSave : () => setIsEditing(true)}
            >
              <Ionicons
                name={isEditing ? 'save-outline' : 'create-outline'}
                size={16}
                color={colors.primary}
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>{isEditing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.avatarContainer}>
              {showImage ? (
                <Image source={{ uri: displayUri }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: userTypeInfo.color }]}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}
              <View style={styles.avatarInfo}>
                <Text style={styles.avatarName}>{formData.fullName}</Text>
                <View style={[styles.badge, { width: 100 }]}>
                  <Text style={styles.badgeText}>{userTypeInfo.label}</Text>
                </View>
                <Text style={styles.avatarDescription}>{userTypeInfo.description}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.changePhotoButton,
                  {
                    opacity: isEditing ? 1 : 0.6,
                    backgroundColor: colors.backgroundMain,
                  },
                  !isEditing && styles.disabledButton,
                ]}
                onPress={handleImageChange}
                disabled={!isEditing}
              >
                <Ionicons
                  name="camera-outline"
                  size={16}
                  color={colors.primary}
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonTextSmall}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formVertical}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.fullName && styles.inputError,
                    { color: isEditing ? colors.textDark : colors.border },
                  ]}
                  value={formData.fullName}
                  onChangeText={(value) => handleChange('fullName', value)}
                  editable={isEditing}
                />
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.inputError,
                    { color: isEditing ? colors.textDark : colors.border },
                  ]}
                  value={formData.email}
                  onChangeText={(value) => handleChange('email', value)}
                  editable={isEditing}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.phone && styles.inputError,
                    { color: isEditing ? colors.textDark : colors.border },
                  ]}
                  value={formData.phone}
                  onChangeText={(value) => handleChange('phone', value)}
                  editable={isEditing}
                  keyboardType="phone-pad"
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              {/* Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.address && styles.inputError,
                    { color: isEditing ? colors.textDark : colors.border },
                  ]}
                  value={formData.address}
                  onChangeText={(value) => handleChange('address', value)}
                  editable={isEditing}
                />
                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
              </View>
              
              {/* STUDENT FIELDS (Moved up to be directly after Address) */}
              {isStudent && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Parent Name</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.parentName && styles.inputError,
                        { color: isEditing ? colors.textDark : colors.border },
                      ]}
                      value={formData.parentName || ''}
                      onChangeText={(value) => handleChange('parentName', value)}
                      editable={isEditing}
                    />
                    {errors.parentName && (
                      <Text style={styles.errorText}>{errors.parentName}</Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Parent Phone Number</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.parentMobile && styles.inputError,
                        { color: isEditing ? colors.textDark : colors.border },
                      ]}
                      value={formData.parentMobile || ''}
                      onChangeText={(value) => handleChange('parentMobile', value)}
                      editable={isEditing}
                      keyboardType="phone-pad"
                    />
                    {errors.parentMobile && (
                      <Text style={styles.errorText}>{errors.parentMobile}</Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>College Name</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.collegeName && styles.inputError,
                        { color: isEditing ? colors.textDark : colors.border },
                      ]}
                      value={formData.collegeName || ''}
                      onChangeText={(value) => handleChange('collegeName', value)}
                      editable={isEditing}
                    />
                    {errors.collegeName && (
                      <Text style={styles.errorText}>{errors.collegeName}</Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Course</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.course && styles.inputError,
                        { color: isEditing ? colors.textDark : colors.border },
                      ]}
                      value={formData.course || ''}
                      onChangeText={(value) => handleChange('course', value)}
                      editable={isEditing}
                    />
                    {errors.course && (
                      <Text style={styles.errorText}>{errors.course}</Text>
                    )}
                  </View>
                </>
              )}

              {/* PROFESSIONAL FIELDS (Moved up to be directly after Address) */}
              {isProfessional && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Company Name</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.companyName && styles.inputError,
                        { color: isEditing ? colors.textDark : colors.border },
                      ]}
                      value={formData.companyName || ''}
                      onChangeText={(value) => handleChange('companyName', value)}
                      editable={isEditing}
                    />
                    {errors.companyName && (
                      <Text style={styles.errorText}>{errors.companyName}</Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Position</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.position && styles.inputError,
                        { color: isEditing ? colors.textDark : colors.border },
                      ]}
                      value={formData.position || ''}
                      onChangeText={(value) => handleChange('position', value)}
                      editable={isEditing}
                    />
                    {errors.position && (
                      <Text style={styles.errorText}>{errors.position}</Text>
                    )}
                  </View>
                </>
              )}
              
              {/* NEW FIELD: Food Preference (Dropdown) */}
              <Dropdown
                  label="Food Preference"
                  value={formData.foodPreference}
                  options={foodPreferenceOptions}
                  onSelect={(value) => handleChange('foodPreference', value)}
                  editable={isEditing}
                  error={errors.foodPreference}
              />
              
              {/* NEW FIELD: Allergies */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Allergies</Text>
                <TextInput
                  style={[
                    styles.textarea,
                    errors.allergies && styles.inputError,
                    { color: isEditing ? colors.textDark : colors.border },
                  ]}
                  value={formData.allergies}
                  onChangeText={(value) => handleChange('allergies', value)}
                  editable={isEditing}
                  multiline
                  numberOfLines={2}
                  placeholder="e.g., Peanuts, Gluten, Lactose"
                />
                {errors.allergies && <Text style={styles.errorText}>{errors.allergies}</Text>}
              </View>

              {/* REMOVED FIELDS: bio, emergencyContact, livingPreferences */}

            </View>
          </View>
        </View>

        {/* Document Verification Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="document-text-outline" size={20} color={colors.border} style={styles.icon} />
              <Text style={styles.cardTitle}>Document Verification</Text>
            </View>
          </View>
          <View style={styles.cardContent} />
        </View>
      </View>

      {/* Sidebar */}
      <View style={styles.sidebar}>
        {/* Profile Overview Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Overview</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.overviewCenter}>
              <Text style={styles.completePercent}>92%</Text>
              <Text style={styles.completeText}>Profile Complete</Text>
            </View>
            <View style={styles.progressOuter}>
              <View style={styles.progressInner} />
            </View>
          </View>
        </View>

        {/* Verification Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Ionicons name="shield-outline" size={20} color={colors.border} style={styles.icon} />
              <Text style={styles.cardTitle}>Verification Status</Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.verificationItem}>
              <Text style={styles.verificationText}>Email Verified</Text>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            </View>
            <View style={styles.verificationItem}>
              <Text style={styles.verificationText}>Phone Verified</Text>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            </View>
            <View style={styles.verificationItem}>
              <Text style={styles.verificationText}>ID Verified</Text>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            </View>
            <View style={styles.verificationItem}>
              <Text style={styles.verificationText}>Background Check</Text>
              <Ionicons name="time-outline" size={16} color={colors.accent} />
            </View>
          </View>
        </View>

        {/* Account Settings Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Account Settings</Text>
          </View>
          <View style={styles.cardContent}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowPasswordForm(true)}
            >
              <Ionicons name="shield-outline" size={16} color={colors.primary} style={styles.buttonIcon} />
              <Text style={styles.settingsButtonText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="notifications-outline" size={16} color={colors.primary} style={styles.buttonIcon} />
              <Text style={styles.settingsButtonText}>Notification Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="document-text-outline" size={16} color={colors.primary} style={styles.buttonIcon} />
              <Text style={styles.settingsButtonText}>Download Data</Text>
            </TouchableOpacity>
            {/* Delete commented out */}
            {showPasswordForm && (
              <View style={styles.passwordCard}>
                <Text style={styles.passwordTitle}>Change Password</Text>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.input}
                    placeholder="Current Password"
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry
                  />
                </View>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.saveButtonSmall} onPress={handleChangePassword}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cancelButton]}
                    onPress={() => setShowPasswordForm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
      <Toast />
    </ScrollView>
  );
};

// ... (Existing styles remain, plus new ones for dropdown)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMain, // Using colors for consistency
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark, // Mapped from '#000000'
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textDark, // Mapped from '#6b7280'
  },
  mainSection: {
    marginBottom: 24,
  },
  sidebar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#ffffff', // Using colors for card background
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
    width: isLargeScreen ? '65%' : '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border, // Mapped from '#f3f4f6'
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark, // Mapped from '#000000'
  },
  icon: {
    marginRight: 8,
  },
  cardContent: {
    padding: 16,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    color: colors.backgroundMain, // Assuming white for avatar text
    fontSize: 32,
    fontWeight: 'bold',
  },
  avatarInfo: {
    flex: 1,
    marginLeft: 16,
  },
  avatarName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textDark, // Mapped from '#000000'
    marginBottom: 4,
  },
  badge: {
    backgroundColor: colors.primary, // Mapped from '#3b82f6'
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20, // Increased border radius for user type badge
    marginBottom: 4,
  },
  badgeText: {
    color: colors.backgroundMain, // Assuming white
    fontSize: 12,
    fontWeight: '500',
  },
  avatarDescription: {
    fontSize: 14,
    color: colors.border, // Mapped from '#6b7280'
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border, // Mapped from '#d1d5db'
    borderRadius: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  formVertical: { // New style for vertical stacking of fields
    flexDirection: 'column',
  },
  inputGroup: {
    width: '100%', // Full width for vertical layout
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textDark, // Mapped from '#374151'
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border, // Mapped from '#d1d5db'
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.backgroundMain, // Using colors for input bg
    color: colors.textDark,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.border, // Mapped from '#d1d5db'
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.backgroundMain, // Using colors for textarea bg
    textAlignVertical: 'top',
    minHeight: 80,
    color: colors.textDark,
  },
  inputError: {
    borderColor: colors.error, // Mapped from '#ef4444'
  },
  errorText: {
    color: colors.error, // Mapped from '#ef4444'
    fontSize: 12,
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border, // Mapped from '#d1d5db'
    borderRadius: 6,
    backgroundColor: colors.backgroundMain, // Using colors for button bg
  },
  saveButton: {
    backgroundColor: colors.backgroundMain, // Mapped from '#3b82f6'
    borderColor: colors.primary,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: colors.primary, // Mapped from '#3b82f6'
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextSmall: {
    color: colors.primary, // Mapped from '#3b82f6'
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  overviewCenter: {
    alignItems: 'center',
    marginBottom: 8,
  },
  completePercent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary, // Mapped from '#3b82f6'
  },
  completeText: {
    fontSize: 14,
    color: colors.border, // Mapped from '#6b7280'
  },
  progressOuter: {
    backgroundColor: colors.border, // Mapped from '#e5e7eb'
    height: 8,
    borderRadius: 4,
  },
  progressInner: {
    backgroundColor: colors.primary, // Mapped from '#3b82f6'
    height: 8,
    borderRadius: 4,
    width: '92%',
  },
  verificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 14,
    color: colors.textDark, // Mapped from '#374151'
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundMain,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    marginBottom: 14, // Gap between options
  },
  settingsButtonText: {
    color: colors.textDark, // Mapped from '#374151'
    fontSize: 16,
    fontWeight:500,
    marginLeft: 8,
  },
  passwordCard: {
    marginTop: 16,
    padding: 16,
    borderColor:colors.border,
    borderWidth:1,
    backgroundColor:'#ffffff'
  },
  passwordTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark, // Mapped from '#000000'
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  saveButtonSmall: {
    flex: 1,
    backgroundColor: colors.textDark, // Mapped from '#3b82f6'
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff', // Assuming white
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    flex: 1,
     backgroundColor: colors.backgroundMain, // Main background for cancel
    borderWidth: 1,
    borderColor: colors.border, // Mapped from '#d1d5db'
    padding: 9,
    borderRadius: 16,
    alignItems: 'center',
    
  },
  cancelButtonText: {
    color: colors.textDark, // Mapped from '#374151'
    fontSize: 16,
    fontWeight: '500',
  },
  // NEW STYLES FOR DROPDOWN
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    backgroundColor: colors.backgroundMain,
  },
  dropdownDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.textDark,
  },
  dropdownOptions: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: '#ffffff',
    position: 'absolute', // To overlay other content
    width: '100%',
    zIndex: 10, // Ensure it's on top
    maxHeight: 150,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.textDark,
  }
});

export default Profile;