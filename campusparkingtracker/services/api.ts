import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};
const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl ?? "";

function getApiBaseUrl(): string {
  const apiBaseUrl = configuredBaseUrl.trim().replace(/\/+$/, "");

  if (!apiBaseUrl) {
    throw new Error(
      "Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL to your backend URL, for example http://192.168.1.50:5001"
    );
  }

  return apiBaseUrl;
}

export const API_BASE = getApiBaseUrl();

// Types
export type CampusCode = "SDSU" | "UCSD" | "CSUSM";
export type LotStatus = "AVAILABLE" | "LIMITED" | "FULL";

export type Lot = {
  name: string;
  status: LotStatus;
  color: string;
  last_updated: string;
  total_spots: number;
};

export type ReportPayload = {
  campus: CampusCode;
  lot_name: string;
  status: LotStatus;
  reporter: string;
};

export type ReportResponse = {
  success: boolean;
  status?: LotStatus;
  color?: string;
  last_updated?: string;
  error?: string;
};

// Fetch all lots from the backend
export async function fetchLots(campus: CampusCode): Promise<Lot[]> {
  const res = await fetch(`${API_BASE}/lots?campus=${encodeURIComponent(campus)}`);
  if (!res.ok) {
    throw new Error(`GET /lots failed: ${res.status}`);
  }
  return res.json();
}

// Submit a crowd-sourced availability report
export async function submitReport(
  payload: ReportPayload
): Promise<ReportResponse> {
  const res = await fetch(`${API_BASE}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return res.json();
}
