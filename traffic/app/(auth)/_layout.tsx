// app/layout.tsx or app/_layout.tsx depending on routing system
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
// keep native splash visible until ready

// Create a client

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  ); // render your actual app layout
}
