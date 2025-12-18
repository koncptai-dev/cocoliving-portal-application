import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const PaymentFailedScreen = ({ route, navigation }) => {
  const { transactionId, amount, failureReason } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          
          {/* Failed Icon */}
          <Ionicons name="close-circle" size={90} color="#E74C3C" />

          {/* Title */}
          <Text style={styles.title}>Payment Failed</Text>
          <Text style={styles.subtitle}>We couldn’t process your payment</Text>

          {/* Payment Details */}
          <View style={styles.card}>
            <Row label="Amount" value={`₹ ${amount?.toLocaleString()}`} />
            <Row label="Transaction ID" value={transactionId} />
            <Row
              label="Status"
              value="FAILED"
              highlight
              highlightColor="#E74C3C"
            />
          </View>

          {/* Failure Reason */}
          {failureReason && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonText}>{failureReason}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.secondaryBtnText}>Go to Home</Text>
            <Ionicons name="arrow-forward" size={20} color="#3C2A1E" />
          </TouchableOpacity>
        </View>

        <Text style={styles.helpText}>
          Need help? <Text style={{ fontWeight: "bold" }}>Contact support</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const Row = ({ label, value, highlight, highlightColor }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text
      style={[
        styles.value,
        highlight && { color: highlightColor || "#E74C3C", fontWeight: "800" },
      ]}
    >
      {value}
    </Text>
  </View>
);

export default PaymentFailedScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1, padding: 22 },
  content: { alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#3C2A1E", marginTop: 20 },
  subtitle: {
    fontSize: 14,
    color: "#7D6C54",
    marginBottom: 20,
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#F6EFE6",
    borderRadius: 12,
    padding: 15,
    marginTop: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "#E5D8C3",
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  label: { color: "#3C2A1E", fontSize: 14 },
  value: { fontSize: 14, fontWeight: "700", color: "#3C2A1E" },
  reasonBox: {
    backgroundColor: "#FDEDEC",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    marginTop: 20,
  },
  reasonText: {
    textAlign: "center",
    color: "#943126",
    fontSize: 13,
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#E74C3C",
    width: "100%",
    borderRadius: 10,
    padding: 16,
    marginTop: 30,
  },
  primaryBtnText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F4F0",
    width: "100%",
    borderRadius: 10,
    padding: 15,
    marginTop: 12,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3C2A1E",
  },
  helpText: {
    textAlign: "center",
    paddingVertical: 25,
    color: "#7D6C54",
    fontSize: 14,
  },
});
