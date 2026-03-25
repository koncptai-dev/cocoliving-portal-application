// PaymentWebViewScreen.js
import React from 'react';
import { SafeAreaView, ActivityIndicator, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import axios from 'axios';

// सुनिश्चित करें कि यह BASE URL एकदम सटीक हो
const PHONEPE_REDIRECT_URL_BASE = "https://www.cocoliving.in/payment/redirect";
const BASE_URL = "https://www.cocoliving.in"; 

const PaymentWebViewScreen = ({ route, navigation }) => {
  const { redirectUrl, orderId, userToken } = route.params; 

  const handleWebViewNavigationStateChange = async (navState) => {
    
    // URL से query parameters और trailing slash हटाएँ
    const cleanUrl = navState.url.split('?')[0].replace(/\/$/, '');
    
    // 🔑 Fix: Clean URL को BASE से मैच करें
    if (cleanUrl.startsWith(PHONEPE_REDIRECT_URL_BASE.replace(/\/$/, ''))) {
      
      // 1. WebView को तुरंत बंद करें
      navigation.goBack(); 

      // 2. स्टेटस चेक API कॉल करें
      try {
        const statusRes = await axios.get(
          `${BASE_URL}/api/payments/status/${orderId}`, 
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        
        const paymentStatus = statusRes.data.paymentStatus; 
        
        if (paymentStatus === 'SUCCESS') {
          navigation.replace("BookingSuccessScreen", { /* Data */ });
        } else {
          navigation.replace("PaymentFailedScreen", { reason: paymentStatus || "Payment failed." });
        }
        
      } catch (error) {
        navigation.replace("PaymentFailedScreen", { 
            reason: "Failed to verify payment status.",
            detail: error.response?.status === 401 ? "Session expired." : "Network error."
        });
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <WebView
          source={{ uri: redirectUrl }}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <ActivityIndicator size="large" color="#3C2A1E" style={styles.loading} />
          )}
          setSupportMultipleWindows={false} 
          javaScriptEnabled={true}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }
});

export default PaymentWebViewScreen;