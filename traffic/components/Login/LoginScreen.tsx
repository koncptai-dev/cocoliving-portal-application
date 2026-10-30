import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, useColorScheme } from "react-native";
import { Languages } from "lucide-react-native";
import { StatusBar as RNStatusBar } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  ScrollView,
} from "react-native";
import NoInternetWrapper from "@/components/NoInternetWrapper";
import { Colors } from "@/constants/Colors";
import { useNavigation } from "expo-router";
import { useTranslation } from "react-i18next";
import { toggleLanguage } from "@/utils/translation";
import Toast from "react-native-toast-message";
import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/libs/axios";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/libs/authContext";
import { getDeviceName, getUniqueId } from "react-native-device-info";
//import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

import * as Font from "expo-font";
import { useEffect } from "react";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [isPressed, setIsPressed] = useState(false);
  const { t, i18n } = useTranslation();

  const { login } = useAuth();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);




//   const loginUser = useMutation({
//     mutationFn: async (payload: any) => {
//       const response = await axiosInstance.post("auth/login/", payload);
//  //     console.log("response", response.data);
//         // ✅ Always log full response for debugging
//     console.log("Full Response:", response);
//     console.log("Response Data:", response.data);

//       if (response.data) {
//         await SecureStore.setItemAsync(
//           "userDetails",
//           JSON.stringify(response.data)
//         );

//         axiosInstance.defaults.headers.common[
//           "Authorization"
//         ] = `Bearer ${response.data.token}`;
//         login(response.data);
//         Toast.show({
//           type: "success",
//           text1: "Logged in successfully",
//         });
//       } 
//       else {

//         // Toast.show({
//         //   type: "error",
//         //   text1: "Something went wrong during Logging in",
//         // });
//       }
    
//     },
//    onError: (error: any) => {
//   console.log(
//     "Error in login",
//     Object.keys(error),
//     error?.response?.data
//   );

//   const errorMessage =
//     error?.response?.data?.message || // ✅ correct key
//     error?.response?.data?.detail ||  // optional fallback (Django APIs)
//     "Something went wrong";

//   Toast.show({
//     type: "error",
//     text1: errorMessage,
//   });
// },
//   });

// useEffect(() => {
//   async function loadFont() {
//     try {
//       await Font.loadAsync(MaterialCommunityIcons.font);
//       console.log("✅ FONT LOADED");
//     } catch (e) {
//       console.log("❌ FONT ERROR", e);
//     }
//   }

//   loadFont();
// }, []);



const safeToast = (config: any) => {
  try {
    Toast.show(config);
  } catch (e) {
    console.log("Toast error:", e);
  }
};

