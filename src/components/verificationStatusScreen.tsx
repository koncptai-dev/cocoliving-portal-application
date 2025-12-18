import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  TextInput,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";

// ---------------------- Constants ----------------------
const baseURLN = "https://staging.cocoliving.in";
const baseURL = "https://prod.idto.ai";
const DIGI_API_KEY = "myXTggzjQ37FWJKfwvVWIqu7TbFdgclZaWskIzY2SCg";
const DIGI_CLIENT_ID = "07e90e88-a3ff-48ed-9a30-8716060a8af2";

// ---------------------- DATA ----------------------
const DATA = [
  { id: "1", label: "Mobile Number", icon: "call-outline", library: "Ionicons", status: "verified" },
  { id: "2", label: "Email ID", icon: "mail-outline", library: "Ionicons", status: "verified" },
  { id: "3", label: "KYC", icon: "card-account-details-outline", library: "MaterialCommunityIcons", status: "unverified" },
];

const VerificationStatusScreen = () => {
  const { user } = useAuth();
  const [showKycOptions, setShowKycOptions] = useState(false);

  // ---------------------- PAN & Aadhaar States ----------------------
  const [panStatus, setPanStatus] = useState("Not Verified");
  const [panLoading, setPanLoading] = useState(false);
  const [aadhaarStatus, setAadhaarStatus] = useState("Not Verified");
  const [aadhaarLoading, setAadhaarLoading] = useState(false);

  const [formData, setFormData] = useState({ panNumber: "" });

  // ---------------------- Fetch User PAN & Aadhaar ----------------------
  const fetchUserProfile = async () => {
    try {
      if (!user?.id || !user?.token) return;
      const res = await axios.get(`${baseURLN}/api/user/getUser/${user.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setFormData((prev) => ({
        ...prev,
        panNumber: res.data.user.panNumber || "",
      }));



console.log("Profile Data:", res.data);

      fetchPanStatus(res.data.user.panNumber);
      checkAadhaarStatus();
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to load profile data." });
    }
  };

  useEffect(() => {
    if (user?.id) fetchUserProfile();
  }, [user]);

  // ---------------------- PAN Verification ----------------------
  const fetchPanStatus = async (panNumberValue) => {
    if (!panNumberValue) return;
    setPanLoading(true);
    try {
      const res = await axios.get(`${baseURLN}/api/pan/pan-status?panNumber=${panNumberValue}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });


      
    console.log("Pan Data:", res.data);

      setPanStatus(res.data?.status || "Not Verified");
    } catch (err) {
      setPanStatus("Not Verified");
    } finally {
      setPanLoading(false);
    }
  };

  const handleVerifyPan = async () => {
    if (!formData.panNumber) {
      Toast.show({ type: "error", text1: "Please enter PAN number" });
      return;
    }

    const pan = formData.panNumber.toUpperCase();
    const panRegex = /^([A-Z]{5})([0-9]{4})([A-Z]{1})$/;
    if (!panRegex.test(pan)) {
      Toast.show({ type: "error", text1: "Invalid PAN format" });
      return;
    }

    setPanLoading(true);
    try {
      const res = await axios.post(
        `${baseURLN}/api/pan/verify-pan`,
        { panNumber: pan },
        { headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" } }
      );
      
console.log("PAN verification:", res.data);
      Toast.show({ type: "success", text1: res.data?.message || "PAN Verified Successfully" });
      setPanStatus("Verified");
    } catch (error) {
      Toast.show({ type: "error", text1: error.response?.data?.message || "PAN Verification Failed" });
      setPanStatus("Not Verified");
    } finally {
      setPanLoading(false);
    }
  };

  // ---------------------- Aadhaar Verification ----------------------
  const startAadhaarVerification = async () => {
    try {
      setAadhaarLoading(true);

      const res = await axios.post(
        `${baseURL}/verify/digilocker/initiate_session`,
        {
          consent: true,
          consent_purpose: "KYC Verification",
          redirect_url: "cocoliving://digilocker/callback",
          redirect_to_signup: true,
          documents_for_consent: ["aadhaar"],
        },
        {
          headers: {
            "X-API-KEY": DIGI_API_KEY,
            "X-Client-ID": DIGI_CLIENT_ID,
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      const digilockerUrl = res?.data?.url;
      const codeVerifier = res?.data?.code_verifier || null;

      if (!digilockerUrl) {
        Toast.show({ type: "error", text1: "DigiLocker URL missing" });
        return;
      }

      if (codeVerifier) await AsyncStorage.setItem("codeVerifier", codeVerifier);

      Toast.show({ type: "success", text1: "DigiLocker Started" });
      Linking.openURL(digilockerUrl);
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.message || "DigiLocker Failed" });
    } finally {
      setAadhaarLoading(false);
    }
  };

  const fetchAadhaarReference = async (code, codeVerifier) => {
    try {
      setAadhaarLoading(true);
      const res = await axios.post(
        `${baseURLN}/api/digilocker/get-reference`,
        { code, code_verifier: codeVerifier },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      const referenceKey = res?.data?.data?.reference_key || res?.data?.reference_key;
      if (!referenceKey) {
        Toast.show({ type: "error", text1: "Reference key missing" });
        return;
      }

      fetchAadhaarData(referenceKey);
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to fetch reference key" });
    } finally {
      setAadhaarLoading(false);
    }
  };

  const fetchAadhaarData = async (referenceKey) => {
    try {
      setAadhaarLoading(true);
      const res = await axios.post(
        `${baseURLN}/api/digilocker/fetch-aadhaar`,
        { reference_key: referenceKey },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      if (res.data?.success) {
        setAadhaarStatus("Verified");
        Toast.show({ type: "success", text1: "Aadhaar Verified" });
      } else {
        setAadhaarStatus("Failed");
        Toast.show({ type: "error", text1: "Aadhaar Verification Failed" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Aadhaar Fetch Failed" });
    } finally {
      setAadhaarLoading(false);
    }
  };

  const checkAadhaarStatus = async () => {
    try {
      setAadhaarLoading(true);
      const res = await axios.get(`${baseURLN}/api/digilocker/aadhaar-status`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setAadhaarStatus(res.data.ekycStatus || "Not Verified");
    } catch {
      setAadhaarStatus("Not Verified");
    } finally {
      setAadhaarLoading(false);
    }
  };

  // ---------------------- Deep Link Listener ----------------------
  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const parsed = new URL(url);
      const code = parsed.searchParams.get("code");
      const codeVerifier = decodeURIComponent(parsed.searchParams.get("codeVerifier") || "");
      if (code && codeVerifier) fetchAadhaarReference(code, codeVerifier);
    });

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        const parsed = new URL(initialUrl);
        const code = parsed.searchParams.get("code");
        const codeVerifier = decodeURIComponent(parsed.searchParams.get("codeVerifier") || "");
        if (code && codeVerifier) fetchAadhaarReference(code, codeVerifier);
      }
    });

    return () => subscription.remove();
  }, []);

  // ---------------------- Render Item ----------------------
  const renderItem = ({ item }) => {
    const isKYC = item.id === "3";

    return (
      <View>
        {/* MAIN ROW */}
        <TouchableOpacity
          style={styles.rowCard}
          activeOpacity={0.7}
          onPress={() => {
            if (isKYC) setShowKycOptions(!showKycOptions);
          }}
        >
          <View style={styles.leftRow}>
            <View style={styles.iconBox}>
              {item.library === "Ionicons" ? (
                <Ionicons name={item.icon} size={20} color="#7A5F4A" />
              ) : (
                <MaterialCommunityIcons name={item.icon} size={20} color="#7A5F4A" />
              )}
            </View>
            <Text style={styles.itemLabel}>{item.label}</Text>
          </View>

          <View>
            <View
              style={[
                styles.statusBadge,
                item.id === "3"
                  ? aadhaarStatus === "Verified" && panStatus === "Verified"
                    ? styles.greenBadge
                    : styles.redBadge
                  : item.status === "verified"
                  ? styles.greenBadge
                  : styles.redBadge,
              ]}
            >
              <Ionicons
                name={
                  item.id === "3"
                    ? aadhaarStatus === "Verified" && panStatus === "Verified"
                      ? "checkmark"
                      : "close"
                    : item.status === "verified"
                    ? "checkmark"
                    : "close"
                }
                size={16}
                color="#fff"
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* KYC BUTTONS BELOW (EXPANDED SECTION) */}
        {isKYC && showKycOptions && (
          <View style={{ marginTop: 14 }}>
            {/* PAN Input */}
            <TextInput
              placeholder="Enter PAN Number"
              value={formData.panNumber}
              autoCapitalize="characters"
              maxLength={10}
              onChangeText={(val) => setFormData({ ...formData, panNumber: val })}
              style={styles.panInput}
            />
            {/* PAN Verify Button */}
            <TouchableOpacity
              style={[styles.bigButton, { marginTop: 10 }]}
              onPress={handleVerifyPan}
              disabled={panLoading}
            >
              {panLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bigButtonText}>Verify PAN</Text>}
            </TouchableOpacity>

            {/* Aadhaar Verify Button */}
            <TouchableOpacity
              style={[styles.bigButton, { marginTop: 16 }]}
              onPress={startAadhaarVerification}
              disabled={aadhaarLoading}
            >
              {aadhaarLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.bigButtonText}>Verify Aadhaar</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="chevron-back" size={26} color="#7A5F4A" />
        <Text style={styles.headerTitle}>Verification Status</Text>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Your secure profile ensures a trusted community experience.
      </Text>

      {/* LIST */}
      <FlatList
        data={DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 10 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      <Toast />
    </SafeAreaView>
  );
};

export default VerificationStatusScreen;

// ---------------------- Styles ----------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F3EE", paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 4 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 21, fontWeight: "700", color: "#6B4A34", marginRight: 26 },
  subtitle: { textAlign: "center", fontSize: 13.5, color: "#B29B8A", marginTop: 2, marginBottom: 16 },
  rowCard: { backgroundColor: "#FFF", paddingVertical: 16, paddingHorizontal: 14, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  leftRow: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#FBF6F2", alignItems: "center", justifyContent: "center", marginRight: 12 },
  itemLabel: { fontSize: 15.5, color: "#3E2B24", fontWeight: "600" },
  statusBadge: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  greenBadge: { backgroundColor: "#2AA84F" },
  redBadge: { backgroundColor: "#D64545" },
  bigButton: { backgroundColor: "#5A3F2E", paddingVertical: 18, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  bigButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  panInput: { backgroundColor: "#f3f3f3", padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 4 },
});


// import React, { useState } from "react";
// import {
//   SafeAreaView,
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
// } from "react-native";
// import Ionicons from "react-native-vector-icons/Ionicons";
// import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

// // const DATA = [
// //   { id: "1", label: "Mobile Number", icon: "call-outline", status: "verified" },
// //   { id: "2", label: "Email ID", icon: "mail-outline", status: "unverified" },
// //   { id: "3", label: "KYC", icon: "card-account-details-outline", status: "unverified" },
// // ];

// const DATA = [
//   { id: "1", label: "Mobile Number", icon: "call-outline", library: "Ionicons", status: "verified" },
//   { id: "2", label: "Email ID", icon: "mail-outline", library: "Ionicons", status: "verified" },
//   { id: "3", label: "KYC", icon: "card-account-details-outline", library: "MaterialCommunityIcons", status: "unverified" },
// ];


// const VerificationStatusScreen = () => {
//   const [showKycOptions, setShowKycOptions] = useState(false);

//   const renderItem = ({ item }) => {
//     const isKYC = item.id === "3";

//     return (
//       <View>
//         {/* MAIN ROW */}
//         <TouchableOpacity
//           style={styles.rowCard}
//           activeOpacity={0.7}
//           onPress={() => {
//             if (isKYC) setShowKycOptions(!showKycOptions);
//           }}
//         >
//           <View style={styles.leftRow}>
           
            
//             <View style={styles.iconBox}>
//   {item.library === "Ionicons" ? (
//     <Ionicons name={item.icon} size={20} color="#7A5F4A" />
//   ) : (
//     <MaterialCommunityIcons name={item.icon} size={20} color="#7A5F4A" />
//   )}
// </View>

//             <Text style={styles.itemLabel}>{item.label}</Text>
//           </View>

//           <View>
//             {item.status === "verified" ? (
//               <View style={[styles.statusBadge, styles.greenBadge]}>
//                 <Ionicons name="checkmark" size={16} color="#fff" />
//               </View>
//             ) : (
//               <View style={[styles.statusBadge, styles.redBadge]}>
//                 <Ionicons name="close" size={16} color="#fff" />
//               </View>
//             )}
//           </View>
//         </TouchableOpacity>

//         {/* KYC BUTTONS BELOW (EXPANDED SECTION) */}
//         {isKYC && showKycOptions && (
//           <View style={{ marginTop: 14 }}>
//             <TouchableOpacity style={styles.bigButton}>
//               <Text style={styles.bigButtonText}>Verify Aadhar Card</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={[styles.bigButton, { marginTop: 16 }]}>
//               <Text style={styles.bigButtonText}>Verify PAN Card</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Ionicons name="chevron-back" size={26} color="#7A5F4A" />
//         <Text style={styles.headerTitle}>Verification Status</Text>
//       </View>

//       {/* Subtitle */}
//       <Text style={styles.subtitle}>
//         Your secure profile ensures a trusted community experience.
//       </Text>

//       {/* LIST */}
//       <FlatList
//         data={DATA}
//         keyExtractor={(item) => item.id}
//         renderItem={renderItem}
//         contentContainerStyle={{ paddingTop: 10 }}
//         ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
//       />
//     </SafeAreaView>
//   );
// };

// export default VerificationStatusScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F8F3EE",
//     paddingHorizontal: 20,
//   },

//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 10,
//     marginBottom: 4,
//   },

//   headerTitle: {
//     flex: 1,
//     textAlign: "center",
//     fontSize: 21,
//     fontWeight: "700",
//     color: "#6B4A34",
//     marginRight: 26,
//   },

//   subtitle: {
//     textAlign: "center",
//     fontSize: 13.5,
//     color: "#B29B8A",
//     marginTop: 2,
//     marginBottom: 16,
//   },

//   rowCard: {
//     backgroundColor: "#FFF",
//     paddingVertical: 16,
//     paddingHorizontal: 14,
//     borderRadius: 12,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.08,
//     shadowRadius: 4,
//     shadowOffset: { width: 0, height: 2 },
//     elevation: 3,
//   },

//   leftRow: {
//     flexDirection: "row",
//     alignItems: "center",
//   },

//   iconBox: {
//     width: 42,
//     height: 42,
//     borderRadius: 10,
//     backgroundColor: "#FBF6F2",
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 12,
//   },

//   itemLabel: {
//     fontSize: 15.5,
//     color: "#3E2B24",
//     fontWeight: "600",
//   },

//   statusBadge: {
//     width: 32,
//     height: 32,
//     borderRadius: 8,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   greenBadge: {
//     backgroundColor: "#2AA84F",
//   },

//   redBadge: {
//     backgroundColor: "#D64545",
//   },

//   bigButton: {
//     backgroundColor: "#5A3F2E",
//     paddingVertical: 18,
//     borderRadius: 30,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   bigButtonText: {
//     color: "#FFF",
//     fontSize: 16,
//     fontWeight: "700",
//   },
// });

