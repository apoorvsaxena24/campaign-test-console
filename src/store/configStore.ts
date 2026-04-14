import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppConfig, SmsConfig, WhatsAppConfig } from "@/types/config";

interface ConfigState {
  app: AppConfig;
  sms: SmsConfig;
  whatsapp: WhatsAppConfig;
  setApp: (patch: Partial<AppConfig>) => void;
  setSms: (patch: Partial<SmsConfig>) => void;
  setWhatsApp: (patch: Partial<WhatsAppConfig>) => void;
  addTestPhone: (phone: string) => void;
  removeTestPhone: (phone: string) => void;
  addSmsDltTemplate: (id: string) => void;
  removeSmsDltTemplate: (id: string) => void;
  addWaTemplate: (id: string) => void;
  removeWaTemplate: (id: string) => void;
}

const DEFAULT_APP: AppConfig = {
  apiBaseUrl: "http://localhost:4173",
  accountSid: "",
  authMode: "cookie",
  apiKey: "",
  apiToken: "",
  testPhoneNumbers: [],
};

const DEFAULT_SMS: SmsConfig = {
  senderId: "",
  entityId: "",
  dltTemplateIds: [],
  smsCoverage: "indian",
};

const DEFAULT_WA: WhatsAppConfig = {
  wabaId: "",
  whatsappNumber: "",
  templateIds: [],
  templateName: "",
  templateLanguage: "",
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      app: { ...DEFAULT_APP },
      sms: { ...DEFAULT_SMS },
      whatsapp: { ...DEFAULT_WA },
      setApp: (patch) =>
        set((s) => ({ app: { ...s.app, ...patch } })),
      setSms: (patch) =>
        set((s) => ({ sms: { ...s.sms, ...patch } })),
      setWhatsApp: (patch) =>
        set((s) => ({ whatsapp: { ...s.whatsapp, ...patch } })),
      addTestPhone: (phone) =>
        set((s) => ({
          app: {
            ...s.app,
            testPhoneNumbers: (s.app.testPhoneNumbers ?? []).includes(phone)
              ? s.app.testPhoneNumbers
              : [...(s.app.testPhoneNumbers ?? []), phone],
          },
        })),
      removeTestPhone: (phone) =>
        set((s) => ({
          app: {
            ...s.app,
            testPhoneNumbers: (s.app.testPhoneNumbers ?? []).filter((p) => p !== phone),
          },
        })),
      addSmsDltTemplate: (id) =>
        set((s) => ({
          sms: {
            ...s.sms,
            dltTemplateIds: (s.sms.dltTemplateIds ?? []).includes(id)
              ? s.sms.dltTemplateIds
              : [...(s.sms.dltTemplateIds ?? []), id],
          },
        })),
      removeSmsDltTemplate: (id) =>
        set((s) => ({
          sms: {
            ...s.sms,
            dltTemplateIds: (s.sms.dltTemplateIds ?? []).filter((t) => t !== id),
          },
        })),
      addWaTemplate: (id) =>
        set((s) => ({
          whatsapp: {
            ...s.whatsapp,
            templateIds: (s.whatsapp.templateIds ?? []).includes(id)
              ? s.whatsapp.templateIds
              : [...(s.whatsapp.templateIds ?? []), id],
          },
        })),
      removeWaTemplate: (id) =>
        set((s) => ({
          whatsapp: {
            ...s.whatsapp,
            templateIds: (s.whatsapp.templateIds ?? []).filter((t) => t !== id),
          },
        })),
    }),
    {
      name: "ctc-config",
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;

        if (version < 2) {
          const oldSms = (state.sms ?? {}) as Record<string, unknown>;
          const oldWa = (state.whatsapp ?? {}) as Record<string, unknown>;

          const smsDltIds: string[] = [];
          if (typeof oldSms.dltTemplateId === "string" && oldSms.dltTemplateId) {
            smsDltIds.push(oldSms.dltTemplateId);
          }
          if (Array.isArray(oldSms.dltTemplateIds)) {
            smsDltIds.push(...oldSms.dltTemplateIds);
          }

          const waIds: string[] = [];
          if (typeof oldWa.templateId === "string" && oldWa.templateId) {
            waIds.push(oldWa.templateId);
          }
          if (Array.isArray(oldWa.templateIds)) {
            waIds.push(...oldWa.templateIds);
          }

          return {
            ...state,
            sms: {
              ...DEFAULT_SMS,
              ...oldSms,
              dltTemplateIds: smsDltIds,
            },
            whatsapp: {
              ...DEFAULT_WA,
              ...oldWa,
              templateIds: waIds,
            },
          };
        }

        return state;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        const c = current as unknown as Record<string, unknown>;

        const mergedApp = { ...DEFAULT_APP, ...(p.app as object ?? {}) };
        const mergedSms = { ...DEFAULT_SMS, ...(p.sms as object ?? {}) };
        const mergedWa = { ...DEFAULT_WA, ...(p.whatsapp as object ?? {}) };

        if (!Array.isArray(mergedApp.testPhoneNumbers)) mergedApp.testPhoneNumbers = [];
        if (!Array.isArray(mergedSms.dltTemplateIds)) mergedSms.dltTemplateIds = [];
        if (!Array.isArray(mergedWa.templateIds)) mergedWa.templateIds = [];

        return {
          ...c,
          app: mergedApp,
          sms: mergedSms,
          whatsapp: mergedWa,
        } as ConfigState;
      },
    },
  ),
);
