import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

export default function CommunityRules() {
  const scrollRef = useRef(null);
  const navigation = useNavigation();
  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#4C3D2A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Our House Rules</Text>

        <View style={{ width: 28 }} /> 
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        {/* TEMP LOGO */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/images/cocoLogo.png')} // TEMP LOGO (replace later)
            style={styles.logo}
          />
        </View>

        {/* INTRO TEXT */}
        <Text style={styles.intro}>
          At Coco Living, we’re dedicated to providing a premium living environment.
          These house rules outline the shared responsibilities that help us maintain
          our high standards of comfort, safety, and community for all residents.
        </Text>

        {/* RULE SECTIONS */}
        <Text style={styles.sectionTitle}>General Conduct & Respect</Text>

        <RuleItem
          title="Respect Quiet Hours:"
          text="Maintain a peaceful environment, especially during designated quiet hours (e.g., 10:00 PM to 8:00 AM), to ensure everyone can rest and study undisturbed."
        />

        <RuleItem
          title="Be Considerate of Others:"
          text="Respect your fellow residents’ space, belongings, and privacy. Keep noise levels down in common areas and avoid disturbing others."
        />

        <RuleItem
          title="No Smoking/Vaping:"
          text="Smoking or vaping is strictly prohibited anywhere on the Coco Living premises, including private rooms, common areas, and outdoor spaces."
        />

        <RuleItem
          title="No Illicit Substances:"
          text="The possession or consumption of illegal drugs is strictly forbidden on the property."
        />

        <RuleItem
          title="No Alcohol Consumption:"
          text="Alcohol consumption is strictly banned. Disorderly conduct will not be tolerated."
        />

        <RuleItem
          title="Guest Policy:"
          text="All guests must be registered at the reception. Guests are not permitted to stay overnight without prior approval and may be subject to a guest fee."
        />

        {/* CLEANLINESS */}
        <Text style={styles.sectionTitle}>Cleanliness & Maintenance</Text>

        <RuleItem
          title="Maintain Cleanliness:"
          text="Keep your private room tidy and clean. Promptly clean up after yourself in all common areas, especially kitchens, dining areas, and bathrooms."
        />
        <RuleItem
          title="Waste Management:"
          text="Dispose of waste properly in designated bins. Segregate waste according to recycling guidelines where applicable."
        />
        <RuleItem
          title="Reporting Damages:"
          text="Report any damages, malfunctions, or maintenance issues promptly to management."
        />

        {/* SAFETY */}
        <Text style={styles.sectionTitle}>Safety & Security</Text>

        <RuleItem
          title="Secure Access:"
          text="Always use your designated biometric or keyless entry for access. Do not share your access credentials with anyone."
        />
        <RuleItem
          title="Visitor Policy:"
          text="Do not allow unknown individuals into the building. All visitors must be checked in at reception."
        />

        <RuleItem
          title="Fire Safety:"
          text="Familiarize yourself with fire escape routes and emergency procedures. Do not tamper with fire safety equipment."
        />

        <RuleItem
          title="Appliance Use:"
          text="Use electrical appliances responsibly and follow safety guidelines. Avoid overloading sockets."
        />

        {/* COMMON AREAS */}
        <Text style={styles.sectionTitle}>Common Area Usage</Text>

        <RuleItem
          title="Shared Facilities:"
          text="Use common areas and facilities respectfully. Follow posted rules for gyms, lounges, and study rooms."
        />

        <RuleItem
          title="Kitchen Usage:"
          text="Clean utensils and dishes immediately after use. Do not store personal items in shared spaces."
        />

        {/* ADMIN */}
        <Text style={styles.sectionTitle}>Administration & Compliance</Text>

        <RuleItem
          title="Abide by Management Directives:"
          text="Residents must follow all rules and instructions issued by Coco Living management."
        />

        <RuleItem
          title="Review Agreement:"
          text="Familiarize yourself with your Resident Agreement and all terms & conditions outlined within."
        />

        {/* GO TO TOP BUTTON */}
        <TouchableOpacity style={styles.topButton} onPress={scrollToTop}>
          <Text style={styles.topButtonText}>Go to Top</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* REUSABLE RULE ITEM COMPONENT */
const RuleItem = ({ title, text }) => (
  <Text style={styles.ruleItem}>
    <Text style={styles.ruleTitle}>{title} </Text>
    <Text style={styles.ruleText}>{text}</Text>
  </Text>
);

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    gap:20,
    marginTop:20,

  },
  headerTitle: {
    fontSize: 25,
    fontFamily:'Quicksand-Bold',
    color: "#4C3D2A",
  },

  /* LOGO */
  logoWrapper: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  logo: {
    width: 120,
    height: 60,
    resizeMode: "contain",
  },

  intro: {
    color: "#4C3D2A",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4C3D2A",
    marginTop: 20,
    marginBottom: 10,
  },

  ruleItem: {
    marginBottom: 12,
    color: "#4C3D2A",
    fontSize: 14,
    lineHeight: 20,
  },
  ruleTitle: {
    fontWeight: "700",
    color: "#4C3D2A",
  },
  ruleText: {
    color: "#4C3D2A",
    fontWeight: "400",
  },

  /* GO TO TOP BUTTON */
  topButton: {
    backgroundColor: "#4C3D2A",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 25,
  },
  topButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
