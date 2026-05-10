import Constants from "expo-constants";

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
  reporter: string;
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

export async function fetchLots(
  campus: CampusCode,
  reporter: string
): Promise<LotsResponse> {
  const url = `${API_BASE}/lots?campus=${encodeURIComponent(
    campus
  )}&reporter=${encodeURIComponent(reporter)}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      data.error || `GET /lots failed: ${res.status}`,
      res.status,
      data.points
    );
  }

  // Supports both old backend shape: Lot[]
  // and new points backend shape: { lots, points }
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
  const res = await fetch(`${API_BASE}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      data.error || `POST /report failed: ${res.status}`,
      res.status,
      data.points
    );
  }

  return data;
}
