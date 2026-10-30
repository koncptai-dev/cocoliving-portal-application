import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { use } from "i18next";
import { axiosInstance } from "./axios";
import messaging from "@react-native-firebase/messaging";
import Toast from "react-native-toast-message";
import { Alert } from "react-native";
// ✅ Define authentication context type
interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  userDetails: UserDetails | null;
}

interface UserDetails {
  isReadOnly: boolean;
  id: string;
  fullName: string;
  beltNumber: string;
  post: string;
  token: string;
  email: string;
  role: string;
}

// ✅ Create authentication context
const AuthContext = createContext<AuthContextType | null>(null);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  
  const router = useRouter();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const updateFcmToken = async (userId: string) => {
    const token = await messaging().getToken();
    const response = await axiosInstance.put(
      "userApp/" + userId,
      { fcmToken: token } // Replace with actual FCM token
    );
    console.log("response", response.data);
    // Toast.show({
    //   type: "success",
    //   text1: "Leave applied successfully",
    // });
  };

  // const getSessionFromStorage = async () => {
  //   const session = await SecureStore.getItemAsync("session");

  //   if (session) {
  //     setIsAuthenticated(true);
  //     sessionDetails = JSON.parse(session);
  //     console.log("sessionDetails", sessionDetails.fullName);
  //     console.log("session", JSON.parse(session));
  //     axiosInstance.defaults.headers.common[
  //       "Authorization"
  //     ] = `Bearer ${sessionDetails?.token}`;
  //     updateFcmToken(sessionDetails?.id);
  //     setUserDetails(JSON.parse(session));
  //   } else {
  //     setIsAuthenticated(false);
  //   }

  //   console.log("session", session);
  // };

const getSessionFromStorage = async () => {
  const session = await SecureStore.getItemAsync("session");



  if (session) {
    const sessionDetails = JSON.parse(session); // ✅ fix (you forgot const)

    setIsAuthenticated(true);
    setUserDetails(sessionDetails);

    axiosInstance.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${sessionDetails?.token}`;

    updateFcmToken(sessionDetails?.id);

  } else {
    setIsAuthenticated(false);
    router.replace("/(auth)"); // optional but better
  }
};

  useEffect(() => {
     console.log("AXIOS BASE URL:", axiosInstance.defaults.baseURL);
    getSessionFromStorage();
  }, []);



useEffect(() => {
  if (userDetails === null) {
    router.replace("/(auth)");
    return;
  }

  if (
    userDetails.role === "admin" ||
    (userDetails.role === "division-admin" &&
      userDetails.isReadOnly === false)
  ) {
    router.replace("/(admin)");
  } else if (
    userDetails.role === "division-admin" &&
    userDetails.isReadOnly === true
  ) {
    Alert.alert(
      "Access Denied",
      "Read-only users can't login from the app."
    );
 logout();
    return;
  } else {
    router.replace("/(tabs)/home");
  }
}, [userDetails]);



  
  // ✅ Login function (Redirect to Home)
  const login = async (sessionDetails) => {


    if (
    sessionDetails?.role === "division-admin" &&
    sessionDetails?.isReadOnly === true
  ) {
    Alert.alert(
      "Access Denied",
      "Read-only users can't login from the app."
    );
    return; // ❌ stop login completely
  }

    const session = await SecureStore.setItemAsync(
      "session",
      JSON.stringify(sessionDetails)
    );
    setUserDetails(sessionDetails);
    console.log("session in login", sessionDetails);
    setIsAuthenticated(true);
    axiosInstance.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${sessionDetails?.token}`;
    updateFcmToken(sessionDetails?.id);
  
    // if (sessionDetails?.role == "admin") {
    //   router.replace("/(admin)"); // ✅ Redirect to admin dashboard
    // } else {
    //   router.replace("/(tabs)/home"); // ✅ Redirect to home tab
    // }



// if (
//     sessionDetails?.role === "admin" || sessionDetails?.role === "division-admin"
//   ) {
//     router.replace("/(admin)");
//   } else {
//     router.replace("/(tabs)/home");
//   }




  };



  // ✅ Logout function (Redirect to Auth Screen)
  const logout = async () => {
    const session = await SecureStore.deleteItemAsync("session");
    setUserDetails(null);
    setIsAuthenticated(false);
    router.replace("/(auth)"); // ✅ Redirect to login screen
  };
  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, userDetails }}
    >
      {children}
    </AuthContext.Provider>
  );
};
// ✅ Hook to use authentication state
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
