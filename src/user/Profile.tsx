// FINAL PROFILE SCREEN — ONLY CAMERA FOR PROFILE PHOTO (NO GALLERY UPLOAD)

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  KeyboardAvoidingView
} from "react-native";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { launchCamera } from "react-native-image-picker";  // ← CHANGED TO CAMERA ONLY
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://staging.cocoliving.in";

export default function Profile() {
  const { user } = useAuth();
  const { refreshUser } = useAuth();
  const token = user?.token;
  const navigation = useNavigation();
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
    parentEmail: "",     // ← NEW: matches web
    parentMobile: "",
    companyName: "",
    position: "",
    allergies: "",
    foodPreference: "",  // ← string for easier handling
  });

  const [image, setImage] = useState(null);
  const [showDOB, setShowDOB] = useState(false);
  const [showGender, setShowGender] = useState(false);   // ← NEW
  const [showFood, setShowFood] = useState(false);

  const [errors, setErrors] = useState({
    parentMobile: "",
    parentEmail: "",
  });

  // 🔥 Validation functions (same logic as web)
  const validateParentEmail = (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Invalid email format";
    }
    return "";
  };

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
        parentEmail: u.parentEmail || "",      // ← NEW
        parentMobile: u.parentMobile || "",
        companyName: u.companyName || "",
        position: u.position || "",
        allergies: u.allergies || "",
        foodPreference: u.foodPreference || "",
      });

      if (u.profileImage) {
        setImage(`https://staging.cocoliving.in${u.profileImage}`);
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to load profile" });
    }
  };

  // 🔥 ONLY CAMERA — NO GALLERY UPLOAD
  const pickImage = () => {
    launchCamera(
      {
        mediaType: "photo",
        cameraType: "front",          // optional: front camera by default (better for selfies)
        quality: 0.8,
        includeBase64: false,
      },
      (res) => {
        if (res.didCancel) {
          console.log("User cancelled camera");
          return;
        }
        if (res.errorCode) {
          console.log("Camera error:", res.errorMessage);
          Toast.show({
            type: "error",
            text1: "Camera Error",
            text2: res.errorMessage || "Unable to open camera",
          });
          return;
        }
        if (res.assets && res.assets[0]?.uri) {
          setImage(res.assets[0].uri);
          Toast.show({
            type: "success",
            text1: "Photo captured!",
            text2: "Save profile to upload",
          });
        }
      }
    );
  };

  const update = (key, val) => setProfile({ ...profile, [key]: val });

  // 🔥 Save Profile
  const saveProfile = async () => {
    const emailError = validateParentEmail(profile.parentEmail);

    if (emailError) {
      setErrors({ parentEmail: emailError });
      Toast.show({ type: "error", text1: "Please fix error in parent email" });
      return;
    }

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
      form.append("parentEmail", profile.parentEmail || "");     // ← NEW
      form.append("parentMobile", profile.parentMobile || "");
      form.append("companyName", profile.companyName || "");
      form.append("position", profile.position || "");
      form.append("allergies", profile.allergies || "");
      form.append("foodPreference", profile.foodPreference || "");

      // IMAGE UPLOAD (only if new photo taken)
      if (image && !image.startsWith("https://")) {
        form.append("profileImage", {
          uri: image,
          type: "image/jpeg",
          name: "profile.jpg",
        } as any);
      }

      await axios.put(
        `${BASE_URL}/api/user/update-profile/${user.id}`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      await refreshUser();

      Toast.show({
        type: "success",
        text1: "Profile Updated Successfully!",
      });
    } catch (e: any) {
      console.log("UPDATE ERROR:", e.response?.data);
      const msg =
        e.response?.data?.error ||
        e.response?.data?.message ||
        "Failed to update profile";
      Toast.show({ type: "error", text1: msg });
    }
  };

  return (
       <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
    
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
                  {profile.firstName?.charAt(0)?.toUpperCase()}
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

            <View style={[styles.tab, isProfessional ? styles.tabActive : styles.tabInactive]}>
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
            value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : "Select"}
            onPress={() => setShowDOB(true)}
          />

          <FloatingDropdown
            label="Gender"
            value={profile.gender || "Select Gender"}
            onPress={() => setShowGender(!showGender)}
          />
        </View>

        {/* Gender Options */}
        {showGender && (
          <View style={styles.optionList}>
            <TouchableOpacity onPress={() => { update("gender", "Male"); setShowGender(false); }}>
              <Text style={styles.optionItem}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { update("gender", "Female"); setShowGender(false); }}>
              <Text style={styles.optionItem}>Female</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { update("gender", "Other"); setShowGender(false); }}>
              <Text style={styles.optionItem}>Other</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DOB Picker */}
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
        <FloatingStaticVerified
          label="Email"
          value={profile.email}
          verified={user?.isEmailVerified}
        />

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

            <FloatingInputFull
              label="Parent Email"
              value={profile.parentEmail}
              onChangeText={(v) => {
                update("parentEmail", v);
                setErrors(prev => ({ ...prev, parentEmail: validateParentEmail(v) }));
              }}
              keyboardType="email-address"
            />
            {errors.parentEmail && <Text style={styles.errorText}>{errors.parentEmail}</Text>}

            <FloatingInputFull
              label="Parent Mobile"
              value={profile.parentMobile}
              onChangeText={(v) => update("parentMobile", v)}  
              keyboardType="phone-pad"
            />
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
          value={profile.foodPreference || "Select"}
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

        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast />
 </KeyboardAvoidingView>
  );
}

