// FINAL PROFILE SCREEN — FIXED WITH ENUM, VALIDATION, FLOATING LABELS, 35px HEIGHT

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { launchImageLibrary } from "react-native-image-picker";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://staging.cocoliving.in";

export default function Profile() {
  const { user } = useAuth();
  const token = user?.token;
  const navigation=useNavigation();
  const isStudent = user?.userType === "student";
  const isProfessional = user?.userType === "professional";

  const name = user?.fullName || "";
  const first = name.split(" ")[0] || "";
  const last = name.split(" ").slice(1).join(" ") || "";

  // 🔥 Profile State
  const [profile, setProfile] = useState({
    firstName: first,
    lastName: last,
    dateOfBirth: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    collegeName: "",
    course: "",
    parentName: "",
    parentMobile: "",
    companyName: "",
    position: "",
    allergies: "",
    foodPreference: null, // ⭐ ENUM SAFE
  });

  const [image, setImage] = useState(null);
  const [showDOB, setShowDOB] = useState(false);
  const [showFood, setShowFood] = useState(false);

  // 🔥 Load User
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/user/getUser/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const u = res.data.user;

      setProfile({
        ...profile,
        firstName: u.fullName?.split(" ")[0] || "",
        lastName: u.fullName?.split(" ").slice(1).join(" ") || "",
        dateOfBirth: u.dateOfBirth || "",
        gender: u.gender || "",
        email: u.email || "",
        phone: u.phone || "",
        address: u.address || "",
        collegeName: u.collegeName || "",
        course: u.course || "",
        parentName: u.parentName || "",
        parentMobile: u.parentMobile || "",
        companyName: u.companyName || "",
        position: u.position || "",
        allergies: u.allergies || "",
        foodPreference: u.foodPreference || null, // ⭐
      });

      if (u.profileImage) {
        setImage(`https://staging.cocoliving.in${u.profileImage}`);
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to load profile" });
    }
  };

  const pickImage = () => {
    launchImageLibrary({ mediaType: "photo" }, (res) => {
      if (res.didCancel) return;
      if (res.assets) setImage(res.assets[0].uri);
    });
  };

  const update = (key, val) => setProfile({ ...profile, [key]: val });

  // 🔥 Save Profile (Backend-Safe)
