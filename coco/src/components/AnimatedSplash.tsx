import React, { useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Text, StatusBar } from "react-native";
import Video from "react-native-video";

const VideoSplash = ({ onFinish }) => {
  const finishedRef = useRef(false);

  const safeFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish?.();
  };

  return (
    <View style={styles.overlay}>
      <StatusBar hidden />

      <Video
        source={require("../../assets/images/cocoFinalSplash.mp4")}
        style={styles.video}
        resizeMode="cover"
        repeat={false}
        muted={false}
        onEnd={safeFinish}
        onError={safeFinish}
      />

      <TouchableOpacity style={styles.skipBtn} onPress={safeFinish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
};

export default VideoSplash;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject, // 🔥 important
    backgroundColor: "black",
    zIndex: 999,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  skipBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});