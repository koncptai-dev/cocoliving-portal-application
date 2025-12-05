import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../constants/color';

const { height } = Dimensions.get('window');

// NOTE: Please ensure these image paths are correct in your project
const Logo = require('../../assets/images/logo.png');
const BannerImage = require('../../assets/images/login_banner.jpg');

const AuthHeader = () => {
  return (
 <View style={styles.headerImageContainer}>
  <Image source={BannerImage} style={styles.headerImage} resizeMode="cover" />
  <View style={styles.logoOverlay}>
    <Image source={Logo} style={styles.logo} resizeMode="contain" />
  </View>
  <LinearGradient
    colors={['rgba(255,255,255,0)', '#fff', '#fff']}
    locations={[0.4, 0.93, 1]}
    start={{x: 0.5, y: 0}}
    end={{x: 0.5, y: 1}}
    style={StyleSheet.absoluteFill}
  />
      
      {/* Logo Overlay */}
      <View style={styles.logoOverlay}>
        <Image 
          source={Logo} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerImageContainer: {
    width: '100%',
    height: height * 0.40, // Consistent height for all auth screens
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  logoOverlay: {
    position: 'absolute',
    top: '65%', // Positioned to overlap the form content below
    left: '50%',
    transform: [{translateX: -60}, {translateY: -50}], 
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 100,
  },
});

export default AuthHeader;
