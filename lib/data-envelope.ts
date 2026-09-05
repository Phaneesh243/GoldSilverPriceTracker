export type DataStatus = "available" | "delayed" | "stale" | "unavailable";

export type DataEnvelope<T> = {
  data: T;
  status: DataStatus;
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  asOf: string | null;
  timezone: "UTC";
  delaySeconds: number | null;
  error?: string;
};

export function availableData<T>(data: T, source: string, sourceUrl: string, asOf: string | null = null, delaySeconds: number | null = null): DataEnvelope<T> {
  return { data, status: delaySeconds && delaySeconds > 0 ? "delayed" : "available", source, sourceUrl, fetchedAt: new Date().toISOString(), asOf, timezone: "UTC", delaySeconds };
}

export function unavailableData<T>(source: string, sourceUrl: string, error: string, data: T): DataEnvelope<T> {
  return { data, status: "unavailable", source, sourceUrl, fetchedAt: new Date().toISOString(), asOf: null, timezone: "UTC", delaySeconds: null, error };
}

export function formatAsOf(value: string | null | undefined) {
  if (!value) return "As-of time unavailable";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? "Updated " + date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST" : "As-of time unavailable";
}
