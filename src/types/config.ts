export interface AppConfig {
  apiBaseUrl: string;
  accountSid: string;
  authMode: "cookie" | "basic";
  apiKey: string;
  apiToken: string;
  testPhoneNumbers: string[];
}

export interface SmsConfig {
  senderId: string;
  entityId: string;
  dltTemplateIds: string[];
  smsCoverage: "indian" | "international";
}

export interface WhatsAppConfig {
  wabaId: string;
  whatsappNumber: string;
  templateIds: string[];
  templateName: string;
  templateLanguage: string;
}
