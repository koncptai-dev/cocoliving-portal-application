import React, { useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function TermsConditions() {
  const scrollRef = useRef(null);

  const goToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons name="chevron-back" size={26} color="#4C3D2A" />
        <Text style={styles.title}>Coco Living Terms & Conditions</Text>
      </View>

      {/* CONTENT */}
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <Text style={styles.paragraph}>
          Welcome to Coco Living! These Terms & Conditions (the “Agreement”) 
          govern your residency and use of services provided by (“Your Company 
          Legal Name / Coco Living” (“Coco Living,” “we,” “us,” or “our”) at the 
          premises located at [Insert Address/Location]. By completing your 
          booking, moving in, or residing at any Coco Living property, you agree 
          to be bound by these Terms & Conditions.
        </Text>

        {/* Section 1 */}
        <Text style={styles.heading}>1. Definitions</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Resident:</Text> Refers to the individual who has completed a booking and is 
          authorized to reside at a Coco Living property.{"\n"}
          <Text style={styles.bold}>Property:</Text> Refers to the specific Coco Living accommodation including 
          all common areas, facilities, and individual rooms.{"\n"}
          <Text style={styles.bold}>Room:</Text> Refers to the private or shared accommodation allocated to the 
          Resident.{"\n"}
          <Text style={styles.bold}>Services:</Text> Refers to all amenities, facilities, and privileges offered by 
          Coco Living including but not limited to accommodation, meals, utilities, 
          internet, security, and housekeeping.{"\n"}
          <Text style={styles.bold}>Resident Agreement / License Agreement:</Text> The separate document 
          defining specific terms between Coco Living and the Resident for their 
          individual room occupancy.
        </Text>

        {/* Section 2 */}
        <Text style={styles.heading}>2. Eligibility & Booking</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>2.1 Eligibility:</Text> Residents must be of legal age as per local laws.{"\n"}
          <Text style={styles.bold}>2.2 Booking:</Text> Bookings must be completed through Coco Living’s website, 
          application, or authorized representatives. Coco Living reserves the right 
          to accept or reject any booking based on availability and verification.{"\n"}
          <Text style={styles.bold}>2.3 Accuracy of Information:</Text> Residents must provide accurate 
          information. Any falsification may lead to immediate termination of the 
          Agreement.
        </Text>

        {/* Section 3 */}
        <Text style={styles.heading}>3. Fees, Payments, and Deposits</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>3.1 Rent:</Text> Rent is payable monthly/quarterly/hostile as per the booking 
          terms.{"\n"}
          <Text style={styles.bold}>3.2 Security Deposit:</Text> A refundable deposit is required at move-in.{"\n"}
          <Text style={styles.bold}>3.3 Utilities:</Text> Utilities charges may apply where specified.{"\n"}
          <Text style={styles.bold}>3.4 Refunds:</Text> Cancellation, refund, and deduction rules apply as per 
          the Resident Agreement.
        </Text>

        {/* Section 4 */}
        <Text style={styles.heading}>4. Residency & Move-In/Move-Out</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>4.1 Check-In/Check-Out:</Text> Must adhere to assigned timings.{"\n"}
          <Text style={styles.bold}>4.2 Room Condition:</Text> Rooms must be maintained in good condition.{"\n"}
          <Text style={styles.bold}>4.3 Damages:</Text> Residents are liable for any damages caused.
        </Text>

        {/* Section 5 */}
        <Text style={styles.heading}>5. Use of Property & Services</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>5.1 Compliance:</Text> Residents must follow House Rules.{"\n"}
          <Text style={styles.bold}>5.2 Common Areas:</Text> Use respectfully.{"\n"}
          <Text style={styles.bold}>5.3 Prohibited Activities:</Text> Smoking, alcohol, illegal substances, 
          vandalism, or any unsafe behavior is not allowed.
        </Text>

        {/* Section 6 */}
        <Text style={styles.heading}>6. Safety & Security</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>6.1 Access Control:</Text> Residents must use designated biometric or key 
          systems.{"\n"}
          <Text style={styles.bold}>6.2 CCTV:</Text> CCTV is installed for safety.{"\n"}
          <Text style={styles.bold}>6.3 Emergency Procedures:</Text> Follow all instructions.
        </Text>

        {/* Section 7 */}
        <Text style={styles.heading}>7. Management Rights</Text>
        <Text style={styles.paragraph}>
          Coco Living reserves full rights for inspections, repairs, replacement, 
          and safety compliance.
        </Text>

        {/* Section 8 */}
        <Text style={styles.heading}>8. Termination of Residency</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>8.1 Breach:</Text> Violation of this Agreement may lead to immediate 
          removal.{"\n"}
          <Text style={styles.bold}>8.2 Notice Period:</Text> Refer to the Resident Agreement.
        </Text>

        {/* Section 9 */}
        <Text style={styles.heading}>9. Disclaimer of Liability</Text>
        <Text style={styles.paragraph}>
          Coco Living shall not be liable for personal injury, loss, or damage to 
          property caused by negligence or force majeure events.
        </Text>

        {/* Section 10 */}
        <Text style={styles.heading}>10. Governing Law & Dispute Resolution</Text>
        <Text style={styles.paragraph}>
          This Agreement is governed by Indian law. Disputes shall be resolved 
          under Arbitration in Mumbai.
        </Text>

        {/* Section 11 */}
        <Text style={styles.heading}>11. Contact Information</Text>
        <Text style={styles.paragraph}>
          For queries related to Terms & Conditions, contact Coco Living 
          Management at:{"\n"}support@cocoliving.in
        </Text>

        {/* Go To Top Button */}
        <TouchableOpacity style={styles.topBtn} onPress={goToTop}>
          <Text style={styles.topText}>Go to Top</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* -------------------------------- STYLES -------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 18 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 15,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4C3D2A",
  },

  paragraph: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
    marginBottom: 12,
  },

  heading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4C3D2A",
    marginTop: 12,
    marginBottom: 5,
  },

  bold: {
    fontWeight: "700",
    color: "#4C3D2A",
  },

  topBtn: {
    backgroundColor: "#4C3D2A",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },

  topText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
