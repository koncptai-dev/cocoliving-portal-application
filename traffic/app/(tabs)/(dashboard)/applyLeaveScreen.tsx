import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Stack, router } from "expo-router";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/libs/axios";
import { Dropdown } from "react-native-element-dropdown";
import dayjs from "dayjs";
import CTAButton from "@/components/ui/CTAButton";
import Toast from "react-native-toast-message";
import { useAuth } from "@/libs/authContext";
import { useTranslation } from "react-i18next";
import NoInternetWrapper from "@/components/NoInternetWrapper";
import { SafeAreaView } from "react-native-safe-area-context";

const ApplyLeaveScreen = () => {
  const [selectedShiftData, setSelectedShiftData] = useState(null);
  const { userDetails } = useAuth();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // 🔹 Fetch shifts
  const { isLoading, isError, data } = useQuery({
    queryKey: ["get-upcoming-duties-list"],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/userApp/get-upcoming-duties/${userDetails?.id}`
      );
      return response.data;
    },
  });

  // 🔹 Apply leave
  const applyLeave = useMutation({
    mutationFn: async (payload) => {
      await axiosInstance.put("userApp/apply-leave/", payload);
    },
    onSuccess: () => {
      Toast.show({ type: "success", text1: "Leave applied successfully" });
      router.back();
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Failed to apply leave" });
    },
  });

  const handleApplyLeave = () => {
    if (selectedShiftData) {
      applyLeave.mutate({
        dutyId: selectedShiftData.id,
      });
    }
  };

  // const listData =
  //   data?.upcomingShifts?.map((item) => ({
  //     label: item?.shiftInTpam?.label,
  //     value: item?.id,
  //     ...item,
  //   })) || [];


const listData =
  data?.upcomingShifts?.map((item) => ({
   label: `${item?.shiftInTpam?.label}  |  ${dayjs(
  item?.startTime
).format("DD/MM/YYYY")}`,
    value: item?.id,
    ...item,
  })) || [];

  // 🔹 Loading State
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading shifts...</Text>
      </View>
    );
  }

  // 🔹 Error State
  if (isError) {
    return (
      <View style={styles.center}>
        <Text>Failed to load shifts</Text>
      </View>
    );
  }

  // 🔹 Empty State
  if (listData.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No upcoming shifts available</Text>
      </View>
    );
  }

  return (
    <NoInternetWrapper>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("apply-leave"),
        }}
      />

      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: "#fff" },
        ]}
      >
        <StatusBar style={isDark ? "light" : "dark"} />

        <Text style={styles.label}>
          {t("choose-the-shift-to-apply")}
        </Text>

        {/* 🔽 Dropdown */}
        <Dropdown
          style={styles.dropdown}
          data={listData}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={t("select-shift")}
          searchPlaceholder="Search..."
          onChange={(item) => setSelectedShiftData(item)}
        />

        {/* 🔽 Selected Shift */}
        {selectedShiftData && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {t("selected-shift")}
            </Text>

            <InfoRow
              label={t("shift")}
              value={selectedShiftData.shiftInTpam?.label}
            />
            <InfoRow
              label={t("date")}
              value={dayjs(selectedShiftData.startTime).format("DD/MM/YYYY")}
            />
            <InfoRow
              label={t("start-time")}
              value={dayjs(selectedShiftData.startTime).format("HH:mm")}
            />
            <InfoRow
              label={t("end-time")}
              value={dayjs(selectedShiftData.endTime).format("HH:mm")}
            />
            <InfoRow
              label={t("location")}
              value={selectedShiftData.checkpointInTpam?.name}
            />

            <View style={{ marginTop: 16 }}>
              <CTAButton
                type="solid-small"
                label={
                  applyLeave.isPending
                    ? "Applying..."
                    : t("apply-leave")
                }
                onPress={handleApplyLeave}
                disabled={applyLeave.isPending}
              />
            </View>
          </View>
        )}
      </SafeAreaView>
    </NoInternetWrapper>
  );
};

// 🔹 Reusable Row
const InfoRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.shiftItemLabel}>{label}</Text>
    <Text style={styles.shiftItemValue}>{value}</Text>
  </View>
);

export default ApplyLeaveScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  label: {
    fontSize: 16,
    marginBottom: 10,
    color: "#555",
  },

  dropdown: {
    marginBottom: 16,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 12,
  },

  card: {
    backgroundColor: "#1B263B",
    padding: 16,
    borderRadius: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  shiftItemLabel: {
    color: "#aaa",
    fontSize: 14,
  },

  shiftItemValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});


// import { StyleSheet, Text, View } from "react-native";
// import { Stack } from "expo-router";
// import { StatusBar as RNStatusBar } from "react-native";
// import { useColorScheme } from "react-native";
// import { StatusBar } from "expo-status-bar";
// import React, { useState } from "react";
// import { useMutation, useQuery } from "@tanstack/react-query";
// import { axiosInstance } from "@/libs/axios";
// import { Dropdown } from "react-native-element-dropdown";
// import dayjs from "dayjs";
// import CTAButton from "@/components/ui/CTAButton";
// import Toast from "react-native-toast-message";
// import { router } from "expo-router";
// import { useAuth } from "@/libs/authContext";
// import { useTranslation } from "react-i18next";
// import NoInternetWrapper from "@/components/NoInternetWrapper";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Colors } from "@/constants/Colors";


// const ApplyLeaveScreen = () => {
//   const [selectedShiftData, setSelectedShiftData] = useState({});
//   const { userDetails } = useAuth();
//   const { t } = useTranslation();
//   const colorScheme = useColorScheme();
//  const isDark = colorScheme === "dark";
//   const { isLoading, isError, data, refetch } = useQuery({
//     queryKey: ["get-upcoming-duties-list"],
//     queryFn: async () => {
//       const response = await axiosInstance.get(
//         `/userApp/get-upcoming-duties/${userDetails?.id}`
//       );
//       console.log("stragtegy id: " + response.data?.upcomingShifts);
//       // if (response.data?.currentShift?.isCompleted) {
//       //   setIsShiftCompleted(true);
//       // }
//       // setSelectedBacktestID(response?.data?.data?.results[0]?.id);
//       return response.data;
//     },
//     throwOnError: async (error, query) => {
//       console.log("Error fetching data:", error.message);
//       // console.log("Query key:", query.queryKey);
//     },
//     // placeholderData: keepPreviousData,
//   });
//   const applyLeave = useMutation({
//     mutationFn: async (applyLeaveData: any) => {
//       const response = await axiosInstance.put(
//         "userApp/apply-leave/",
//         applyLeaveData
//       );
//       console.log("response", response.data);
//       Toast.show({
//         type: "success",
//         text1: "Leave applied successfully",
//       });
//       router.back();
//       // if (response.status === 200) {
//       //   // queryClient.invalidateQueries({ queryKey: ["get-duties-list"] });
//       // }
//       return;
//     },
//     onError: (error) => {
//       console.log("Error in punch flow:", error);
//       Toast.show({
//         type: "error",
//         text1: "Error",
//       });
//     },
//   });

//   const handleApplyLeave = async () => {
//     if (Object.keys(selectedShiftData).length > 0) {
//       applyLeave.mutate({
//         dutyId: selectedShiftData?.id,
//       });
//     }
//   };

//   const listData = data?.upcomingShifts
//     ? data?.upcomingShifts?.map((item: any) => ({
//         label: item?.shiftInTpam?.label,
//         value: item?.id,
//         ...item,
//       }))
//     : [];
//   // const listData = data?.upcomingShifts ? data?.upcomingShifts : [];
//   // const listData = [
//   //   { label: "Item 1", value: "1" },
//   //   { label: "Item 2", value: "2" },
//   //   { label: "Item 3", value: "3" },
//   //   { label: "Item 4", value: "4" },
//   //   { label: "Item 5", value: "5" },
//   //   { label: "Item 6", value: "6" },
//   //   { label: "Item 7", value: "7" },
//   //   { label: "Item 8", value: "8" },
//   // ];

//   const renderLabel = (item) => {
//     if (item) {
//       return (
//         <View style={{ padding: 16, gap: 8 }}>
//           <View
//             style={{
//               flexDirection: "row",
//               justifyContent: "space-between",
//               alignItems: "center",
//             }}
//           >
//             <Text style={{ fontSize: 18, color: false ? "blue" : "black" }}>
//               {item?.shiftInTpam?.label}
//             </Text>
//             <Text style={{ fontSize: 16, color: false ? "blue" : "black" }}>
//               {item?.checkpointInTpam?.name}
//             </Text>
//           </View>
//           <View
//             style={{ flexDirection: "row", justifyContent: "space-between" }}
//           >
//             <Text style={{ fontSize: 16, color: false ? "blue" : "black" }}>
//               {"Timings:"}
//             </Text>
//             <Text style={{ fontSize: 16, color: false ? "blue" : "black" }}>
//               {dayjs(item?.startTime).format("DD/MM/YYYY") +
//                 " " +
//                 dayjs(item?.startTime).format("HH:mm") +
//                 " - " +
//                 dayjs(item?.endTime).format("HH:mm")}
//             </Text>
//           </View>
//         </View>
//       );
//     }
//     return null;
//   };
//   return (

// <NoInternetWrapper>
 
//  <Stack.Screen
//       options={{
//         headerShown: true,
//         headerTitle: t("apply-leave"), // 👈 your custom title
//       }}
//     />

//        <SafeAreaView
//   style={{
//     flex: 1,
//     backgroundColor: isDark ? "#fff" : "#fff",
//   }}
// >
      
//        <StatusBar style="dark" backgroundColor="white" />
//     <View style={{ flex: 1, backgroundColor: "white", padding: 16 }}>
//       <Text style={{ fontSize: 16 }}>{t("choose-the-shift-to-apply")}</Text>
//       <Dropdown
//         style={{
//           marginVertical: 16,
//         }}
//         // placeholderStyle={styles.placeholderStyle}
//         // selectedTextStyle={styles.selectedTextStyle}
//         // inputSearchStyle={styles.inputSearchStyle}
//         // iconStyle={styles.iconStyle}
//         data={listData}
//         search
//         maxHeight={300}
//         renderItem={renderLabel}
//         labelField="label"
//         valueField="value"
//         placeholder={true ? t("select-shift") : "..."}
//         searchPlaceholder="Search..."
//         // value={value}
//         // onFocus={() => setIsFocus(true)}
//         // onBlur={() => setIsFocus(false)}
//         onChange={(item) => {
//           console.log("item", item);
//           setSelectedShiftData(item);
//           // setValue(item.value);
//           // setIsFocus(false);
//         }}
//         // renderLeftIcon={() => (
//         //   <AntDesign
//         //     style={styles.icon}
//         //     color={isFocus ? 'blue' : 'black'}
//         //     name="Safety"
//         //     size={20}
//         //   />
//         // )}
//       />
//       <View style={{ flex: 1 }}>
//         <Text style={{ fontSize: 20, marginBottom: 8 }}>
//           {t("selected-shift")}:
//         </Text>
//         {Object.keys(selectedShiftData).length > 0 && (
//           <View>
//             <View
//               style={{
//                 flexDirection: "row",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <Text style={styles.shiftItemLabel}>{t("shift")}:</Text>
//               <Text style={styles.shiftItemValue}>
//                 {" "}
//                 {selectedShiftData?.shiftInTpam?.label}
//               </Text>
//             </View>
//             <View
//               style={{
//                 flexDirection: "row",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <Text style={styles.shiftItemLabel}>{t("date")}:</Text>
//               <Text style={styles.shiftItemValue}>
//                 {dayjs(selectedShiftData?.startTime).format("DD/MM/YYYY")}
//               </Text>
//             </View>
//             <View
//               style={{
//                 flexDirection: "row",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <Text style={styles.shiftItemLabel}>{t("start-time")}:</Text>
//               <Text style={styles.shiftItemValue}>
//                 {dayjs(selectedShiftData?.startTime).format("HH:mm")}
//               </Text>
//             </View>
//             <View
//               style={{
//                 flexDirection: "row",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <Text style={styles.shiftItemLabel}>{t("end-time")}:</Text>
//               <Text style={styles.shiftItemValue}>
//                 {dayjs(selectedShiftData?.endTime).format("HH:mm")}
//               </Text>
//             </View>
//             <View
//               style={{
//                 flexDirection: "row",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <Text style={styles.shiftItemLabel}>{t("location")}:</Text>
//               <Text style={styles.shiftItemValue}>
//                 {selectedShiftData?.checkpointInTpam?.name}
//               </Text>
//             </View>

//             <View
//               style={{
//                 marginTop: 16,
//                 flexDirection: "row",
//                 justifyContent: "flex-end",
//               }}
//             >
//               <View style={{ width: "50%" }}>
//                 <CTAButton
//                   type="solid-small"
//                   label={t("apply-leave")}
//                   onPress={handleApplyLeave}
//                 />
//               </View>
//             </View>
//           </View>
//         )}
//       </View>
//     </View>

// </SafeAreaView>

//     </NoInternetWrapper>
 


// );
// };

// export default ApplyLeaveScreen;

// const styles = StyleSheet.create({
//   shiftItemLabel: { fontSize: 16, color: "gray",  marginBottom: 16 
//   },
//   shiftItemValue: { color: "black", fontSize: 18 },
// });
