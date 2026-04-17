import Constants from "expo-constants";

// Central API config
const extra = Constants.expoConfig?.extra ?? {};
export const API_BASE = extra.apiBaseUrl || "http://127.0.0.1:5001";

// Types
export type LotStatus = "AVAILABLE" | "LIMITED" | "FULL";

export type Lot = {
  name: string;
  status: LotStatus;
  color: string;
  last_updated: string;
  total_spots: number;
};

export type ReportPayload = {
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
export async function fetchLots(): Promise<Lot[]> {
  const res = await fetch(`${API_BASE}/lots`);
  if (!res.ok) throw new Error(`GET /lots failed: ${res.status}`);
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