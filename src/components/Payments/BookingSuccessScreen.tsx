import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function PaymentSuccessScreen({ route, navigation }) {
  const {
    amountPaid = 0,
    transactionId = "",
  } = route?.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Payment Successful</Text>
{/* 
      <Text style={styles.info}>Amount Paid: ₹ {amountPaid.toLocaleString()}</Text>
      <Text style={styles.info}>Transaction ID: {transactionId}</Text> */}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.btnText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", color: "#2ecc71", marginBottom: 20 },
  info: { fontSize: 16, marginVertical: 4, color: "#333" },
  button: {
    marginTop: 30,
    backgroundColor: "#2ecc71",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  btnText: { color: "white", fontSize: 16, fontWeight: "600" },
});
