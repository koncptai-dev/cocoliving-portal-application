import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Linking } from "react-native";

const AboutUsScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Curved Brown Header */}
           <View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Ionicons name="chevron-back" size={26} color="#4C3D2A" />
  </TouchableOpacity>

  <Text style={styles.headerTitle}>About Us</Text>
</View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Intro Card */}
        <View style={styles.whiteCard}>
          <Text style={styles.quote}>
            We searched for the ideal.{"\n"}
            When we couldn’t find it, we built it.
          </Text>

          <Image
            source={require("../../assets/images/a1.png")}
            style={styles.mainImage}
          />

          <Text style={styles.bodyText}>
            We founded Coco Living with a single purpose to redefine urban
            co-living. We believe your home should be a launchpad for your
            life, not a limitation.
          </Text>

          <Text style={styles.bodyText}>
            Our vision is to combine premium comfort, seamless technology,
            and genuine community into an effortless living experience
            tailored for the modern, dynamic resident.
          </Text>
        </View>

        {/* Commitment Beige Card */}
        <View style={styles.beigeCard}>
          <Text style={styles.commitmentTitle}>Our Commitment.</Text>
          <Text style={styles.commitmentSub}>
            It’s our signature{"\n"}style.
          </Text>

          <Text style={styles.commitmentText}>
            This commitment to effortless living drives Coco Living. We
            integrate intelligent design and cutting-edge solutions into
            every space we manage.
          </Text>

          <Text style={styles.commitmentText}>
            Our mission is to strip away stress, giving you back your
            precious time and empowering you to live your best, most
            focused life.
          </Text>
        </View>

        {/* Reimagining */}
        <View style={styles.whiteCard}>
          <Text style={styles.sectionTitle}>
            Reimagining Urban Living Where
          </Text>
          <Text style={styles.sectionSubTitle}>
            Convenience Meets Innovation.
          </Text>

          <Image
            source={require("../../assets/images/a2.png")}
            style={styles.mainImage}
          />

          <Text style={styles.bodyText}>
            We questioned why urban living often came with so much
            hassle—endless logistics, forgotten details, and time wasted
            on mundane tasks.
          </Text>

          <Text style={styles.bodyText}>
            We envisioned a smarter, more seamless experience where your
            home life simply worked.
          </Text>
        </View>

        {/* Modern Comfort */}
        <View style={styles.whiteCard}>
          <Text style={styles.sectionTitle}>
            Evoking Modern Comfort &
          </Text>
          <Text style={styles.sectionSubTitle}>
            Thoughtful Design
          </Text>

          <Image
            source={require("../../assets/images/a3.png")}
            style={styles.mainImage}
          />

          <Text style={styles.bodyText}>
            Step into a home designed with you in mind. At Coco Living,
            quality isn’t just a word — it’s woven into every detail.
          </Text>

          <Text style={styles.bodyText}>
            Expect premium furnishings, meticulously maintained spaces,
            and comfort that feels both luxurious and genuinely personal.
          </Text>
        </View>

        {/* Our Signature */}
<View style={styles.beigeCard}>
  <Text style={styles.signatureTitle}>Our Signature.</Text>
  <Text style={styles.signatureSub}>Your Sanctuary.</Text>

  <Text style={styles.bodyText}>
    Every Coco Living residence tells its own story. From sleek, urban
    high-rises to charming, revitalized spaces, no two properties are
    exactly alike. And that’s by design.
  </Text>

  <Text style={styles.bodyText}>
    We meticulously curate each building’s unique character, then
    seamlessly infuse it with our signature blend of modern aesthetics,
    intuitive functionality, and effortless comfort.
  </Text>

  <Text style={styles.bodyText}>
    The result? A home that’s distinctly Coco Living, yet perfectly
    unique to its own vibe and yours.
  </Text>
</View>

{/* Your Room */}
<View style={styles.whiteCard}>
  <Text style={styles.sectionTitle}>Your Room:</Text>
  <Text style={styles.sectionSubTitle}>Thoughtfully Spacious</Text>

  <Image
    source={require("../../assets/images/a4.png")}
    style={styles.mainImage}
  />

  <Text style={styles.bodyText}>
    Say goodbye to clutter, say hello to comfort. Your private sanctuary
    at Coco Living is more than just a room—it’s a thoughtfully designed
    space where every belonging finds its place.
  </Text>

  <Text style={styles.bodyText}>
    Beyond your door, an entire world of curated living awaits. From
    vibrant common lounges and dedicated focus zones to lively
    entertainment areas and elegant dining spaces.
  </Text>

  <Text style={styles.bodyText}>
    Your daily life expands. It’s integrated living, perfected.
  </Text>

  <Text style={styles.sectionSubTitle}>Your Home: Limitlessly Grand</Text>
</View>

