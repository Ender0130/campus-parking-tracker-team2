import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { getAuthRedirectUrl } from "../lib/authRedirect";

type User = {
  id: string;
  email: string;
};

type AuthResult = {
  success: boolean;
  error?: string;
  message?: string;
  needsEmailConfirmation?: boolean;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  passwordRecovery: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function toAppUser(user: SupabaseUser | null | undefined): User | null {
  if (!user?.email) return null;
  return { id: user.id, email: user.email };
}

function cleanEmail(email: string) {
  return email.trim().toLowerCase();
}

function friendlyAuthError(message?: string) {
  if (!message) return "Authentication failed. Please try again.";

  const lower = message.toLowerCase();

  if (lower.includes("email not confirmed")) {
    return "Email not confirmed yet. For development, turn Supabase Confirm email OFF. For real email testing, open the confirmation email first.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password. If Confirm email is ON, confirm the email first. If you are just testing locally, turn Confirm email OFF in Supabase.";
  }

  if (lower.includes("password should be at least") || lower.includes("password must be at least")) {
    return "Password must be at least 6 characters.";
  }

  if (lower.includes("already registered") || lower.includes("already been registered") || lower.includes("user already registered")) {
    return "An account already exists for this email. Sign in instead, or use a new email alias for testing.";
  }

  if (lower.includes("email address not authorized")) {
    return "Supabase refused to send the auth email. For local development, turn Confirm email OFF. For real email delivery, configure Custom SMTP.";
  }

  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Supabase email rate limit hit. For local development, turn Confirm email OFF or wait before trying again.";
  }

  if (lower.includes("fetch") || lower.includes("network")) {
    return "Network error talking to Supabase. Check the Supabase URL/key in .env and your internet connection.";
  }

  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error("Supabase getSession error:", error.message);
      setSession(data.session ?? null);
      setUser(toAppUser(data.session?.user));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(toAppUser(nextSession?.user));
      setLoading(false);

      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      if (event === "SIGNED_IN") setPasswordRecovery(false);
      if (event === "SIGNED_OUT") setPasswordRecovery(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail(email),
        password,
      });
      if (error) return { success: false, error: friendlyAuthError(error.message) };
      return { success: true, message: "Signed in." };
    } catch (e) {
      return { success: false, error: friendlyAuthError(e instanceof Error ? e.message : undefined) };
    }
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail(email),
        password,
        options: { emailRedirectTo: getAuthRedirectUrl("/auth/confirm") },
      });

      if (error) return { success: false, error: friendlyAuthError(error.message) };

      if (!data.session) {
        return {
          success: true,
          needsEmailConfirmation: true,
          message:
            "Signup reached Supabase. Confirm email is ON, so check your inbox. For local development, turn Confirm email OFF and sign up again to log in immediately.",
        };
      }

      return { success: true, message: "Account created and signed in." };
    } catch (e) {
      return { success: false, error: friendlyAuthError(e instanceof Error ? e.message : undefined) };
    }
  }, []);

  const resendConfirmation = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail(email),
        options: { emailRedirectTo: getAuthRedirectUrl("/auth/confirm") },
      });
      if (error) return { success: false, error: friendlyAuthError(error.message) };
      return { success: true, message: "Confirmation email requested. Check inbox and spam." };
    } catch (e) {
      return { success: false, error: friendlyAuthError(e instanceof Error ? e.message : undefined) };
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail(email), {
        redirectTo: getAuthRedirectUrl("/login"),
      });
      if (error) return { success: false, error: friendlyAuthError(error.message) };
      return { success: true, message: "Password reset email requested. Check inbox and spam." };
    } catch (e) {
      return { success: false, error: friendlyAuthError(e instanceof Error ? e.message : undefined) };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: friendlyAuthError(error.message) };
      setPasswordRecovery(false);
      return { success: true, message: "Password updated. You are signed in now." };
    } catch (e) {
      return { success: false, error: friendlyAuthError(e instanceof Error ? e.message : undefined) };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setPasswordRecovery(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      passwordRecovery,
      login,
      register,
      resendConfirmation,
      resetPassword,
      updatePassword,
      logout,
    }),
    [user, session, loading, passwordRecovery, login, register, resendConfirmation, resetPassword, updatePassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
