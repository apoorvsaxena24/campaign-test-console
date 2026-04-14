import { apiClient } from "./client";
import { contactsPath, contactDetailPath } from "./paths";

export async function fetchContacts(): Promise<{
  res: Response;
  json: unknown;
}> {
  const res = await apiClient(
    `${contactsPath()}?limit=10&offset=0&filter=show_list`,
  );
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function createContact(payload: {
  number: string;
  first_name?: string;
  last_name?: string;
}): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(contactsPath(), {
    method: "POST",
    body: JSON.stringify({ contacts: [payload] }),
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function deleteContact(
  contactSid: string,
): Promise<{ res: Response; json: unknown }> {
  const res = await apiClient(contactDetailPath(contactSid), {
    method: "DELETE",
  });
  const json = await res.json().catch(() => null);
  return { res, json };
}
