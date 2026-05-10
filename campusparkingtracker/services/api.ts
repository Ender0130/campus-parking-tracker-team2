import Constants from "expo-constants";
import { supabase } from "../lib/supabase";

const extra = Constants.expoConfig?.extra ?? {};

export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  extra.apiBaseUrl ||
  "http://127.0.0.1:5001";

export type CampusCode = "SDSU" | string;

export type LotStatus = "AVAILABLE" | "LIMITED" | "FULL";

export type Lot = {
  name: string;
  status: LotStatus;
  color: string;
  last_updated: string;
  total_spots: number;
};

export type LotsResponse = {
  success?: boolean;
  points?: number;
  lots?: Lot[];
  error?: string;
};

export type ReportPayload = {
  campus: CampusCode;
  lot_name: string;
  status: LotStatus;
  reporter?: string;
};

export type ReportResponse = {
  success: boolean;
  campus?: string;
  points?: number;
  lot?: Lot;
  status?: LotStatus;
  color?: string;
  last_updated?: string;
  error?: string;
};

export type MeResponse = {
  success: boolean;
  user?: {
    id: string;
    email?: string;
  };
  points?: number;
  error?: string;
};

export class ApiError extends Error {
  status: number;
  points?: number;

  constructor(message: string, status: number, points?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.points = points;
  }
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new ApiError(error.message, 401);
  }

  const token = data.session?.access_token;

  if (!token) {
    throw new ApiError("You are not signed in.", 401);
  }

  return token;
}

async function parseJsonResponse(res: Response) {
  const text = await res.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);

  headers.set("Authorization", `Bearer ${token}`);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await parseJsonResponse(res);

  if (!res.ok) {
    const detailParts = [
      data.details,
      data.remote_details,
      data.fallback_details,
    ].filter(Boolean);

    const baseMessage =
      data.error || `${options.method || "GET"} ${path} failed: ${res.status}`;

    const fullMessage = detailParts.length
      ? `${baseMessage} Details: ${detailParts.join(" | ")}`
      : baseMessage;

    throw new ApiError(fullMessage, res.status, data.points);
  }

  return data;
}

export async function fetchMe(): Promise<MeResponse> {
  return apiFetch("/me");
}

export async function fetchLots(
  campus: CampusCode,
  _reporter?: string
): Promise<LotsResponse> {
  const url = `/lots?campus=${encodeURIComponent(campus)}`;
  const data = await apiFetch(url);

  if (Array.isArray(data)) {
    return {
      success: true,
      lots: data,
      points: undefined,
    };
  }

  return data;
}

export async function submitReport(
  payload: ReportPayload
): Promise<ReportResponse> {
  return apiFetch("/report", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
