import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function PaymentFailedScreen({ route, navigation }) {
  const { reason = "Payment Failed" } = route?.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>❌ Payment Failed</Text>

      <Text style={styles.info}>{reason}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.btnText}>Try Again Later</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", color: "#e74c3c", marginBottom: 20 },
  info: { fontSize: 16, marginVertical: 4, color: "#333", textAlign: "center" },
  button: {
    marginTop: 30,
    backgroundColor: "#e74c3c",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  btnText: { color: "white", fontSize: 16, fontWeight: "600" },
});
