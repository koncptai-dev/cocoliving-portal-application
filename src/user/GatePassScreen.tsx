import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import Toast from "react-native-toast-message";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import Config from "react-native-config";
 
export const baseURL = Config.API_BASE_URL;
 
const GatepassScreen = () => {
  const { user } = useAuth();
  const loginAs = user?.loginAs || "student";
  const isParentLogin = loginAs === "parent";
 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gatePasses, setGatePasses] = useState([]);
  const [editingId, setEditingId] = useState(null);
 
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  const navigation = useNavigation();
 
  const [form, setForm] = useState({
    requestType: "",
    date: "",
    time: "",
    reason: "",
  });
 
  /* ---------------- FETCH ---------------- */
const fetchGatePasses = async () => {
  console.log("📡 fetchGatePasses started");
 
  try {
    const url = isParentLogin
      ? "/gate-pass/all"
      : "/gate-pass/user-gate-passes";
 
    console.log("➡️ API URL:", `${baseURL}${url}`);
    console.log("🔐 Token:", user?.token ? "Present" : "Missing");
 
    const res = await axios.get(`${baseURL}${url}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
 

// Toast.show({
//       type: "pass",
//       text1: "Successfully ",
//     });

    console.log("✅ fetchGatePasses SUCCESS");
    console.log("📦 Response status:", res.status);
    console.log("📦 Response data:", res.data);
 
    setGatePasses(res.data?.gatePasses || []);
  } catch (error: any) {
    console.log("❌ fetchGatePasses FAILED");
 
    if (error.response) {
      console.log("🚨 Status:", error.response.status);
      console.log("🚨 Data:", error.response.data);
      console.log("🚨 Headers:", error.response.headers);
    } else if (error.request) {
      console.log("🚨 No response received:", error.request);
    } else {
      console.log("🚨 Error message:", error.message);
    }
 
    Toast.show({
      type: "error",
      text1: "Failed to load gate passes",
    });
  } finally {
    console.log("🏁 fetchGatePasses finished");
    setLoading(false);
  }
};
 
  // /* ---------------- FETCH ---------------- */
  // const fetchGatePasses = async () => {
  //   try {
  //     const url = isParentLogin
  //       ? "/gate-pass/all"
  //       : "/gate-pass/user-gate-passes";
 
  //     const res = await axios.get(`${baseURL}${url}`, {
  //       headers: { Authorization: `Bearer ${user.token}` },
  //     });
 
  //     setGatePasses(res.data.gatePasses || []);
  //   } catch {
  //     Toast.show({ type: "error", text1: "Failed to load gate passes" });
  //   } finally {
  //     setLoading(false);
  //   }
  // };
 
  useEffect(() => {
    fetchGatePasses();
  }, []);
 
  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    if (!form.requestType || !form.date || !form.time || form.reason.length < 5) {
      Toast.show({ type: "error", text1: "Please fill all fields properly" });
      return;
    }
 
    try {
      setSaving(true);
      const url = editingId
        ? `/gate-pass/update/${editingId}`
        : "/gate-pass/create";
 
      const method = editingId ? axios.put : axios.post;
 
      await method(`${baseURL}${url}`, form, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
 
      //new
      //setShowListModal(false);

      // Toast.show({
      //   type: "success",
      //   text1: editingId ? "Gate pass updated" : "Gate pass created",
      // });
 
      Alert.alert(
  "Success",
  editingId ? "Gate pass updated successfully\ncheck view gate passes section" : "Gate pass created successfully\ncheck view gate passes section"
);
      setForm({ requestType: "", date: "", time: "", reason: "" });
      setEditingId(null);
      fetchGatePasses();
   } catch (error) {
  console.log("SUBMIT ERROR:", error.response?.data);
  Toast.show({ type: "error", text1: "Action failed" });

    } finally {
      setSaving(false);
    }
  };
 
  /* ---------------- APPROVE / REJECT ---------------- */
  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `${baseURL}/gate-pass/approve-reject/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      //new 
      //setShowListModal(false);
      //Toast.show({ type: "success", text1: `Gate pass ${status}` });
       Alert.alert("Updated", "Gate pass updated successfully");
      fetchGatePasses();
    } catch {
      Toast.show({ type: "error", text1: "Action failed" });
    }
  };
 
  /* ---------------- EDIT ---------------- */
  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      requestType: item.requestType,
      date: item.date,
      time: item.time.slice(0, 5),
      reason: item.reason,
    });
    setShowListModal(false);
  };
 
  /* ---------------- LIST ITEM ---------------- */
  const renderItem = ({ item }) => {
    const isPending = item.status === "pending";
 
    return (
      <View style={styles.card}>
        <View style={styles.cardAccent} />
 
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.requestType}</Text>
 
          {isParentLogin && item.user && (
            <Text style={styles.sub}>
              {item.user.fullName} • {item.user.phone}
            </Text>
          )}
 
          <Text style={styles.sub}>{item.date} • {item.time}</Text>
          <Text style={styles.reason}>{item.reason}</Text>
 
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, styles[item.status]]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
 
            {!isParentLogin && isPending && (
              <TouchableOpacity onPress={() => handleEdit(item)}>
                <Ionicons name="create-outline" size={20} color="#5B3A23" />
              </TouchableOpacity>
            )}
          </View>
 
          {isParentLogin && isPending && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => updateStatus(item.id, "approved")}
              >
                <Text style={styles.btnText}>Approve</Text>
              </TouchableOpacity>
 
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => updateStatus(item.id, "rejected")}
              >
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };
 
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#5B3A23" />
      </SafeAreaView>
    );
  }
 
