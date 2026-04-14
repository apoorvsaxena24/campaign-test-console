import { z } from "zod";

export type EndpointCategory = "config" | "sms" | "whatsapp" | "lists" | "contacts";

export type EndpointStatus = "untested" | "running" | "pass" | "fail";

export interface EndpointCheck {
  id: string;
  name: string;
  method: string;
  path: string;
  category: EndpointCategory;
  description: string;
  status: EndpointStatus;
  httpCode: number | null;
  responseTimeMs: number | null;
  requestBody: unknown;
  responseBody: unknown;
  validationErrors: string[];
  error: string | null;
  hint: string | null;
}

export const configResponseSchema = z.object({
  accountSid: z.string().optional(),
  apiBaseUrl: z.string().optional(),
}).passthrough();

export const sessionResponseSchema = z.object({
  accountSid: z.string().optional(),
}).passthrough();

export const smsTemplateSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  sid: z.string().optional(),
  name: z.string().optional(),
  body: z.string().optional(),
}).passthrough();

export const campaignSummarySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  sid: z.string().optional(),
  name: z.string().optional(),
}).passthrough();

export const wabaSchema = z.object({
  waba_id: z.string().optional(),
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().optional(),
}).passthrough();

export const waTemplateSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().optional(),
  status: z.string().optional(),
}).passthrough();

export const listSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  sid: z.string().optional(),
  name: z.string().optional(),
}).passthrough();

export const contactSchema = z.object({
  sid: z.string().optional(),
  number: z.string().optional(),
}).passthrough();
