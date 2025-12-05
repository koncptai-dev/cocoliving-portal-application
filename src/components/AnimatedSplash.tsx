import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing, Dimensions } from 'react-native';
import colors from '../constants/color'; // Assuming colors are defined here

const { height, width } = Dimensions.get('window');
const TARGET_SCALE = Math.max(height, width) / 100; // Target scale to fill the screen

const AnimatedSplash = ({ onFinish }) => {
  // === Text Animation Values (Keep these the same) ===
  const textLetters = 'Coco-living'.split('');
  const letterAnimations = useRef(textLetters.map(() => new Animated.Value(0))).current;

  // === Logo Animation Values (New/Modified) ===
  const logoInitialScale = useRef(new Animated.Value(0.1)).current; // Start very small
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoZoomOut = useRef(new Animated.Value(1)).current; // New value for the exit animation

  useEffect(() => {
    // --- PART 1: Initial Logo & Text Entry ---
    const initialEntry = Animated.parallel([
      // Logo scales up and fades in
      Animated.timing(logoInitialScale, {
        toValue: 1, // Scale to normal size
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1, // Fade in
        duration: 800,
        useNativeDriver: true,
      }),
      // Text Staggered Entry (Same as before)
      Animated.stagger(
        80,
        letterAnimations.map((anim, index) =>
          Animated.sequence([
            Animated.delay(index * 50),
            Animated.spring(anim, {
              toValue: 1,
              friction: 5,
              tension: 80,
              useNativeDriver: true,
            }),
            Animated.delay(20)
          ])
        )
      )
    ]);

    // --- PART 2: Transition/Exit Animation ---
    const exitTransition = Animated.parallel([
        // 1. Logo aggressively scales up to fill the screen
        Animated.timing(logoZoomOut, {
            toValue: TARGET_SCALE * 2, // Scales up significantly (e.g., from 1 to 20)
            duration: 500,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
        }),
        // 2. Text fades out quickly
        Animated.timing(logoOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }),
        // 3. Letters fall down and fade out
        Animated.stagger(
            50, 
            textLetters.map((_, index) => 
                Animated.timing(letterAnimations[index], {
                    toValue: -0.5, // Animate letter value to negative to trigger exit transform
                    duration: 400,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                })
            )
        )
    ]);
    

    // --- FINAL SEQUENCE ---
    Animated.sequence([
      initialEntry,       // Step 1: Logo and Text fly in
      Animated.delay(1000), // Wait for 1 second to view the final splash state
      exitTransition,     // Step 2: Aggressive zoom-in transition
    ]).start(() => {
      // Step 3: When animation is complete, transition to the next screen
      onFinish();
    });

  }, []);

  // Text Interpolation Logic (Must be inside the component)
  const renderText = () => {
    return (
      <View style={styles.textContainer}>
        {textLetters.map((char, index) => {
          const letterAnim = letterAnimations[index];
          
          // Interpolate based on letterAnim (0 to 1 for entry, 1 to -0.5 for exit)
          const translateY = letterAnim.interpolate({
            inputRange: [-0.5, 0, 1],
            outputRange: [100, 50, 0], // Fall down 100px on exit, start 50px below, land at 0
          });
          const opacity = letterAnim.interpolate({
            inputRange: [-0.5, 0, 1],
            outputRange: [0, 0, 1], // Fade out on exit
          });
          const scale = letterAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.8, 1.1, 1], // Small entry bounce
          });
          const colorAnim = letterAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [colors.primary, colors.accent, '#fff'],
          });

        return (
            <Animated.Text
              key={index}
              style={[
                styles.textLetter,
                {
                  opacity: opacity,
                  transform: [{ translateY: translateY }, { scale: scale }],
                  color: colorAnim,
                },
              ]}
            >
              {char === '-' ? ' ' : char}
            </Animated.Text>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/images/color.png')} // Your logo image
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [
              { scale: logoInitialScale }, // Initial scale-up
              { scale: logoZoomOut }    // Exit scale-out
            ],
          },
        ]}
        resizeMode="contain"
      />
      {renderText()}
    </View>
  );
};

// ... (Styles from before, modified for bigger text/logo)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textDark, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    // Note: logoZoomOut and logoInitialScale are merged by RN into a single 'scale' property
  },
  textContainer: {
    flexDirection: 'row',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textLetter: {
    fontSize: 42,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
});

export default AnimatedSplash;