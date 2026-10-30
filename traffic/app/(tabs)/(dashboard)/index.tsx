import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";

export default function DashboardScreen() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          <Pressable
            onPress={() => {
              router.push("/applyLeaveScreen");
            }}
            style={{
              padding: 8,
              // borderWidth: 1,
              // borderColor: "gray",
              borderRadius: 8,
              width: "100%",
              alignItems: "center",
              backgroundColor: "#eb542a",
            }}
          >
            <Text style={{ color: "white", fontSize: 16 }}>
              {t("apply-for-leave")}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
});
