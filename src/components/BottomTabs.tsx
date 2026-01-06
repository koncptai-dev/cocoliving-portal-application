import React from "react";
import { View, TouchableOpacity, Image, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";

// Screens
import BrowsePropertiesScreen from "../user/BrowsePropertiesScreen";
import EventsScreen from "../user/Events";
import DashboardScreen from "../user/dashboard";
import FindStayScreen from "./Dashboard/FindStayScreen";
import AccessHistory from "../user/AccessHistory";
import SupportScreen from "../user/Support";

const Tab = createBottomTabNavigator();

export default function BottomTabs({ hasBooking }) {
  console.log("HAS BOOKING ---> ", hasBooking);

  return (
    <Tab.Navigator
      initialRouteName="Center"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#4B3426",
        tabBarInactiveTintColor: "#AFAFAF",
        tabBarStyle: {
          height: 65,
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 15,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 8,
          // marginBottom:10,
        },
      }}
    >
      {/* ALWAYS: Rooms on the left */}
      <Tab.Screen
        name="Rooms"
        component={BrowsePropertiesScreen}
        options={{
          tabBarLabel: "Rooms",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bed-outline" size={23} color={color} />
          ),
        }}
      />

      {/* BOOKED USER: Events next */}
      {hasBooking && (
        <Tab.Screen
          name="Events"
          component={EventsScreen}
          options={{
            tabBarLabel: "Events",
            tabBarIcon: ({ color }) => (
              <Ionicons name="star-outline" size={23} color={color} />
            ),
          }}
        />
      )}

      {/* CENTER: Always in the middle */}
      <Tab.Screen
        name="Center"
        component={hasBooking ? DashboardScreen : FindStayScreen}
        options={{
          tabBarLabel: "",
          tabBarIcon: () => (
            <View style={styles.centerIconWrapper}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.centerIcon}
              />
            </View>
          ),
        }}
      />

      {/* BOOKED USER: Logs next */}
      {hasBooking && (
        <Tab.Screen
          name="Logs"
          component={AccessHistory}
          options={{
            tabBarLabel: "Logs",
            tabBarIcon: ({ color }) => (
              <Ionicons name="time-outline" size={23} color={color} />
            ),
          }}
        />
      )}

      {/* ALWAYS: Support on the right */}
      <Tab.Screen
        name="Support"
        component={SupportScreen}
        options={{
          tabBarLabel: "Support",
          tabBarIcon: ({ color }) => (
            <Ionicons name="headset-outline" size={23} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  centerIconWrapper: {
    width: 65,
    height: 65,
    borderRadius: 40,
    backgroundColor: "#4B3426",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Platform.OS === "ios" ? 35 : 45,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  centerIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
});