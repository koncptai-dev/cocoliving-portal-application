import React, { useRef, useState,useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Signature from 'react-native-signature-canvas';
import RNFS from 'react-native-fs';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { WebView } from 'react-native-webview';
import { useRoute } from "@react-navigation/native";
import { Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from "react-native-toast-message";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { InteractionManager } from "react-native";
import Config from 'react-native-config';


/* ================== CONFIG ================== */
export const BASE_URL = Config.API_BASE_URL;
export const API_BASE = Config.API_BASE_URL;

/* ================== HELPERS ================== */
const buildPdfUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};


// Agreement:
const AgreementScreen = ({ onAccept }: { onAccept: () => void }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.agreementContainer}>
      
    <View style={styles.logoRow}>
  <TouchableOpacity
    onPress={() => navigation.goBack()}
    style={styles.backBtn}
    activeOpacity={0.3}
  >
    <Ionicons name="chevron-back" size={25} color="#4b3426" />
  </TouchableOpacity>

  <Image
    source={require('../../assets/images/cocoLogo.png')}
    style={styles.logo}
    resizeMode="contain"
  />
</View>

<ScrollView
  contentContainerStyle={styles.agreementContent}
  showsVerticalScrollIndicator={false}
>

        {/* TITLE */}
        <Text style={styles.agreementTitle}>
          Resident OnBoarding & Occupancy Agreement
        </Text>

        {/* AGREEMENT TEXT */}
        <Text style={styles.agreementText}>
This Agreement is entered into between CoCo Living (Operator) and the resident
for accommodation at the CoCo Living premises.

By signing this Agreement, the Resident agrees to abide by all rules,
policies and community guidelines.
        </Text>

        {/* POINTS */}
       <View style={styles.pointsContainer}>

<Text style={styles.heading}>1. Purpose of the Agreement</Text>
<Text style={styles.point}>
This Agreement governs the terms of stay, community conduct, and responsibilities of both the Operator and the Resident during their occupancy at CoCo Living.
</Text>

<Text style={styles.heading}>2. DEFINITIONS</Text>
<Text style={styles.point}>“Property”: Any Coco Living managed accommodation.</Text>
<Text style={styles.point}>“Room”: The room allocated to the Resident.</Text>
<Text style={styles.point}>“Common Areas”: Kitchens, lounges, corridors, amenities.</Text>
<Text style={styles.point}>“Occupancy Period”: Period from Check-In to Check-Out.</Text>
<Text style={styles.point}>“Fees”: Occupancy charges, maintenance, utilities.</Text>
<Text style={styles.point}>“Security Deposit”: Refundable amount paid as security.</Text>

<Text style={styles.heading}>3. Tenancy Duration</Text>
<Text style={styles.point}>
The rent shall be collected for 12/6 months in advance, and the Resident shall enjoy 1 month complimentary occupancy only on 12 months.
</Text>
<Text style={styles.point}>
Renewal beyond the 13-month term shall be at the discretion of the Operator, subject to mutual consent and revised terms (if any).
</Text>

<Text style={styles.heading}>4. Rent & Security Deposit</Text>
<Text style={styles.point}>
The Resident agrees to pay an advance rent for 12 months amounting to ₹__________ (Rupees ______________________ only).
</Text>

<Text style={styles.point}>Room Type Options:</Text>
<Text style={styles.point}>☐ Single Sharing Room</Text>
<Text style={styles.point}>☐ Double Sharing Room</Text>
<Text style={styles.point}>☐ Triple Sharing Room</Text>
<Text style={styles.point}>☐ Four Sharing Room</Text>

<Text style={styles.point}>
A security deposit equivalent to 2 months’ rent is payable at the time of possession.
</Text>

<Text style={styles.point}>
The security deposit shall be refundable (without interest) upon vacating, subject to deductions for unpaid dues, damages, or breaches of this Agreement.
</Text>

<Text style={styles.heading}>5. Eligibility & Documentation</Text>
<Text style={styles.point}>The Resident must be at least 18 years of age.</Text>

<Text style={styles.point}>Mandatory documents:</Text>
<Text style={styles.point}>• Government-issued ID (Passport / Voter ID / Driving License)</Text>
<Text style={styles.point}>• Aadhaar Card</Text>
<Text style={styles.point}>• Police verification (where required)</Text>

<Text style={styles.point}>
Coco Living may deny occupancy if documents are false or incomplete.
</Text>

<Text style={styles.heading}>6. Responsibilities of CoCo Living</Text>
<Text style={styles.point}>• Provide safe, clean, and habitable accommodation.</Text>
<Text style={styles.point}>• Ensure functioning of fittings and fixtures.</Text>
<Text style={styles.point}>• Provide cleaning of common areas.</Text>
<Text style={styles.point}>• Maintain security systems.</Text>
<Text style={styles.point}>• Provide WiFi service (subject to provider).</Text>
<Text style={styles.point}>• Laundry services.</Text>

<Text style={styles.heading}>7. Responsibilities of the Resident</Text>
<Text style={styles.point}>• Pay rent and deposit as agreed.</Text>
<Text style={styles.point}>• Maintain cleanliness of room and common areas.</Text>
<Text style={styles.point}>• Report maintenance issues immediately.</Text>
<Text style={styles.point}>• Not alter fixtures.</Text>
<Text style={styles.point}>• Follow community rules and policies.</Text>
<Text style={styles.point}>• Responsible for damages caused.</Text>

<Text style={styles.heading}>8. Security Deposit</Text>
<Text style={styles.point}>Deposit refund within 30-45 days subject to:</Text>
<Text style={styles.point}>• No damages</Text>
<Text style={styles.point}>• No outstanding dues</Text>
<Text style={styles.point}>• Proper handover</Text>

<Text style={styles.point}>Coco Living may deduct for:</Text>
<Text style={styles.point}>• Damage</Text>
<Text style={styles.point}>• Cleaning</Text>
<Text style={styles.point}>• Missing items</Text>
<Text style={styles.point}>• Rule violations</Text>

<Text style={styles.heading}>9. Fittings & Fixtures Provided</Text>
<Text style={styles.point}>• Air Conditioner</Text>
<Text style={styles.point}>• WiFi connection</Text>
<Text style={styles.point}>• Bed with mattress</Text>
<Text style={styles.point}>• Study Table</Text>
<Text style={styles.point}>• Chair</Text>
<Text style={styles.point}>• Wardrobe</Text>
<Text style={styles.point}>• Water Geyser</Text>

<Text style={styles.heading}>10. Electricity & Utilities</Text>
<Text style={styles.point}>
Each room has an independent electricity meter.
</Text>
<Text style={styles.point}>
Electricity charges will be divided between occupants.
</Text>

<Text style={styles.heading}>11. Prohibited Activities</Text>
<Text style={styles.point}>
No illegal substances, drugs, narcotics or contraband allowed.
</Text>
<Text style={styles.point}>
No alcohol consumption or storage within premises.
</Text>
<Text style={styles.point}>
No gambling, weapons or illegal activities.
</Text>

<Text style={styles.heading}>12. Visitors Policy</Text>
<Text style={styles.point}>No male visitors allowed on the premises.</Text>
<Text style={styles.point}>
Female visitors allowed only in common areas with prior intimation.
</Text>
<Text style={styles.point}>
Overnight stay of visitors is strictly prohibited.
</Text>

<Text style={styles.heading}>13. Safety & Security</Text>
<Text style={styles.point}>
Entry and exit must follow the monitoring system.
</Text>
<Text style={styles.point}>
Residents must carry their ID or access card.
</Text>
<Text style={styles.point}>
Tampering with security systems is prohibited.
</Text>

<Text style={styles.heading}>14. Jurisdiction</Text>
<Text style={styles.point}>
This Agreement shall be governed by the laws of India and the State of Gujarat,
with courts in Ahmedabad having exclusive jurisdiction.
</Text>

</View>
        <Text style={styles.agreementFooter}>
          By clicking "Sign Contract", you confirm that you have read and
          agree to the CoCo Living Occupancy Agreement.
        </Text>

      </ScrollView>

      {/* FIXED BUTTON */}
      <View style={styles.agreementButtonContainer}>
        <TouchableOpacity style={styles.signBtn} onPress={onAccept}>
          <Text style={styles.signText}>Sign Contract</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const ContractSignScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const tenantSignatureRef = useRef<any>(null);
  const guardianSignatureRef = useRef<any>(null);
  const route = useRoute();
const bookingIdFromRoute = route?.params?.bookingId;

  const [bookingId, setBookingId] = useState(bookingIdFromRoute || '');
  const [contractLoaded, setContractLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signed, setSigned] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(null);

 const [step, setStep] = useState(0);
const [tenantSignaturePath, setTenantSignaturePath] = useState(null);
const [guardianSignaturePath, setGuardianSignaturePath] = useState(null);
const [isGuardianSaved, setIsGuardianSaved] = useState(false);
const [isTenantSaved, setIsTenantSaved] = useState(false);

const isStudent = user?.userType === "student";

  /* ================== FETCH CONTRACT ================== */
  const fetchContract = async () => {
    if (!bookingId) {
      Toast.show({
  type: "error",
  text1: "Booking ID required",
});
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE}/contracts/${bookingId}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      setSigned(res.data?.signed ?? false);
      setContractUrl(buildPdfUrl(res.data?.fileUrl));
      setContractLoaded(true);
      setStep(0);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };
     
  /* ================== SAVE SIGNATURE ================== */
const saveSignature = async (signature, type) => {
  const base64Data = signature.replace("data:image/png;base64,", "");
  const path = `${RNFS.DocumentDirectoryPath}/${type}_signature.png`;

  await RNFS.writeFile(path, base64Data, "base64");

 if (type === "tenant") {
  setTenantSignaturePath(path);
  if (isStudent) {
    setStep(2); // Student hai to step 2 pe bhejo
  } else {
    setIsTenantSaved(true); // Professional hai to sirf lock karo, API call mat karo abhi
  }
}

if (type === "guardian") {

  setGuardianSignaturePath(path);
  setIsGuardianSaved(true);
  guardianSignatureRef.current?.clearSignature();

}
};


  useEffect(() => {
  if (bookingIdFromRoute) {
    setBookingId(String(bookingIdFromRoute));
    fetchContract();
  }
}, []);


// Agreement screen: 

  /* ================== SIGN CONTRACT ================== */
// const signContract = async (
//   tenantPath = tenantSignaturePath,
//   guardianPath = guardianSignaturePath
// ) => {

//   if (!tenantPath) {
//     Toast.show({
//       type: "error",
//       text1: "User signature required",
//     });
//     return;
//   }

//   if (isStudent && !guardianSignaturePath) {
//     Toast.show({
//       type: "error",
//       text1: "Guardian signature required",
//     });
//     return;
//   }

//   const formData = new FormData();

//   formData.append("tenantSignature", {
//     uri: `file://${tenantPath}`,
//     type: "image/png",
//     name: "tenant_signature.png",
//   });

//  if (isStudent && guardianPath) {
//   formData.append("guardianSignature", {
//     uri: `file://${guardianPath}`,
//     type: "image/png",
//     name: "guardian_signature.png",
//   });
// }

// try {
//   setLoading(true);
//   console.log("API SIGN CONTRACT: ",API_BASE)
//   const res = await axios.post(
//     `${API_BASE}/api/contracts/${bookingId}/sign`,
//     formData,
//     {
//       headers: {
//         Authorization: `Bearer ${user?.token}`,
//         "Content-Type": "multipart/form-data",
//       },
//     }
//   );

//   console.log("response: ",res)

//   setLoading(false);

//   // Toast ki jagah Alert
//   Alert.alert(
//     "Success!",
//     "Contract signed successfully. Redirecting to home...",
//     [
//       {
//         text: "OK",
//         onPress: () => {
//           // Thoda delay de sakte ho agar chahiye, lekin zaruri nahi
//           setTimeout(() => {
//             navigation.reset({
//               index: 0,
//               routes: [{ name: "HomeTabs" }],
//             });
//           }, 800); // 0.8 second ka chhota sa buffer, smooth feel ke liye
//         }
//       }
//     ],
//     { cancelable: false } // user ko dismiss na kar sake
//   );

// } catch (err) {
//   setLoading(false);

//   // Error ke liye bhi Alert rakh sakte ho (optional)
//   Alert.alert(
//     "Error",
//     err?.response?.data?.message || "Failed to sign contract",
//     [{ text: "OK" }]
//   );
// } finally {
//   setLoading(false);
// }

//   /* ================== PDF VIEW ================== */
//   // if (signed && contractUrl) {
//   //   const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
//   //     contractUrl
//   //   )}`;

  


//     return (
//       <View style={{ flex: 1 }}>
//         <StatusBar barStyle="dark-content" />
//         {/* Loading overlay ko yahan return ke andar rakhein */}
//       {loading && (
//         <View style={styles.loadingOverlay}>
//           <ActivityIndicator size="large" color="#1E3A8A" />
//           <Text style={{marginTop: 10, color: '#1E3A8A', fontWeight: '600'}}>
//             Processing...
//           </Text>
//         </View>
//       )}
//         <WebView
//           source={{ uri: googleViewerUrl }}
//           startInLoadingState
//           renderLoading={() => (
//             <View style={styles.center}>
//               <ActivityIndicator size="large" color="#1E3A8A" />
//             </View>
//           )}
//           style={{ flex: 1 }}
//         />
//       </View>
//     );
//   }


const signContract = async (
  tenantPath = tenantSignaturePath,
  guardianPath = guardianSignaturePath
) => {

  console.log("\n========== SIGN CONTRACT START ==========");

  if (!tenantPath) {
    console.log("❌ Tenant signature missing");
    Toast.show({
      type: "error",
      text1: "User signature required",
    });
    return;
  }

  if (isStudent && !guardianPath) {
    console.log("❌ Guardian signature missing (Student case)");
    Toast.show({
      type: "error",
      text1: "Guardian signature required",
    });
    return;
  }

  console.log("✅ Tenant Path:", tenantPath);
  console.log("✅ Guardian Path:", guardianPath);
  console.log("✅ Booking ID:", bookingId);
  console.log("✅ API URL:", `${API_BASE}/api/contracts/${bookingId}/sign`);

  const formData = new FormData();

  const tenantFile = {
    uri: `file://${tenantPath}`,
    type: "image/png",
    name: "tenant_signature.png",
  };

  formData.append("tenantSignature", tenantFile);

  let guardianFile = null;

  if (isStudent && guardianPath) {
    guardianFile = {
      uri: `file://${guardianPath}`,
      type: "image/png",
      name: "guardian_signature.png",
    };

    formData.append("guardianSignature", guardianFile);
  }

  // 🔥 IMPORTANT: Log FormData manually
  console.log("📦 FormData Content:");
  console.log({
    tenantSignature: tenantFile,
    guardianSignature: guardianFile,
  });

  try {
    setLoading(true);

    console.log("🚀 Sending request...");
    console.log("Headers:", {
      Authorization: `Bearer ${user?.token}`,
      "Content-Type": "multipart/form-data",
    });

    const res = await axios.post(
      `${API_BASE}/api/contracts/${bookingId}/sign`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("✅ RESPONSE RECEIVED");
    console.log("Status:", res.status);
    console.log("Data:", res.data);

    setLoading(false);

    Alert.alert(
      "Success!",
      "Contract signed successfully. Redirecting to home...",
      [
        {
          text: "OK",
          onPress: () => {
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: "HomeTabs" }],
              });
            }, 800);
          }
        }
      ],
      { cancelable: false }
    );

  } catch (err) {
    setLoading(false);

    console.log("❌ ERROR OCCURRED");
    console.log("Full Error:", err);
    console.log("Response:", err?.response);
    console.log("Status Code:", err?.response?.status);
    console.log("Error Data:", err?.response?.data);

    Alert.alert(
      "Error",
      err?.response?.data?.message || "Failed to sign contract",
      [{ text: "OK" }]
    );

  } finally {
    console.log("========== SIGN CONTRACT END ==========\n");
    setLoading(false);
  }
};

