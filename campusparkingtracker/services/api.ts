// ─── Central API config ────────────────────────────────────────────────────
// Change this to your machine's LAN IP when testing on a physical device.
// "localhost" only works in iOS Simulator / Android Emulator.
export const API_BASE = "http://127.0.0.1:5001";

// ─── Types ──────────────────────────────────────────────────────────────────
export type LotStatus = "AVAILABLE" | "LIMITED" | "FULL";

export type Lot = {
  name: string;
  status: LotStatus;
  color: string;          // hex returned by the backend
  last_updated: string;   // ISO string
  total_spots: number;
};

export type ReportPayload = {
  lot_name: string;
  status: LotStatus;
  reporter: string;       // e.g. a device ID or username
};

export type ReportResponse = {
  success: boolean;
  status?: LotStatus;
  color?: string;
  last_updated?: string;
  error?: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Fetch all lots from the backend. */
export async function fetchLots(): Promise<Lot[]> {
  const res = await fetch(`${API_BASE}/lots`);
  if (!res.ok) throw new Error(`GET /lots failed: ${res.status}`);
  return res.json();
}

/** Submit a crowd-sourced availability report. */
export async function submitReport(payload: ReportPayload): Promise<ReportResponse> {
  const res = await fetch(`${API_BASE}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