const loginUser = useMutation({
  mutationFn: async (payload: any) => {
    const response = await axiosInstance.post("auth/login-v2/", payload);

    console.log("Full Response:", response);
    console.log("Response Data:", response.data);

    // ✅ Only return data
    return response.data;
  },

  onSuccess: async (data) => {
    try {
      if (!data) return;

      await SecureStore.setItemAsync(
        "userDetails",
        JSON.stringify(data)
      );

      // ✅ SAFE header assignment (no crash in tests)
      if (axiosInstance?.defaults?.headers?.common) {
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${data.token}`;
      }

      // ✅ IMPORTANT for test
      login(data);

      // ✅ SAFE toast
      safeToast({
        type: "success",
        text1: "Logged in successfully",
      });
    } catch (e) {
      console.log("Error in onSuccess:", e);
    }
  },

  onError: (error: any) => {
    console.log(
      "Error in login",
      Object.keys(error || {}),
      error?.response?.data
    );

    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      "Something went wrong";

    // ✅ SAFE toast (fixes Jest + runtime crash)
    safeToast({
      type: "error",
      text1: errorMessage,
    });
  },
});

  const handleLoginClick = async () => {
    const deviceId = await getUniqueId();
    const deviceName = await getDeviceName();
    const formattedDeviceName = deviceName.toLowerCase().replace(/ /g, "-");
    const uniqueDeviceId = `${deviceId}+${formattedDeviceName}`;
    loginUser.mutate({
      username,
      password,
      uniqueDeviceId,
      userApp: true,
    });

    // navigation.navigate("(tabs)"); // Navigate to /home tab
  };

  return (

<NoInternetWrapper>
    {/* <SafeAreaView style={{ flex: 1 }}>
     */}
   <SafeAreaView  style={{ flex: 1,paddingTop: RNStatusBar.currentHeight || 0,backgroundColor: isDark ? "Colors.primary.background" : Colors.primary.background,}}>

 <StatusBar style="dark" backgroundColor="white" />

     

<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
>
  <ScrollView
    contentContainerStyle={{ flexGrow: 1 }}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
  >



        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 8,
              paddingTop: 20,
            }}
          >



            <Text style={{ fontSize: 16, color: "white" }}>
              Change Language:{" "}
            </Text>
            <Pressable
              testID="toggle-language"
              onPress={toggleLanguage}
              style={{ padding: 8, backgroundColor: "white", borderRadius: 50 }}
            >
              <Languages size={24} color="black" strokeWidth={2} />
              {/* <MaterialCommunityIcons
                name="translate"
                size={24}
                color={"black"}
              /> */}
            </Pressable>
          </View>
         
         <View
  style={{
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 20,
  }}
>



            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logo}
              />
            </View>
       
            <View style={{ marginTop: 32 }}>
              <Text style={styles.title}>{t("login-to-your-account")}</Text>
            </View>
       
            <View style={styles.inputContainer}>
              <Text style={styles.inputTextTitle}>{t("username")}</Text>

              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#888"
                value={username}
                onChangeText={setUsername}
              />
             <Text style={styles.inputTextTitle}>{t("password")}</Text>

<View style={styles.passwordContainer}>
  <TextInput
    style={styles.passwordInput}
    placeholder="Password"
    placeholderTextColor="#888"
    secureTextEntry={!showPassword}
    value={password}
    onChangeText={setPassword}
  />
<Pressable onPress={() => setShowPassword(!showPassword)}>
  {showPassword ? (
    <Eye
      size={22}
      color="#555"
      strokeWidth={2}
    />
  ) : (
    <EyeOff
      size={22}
      color="#555"
      strokeWidth={2}
    />
  )}
</Pressable>
  {/* <Pressable onPress={() => setShowPassword(!showPassword)}>
    <MaterialCommunityIcons
      name={showPassword ? "eye" : "eye-off"}
      size={22}
      color="#555"
    />
  </Pressable> */}
</View>

 <View style={styles.loginButtonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed,
            ]}
            disabled={loginUser.isPending}
            onPress={handleLoginClick} // Call handleLogin on button press
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
          >
            <Text style={styles.loginButtonText}>
              {loginUser.isPending ? "Logging in ..." : t("login")}
            </Text>
          </Pressable>
        </View>
           
           
            </View>



          </View>
        </View>
        {/* </View> */}
       
    
    
    
  
    
      </ScrollView>
  </KeyboardAvoidingView>
  
    </SafeAreaView>

</NoInternetWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
    justifyContent: "space-between", // Light background color
  },
  logoContainer: {
    backgroundColor: "white",
    alignItems: "center",
    borderRadius: "100%", // Circular shape
    padding: 8,
    justifyContent: "center",
  },
  logo: {
    width: 120, // Adjust size as needed
    height: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white", // Dark text color
    textAlign: "center",
  },
  inputTextTitle: {
    color: "white",
    marginBottom: 8,
  },
  inputContainer: {
    marginTop: 24,
    width: "90%",
    maxWidth: 350,
    paddingHorizontal: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: "#000",
  },
  loginButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%", // Ensure the container spans the full width = 100% 
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 20,

  },
  loginButton: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 380,
  },
  passwordContainer: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "white",
  borderRadius: 8,
  paddingHorizontal: 12,
  marginBottom: 16,
},

passwordInput: {
  flex: 1,
  paddingVertical: 12,
  fontSize: 16,
  color: "#000",
},
  loginButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary.background,
  },
  loginButtonPressed: {
    backgroundColor: "#ddd", // Change background color when pressed
  },
});
