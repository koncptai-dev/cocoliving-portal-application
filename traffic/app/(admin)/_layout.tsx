// app/layout.tsx or app/_layout.tsx depending on routing system
import React, { useEffect, useState } from "react";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/libs/authContext";
// keep native splash visible until ready

// Create a client

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect href="/(auth)" />;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dutyVerification" />
    </Stack>
  ); // render your actual app layout
}
