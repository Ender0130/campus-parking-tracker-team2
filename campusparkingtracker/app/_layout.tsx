import { LogBox, ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack, Redirect, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";

LogBox.ignoreLogs(["Snapshotting a view"]);

function LoadingScreen() {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  const firstSegment = segments[0];
  const inLoginScreen = firstSegment === "login";
  const inAuthCallback = firstSegment === "auth";

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user && !inLoginScreen && !inAuthCallback) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="auth/confirm" />
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

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
