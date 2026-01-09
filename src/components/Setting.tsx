import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
 
type PreferenceKey =
  | 'pushnotifications'
  | 'enableall'
  | 'newsletters'
  | 'email';
 
const baseURL = 'https://staging.cocoliving.in';
 
const NotificationSettingsScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();
 
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
 
  const [preferences, setPreferences] = useState<Record<PreferenceKey, boolean>>({
    pushnotifications: true,
    enableall: true,
    newsletters: true,
    email: true,
  });
 
  /** 🔹 Build API payload as backend wants */
  const buildPayload = (
    push: boolean,
    prefs: Record<PreferenceKey, boolean>
  ) => {
    const payload = {
      pushEnabled: push,
      notificationPreferences: {
        email: Boolean(prefs.email),
        newsletters: Boolean(prefs.newsletters),
      },
    };
 
    // 🔍 Debug
    console.log('🧪 PAYLOAD TYPE CHECK');
    console.log('notificationPreferences is array?', Array.isArray(payload.notificationPreferences));
    console.log('📦 FINAL PAYLOAD:', payload);
 
    return payload;
  };
 
  const updateSettings = async (
    push: boolean,
    prefs: Record<PreferenceKey, boolean>
  ) => {
    try {
      const url = `${baseURL}/api/fcm/notification-settings`;
      const payload = buildPayload(push, prefs);
 
      console.log('🌐 URL:', url);
 
      await axios.post(url, payload, {
        headers: {
          //'Content-Type': 'application/json',
          //Accept: 'application/json',
          Authorization: `Bearer ${user.token}`, // 🔥 REQUIRED
        },
      });
 
      console.log('✅ Notification settings updated successfully');
    } catch (error) {
      console.log('❌ Failed to update notification settings', error);
    }
  };
 
  const handlePushToggle = (value: boolean) => {
    setPushEnabled(value);
 
    const updatedPrefs: Record<PreferenceKey, boolean> = value
      ? { ...preferences }
      : {
          pushnotifications: false,
          enableall: false,
          newsletters: false,
          email: false,
        };
 
    setPreferences(updatedPrefs);
    updateSettings(value, updatedPrefs); // ✅ pass current toggle value
  };
 
  const handleEnableAll = (value: boolean) => {
    const updatedPrefs: Record<PreferenceKey, boolean> = {
      pushnotifications: value,
      enableall: value,
      newsletters: value,
      email: value,
    };
 
    setPreferences(updatedPrefs);
    updateSettings(pushEnabled, updatedPrefs); // pushEnabled already correct
  };
 
  const handleSingleToggle = (key: PreferenceKey, value: boolean) => {
    const updatedPrefs: Record<PreferenceKey, boolean> = {
      ...preferences,
      [key]: value,
    };
 
    // auto-handle enableall (email + newsletters only)
    updatedPrefs.enableall = updatedPrefs.email && updatedPrefs.newsletters;
 
    setPreferences(updatedPrefs);
    updateSettings(pushEnabled, updatedPrefs);
  };
 
  const renderItem = (
    label: string,
    value: boolean,
    onChange: (v: boolean) => void
  ) => (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E5E5E5', true: '#A5D6A7' }}
        thumbColor={value ? '#2E7D32' : '#F4F3F4'}
      />
    </View>
  );
 
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4E342E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
      </View>
 
      {renderItem('Push Notifications', pushEnabled, handlePushToggle)}
      {renderItem('Enable all', preferences.enableall, handleEnableAll)}
      {renderItem(
        'Newsletters',
        preferences.newsletters,
        (v) => handleSingleToggle('newsletters', v)
      )}
      {renderItem(
        'Email',
        preferences.email,
        (v) => handleSingleToggle('email', v)
      )}
    </SafeAreaView>
  );
};
 
export default NotificationSettingsScreen;
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4E342E',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#F5F7F8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  label: {
    fontSize: 16,
    color: '#000',
  },
});