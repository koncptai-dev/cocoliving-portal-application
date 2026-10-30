import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Platform, ActivityIndicator, View } from "react-native";
import {
  House,
  LayoutDashboard,
  Calendar,
  CircleUserRound,
  CircleUser,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/libs/authContext";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";




export default function TabLayout() {
  const auth = useAuth(); // ✅ don't destructure directly
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // ✅ Handle undefined context (VERY IMPORTANT)
  if (!auth) {
    return null;
  }

  const { isAuthenticated } = auth;

  // ✅ Handle loading state (prevents crash)
  if (isAuthenticated === undefined) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.primary.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary.yellowColor} />
      </View>
    );
  }

  // ✅ Redirect if not logged in
  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }




  return (

    <Tabs
    screenOptions={{
      tabBarActiveTintColor: Colors.primary.yellowColor,
      tabBarInactiveTintColor: "white",

      // ✅ ENABLE HEADER
      headerShown: true,
     // headerShown: false,
      // ✅ HEADER STYLE
      headerStyle: {
        backgroundColor: "#ffffff",
      },
      headerTitleStyle: {
        color: "#000",
        fontWeight: "600",
      },


      
       headerTitleContainerStyle: {
      paddingTop: 0, // 🔥 removes gap
   
    },
      // ✅ PROFILE ICON (TOP RIGHT)
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push("/profile")}
          style={{ marginRight: 15 }}
        >
         <CircleUserRound
  size={28}
  color="#000"
  strokeWidth={2}
/>
        </TouchableOpacity>
      ),


      sceneStyle: {
  paddingBottom: 0,
},
// tabBarStyle: {
//   position: "absolute",
//   left: 16,
//   right: 16,
//   bottom: 8,
//   height: 80,
//   borderRadius: 40,
//   backgroundColor: "#0c1f79",
//   borderTopWidth: 0,
//   paddingTop: 8,
//   paddingBottom: 8,
//   paddingHorizontal: 12,
//   elevation: 10,
// },


tabBarStyle: {
  position: "absolute",
  left: 16,
  right: 16,
  bottom: insets.bottom + 8,
  height: 70 + insets.bottom,
  borderRadius: 40,
  backgroundColor: "#0c1f79",
  borderTopWidth: 0,
  paddingTop: 8,
  paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
  paddingHorizontal: 12,
  elevation: 10,
},

tabBarLabelStyle: {
  fontSize: 12,
  fontWeight: "600",
  marginTop: 2,
  marginBottom: 4,
},

tabBarHideOnKeyboard: true,
      tabBarItemStyle: {
        borderRadius: 20,
      },
      tabBarLabelStyle: {
        fontSize: 13,
        fontWeight: "bold",
      },
    }}
  >




<Tabs.Screen
  name="home"
  options={{
    title: t("home"),
    headerShown: true,
    headerRight: () => (
      <TouchableOpacity
        onPress={() => router.push("/profile")}
        style={{ marginRight: 15 }}
      >
      <CircleUser
  size={28}
  color="#000"
  strokeWidth={2}
/>
      </TouchableOpacity>
    ),
    tabBarIcon: ({ color }) => (
     <House
  size={24}
  color={color}
  strokeWidth={2}
/>
    ),
  }}
/>

      <Tabs.Screen
        name="(dashboard)"
        options={{
          //headerShown: false,
          title: t("dashboard"),
          tabBarIcon: ({ color }) => (
           <LayoutDashboard
  size={24}
  color={color}
  strokeWidth={2}
/>
          ),
        }}
      />


<Tabs.Screen
  name="calendar"
  options={{
    title: t("calendar"),

    tabBarIcon: ({ color }) => (
      <Calendar
  size={24}
  color={color}
  strokeWidth={2}
/>
    ),
  }}
/>
      
    </Tabs>
  );
}
