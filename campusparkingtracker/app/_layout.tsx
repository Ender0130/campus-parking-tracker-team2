import { LogBox } from "react-native";
import { Stack, Redirect, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";

LogBox.ignoreLogs(["Snapshotting a view"]);

function RootLayoutNav() {
  const { user } = useAuth();
  const segments = useSegments();

  const inLoginScreen = segments[0] === "login";

  if (!user && !inLoginScreen) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="alerts" />
      <Stack.Screen name="history" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}