import { Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";

const CTAButton = ({
  label,
  type,
  onPress,
  disabled,
}: {
  label: string;
  type: string;
  onPress: () => void;
  disabled: boolean;
}) => {
  switch (type) {
    case "bordered":
      return (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={{
            width: "100%",
            padding: 16,
            borderWidth: 1,
            borderColor: Colors.primary.color,
            backgroundColor: "white",
            alignItems: "center",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: Colors.primary.color }}>{label}</Text>
        </Pressable>
      );
    case "solid-small":
      return (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={{
            width: "100%",
            padding: 8,
            borderWidth: 1,
            backgroundColor: Colors.primary.color,

            alignItems: "center",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white" }}>{label}</Text>
        </Pressable>
      );

    default:
      return (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={{
            width: "100%",
            padding: 16,
            backgroundColor: disabled
              ? Colors.primary.text
              : Colors.primary.color,

            alignItems: "center",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white" }}>{label}</Text>
        </Pressable>
      );
  }
};

export default CTAButton;

const styles = StyleSheet.create({});
