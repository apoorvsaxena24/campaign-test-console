import type { FlowStep } from "./FlowStepCard";
import { apiClient } from "@/api/client";
import { createStaticList, uploadCsvList, addContactToList } from "@/api/listApi";
import { createContact } from "@/api/contactApi";

export type AudienceMode = "contacts" | "csv";

export interface PreflightItem {
  label: string;
  ok: boolean;
  detail: string;
  required?: boolean;
}

export const CSV_FORMAT_GUIDE = `number,first_name,last_name
+919876543210,John,Doe
+919876543211,Jane,Smith
+14155551234,Bob,Wilson`;

export const CSV_FORMAT_HELP = `Required column: number (with country code, e.g. +91...)
Optional columns: first_name, last_name
File type: .csv (comma-separated)`;

export function makeStep(
  id: string,
  name: string,
  method: string,
  path: string,
): FlowStep {
  return {
    id,
    name,
    method,
    path,
    status: "pending",
    httpCode: null,
    responseTimeMs: null,
    requestBody: null,
    responseBody: null,
    error: null,
  };
}

export async function runApiStep(
  step: FlowStep,
  options?: RequestInit,
): Promise<FlowStep> {
  const start = performance.now();
  try {
    const res = await apiClient(step.path, options);
    const json = await res.json().catch(() => ({}));
    return {
      ...step,
      status: res.ok ? "pass" : "fail",
      httpCode: res.status,
      responseTimeMs: Math.round(performance.now() - start),
      responseBody: json,
      error: res.ok ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ...step,
      status: "fail",
      responseTimeMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function extractSid(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;

  const obj = json as Record<string, unknown>;
  const candidates = [
    (obj.data as Record<string, unknown>)?.response,
    obj.data,
    obj.response,
    obj,
  ];

  for (const raw of candidates) {
    if (!raw || typeof raw !== "object") continue;
    const c = raw as Record<string, unknown>;

    if (typeof c.sid === "string" && c.sid) return c.sid;
    if (typeof c.id === "string" && c.id) return c.id;
    if (typeof c.id === "number") return String(c.id);

    for (const key of ["lists", "contacts", "items"]) {
      if (Array.isArray(c[key]) && (c[key] as unknown[]).length > 0) {
        const first = (c[key] as Record<string, unknown>[])[0];
        if (typeof first?.sid === "string") return first.sid;
        if (typeof first?.id === "string") return first.id;
        if (typeof first?.id === "number") return String(first.id);
      }
    }

    if (typeof c.list_sid === "string") return c.list_sid;
    if (typeof c.contact_sid === "string") return c.contact_sid;
  }

  return null;
}

export function buildCommonPreflight(app: {
  apiBaseUrl: string;
  accountSid: string;
  authMode: string;
  apiKey: string;
  apiToken: string;
}): PreflightItem[] {
  return [
    {
      label: "API Base URL",
      ok: !!app.apiBaseUrl && app.apiBaseUrl !== "http://localhost:4173",
      detail: app.apiBaseUrl || "(empty)",
      required: true,
    },
    {
      label: "Account SID",
      ok: !!app.accountSid,
      detail: app.accountSid || "(empty)",
      required: true,
    },
    {
      label: "Auth configured",
      ok:
        app.authMode === "cookie" ||
        (app.authMode === "basic" && !!app.apiKey && !!app.apiToken),
      detail:
        app.authMode === "cookie"
          ? "Cookie mode"
          : app.apiKey
            ? "Basic auth set"
            : "API Key/Token missing",
      required: true,
    },
  ];
}

export function isPreflightReady(items: PreflightItem[]): boolean {
  return items
    .filter((p) => p.required !== false)
    .every((p) => p.ok);
}

export interface AudienceSetupResult {
  listSid: string | null;
  setupStepCount: number;
  success: boolean;
}

export async function runAudienceSetup(
  audienceMode: AudienceMode,
  manualContacts: string[],
  csvFile: File | null,
  allSteps: FlowStep[],
  updateSteps: (s: FlowStep[]) => void,
): Promise<AudienceSetupResult> {
  if (audienceMode === "csv" && csvFile) {
    const stepIdx = allSteps.findIndex((s) => s.id === "aud-csv-upload");
    if (stepIdx >= 0) {
      allSteps[stepIdx] = { ...allSteps[stepIdx], status: "running" };
      updateSteps([...allSteps]);
      const start = performance.now();
      try {
        const { res, json } = await uploadCsvList(csvFile, "static");
        const elapsed = Math.round(performance.now() - start);
        const listSid = extractSid(json);
        const ok = res.ok;
        allSteps[stepIdx] = {
          ...allSteps[stepIdx],
          status: ok ? "pass" : "fail",
          httpCode: res.status,
          responseTimeMs: elapsed,
          requestBody: { file: csvFile.name, type: "static" },
          responseBody: json,
          error: ok
            ? null
            : `HTTP ${res.status} — ${tryExtractMessage(json)}`,
        };
        updateSteps([...allSteps]);
        return { listSid, setupStepCount: 1, success: ok };
      } catch (err) {
        allSteps[stepIdx] = {
          ...allSteps[stepIdx],
          status: "fail",
          responseTimeMs: Math.round(performance.now() - start),
          error: err instanceof Error ? err.message : String(err),
        };
        updateSteps([...allSteps]);
        return { listSid: null, setupStepCount: 1, success: false };
      }
    }
  }

  if (audienceMode === "contacts" && manualContacts.length > 0) {
    let listSid: string | null = null;
    let listCreateOk = false;

    // Step 1: Create list
    const createIdx = allSteps.findIndex((s) => s.id === "aud-create-list");
    if (createIdx >= 0) {
      allSteps[createIdx] = { ...allSteps[createIdx], status: "running" };
      updateSteps([...allSteps]);
      const start = performance.now();
      try {
        const listName = `ctc-test-${Date.now()}`;
        const payload = { lists: [{ name: listName }] };
        const { res, json } = await createStaticList(listName);
        const elapsed = Math.round(performance.now() - start);
        listCreateOk = res.ok;
        listSid = extractSid(json);

        let stepError: string | null = null;
        if (!res.ok) {
          stepError = `HTTP ${res.status} — ${tryExtractMessage(json)}`;
        } else if (!listSid) {
          stepError = `List created (HTTP ${res.status}) but could not extract list SID from response. Check response body below.`;
          listCreateOk = false;
        }

        allSteps[createIdx] = {
          ...allSteps[createIdx],
          status: stepError ? "fail" : "pass",
          httpCode: res.status,
          responseTimeMs: elapsed,
          requestBody: payload,
          responseBody: json,
          error: stepError,
        };
      } catch (err) {
        allSteps[createIdx] = {
          ...allSteps[createIdx],
          status: "fail",
          responseTimeMs: Math.round(performance.now() - start),
          error: err instanceof Error ? err.message : String(err),
        };
      }
      updateSteps([...allSteps]);
    }

    // Step 2: Create contacts and add to list
    const addIdx = allSteps.findIndex((s) => s.id === "aud-add-contacts");
    if (addIdx >= 0) {
      if (!listCreateOk || !listSid) {
        allSteps[addIdx] = {
          ...allSteps[addIdx],
          status: "fail",
          responseTimeMs: 0,
          error: "Skipped — list creation failed or list SID not available. Fix the step above first.",
        };
        updateSteps([...allSteps]);
        return { listSid: null, setupStepCount: 2, success: false };
      }

      allSteps[addIdx] = { ...allSteps[addIdx], status: "running" };
      updateSteps([...allSteps]);
      const start = performance.now();
      const errors: string[] = [];
      const perContactResults: Array<{
        phone: string;
        contactSid: string | null;
        addedToList: boolean;
        error: string | null;
      }> = [];

      for (const phone of manualContacts) {
        try {
          const contactPayload = { number: phone, first_name: "TestUser" };
          const { res: cRes, json: cJson } = await createContact(contactPayload);
          if (!cRes.ok) {
            const msg = `Create ${phone}: HTTP ${cRes.status} — ${tryExtractMessage(cJson)}`;
            errors.push(msg);
            perContactResults.push({ phone, contactSid: null, addedToList: false, error: msg });
            continue;
          }
          const contactSid = extractSid(cJson);
          if (!contactSid) {
            const msg = `Create ${phone}: succeeded but could not extract contact SID`;
            errors.push(msg);
            perContactResults.push({ phone, contactSid: null, addedToList: false, error: msg });
            continue;
          }

          const { res: aRes, json: aJson } = await addContactToList(listSid, contactSid);
          if (!aRes.ok) {
            const msg = `Add ${phone} to list: HTTP ${aRes.status} — ${tryExtractMessage(aJson)}`;
            errors.push(msg);
            perContactResults.push({ phone, contactSid, addedToList: false, error: msg });
          } else {
            perContactResults.push({ phone, contactSid, addedToList: true, error: null });
          }
        } catch (err) {
          const msg = `${phone}: ${err instanceof Error ? err.message : String(err)}`;
          errors.push(msg);
          perContactResults.push({ phone, contactSid: null, addedToList: false, error: msg });
        }
      }

      const elapsed = Math.round(performance.now() - start);
      allSteps[addIdx] = {
        ...allSteps[addIdx],
        status: errors.length === 0 ? "pass" : "fail",
        responseTimeMs: elapsed,
        requestBody: {
          listSid,
          contacts: manualContacts.map((p) => ({ number: p, first_name: "TestUser" })),
        },
        responseBody: { results: perContactResults },
        error: errors.length > 0 ? errors.join("\n") : null,
      };
      updateSteps([...allSteps]);
    }

    return {
      listSid,
      setupStepCount: 2,
      success: listCreateOk && listSid !== null,
    };
  }

  return { listSid: null, setupStepCount: 0, success: false };
}

export function buildAudienceSteps(
  audienceMode: AudienceMode,
  contactCount: number,
  listsPathValue: string,
): FlowStep[] {
  if (audienceMode === "csv") {
    return [makeStep("aud-csv-upload", "Upload CSV List", "POST", "csv-upload")];
  }
  return [
    makeStep("aud-create-list", "Create Test List", "POST", listsPathValue),
    makeStep(
      "aud-add-contacts",
      `Add ${contactCount} Contact(s) to List`,
      "POST",
      "contacts → list",
    ),
  ];
}

export function markRemainingSkipped(
  allSteps: FlowStep[],
  fromIndex: number,
  reason: string,
  updateSteps: (s: FlowStep[]) => void,
): void {
  for (let i = fromIndex; i < allSteps.length; i++) {
    if (allSteps[i].status === "pending") {
      allSteps[i] = {
        ...allSteps[i],
        status: "skipped",
        error: reason,
      };
    }
  }
  updateSteps([...allSteps]);
}

function tryExtractMessage(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const obj = json as Record<string, unknown>;
  if (typeof obj.message === "string") return obj.message;
  if (typeof obj.error === "string") return obj.error;
  if (typeof (obj.data as Record<string, unknown>)?.message === "string") {
    return (obj.data as Record<string, unknown>).message as string;
  }
  return "";
}
