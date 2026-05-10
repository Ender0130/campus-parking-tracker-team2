import { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { getPublicSupabaseDiagnostics } from "../lib/supabase";
import { getAuthRedirectUrl } from "../lib/authRedirect";

type Notice = {
  type: "success" | "error" | "info";
  text: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function Login() {
  const { login, register, resendConfirmation, resetPassword, updatePassword, passwordRecovery } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const cleanEmail = email.trim().toLowerCase();

  const diagnostics = useMemo(() => getPublicSupabaseDiagnostics(), []);
  const redirectUrl = useMemo(() => getAuthRedirectUrl("/login"), []);

  function show(type: Notice["type"], text: string) {
    setNotice({ type, text });
  }

  function validateEmailPassword() {
    if (!cleanEmail || !password) {
      show("error", "Enter your email and password.");
      return false;
    }

    if (!isValidEmail(cleanEmail)) {
      show("error", "Enter a real email address like name@example.com.");
      return false;
    }

    if (password.length < 6) {
      show("error", "Password must be at least 6 characters.");
      return false;
    }

    if (mode === "register" && password !== confirmPassword) {
      show("error", "Passwords do not match.");
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    setNotice(null);

    if (passwordRecovery) {
      if (!password || !confirmPassword) {
        show("error", "Enter and confirm your new password.");
        return;
      }

      if (password.length < 6) {
        show("error", "Password must be at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        show("error", "Passwords do not match.");
        return;
      }

      setLoading(true);
      const result = await updatePassword(password);
      setLoading(false);

      if (result.success) {
        setPassword("");
        setConfirmPassword("");
        show("success", result.message ?? "Password updated.");
        router.replace("/");
      } else {
        show("error", result.error || "Could not update password.");
      }
      return;
    }

    if (!validateEmailPassword()) return;

    setLoading(true);

    if (mode === "login") {
      const result = await login(cleanEmail, password);
      setLoading(false);

      if (result.success) {
        setPassword("");
        show("success", "Signed in.");
        router.replace("/");
      } else {
        show("error", result.error || "Invalid email or password.");
      }
    } else {
      const result = await register(cleanEmail, password);
      setLoading(false);

      if (result.success) {
        setPassword("");
        setConfirmPassword("");

        if (result.needsEmailConfirmation) {
          setMode("login");
          show("success", result.message ?? "Check your email, confirm your account, then sign in.");
        } else {
          show("success", result.message ?? "Account created.");
          router.replace("/");
        }
      } else {
        show("error", result.error || "Could not create account.");
      }
    }
  }

  async function handleResendConfirmation() {
    setNotice(null);

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      show("error", "Type your email address first, then tap Resend confirmation.");
      return;
    }

    setLoading(true);
    const result = await resendConfirmation(cleanEmail);
    setLoading(false);

    if (result.success) {
      show("success", result.message ?? "Confirmation email requested.");
    } else {
      show("error", result.error || "Could not request confirmation email.");
    }
  }

  async function handleForgotPassword() {
    setNotice(null);

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      show("error", "Type your email address first, then tap Forgot password.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(cleanEmail);
    setLoading(false);

    if (result.success) {
      show("success", result.message ?? "Password reset email sent.");
    } else {
      show("error", result.error || "Could not send reset email.");
    }
  }

  const title = passwordRecovery
    ? "Create a new password"
    : mode === "login"
      ? "Sign in with email"
      : "Create account with email";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Campus Park</Text>
        <Text style={styles.subtitle}>{title}</Text>

        {!passwordRecovery && (
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === "login" && styles.tabActive]}
              onPress={() => {
                setMode("login");
                setNotice(null);
              }}
            >
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "register" && styles.tabActive]}
              onPress={() => {
                setMode("register");
                setNotice(null);
              }}
            >
              <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!passwordRecovery && (
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder={passwordRecovery ? "New password" : "Password"}
          secureTextEntry
          textContentType={passwordRecovery ? "newPassword" : "password"}
          value={password}
          onChangeText={setPassword}
        />

        {(passwordRecovery || mode === "register") && (
          <TextInput
            style={styles.input}
            placeholder={passwordRecovery ? "Confirm new password" : "Confirm password"}
            secureTextEntry
            textContentType="newPassword"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        )}

        {notice && (
          <View
            style={[
              styles.notice,
              notice.type === "error" && styles.noticeError,
              notice.type === "success" && styles.noticeSuccess,
            ]}
          >
            <Text
              style={[
                styles.noticeText,
                notice.type === "error" && styles.noticeTextError,
                notice.type === "success" && styles.noticeTextSuccess,
              ]}
            >
              {notice.text}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading
              ? "Please wait..."
              : passwordRecovery
                ? "Update Password"
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
          </Text>
        </TouchableOpacity>

        {!passwordRecovery && mode === "login" && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        {!passwordRecovery && mode === "login" && (
          <TouchableOpacity
            style={styles.linkButtonCompact}
            onPress={handleResendConfirmation}
            disabled={loading}
          >
            <Text style={styles.linkText}>Resend confirmation email</Text>
          </TouchableOpacity>
        )}

        {!passwordRecovery && mode === "register" && (
          <Text style={styles.helpText}>
            
          </Text>
        )}

        <TouchableOpacity style={styles.debugToggle} onPress={() => setShowDebug((v) => !v)}>
          <Text style={styles.debugToggleText}>{showDebug ? "Hide" : "Show"} auth debug info</Text>
        </TouchableOpacity>

        {showDebug && (
          <View style={styles.debugBox}>
            <Text style={styles.debugLine}>Platform: {Platform.OS}</Text>
            <Text style={styles.debugLine}>Supabase URL: {diagnostics.supabaseUrl}</Text>
            <Text style={styles.debugLine}>Key starts: {diagnostics.keyStartsWith}...</Text>
            <Text style={styles.debugLine}>Page origin: {diagnostics.origin}</Text>
            <Text style={styles.debugLine}>Redirect: {redirectUrl}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
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
  notice: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  noticeError: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  noticeSuccess: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  noticeText: { color: "#3730A3", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  noticeTextError: { color: "#991B1B" },
  noticeTextSuccess: { color: "#065F46" },
  btn: { backgroundColor: "#4F46E5", borderRadius: 12, padding: 18, alignItems: "center" },
  btnDisabled: { backgroundColor: "#9CA3AF" },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  linkButton: { alignItems: "center", paddingTop: 18, paddingBottom: 8 },
  linkButtonCompact: { alignItems: "center", paddingVertical: 8 },
  linkText: { color: "#4F46E5", fontSize: 15, fontWeight: "700" },
  helpText: { color: "#6B7280", fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: "center" },
  debugToggle: { alignItems: "center", marginTop: 18, paddingVertical: 8 },
  debugToggleText: { color: "#6B7280", fontSize: 13, fontWeight: "700" },
  debugBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  debugLine: { color: "#374151", fontSize: 12, lineHeight: 18 },
});
