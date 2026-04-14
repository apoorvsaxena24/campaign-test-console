import { useConfigStore } from "@/store/configStore";

export interface ApiClientOptions extends RequestInit {
  omitCredentials?: boolean;
}

function getConfig() {
  return useConfigStore.getState().app;
}

const isDev = import.meta.env.DEV;

export async function apiClient(
  path: string,
  options: ApiClientOptions = {},
): Promise<Response> {
  const config = getConfig();
  const { omitCredentials, ...init } = options;

  const cleanBase = config.apiBaseUrl.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");

  const baseHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  const method = (init.method ?? "GET").toUpperCase();
  if (!(init.body instanceof FormData) && method !== "GET" && method !== "HEAD") {
    baseHeaders["Content-Type"] = "application/json";
  }

  if (config.authMode === "basic" && config.apiKey && config.apiToken) {
    baseHeaders["Authorization"] = `Basic ${btoa(`${config.apiKey}:${config.apiToken}`)}`;
  }

  let url: string;
  if (isDev) {
    url = `/ctc-proxy/${cleanPath}`;
    baseHeaders["X-Target-Base"] = cleanBase;
  } else {
    url = `${cleanBase}/${cleanPath}`;
  }

  const res = await fetch(url, {
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
