import { apiClient } from "./client";

export async function fetchConfig(): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient("v1/config");
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function validateSession(): Promise<{
  res: Response;
  json: unknown;
}> {
  const res = await apiClient("v1/auth/validate-session");
  const json = await res.json().catch(() => ({}));
  return { res, json };
}
