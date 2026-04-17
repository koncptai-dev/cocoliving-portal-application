import React, { useState,useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import Toast from "react-native-toast-message";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import Config from "react-native-config";

export const BASE_URL = Config.API_BASE_URL;


const MyVisit = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    visitDate: "",
    propertyId: "", // empty like web → should work if backend allows it
  });
  
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
  if (user) {
    setForm(prev => ({
      ...prev,
      name: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
    }));
  }
}, [user]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (event.type === "set" && selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setForm((prev) => ({ ...prev, visitDate: formattedDate }));
    } else if (event.type === "dismissed") {
      setShowPicker(false);
    }
  };

  const handleSubmit = async () => {
    // Mandatory: validate all fields (web has 'required' attribute)
    if (!form.name.trim()) {
      Toast.show({ type: "error", text1: "Name is required" });
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      Toast.show({ type: "error", text1: "Valid email is required" });
      return;
    }
    if (!form.phone.trim() || form.phone.length !== 10) {
      Toast.show({ type: "error", text1: "Phone must be 10 digits" });
      return;
    }
    if (!form.visitDate) {
      Toast.show({ type: "error", text1: "Please select visit date" });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        visitDate: form.visitDate,
        propertyId: null, // force empty like web (or use form.propertyId if you want dynamic later)
      };

      console.log("Submitting Payload:", JSON.stringify(payload, null, 2));
        console.log("TOKEN:", user?.token);
       const response = await axios.post(
      `${BASE_URL}/api/scheduled-visits/make-a-visit`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`, // ✅ important change
        },
        timeout: 15000, // thoda safe timeout
      }
    );

      console.log("API Success Response:", response.status, response.data);

      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Visit scheduled successfully",
        visibilityTime: 4000,
      });

      // Reset form
      setForm({
        name: "",
        email: "",
        phone: "",
        visitDate: "",
        propertyId: "",
      });
    } catch (err: any) {
      console.error("API Error Full Details:", {
        message: err.message,
        code: err.code,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers,
        } : "No response",
        request: err.request ? "Request sent but no response" : "Request not sent",
      });

      let errorMsg = "Failed to schedule visit. Please try again.";
      if (err.response) {
        // Server responded with error
        errorMsg = err.response.data?.message || `Server error (${err.response.status})`;
      } else if (err.request) {
        // No response received (network issue, CORS, timeout, SSL, etc.)
        errorMsg = "Network error – check internet or try later";
        
      } else {
        errorMsg = err.message;
      }

      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMsg,
        visibilityTime: 6000,
      });
    } finally {
      setLoading(false);
    }
  };





// const handleSubmit = async () => {
//   // ✅ Validation
//   if (!form.name.trim()) {
//     Toast.show({ type: "error", text1: "Name is required" });
//     return;
//   }
//   if (!form.email.trim() || !form.email.includes("@")) {
//     Toast.show({ type: "error", text1: "Valid email is required" });
//     return;
//   }
//   if (!form.phone.trim() || form.phone.length !== 10) {
//     Toast.show({ type: "error", text1: "Phone must be 10 digits" });
//     return;
//   }
//   if (!form.visitDate) {
//     Toast.show({ type: "error", text1: "Please select visit date" });
//     return;
//   }

//   setLoading(true);

//   try {
//     const payload = {
//       name: form.name.trim(),
//       email: form.email.trim(),
//       phone: form.phone.trim(),
//       visitDate: form.visitDate,
//       propertyId: null, // ✅ correct
//     };

//     console.log("Submitting Payload:", payload);
//     console.log("TOKEN:", user?.token);

//     const response = await axios.post(
//       `${BASE_URL}/api/scheduled-visits/make-a-visit`,
//       payload,
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${user?.token}`,
//         },
//         timeout: 15000, // ✅ increased timeout
//       }
//     );

//     console.log("✅ API SUCCESS:", response.status, response.data);

//     // ✅ Handle success properly (200 + 201)
//     if (response.status === 200 || response.status === 201) {
//       Toast.show({
//         type: "success",
//         text1: "Success!",
//         text2: "Visit scheduled successfully",
//         visibilityTime: 4000,
//       });

//       // ✅ Reset form safely
//       setForm({
//         name: "",
//         email: "",
//         phone: "",
//         visitDate: "",
//         propertyId: "",
//       });
//     } else {
//       // ⚠️ unexpected status
//       Toast.show({
//         type: "error",
//         text1: "Unexpected response",
//         text2: `Status: ${response.status}`,
//       });
//     }

//   } catch (err) {
//     console.log("❌ CATCH HIT");

//     // 🔍 Detailed logging
//     console.log("ERROR MESSAGE:", err.message);
//     console.log("ERROR CODE:", err.code);
//     console.log("ERROR RESPONSE:", err.response);
//     console.log("ERROR REQUEST:", err.request);

//     let errorMsg = "Failed to schedule visit. Please try again.";

//     if (err.response) {
//       // ✅ Server responded (4xx / 5xx)
//       errorMsg =
//         err.response.data?.message ||
//         `Server error (${err.response.status})`;

//     } else if (err.request) {
//       // 🚨 No response from server
//       errorMsg = "Server not responding. Please try again.";

//     } else {
//       // ❌ Request setup issue
//       errorMsg = err.message;
//     }

//     Toast.show({
//       type: "error",
//       text1: "Error",
//       text2: errorMsg,
//       visibilityTime: 6000,
//     });

//   } finally {
//     setLoading(false);
//   }
// };
  const getDisplayDate = () => {
    if (!form.visitDate) return "Select Visit Date";
    const [y, m, d] = form.visitDate.split("-");
    return `${d}/${m}/${y}`;
  };

return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <View style={{ flex: 1, backgroundColor: "#F7F7F7" }}>

      {/* 🔒 FIXED HEADER (NOT SCROLLABLE) */}
      <View style={styles.header}>
        <Ionicons
          name="chevron-back"
          size={26}
          color="#4C3D2A"
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.title}>My Visit</Text>
      </View>

      {/* 📜 SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        
      >
        <Text style={styles.subtitle}>
          Schedule your visit and experience COCO Living firsthand.
        </Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#616161"
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            keyboardType="email-address"
            placeholderTextColor="#616161"
            autoCapitalize="none"
            autoCorrect={false}
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number (10 digits)"
            keyboardType="phone-pad"
            placeholderTextColor="#616161"
            maxLength={10}
            value={form.phone}
            onChangeText={(t) => setForm({ ...form, phone: t })}
          />

          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
            style={styles.datePickerContainer}
          >
            <View style={styles.dateInputDisplay}>
              <Text
                style={{
                  color: form.visitDate ? "#3E2B24" : "#616161",
                  fontSize: 16,
                }}
              >
                {getDisplayDate()}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>Schedule Visit</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* DATE PICKER */}
      {showPicker && (
        <DateTimePicker
          value={
            form.visitDate
              ? new Date(form.visitDate + "T00:00:00")
              : new Date()
          }
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={new Date()}
          onChange={onDateChange}
        />
      )}

      <Toast />
    </View>
  </KeyboardAvoidingView>
);
};

export default MyVisit;

// Styles remain the same as your previous version
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F7F7F7",
    padding: 24,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 25,
    fontFamily:'Quicksand-Bold',
    color: "#3E2B24",
    textAlign: "center",
    marginBottom: 8,
    marginTop:20,
  },
  subtitle: {
    fontSize: 15,
    color: "#8C7A6A",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
    fontFamily:'Quicksand-Bold'
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  input: {
    backgroundColor: "#FAF8F6",
    borderWidth: 1,
    borderColor: "#E5D8CF",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: "#3E2B24",
    marginBottom: 16,
  },
  datePickerContainer: {
    marginBottom: 24,
  },
  dateInputDisplay: {
    backgroundColor: "#FAF8F6",
    borderWidth: 1,
    borderColor: "#E5D8CF",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: "center",
    minHeight: 56,
  },
  button: {
    backgroundColor: "#5A3F2E",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#8C7A6A",
    opacity: 0.7,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 18,
    // fontWeight: "bold",
    fontFamily:'Quicksand-Bold'
  },
header: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 24,   // ✅ Add this
  marginBottom: 20,
  marginTop: 30,
},
  title: { fontSize: 25, fontFamily:'Quicksand-Bold', color: "#4C3D2A" },
});