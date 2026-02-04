import React from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from "react-native";
import Video from "react-native-video";

const { height, width } = Dimensions.get("window");

const VideoSplash = ({ onFinish }) => {
  return (
    <View style={styles.container}>
      <Video
        source={require("../../assets/images/cocoFinalSplash.mp4")}
        style={styles.video}
        resizeMode="cover"
        onEnd={onFinish}        // video end → next screen
        muted={false}
        repeat={false}
        ignoreSilentSwitch="obey"
      />

      {/* 🔹 SKIP BUTTON */}
      <TouchableOpacity style={styles.skipBtn} onPress={onFinish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  video: {
    width: "100%",
    height: "100%",
    alignSelf: "center",
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

export default VideoSplash;
