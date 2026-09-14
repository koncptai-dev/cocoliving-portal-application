import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeButton from './HomeButton';

const FloatingHomeWrapper = ({ children }: any) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      {children}

      <View
        style={[
          styles.floating,
          { top: insets.top + 10 },
        ]}
      >
        <HomeButton color="#000" />
      </View>
    </View>
  );
};

export default FloatingHomeWrapper;

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    right: 15,
    zIndex: 999,
  },
});
