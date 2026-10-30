
import { useNavigation } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import Toast from "react-native-toast-message";
import SwipeToConfirmModal from "./SwipeToConfirmModal";
import { Colors } from "@/constants/Colors";
import dayjs from "dayjs";

export default function AfterCheckInOut({
  currentShiftData,
  upcomingShiftData,
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.clockContainer}>
        <View
          style={{
            flexDirection: "row",
            position: "relative",

            alignItems: "center",
            // width: "100%",
            // justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: "#6C757D",
              textAlign: "left",
              flex: 1, // Take up available space on the left
            }}
          >
            Shift Ended{" "}
          </Text>
          <Text
            style={{
              position: "absolute",
              width: "100%",
              textAlign: "center",
              fontSize: 24,
              color: Colors.secondary.color,
              flex: 1,
            }}
          >
            {currentShiftData?.shiftInTpam?.label}
          </Text>

          {/* <View style={{ flex: 1 }} /> */}
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.time}>
            {currentShiftData?.startTime
              ? dayjs(currentShiftData?.startTime).format("HH:mm")
              : "--"}{" "}
            -{" "}
            {currentShiftData?.endTime
              ? dayjs(currentShiftData?.endTime).format("HH:mm")
              : "--"}
          </Text>
          <Text style={styles.date}>
            {" "}
            {currentShiftData?.endTime
              ? dayjs(currentShiftData?.endTime).format("MMM DD, YYYY - dddd")
              : "--"}
          </Text>
          <Text style={styles.date}>
            {currentShiftData?.checkpointInTpam?.name}
          </Text>
        </View>
      </View>

      <View
        style={{
          width: 2,
          height: 42,
          backgroundColor: "#e0e0e0",
          alignSelf: "center",
        }}
      />

      <View style={styles.clockContainer}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            position: "relative",
            // width: "100%",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              textAlign: "left",
              flex: 1,
            }}
          >
            Next Shift
          </Text>
          <Text
            style={{
              fontSize: 24,
              color: Colors.primary.color,
              textAlign: "center",
              flex: 1,
              position: "absolute",
              width: "100%",
            }}
          >
            {upcomingShiftData?.shiftInTpam?.label}
          </Text>
          {/* <View style={{ flex: 1 }} /> */}
        </View>

        {upcomingShiftData ? (
          <View style={{ alignItems: "center" }}>
            <Text style={styles.time}>
              {" "}
              {upcomingShiftData?.startTime
                ? dayjs(upcomingShiftData?.startTime).format("HH:mm")
                : "--"}{" "}
              -{" "}
              {upcomingShiftData?.endTime
                ? dayjs(upcomingShiftData?.endTime).format("HH:mm")
                : "--"}
            </Text>
            <Text style={styles.date}>
              {" "}
              {upcomingShiftData?.endTime
                ? dayjs(upcomingShiftData?.endTime).format(
                    "MMM DD, YYYY - dddd"
                  )
                : "--"}
            </Text>
            <Text style={styles.date}>
              {upcomingShiftData?.checkpointInTpam?.name}
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <Text style={{ fontSize: 16, color: "gray", textAlign: "center" }}>
              No Next Shift Available for Today
            </Text>
          </View>
        )}
      </View>

      {/* <View style={styles.punchStats}>
        <View style={styles.stat}>
          <MaterialCommunityIcons
            name="clock-time-four-outline"
            size={24}
            color={Colors.primary.textBlack}
          />
          <Text style={styles.statTime}>09:08 AM</Text>
          <Text style={styles.statLabel}>Punch In</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons
            name="clock-time-eight-outline"
            size={24}
            color={Colors.primary.textBlack}
          />
          <Text style={styles.statTime}>06:05 PM</Text>
          <Text style={styles.statLabel}>Punch Out</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons
            name="timer-sand-full"
            size={24}
            color={Colors.primary.textBlack}
          />
          <Text style={styles.statTime}>08:13</Text>
          <Text style={styles.statLabel}>Total Hours</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons
            name="map-marker"
            size={24}
            color={Colors.primary.textBlack}
            onPress={() => {
              navigation.navigate("location");
            }}
          />
          <Text style={styles.statTime}>Current</Text>
          <Text style={styles.statLabel}>Location</Text>
        </View>
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    flex: 1,
    gap: 16,
    // backgroundColor: "blue",

    // justifyContent: "space-between",
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
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    // alignItems: "center",
    // backgroundColor: "red",
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
    // marginTop:"auto" old message
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
});
