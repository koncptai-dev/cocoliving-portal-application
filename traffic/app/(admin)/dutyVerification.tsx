import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import CTAButton from "@/components/ui/CTAButton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/libs/axios";
import { useAuth } from "@/libs/authContext";
import {
  Building2,
  MapPin,
  Clock3,
  Users,
  TriangleAlert,
  PencilLine,
} from "lucide-react-native";

import { toggleLanguage } from "@/utils/translation";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import NoInternetWrapper from "@/components/NoInternetWrapper";

const DutyVerification = () => {
  const [dutyVerificationFormData, setDutyVerificationFormData] = useState({});
  const { userDetails } = useAuth();
  const [remarkReasons, setRemarkReasons] = useState([
    {
      label: "Other",
      value: "other",
    },
    {
      label: "Not Present in Checkpoint",
      value: "not-present-in-checkpoint",
    },
    {
      label: "Bandhobast",
      value: "bandhobast",
    },
  ]);

  const {
    isLoading,
    isError,
    data: divisionList,
    refetch,
  } = useQuery({
    queryKey: ["get-divisions-list"],
    queryFn: async () => {
      // const response = await axiosInstance.get(`/userApp/admin/divisions/`);
     

    const response = await axiosInstance.get(`/adminWebApp/division-under-admins/${userDetails?.id}`);

      console.log("Division API Full Response:", response);        // ✅ add this
      console.log("Division API Data:", response.data);   
     
      const divisionList = response.data?.divisionsList
        ? response.data?.divisionsList
        : [];

      const formattedDivisionList = divisionList.map((division) => ({
        label: division.divisionName,
        value: division.id,
      }));
      return formattedDivisionList;
    },
    throwOnError: async (error, query) => {
      console.log("Error fetching data:", error.message);
    console.log("❌ API ERROR:", error?.config?.url);
  console.log("❌ STATUS:", error?.response?.status);
  console.log("❌ RESPONSE:", error?.response?.data);
    },
    // placeholderData: keepPreviousData,
  });

  const { data: checkpointsList, refetch: checkpointsRefetch } = useQuery({
    queryKey: [
      "get-division-checkpoints-list",
      dutyVerificationFormData?.divisionId,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/userApp/admin/divisions/checkpoints/${dutyVerificationFormData?.divisionId}`
      );
      const checkpointList = response.data?.checkpointList
        ? response.data?.checkpointList
        : [];
      console.log(response.data?.checkpointList);

      const formattedCheckpointList = checkpointList.map((checkpoint) => ({
        label: checkpoint.name,
        value: checkpoint.id,
      }));
      return formattedCheckpointList;
    },
    throwOnError: async (error, query) => {
      console.log("Error fetching data:", error.message);
      console.log("❌ API ERROR:", error?.config?.url);
  console.log("❌ STATUS:", error?.response?.status);
  console.log("❌ RESPONSE:", error?.response?.data);
    },
    enabled: !!dutyVerificationFormData?.divisionId,
    // placeholderData: keepPreviousData,
  });

  
  const { data: shiftsList, refetch: shiftsRefetch } = useQuery({
    queryKey: [
      "get-division-checkpoints-list",
      dutyVerificationFormData?.checkpointId,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get(`/userApp/admin/shifts`);
      const shiftsList = response.data?.shiftsList
        ? response.data?.shiftsList
        : [];
      console.log(response.data?.shiftsList);

      const formattedShiftList = shiftsList.map((shift) => ({
        label: shift.label,
        value: shift.id,
      }));
      return formattedShiftList;
    },
    throwOnError: async (error, query) => {
      console.log("Error fetching data:", error.message);
      console.log("❌ API ERROR:", error?.config?.url);
  console.log("❌ STATUS:", error?.response?.status);
  console.log("❌ RESPONSE:", error?.response?.data);
    },
    enabled: !!dutyVerificationFormData?.checkpointId,
    // placeholderData: keepPreviousData,
  });

  // const { data: personnelList, refetch: personnelListRefetch } = useQuery({
  //   queryKey: [
  //     "get-checkpoint-personnel-list",
  //     dutyVerificationFormData?.checkpointId,
  //     dutyVerificationFormData?.shiftId,
  //   ],
  //   queryFn: async () => {
  //     const response = await axiosInstance.get(
  //       `/userApp/admin/checkpoints/users/?checkpointId=${dutyVerificationFormData?.checkpointId}&shiftId=${dutyVerificationFormData?.shiftId}`
  //     );
  //     const usersList = response.data?.usersList
  //       ? response.data?.usersList
  //       : [];
  //     console.log(response.data?.usersList);

  //     const formattedUserList = usersList.map((user) => ({
  //       label: user.userFullName + " (" + user.userRank + ")",
  //       value: user.dutyId,
  //     }));
  //     return formattedUserList;
  //   },
  //   throwOnError: async (error, query) => {
  //     console.log("❌ API ERROR:", error?.config?.url);
  // console.log("❌ STATUS:", error?.response?.status);
  // console.log("❌ RESPONSE:", error?.response?.data);
  //     console.log("Error fetching data:", error.message);
  //   },
  //   enabled: !!dutyVerificationFormData?.checkpointId,
  //   // placeholderData: keepPreviousData,
  // });


  const { data: personnelList, refetch: personnelListRefetch } = useQuery({
  queryKey: [
    "get-checkpoint-personnel-list",
    dutyVerificationFormData?.checkpointId,
    dutyVerificationFormData?.shiftId,
  ],
  queryFn: async () => {
    const response = await axiosInstance.get(
      `/userApp/admin/checkpoints/users/?checkpointId=${dutyVerificationFormData?.checkpointId}&shiftId=${dutyVerificationFormData?.shiftId}`
    );

    const usersList = response.data?.usersList
      ? response.data?.usersList
      : [];

    console.log(response.data?.usersList);

    const formattedUserList = usersList.map((user) => ({
      label: user.userFullName + " (" + user.userRank + ")",
      value: user.dutyId,
    }));

    return formattedUserList;
  },

  throwOnError: async (error, query) => {
    console.log("❌ API ERROR:", error?.config?.url);
    console.log("❌ STATUS:", error?.response?.status);
    console.log("❌ RESPONSE:", error?.response?.data);
    console.log("Error fetching data:", error.message);
  },

  enabled:
    !!dutyVerificationFormData?.checkpointId &&
    !!dutyVerificationFormData?.shiftId,
});




  const addRemark = useMutation({
    mutationFn: async (applyLeaveData: any) => {
      const response = await axiosInstance.put(
        "userApp/admin/add-remark/",
        applyLeaveData
      );
      console.log("response", response.data);
     
   
      return response.data;
    },



    onSuccess: () => {
    Toast.show({
      type: "success",
      text1: "Remark marked successfully",
    });


setTimeout(() => {
    router.back();
  }, 700);

  },

    onError: (error) => {
      console.log("Error in punch flow:", error);
      Toast.show({
        type: "error",
        text1: "Error",
      });
    },
  });

  // const handleSelectDivision = (divisionId: string) => {
  //   console.log("Selected Division:", divisionId);
  //   setDutyVerificationFormData((prevData) => ({
  //     ...prevData,
  //     divisionId: divisionId,
  //   }));
  // };
const handleSelectDivision = (divisionId: string) => {
  console.log("Selected Division:", divisionId);

  setDutyVerificationFormData({
    divisionId: divisionId,
    checkpointId: null,
    shiftId: null,
    personnelId: null,
    absentReason: null,
    otherReasonInput: "",
  });
};




  // const handleSelectCheckpoint = (checkpointId: string) => {
  //   console.log("Selected Checkpoint:", checkpointId);
  //   setDutyVerificationFormData((prevData) => ({
  //     ...prevData,
  //     checkpointId: checkpointId,
  //   }));
  // };
  const handleSelectCheckpoint = (checkpointId: string) => {
  console.log("Selected Checkpoint:", checkpointId);

  setDutyVerificationFormData((prevData) => ({
    ...prevData,
    checkpointId: checkpointId,
    shiftId: null,
    personnelId: null,
    absentReason: null,
    otherReasonInput: "",
  }));
};


  // const handleSelectShift = (shiftId: string) => {
  //   console.log("Selected Shift:", shiftId);
  //   setDutyVerificationFormData((prevData) => ({
  //     ...prevData,
  //     shiftId: shiftId,
  //   }));
  // };
  
  const handleSelectShift = (shiftId: string) => {
  console.log("Selected Shift:", shiftId);

  setDutyVerificationFormData((prevData) => ({
    ...prevData,
    shiftId: shiftId,
    personnelId: null,
    absentReason: null,
    otherReasonInput: "",
  }));
};
  
  
  const handleSelectPersonnel = (personnelId: string) => {
    console.log("Selected Personnel:", personnelId);
    setDutyVerificationFormData((prevData) => ({
      ...prevData,
      personnelId: personnelId,
    }));
  };
  const handleSelectAbsentReason = (absentReason: string) => {
    console.log("Selected Absent Reason:", absentReason);
    setDutyVerificationFormData((prevData) => ({
      ...prevData,
      absentReason: absentReason,
    }));
  };
  const handleUpdateAbsentReasonInput = (absentReason: string) => {
    console.log("Selected Absent Reason Input:", absentReason);
    setDutyVerificationFormData((prevData) => ({
      ...prevData,
      otherReasonInput: absentReason,
    }));
  };

  const handleMarkRemark = () => {
    console.log("Duty Verification Form Data:", dutyVerificationFormData);
    let remarkReason = "";
    if (dutyVerificationFormData?.absentReason) {
      let filteredRemarkReasons = remarkReasons.filter(
        (item) => item.value === dutyVerificationFormData?.absentReason
      );
      if (filteredRemarkReasons.length > 0)
        if (filteredRemarkReasons[0].value === "other") {
          remarkReason = dutyVerificationFormData?.otherReasonInput;
        } else {
          remarkReason = filteredRemarkReasons[0].label;
        }
    }

    addRemark.mutate({
      dutyId: dutyVerificationFormData?.personnelId,
      remark: remarkReason,
      isAbsent:
        dutyVerificationFormData?.absentReason == "not-present-in-checkpoint"
          ? true
          : null,
    });
  };
  
  const renderItem = (item) => {
    if (item) {
      return (
        <View style={{ padding: 16, gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, color: "black" }}>{item?.label}</Text>
          </View>
        </View>
      );
    }
    return null;
  };

  const showElement = (element: string) => {
    switch (element) {
      case "checkpoint":
        return dutyVerificationFormData?.divisionId ? true : false;
      case "shift":
        return (
          dutyVerificationFormData?.divisionId &&
          dutyVerificationFormData?.checkpointId
        );
      case "personnel":
        return (
          dutyVerificationFormData?.divisionId &&
          dutyVerificationFormData?.checkpointId &&
          dutyVerificationFormData?.shiftId
        );
      case "absentReason":
        return (
          dutyVerificationFormData?.divisionId &&
          dutyVerificationFormData?.checkpointId &&
          dutyVerificationFormData?.shiftId &&
          dutyVerificationFormData?.personnelId
        );
      case "otherReason":
        return (
          dutyVerificationFormData?.divisionId &&
          dutyVerificationFormData?.checkpointId &&
          dutyVerificationFormData?.shiftId &&
          dutyVerificationFormData?.personnelId &&
          dutyVerificationFormData?.absentReason === "other"
        );
      case "markRemarkButton":
        return (
          dutyVerificationFormData?.divisionId &&
          dutyVerificationFormData?.checkpointId &&
          dutyVerificationFormData?.shiftId &&
          dutyVerificationFormData?.personnelId &&
          dutyVerificationFormData?.absentReason
        );
      default:
        return true;
    }
  };



if (isLoading) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Loading divisions...</Text>
    </View>
  );
}

if (isError) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>API not working</Text>
    </View>
  );
}

if (!Array.isArray(divisionList) || divisionList.length === 0){
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>No API data found</Text>
    </View>
  );
}



 return (
  <NoInternetWrapper>
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            padding: 16,
            backgroundColor: "white",
            zIndex: 10,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Duty Verification
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingBottom: 16,
              paddingHorizontal: 16,
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Division */}
            <View style={{ marginTop: 20 }}>
              
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
  <Building2 size={20} color="#0c1f79" />
  <Text style={{ fontSize: 18, marginLeft: 8 }}>Division</Text>
</View>

              <Dropdown
               style={{
  marginTop: 8,
  minHeight: 52,
  borderWidth: 1,
  borderColor: "#D9D9D9",
  borderRadius: 12,
  paddingHorizontal: 12,
  
}}
                data={divisionList || []}
                renderItem={renderItem}
                labelField="label"
                valueField="value"
                placeholder={"Select Division"}
                onChange={(item) => {
                  console.log("item", item);
                  handleSelectDivision(item.value);
                }}
              />

              {divisionList?.length === 0 && (
                <Text style={{ color: "red", marginTop: 5 }}>
                  No divisions available
                </Text>
              )}
            </View>

            {/* Checkpoint */}
            {showElement("checkpoint") && (
              <View style={{ marginTop: 20 }}>
                
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
  <MapPin size={20} color="#0c1f79" />
  <Text style={{ fontSize: 18, marginLeft: 8 }}>Select Checkpoint</Text>
</View>

                <Dropdown
                style={{
  marginTop: 8,
  minHeight: 52,
  borderWidth: 1,
  borderColor: "#D9D9D9",
  borderRadius: 12,
  paddingHorizontal: 12,
}}
                  data={checkpointsList || []}
                  renderItem={renderItem}
                  labelField="label"
                  valueField="value"
                  placeholder={"Select Checkpoint"}
                  onChange={(item) => {
                    console.log("item", item);
                    handleSelectCheckpoint(item.value);
                  }}
                />

                {checkpointsList?.length === 0 && (
                  <Text style={{ color: "red", marginTop: 5 }}>
                    No checkpoints available
                  </Text>
                )}
              </View>
            )}

            {/* Shift */}
            {showElement("shift") && (
              <View style={{ marginTop: 20 }}>
               <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
  <Clock3 size={20} color="#0c1f79" />
  <Text style={{ fontSize: 18, marginLeft: 8 }}>Select Shift</Text>
</View>

                <Dropdown
                style={{
  marginTop: 8,
  minHeight: 52,
  borderWidth: 1,
  borderColor: "#D9D9D9",
  borderRadius: 12,
  paddingHorizontal: 12,
}}
                  data={shiftsList || []}
                  renderItem={renderItem}
                  labelField="label"
                  valueField="value"
                  placeholder={"Select Shift"}
                  onChange={(item) => {
                    console.log("item", item);
                    handleSelectShift(item.value);
                  }}
                />

                {shiftsList?.length === 0 && (
                  <Text style={{ color: "red", marginTop: 5 }}>
                    No shifts available
                  </Text>
                )}
              </View>
            )}

            {/* Personnel */}
            {showElement("personnel") && (
              <View style={{ marginTop: 20 }}>
               
               <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
  <Users size={20} color="#0c1f79" />
  <Text style={{ fontSize: 18, marginLeft: 8 }}>Select Personnel</Text>
</View>

                <Dropdown
                  style={{
  marginTop: 8,
  minHeight: 52,
  borderWidth: 1,
  borderColor: "#D9D9D9",
  borderRadius: 12,
  paddingHorizontal: 12,
}}
                  data={personnelList || []}
                  renderItem={renderItem}
                  labelField="label"
                  valueField="value"
                  placeholder={"Select Personnel"}
                  onChange={(item) => {
                    console.log("item", item);
                    handleSelectPersonnel(item.value);
                  }}
                />

                {personnelList?.length === 0 && (
                  <Text style={{ color: "red", marginTop: 5 }}>
                    No personnel available
                  </Text>
                )}
              </View>
            )}

            {/* Absent Reason */}
            {showElement("absentReason") && (
              <View style={{ marginTop: 20 }}>
               <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
  <TriangleAlert size={20} color="#E53935" />
  <Text style={{ fontSize: 18, marginLeft: 8 }}>Select Absent Reason</Text>
</View>

                <Dropdown
                 style={{
  marginTop: 8,
  minHeight: 52,
  borderWidth: 1,
  borderColor: "#D9D9D9",
  borderRadius: 12,
  paddingHorizontal: 12,
}}
                  data={remarkReasons || []}
                  renderItem={renderItem}
                  labelField="label"
                  valueField="value"
                  placeholder={"Select Absent Reason"}
                  onChange={(item) => {
                    console.log("item", item);
                    handleSelectAbsentReason(item.value);
                  }}
                />
              </View>
            )}

            {/* Other Reason */}
            {showElement("otherReason") && (
              <View style={{ marginTop: 20 }}>
                
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
  <PencilLine size={20} color="#0c1f79" />
  <Text style={{ fontSize: 18, marginLeft: 8 }}>Other Reason</Text>
</View>

                <TextInput
                  style={{
                    height: 40,
                    borderColor: "gray",
                    borderWidth: 1,
                    paddingHorizontal: 8,
                    marginVertical: 16,
                  }}
                  placeholder="Enter reason"
                  onChangeText={handleUpdateAbsentReasonInput}
                />
              </View>
            )}
          </ScrollView>
        </View>

        <View
          style={{
            paddingHorizontal: 16,
            marginTop: 20,
            marginBottom: 15,
          }}
        >
          <CTAButton
             disabled={!showElement("markRemarkButton")}
             label="Mark Remark"
             onPress={handleMarkRemark} 
             type={""}
             />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </NoInternetWrapper>
); 
 
};

export default DutyVerification;

const styles = StyleSheet.create({
  container: {
    //height: "100%",
    //paddingVertical: 16,
    //backgroundColor: "white", // Light background color
    flex: 1,
    backgroundColor: "white",
  },
});
