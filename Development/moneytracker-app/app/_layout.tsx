import { AuthProvider } from "@/context/AuthContext";
import { initializeDatabase } from "@/db/init";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    // Initialize SQLite database on app start
    initializeDatabase().catch((err) =>
      console.error("[App] Failed to initialize database:", err)
    );
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
