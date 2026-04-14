export type ChannelId = "sms" | "whatsapp" | "call" | "dialer" | "rcs";

export interface ChannelDefinition {
  id: ChannelId;
  name: string;
  enabled: boolean;
  icon: string;
  description: string;
}

export const CHANNELS: ChannelDefinition[] = [
  { id: "sms", name: "SMS", enabled: true, icon: "Sms", description: "SMS campaign testing" },
  { id: "whatsapp", name: "WhatsApp", enabled: true, icon: "WhatsApp", description: "WhatsApp campaign testing" },
  { id: "call", name: "Call", enabled: false, icon: "Phone", description: "Voice call campaign testing" },
  { id: "dialer", name: "OB Dialer", enabled: false, icon: "DialerSip", description: "Outbound dialer campaign testing" },
  { id: "rcs", name: "RCS", enabled: false, icon: "Chat", description: "RCS campaign testing" },
];
