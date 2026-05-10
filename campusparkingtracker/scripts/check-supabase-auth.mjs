import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    const value = rest.join("=").trim().replace(/^["']|["']$/g, "");
    if (!process.env[key.trim()]) process.env[key.trim()] = value;
  }
}

function printUsage() {
  console.log("Usage:");
  console.log("  npm run auth:test -- signup you@example.com Password123");
  console.log("  npm run auth:test -- login you@example.com Password123");
  console.log("");
  console.log("For local dev, turn Supabase Confirm email OFF first.");
  console.log("For real email mode, turn Confirm email ON and expect signup to require an email click.");
}

function explainError(message) {
  const lower = String(message || "").toLowerCase();

  if (lower.includes("email address not authorized")) {
    console.log("");
    console.log("MEANING: Supabase accepted the auth request but refused to send the email.");
    console.log("DEV FIX: Turn Confirm email OFF and retry signup with a fresh email alias.");
    console.log("REAL EMAIL FIX: Configure Custom SMTP in Supabase.");
  }

  if (lower.includes("email not confirmed")) {
    console.log("");
    console.log("MEANING: Confirm email is ON and this user has not clicked the email link yet.");
    console.log("DEV FIX: Turn Confirm email OFF, delete this test user, and signup again.");
  }

  if (lower.includes("invalid login credentials")) {
    console.log("");
    console.log("FIX: Check the password. If the user was created while Confirm email was ON, confirm the email or delete/recreate after turning Confirm email OFF.");
  }
}

loadEnvFile(path.join(process.cwd(), ".env"));

const [mode, email, password] = process.argv.slice(2);

if (!mode || !email || !password || !["signup", "login"].includes(mode)) {
  printUsage();
  process.exit(1);
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const redirectBase = (process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL || "http://localhost:8081").replace(/\/+$/, "");
const redirectTo = `${redirectBase}/auth/confirm`;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

console.log("Supabase URL:", supabaseUrl);
console.log("Key starts:", supabaseKey.slice(0, 12) + "...");
console.log("Redirect URL:", redirectTo);
console.log("Mode:", mode);
console.log("Email:", email);
console.log("");

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

if (mode === "signup") {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    console.error("SIGNUP FAILED:", error.message);
    explainError(error.message);
    process.exit(1);
  }

  console.log("SIGNUP REQUEST ACCEPTED BY SUPABASE.");
  console.log("User id:", data.user?.id || "none returned");

  if (data.session?.access_token) {
    console.log("SESSION RETURNED. Good: Confirm email is OFF, so local login should work now.");
    console.log("Access token starts:", data.session.access_token.slice(0, 16) + "...");
  } else {
    console.log("NO SESSION RETURNED. This means Confirm email is ON.");
    console.log("If you want immediate local login, turn Confirm email OFF and create a fresh user.");
    console.log("If you want real email mode, check the inbox and spam folder now.");
  }
}

if (mode === "login") {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    console.error("LOGIN FAILED:", error.message);
    explainError(error.message);
    process.exit(1);
  }

  console.log("LOGIN WORKED.");
  console.log("User id:", data.user?.id || "none returned");
  console.log("Access token starts:", data.session?.access_token?.slice(0, 16) + "...");
}
