import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function AuthConfirm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token_hash?: string; type?: string }>();
  const [message, setMessage] = useState("Confirming your email...");
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function confirm() {
      const tokenHash = Array.isArray(params.token_hash) ? params.token_hash[0] : params.token_hash;
      const type = Array.isArray(params.type) ? params.type[0] : params.type;

      if (!tokenHash || !type) {
        setMessage("Missing confirmation token. Open the newest Supabase email link and try again.");
        setFailed(true);
        setDone(true);
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any,
      });

      if (error) {
        setMessage(error.message);
        setFailed(true);
        setDone(true);
        return;
      }

      setMessage("Email confirmed. You can sign in now.");
      setFailed(false);
      setDone(true);
      setTimeout(() => router.replace("/login"), 1200);
    }

    confirm();
  }, [params.token_hash, params.type, router]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {!done && <ActivityIndicator size="large" color="#4F46E5" />}
        <Text style={[styles.message, failed && styles.error]}>{message}</Text>
        {done && (
          <TouchableOpacity style={styles.button} onPress={() => router.replace("/login")}>
            <Text style={styles.buttonText}>Go to Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 18 },
  message: { fontSize: 16, color: "#1a1a2e", textAlign: "center", lineHeight: 22 },
  error: { color: "#991B1B" },
  button: { backgroundColor: "#4F46E5", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
