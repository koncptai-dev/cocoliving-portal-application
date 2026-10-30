import React, { useState } from "react";
import { View, Text, StyleSheet, Image, Pressable, Modal } from "react-native";
import {
  Languages,
  LogOut,
  House,
  LayoutGrid,
  CalendarDays,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
// import {
//   GestureHandlerRootView,
//   PanGestureHandler,
// } from "react-native-gesture-handler";
import SwipeToConfirmModal from "@/components/checkin/SwipeToConfirmModal";
import { useNavigation } from "expo-router";
import Toast from "react-native-toast-message";
import { toggleLanguage } from "@/utils/translation";
import { useTranslation } from "react-i18next";
import BeforeCheckInOut from "@/components/checkin/BeforeCheckInOut";
import AfterCheckInOut from "@/components/checkin/AfterCheckInOut";

export default function CheckInScreen() {
  const [activeTab, setActiveTab] = useState("home"); // State to track the active tab
  const [isShiftCompleted, setIsShiftCompleted] = useState(false);
  const [hasPunchedIn, setHasPunchedIn] = useState(false);
  const [hasPunchedOut, setHasPunchedOut] = useState(false);
  const [showSwipeModal, setShowSwipeModal] = useState(false);
  const [timer, setTimer] = useState(40); //in percentage
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleSwipeSuccess = (state) => {
    setShowSwipeModal(false);
    // Add your punch-in logic here
    // console.log("Punch in successful!");
    if (state === "punch-in") {
      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Punched in successfully.",
      });
      setHasPunchedIn(true);
    } else if (state === "punch-out") {
      setHasPunchedOut(true);
      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Punched out successfully.",
      });
    }
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          {/* <Image
            source={require("@/assets/images/default-avatar.png")}
            style={styles.avatar}
          /> */}
          <View>
            <Text style={styles.name}>RAJESH BHAI</Text>
            <Text style={styles.id}>MZ001234</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => {
              toggleLanguage();
            }}
          >
           <Languages
  size={24}
  color="#4787FF"
  strokeWidth={2.2}
/>
          </Pressable>
        <LogOut
  size={24}
  color="#CA282C"
  strokeWidth={2.2}
/>
        </View>
      </View>

      {isShiftCompleted ? (
        <AfterCheckInOut />
      ) : (
        <BeforeCheckInOut setIsShiftCompleted={setIsShiftCompleted} />
      )}
      {/* Bottom Tab */}
      <View style={styles.bottomTab}>
        <Pressable
          style={[
            styles.tab,
            activeTab === "home" && {
              backgroundColor: Colors.secondary.background,
            },
          ]}
          onPress={() => setActiveTab("home")} // Set active tab to "home"
        >
       <House
  size={18}
  color={activeTab === "home"
    ? Colors.primary.yellowColor
    : "white"}
  strokeWidth={2.2}
/>
          {activeTab === "home" && (
            <Text
              style={[
                styles.tabText,
                activeTab === "home" && {
                  color: "white",
                },
              ]}
            >
              Home
            </Text>
          )}
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === "apps" && {
              backgroundColor: Colors.secondary.background,
            },
          ]}
          onPress={() => setActiveTab("apps")} // Set active tab to "apps"
        >
          <LayoutGrid
  size={18}
  color={activeTab === "apps"
    ? Colors.primary.yellowColor
    : "white"}
  strokeWidth={2.2}
/>
          {activeTab === "apps" && (
            <Text
              style={[
                styles.tabText,
                activeTab === "apps" && {
                  color: "white",
                },
              ]}
            >
              Dashboard
            </Text>
          )}
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === "calendar" && {
              backgroundColor: Colors.secondary.background,
            },
          ]}
          onPress={() => setActiveTab("calendar")} // Set active tab to "calendar"
        >
          <CalendarDays
  size={18}
  color={
    activeTab === "calendar"
      ? Colors.primary.yellowColor
      : "white"
  }
  strokeWidth={2.2}
/>
          {activeTab === "calendar" && (
            <Text
              style={[
                styles.tabText,
                activeTab === "calendar" && {
                  color: "white",
                },
              ]}
            >
              Calendar
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  id: {
    fontSize: 12,
    color: "#888",
  },
  clockContainer: {
    alignItems: "center",
  },
  time: {
    fontSize: 32,
    fontWeight: "light",
    color: Colors.primary.textBlack,
    marginTop: 16,
  },
  date: {
    color: "#666",
    marginTop: 8,
  },
  outermostPunchinContainer: {
    // backgroundColor: "red",
  },
  punchContainer: {
    alignItems: "center",
  },
  punchButton: {
    marginTop: "auto",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#fff",
    // borderWidth: 4,
    // borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  punchButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9, // Reduce opacity when pressed
  },
  punchImage: {
    width: 34,
    height: 52,
    resizeMode: "contain",
  },
  punchText: {
    marginTop: 8,
    fontWeight: "bold",
    color: "#444",
  },
  punchStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
    // marginTop:"auto"
  },
  stat: {
    alignItems: "center",
  },
  statTime: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#555",
  },
  bottomTab: {
    backgroundColor: "#0c1f79",
    padding: 12,
    borderRadius: 50,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tab: {
    alignItems: "center",
    flexDirection: "row",
    // backgroundColor: Colors.secondary.background,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingBlock: 6,
    gap: 4,
  },
  tabText: {
    // marginTop: 4,
    fontSize: 13,
    color: Colors.primary.yellowColor,
    fontWeight: "bold",
  },
  // modalOverlay: {
  //   flex: 1,
  //   backgroundColor: "rgba(0, 0, 0, 0.4)",
  //   justifyContent: "flex-end",
  // },
  // swipeContainer: {
  //   backgroundColor: "white",
  //   borderTopLeftRadius: 24,
  //   borderTopRightRadius: 24,
  //   padding: 24,
  // },
  // swipeTrack: {
  //   backgroundColor: "#001899",
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "flex-start",
  //   borderRadius: 50,
  //   padding: 12,
  // },
  // swipeButton: {
  //   backgroundColor: "white",
  //   padding: 12,
  //   borderRadius: "100%",
  //   marginRight: 16,
  // },
  // swipeArrow: {
  //   fontSize: 18,
  //   fontWeight: "bold",
  //   color: "#001899",
  // },
  // swipeText: {
  //   color: "white",
  //   fontWeight: "bold",
  //   fontSize: 16,
  // },
});
