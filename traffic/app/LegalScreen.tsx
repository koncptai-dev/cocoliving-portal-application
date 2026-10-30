import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

type Props = {
  title: string;
  children: React.ReactNode;
};

const LegalScreen: React.FC<Props> = ({ title, children }) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const navigation = useNavigation();

  const theme = isDark ? darkStyles : lightStyles;

  return (
    <View style={[styles.container, theme.container]}>
      
      {/* Header */}
      <View style={[styles.header, theme.header]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, theme.text]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, theme.text]}>{title}</Text>

        <View style={{ width: 60 }} /> 
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {children}
      </ScrollView>
    </View>
  );
};

export default LegalScreen;

/* COMMON */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  back: {
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
});

/* LIGHT THEME */
const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: "#F5F5F5",
  },
  text: {
    color: "#000",
  },
});

/* DARK THEME */
const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
  },
  header: {
    backgroundColor: "#1E1E1E",
  },
  text: {
    color: "#FFFFFF",
  },
});