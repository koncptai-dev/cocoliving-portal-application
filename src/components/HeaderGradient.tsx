import React from 'react';
import { View, ImageBackground, Text, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// 375x263 image → ratio = 0.7013
const IMAGE_RATIO = 263 / 375;
const IMAGE_HEIGHT = width * IMAGE_RATIO;

type Props = {
  title: string;
};

const HeaderGradient: React.FC<Props> = ({ title }) => {
  return (
    <View style={[styles.container, { height: IMAGE_HEIGHT }]}>
      <ImageBackground
        source={require('../../assets/images/browseRoomsImage.png')}
        style={styles.image}
        resizeMode="cover"
      >
        <LinearGradient
  colors={[
    '#ECECEC',               // TOP light
    'rgba(236,236,236,0)',   // transparent
    'rgba(236,236,236,0)'    // fully transparent bottom
  ]}
  locations={[0, 0.3, 1]}  // first 30% light, rest fade
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  style={styles.gradientLayer}
/>

        <Text style={styles.title}>{title}</Text>
      </ImageBackground>
    </View>
  );
};

export default HeaderGradient;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textAlign:'center'
  },
});
