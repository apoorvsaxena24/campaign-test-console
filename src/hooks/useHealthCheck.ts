import { useCallback } from "react";
import { useHealthCheckStore } from "@/store/healthCheckStore";
import { useConfigStore } from "@/store/configStore";
import type { EndpointCheck, EndpointCategory } from "@/types/api";
import { apiClient } from "@/api/client";
import {
  smsTemplatesPath,
  smsDltEntitiesPath,
  smsSenderIdMapsPath,
  messageCampaignsPath,
  listsPath,
  contactsPath,
  wabasPath,
  wabaNumbersPath,
  whatsappTemplatesPath,
  csvUploadPath,
} from "@/api/paths";

interface CheckDef {
  id: string;
  name: string;
  method: string;
  pathFn: () => string;
  category: EndpointCategory;
  description: string;
  validate: (json: unknown, status: number) => string[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function assertOk(status: number): string[] {
  return status >= 200 && status < 300 ? [] : [`Expected 2xx, got ${status}`];
}

function assertArray(json: any): string[] {
  const data = json;
  const unwrapped =
    data?.data?.response ?? data?.data ?? data?.response ?? data;
  if (Array.isArray(unwrapped)) return [];
  if (typeof unwrapped === "object" && unwrapped !== null) {
    const possibleArrays = Object.values(unwrapped).filter(Array.isArray);
    if (possibleArrays.length > 0) return [];
  }
  return ["Response does not contain an array"];
}

function tryMsg(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const o = json as Record<string, unknown>;
  const msg =
    o.message ?? o.error ?? (o.data as any)?.message ?? (o.data as any)?.error ?? "";
  return typeof msg === "string" ? msg : "";
}

function getFixHint(
  checkId: string,
  httpCode: number | null,
  error: string | null,
  responseBody: unknown,
): string {
  const apiMsg = tryMsg(responseBody);
  const msgLine = apiMsg ? `\nBackend says: "${apiMsg}"` : "";

  if (error?.includes("Failed to fetch") || error?.includes("Proxy error")) {
    return `The backend is unreachable. Check that:\n• The Base URL in Configuration is correct\n• The backend server is running and reachable from this machine\n• There are no firewall / VPN issues`;
  }

  if (httpCode === 401 || httpCode === 403) {
    return `Authentication failed (${httpCode}).${msgLine}\n\nFix:\n• If using Cookie auth: open the Engage UI in the same browser, log in, then retry here\n• If using Basic auth: go to Configuration → set correct API Key and API Token\n• Verify the Account SID matches a real account on the backend`;
  }

  if (httpCode === 404) {
    const sid = useConfigStore.getState().app.accountSid;
    return `Endpoint not found (404).${msgLine}\n\nFix:\n• Verify Account SID "${sid || "(empty)"}" is correct — a wrong SID makes the URL path invalid\n• Check that the Base URL points to the right environment (QA, staging, prod)\n• Confirm this API is deployed on the target backend`;
  }

  if (httpCode === 400) {
    const base = `Bad Request (400).${msgLine}\n\nFix:`;
    switch (checkId) {
      case "config":
        return `${base}\n• This endpoint doesn't require an Account SID — it should always work if the Base URL is correct\n• Double-check the Base URL in Configuration (should NOT have a trailing path like /v1)\n• Try opening ${useConfigStore.getState().app.apiBaseUrl}/v1/config in your browser directly`;
      case "session":
        return `${base}\n• This validates your auth session — make sure you're logged into the Engage UI in this browser first (for Cookie auth)\n• For Basic auth: ensure API Key + Token are set correctly in Configuration\n• The backend may require specific session cookies — try opening the Engage UI, logging in, then re-running this check`;
      case "sms-templates":
      case "sms-dlt-entities":
      case "sms-sender-ids":
        return `${base}\n• Verify Account SID is correct in Configuration\n• Check that SMS is enabled for this account on the backend\n• Ensure the Base URL points to the correct environment`;
      case "sms-campaign-list":
        return `${base}\n• Verify Account SID is correct\n• The ?channel=sms query param may not be supported — check backend API docs`;
      case "sms-csv-upload":
      case "csv-upload-list":
        return `${base}\n• This POST endpoint expects a multipart form with a CSV file — the health check sends a minimal probe\n• A 400 here may be expected without a real file; check the response body for details`;
      case "list-create":
        return `${base}\n• The list creation payload may be rejected — check the response body for field-level errors\n• Verify Account SID is correct`;
      case "contact-create":
        return `${base}\n• The contact creation payload may be rejected — check the response body\n• The number format must include country code (e.g., +910000000000)\n• Verify Account SID is correct`;
      case "wa-wabas":
        return `${base}\n• Verify Account SID is correct\n• Check that WhatsApp / WABA is provisioned for this account on the backend`;
      case "wa-numbers":
        return `${base}\n• Verify WABA ID is correct in Configuration → WhatsApp section\n• If WABA ID is empty, set it first, then re-run`;
      case "wa-templates":
        return `${base}\n• Verify WABA ID is correct in Configuration → WhatsApp section\n• If WABA ID is empty, set it first, then re-run`;
      case "wa-campaign-list":
        return `${base}\n• Verify Account SID is correct\n• The ?channel=whatsapp query param may not be supported — check backend API docs`;
      case "lists":
      case "contacts":
        return `${base}\n• Verify Account SID is correct\n• The query params may be rejected — check response body for details`;
      default:
        return `${base}\n• Check the response body below for the specific error\n• Verify Account SID and Base URL are correct in Configuration`;
    }
  }

  if (httpCode != null && httpCode >= 500) {
    return `Server error (${httpCode}).${msgLine}\n\nThis is a backend issue, not a configuration problem. The backend returned an internal error. Check backend logs for details.`;
  }

  if (httpCode != null && httpCode >= 300 && httpCode < 400) {
    return `Redirect (${httpCode}).${msgLine}\n\nThe backend is redirecting this request. Check that:\n• The Base URL doesn't need a trailing slash or different path\n• You're using the correct protocol (http vs https)`;
  }

  return `Unexpected result.${msgLine}\n\nCheck the response body below and verify your Configuration settings.`;
}

function buildCheckDefs(): CheckDef[] {
  const wabaId = useConfigStore.getState().whatsapp.wabaId;

  return [
    {
      id: "config",
      name: "Config",
      method: "GET",
      pathFn: () => "v1/config",
      category: "config",
      description: "Fetch app configuration — does NOT require Account SID, only a valid Base URL",
      validate: (json, status) => [...assertOk(status)],
    },
    {
      id: "session",
      name: "Session Validate",
      method: "GET",
      pathFn: () => "v1/auth/validate-session",
      category: "config",
      description: "Validate auth session — requires valid cookies or Basic auth credentials",
      validate: (json, status) => [...assertOk(status)],
    },
    {
      id: "sms-templates",
      name: "SMS Templates",
      method: "GET",
      pathFn: smsTemplatesPath,
      category: "sms",
      description: "Fetch SMS templates — requires valid Account SID + auth",
      validate: (json, status) => [
        ...assertOk(status),
        ...assertArray(json),
      ],
    },
    {
      id: "sms-dlt-entities",
      name: "SMS DLT Entities",
      method: "GET",
      pathFn: smsDltEntitiesPath,
      category: "sms",
      description: "Fetch DLT entity IDs — requires valid Account SID + auth",
      validate: (json, status) => [...assertOk(status)],
    },
    {
      id: "sms-sender-ids",
      name: "SMS Sender IDs",
      method: "GET",
      pathFn: smsSenderIdMapsPath,
      category: "sms",
      description: "Fetch sender ID entity maps — requires valid Account SID + auth",
      validate: (json, status) => [...assertOk(status)],
    },
    {
      id: "sms-campaign-list",
      name: "SMS Campaign List",
      method: "GET",
      pathFn: () => `${messageCampaignsPath()}?channel=sms&limit=5&offset=0`,
      category: "sms",
      description: "List SMS campaigns — requires valid Account SID + auth",
      validate: (json, status) => [...assertOk(status)],
    },
    {
      id: "sms-csv-upload",
      name: "SMS CSV Upload",
      method: "POST",
      pathFn: csvUploadPath,
      category: "sms",
      description: "Upload dynamic audience CSV — sends a probe request (may 400 without real file)",
      validate: (_json, status) => [...assertOk(status)],
    },
    {
      id: "lists",
      name: "Contact Lists",
      method: "GET",
      pathFn: () => `${listsPath()}?limit=10&offset=0`,
      category: "lists",
      description: "Fetch contact lists — requires valid Account SID + auth",
      validate: (json, status) => [...assertOk(status)],
    },
    {
      id: "list-create",
      name: "Create Static List",
      method: "POST",
      pathFn: listsPath,
      category: "lists",
      description: "Create a new static list — requires valid Account SID + auth",
      validate: (_json, status) => [...assertOk(status)],
    },
    {
      id: "csv-upload-list",
      name: "CSV Upload (Dynamic)",
      method: "POST",
      pathFn: csvUploadPath,
      category: "lists",
      description: "Upload CSV for dynamic list — sends a probe request (may 400 without real file)",
      validate: (_json, status) => [...assertOk(status)],
    },
    {
      id: "contacts",
      name: "Contacts List",
      method: "GET",
      pathFn: () => `${contactsPath()}?limit=5&offset=0&filter=show_list`,
      category: "contacts",
      description: "Fetch contacts — requires valid Account SID + auth",
      validate: (json, status) => [...assertOk(status)],
    },
    {
      id: "contact-create",
      name: "Create Contact",
      method: "POST",
      pathFn: contactsPath,
      category: "contacts",
      description: "Create a test contact — requires valid Account SID + auth",
      validate: (_json, status) => [...assertOk(status)],
    },
    {
      id: "wa-wabas",
      name: "WA WABA List",
      method: "GET",
      pathFn: wabasPath,
      category: "whatsapp",
      description: "Fetch WABA accounts — requires valid Account SID + auth",
      validate: (json, status) => [...assertOk(status)],
    },
    {
      id: "wa-numbers",
      name: "WA Numbers",
      method: "GET",
      pathFn: () => `${wabaNumbersPath()}?wabaId=${wabaId || "test"}`,
      category: "whatsapp",
      description: `Fetch WhatsApp sender numbers — requires valid WABA ID (current: "${wabaId || "not set"}")`,
      validate: (json, status) => [...assertOk(status)],
    },
    {
      id: "wa-templates",
      name: "WA Templates",
      method: "GET",
      pathFn: () =>
        `${whatsappTemplatesPath()}?wabaId=${wabaId || "test"}`,
      category: "whatsapp",
      description: `Fetch WhatsApp templates — requires valid WABA ID (current: "${wabaId || "not set"}")`,
      validate: (json, status) => [...assertOk(status)],
    },
    {
      id: "wa-campaign-list",
      name: "WA Campaign List",
      method: "GET",
      pathFn: () =>
        `${messageCampaignsPath()}?channel=whatsapp&limit=5&offset=0`,
      category: "whatsapp",
      description: "List WhatsApp campaigns — requires valid Account SID + auth",
      validate: (json, status) => [...assertOk(status)],
    },
  ];
}

function buildInitialChecks(): EndpointCheck[] {
  return buildCheckDefs().map((d) => ({
    id: d.id,
    name: d.name,
    method: d.method,
    path: "",
    category: d.category,
    description: d.description,
    status: "untested",
    httpCode: null,
    responseTimeMs: null,
    requestBody: null,
    responseBody: null,
    validationErrors: [],
    error: null,
    hint: null,
  }));
}

export function useHealthCheck() {
  const { setChecks, updateCheck, setIsRunning, setLastRunAt } =
    useHealthCheckStore();

  const runAll = useCallback(async () => {
    const defs = buildCheckDefs();
    setChecks(buildInitialChecks());
    setIsRunning(true);

    for (const def of defs) {
      updateCheck(def.id, { status: "running", path: def.pathFn() });
      const start = performance.now();

      try {
        let res: Response;
        let json: unknown;
        const path = def.pathFn();

        if (def.method === "GET") {
          res = await apiClient(path);
          json = await res.json().catch(() => ({}));
        } else if (def.id === "list-create") {
          res = await apiClient(path, {
            method: "POST",
            body: JSON.stringify({
              lists: [{ name: `health-check-${Date.now()}` }],
            }),
          });
          json = await res.json().catch(() => ({}));
        } else if (def.id === "contact-create") {
          res = await apiClient(path, {
            method: "POST",
            body: JSON.stringify({
              contacts: [{ number: "+910000000000", first_name: "HealthCheck" }],
            }),
          });
          json = await res.json().catch(() => ({}));
        } else {
          res = await apiClient(path);
          json = await res.json().catch(() => ({}));
        }

        const elapsed = Math.round(performance.now() - start);
        const errors = def.validate(json, res.status);
        const failed = errors.length > 0;

        updateCheck(def.id, {
          status: failed ? "fail" : "pass",
          httpCode: res.status,
          responseTimeMs: elapsed,
          path,
          responseBody: json,
          validationErrors: errors,
          error: null,
          hint: failed ? getFixHint(def.id, res.status, null, json) : null,
        });
      } catch (err) {
        const elapsed = Math.round(performance.now() - start);
        const errMsg = err instanceof Error ? err.message : String(err);
        updateCheck(def.id, {
          status: "fail",
          responseTimeMs: elapsed,
          path: def.pathFn(),
          error: errMsg,
          hint: getFixHint(def.id, null, errMsg, null),
        });
      }
    }

    setIsRunning(false);
    setLastRunAt(new Date().toISOString());
  }, [setChecks, updateCheck, setIsRunning, setLastRunAt]);

  const runCategory = useCallback(
    async (category: EndpointCategory) => {
      const defs = buildCheckDefs().filter((d) => d.category === category);
      setIsRunning(true);

      for (const def of defs) {
        updateCheck(def.id, { status: "running", path: def.pathFn() });
        const start = performance.now();

        try {
          const path = def.pathFn();
          let res: Response;
          let json: unknown;

          if (def.method === "GET") {
            res = await apiClient(path);
            json = await res.json().catch(() => ({}));
          } else if (def.id === "list-create") {
            res = await apiClient(path, {
              method: "POST",
              body: JSON.stringify({
                lists: [{ name: `health-check-${Date.now()}` }],
              }),
            });
            json = await res.json().catch(() => ({}));
          } else if (def.id === "contact-create") {
            res = await apiClient(path, {
              method: "POST",
              body: JSON.stringify({
                contacts: [{ number: "+910000000000", first_name: "HealthCheck" }],
              }),
            });
            json = await res.json().catch(() => ({}));
          } else {
            res = await apiClient(path);
            json = await res.json().catch(() => ({}));
          }

          const elapsed = Math.round(performance.now() - start);
          const errors = def.validate(json, res.status);
          const failed = errors.length > 0;

          updateCheck(def.id, {
            status: failed ? "fail" : "pass",
            httpCode: res.status,
            responseTimeMs: elapsed,
            path,
            responseBody: json,
            validationErrors: errors,
            error: null,
            hint: failed ? getFixHint(def.id, res.status, null, json) : null,
          });
        } catch (err) {
          const elapsed = Math.round(performance.now() - start);
          const errMsg = err instanceof Error ? err.message : String(err);
          updateCheck(def.id, {
            status: "fail",
            responseTimeMs: elapsed,
            path: def.pathFn(),
            error: errMsg,
            hint: getFixHint(def.id, null, errMsg, null),
          });
        }
      }

      setIsRunning(false);
      setLastRunAt(new Date().toISOString());
    },
    [updateCheck, setIsRunning, setLastRunAt],
  );

  const init = useCallback(() => {
    setChecks(buildInitialChecks());
  }, [setChecks]);

  return { runAll, runCategory, init };
}