if (contractLoaded && step === 0) {
  return <AgreementScreen onAccept={() => setStep(1)} />;
}
  /* ================== INITIAL BOOKING SCREEN ================== */
  if (!contractLoaded) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <StatusBar backgroundColor="#1E3A8A" barStyle="light-content" />

          {/* YE BLOCK ADD KAREIN */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={{marginTop: 10, color: '#1E3A8A'}}>Checking Booking ID...</Text>
          </View>
        )}

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Cocoliving</Text>
            <Text style={styles.headerSubtitle}>Digital Contract Agreement</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Booking ID</Text>
            <TextInput
              value={bookingId}
              onChangeText={setBookingId}
              placeholder="Enter booking ID"
              keyboardType="numeric"
              style={styles.input}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={fetchContract}>
              <Text style={styles.primaryText}>Check Contract</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  /* ================== STEP 1: TENANT SIGN ================== */
 /* ================== STEP 1: TENANT SIGN ================== */
/* ================== STEP 1: TENANT SIGN ================== */
/* ================== STEP 1: TENANT SIGN ================== */
if (step === 1) {
  return (
    <View style={styles.fullScreen}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      )}

      <View style={styles.signatureHeader}>
        {/* ✅ Condition for Title */}
        {isStudent && <Text style={styles.stepTitle}>Step 1 of 2</Text>}
        <Text style={styles.stepSubtitle}>
          {isStudent ? "Tenant Signature" : "User Signature"}
        </Text>
      </View>

      {!isTenantSaved ? (
        <>
          <View style={styles.signatureFull}>
            <Signature
              ref={tenantSignatureRef}
              onOK={(sig) => {
                saveSignature(sig, 'tenant');
                // ✅ Student ke case mein pad ko clear kar do taaki Step 2 fresh mile
                if(isStudent) tenantSignatureRef.current?.clearSignature();
              }}
              autoClear={false}
              webStyle={`.m-signature-pad--footer { display: none; }`}
            />
          </View>
          
          <Text style={{ textAlign: "center", marginTop: 10, fontWeight: "600" }}>
            {user?.fullName}
          </Text>

          <View style={styles.row}>
            <TouchableOpacity 
              style={styles.secondaryBtn} 
              onPress={() => tenantSignatureRef.current?.clearSignature()}
            >
              <Text>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.successBtn} 
              onPress={() => tenantSignatureRef.current?.readSignature()}
            >
              <Text style={{color:"#fff"}}>
                {isStudent ? "Save & Continue" : "Save Signature"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Professional Case Saved View */
        <View style={styles.savedContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#16A34A" />
          <Text style={styles.savedText}>Signature Saved!</Text>
          <TouchableOpacity onPress={() => setIsTenantSaved(false)}>
            <Text style={{color: '#4B5563', textDecorationLine: 'underline', marginTop: 10}}>Re-draw</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isStudent && isTenantSaved && (
        <TouchableOpacity
          style={styles.signBtn}
          onPress={() => signContract(tenantSignaturePath, null)}
        >
          <Text style={styles.signText}>Submit Contract</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
  /* ================== STEP 2: GUARDIAN SIGN ================== */
 if (step === 2) {
  return (
    <View style={styles.fullScreen}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      )}
      
      <View style={styles.signatureHeader}>
        <Text style={styles.stepTitle}>Step 2 of 2</Text>
        <Text style={styles.stepSubtitle}>Guardian Signature</Text>
      </View>

      {/* Signature Pad: Jab save ho jaye toh ise hide kar dein ya placeholder dikhayein */}
      {!isGuardianSaved ? (
        <>
          <View style={styles.signatureFull}>
            <Signature
              ref={guardianSignatureRef}
              onOK={(sig) => saveSignature(sig, 'guardian')}
              autoClear={false}
              descriptionText=""
              webStyle={`.m-signature-pad--footer { display: none; }`}
            />
          </View>
          <Text style={{ textAlign: "center", marginTop: 10, fontWeight: "600" }}>
            {user?.parentName || "Guardian"}
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => guardianSignatureRef.current?.clearSignature()}
            >
              <Text>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => guardianSignatureRef.current?.readSignature()}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Save Signature</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* ✅ SAVE HONE KE BAAD YE DIKHEGA */
        <View style={styles.savedContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#16A34A" />
          <Text style={styles.savedText}>Guardian Signature Saved!</Text>
          <TouchableOpacity 
            onPress={() => setIsGuardianSaved(false)} 
            style={{marginTop: 10}}
          >
            <Text style={{color: '#4B5563', textDecorationLine: 'underline'}}>Re-draw Signature</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Final Submit Button - Sirf tabhi active aur visible jab save ho jaye */}
      {isGuardianSaved && (
  <TouchableOpacity
    style={[
      styles.signBtn,
      { backgroundColor: loading ? '#9CA3AF' : '#1E3A8A' }
    ]}
    onPress={() => signContract(tenantSignaturePath, guardianSignaturePath)}
    disabled={loading}
  >
    <Text style={styles.signText}>
      {loading ? "Submitting..." : "Submit Contract"}
    </Text>
  </TouchableOpacity>
)}
    </View>
  );
}
};

export default ContractSignScreen;

/* ================== STYLES ================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { padding: 20, backgroundColor: '#1E3A8A' },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '700'  },
  headerSubtitle: { color: '#DCE3F1', marginTop: 4 },

  card: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 14,
    elevation: 4,
  },

  label: { fontSize: 14, marginBottom: 6, color: '#374151' },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },

  primaryBtn: {
    backgroundColor: '#1E3A8A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  primaryText: { color: '#FFF', fontWeight: '600' },

  fullScreen: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    padding: 20,
  },

  stepTitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  stepSubtitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },

  signatureFull: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },

row: { 
  flexDirection: 'row',
  marginTop: 20,
  paddingBottom: Platform.OS === "android" ? 30 : 40
},

  signatureHeader: {
  paddingTop: 40,   // punch hole safe spacing
  paddingBottom: 10,
  alignItems: "center",
},

  secondaryBtn: {
    flex: 1,
    marginRight: 8,
    padding: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    alignItems: 'center',
  },

  successBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    alignItems: 'center',
  },
loadingOverlay: {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "rgba(255,255,255,0.7)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 50
},
savedContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#F0FDF4', // Light green background
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#BBF7D0',
  borderStyle: 'dashed',
},
savedText: {
  fontSize: 18,
  fontWeight: '700',
  color: '#16A34A',
  marginTop: 10,
},
  signBtn: {
  marginTop: 20,
  marginBottom: Platform.OS === "android" ? 30 : 40,
  padding: 16,
  backgroundColor: '#16A34A',
  borderRadius: 12,
  alignItems: 'center',
},

  signText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  //agrement stltes:
  agreementContainer: {
  flex: 1,
  backgroundColor: "#F5F7FB",
},

agreementContent: {
  padding: 20,
  paddingBottom: 160,
},

logo: {
  width: 120,
  height: 50
},

agreementTitle: {
  fontSize: 20,
  fontWeight: "700",
  textAlign: "center",
  marginBottom: 20,
  color: "#111827",
},

agreementText: {
  fontSize: 14,
  lineHeight: 22,
  color: "#374151",
  marginBottom: 20,
},

pointsContainer: {
  marginBottom: 20,
},

point: {
  fontSize: 14,
  lineHeight: 22,
  color: "#374151",
  marginBottom: 8,
},

agreementFooter: {
  fontSize: 13,
  color: "#6B7280",
  textAlign: "center",
  marginTop: 10,
  // paddingTop:10,
  // bottom:0,
},

agreementButtonContainer: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: 10,
  paddingBottom:40,
  // marginBottom:10,
  backgroundColor: "#F5F7FB",
  borderTopWidth: 1,
  borderColor: "#E5E7EB",
},
heading: {
  fontSize: 16,
  fontWeight: "700",
  marginTop: 18,
  marginBottom: 6,
  color: "#111827",
  
},
logoRow: {
  height: 70,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#F5F7FB",
  marginTop:30,
},
backBtn: {
  position: "absolute",
  left: 20,
  top: 22,
  zIndex: 10
},
});







