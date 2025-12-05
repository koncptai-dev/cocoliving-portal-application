import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const Events = () => {
  return (
  
      <View style={styles.box}>
        <Text style={styles.text}>Hello, Events</Text>
      </View>
  
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  box: {
    padding: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  text: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default Events;
