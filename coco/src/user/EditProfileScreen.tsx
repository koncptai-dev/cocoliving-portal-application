import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import Config from "react-native-config";

/* ---------------------- TYPES ---------------------- */
interface FormDataType {
  fullName: string;
  phone: string;
  parentName: string;
  parentMobile: string;
  parentEmail: string;
  collegeName: string;
  course: string;
  companyName: string;
  position: string;
  foodPreference: "Jain" | "Non-Jain" | null;
}
export const API_BASE_URL = Config.API_BASE_URL;

const EditProfileScreen = () => {
  const { user } = useAuth();

  const loginAs = user?.loginAs || "student";  
  const isParentLogin = loginAs === "parent";

  const [formData, setFormData] = useState<FormDataType>({
    fullName: "",
    phone: "",
    parentName: "",
    parentMobile: "",
    parentEmail: "",
    collegeName: "",
    course: "",
    companyName: "",
    position: "",
    foodPreference: null,
  });

  const [userType, setUserType] =
    useState<"student" | "professional">("student");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [profileImage, setProfileImage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ---------------------- FETCH PROFILE ---------------------- */
  const fetchUserProfile = async () => {
    try {
      if (!user?.id || !user?.token) return;

      setLoading(true);
      console.log("Response of profile fetch: ",API_BASE_URL)
      const res = await axios.get(

        `${API_BASE_URL}/api/user/getUser/${user.id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      const u = res.data.user;

      setUserType(u.userType);
      setIsPhoneVerified(Boolean(u.isPhoneVerified));

      setFormData({
        fullName: u.fullName ?? "",
        phone: u.phone ?? "",
        parentName: u.parentName ?? "",
        parentMobile: u.parentMobile ?? "",
        parentEmail: u.parentEmail ?? "",
        collegeName: u.collegeName ?? "",
        course: u.course ?? "",
        companyName: u.companyName ?? "",
        position: u.position ?? "",
        foodPreference: u.foodPreference ?? null,
      });
    } catch {
      Toast.show({ type: "error", text1: "Failed to load profile data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user?.id]);

  /* ---------------------- SAVE PROFILE ---------------------- */
/* ---------------------- SAVE PROFILE (CORRECTED) ---------------------- */
  const handleSave = async () => {
    // 1. Agar parent login hai to save nahi karne dena
    if (isParentLogin) return;

    // 2. Validation
    if (!formData.fullName.trim()) {
      Toast.show({ type: "error", text1: "Full name is required" });
      return;
    }

    try {
      setSaving(true);

      // 3. Payload Build Karein
      // Yahan hum ensure kar rahe hain ki agar foodPreference empty hai to null jaye
      const payload: any = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        foodPreference: formData.foodPreference || null, // FIX: "" ki jagah null jayega
      };

      // Student fields
      if (userType === "student") {
        payload.parentName = formData.parentName;
        payload.parentMobile = formData.parentMobile;
        payload.parentEmail = formData.parentEmail;
        payload.collegeName = formData.collegeName;
        payload.course = formData.course;
      }

      // Professional fields
      if (userType === "professional") {
        payload.companyName = formData.companyName;
        payload.position = formData.position;
      }

      // 4. Console Log (Check karne ke liye)
      console.log("Final Payload being sent:", JSON.stringify(payload, null, 2));

      // 5. API Call
      const res = await axios.put(
        `${API_BASE_URL}/api/user/update-profile/${user.id}`,
        payload,
        {
          headers: { 
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json" 
          },
        }
      );

      console.log("Success Response:", res.data);

      Toast.show({ type: "success", text1: "Profile updated successfully" });
      
      // Data refresh karein
      fetchUserProfile();
      
    } catch (error: any) {
      // Error logging taaki console me dikhe error kya hai
      console.log("UPDATE ERROR DETAILS:", error.response?.data || error.message);
      
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "Update failed",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------- LOADER ---------------------- */
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4A2E1F" />
      </SafeAreaView>
    );
  }

  /* ---------------------- UI ---------------------- */
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView>
        <View style={styles.profileBox}>
          <Image
            source={{
              uri: profileImage?.uri || "https://i.pravatar.cc/150?img=12",
            }}
            style={styles.avatar}
          />
          <Text style={styles.userType}>
            {isParentLogin
              ? "Parent"
              : userType === "student"
              ? "Student"
              : "Professional"}
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={formData.fullName}
            editable={!isParentLogin}
            onChange={(v: string) =>
              setFormData({ ...formData, fullName: v })
            }
          />

          <Input
            label="Phone"
            value={formData.phone}
            editable={!isParentLogin && !isPhoneVerified}
            onChange={(v: string) =>
              setFormData({ ...formData, phone: v })
            }
          />

          {(userType === "student" || isParentLogin) && (
            <>
              <Input label="Parent Name" value={formData.parentName} editable={!isParentLogin} />
              <Input label="Parent Mobile" value={formData.parentMobile} editable={!isParentLogin} />
              <Input label="Parent Email" value={formData.parentEmail} editable={!isParentLogin} />
            </>
          )}

          {userType === "student" && !isParentLogin && (
            <>
              <Input label="College Name" value={formData.collegeName} />
              <Input label="Course" value={formData.course} />
            </>
          )}

          {userType === "professional" && !isParentLogin && (
            <>
              <Input label="Company Name" value={formData.companyName} />
              <Input label="Position" value={formData.position} />
            </>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.saveBtn,
            (saving || isParentLogin) && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={saving || isParentLogin}
        >
          <Text style={styles.saveText}>
            {isParentLogin ? "View Only" : saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

/* ---------------------- INPUT ---------------------- */
const Input = ({ label, value, onChange, editable = true }: any) => (
  <View style={styles.inputWrap}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      editable={editable}
      style={[styles.input, !editable && styles.disabled]}
      onChangeText={onChange}
    />
  </View>
);

/* ---------------------- STYLES ---------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F4F2" },
  header: {
    backgroundColor: "#4A2E1F",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  profileBox: { alignItems: "center", marginVertical: 20 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#C8A16B",
  },
  userType: { marginTop: 8, color: "#4A2E1F", fontWeight: "600" },
  form: { paddingHorizontal: 16 },
  inputWrap: { marginBottom: 12 },
  label: { fontSize: 12, color: "#555", marginBottom: 4 },
  input: {
    backgroundColor: "#EFECEA",
    borderRadius: 10,
    padding: 12,
  },
  disabled: { opacity: 0.6 },
  saveBtn: {
    backgroundColor: "#F4A85D",
    margin: 16,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

















// import React, { useEffect, useState } from "react";
// import {
//   SafeAreaView,
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Image,
//   ActivityIndicator,
// } from "react-native";
// import Ionicons from "react-native-vector-icons/Ionicons";
// import axios from "axios";
// import Toast from "react-native-toast-message";
// import { useAuth } from "../context/AuthContext"; // 🔴 adjust path if needed

// /* ---------------------- TYPES ---------------------- */
// interface FormDataType {
//   fullName: string;
//   phone: string;
//   parentName: string;
//   parentMobile: string;
//   parentEmail: string;
//   collegeName: string;
//   course: string;
//   companyName: string;
//   position: string;
// }

// const EditProfileScreen = () => {
//   const { user } = useAuth(); // ✅ FIXED

//   const [formData, setFormData] = useState<FormDataType>({
//     fullName: "",
//     phone: "",
//     parentName: "",
//     parentMobile: "",
//     parentEmail: "",
//     collegeName: "",
//     course: "",
//     companyName: "",
//     position: "",
//   });

//   const [userType, setUserType] =
//     useState<"student" | "professional">("student");
//   const [isPhoneVerified, setIsPhoneVerified] = useState(false);
//   const [profileImage, setProfileImage] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   /* ---------------------- FETCH PROFILE ---------------------- */
//   const fetchUserProfile = async () => {
//     try {
//       if (!user?.id || !user?.token) return;

//       setLoading(true);

//       const res = await axios.get(
//         `https://staging.cocoliving.in/api/user/getUser/${user.id}`,
//         {
//           headers: {
//             Authorization: `Bearer ${user.token}`,
//           },
//         }
//       );

//       const u = res.data.user;

//       setUserType(u.userType);
//       setIsPhoneVerified(Boolean(u.isPhoneVerified));

//       setFormData({
//         fullName: u.fullName ?? "",
//         phone: u.phone ?? "",
//         parentName: u.parentName ?? "",
//         parentMobile: u.parentMobile ?? "",
//         parentEmail: u.parentEmail ?? "",
//         collegeName: u.collegeName ?? "",
//         course: u.course ?? "",
//         companyName: u.companyName ?? "",
//         position: u.position ?? "",
//       });
//     } catch (error) {
//       Toast.show({
//         type: "error",
//         text1: "Failed to load profile data",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUserProfile();
//   }, [user?.id]);


// const handleSave = async () => {
//   console.log("➡️ handleSave triggered");
//   console.log("User:", user);
//   console.log("UserType:", userType);
//   console.log("FormData:", formData);
//   console.log("Phone verified:", isPhoneVerified);

//   if (!formData.fullName.trim()) {
//     Toast.show({ type: "error", text1: "Full name is required" });
//     return;
//   }

//   if (
//     userType === "student" &&
//     formData.parentEmail &&
//     formData.parentEmail === user?.email
//   ) {
//     Toast.show({
//       type: "error",
//       text1: "Parent email cannot be same as user email",
//     });
//     return;
//   }

//   try {
//     if (!user?.id || !user?.token) {
//       console.log("❌ Missing user id or token");
//       return;
//     }

//     setSaving(true);

//     const data = new FormData();
//     data.append("fullName", formData.fullName.trim());

//     if (!isPhoneVerified && formData.phone.trim()) {
//       data.append("phone", formData.phone.trim());
//     }

//     if (userType === "student") {
//       if (formData.parentName.trim())
//         data.append("parentName", formData.parentName.trim());
//       if (formData.parentMobile.trim())
//         data.append("parentMobile", formData.parentMobile.trim());
//       if (formData.parentEmail.trim())
//         data.append("parentEmail", formData.parentEmail.trim());
//       if (formData.collegeName.trim())
//         data.append("collegeName", formData.collegeName.trim());
//       if (formData.course.trim())
//         data.append("course", formData.course.trim());
//     }

//     if (userType === "professional") {
//       if (formData.companyName.trim())
//         data.append("companyName", formData.companyName.trim());
//       if (formData.position.trim())
//         data.append("position", formData.position.trim());
//     }

//     if (profileImage) {
//       data.append("profileImage", {
//         uri: profileImage.uri,
//         type: profileImage.type || "image/jpeg",
//         name: profileImage.fileName || "profile.jpg",
//       } as any);
//     }

//     console.log("📤 Sending FormData...");

//     const response = await axios.put(
//   `https://staging.cocoliving.in/api/user/update-profile/${user.id}`,
//   {
//     fullName: formData.fullName,
//     phone: formData.phone,
//     parentName: formData.parentName,
//     parentMobile: formData.parentMobile,
//     parentEmail: formData.parentEmail,
//     collegeName: formData.collegeName,
//     course: formData.course,
//   },
//   {
//     headers: {
//       Authorization: `Bearer ${user.token}`,
//     },
//   }
// );

//     // const response = await axios.put(
//     //   `https://staging.cocoliving.in/api/user/update-profile/${user.id}`,
//     //   data,
//     //   {
//     //     headers: {
//     //       Authorization: `Bearer ${user.token}`,
//     //       // DO NOT set Content-Type manually
//     //     },
//     //   }
//     // );

//     console.log("✅ Update success:", response.data);

//     Toast.show({
//       type: "success",
//       text1: "Profile updated successfully",
//     });

//     fetchUserProfile();
//   } catch (error: any) {
//     console.log("❌ Update failed");

//     if (error.response) {
//       console.log("Status:", error.response.status);
//       console.log("Data:", error.response.data);
//       console.log("Headers:", error.response.headers);

//       Toast.show({
//         type: "error",
//         text1: error.response.data?.message || "Update failed",
//       });
//     } else {
//       console.log("Error message:", error.message);
//       Toast.show({
//         type: "error",
//         text1: "Network or server error",
//       });
//     }
//   } finally {
//     setSaving(false);
//   }
// };

//   /* ---------------------- SAVE PROFILE ---------------------- */
//   // const handleSave = async () => {
//   //   if (!formData.fullName.trim()) {
//   //     Toast.show({ type: "error", text1: "Full name is required" });
//   //     return;
//   //   }

//   //   if (
//   //     userType === "student" &&
//   //     formData.parentEmail &&
//   //     formData.parentEmail === user?.email
//   //   ) {
//   //     Toast.show({
//   //       type: "error",
//   //       text1: "Parent email cannot be same as user email",
//   //     });
//   //     return;
//   //   }

//   //   try {
//   //     if (!user?.id || !user?.token) return;

//   //     setSaving(true);

//   //     const data = new FormData();
//   //     data.append("fullName", formData.fullName.trim());

//   //     if (!isPhoneVerified && formData.phone.trim()) {
//   //       data.append("phone", formData.phone.trim());
//   //     }

//   //     if (userType === "student") {
//   //       if (formData.parentName.trim())
//   //         data.append("parentName", formData.parentName.trim());
//   //       if (formData.parentMobile.trim())
//   //         data.append("parentMobile", formData.parentMobile.trim());
//   //       if (formData.parentEmail.trim())
//   //         data.append("parentEmail", formData.parentEmail.trim());
//   //       if (formData.collegeName.trim())
//   //         data.append("collegeName", formData.collegeName.trim());
//   //       if (formData.course.trim())
//   //         data.append("course", formData.course.trim());
//   //     }

//   //     if (userType === "professional") {
//   //       if (formData.companyName.trim())
//   //         data.append("companyName", formData.companyName.trim());
//   //       if (formData.position.trim())
//   //         data.append("position", formData.position.trim());
//   //     }

//   //     if (profileImage) {
//   //       data.append("profileImage", {
//   //         uri: profileImage.uri,
//   //         type: profileImage.type || "image/jpeg",
//   //         name: profileImage.fileName || "profile.jpg",
//   //       } as any);
//   //     }

//   //     await axios.put(
//   //       `https://staging.cocoliving.in/api/user/update-profile/${user.id}`,
//   //       data,
//   //       {
//   //         headers: {
//   //           Authorization: `Bearer ${user.token}`,
//   //         },
//   //       }
//   //     );


//   //     console.log("success" ,response.data);
//   //     Toast.show({
//   //       type: "success",
//   //       text1: "Profile updated successfully",
//   //     });

//   //     fetchUserProfile();
//   //   } catch (error: any) {
//   //     Toast.show({
//   //       type: "error",
//   //       text1: error.response?.data?.message || "Update failed",
//   //     });
//   //     console.log("failed", error.response.data);
//   //   } finally {
//   //     setSaving(false);
//   //   }
//   // };

//   /* ---------------------- LOADER ---------------------- */
//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <ActivityIndicator
//           size="large"
//           color="#4A2E1F"
//           style={{ marginTop: 60 }}
//         />
//       </SafeAreaView>
//     );
//   }

//   /* ---------------------- UI ---------------------- */
//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Ionicons name="arrow-back" size={22} color="#fff" />
//         <Text style={styles.headerTitle}>Profile</Text>
//         <View style={{ width: 22 }} />
//       </View>

//       <ScrollView>
//         <View style={styles.profileBox}>
//           <Image
//             source={{
//               uri:
//                 profileImage?.uri ||
//                 "https://i.pravatar.cc/150?img=12",
//             }}
//             style={styles.avatar}
//           />
//           <Text style={styles.userType}>
//             {userType === "student" ? "Student" : "Professional"}
//           </Text>
//         </View>

//         <View style={styles.form}>
//           <Input
//             label="Full Name*"
//             value={formData.fullName}
//             onChange={(v: string) =>
//               setFormData({ ...formData, fullName: v })
//             }
//           />

//           <Input
//             label="Phone"
//             value={formData.phone}
//             editable={!isPhoneVerified}
//             onChange={(v: string) =>
//               setFormData({ ...formData, phone: v })
//             }
//           />

//           {userType === "student" && (
//             <>
//               <Input label="Parent Name" value={formData.parentName}
//                 onChange={(v: string) =>
//                   setFormData({ ...formData, parentName: v })
//                 } />

//               <Input label="Parent Mobile" value={formData.parentMobile}
//                 onChange={(v: string) =>
//                   setFormData({ ...formData, parentMobile: v })
//                 } />

//               <Input label="Parent Email" value={formData.parentEmail}
//                 onChange={(v: string) =>
//                   setFormData({ ...formData, parentEmail: v })
//                 } />

//               <Input label="College Name" value={formData.collegeName}
//                 onChange={(v: string) =>
//                   setFormData({ ...formData, collegeName: v })
//                 } />

//               <Input label="Course" value={formData.course}
//                 onChange={(v: string) =>
//                   setFormData({ ...formData, course: v })
//                 } />
//             </>
//           )}

//           {userType === "professional" && (
//             <>
//               <Input label="Company Name" value={formData.companyName}
//                 onChange={(v: string) =>
//                   setFormData({ ...formData, companyName: v })
//                 } />

//               <Input label="Position" value={formData.position}
//                 onChange={(v: string) =>
//                   setFormData({ ...formData, position: v })
//                 } />
//             </>
//           )}
//         </View>

//         <TouchableOpacity
//           style={[styles.saveBtn, saving && { opacity: 0.7 }]}
//           onPress={handleSave}
//           disabled={saving}
//         >
//           <Text style={styles.saveText}>
//             {saving ? "Saving..." : "Save"}
//           </Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// export default EditProfileScreen;

// /* ---------------------- INPUT ---------------------- */
// const Input = ({
//   label,
//   value,
//   onChange,
//   editable = true,
// }: any) => (
//   <View style={styles.inputWrap}>
//     <Text style={styles.label}>{label}</Text>
//     <TextInput
//       value={value}
//       editable={editable}
//       style={[styles.input, !editable && styles.disabled]}
//       onChangeText={onChange}
//     />
//   </View>
// );

// /* ---------------------- STYLES ---------------------- */
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F6F4F2" },

//   header: {
//     backgroundColor: "#4A2E1F",
//     padding: 16,
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   headerTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },

//   profileBox: { alignItems: "center", marginVertical: 20 },
//   avatar: {
//     width: 90,
//     height: 90,
//     borderRadius: 45,
//     borderWidth: 3,
//     borderColor: "#C8A16B",
//   },
//   userType: { marginTop: 8, color: "#4A2E1F", fontWeight: "600" },

//   form: { paddingHorizontal: 16 },
//   inputWrap: { marginBottom: 12 },
//   label: { fontSize: 12, color: "#555", marginBottom: 4 },
//   input: {
//     backgroundColor: "#EFECEA",
//     borderRadius: 10,
//     padding: 12,
//   },
//   disabled: { opacity: 0.6 },

//   saveBtn: {
//     backgroundColor: "#F4A85D",
//     margin: 16,
//     borderRadius: 12,
//     padding: 14,
//     alignItems: "center",
//   },
//   saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
// });




