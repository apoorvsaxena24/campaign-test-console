/**
 * Response envelope unwrappers matching engage-frontend's patterns.
 * Engage backend responses may be nested as:
 *   { data: T }
 *   { response: T }
 *   { data: { response: T } }
 *   or just T at the top level
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function unwrapEntity(json: any): any {
  if (json?.data?.response) return json.data.response;
  if (json?.data) return json.data;
  if (json?.response) return json.response;
  return json;
}

export function unwrapListBody(json: any): { rows: any[]; total: number } {
  const entity = unwrapEntity(json);

  let rows: any[];
  if (Array.isArray(entity)) {
    rows = entity;
  } else if (Array.isArray(entity?.data)) {
    rows = entity.data;
  } else if (Array.isArray(entity?.response)) {
    rows = entity.response;
  } else {
    rows = [];
  }

  let total = 0;
  if (json?.metadata?.total != null) total = Number(json.metadata.total);
  else if (json?.metadata?.count != null) total = Number(json.metadata.count);
  else if (entity?.metadata?.total != null) total = Number(entity.metadata.total);
  else total = rows.length;

  return { rows, total };
}

export function extractId(entity: any): string | null {
  if (!entity) return null;
  return String(entity.id ?? entity.sid ?? entity.list_id ?? entity.waba_id ?? "");
}