return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color="#4C3D2A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gate Pass</Text>
        </View>

        {/* CONTENT */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          {!isParentLogin && (
            <View style={styles.form}>
              <Input
                label="Request Type"
                value={form.requestType}
                onChange={(v) => setForm({ ...form, requestType: v })}
              />

              <PickerInput
                label="Visit Date"
                value={form.date}
                onPress={() => setShowDatePicker(true)}
              />

              <PickerInput
                label="Visit Time"
                value={form.time}
                onPress={() => setShowTimePicker(true)}
              />

              <Input
                label="Reason"
                value={form.reason}
                multiline
                onChange={(v) => setForm({ ...form, reason: v })}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
                <Text style={styles.saveText}>
                  {editingId ? "Update" : "Submit"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => setShowListModal(true)}
          >
            <Ionicons name="document-text-outline" size={20} color="#FFF" />
            <Text style={styles.viewBtnText}>View Gate Passes</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* MODAL */}
        <Modal visible={showListModal} animationType="slide">
          <SafeAreaView style={styles.container}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gate Pass List</Text>
              <TouchableOpacity onPress={() => setShowListModal(false)}>
                <Ionicons name="close" size={26} color="#FFF" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={gatePasses}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={{ padding: 16 }}
            />
          </SafeAreaView>
        </Modal>

        {/* DATE PICKER */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            minimumDate={new Date()}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(e, date) => {
              setShowDatePicker(false);
              if (date) {
                const d = String(date.getDate()).padStart(2, "0");
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const y = date.getFullYear();
                setForm({
  ...form,
  date: `${y}-${m}-${d}`,  // ✅ Backend safe format
});
              }
            }}
          />
        )}

        {/* TIME PICKER */}
        {showTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(e, time) => {
              setShowTimePicker(false);
              if (time) {
                const h = String(time.getHours()).padStart(2, "0");
                const min = String(time.getMinutes()).padStart(2, "0");
                setForm({ ...form, time: `${h}:${min}` });
              }
            }}
          />
        )}

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};
 
export default GatepassScreen;
 
/* ---------------- INPUTS ---------------- */
const Input = ({ label, value, onChange, multiline = false }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      multiline={multiline}
      style={[styles.input, multiline && { height: 90 }]}
      onChangeText={onChange}
    />
  </View>
);
 
const PickerInput = ({ label, value, onPress }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.picker} onPress={onPress}>
      <Text style={{ color: value ? "#3A3A3A" : "#B5B5B5" }}>
        {value || "Select"}
      </Text>
      <Ionicons name="calendar-outline" size={18} color="#5B3A23" />
    </TouchableOpacity>
  </View>
);
 
/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF0F2" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 20,
  },
  headerTitle: {
    color: "#4C3D2A",
    fontSize: 24,
    fontFamily: "Quicksand-Bold",
  },

  form: {
    backgroundColor: "#F7EFE8",
    margin: 16,
    padding: 16,
    borderRadius: 14,
  },

  inputWrap: { marginBottom: 14 },

  label: {
    fontSize: 12,
    color: "#8A8A8A",
    marginBottom: 6,
    fontFamily: "Quicksand-SemiBold",
  },

  input: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    fontFamily: "Quicksand-Regular",
  },

  picker: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  saveBtn: {
    backgroundColor: "#F4A261",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Quicksand-Bold",
  },

  viewBtn: {
    backgroundColor: "#5B3A23",
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 18,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  viewBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Quicksand-Bold",
    marginLeft: 10,
  },

  modalHeader: {
    backgroundColor: "#5B3A23",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Quicksand-Bold",
  },

  /* ----- CARD ----- */
  card: {
    flexDirection: "row",
    backgroundColor: "#FBF6F2",
    borderRadius: 16,
    marginBottom: 14,
    elevation: 3,
  },
  cardAccent: {
    width: 6,
    backgroundColor: "#5B3A23",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },

  cardTitle: {
    fontSize: 16,
    color: "#5B3A23",
    fontFamily: "Quicksand-SemiBold",
  },

  sub: {
    fontSize: 12,
    color: "#7A7A7A",
    marginVertical: 4,
    fontFamily: "Quicksand-Regular",
  },

  reason: {
    fontSize: 13,
    color: "#4A4A4A",
    marginVertical: 6,
    fontFamily: "Quicksand-Regular",
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: "Quicksand-Bold",
  },

  pending: { backgroundColor: "#F4A261" },
  approved: { backgroundColor: "#2E7D32" },
  rejected: { backgroundColor: "#C62828" },

  actionRow: { flexDirection: "row", marginTop: 12 },

  approveBtn: {
    backgroundColor: "#2E7D32",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },

  rejectBtn: {
    backgroundColor: "#C62828",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },

  btnText: {
    color: "#FFF",
    fontFamily: "Quicksand-Bold",
  },
});