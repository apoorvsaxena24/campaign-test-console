import { apiClient } from "./client";
import {
  wabasPath,
  wabaNumbersPath,
  whatsappTemplatesPath,
  whatsappTemplateByIdPath,
  whatsappMediaUploadPath,
  whatsappMessageSendPath,
  messageCampaignsPath,
  messageCampaignDetailPath,
  csvUploadPath,
  dynamicListHeadersPath,
} from "./paths";

export async function fetchWabas(): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(wabasPath());
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function fetchWabaNumbers(
  wabaId: string,
): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(`${wabaNumbersPath()}?wabaId=${wabaId}`);
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function fetchWhatsAppTemplates(
  wabaId: string,
): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(`${whatsappTemplatesPath()}?wabaId=${wabaId}`);
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function fetchWhatsAppTemplateById(
  templateId: string,
  wabaId: string,
): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(
    `${whatsappTemplateByIdPath(templateId)}?wabaId=${wabaId}`,
  );
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function uploadWhatsAppMedia(
  file: File,
  fileType: string,
  phoneNumber: string,
): Promise<{ res: Response; json: unknown }> {
  const form = new FormData();
  form.append("file_type", fileType);
  form.append("file", file);
  form.append("file_name", file.name);
  form.append("channel", "whatsapp");
  form.append("phone_number", phoneNumber.replace(/^\+/, ""));
  const res = await apiClient(whatsappMediaUploadPath(), {
    method: "POST",
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function sendTestWhatsApp(payload: {
  to: string;
  from: string;
  content: {
    type: "template";
    template: {
      name: string;
      language: { policy: string; code: string };
      namespace?: string;
      components?: unknown[];
    };
  };
}): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(whatsappMessageSendPath(), {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function fetchWhatsAppCampaignList(): Promise<{
  res: Response;
  json: unknown;
}> {
  const res = await apiClient(
    `${messageCampaignsPath()}?channel=whatsapp&limit=10&offset=0`,
  );
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function fetchWhatsAppCampaignDetail(
  campaignId: string,
): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(
    `${messageCampaignDetailPath(campaignId)}?channel=whatsapp`,
  );
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function createWhatsAppCampaign(payload: {
  channel: "whatsapp";
  name: string;
  content_type: string;
  lists: string[];
  waba_id: string;
  from: string;
  template_id: string;
  template: string;
  schedule?: { scheduled_at: string; timezone: string } | null;
  [key: string]: unknown;
}): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(messageCampaignsPath(), {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function uploadWhatsAppCsv(
  file: File,
): Promise<{ res: Response; json: unknown }> {
  const form = new FormData();
  form.append("list_name", `wa-test-${Date.now()}`);
  form.append("type", "dynamic");
  form.append("file_name", file);
  const res = await apiClient(csvUploadPath(), {
    method: "POST",
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function fetchDynamicListHeaders(
  listId: string,
): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(
    `${dynamicListHeadersPath(listId)}?type=dynamic`,
  );
  const json = await res.json().catch(() => ({}));
  return { res, json };
}
