import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TextInput,
} from 'react-native';
import Signature from 'react-native-signature-canvas';
import RNFS from 'react-native-fs';
import axios from 'axios';
import Pdf from 'react-native-pdf';
import { useAuth } from '../context/AuthContext';

/* ================== CONFIG ================== */
const API_BASE = 'https://staging.cocoliving.in/api';
const BASE_URL = 'https://staging.cocoliving.in';

/* ================== HELPERS ================== */
const buildPdfUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};

/* ================== SCREEN ================== */
const ContractSignScreen = () => {
  /* -------- HOOKS (ALWAYS UNCONDITIONAL) -------- */
  const { user } = useAuth();
  const signatureRef = useRef<any>(null);

  const [bookingId, setBookingId] = useState('');
  const [contractLoaded, setContractLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signed, setSigned] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [signaturePath, setSignaturePath] = useState<string | null>(null);

  /* ================== FETCH CONTRACT ================== */
  const fetchContract = async () => {
    if (!bookingId) {
      Alert.alert('Please enter booking ID');
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE}/contracts/${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      setSigned(res.data.signed);
      setContractUrl(buildPdfUrl(res.data.fileUrl));
      setContractLoaded(true);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Failed to load contract'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================== SAVE SIGNATURE ================== */
  const saveSignature = async (signature: string) => {
    try {
      const base64Data = signature.replace(
        'data:image/png;base64,',
        ''
      );

      const path = `${RNFS.DocumentDirectoryPath}/signature.png`;
      await RNFS.writeFile(path, base64Data, 'base64');
      setSignaturePath(path);
    } catch {
      Alert.alert('Error', 'Failed to save signature');
    }
  };

  /* ================== SIGN CONTRACT ================== */
  const signContract = async () => {
    if (!bookingId) {
      Alert.alert('Booking ID missing');
      return;
    }

    if (!signaturePath) {
      Alert.alert('Please sign first');
      return;
    }

    const formData = new FormData();
    formData.append('signature', {
      uri: `file://${signaturePath}`,
      type: 'image/png',
      name: 'signature.png',
    } as any);

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/contracts/${bookingId}/sign`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      Alert.alert('Success', 'Contract signed successfully, check your email');
      setSigned(true);
      setContractUrl(buildPdfUrl(res.data.fileUrl));
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Failed to sign contract'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================== RENDER LOGIC (NO EARLY RETURNS) ================== */
  let content = null;

  if (loading) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  } else if (signed && contractUrl) {
    content = (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        {/* <Pdf
          source={{ uri: contractUrl, cache: true }}
          style={{ flex: 1 }}
        /> */}
        <Pdf
  source={{
    uri: contractUrl,
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
    cache: true,
  }}
  onError={(error) => {
    console.log('PDF error:', error);
  }}
  onLoadComplete={(pages) => {
    console.log('PDF loaded, pages:', pages);
  }}
  style={{ flex: 1 }}
/>
      </View>
    );
  } else {
    content = (
      <>
        <StatusBar backgroundColor="#1E3A8A" barStyle="light-content" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cocoliving</Text>
          <Text style={styles.headerSubtitle}>
            Digital Contract Agreement
          </Text>
        </View>

        {/* Booking ID Input */}
        <View style={styles.bookingBox}>
          <Text style={styles.bookingLabel}>Booking ID</Text>
          <TextInput
            value={bookingId}
            onChangeText={setBookingId}
            placeholder="Enter booking ID"
            keyboardType="numeric"
            style={styles.bookingInput}
          />
          <TouchableOpacity
            style={styles.fetchBtn}
            onPress={fetchContract}
          >
            <Text style={styles.fetchText}>Check Contract</Text>
          </TouchableOpacity>
        </View>

        {/* Signature Section */}
        {contractLoaded && !signed && (
          <>
            <View style={styles.contractBox}>
              <Text style={styles.contractText}>
                By signing below, you agree to all terms and conditions.
              </Text>
            </View>

            <View style={styles.signatureCard}>
              <Text style={styles.signatureTitle}>Signature</Text>

              <View style={styles.signatureBox}>
                <Signature
                  ref={signatureRef}
                  onOK={saveSignature}
                  autoClear={false}
                  descriptionText=""
                  webStyle={`
                    .m-signature-pad--footer { display: none; }
                  `}
                />
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() =>
                    signatureRef.current?.clearSignature()
                  }
                >
                  <Text>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() =>
                    signatureRef.current?.readSignature()
                  }
                >
                  <Text style={styles.saveText}>Save Signature</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.signBtn}
              onPress={signContract}
            >
              <Text style={styles.signText}>Sign Contract</Text>
            </TouchableOpacity>
          </>
        )}
      </>
    );
  }

  /* ================== SINGLE RETURN ================== */
  return <View style={styles.container}>{content}</View>;
};

export default ContractSignScreen;

/* ================== STYLES ================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#1E3A8A',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#DCE3F1',
    marginTop: 4,
    fontSize: 14,
  },
  bookingBox: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  bookingLabel: {
    fontSize: 14,
    marginBottom: 6,
    color: '#374151',
  },
  bookingInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  fetchBtn: {
    backgroundColor: '#1E3A8A',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  fetchText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contractBox: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 14,
    borderRadius: 8,
  },
  contractText: {
    fontSize: 13,
    color: '#374151',
  },
  signatureCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 10,
  },
  signatureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  clearBtn: {
    flex: 1,
    marginRight: 8,
    padding: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: '#16A34A',
    borderRadius: 6,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  signBtn: {
    margin: 16,
    padding: 16,
    backgroundColor: '#16A34A',
    borderRadius: 8,
    alignItems: 'center',
  },
  signText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

// import React, { useRef, useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Alert,
//   StyleSheet,
//   ActivityIndicator,
//   StatusBar,
//   TextInput,
// } from 'react-native';
// import Signature from 'react-native-signature-canvas';
// import RNFS from 'react-native-fs';
// import axios from 'axios';
// import Pdf from 'react-native-pdf';
// import { useAuth } from '../context/AuthContext';

// /* ================== CONFIG ================== */
// const API_BASE = 'https://staging.cocoliving.in/api';
// const BASE_URL = 'https://staging.cocoliving.in';

// /* ================== HELPERS ================== */
// const buildPdfUrl = (path?: string | null) => {
//   if (!path) return null;
//   if (path.startsWith('http')) return path;
//   return `${BASE_URL}${path}`;
// };

// /* ================== SCREEN ================== */
// const ContractSignScreen = () => {
//   const { user } = useAuth();
//   const signatureRef = useRef<any>(null);

//   const [bookingId, setBookingId] = useState('');
//   const [contractLoaded, setContractLoaded] = useState(false);

//   const [loading, setLoading] = useState(false);
//   const [signed, setSigned] = useState(false);
//   const [contractUrl, setContractUrl] = useState<string | null>(null);
//   const [signaturePath, setSignaturePath] = useState<string | null>(null);

//   /* ================== FETCH CONTRACT ================== */
//   const fetchContract = async () => {
//     if (!bookingId) {
//       Alert.alert('Please enter booking ID');
//       return;
//     }

//     try {
//       setLoading(true);

//       const res = await axios.get(
//         `${API_BASE}/contracts/${bookingId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${user?.token}`,
//           },
//         }
//       );

//       setSigned(res.data.signed);
//       setContractUrl(buildPdfUrl(res.data.fileUrl));
//       setContractLoaded(true);
//     } catch (err: any) {
//       Alert.alert(
//         'Error',
//         err?.response?.data?.message || 'Failed to load contract'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================== SAVE SIGNATURE ================== */
//   const saveSignature = async (signature: string) => {
//     try {
//       const base64Data = signature.replace(
//         'data:image/png;base64,',
//         ''
//       );

//       const path = `${RNFS.DocumentDirectoryPath}/signature.png`;
//       await RNFS.writeFile(path, base64Data, 'base64');
//       setSignaturePath(path);
//     } catch {
//       Alert.alert('Error', 'Failed to save signature');
//     }
//   };

//   /* ================== SIGN CONTRACT ================== */
//   const signContract = async () => {
//     if (!bookingId) {
//       Alert.alert('Booking ID missing');
//       return;
//     }

//     if (!signaturePath) {
//       Alert.alert('Please sign first');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('signature', {
//       uri: `file://${signaturePath}`,
//       type: 'image/png',
//       name: 'signature.png',
//     } as any);

//     try {
//       setLoading(true);

//       const res = await axios.post(
//         `${API_BASE}/contracts/${bookingId}/sign`,
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${user?.token}`,
//             'Content-Type': 'multipart/form-data',
//           },
//         }
//       );

//       Alert.alert('Success', 'Contract signed successfully');
//       setSigned(true);
//       setContractUrl(buildPdfUrl(res.data.fileUrl));
//     } catch (err: any) {
//       Alert.alert(
//         'Error',
//         err?.response?.data?.message || 'Failed to sign contract'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================== LOADING ================== */
//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   /* ================== SIGNED VIEW ================== */
//   if (signed && contractUrl) {
//     return (
//       <View style={{ flex: 1 }}>
//         <StatusBar barStyle="dark-content" />
//         <Pdf
//           source={{ uri: contractUrl, cache: true }}
//           style={{ flex: 1 }}
//         />
//       </View>
//     );
//   }

//   /* ================== MAIN VIEW ================== */
//   return (
//     <View style={styles.container}>
//       <StatusBar backgroundColor="#1E3A8A" barStyle="light-content" />

//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Cocoliving</Text>
//         <Text style={styles.headerSubtitle}>
//           Digital Contract Agreement
//         </Text>
//       </View>

//       {/* Booking ID Input */}
//       <View style={styles.bookingBox}>
//         <Text style={styles.bookingLabel}>Booking ID</Text>
//         <TextInput
//           value={bookingId}
//           onChangeText={setBookingId}
//           placeholder="Enter booking ID"
//           keyboardType="numeric"
//           style={styles.bookingInput}
//         />
//         <TouchableOpacity
//           style={styles.fetchBtn}
//           onPress={fetchContract}
//         >
//           <Text style={styles.fetchText}>Check Contract</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Show signature only after contract loads */}
//       {contractLoaded && !signed && (
//         <>
//           <View style={styles.contractBox}>
//             <Text style={styles.contractText}>
//               By signing below, you agree to all terms and conditions.
//             </Text>
//           </View>

//           <View style={styles.signatureCard}>
//             <Text style={styles.signatureTitle}>Signature</Text>

//             <View style={styles.signatureBox}>
//               <Signature
//                 ref={signatureRef}
//                 onOK={saveSignature}
//                 autoClear={false}
//                 descriptionText=""
//                 webStyle={`
//                   .m-signature-pad--footer { display: none; }
//                 `}
//               />
//             </View>

//             <View style={styles.actions}>
//               <TouchableOpacity
//                 style={styles.clearBtn}
//                 onPress={() =>
//                   signatureRef.current?.clearSignature()
//                 }
//               >
//                 <Text>Clear</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.saveBtn}
//                 onPress={() =>
//                   signatureRef.current?.readSignature()
//                 }
//               >
//                 <Text style={styles.saveText}>
//                   Save Signature
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           <TouchableOpacity
//             style={styles.signBtn}
//             onPress={signContract}
//           >
//             <Text style={styles.signText}>Sign Contract</Text>
//           </TouchableOpacity>
//         </>
//       )}
//     </View>
//   );
// };

// export default ContractSignScreen;

// /* ================== STYLES ================== */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F7FB',
//   },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   header: {
//     padding: 20,
//     backgroundColor: '#1E3A8A',
//   },
//   headerTitle: {
//     color: '#FFFFFF',
//     fontSize: 22,
//     fontWeight: '700',
//   },
//   headerSubtitle: {
//     color: '#DCE3F1',
//     marginTop: 4,
//     fontSize: 14,
//   },

//   bookingBox: {
//     backgroundColor: '#FFFFFF',
//     margin: 16,
//     padding: 16,
//     borderRadius: 8,
//   },
//   bookingLabel: {
//     fontSize: 14,
//     marginBottom: 6,
//     color: '#374151',
//   },
//   bookingInput: {
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//     borderRadius: 6,
//     padding: 12,
//     marginBottom: 12,
//   },
//   fetchBtn: {
//     backgroundColor: '#1E3A8A',
//     padding: 12,
//     borderRadius: 6,
//     alignItems: 'center',
//   },
//   fetchText: {
//     color: '#FFFFFF',
//     fontWeight: '600',
//   },

//   contractBox: {
//     backgroundColor: '#FFFFFF',
//     margin: 16,
//     padding: 14,
//     borderRadius: 8,
//   },
//   contractText: {
//     fontSize: 13,
//     color: '#374151',
//   },
//   signatureCard: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     marginHorizontal: 16,
//     padding: 16,
//     borderRadius: 10,
//   },
//   signatureTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     marginBottom: 8,
//   },
//   signatureBox: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   actions: {
//     flexDirection: 'row',
//     marginTop: 12,
//   },
//   clearBtn: {
//     flex: 1,
//     marginRight: 8,
//     padding: 12,
//     backgroundColor: '#E5E7EB',
//     borderRadius: 6,
//     alignItems: 'center',
//   },
//   saveBtn: {
//     flex: 1,
//     padding: 12,
//     backgroundColor: '#16A34A',
//     borderRadius: 6,
//     alignItems: 'center',
//   },
//   saveText: {
//     color: '#FFFFFF',
//     fontWeight: '600',
//   },
//   signBtn: {
//     margin: 16,
//     padding: 16,
//     backgroundColor: '#16A34A',
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   signText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '700',
//   },
// });



// import React, { useEffect, useRef, useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Alert,
//   StyleSheet,
//   ActivityIndicator,
//   StatusBar,
// } from 'react-native';
// import Signature from 'react-native-signature-canvas';
// import RNFS from 'react-native-fs';
// import axios from 'axios';
// import Pdf from 'react-native-pdf';
// import { useAuth } from '../context/AuthContext';

// /* ================== CONFIG ================== */
// const API_BASE = 'https://staging.cocoliving.in/api';
// const BASE_URL = 'https://staging.cocoliving.in';
// const DEFAULT_BOOKING_ID = 12;

// /* ================== HELPERS ================== */
// const buildPdfUrl = (path?: string | null) => {
//   if (!path) return null;
//   if (path.startsWith('http')) return path;
//   return `${BASE_URL}${path}`;
// };

// /* ================== SCREEN ================== */
// const ContractSignScreen = () => {
//   const { user } = useAuth();
//   const signatureRef = useRef<any>(null);

//   const [loading, setLoading] = useState(true);
//   const [signed, setSigned] = useState(false);
//   const [contractUrl, setContractUrl] = useState<string | null>(null);
//   const [signaturePath, setSignaturePath] = useState<string | null>(null);

//   const BOOKING_ID = DEFAULT_BOOKING_ID;

//   /* ================== FETCH CONTRACT ================== */
//   const fetchContract = async () => {
//     console.log('📡 fetchContract → bookingId:', BOOKING_ID);

//     try {
//       const res = await axios.get(
//         `${API_BASE}/contracts/${BOOKING_ID}`,
//         {
//           headers: {
//             Authorization: `Bearer ${user?.token}`,
//           },
//         }
//       );

//       console.log('✅ fetchContract response:', res.data);

//       setSigned(res.data.signed);
//       setContractUrl(buildPdfUrl(res.data.fileUrl));
//     } catch (err: any) {
//       console.log('❌ fetchContract error:', err?.response || err);
//       Alert.alert(
//         'Error',
//         err?.response?.data?.message || 'Failed to load contract'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     console.log('🧩 ContractSignScreen mounted');
//     console.log('👤 user:', user);
//     fetchContract();
//   }, []);

//   /* ================== SAVE SIGNATURE ================== */
//   const saveSignature = async (signature: string) => {
//     try {
//       const base64Data = signature.replace(
//         'data:image/png;base64,',
//         ''
//       );

//       const path = `${RNFS.DocumentDirectoryPath}/signature.png`;
//       await RNFS.writeFile(path, base64Data, 'base64');

//       console.log('💾 Signature saved at:', path);
//       setSignaturePath(path);
//     } catch (err) {
//       console.log('❌ saveSignature error:', err);
//       Alert.alert('Error', 'Failed to save signature');
//     }
//   };

//   /* ================== SIGN CONTRACT ================== */
//   const signContract = async () => {
//     if (!signaturePath) {
//       Alert.alert('Please sign first');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('signature', {
//       uri: `file://${signaturePath}`,
//       type: 'image/png',
//       name: 'signature.png',
//     } as any);

//     try {
//       setLoading(true);

//       const res = await axios.post(
//         `${API_BASE}/contracts/${BOOKING_ID}/sign`,
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${user?.token}`,
//             'Content-Type': 'multipart/form-data',
//           },
//         }
//       );

//       console.log('✅ signContract response:', res.data);

//       Alert.alert('Success', 'Contract signed successfully');
//       setSigned(true);
//       setContractUrl(buildPdfUrl(res.data.fileUrl));
//     } catch (err: any) {
//       console.log('❌ signContract error:', err?.response || err);
//       Alert.alert(
//         'Error',
//         err?.response?.data?.message || 'Failed to sign contract'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================== LOADING ================== */
//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   /* ================== SIGNED VIEW ================== */
//   if (signed && contractUrl) {
//     console.log('📄 Loading PDF:', contractUrl);

//     return (
//       <View style={{ flex: 1 }}>
//         <StatusBar barStyle="dark-content" />

//         <Pdf
//           source={{ uri: contractUrl, cache: true }}
//           trustAllCerts={false}
//           onLoadComplete={(pages) =>
//             console.log('✅ PDF loaded, pages:', pages)
//           }
//           onError={(error) =>
//             console.log('❌ PDF error:', error)
//           }
//           style={{ flex: 1 }}
//         />
//       </View>
//     );
//   }

//   /* ================== SIGNING VIEW ================== */
//   return (
//     <View style={styles.container}>
//       <StatusBar backgroundColor="#1E3A8A" barStyle="light-content" />

//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Cocoliving</Text>
//         <Text style={styles.headerSubtitle}>
//           Digital Contract Agreement
//         </Text>
//       </View>

//       <View style={styles.contractBox}>
//         <Text style={styles.contractText}>
//           By signing below, you agree to all terms and conditions.
//         </Text>
//       </View>

//       <View style={styles.signatureCard}>
//         <Text style={styles.signatureTitle}>Signature</Text>

//         <View style={styles.signatureBox}>
//           <Signature
//             ref={signatureRef}
//             onOK={saveSignature}
//             autoClear={false}
//             descriptionText=""
//             webStyle={`
//               .m-signature-pad--footer { display: none; }
//             `}
//           />
//         </View>

//         <View style={styles.actions}>
//           <TouchableOpacity
//             style={styles.clearBtn}
//             onPress={() =>
//               signatureRef.current?.clearSignature()
//             }
//           >
//             <Text>Clear</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.saveBtn}
//             onPress={() =>
//               signatureRef.current?.readSignature()
//             }
//           >
//             <Text style={styles.saveText}>Save Signature</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <TouchableOpacity
//         style={styles.signBtn}
//         onPress={signContract}
//       >
//         <Text style={styles.signText}>Sign Contract</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default ContractSignScreen;

// /* ================== STYLES ================== */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F7FB',
//   },
//   center: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   header: {
//     padding: 20,
//     backgroundColor: '#1E3A8A',
//   },
//   headerTitle: {
//     color: '#FFFFFF',
//     fontSize: 22,
//     fontWeight: '700',
//   },
//   headerSubtitle: {
//     color: '#DCE3F1',
//     marginTop: 4,
//     fontSize: 14,
//   },
//   contractBox: {
//     backgroundColor: '#FFFFFF',
//     margin: 16,
//     padding: 14,
//     borderRadius: 8,
//   },
//   contractText: {
//     fontSize: 13,
//     color: '#374151',
//     lineHeight: 18,
//   },
//   signatureCard: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     marginHorizontal: 16,
//     padding: 16,
//     borderRadius: 10,
//   },
//   signatureTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     marginBottom: 8,
//   },
//   signatureBox: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//     borderRadius: 8,
//     overflow: 'hidden',
//   },
//   actions: {
//     flexDirection: 'row',
//     marginTop: 12,
//   },
//   clearBtn: {
//     flex: 1,
//     marginRight: 8,
//     padding: 12,
//     backgroundColor: '#E5E7EB',
//     borderRadius: 6,
//     alignItems: 'center',
//   },
//   saveBtn: {
//     flex: 1,
//     padding: 12,
//     backgroundColor: '#16A34A',
//     borderRadius: 6,
//     alignItems: 'center',
//   },
//   saveText: {
//     color: '#FFFFFF',
//     fontWeight: '600',
//   },
//   signBtn: {
//     margin: 16,
//     padding: 16,
//     backgroundColor: '#16A34A',
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   signText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '700',
//   },
// });




// // import React, { useEffect, useRef, useState } from 'react';
// // import {
// //   View,
// //   Text,
// //   TouchableOpacity,
// //   Alert,
// //   StyleSheet,
// //   ActivityIndicator,
// //   StatusBar,
// // } from 'react-native';
// // import Signature from 'react-native-signature-canvas';
// // import RNFS from 'react-native-fs';
// // import axios from 'axios';
// // import Pdf from 'react-native-pdf';
// // import { useAuth } from '../context/AuthContext';

// // const API_BASE = 'https://staging.cocoliving.in/api';

// // const DEFAULT_BOOKING_ID = 12; 

// // const ContractSignScreen = ({ route }: any) => {
// //   const { user } = useAuth();


// //     console.log('🧩 ContractSignScreen mounted');
// //   console.log('👤 user from auth:', user);

// //   //const { bookingId } = route.params;
// //   const signatureRef = useRef<any>(null);

// //   const [loading, setLoading] = useState(true);
// //   const [signed, setSigned] = useState(false);
// //   const [contractUrl, setContractUrl] = useState<string | null>(null);
// //   const [signaturePath, setSignaturePath] = useState<string | null>(null);


// //   const BOOKING_ID = DEFAULT_BOOKING_ID;
// // console.log('📘 Using bookingId:', BOOKING_ID);
// //   /** ---------------- Fetch contract status ---------------- */
// //   // const fetchContract = async () => {
// //   //   try {
// //   //     const res = await axios.get(
// //   //       `${API_BASE}/contracts/${DEFAULT_BOOKING_ID}`,
// //   //       {
// //   //         headers: {
// //   //           Authorization: `Bearer ${user.token}`,
// //   //         },
// //   //       }
// //   //     );

// //   //     setSigned(res.data.signed);
// //   //     setContractUrl(res.data.fileUrl);
// //   //   } catch (err: any) {
// //   //     Alert.alert('Error', err.message);
// //   //   } finally {
// //   //     setLoading(false);
// //   //   }
// //   // };

// //   const fetchContract = async () => {
// //   console.log('📡 fetchContract called');

// //   try {
// //     console.log(
// //       '➡️ GET',
// //       `${API_BASE}/contracts/${BOOKING_ID}`
// //     );

// //     const res = await axios.get(
// //       `${API_BASE}/contracts/${BOOKING_ID}`,
// //       {
// //         headers: {
// //           Authorization: `Bearer ${user?.token}`,
// //         },
// //       }
// //     );

// //     console.log('✅ fetchContract response:', res.data);

// //     setSigned(res.data.signed);
// //     setContractUrl(res.data.fileUrl);
// //   } 
// //   //catch (err: any) {
// //    // console.log('❌ fetchContract error:', err?.response || err);
// //    // Alert.alert('Error', err.message);
// //   //} 
// //   catch (err: any) {
// //   console.log('❌ fetchContract error FULL:', err);

// //   if (axios.isAxiosError(err)) {
// //     console.log('📛 status:', err.response?.status);
// //     console.log('📦 data:', err.response?.data);
// //     console.log('🧾 headers:', err.response?.headers);
// //     console.log('🔗 url:', err.config?.url);
// //     console.log('➡️ method:', err.config?.method);
// //   } else {
// //     console.log('🔥 non-axios error:', err);
// //   }

// //   Alert.alert(
// //     'Error',
// //     err.response?.data?.message ||
// //       err.message ||
// //       'Something went wrong while fetching contract'
// //   );
// // }
// //   finally {
// //     setLoading(false);
// //   }
// // };
// //   useEffect(() => {
// //      console.log('⚡ useEffect triggered');
// //     fetchContract();
// //   }, []);

// //   /** ---------------- Save signature locally ---------------- */
// //   // const saveSignature = async (signature: string) => {
// //   //   const base64Data = signature.replace(
// //   //     'data:image/png;base64,',
// //   //     ''
// //   //   );

// //   //   const path =
// //   //     `${RNFS.DocumentDirectoryPath}/signature.png`;

// //   //   await RNFS.writeFile(path, base64Data, 'base64');
// //   //   setSignaturePath(path);
// //   // };
// // const saveSignature = async (signature: string) => {
// //   console.log('✍️ Signature received (base64 length):', signature.length);

// //   const base64Data = signature.replace(
// //     'data:image/png;base64,',
// //     ''
// //   );

// //   const path = `${RNFS.DocumentDirectoryPath}/signature.png`;

// //   await RNFS.writeFile(path, base64Data, 'base64');

// //   console.log('💾 Signature saved at:', path);
// //   setSignaturePath(path);
// // };
// //   /** ---------------- Upload signature ---------------- */
// //   // const signContract = async () => {
// //   //   if (!signaturePath) {
// //   //     Alert.alert('Please sign first');
// //   //     return;
// //   //   }

// //   //   const formData = new FormData();
// //   //   formData.append('signature', {
// //   //     uri: `file://${signaturePath}`,
// //   //     type: 'image/png',
// //   //     name: 'signature.png',
// //   //   } as any);

// //   //   try {
// //   //     setLoading(true);

// //   //     const res = await axios.post(
// //   //       `${API_BASE}/contracts/${DEFAULT_BOOKING_ID}/sign`,
// //   //       formData,
// //   //       {
// //   //         headers: {
// //   //           Authorization: `Bearer ${user.token}`,
// //   //           'Content-Type': 'multipart/form-data',
// //   //         },
// //   //       }
// //   //     );

// //   //     Alert.alert('Success', 'Contract signed');
// //   //     setSigned(true);
// //   //     setContractUrl(res.data.fileUrl);
// //   //   } catch (err: any) {
// //   //     Alert.alert('Error', err.response?.data?.message);
// //   //   } finally {
// //   //     setLoading(false);
// //   //   }
// //   // };
// // const signContract = async () => {
// //   console.log('🖊️ signContract pressed');
// //   console.log('📂 signaturePath:', signaturePath);

// //   if (!signaturePath) {
// //     Alert.alert('Please sign first');
// //     return;
// //   }

// //   const formData = new FormData();
// //   formData.append('signature', {
// //     uri: `file://${signaturePath}`,
// //     type: 'image/png',
// //     name: 'signature.png',
// //   } as any);

// //   try {
// //     setLoading(true);

// //     console.log(
// //       '➡️ POST',
// //       `${API_BASE}/contracts/${BOOKING_ID}/sign`
// //     );

// //     const res = await axios.post(
// //       `${API_BASE}/contracts/${BOOKING_ID}/sign`,
// //       formData,
// //       {
// //         headers: {
// //           Authorization: `Bearer ${user?.token}`,
// //           'Content-Type': 'multipart/form-data',
// //         },
// //       }
// //     );

// //     console.log('✅ signContract response:', res.data);

// //     Alert.alert('Success', 'Contract signed');
// //     setSigned(true);
// //     setContractUrl(res.data.fileUrl);
// //   } catch (err: any) {
// //     console.log('❌ signContract error:', err?.response || err);
// //     Alert.alert(
// //       'Error',
// //       err.response?.data?.message || 'Sign failed'
// //     );
// //   } finally {
// //     setLoading(false);
// //   }
// // };
// //   /** ---------------- UI ---------------- */
// //   if (loading) {
// //     return (
// //       <View style={styles.center}>
// //         <ActivityIndicator size="large" />
// //       </View>
// //     );
// //   }

// //   /** ---------------- Signed state ---------------- */
// //   if (signed && contractUrl) {
// //     return (
// //       <View style={{ flex: 1 }}>
// //         <StatusBar barStyle="dark-content" />

// //         <Pdf
// //           source={{ uri: API_BASE.replace('/api', '') + contractUrl }}
// //           style={{ flex: 1 }}
// //         />
// //       </View>
// //     );
// //   }

// //   /** ---------------- Not signed ---------------- */
// //   return (
// //     <View style={styles.container}>
// //       <StatusBar backgroundColor="#1E3A8A" barStyle="light-content" />

// //       <View style={styles.header}>
// //         <Text style={styles.headerTitle}>Cocoliving</Text>
// //         <Text style={styles.headerSubtitle}>
// //           Digital Contract Agreement
// //         </Text>
// //       </View>

// //       <View style={styles.contractBox}>
// //         <Text style={styles.contractText}>
// //           By signing below, you agree to all terms and conditions.
// //         </Text>
// //       </View>

// //       <View style={styles.signatureCard}>
// //         <Text style={styles.signatureTitle}>Signature</Text>

// //         <View style={styles.signatureBox}>
// //           <Signature
// //             ref={signatureRef}
// //             onOK={saveSignature}
// //             autoClear={false}
// //             descriptionText=""
// //             webStyle={`
// //               .m-signature-pad--footer { display: none; }
// //             `}
// //           />
// //         </View>

// //         <View style={styles.actions}>
// //           <TouchableOpacity
// //             style={styles.clearBtn}
// //             onPress={() =>
// //               signatureRef.current?.clearSignature()
// //             }
// //           >
// //             <Text>Clear</Text>
// //           </TouchableOpacity>

// //           <TouchableOpacity
// //             style={styles.saveBtn}
// //             onPress={() =>
// //               signatureRef.current?.readSignature()
// //             }
// //           >
// //             <Text style={styles.saveText}>
// //               Save Signature
// //             </Text>
// //           </TouchableOpacity>
// //         </View>
// //       </View>

// //       <TouchableOpacity
// //         style={styles.signBtn}
// //         onPress={signContract}
// //       >
// //         <Text style={styles.signText}>
// //           Sign Contract
// //         </Text>
// //       </TouchableOpacity>
// //     </View>
// //   );
// // };

// // export default ContractSignScreen;

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: '#F5F7FB',
// //   },

// //   /* ---------- Loading ---------- */
// //   center: {
// //     flex: 1,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //     backgroundColor: '#F5F7FB',
// //   },

// //   /* ---------- Header ---------- */
// //   header: {
// //     padding: 20,
// //     backgroundColor: '#1E3A8A',
// //   },
// //   headerTitle: {
// //     color: '#FFFFFF',
// //     fontSize: 22,
// //     fontWeight: '700',
// //   },
// //   headerSubtitle: {
// //     color: '#DCE3F1',
// //     marginTop: 4,
// //     fontSize: 14,
// //   },

// //   /* ---------- Contract Info ---------- */
// //   contractBox: {
// //     backgroundColor: '#FFFFFF',
// //     margin: 16,
// //     padding: 14,
// //     borderRadius: 8,
// //     elevation: 1,
// //   },
// //   contractText: {
// //     fontSize: 13,
// //     color: '#374151',
// //     lineHeight: 18,
// //   },

// //   /* ---------- Signature Card ---------- */
// //   signatureCard: {
// //     flex: 1,
// //     backgroundColor: '#FFFFFF',
// //     marginHorizontal: 16,
// //     padding: 16,
// //     borderRadius: 10,
// //     elevation: 2,
// //   },
// //   signatureTitle: {
// //     fontSize: 15,
// //     fontWeight: '600',
// //     marginBottom: 8,
// //     color: '#111827',
// //   },
// //   signatureBox: {
// //     flex: 1,
// //     borderWidth: 1,
// //     borderColor: '#D1D5DB',
// //     borderRadius: 8,
// //     overflow: 'hidden',
// //   },

// //   actions: {
// //     flexDirection: 'row',
// //     marginTop: 12,
// //   },
// //   clearBtn: {
// //     flex: 1,
// //     marginRight: 8,
// //     padding: 12,
// //     backgroundColor: '#E5E7EB',
// //     borderRadius: 6,
// //     alignItems: 'center',
// //   },
// //   clearText: {
// //     color: '#111827',
// //     fontWeight: '500',
// //   },
// //   saveBtn: {
// //     flex: 1,
// //     padding: 12,
// //     backgroundColor: '#16A34A',
// //     borderRadius: 6,
// //     alignItems: 'center',
// //   },
// //   saveText: {
// //     color: '#FFFFFF',
// //     fontWeight: '600',
// //   },

// //   /* ---------- Sign Contract CTA ---------- */
// //   signBtn: {
// //     margin: 16,
// //     padding: 16,
// //     backgroundColor: '#16A34A',
// //     borderRadius: 8,
// //     alignItems: 'center',
// //   },
// //   signText: {
// //     color: '#FFFFFF',
// //     fontSize: 16,
// //     fontWeight: '700',
// //   },

// //   disabledBtn: {
// //     backgroundColor: '#9CA3AF',
// //   },

// //   /* ---------- Signed Contract Header ---------- */
// //   signedHeader: {
// //     padding: 16,
// //     backgroundColor: '#ECFDF5',
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#D1FAE5',
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'space-between',
// //   },
// //   signedTitle: {
// //     fontSize: 15,
// //     fontWeight: '600',
// //     color: '#065F46',
// //   },

// //   /* ---------- Share Button ---------- */
// //   shareBtn: {
// //     margin: 16,
// //     padding: 16,
// //     backgroundColor: '#1E3A8A',
// //     borderRadius: 8,
// //     alignItems: 'center',
// //   },
// //   shareText: {
// //     color: '#FFFFFF',
// //     fontSize: 15,
// //     fontWeight: '600',
// //   },
// // });


// // // import React, { useRef, useState } from 'react';
// // // import {
// // //   View,
// // //   Text,
// // //   TouchableOpacity,
// // //   Alert,
// // //   StyleSheet,
// // //   Share,
// // //   StatusBar,
// // // } from 'react-native';
// // // import Signature from 'react-native-signature-canvas';
// // // import RNFS from 'react-native-fs';

// // // const ContractSignScreen: React.FC = () => {
// // //   const signatureRef = useRef<any>(null);
// // //   const [signaturePath, setSignaturePath] = useState<string | null>(null);

// // //   const saveSignature = async (signature: string) => {
// // //     try {
// // //       const base64Data = signature.replace(
// // //         'data:image/png;base64,',
// // //         ''
// // //       );

// // //       const path =
// // //         `${RNFS.DocumentDirectoryPath}/cocoliving_signature.png`;

// // //       await RNFS.writeFile(path, base64Data, 'base64');

// // //       setSignaturePath(path);
// // //       Alert.alert('Success', 'Signature saved successfully');
// // //     } catch (error) {
// // //       console.error(error);
// // //       Alert.alert('Error', 'Failed to save signature');
// // //     }
// // //   };

// // //   const shareSignature = async () => {
// // //     if (!signaturePath) {
// // //       Alert.alert('No signature', 'Please sign first');
// // //       return;
// // //     }

// // //     try {
// // //       await Share.share({
// // //         url: `file://${signaturePath}`,
// // //         title: 'Cocoliving Contract Signature',
// // //         message: 'Signed contract for Cocoliving',
// // //       });
// // //     } catch (error) {
// // //       console.error(error);
// // //     }
// // //   };

// // //   return (
// // //     <View style={styles.container}>
// // //       <StatusBar backgroundColor="#1E3A8A" barStyle="light-content" />

// // //       {/* Header */}
// // //       <View style={styles.header}>
// // //         <Text style={styles.headerTitle}>Cocoliving</Text>
// // //         <Text style={styles.headerSubtitle}>
// // //           Digital Contract Agreement
// // //         </Text>
// // //       </View>

// // //       {/* Static contract text (non-scrollable) */}
// // //       <View style={styles.contractBox}>
// // //         <Text style={styles.contractText}>
// // //           By signing below, you confirm that you have read and agreed
// // //           to all terms and conditions set forth by Cocoliving. This
// // //           digital signature is legally binding.
// // //         </Text>
// // //       </View>

// // //       {/* Signature Area */}
// // //       <View style={styles.signatureCard}>
// // //         <Text style={styles.signatureTitle}>Signature</Text>

// // //         <View style={styles.signatureBox}>
// // //           <Signature
// // //             ref={signatureRef}
// // //             onOK={saveSignature}
// // //             autoClear={false}
// // //             descriptionText=""
// // //             webStyle={`
// // //               .m-signature-pad--footer { display: none; }
// // //               body, html {
// // //                 touch-action: none;
// // //               }
// // //             `}
// // //           />
// // //         </View>

// // //         <View style={styles.actions}>
// // //           <TouchableOpacity
// // //             style={styles.clearBtn}
// // //             onPress={() =>
// // //               signatureRef.current?.clearSignature()
// // //             }
// // //           >
// // //             <Text style={styles.clearText}>Clear</Text>
// // //           </TouchableOpacity>

// // //           <TouchableOpacity
// // //             style={styles.saveBtn}
// // //             onPress={() =>
// // //               signatureRef.current?.readSignature()
// // //             }
// // //           >
// // //             <Text style={styles.saveText}>
// // //               Save Signature
// // //             </Text>
// // //           </TouchableOpacity>
// // //         </View>
// // //       </View>

// // //       {/* Share */}
// // //       <TouchableOpacity
// // //         style={[
// // //           styles.shareBtn,
// // //           !signaturePath && { opacity: 0.5 },
// // //         ]}
// // //         disabled={!signaturePath}
// // //         onPress={shareSignature}
// // //       >
// // //         <Text style={styles.shareText}>
// // //           Share Signed Agreement
// // //         </Text>
// // //       </TouchableOpacity>
// // //     </View>
// // //   );
// // // };

// // // export default ContractSignScreen;

// // // const styles = StyleSheet.create({
// // //   container: {
// // //     flex: 1,
// // //     backgroundColor: '#F5F7FB',
// // //   },

// // //   header: {
// // //     padding: 20,
// // //     backgroundColor: '#1E3A8A',
// // //   },
// // //   headerTitle: {
// // //     color: '#FFFFFF',
// // //     fontSize: 22,
// // //     fontWeight: '700',
// // //   },
// // //   headerSubtitle: {
// // //     color: '#DCE3F1',
// // //     marginTop: 4,
// // //     fontSize: 14,
// // //   },

// // //   contractBox: {
// // //     backgroundColor: '#FFFFFF',
// // //     margin: 16,
// // //     padding: 14,
// // //     borderRadius: 8,
// // //     elevation: 1,
// // //   },
// // //   contractText: {
// // //     fontSize: 13,
// // //     color: '#374151',
// // //     lineHeight: 18,
// // //   },

// // //   signatureCard: {
// // //     flex: 1,
// // //     backgroundColor: '#FFFFFF',
// // //     marginHorizontal: 16,
// // //     padding: 16,
// // //     borderRadius: 10,
// // //     elevation: 2,
// // //   },
// // //   signatureTitle: {
// // //     fontSize: 15,
// // //     fontWeight: '600',
// // //     marginBottom: 8,
// // //     color: '#111827',
// // //   },
// // //   signatureBox: {
// // //     flex: 1,
// // //     borderWidth: 1,
// // //     borderColor: '#D1D5DB',
// // //     borderRadius: 8,
// // //     overflow: 'hidden',
// // //   },

// // //   actions: {
// // //     flexDirection: 'row',
// // //     marginTop: 12,
// // //   },
// // //   clearBtn: {
// // //     flex: 1,
// // //     marginRight: 8,
// // //     padding: 12,
// // //     backgroundColor: '#E5E7EB',
// // //     borderRadius: 6,
// // //     alignItems: 'center',
// // //   },
// // //   clearText: {
// // //     color: '#111827',
// // //     fontWeight: '500',
// // //   },
// // //   saveBtn: {
// // //     flex: 1,
// // //     padding: 12,
// // //     backgroundColor: '#16A34A',
// // //     borderRadius: 6,
// // //     alignItems: 'center',
// // //   },
// // //   saveText: {
// // //     color: '#FFFFFF',
// // //     fontWeight: '600',
// // //   },

// // //   shareBtn: {
// // //     margin: 16,
// // //     padding: 16,
// // //     backgroundColor: '#1E3A8A',
// // //     borderRadius: 8,
// // //     alignItems: 'center',
// // //   },
// // //   shareText: {
// // //     color: '#FFFFFF',
// // //     fontSize: 15,
// // //     fontWeight: '600',
// // //   },
// // // });




