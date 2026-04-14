import { apiClient } from "./client";
import { listsPath, csvUploadPath, listContactsPath } from "./paths";

export async function fetchLists(): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(`${listsPath()}?limit=100&offset=0`);
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function createStaticList(
  name: string,
): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(listsPath(), {
    method: "POST",
    body: JSON.stringify({ lists: [{ name: name.trim() }] }),
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function uploadCsvList(
  file: File,
  type: "static" | "dynamic",
): Promise<{ res: Response; json: unknown }> {
  const form = new FormData();
  form.append("list_name", `test-list-${Date.now()}`);
  form.append("type", type);
  form.append("file_name", file);
  const res = await apiClient(csvUploadPath(), {
    method: "POST",
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function addContactToList(
  listId: string,
  contactSid: string,
): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(listContactsPath(listId), {
    method: "POST",
    body: JSON.stringify({ contact_references: [{ contact_sid: contactSid }] }),
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}
