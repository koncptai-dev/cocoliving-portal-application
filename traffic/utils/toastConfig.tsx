import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BaseToastProps } from "react-native-toast-message";

const toastConfig = {
  success: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.toastContainer, styles.successContainer]}>
      {!!text1 && <Text style={[styles.text, styles.successText]}>{text1}</Text>}
      {!!text2 && <Text style={styles.text}>{text2}</Text>}
    </View>
  ),

  error: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.toastContainer, styles.errorContainer]}>
      {!!text1 && <Text style={[styles.text, styles.errorText]}>{text1}</Text>}
      {!!text2 && <Text style={styles.text}>{text2}</Text>}
    </View>
  ),

  delete: ({ text1, text2 }: BaseToastProps) => (
    <View style={[styles.toastContainer, styles.deleteContainer]}>
      {!!text1 && <Text style={[styles.text, styles.deleteText]}>{text1}</Text>}
      {!!text2 && <Text style={styles.text}>{text2}</Text>}
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    width: "90%",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
  },
  successContainer: {
    backgroundColor: "#ECFDF3",
  },
  successText: {
    color: "#067647",
  },
  errorContainer: {
    backgroundColor: "#FEF3F2",
  },
  errorText: {
    color: "#D92D20",
  },
  deleteContainer: {
    backgroundColor: "#FFF1F3",
  },
  deleteText: {
    color: "#D92D20",
  },
});

export default toastConfig;
