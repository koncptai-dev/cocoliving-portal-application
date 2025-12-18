import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Video from 'react-native-video';

const { height, width } = Dimensions.get('window');

const VideoSplash = ({ onFinish }) => {
  return (
    <View style={styles.container}>
      <Video
        source={require('../../assets/images/cocoFinalSplash.mp4')} // your client video
        style={styles.video}
        resizeMode="cover"
        onEnd={onFinish}        // when video finishes → go to next screen
        muted={false}          // sound ON (if you want silent → use true)
        repeat={false}         // play only once
        ignoreSilentSwitch="obey"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height: '100%',
  alignSelf: 'center'
  },
});

export default VideoSplash;
