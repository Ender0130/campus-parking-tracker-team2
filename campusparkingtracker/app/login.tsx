import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }
    setLoading(true);

    if (mode === "login") {
      const success = await login(username.trim(), password);
      setLoading(false);
      if (success) {
        router.replace("/");
      } else {
        Alert.alert("Login Failed", "Invalid username or password");
      }
    } else {
      const result = await register(username.trim(), password);
      setLoading(false);
      if (result.success) {
        setMode("login");
        setPassword("");
        Alert.alert("Account Created", "You can now sign in with your new account.");
      } else {
        Alert.alert("Sign Up Failed", result.error || "Could not create account");
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Campus Park</Text>
        <Text style={styles.subtitle}>
          {mode === "login" ? "Sign in to your account" : "Create a new account"}
        </Text>

        {/* Toggle tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === "login" && styles.tabActive]}
            onPress={() => setMode("login")}
          >
            <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === "register" && styles.tabActive]}
            onPress={() => setMode("register")}
          >
            <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 32, fontWeight: "700", color: "#1a1a2e", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#888", marginBottom: 24 },
  tabs: {
    flexDirection: "row",
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 15, fontWeight: "600", color: "#9CA3AF" },
  tabTextActive: { color: "#4F46E5" },
  input: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fafafa",
  },
  btn: { backgroundColor: "#4F46E5", borderRadius: 12, padding: 18, alignItems: "center" },
  btnDisabled: { backgroundColor: "#9CA3AF" },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});