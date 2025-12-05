import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { InteractionManager } from 'react-native';
// --- Color Palette ---
const COLORS = {
  primary: '#22110A',
  secondary: '#AC9478',
  background: '#EDE7DF',
  accent: '#4F3421',
  card: '#FFFFFF',
};

export function CustomDrawerContent(props: any) {
  const { user, logout } = useAuth();
  const { navigation, state } = props;

const navigationItems = [
  { name: 'Dashboard', route: 'DashboardScreen', icon: 'view-dashboard' },
  // { name: 'Find Stay', route: 'FindStay', icon: 'home-search' },  // ✔ same in both places
  { name: 'Profile', route: 'Profile', icon: 'account' },
  { name: 'Browse Rooms', route: 'BrowseProperties', icon: 'home-city' },
  { name: 'My Bookings', route: 'MyBookings', icon: 'calendar-check' },
  { name: 'Payments', route: 'Payments', icon: 'credit-card' },
  { name: 'Access History', route: 'AccessHistory', icon: 'history' },
  { name: 'Support', route: 'Support', icon: 'headset' },
  { name: 'Events', route: 'Events', icon: 'calendar-star' },
];

  const performLogout = () => {
  logout();

  // 🔹 pehle navigate kar do
  navigation.getParent()?.navigate('Login');

  // 🔹 fir thoda delay ke baad Toast dikhaye
  setTimeout(() => {
    Toast.show({
      type: 'success',
      text1: 'Logged out successfully',
      text2: 'You have been logged out of your account.',
    });
  }, 300);
};

 const handleLogoutConfirmation = () => {
  InteractionManager.runAfterInteractions(() => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => {
            setTimeout(() => {
              performLogout();
            }, 200);
          }
        }
      ]
    );
  });
};
  const isActive = (route: string) =>
    state?.routes && state.index >= 0 && state.routes[state.index]?.name === route;

  return (
    <SafeAreaView style={styles.safeArea}>
      <DrawerContentScrollView {...props} style={styles.drawerContainer}>
        
        {/* 🔹 Logo Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')} // apna logo image rakhna
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* 🔹 User Info */}
        <View style={styles.userInfoContainer}>
          <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0) || 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
            <Text style={styles.userType}>{user?.userType || 'User'}</Text>
          </View>
        </View>

        {/* 🔹 Navigation Items */}
        <View style={styles.navContainer}>
          {navigationItems.map((item) => {
            const active = isActive(item.route);
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.navItem, active && styles.activeNavItem]}
                onPress={() => navigation.navigate(item.route)}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={active ? COLORS.card : COLORS.primary}
                  style={{ marginRight: 10 }}
                />
                <Text style={active ? styles.activeNavText : styles.navText}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 🔹 Logout */}
        <TouchableOpacity
  style={styles.logoutButton}
  onPress={() => {
    console.log("Logout button pressed");  // Debug
    handleLogoutConfirmation();
  }}
>
  <MaterialCommunityIcons name="logout" size={20} color={COLORS.accent} style={{ marginRight: 10 }} />
  <Text style={styles.logoutText}>Logout</Text>
</TouchableOpacity>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  drawerContainer: { flex: 1, backgroundColor: COLORS.background },

  logoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logo: {
    width: '50%',
    height: 40,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor:'#4F3421',
  },

  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: COLORS.card, fontSize: 16, fontWeight: 'bold' },
  userName: { fontSize: 14, fontWeight: '500', color: COLORS.primary },
  userType: { fontSize: 12, color: COLORS.secondary, textTransform: 'capitalize' },

  navContainer: { padding: 16 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  activeNavItem: { backgroundColor: COLORS.accent },
  navText: { fontSize: 14, color: COLORS.primary },
  activeNavText: { fontSize: 14, color: COLORS.card, fontWeight: 'bold' },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary,
    backgroundColor: COLORS.background,
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
  },
  logoutText: { fontSize: 14, color: COLORS.accent, fontWeight: '500' },
});
