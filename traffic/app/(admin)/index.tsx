import React, { useEffect } from "react";
import { Image, StyleSheet, View, Text, Pressable, Alert } from "react-native";

import { Colors } from "@/constants/Colors";
// import LoginScreen from "@/components/Login/LoginScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuth } from "@/libs/authContext";
import { Redirect, router } from "expo-router";
import { Languages, LogOut, ShieldCheck } from "lucide-react-native";
import { toggleLanguage } from "@/utils/translation";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const { userDetails, logout } = useAuth();

  // if (isAuthenticated) return <Redirect href="/(tabs)/home" />;
  return (
    // <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={styles.container}>
      {/* <LoginScreen /> */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View>
            <Text style={styles.name}>{userDetails?.fullName}</Text>
            <Text style={styles.id}>BN. {userDetails?.beltNumber}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => {
              toggleLanguage();
            }}
          >
           <Languages
  size={24}
  color="#4787FF"
  strokeWidth={2.2}
/>
          </Pressable>
         
         
         <Pressable
           onPress={() => {
             Alert.alert(
               "Confirm Logout 🚦",
               "Are you sure you want to logout?",
               [
                 {
                   text: "Cancel",
                   style: "cancel",
                 },
                 {
                   text: "Logout",
                   style: "destructive", // 🔥 red button (traffic warning feel)
                   onPress: () => logout(),
                 },
               ],
               { cancelable: true }
             );
           }}
         >
           <LogOut
  size={24}
  color="#CA282C"
  strokeWidth={2.2}
/>
         </Pressable>
         
         
         
          {/* <Pressable
            onPress={() => {
              logout();
            }}
          >
            <MaterialCommunityIcons name="logout" size={24} color={"#CA282C"} />
          </Pressable> */}
        </View>
      </View>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "medium",
          // textAlign: "center",
          marginBottom: 16,
        }}
      >
        Admin Dashboard
      </Text>
      <View style={{ marginTop: 8 }}>
        <Pressable
  style={{
    padding: 16,
    backgroundColor: Colors.primary.color,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  }}
  onPress={() => router.push("/dutyVerification")}
>
  <ShieldCheck color="white" size={22} />

  <Text
    style={{
      color: "white",
      fontSize: 18,
      fontWeight: "600",
    }}
  >
    Verify Duty
  </Text>
</Pressable>
      </View>
    </SafeAreaView>
    // </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    padding: 16,
    backgroundColor: "white", // Light background color
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  id: {
    fontSize: 12,
    color: "#888",
  },
});
