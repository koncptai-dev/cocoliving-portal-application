import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { jwtDecode } from 'jwt-decode';
import Toast from 'react-native-toast-message';
import axios from 'axios';

/* ================= TYPES ================= */

interface BaseUser {
  id: string;
  token: string;
  role: string;
  refreshToken?: string;
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
  refreshUser: () => Promise<void>;   // ✅ ADD
  isLoading: boolean;
  logout: () => Promise<void>;
}

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: async () => {},
  refreshUser: async () => {},   // ✅ ADD
  isLoading: true,
  logout: async () => {},
});
/* ================= CONSTANTS ================= */

const USER_DATA_KEY = 'userData';
const SECURE_AUTH_KEY = 'secureAuth';
const BASE_URL = "https://staging.cocoliving.in";

/* ================= PROVIDER ================= */

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ---------- SECURE STORAGE HELPERS ---------- */

  const getSecureStore = async (): Promise<{
    token: string;
    refreshToken?: string;
  } | null> => {
    try {
      const creds = await Keychain.getGenericPassword();
      if (!creds) return null;
      return JSON.parse(creds.password);
    } catch (err) {
      console.log('⚠️ Keychain get failed, fallback to AsyncStorage');
      const raw = await AsyncStorage.getItem(SECURE_AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    }
  };

  const setSecureStore = async (data: {
    token: string;
    refreshToken?: string;
  }) => {
    try {
      await Keychain.setGenericPassword(
        SECURE_AUTH_KEY,
        JSON.stringify(data)
      );
    } catch (err) {
      console.log('⚠️ Keychain set failed, fallback to AsyncStorage');
      await AsyncStorage.setItem(SECURE_AUTH_KEY, JSON.stringify(data));
    }
  };

  const removeSecureStore = async () => {
    try {
      await Keychain.resetGenericPassword();
    } catch (err) {
      await AsyncStorage.removeItem(SECURE_AUTH_KEY);
    }
  };

  //referesh uer 
  const refreshUser = async () => {
  if (!user?.id || !user?.token) return;

  try {
    const res = await axios.get(
      `${BASE_URL}/api/user/getUser/${user.id}`,
      {
        headers: { Authorization: `Bearer ${user.token}` },
      }
    );

    // 🔥 token ko preserve karna zaroori hai
    await setUser({
      ...res.data.user,
      token: user.token,
      refreshToken: user.refreshToken,
      role: user.role,
    });
  } catch (err) {
    console.log("❌ Failed to refresh user", err);
  }
};


  /* ---------- LOAD USER ON APP START ---------- */

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_DATA_KEY);
        const secureAuth = await getSecureStore();

        if (!storedUser || !secureAuth?.token) {
          setIsLoading(false);
          return;
        }

        const decoded = jwtDecode<{ exp: number }>(secureAuth.token);

        if (decoded.exp * 1000 < Date.now()) {
          await logout();
          return;
        }

        const userData = JSON.parse(storedUser);

        setUserState({
          ...userData,
          token: secureAuth.token,
          refreshToken: secureAuth.refreshToken,
        });
      } catch (err) {
        console.log('Failed to restore auth state', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  /* ---------- SET USER ---------- */

  const setUser = async (newUser: User | null) => {
    setUserState(newUser);

    try {
      if (newUser) {
        const { token, refreshToken, ...userData } = newUser;

        await AsyncStorage.setItem(
          USER_DATA_KEY,
          JSON.stringify(userData)
        );

        await setSecureStore({ token, refreshToken });
      } else {
        await AsyncStorage.removeItem(USER_DATA_KEY);
        await removeSecureStore();
      }
    } catch (err) {
      console.log('Failed to persist user', err);
    }
  };

  /* ---------- LOGOUT ---------- */

  const logout = async () => {
    setUserState(null);

    try {
      await AsyncStorage.removeItem(USER_DATA_KEY);
      await removeSecureStore();
    } catch (err) {
      console.log('Failed to clear auth storage', err);
    }

    Toast.show({
      type: 'info',
      text1: 'Logged out!',
    });
  };

  /* ---------- PROVIDER ---------- */

  return (
  <AuthContext.Provider
  value={{ user, setUser, refreshUser, isLoading, logout }}
>
  {children}
</AuthContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useAuth = () => useContext(AuthContext);


// import React, { createContext, useContext, useState, useEffect } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Keychain from 'react-native-keychain'; // For secure token storage (Expo); fallback below
// // import jwtDecode from 'jwt-decode'; // For token expiry checks
// import { jwtDecode } from 'jwt-decode'; // For token expiry checks
// import Toast from 'react-native-toast-message';


// interface BaseUser {
//   id: string;
//   token: string;
//   role: string;
//   refreshToken?: string; // Optional: If using refresh tokens
// }

// export interface NormalUser extends BaseUser {
//   role: 'user';
//   fullName: string;
//   userType: string;
// }

// export type User = NormalUser;

// interface AuthContextType {
//   user: User | null;
//   setUser: (user: User | null) => Promise<void>;
//   isLoading: boolean;
//   logout: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   setUser: async () => {},
//   isLoading: true,
//   logout: async () => {},
// });

// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//   const [user, setUserState] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // Helper: Keychain storage (secure for tokens)
//  const getSecureStore = async (key: string) => {
//   try {
//     const creds = await Keychain.getGenericPassword();
//     if (creds && creds.username === key) {
//       return creds.password;
//     }
//     return null;
//   } catch (err) {
//     console.log('⚠️ Keychain get failed, using AsyncStorage instead', err.message);
//     return await AsyncStorage.getItem(key);
//   }
// };

// const setSecureStore = async (key: string, value: string) => {
//   try {
//     if (!value) {
//       console.warn(`Skipping Keychain/AsyncStorage set: ${key} has undefined value`);
//       return;
//     }
//     await Keychain.setGenericPassword(key, value);
//   } catch (err) {
//     console.log('⚠️ Keychain set failed, using AsyncStorage instead', err.message);
//     await AsyncStorage.setItem(key, value);
//   }
// };

// const removeSecureStore = async (key: string) => {
//   try {
//     await Keychain.resetGenericPassword();
//   } catch (err) {
//     console.log('⚠️ Keychain remove failed, using AsyncStorage instead', err.message);
//     await AsyncStorage.removeItem(key);
//   }
// };

//   useEffect(() => {
//     const loadUser = async () => {
//       try {
//         const storedUserData = await AsyncStorage.getItem('userData');
//         const storedToken = await getSecureStore('userToken');
//         console.log("userToken: ",storedToken)
//         if (storedUserData && storedToken) {
//           const userData = JSON.parse(storedUserData);
//           // Check token expiry
//           const decoded = jwtDecode<{ exp: number }>(storedToken);
//           if (decoded.exp * 1000 > Date.now()) {
//             // Valid: Rebuild user with token
//             setUserState({ ...userData, token: storedToken, refreshToken: userData.refreshToken });
//           } else {
//             // Expired: Auto-logout
//             await logout();
//             return;
//           }
//         }
//       } catch (err) {
//         console.log('Failed to load user from storage', err);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     loadUser();
//   }, []);

//   const setUser = async (newUser: User | null) => {
//     setUserState(newUser);
//     console.log("newUser: ",newUser)
//     try {
//       if (newUser) {
//         // Store user data (without token) in regular AsyncStorage
//         const { token, refreshToken, ...userData } = newUser;
//         await AsyncStorage.setItem('userData', JSON.stringify(userData));
//         // Store token securely
//         await setSecureStore('userToken', newUser.token);
//         if (refreshToken) {
//           await setSecureStore('refreshToken', refreshToken);
//         }
//       } else {
//         await AsyncStorage.removeItem('userData');
//         await removeSecureStore('userToken');
//         await removeSecureStore('refreshToken');
//       }
//     } catch (err) {
//       console.log('Failed to save user', err);
//     }
//   };

//   const logout = async () => {
//     setUserState(null);
//     try {
//       await AsyncStorage.removeItem('userData');
//       await removeSecureStore('userToken');
//       await removeSecureStore('refreshToken');
//     } catch (err) {
//       console.log('Failed to clear auth storage', err);
//     }
//     Toast.show({
//       type: 'info',
//       text1: 'Logged out!',
//     });
//     // Optional: Navigate to login if you have access to navigation here
//   };

//   return (
//     <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);