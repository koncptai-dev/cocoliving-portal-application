import NoInternetWrapper from "@/components/NoInternetWrapper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/libs/authContext";
import { axiosInstance } from "@/libs/axios";
import { useQuery } from "@tanstack/react-query";
import dayjs = require("dayjs");
import React from "react";
import { StatusBar as RNStatusBar } from "react-native";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";

export default function CalendarScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const { t } = useTranslation();
  const { userDetails } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const { isLoading, isError, data, refetch } = useQuery({
    queryKey: ["get-upcoming-duties-list"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/userApp/get-upcoming-duties/${userDetails?.id}`
      );
      console.log("stragtegy id: " + response.data?.upcomingShifts);
      // if (response.data?.currentShift?.isCompleted) {
      //   setIsShiftCompleted(true);
      // }
      // setSelectedBacktestID(response?.data?.data?.results[0]?.id);
      return response.data;
    },
    throwOnError: async (error, query) => {
      console.log("Error fetching data:", error.message);
      // console.log("Query key:", query.queryKey);
    },
    // placeholderData: keepPreviousData,
  });
  const renderItem = ({ item }) => {
    console.log("item", item);
    return (
      <View
        style={{
          padding: 16,
          gap: 8,
          borderBottomWidth: 1,
          borderColor: "gray",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 18, color: false ? "blue" : "black" }}>
            {item?.shiftInTpam?.label}
          </Text>
          <Text style={{ fontSize: 16, color: false ? "blue" : "black" }}>
            {item?.checkpointInTpam?.name}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 16, color: false ? "blue" : "black" }}>
            {"Timings:"}
          </Text>
          <Text style={{ fontSize: 16, color: false ? "blue" : "black" }}>
            {dayjs(item?.startTime).format("DD/MM/YYYY") +
              " " +
              dayjs(item?.startTime).format("HH:mm") +
              " - " +
              dayjs(item?.endTime).format("HH:mm")}
          </Text>
        </View>
      </View>
    );
  };

  const handleOnRefresh = () => {
    refetch();
  };
  return (
    <NoInternetWrapper>
{/* <Stack.Screen
  options={{
    headerShown: true,
    headerTitle: t("Calendar"),

    // ✅ Bold title
    headerTitleStyle: {
      fontWeight: "bold",
      fontSize: 20, // optional
    },

    // ❌ Remove underline (bottom shadow)
    headerShadowVisible: false,

  
  }}
/> */}


{/* <Stack.Screen
  options={{
    headerShown: true,
    headerTitle: t("Calendar"),
    
     headerStyle: {
      backgroundColor: "#fff",
      height: 55 + insets.top, // 👈 increase this (default ~56)
    },
    headerShadowVisible: false,
    headerTintColor: "#000",

    headerTitleStyle: {
      fontWeight: "bold",
      fontSize: 20,
    },

  }}
/> */}

{/* <Stack.Screen
  options={{
    headerShown: true,
    title: t("calendar"), // ✅ use title instead of headerTitle

    headerStyle: {
      backgroundColor: "#fff",
    },

    headerShadowVisible: false,
    headerTintColor: "#000",

    headerTitleStyle: {
      fontWeight: "bold",
      fontSize: 20,
    },
  }}
/> */}

    <SafeAreaView style={styles.safeArea}>
       <StatusBar style="dark" backgroundColor="white" />
        {/* <View style={styles.container}> */}
        <View
  style={[
    styles.container,
    { paddingTop: insets.bottom }, // 👈 dynamic fix
  ]}
>
        {/* <View style={{ paddingHorizontal: 16 }}>
          <Text style={styles.title}>{t("Calendar")}</Text>
        </View> */}
       
<FlatList
  data={data?.upcomingShifts}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleOnRefresh}
    />
  }
  ListEmptyComponent={
    !isLoading && (
      <View style={styles.emptyContainer}>
        <Text
  style={[
    styles.emptyText,
    { color: isDark ? "#ccc" : "#666" },
  ]}
>
  {t("No active duty found.") || "No Duty Available."}
</Text>
      </View>
    )
  }
/>

      </View>



    </SafeAreaView>
    </NoInternetWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
    //paddingTop: RNStatusBar.currentHeight || 0,
  },
  container: {
    flex: 1,
    paddingVertical: 16,
    paddingTop: 0,
  },
  emptyContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  marginTop: 50,
},
emptyText: {
  fontSize: 16,
  color: "gray",
},
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    tintColor : "black"
  },
});