const saveProfile = async () => {
  try {
    const fullName = `${profile.firstName} ${profile.lastName}`.trim();

    const form = new FormData();

    form.append("fullName", fullName);
    form.append("dateOfBirth", profile.dateOfBirth || "");
    form.append("gender", profile.gender || "");
    form.append("phone", profile.phone || "");
    form.append("address", profile.address || "");
    form.append("collegeName", profile.collegeName || "");
    form.append("course", profile.course || "");
    form.append("parentName", profile.parentName || "");
    form.append("parentMobile", profile.parentMobile || "");
    form.append("companyName", profile.companyName || "");
    form.append("position", profile.position || "");
    form.append("allergies", profile.allergies || "");

    // ✅ FOOD PREFERENCE ENUM FIX  
    if (profile.dietary === "Jain" || profile.dietary === "Non-Jain") {
      form.append("foodPreference", profile.dietary);
    }

    // ✅ IMAGE UPLOAD FIX
    if (image && !image.startsWith("https://")) {
      // means this is a NEW image
      form.append("profileImage", {
        uri: image,
        type: "image/jpeg",
        name: "profile.jpg",
      });
    }

    const res = await axios.put(
      `${BASE_URL}/api/user/update-profile/${user.id}`,
      form,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    Toast.show({
      type: "success",
      text1: "Profile Updated Successfully!",
      // position: "bottom",
    });

  } catch (e) {
    console.log("UPDATE ERROR:", e.response?.data);

    const msg =
      e.response?.data?.error ||
      e.response?.data?.message ||
      "Failed to update profile";

    Toast.show({
      type: "error",
      text1: msg,
      // position: "bottom",
    });
  }
};



  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons name="chevron-back" size={26} color="#4C3D2A" onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* IMAGE + USER TYPE */}
      <View style={styles.rowTop}>
        <View style={styles.imageWrapper}>
          {image ? (
            <Image source={{ uri: image }} style={styles.profileImg} />
          ) : (
            <View style={styles.profileCircle}>
              <Text style={styles.profileLetter}>
                {profile.firstName?.charAt(0)}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.camIcon} onPress={pickImage}>
            <Ionicons name="camera-outline" size={20} color="#4C3D2A" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabWrapper}>
          <View style={[styles.tab, isStudent ? styles.tabActive : styles.tabInactive]}>
            <Text style={isStudent ? styles.tabTextActive : styles.tabTextInactive}>Student</Text>
          </View>

          <View
            style={[styles.tab, isProfessional ? styles.tabActive : styles.tabInactive]}
          >
            <Text style={isProfessional ? styles.tabTextActive : styles.tabTextInactive}>
              Professional
            </Text>
          </View>
        </View>
      </View>

      {/* SECTION */}
      <Text style={styles.sectionTitle}>Personal & Contact Information</Text>

      {/* FIRST + LAST NAME */}
      <View style={styles.twoCol}>
        <FloatingInput label="First Name" value={profile.firstName} onChangeText={(v) => update("firstName", v)} />
        <FloatingInput label="Last Name" value={profile.lastName} onChangeText={(v) => update("lastName", v)} />
      </View>

      {/* DOB + GENDER */}
      <View style={styles.twoCol}>
        <FloatingDropdown
          label="Date of Birth"
          value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : ""}
          onPress={() => setShowDOB(true)}
        />

        <FloatingDropdown
          label="Gender"
          value={profile.gender}
          onPress={() => {}}
        />
      </View>

      {showDOB && (
        <DateTimePicker
          value={profile.dateOfBirth ? new Date(profile.dateOfBirth) : new Date()}
          mode="date"
          onChange={(e, d) => {
            if (d) update("dateOfBirth", d.toISOString().split("T")[0]);
            setShowDOB(false);
          }}
        />
      )}

      {/* EMAIL */}
      <FloatingStaticVerified label="Email" value={profile.email} />

      {/* PHONE */}
      <FloatingPhone
        label="Mobile Number"
        value={profile.phone}
        onChangeText={(v) => update("phone", v)}
        verified={user?.isPhoneVerified}
      />

      {/* ADDRESS */}
      <FloatingInputFull label="Permanent Address" value={profile.address} onChangeText={(v) => update("address", v)} />

      {/* STUDENT SECTION */}
      {isStudent && (
        <>
          <Text style={styles.sectionTitle}>Academic Information</Text>

          <FloatingInputFull label="School/College" value={profile.collegeName} onChangeText={(v) => update("collegeName", v)} />

          <FloatingInputFull label="Course" value={profile.course} onChangeText={(v) => update("course", v)} />

          <Text style={styles.sectionTitle}>Emergency Contact</Text>

          <FloatingInputFull label="Parent Name" value={profile.parentName} onChangeText={(v) => update("parentName", v)} />

          <FloatingInputFull label="Parent Mobile" value={profile.parentMobile} onChangeText={(v) => update("parentMobile", v)} />
        </>
      )}

      {/* PROFESSIONAL SECTION */}
      {isProfessional && (
        <>
          <Text style={styles.sectionTitle}>Professional Information</Text>

          <FloatingInputFull label="Company Name" value={profile.companyName} onChangeText={(v) => update("companyName", v)} />

          <FloatingInputFull label="Position" value={profile.position} onChangeText={(v) => update("position", v)} />
        </>
      )}

      {/* FOOD PREFERENCE */}
      <Text style={styles.sectionTitle}>Health & Dietary Information</Text>

      <FloatingDropdown
        label="Food Preference"
        value={profile.foodPreference}
        onPress={() => setShowFood(!showFood)}
      />

      {showFood && (
        <View style={styles.optionList}>
          <TouchableOpacity onPress={() => { update("foodPreference", "Jain"); setShowFood(false); }}>
            <Text style={styles.optionItem}>Jain</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { update("foodPreference", "Non-Jain"); setShowFood(false); }}>
            <Text style={styles.optionItem}>Non-Jain</Text>
          </TouchableOpacity>
        </View>
      )}

      <FloatingInputFull label="Allergies" value={profile.allergies} onChangeText={(v) => update("allergies", v)} />

      {/* SAVE BUTTON */}
      <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>

    
    </ScrollView>
  );
}

