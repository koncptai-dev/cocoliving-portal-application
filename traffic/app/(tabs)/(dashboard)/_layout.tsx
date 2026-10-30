import NoInternetWrapper from "@/components/NoInternetWrapper";
import { Stack } from "expo-router";
import { StatusBar as RNStatusBar } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { StyleSheet, SafeAreaView, Platform } from "react-native";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <NoInternetWrapper>
    <SafeAreaView style={styles.safeArea}>
    
      <StatusBar style="dark" backgroundColor="white" />
    
      <Stack>
        <Stack.Screen
          name="index"
          options={{ 
            headerShown: false, 
            headerTitle: t("") ,
            headerStyle: {
      backgroundColor: "#fff",
    },
    headerShadowVisible: false,
    headerTintColor: "#000",
            headerTitleStyle: {
      fontWeight: "bold", // ✅ THIS MAKES IT BOLD
      fontSize: 20,       // optional (better look)
    },
          
          }
             
          }
        />
        <Stack.Screen
          name="applyLeaveScreen"

          options={{ 
            headerShown: true, 
            title: "Apply Leave",   // ✅ important fallback fix
            headerTitle: "Apply Leave",        
            headerStyle: {
      backgroundColor: "#fff",
    },
    headerShadowVisible: false,
    headerTintColor: "#000",
            //headerTitle: t("dashboard") ,
            headerTitleStyle: {
      fontWeight: "bold", // ✅ THIS MAKES IT BOLD
      fontSize: 20,       // optional (better look)
    },}}
        />
      </Stack>
      {children}
    </SafeAreaView>
    </NoInternetWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
   // paddingTop: RNStatusBar.currentHeight || 0,
    // paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});
