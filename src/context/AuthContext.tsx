import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain'; // For secure token storage (Expo); fallback below
import jwtDecode from 'jwt-decode'; // For token expiry checks
import Toast from 'react-native-toast-message';

interface BaseUser {
  id: string;
  token: string;
  role: string;
  refreshToken?: string; // Optional: If using refresh tokens
}

export interface NormalUser extends BaseUser {
  role: 'user';
  fullName: string;
  userType: string;
}

export type User = NormalUser;

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => Promise<void>;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: async () => {},
  isLoading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper: Keychain storage (secure for tokens)
 const getSecureStore = async (key: string) => {
  try {
    const creds = await Keychain.getGenericPassword();
    if (creds && creds.username === key) {
      return creds.password;
    }
    return null;
  } catch (err) {
    console.log('⚠️ Keychain get failed, using AsyncStorage instead', err.message);
    return await AsyncStorage.getItem(key);
  }
};

const setSecureStore = async (key: string, value: string) => {
  try {
    if (!value) {
      console.warn(`Skipping Keychain/AsyncStorage set: ${key} has undefined value`);
      return;
    }
    await Keychain.setGenericPassword(key, value);
  } catch (err) {
    console.log('⚠️ Keychain set failed, using AsyncStorage instead', err.message);
    await AsyncStorage.setItem(key, value);
  }
};

const removeSecureStore = async (key: string) => {
  try {
    await Keychain.resetGenericPassword();
  } catch (err) {
    console.log('⚠️ Keychain remove failed, using AsyncStorage instead', err.message);
    await AsyncStorage.removeItem(key);
  }
};

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        const storedToken = await getSecureStore('userToken');
        console.log("userToken: ",storedToken)
        if (storedUserData && storedToken) {
          const userData = JSON.parse(storedUserData);
          // Check token expiry
          const decoded = jwtDecode<{ exp: number }>(storedToken);
          if (decoded.exp * 1000 > Date.now()) {
            // Valid: Rebuild user with token
            setUserState({ ...userData, token: storedToken, refreshToken: userData.refreshToken });
          } else {
            // Expired: Auto-logout
            await logout();
            return;
          }
        }
      } catch (err) {
        console.log('Failed to load user from storage', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const setUser = async (newUser: User | null) => {
    setUserState(newUser);
    console.log("newUser: ",newUser)
    try {
      if (newUser) {
        // Store user data (without token) in regular AsyncStorage
        const { token, refreshToken, ...userData } = newUser;
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        // Store token securely
        await setSecureStore('userToken', newUser.token);
        if (refreshToken) {
          await setSecureStore('refreshToken', refreshToken);
        }
      } else {
        await AsyncStorage.removeItem('userData');
        await removeSecureStore('userToken');
        await removeSecureStore('refreshToken');
      }
    } catch (err) {
      console.log('Failed to save user', err);
    }
  };

  const logout = async () => {
    setUserState(null);
    try {
      await AsyncStorage.removeItem('userData');
      await removeSecureStore('userToken');
      await removeSecureStore('refreshToken');
    } catch (err) {
      console.log('Failed to clear auth storage', err);
    }
    Toast.show({
      type: 'info',
      text1: 'Logged out!',
    });
    // Optional: Navigate to login if you have access to navigation here
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);