/* FLOATING COMPONENTS */
const FloatingInput = ({ label, value, onChangeText }) => (
  <View style={styles.floatWrapper}>
    <Text style={styles.smallLabel}>{label}</Text>
    <TextInput style={styles.floatInput} value={value} onChangeText={onChangeText} />
  </View>
);

const FloatingInputFull = FloatingInput;

const FloatingDropdown = ({ label, value, onPress }) => (
  <TouchableOpacity style={styles.floatWrapper} onPress={onPress}>
    <Text style={styles.smallLabel}>{label}</Text>
    <View style={styles.dropdownRow}>
      <Text style={styles.dropdownText}>{value || "Select"}</Text>
      <Ionicons name="chevron-down" size={18} color="#4C3D2A" />
    </View>
  </TouchableOpacity>
);

const FloatingStaticVerified = ({ label, value }) => (
  <View style={styles.floatWrapper}>
    <Text style={styles.smallLabel}>{label}</Text>
    <View style={styles.dropdownRow}>
      <Text style={[styles.floatInput, { flex: 1, color: "#666" }]}>{value}</Text>
      <Ionicons name="checkmark-circle" size={16} color="green" />
      <Text style={{ color: "green", fontSize: 12 }}>Verified</Text>
    </View>
  </View>
);

const FloatingPhone = ({ label, value, onChangeText, verified }) => (
  <View style={styles.floatWrapper}>
    <Text style={styles.smallLabel}>{label}</Text>
    <View style={styles.dropdownRow}>
      <TextInput style={[styles.floatInput, { flex: 1 }]} value={value} onChangeText={onChangeText} />
      {!verified && (
        <>
          <Ionicons name="alert-circle-outline" size={16} color="#D48A00" />
          <Text style={{ color: "#D48A00", fontSize: 12 }}>Not Verified</Text>
        </>
      )}
    </View>
  </View>
);

/* STYLES */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },

  header: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "700", color: "#4C3D2A" },

  rowTop: { flexDirection: "row", alignItems: "center", marginBottom: 25 },

  imageWrapper: { position: "relative" },
  profileImg: {
    width: 95,
    height: 95,
    borderRadius: 50,
  },
  profileCircle: {
    width: 95,
    height: 95,
    borderRadius: 50,
    backgroundColor: "#e8dacb",
    justifyContent: "center",
    alignItems: "center",
  },
  profileLetter: { fontSize: 32, fontWeight: "700", color: "#4C3D2A" },

  camIcon: {
    position: "absolute",
    bottom: 0,
    right: -5,
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 20,
    elevation: 3,
  },

  tabWrapper: { flexDirection: "row", marginLeft: 20, gap: 10 },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#C9BAA4",
  },
  tabActive: { backgroundColor: "#4C3D2A" },
  tabInactive: { backgroundColor: "#fff" },
  tabTextActive: { color: "#fff", fontWeight: "700" },
  tabTextInactive: { color: "#4C3D2A", fontWeight: "700" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#8A6C4A",
    marginTop: 20,
    marginBottom: 10,
  },

  twoCol: { flexDirection: "row", gap: 10 },

  floatWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#C9BAA4",
    borderRadius: 20,
    height: 45,
    paddingHorizontal: 12,
    justifyContent: "center",
    marginBottom: 18,
    backgroundColor: "#fff",
  },

  smallLabel: {
    position: "absolute",
    top: -10,
    left: 20,
    backgroundColor: "#fff",
    paddingHorizontal: 5,
    fontSize: 10,
    color: "#8A6C4A",
    fontWeight: "700",
  },

  floatInput: {
    fontSize: 14,
    color: "#000",
    paddingVertical: 0,
    marginTop: 3,
  },

  dropdownRow: {
    height: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dropdownText: { fontSize: 15, color: "#000" },

  optionList: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#C9BAA4",
    borderRadius: 12,
    marginTop: -10,
    marginBottom: 20,
    overflow: "hidden",
  },

  optionItem: {
    padding: 12,
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  saveBtn: {
    backgroundColor: "#4C3D2A",
    paddingVertical: 16,
    borderRadius: 35,
    marginTop: 10,
    alignItems: "center",
    marginBottom: 40,
  },
  saveText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
