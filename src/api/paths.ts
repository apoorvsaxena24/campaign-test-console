import { useConfigStore } from "@/store/configStore";

function getAccountSid(): string {
  return useConfigStore.getState().app.accountSid;
}

export function accountPrefix(): string {
  return `v1/accounts/${getAccountSid()}`;
}

export function messageCampaignsPath(): string {
  return `${accountPrefix()}/message-campaigns`;
}

export function messageCampaignDetailPath(id: string): string {
  return `${accountPrefix()}/message-campaigns/${id}`;
}

export function smsTemplatesPath(): string {
  return `${accountPrefix()}/templates/sms`;
}

export function smsDltEntitiesPath(): string {
  return `${accountPrefix()}/sms/dlt-entities`;
}

export function smsSenderIdMapsPath(): string {
  return `${accountPrefix()}/sms/sender-id-entity-maps`;
}

export function smsTestSendPath(): string {
  return `${accountPrefix()}/templates/sms/test`;
}

export function smsTestStatusPath(messageId: string): string {
  return `${accountPrefix()}/templates/sms/messages/${messageId}`;
}

export function listsPath(): string {
  return `${accountPrefix()}/lists`;
}

export function csvUploadPath(): string {
  return `${accountPrefix()}/contacts/csv-upload`;
}

export function dynamicListHeadersPath(listId: string): string {
  return `${accountPrefix()}/contacts/csv-upload/${listId}`;
}

export function contactsPath(): string {
  return `${accountPrefix()}/contacts`;
}

export function contactDetailPath(contactSid: string): string {
  return `${accountPrefix()}/contacts/${contactSid}`;
}

export function listContactsPath(listId: string): string {
  return `${accountPrefix()}/lists/${listId}/contacts`;
}

export function wabasPath(): string {
  return `${accountPrefix()}/wabas`;
}

export function wabaNumbersPath(): string {
  return `${accountPrefix()}/wabas/numbers`;
}

export function whatsappTemplatesPath(): string {
  return `${accountPrefix()}/templates/whatsapp`;
}

export function whatsappTemplateByIdPath(templateId: string): string {
  return `${accountPrefix()}/templates/whatsapp/${templateId}`;
}

export function whatsappMediaUploadPath(): string {
  return `${accountPrefix()}/templates/whatsapp/template-media-upload`;
}

export function whatsappMessageSendPath(): string {
  return `${accountPrefix()}/messages/whatsapp`;
}
