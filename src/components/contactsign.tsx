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

/* ================== CONFIG ================== */
const API_BASE = 'https://staging.cocoliving.in/api';
const BASE_URL = 'https://staging.cocoliving.in';

/* ================== HELPERS ================== */
const buildPdfUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};

const ContractSignScreen = () => {
  const { user } = useAuth();

  const tenantSignatureRef = useRef<any>(null);
  const guardianSignatureRef = useRef<any>(null);
  const route = useRoute();
const bookingIdFromRoute = route?.params?.bookingId;

  const [bookingId, setBookingId] = useState(bookingIdFromRoute || '');
  const [contractLoaded, setContractLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signed, setSigned] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(null);

  const [tenantSignaturePath, setTenantSignaturePath] = useState<string | null>(null);
  const [guardianSignaturePath, setGuardianSignaturePath] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2>(1);

  /* ================== FETCH CONTRACT ================== */
  const fetchContract = async () => {
    if (!bookingId) {
      Alert.alert('Please enter booking ID');
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
      setStep(1);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  /* ================== SAVE SIGNATURE ================== */
  const saveSignature = async (signature: string, type: 'tenant' | 'guardian') => {
    const base64Data = signature.replace('data:image/png;base64,', '');
    const path = `${RNFS.DocumentDirectoryPath}/${type}_signature.png`;
    await RNFS.writeFile(path, base64Data, 'base64');

    if (type === 'tenant') {
      setTenantSignaturePath(path);
      setTimeout(() => setStep(2), 300);
    }

    if (type === 'guardian') {
      setGuardianSignaturePath(path);
    }
  };


  useEffect(() => {
  if (bookingIdFromRoute) {
    setBookingId(String(bookingIdFromRoute));
    fetchContract();
  }
}, []);

  /* ================== SIGN CONTRACT ================== */
  const signContract = async () => {
    if (!tenantSignaturePath || !guardianSignaturePath) {
      Alert.alert('Both signatures are required');
      return;
    }

    const formData = new FormData();

    formData.append('tenantSignature', {
      uri: `file://${tenantSignaturePath}`,
      type: 'image/png',
      name: 'tenant_signature.png',
    } as any);

    formData.append('guardianSignature', {
      uri: `file://${guardianSignaturePath}`,
      type: 'image/png',
      name: 'guardian_signature.png',
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

      Alert.alert('Success', 'Contract signed successfully\nCheck your Email');

      setSigned(true);
      setContractUrl(buildPdfUrl(res.data?.fileUrl));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to sign contract');
    } finally {
      setLoading(false);
    }
  };

  /* ================== PDF VIEW ================== */
  if (signed && contractUrl) {
    const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
      contractUrl
    )}`;

    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <WebView
          source={{ uri: googleViewerUrl }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#1E3A8A" />
            </View>
          )}
          style={{ flex: 1 }}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
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
  if (step === 1) {
    return (
      <View style={styles.fullScreen}>
        <Text style={styles.stepTitle}>Step 1 of 2</Text>
        <Text style={styles.stepSubtitle}>Tenant Signature</Text>

        <View style={styles.signatureFull}>
          <Signature
            ref={tenantSignatureRef}
            onOK={(sig) => saveSignature(sig, 'tenant')}
            autoClear={false}
            descriptionText=""
            webStyle={`.m-signature-pad--footer { display: none; }`}
          />
        </View>

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
            <Text style={{ color: '#fff' }}>Save & Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ================== STEP 2: GUARDIAN SIGN ================== */
  return (
    <View style={styles.fullScreen}>
      <Text style={styles.stepTitle}>Step 2 of 2</Text>
      <Text style={styles.stepSubtitle}>Guardian Signature</Text>

      <View style={styles.signatureFull}>
        <Signature
          ref={guardianSignatureRef}
          onOK={(sig) => saveSignature(sig, 'guardian')}
          autoClear={false}
          descriptionText=""
          webStyle={`.m-signature-pad--footer { display: none; }`}
        />
      </View>

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
          <Text style={{ color: '#fff' }}>Save</Text>
        </TouchableOpacity>
      </View>

      {guardianSignaturePath && (
        <TouchableOpacity style={styles.signBtn} onPress={signContract}>
          <Text style={styles.signText}>Submit Contract</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ContractSignScreen;

/* ================== STYLES ================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { padding: 20, backgroundColor: '#1E3A8A' },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '700' },
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

  row: { flexDirection: 'row', marginTop: 20 },

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

  signBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    alignItems: 'center',
  },

  signText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});







