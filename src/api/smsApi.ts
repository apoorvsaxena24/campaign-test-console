import { apiClient } from "./client";
import {
  smsTemplatesPath,
  smsDltEntitiesPath,
  smsSenderIdMapsPath,
  messageCampaignsPath,
  messageCampaignDetailPath,
  smsTestSendPath,
  smsTestStatusPath,
  csvUploadPath,
} from "./paths";

export async function fetchSmsTemplates(): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(smsTemplatesPath());
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function fetchSmsDltEntities(): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(smsDltEntitiesPath());
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function fetchSmsSenderIds(): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(smsSenderIdMapsPath());
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function fetchSmsCampaignList(): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(
    `${messageCampaignsPath()}?channel=sms&limit=10&offset=0`,
  );
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function fetchSmsCampaignDetail(
  campaignId: string,
): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(
    `${messageCampaignDetailPath(campaignId)}?channel=sms`,
  );
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function sendTestSms(payload: {
  to: string;
  message: string;
  from?: string;
  SmsType?: string;
  DltEntityId?: string;
  DltTemplateId?: string;
}): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(smsTestSendPath(), {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function getTestSmsStatus(
  messageId: string,
): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(smsTestStatusPath(messageId));
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function createSmsCampaign(payload: {
  channel: "sms";
  name: string;
  content_type: string;
  lists: string[];
  template?: string;
  from?: string;
  schedule?: { start_time: string; end_time?: string } | null;
  [key: string]: unknown;
}): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(messageCampaignsPath(), {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function fetchSmsMessageDetails(
  campaignId: string,
): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(
    `${messageCampaignDetailPath(campaignId)}/message-details?channel=sms&limit=10&offset=0`,
  );
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function uploadSmsCsv(
  file: File,
): Promise<{ res: Response; json: unknown }> {
  const form = new FormData();
  form.append("list_name", `test-${Date.now()}`);
  form.append("type", "dynamic");
  form.append("file_name", file);
  const res = await apiClient(csvUploadPath(), {
    method: "POST",
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}
