import React from "react";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const PaymentFailedScreen = ({ route, navigation }) => {
  const { transactionId, amount, failureReason } = route.params || {};
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          
          {/* Failed Icon */}
         <Ionicons
  name="close-circle"
  size={90}
  color="#E74C3C"
  style={{ marginTop: 30 }}
/>

          {/* Title */}
          <Text style={styles.title}>Payment Failed</Text>
          <Text style={styles.subtitle}>Your payment could not be completed. Please try again.</Text>

          {/* Payment Details */}
          <View style={styles.card}>
            <Row label="Amount" value={`₹ ${amount?.toLocaleString()}`} />
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

        <View style={styles.buttonContainer}>
        
        
        <TouchableOpacity
  style={styles.secondaryBtn}
  onPress={() => setShowContactModal(true)}
>
  <Text style={styles.secondaryBtnText}>Contact Support Team</Text>
  <Ionicons name="arrow-forward" size={20} color="#3C2A1E" />
</TouchableOpacity>
        
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("ProfileScreen")}
          >
            <Text style={styles.secondaryBtnText}>Go to My Profile</Text>
            <Ionicons name="arrow-forward" size={20} color="#3C2A1E" />
          </TouchableOpacity>
        
        </View>
        </View>

        {/* <TouchableOpacity onPress={()=>navigation.navigate("Support")}>
                 <Text style={styles.helpText}>
                 Need help? <Text style={{ fontFamily:'Quicksand-Bold' }}>Contact support</Text>
               </Text>
               </TouchableOpacity> */}
      </ScrollView>
      <Modal
  visible={showContactModal}
  transparent
  animationType="fade"
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      
      {/* Cross Icon */}
      <TouchableOpacity
        style={styles.closeIcon}
        onPress={() => setShowContactModal(false)}
      >
        <Ionicons name="close" size={22} color="#000" />
      </TouchableOpacity>

      <Text style={styles.footerHeading}>Contact Info</Text>
      <Text style={styles.footerText}>+91-8141676967</Text>
      <Text style={styles.footerText}>info@cocoliving.in</Text>

    </View>
  </View>
</Modal>
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
  content: { alignItems: "center" ,  },
  title: { fontSize: 24, fontFamily:'Quicksand-Bold', color: "#4f3421", marginTop: 20 },
  subtitle: { fontSize: 14, color: "#8c8c8c",fontFamily:'Quicksand-Regular', marginBottom: 20 },
  card: {
    width: "100%",
    backgroundColor: "#FFF",
    // borderRadius: 12,
    elevation:6,
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
  label: { color: "#000000", fontSize: 14,fontFamily:'Quicksand-Regular' },
  value: { fontSize: 14, fontFamily:'Quicksand-Bold', color: "#000000" },
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
    backgroundColor: "#f6a452",
    width: "100%",
    borderRadius: 10,
    padding: 16,
    marginTop: 30,
  },
  primaryBtnText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 20,
   fontFamily:'Quicksand-Bold'
  },
  secondaryBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // backgroundColor: "#F7F4F0",
    width: "100%",
    borderRadius: 10,
    padding: 5,
    marginTop: 12,
  },
   secondaryBtnText: { fontSize: 15, fontFamily:'Quicksand-Medium', color: "#3C2A1E" },
   helpText: { textAlign: "center", paddingVertical: 25, color: "#7D6C54",fontFamily:'Quicksand-Medium' },
    buttonContainer: {
  width: "100%",
  marginTop: 25,
  backgroundColor: "#ede7df",
  borderRadius: 14,
  padding: 14,

  // Android
  elevation: 6,

  // iOS
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
},


modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
},

modalBox: {
  width: "80%",
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 20,
  alignItems: "center",
},

closeIcon: {
  position: "absolute",
  top: 10,
  right: 10,
},

footerHeading: {
  fontSize: 18,
  fontFamily: "Quicksand-Bold",
  marginBottom: 10,
  color: "#3C2A1E",
},

footerText: {
  fontSize: 14,
  fontFamily: "Quicksand-Medium",
  color: "#7D6C54",
  marginTop: 5,
},
});
