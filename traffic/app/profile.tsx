import React from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/libs/authContext";
import { deleteAccount } from "@/libs/api/user";
import {
  ArrowLeft,
  ChevronRight,
  Badge,
  CircleHelp,
  Shield,
  FileText,
  Trash2,
  ShieldUser,
} from "lucide-react-native";


const ProfileScreen = () => {
  const router = useRouter();
  //const { userDetails } = useAuth();
const { userDetails, logout } = useAuth();
  const isDark = useColorScheme() === "dark";
const [deleting, setDeleting] = React.useState(false);
  // 🎨 Dynamic Colors
  const colors = {
    bg: isDark ? "#0D1B2A" : "#F5F7FA",
    card: isDark ? "#1B263B" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#1A1A1A",
    subText: isDark ? "#aaa" : "#555",
    border: isDark ? "#1B263B" : "#E0E0E0",
    icon: isDark ? "#FFFFFF" : "#000000",
  };

const Card = ({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: React.ReactNode;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={[styles.card, { backgroundColor: colors.card }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.cardContent}>
      {icon}
      <Text style={[styles.cardText, { color: colors.text }]}>
        {title}
      </Text>
    </View>

    <ChevronRight size={22} color="#999" />
  </TouchableOpacity>
);


  const handleDeleteAccount = () => {
  Alert.alert(
    "Delete Account",
    "Are you sure you want to permanently delete your account?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: confirmDeleteAccount,
      },
    ]
  );
};

const confirmDeleteAccount = async () => {
  try {
    setDeleting(true);

  
   await deleteAccount();
    

    Toast.show({
      type: "success",
      text1: "Account deleted successfully",
    });

    await logout();
  } 
  catch (error: any) {
    console.log(error.response?.data);

    Alert.alert(
      "Error",
      error.response?.data?.message ||
        "Unable to delete account."
    );
  } finally {
    setDeleting(false);
  }
};

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      {/* 🚔 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
         <ArrowLeft
  size={24}
  color={colors.icon}
/>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>
          Profile & Policies
        </Text>
      </View>

      {/* 🎖️ Profile Section */}
      <View
        style={[
          styles.profileBox,
          { backgroundColor: colors.card },
        ]}
      >
     <ShieldUser
  size={50}
  color="#FFC107"
  strokeWidth={2}
/>

        <Text style={[styles.profileName, { color: colors.text }]}>
          {userDetails?.fullName || "N/A"}
        </Text>

        <Text style={styles.profileSub}>
          Belt No: {userDetails?.beltNumber}
        </Text>

        <Text
          style={[
            styles.profileSubSmall,
            { color: colors.subText },
          ]}
        >
          {userDetails?.post}
        </Text>
      </View>

      {/* 📂 Cards */}
      <View style={{ marginTop: 20 }}>
     <Card
  title="About Us"
  icon={<CircleHelp size={22} color="#FFC107" />}
  onPress={() => router.push("/about-us")}
/>

<Card
  title="Privacy Policy"
  icon={<Shield size={22} color="#FFC107" />}
  onPress={() => router.push("/privacy-policy")}
/>

<Card
  title="Terms & Conditions"
  icon={<FileText size={22} color="#FFC107" />}
  onPress={() => router.push("/terms-conditions")}
/>

{/* <Card
  title={deleting ? "Deleting..." : "Delete Account"}
  icon={<Trash2 size={22} color="#FFC107" />}
  onPress={deleting ? undefined : handleDeleteAccount}
/> */}

      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingVertical: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
  },

  profileBox: {
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
  },

  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },

  profileSub: {
    color: "#FFC107",
    fontSize: 14,
    marginTop: 4,
  },

  profileSubSmall: {
    fontSize: 14,
    marginTop: 2,
  },

  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  cardText: {
    fontSize: 16,
    fontWeight: "500",
  },
});


// import React from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useRouter } from "expo-router";
// import { useAuth } from "@/libs/authContext"; // ✅ IMPORTANT

// const ProfileScreen = () => {
//   const router = useRouter();
//   const { userDetails } = useAuth(); // ✅ get same user

//   const Card = ({ title, icon, onPress }) => (
//     <TouchableOpacity style={styles.card} onPress={onPress}>
//       <View style={styles.cardContent}>
//         <MaterialCommunityIcons name={icon} size={22} color="#FFC107" />
//         <Text style={styles.cardText}>{title}</Text>
//       </View>
//       <MaterialCommunityIcons name="chevron-right" size={22} color="#999" />
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
      
//       {/* 🚔 Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()}>
//           <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
//         </TouchableOpacity>

//         <Text style={styles.title}>Profile & Policies</Text>
//       </View>

//       {/* 🎖️ Profile Section */}
//       <View style={styles.profileBox}>
//        <MaterialCommunityIcons name="police-badge" size={50} color="#FFC107" />

//         {/* ✅ Dynamic Data */}
//         <Text style={styles.profileName}>
//           {userDetails?.fullName || "N/A"}
//         </Text>

//         <Text style={styles.profileSub}>
//           Belt No:{userDetails?.beltNumber}
//         </Text>

//         <Text style={styles.profileSubSmall}>
//           {userDetails?.post}
//         </Text>
//       </View>

//       {/* 📂 Cards */}
//       <View style={{ marginTop: 20 }}>
//         <Card
//           title="About Us"
//           icon="information-outline"
//           onPress={() => router.push("/about-us")}
//         />

//         <Card
//           title="Privacy Policy"
//           icon="shield-lock-outline"
//           onPress={() => router.push("/privacy-policy")}
//         />

//         <Card
//           title="Terms & Conditions"
//           icon="file-document-outline"
//           onPress={() => router.push("/terms-conditions")}
//         />
//       </View>
//     </SafeAreaView>
//   );
// };

// export default ProfileScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#0D1B2A",
//     paddingHorizontal: 16,
//   },

//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//     marginBottom: 20,
//     paddingVertical: 10,
//   },

//   title: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#fff",
//   },

//   profileBox: {
//     alignItems: "center",
//     backgroundColor: "#1B263B",
//     padding: 20,
//     borderRadius: 16,
//   },

//   profileName: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginTop: 8,
//   },

//   profileSub: {
//     color: "#FFC107",
//     fontSize: 14,
//     marginTop: 4,
//   },

//   profileSubSmall: {
//     color: "#aaa",
//     fontSize: 14,
//     marginTop: 2,
//   },

//   card: {
//     backgroundColor: "#1B263B",
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 12,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     elevation: 3,
//   },

//   cardContent: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//   },

//   cardText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "500",
//   },
// });

