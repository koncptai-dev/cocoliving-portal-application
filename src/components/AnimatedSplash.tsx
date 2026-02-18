import React, { useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
} from "react-native";
import Video from "react-native-video";

const VideoSplash = ({ onFinish }) => {
  const finishedRef = useRef(false);

  const safeFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish?.();
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Video
        source={require("../../assets/images/cocoFinalSplash.mp4")}
        style={styles.video}
        resizeMode="cover"
        paused={false}
        repeat={false}
        muted={false}
        ignoreSilentSwitch="ignore"
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
  container: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "black",
  },
  video: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
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


// import React, { useRef, useState } from "react";
// import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from "react-native";
// import Video from "react-native-video";

// const { height, width } = Dimensions.get("window");

// const VideoSplash = ({ onFinish }) => {
//   const finishedRef = useRef(false);
//   const [videoLoaded, setVideoLoaded] = useState(false);

//   const safeFinish = () => {
//     if (finishedRef.current) return;
//     finishedRef.current = true;
//     onFinish();
//   };

//   return (
//     <View style={styles.container}>
//       <Video
//         source={require("../../assets/images/cocoFinalSplash.mp4")}
//         style={styles.video}
//         resizeMode="cover"
//         muted={false}
//         repeat={false}
//         ignoreSilentSwitch="obey"

//         onLoad={() => {
//           setVideoLoaded(true);
//         }}

//         onEnd={() => {
//           // small delay ensures full playback
//           setTimeout(safeFinish, 300);
//         }}
//       />

//       {/* Skip Button */}
//       <TouchableOpacity style={styles.skipBtn} onPress={safeFinish}>
//         <Text style={styles.skipText}>Skip</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// // import React from "react";
// // import {
// //   View,
// //   StyleSheet,
// //   Dimensions,
// //   TouchableOpacity,
// //   Text,
// // } from "react-native";
// // import Video from "react-native-video";

// // const { height, width } = Dimensions.get("window");

// // const VideoSplash = ({ onFinish }) => {
// //   return (
// //     <View style={styles.container}>
// //       <Video
// //         source={require("../../assets/images/cocoFinalSplash.mp4")}
// //         style={styles.video}
// //         resizeMode="cover"
// //         onEnd={onFinish}        // video end → next screen
// //         muted={false}
// //         repeat={false}
// //         ignoreSilentSwitch="obey"
// //       />

// //       {/* 🔹 SKIP BUTTON */}
// //       <TouchableOpacity style={styles.skipBtn} onPress={onFinish}>
// //         <Text style={styles.skipText}>Skip</Text>
// //       </TouchableOpacity>
// //     </View>
// //   );
// // };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "black",
//   },
//   video: {
//     width: "100%",
//     height: "100%",
//     alignSelf: "center",
//   },
//   skipBtn: {
//     position: "absolute",
//     top: 50,
//     right: 20,
//     backgroundColor: "rgba(0,0,0,0.6)",
//     paddingHorizontal: 16,
//     paddingVertical: 6,
//     borderRadius: 20,
//   },
//   skipText: {
//     color: "#fff",
//     fontSize: 14,
//     fontWeight: "600",
//   },
// });

// export default VideoSplash;

// // import React from 'react';
// // import { View, StyleSheet, Dimensions } from 'react-native';
// // import Video from 'react-native-video';

// // const { height, width } = Dimensions.get('window');

// // const VideoSplash = ({ onFinish }) => {
// //   return (
// //     <View style={styles.container}>
// //       <Video
// //         source={require('../../assets/images/cocoFinalSplash.mp4')} // your client video
// //         style={styles.video}
// //         resizeMode="cover"
// //         onEnd={onFinish}        // when video finishes → go to next screen
// //         muted={false}          // sound ON (if you want silent → use true)
// //         repeat={false}         // play only once
// //         ignoreSilentSwitch="obey"
// //       />
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: 'black',
// //   },
// //   video: {
// //     width: '100%',
// //     height: '100%',
// //   alignSelf: 'center'
// //   },
// // });

// // export default VideoSplash;
