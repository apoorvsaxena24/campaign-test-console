import { useConfigStore } from "@/store/configStore";

export interface ApiClientOptions extends RequestInit {
  omitCredentials?: boolean;
}

function getConfig() {
  return useConfigStore.getState().app;
}

export async function apiClient(
  path: string,
  options: ApiClientOptions = {},
): Promise<Response> {
  const config = getConfig();
  const { omitCredentials, ...init } = options;

  const cleanBase = config.apiBaseUrl.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");

  const proxyUrl = `/ctc-proxy/${cleanPath}`;

  const baseHeaders: Record<string, string> = {
    Accept: "application/json",
    "X-Target-Base": cleanBase,
  };

  const method = (init.method ?? "GET").toUpperCase();
  if (!(init.body instanceof FormData) && method !== "GET" && method !== "HEAD") {
    baseHeaders["Content-Type"] = "application/json";
  }

  if (config.authMode === "basic" && config.apiKey && config.apiToken) {
    baseHeaders["Authorization"] = `Basic ${btoa(`${config.apiKey}:${config.apiToken}`)}`;
  }

  const res = await fetch(proxyUrl, {
    ...init,
    credentials: omitCredentials ? "same-origin" : "include",
    headers: { ...baseHeaders, ...init.headers },
  });

  return res;
}

export async function apiClientJson<T = unknown>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const res = await apiClient(path, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}
