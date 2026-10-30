import React, { useEffect, useState, ReactNode } from "react";
import { StatusBar as RNStatusBar } from "react-native";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { WifiOff } from "lucide-react-native";

type Props = {
  children: ReactNode;
};

const NoInternetWrapper: React.FC<Props> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected =
        state.isConnected && state.isInternetReachable !== false;

      setIsConnected(!!connected);
    });

    return () => unsubscribe();
  }, []);

  if (!isConnected) {
    const isDark = colorScheme === "dark";
return (
  <View
    style={[
      StyleSheet.absoluteFillObject, // ✅ BEST full-screen fix
      {
        backgroundColor: isDark ? "#000" : "#F5F7FB",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      },
    ]}
  >
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? "#121A24" : "#FFFFFF" },
      ]}
    >
      <View style={styles.iconContainer}>
        <WifiOff
  size={60}
  color="#E53935"
  strokeWidth={2.2}
/>
      </View>

      <Text style={[styles.title, { color: isDark ? "#fff" : "#111" }]}>
        No Internet Connection
      </Text>

      <Text style={[styles.subtitle, { color: isDark ? "#AAB4C0" : "#555" }]}>
        Active internet connection is mandatory for duty operations.
      </Text>
    </View>
  </View>
);
    


    
  }

  return <>{children}</>;
};

export default NoInternetWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
//jj
  card: {
    width: "100%",
    maxWidth: 360,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",

    // shadow (professional UI feel)
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },

  iconContainer: {
    marginBottom: 16,
    backgroundColor: "rgba(229, 57, 53, 0.1)",
    padding: 18,
    borderRadius: 100,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
    gap: 6,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  footer: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.8,
  },
});