{/* Quality */}
<View style={styles.beigeCard}>
  <Text style={styles.qualityTitle}>
    Quality that{"\n"}lives up to your{"\n"}life
  </Text>

  <Text style={styles.bodyText}>
    We know life happens. That’s why at Coco Living, quality isn’t just
    about aesthetics—it’s about reliability.
  </Text>

  <Text style={styles.bodyText}>
    You can take it for granted that your smart lighting will set the
    perfect mood for late-night study sessions, and our designer
    furnishings are built to comfortably support you.
  </Text>

  <Text style={styles.bodyText}>
    We’ve considered every detail so you don’t have to. But don’t just
    take our word for it. Experience it firsthand on your next visit.
  </Text>
</View>

{/* Footer */}
<View style={styles.footer}>
  <Text style={styles.footerLogo}>COCO LIVING</Text>

  <Text style={styles.footerText}>
    Creating affordable, stylish, and connected living environments for
    young professionals and students.
  </Text>

  <Text style={styles.footerHeading}>Contact Info</Text>
<Text
  style={styles.footerText}
  onPress={() => Linking.openURL('tel:+918141676967')}
>
  +91-8141676967
</Text>

<Text
  style={styles.footerText}
  onPress={() => Linking.openURL('mailto:info@cocoliving.in')}
>
  info@cocoliving.in
</Text>

  <Text style={styles.footerHeading}>Policy</Text>
<Text
  style={styles.footerText}
  onPress={() => Linking.openURL('https://www.cocoliving.in/privacy-policy')}
>
  Privacy Policy
</Text>

<Text
  style={styles.footerText}
  onPress={() => Linking.openURL('https://www.cocoliving.in/terms-and-conditions')}
>
  Terms & Conditions
</Text>

<Text
  style={styles.footerText}
  onPress={() => Linking.openURL('https://www.cocoliving.in/refund-and-cancellation')}
>
  Refund & Cancellation Policy
</Text>

 <Text style={styles.footerCopyright}>
  © {new Date().getFullYear()} COCO LIVING. All rights reserved.
</Text>
</View>

      </ScrollView>
    </View>
  );
};

export default AboutUsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F2EF",
  },

 header: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 18,
  paddingHorizontal: 20,
  gap: 20,        // 🔥 space between back & title
  marginTop: 20,
},

  headerTitle: {
  fontSize: 25,
  fontFamily: "Quicksand-Bold",
  color: "#4C3D2A",
},

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  whiteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
  },

  beigeCard: {
    backgroundColor: "#E9E3DA",
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
  },

  quote: {
    fontSize: 16,
    fontFamily:'Quicksand-Bold',
    textAlign: "center",
    color: "#5C4435",
    marginBottom: 14,
  },

  mainImage: {
    width: "100%",
    height: 200,
    borderRadius: 25,
    marginVertical: 14,
  },

  bodyText: {
    fontSize: 16,
    fontFamily:'Quicksand-Regular',
    lineHeight: 22,
    color: "#5F5F5F",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 19,
    fontFamily:'Quicksand-Bold',
    color: "#4f3421",
    marginHorizontal:'auto'
  },

  sectionSubTitle: {
    fontSize: 19,
   fontFamily:'Quicksand-Bold',
    color: "#ac9478",
    marginBottom: 12,
    marginHorizontal:'auto'
  },

  commitmentTitle: {
    fontSize: 32,
    fontFamily:'Quicksand-Bold',
    color: "#000000",
    marginHorizontal:'auto'
  },

  commitmentSub: {
    fontSize: 36,
    fontFamily:'Quicksand-Bold',
    color: "#FFFFFF",
    marginHorizontal:'auto',
    marginVertical: 10,
    lineHeight: 30,
  },

  commitmentText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#444444",
    marginBottom: 10,
    fontFamily:'Quicksand-Regular'
  },
  signatureTitle: {
   fontSize: 36,
    fontFamily:'Quicksand-Bold',
    color: "#000000",
    marginHorizontal:'auto'
},

signatureSub: {
   fontSize: 36,
    fontFamily:'Quicksand-Bold',
    color: "#FFFFFF",
    marginHorizontal:'auto',
  marginBottom: 12,
},

qualityTitle: {
   fontSize: 36,
    fontFamily:'Quicksand-Bold',
    color: "#000000",
    marginHorizontal:'auto',
  marginBottom: 12,
  lineHeight: 28,
},

footer: {
  backgroundColor: "#4B3626",
  borderRadius: 22,
  padding: 20,
  marginTop: 20,
},

footerLogo: {
  color: "#fff",
  fontSize: 18,
  fontWeight: "800",
  marginBottom: 10,
},

footerHeading: {
  color: "#fff",
  fontSize: 14,
  fontWeight: "700",
  marginTop: 14,
},

footerText: {
  color: "#E5E5E5",
  fontSize: 13,
  fontFamily:'RethinkSans-Regular',
  lineHeight: 20,
  marginTop: 4,
},

footerCopyright: {
  color: "#CFCFCF",
  fontSize: 12,
  marginTop: 14,
},

});
