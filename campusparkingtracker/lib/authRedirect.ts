import { Platform } from "react-native";
import * as Linking from "expo-linking";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizePath(path: string) {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function getAuthRedirectUrl(path = "/login") {
  const configured = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();

  if (configured) {
    if (configured.endsWith("/login") || configured.includes("/auth/confirm")) {
      return configured;
    }
    return `${trimTrailingSlash(configured)}${normalizePath(path)}`;
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}${normalizePath(path)}`;
  }

  return Linking.createURL(path.replace(/^\//, ""));
}