/* FLOATING COMPONENTS */
// (unchanged - same as before)
const FloatingInput = ({ label, value, onChangeText, keyboardType = "default" }) => (
  <View style={styles.floatWrapper}>
    <Text style={styles.smallLabel}>{label}</Text>
    <TextInput
      style={styles.floatInput}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
    />
  </View>
);

const FloatingInputFull = ({ label, value, onChangeText, keyboardType = "default" }) => (
  <View style={styles.floatWrapper}>
    <Text style={styles.smallLabel}>{label}</Text>
    <TextInput
      style={styles.floatInput}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
    />
  </View>
);

const FloatingDropdown = ({ label, value, onPress }) => (
  <TouchableOpacity style={styles.floatWrapper} onPress={onPress}>
    <Text style={styles.smallLabel}>{label}</Text>
    <View style={styles.dropdownRow}>
      <Text style={styles.dropdownText}>{value}</Text>
      <Ionicons name="chevron-down" size={18} color="#4C3D2A" />
    </View>
  </TouchableOpacity>
);

const FloatingStaticVerified = ({ label, value, verified }) => (
  <View style={styles.floatWrapper}>
    <Text style={styles.smallLabel}>{label}</Text>

    <View style={styles.dropdownRow}>
      <Text style={[styles.floatInput, { flex: 1, color: "#666" }]}>
        {value}
      </Text>

      {verified ? (
        <>
          <Ionicons name="checkmark-circle" size={16} color="green" />
          <Text style={{ color: "green", fontSize: 12, marginLeft: 4 }}>
            Verified
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="alert-circle-outline" size={16} color="#D48A00" />
          <Text style={{ color: "#D48A00", fontSize: 12, marginLeft: 4 }}>
            Not Verified
          </Text>
        </>
      )}
    </View>
  </View>
);

const FloatingPhone = ({ label, value, onChangeText, verified }) => (
  <View style={styles.floatWrapper}>
    <Text style={styles.smallLabel}>{label}</Text>

    <View style={styles.dropdownRow}>
      <TextInput
        style={[
          styles.floatInput,
          { flex: 1, color: verified ? "#666" : "#000" },
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="phone-pad"
        editable={!verified}
        selectTextOnFocus={!verified}
      />

      {verified ? (
        <>
          <Ionicons name="checkmark-circle" size={16} color="green" />
          <Text style={{ color: "green", fontSize: 12, marginLeft: 4 }}>
            Verified
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="alert-circle-outline" size={16} color="#D48A00" />
          <Text style={{ color: "#D48A00", fontSize: 12, marginLeft: 4 }}>
            Not Verified
          </Text>
        </>
      )}
    </View>
  </View>
);

/* STYLES */
// (unchanged)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },

  header: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "700", color: "#4C3D2A" },

  rowTop: { flexDirection: "row", alignItems: "center", marginBottom: 25 },

  imageWrapper: { position: "relative" },
  profileImg: { width: 95, height: 95, borderRadius: 50 },
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

  errorText: {
    color: "red",
    fontSize: 12,
    marginLeft: 12,
    marginTop: -8,
    marginBottom: 10,
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