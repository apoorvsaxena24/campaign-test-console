import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { NetworkCheck, Add } from "@mui/icons-material";
import PageHeader from "@/components/layout/PageHeader";
import { useConfigStore } from "@/store/configStore";
import { fetchConfig, validateSession } from "@/api/configApi";

function ChipInput({
  label,
  helperText,
  placeholder,
  items,
  onAdd,
  onRemove,
}: {
  label: string;
  helperText?: string;
  placeholder: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}) {
  const [input, setInput] = useState("");

  const addItems = (raw: string) => {
    const values = raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    for (const v of values) onAdd(v);
  };

  const handleAdd = () => {
    if (input.trim()) {
      addItems(input);
      setInput("");
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
          {helperText}
        </Typography>
      )}
      {items.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap", gap: 1 }}>
          {items.map((item, idx) => (
            <Chip
              key={`${item}-${idx}`}
              label={item}
              onDelete={() => onRemove(item)}
              variant="outlined"
              size="small"
            />
          ))}
        </Stack>
      )}
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          sx={{ minWidth: 280 }}
        />
        <Button variant="outlined" startIcon={<Add />} onClick={handleAdd} disabled={!input.trim()}>
          Add
        </Button>
      </Stack>
    </Box>
  );
}

export default function ConfigPage() {
  const {
    app, sms, whatsapp,
    setApp, setSms, setWhatsApp,
    addTestPhone, removeTestPhone,
    addSmsDltTemplate, removeSmsDltTemplate,
    addWaTemplate, removeWaTemplate,
  } = useConfigStore();
  const [phoneInput, setPhoneInput] = useState("");
  const [connStatus, setConnStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [connError, setConnError] = useState("");

  const testConnection = async () => {
    setConnStatus("testing");
    setConnError("");
    try {
      let configJson: unknown;
      try {
        const { res: configRes, json } = await fetchConfig();
        configJson = json;
        if (!configRes.ok) {
          const msg = extractMsg(configJson);
          if (configRes.status === 400) {
            throw new Error(
              `Config: HTTP 400 — Bad Request${msg ? ` (${msg})` : ""}\n\n` +
              `How to fix:\n` +
              `• Check that the Base URL is correct and does NOT include a trailing path like /v1\n` +
              `• Try opening ${app.apiBaseUrl.replace(/\/$/, "")}/v1/config directly in your browser\n` +
              `• Make sure the backend is running and reachable`,
            );
          }
          if (configRes.status === 401 || configRes.status === 403) {
            throw new Error(
              `Config: HTTP ${configRes.status} — Authentication failed${msg ? ` (${msg})` : ""}\n\n` +
              `How to fix:\n` +
              `• If using Cookie auth: open the Engage UI in the same browser, log in, then retry\n` +
              `• If using Basic auth: set the correct API Key + Token above`,
            );
          }
          if (configRes.status === 404) {
            throw new Error(
              `Config: HTTP 404 — Endpoint not found${msg ? ` (${msg})` : ""}\n\n` +
              `How to fix:\n` +
              `• The Base URL may be wrong — it should point to the Engage API root\n` +
              `• Verify the backend has the /v1/config endpoint deployed`,
            );
          }
          throw new Error(
            `Config: HTTP ${configRes.status}${msg ? ` — ${msg}` : ""}\n\n` +
            `How to fix:\n` +
            `• Check the Base URL above is correct\n` +
            `• Check the backend is running at that address`,
          );
        }
      } catch (fetchErr) {
        if (fetchErr instanceof TypeError && String(fetchErr).includes("fetch")) {
          throw new Error(
            `Config: Failed to fetch — cannot reach the backend\n\n` +
            `How to fix:\n` +
            `• Verify the Base URL "${app.apiBaseUrl}" is correct\n` +
            `• Make sure the backend server is running\n` +
            `• Check for firewall / VPN issues`,
          );
        }
        throw fetchErr;
      }

      try {
        const { res: sessionRes, json: sessionJson } = await validateSession();
        if (!sessionRes.ok) {
          const msg = extractMsg(sessionJson);
          if (sessionRes.status === 400) {
            throw new Error(
              `Session: HTTP 400 — Bad Request${msg ? ` (${msg})` : ""}\n\n` +
              `How to fix:\n` +
              `• This validates your auth session — you may need to log into the Engage UI first (for Cookie auth)\n` +
              `• For Basic auth: verify your API Key + Token are correct\n` +
              `• Account SID "${app.accountSid || "(empty)"}" may be wrong — double-check it`,
            );
          }
          if (sessionRes.status === 401 || sessionRes.status === 403) {
            throw new Error(
              `Session: HTTP ${sessionRes.status} — Auth failed${msg ? ` (${msg})` : ""}\n\n` +
              `How to fix:\n` +
              `• Cookie auth: log into the Engage UI in this browser, then retry\n` +
              `• Basic auth: set the correct API Key and Token above\n` +
              `• Make sure the Account SID matches a real account`,
            );
          }
          throw new Error(
            `Session: HTTP ${sessionRes.status}${msg ? ` — ${msg}` : ""}\n\n` +
            `How to fix:\n` +
            `• Verify your auth credentials\n` +
            `• Check that the Account SID is correct`,
          );
        }
      } catch (fetchErr) {
        if (fetchErr instanceof TypeError && String(fetchErr).includes("fetch")) {
          throw new Error(
            `Session: Failed to fetch — cannot reach the backend\n\nThe Config endpoint worked but Session did not. Check if the auth endpoint is deployed.`,
          );
        }
        throw fetchErr;
      }

      setConnStatus("ok");
    } catch (err) {
      setConnStatus("fail");
      setConnError(err instanceof Error ? err.message : String(err));
    }
  };

  function extractMsg(json: unknown): string {
    if (!json || typeof json !== "object") return "";
    const o = json as Record<string, unknown>;
    const m = o.message ?? o.error ?? (o as Record<string, unknown>).msg ?? "";
    return typeof m === "string" ? m : "";
  }

  return (
    <>
      <PageHeader title="Configuration" subtitle="Configure API connection, test numbers, and channel-specific settings" />

      <Stack spacing={3}>
        {/* API Connection */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>API Connection</Typography>
            <Stack spacing={2}>
              <TextField
                label="Base URL"
                value={app.apiBaseUrl}
                onChange={(e) => setApp({ apiBaseUrl: e.target.value })}
                fullWidth
                size="small"
                placeholder="http://localhost:4173"
              />
              <TextField
                label="Account SID"
                value={app.accountSid}
                onChange={(e) => setApp({ accountSid: e.target.value })}
                fullWidth
                size="small"
              />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                  Auth Mode
                </Typography>
                <ToggleButtonGroup
                  value={app.authMode}
                  exclusive
                  onChange={(_, v) => v && setApp({ authMode: v })}
                  size="small"
                >
                  <ToggleButton value="cookie">Cookie (credentials: include)</ToggleButton>
                  <ToggleButton value="basic">API Key + Token (Basic)</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {app.authMode === "basic" && (
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="API Key"
                    value={app.apiKey}
                    onChange={(e) => setApp({ apiKey: e.target.value })}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="API Token"
                    value={app.apiToken}
                    onChange={(e) => setApp({ apiToken: e.target.value })}
                    type="password"
                    size="small"
                    fullWidth
                  />
                </Stack>
              )}
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<NetworkCheck />}
                  onClick={testConnection}
                  disabled={connStatus === "testing"}
                >
                  {connStatus === "testing" ? "Testing..." : "Test Connection"}
                </Button>
                {connStatus === "ok" && <Alert severity="success" sx={{ mt: 1 }}>Connection successful — Config and Session endpoints are reachable</Alert>}
                {connStatus === "fail" && (
                  <Alert severity="error" sx={{ mt: 1, "& .MuiAlert-message": { whiteSpace: "pre-line" } }}>
                    {connError}
                  </Alert>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Test Phone Numbers */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Test Phone Numbers</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Numbers where test SMS / WhatsApp messages will be received
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
              {app.testPhoneNumbers.map((p) => (
                <Chip key={p} label={p} onDelete={() => removeTestPhone(p)} />
              ))}
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                placeholder="+91XXXXXXXXXX"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && phoneInput.trim()) {
                    addTestPhone(phoneInput.trim());
                    setPhoneInput("");
                  }
                }}
              />
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => {
                  if (phoneInput.trim()) {
                    addTestPhone(phoneInput.trim());
                    setPhoneInput("");
                  }
                }}
              >
                Add
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* SMS Config */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>SMS Configuration</Typography>
            <Stack spacing={2.5}>
              <TextField
                label="Sender ID"
                value={sms.senderId}
                onChange={(e) => setSms({ senderId: e.target.value })}
                size="small"
                fullWidth
              />
              <TextField
                label="DLT Entity ID"
                value={sms.entityId}
                onChange={(e) => setSms({ entityId: e.target.value })}
                size="small"
                fullWidth
              />
              <ChipInput
                label="DLT Template IDs"
                helperText="Add one or more DLT template IDs. You can paste comma-separated values. The first ID is used as default for test sends."
                placeholder="e.g. 1107161234567890123"
                items={sms.dltTemplateIds}
                onAdd={addSmsDltTemplate}
                onRemove={removeSmsDltTemplate}
              />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  SMS Coverage
                </Typography>
                <RadioGroup
                  row
                  value={sms.smsCoverage}
                  onChange={(e) => setSms({ smsCoverage: e.target.value as "indian" | "international" })}
                >
                  <FormControlLabel value="indian" control={<Radio size="small" />} label="Indian" />
                  <FormControlLabel value="international" control={<Radio size="small" />} label="International" />
                </RadioGroup>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* WhatsApp Config */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>WhatsApp Configuration</Typography>
            <Stack spacing={2.5}>
              <TextField
                label="WABA ID"
                value={whatsapp.wabaId}
                onChange={(e) => setWhatsApp({ wabaId: e.target.value })}
                size="small"
                fullWidth
              />
              <TextField
                label="WhatsApp Sender Number"
                value={whatsapp.whatsappNumber}
                onChange={(e) => setWhatsApp({ whatsappNumber: e.target.value })}
                size="small"
                fullWidth
              />
              <ChipInput
                label="Template IDs"
                helperText="Add one or more WhatsApp template IDs. You can paste comma-separated values. The first ID is used as default for test sends."
                placeholder="e.g. tmpl_abc123"
                items={whatsapp.templateIds}
                onAdd={addWaTemplate}
                onRemove={removeWaTemplate}
              />
              <TextField
                label="Default Template Name (for test send)"
                value={whatsapp.templateName}
                onChange={(e) => setWhatsApp({ templateName: e.target.value })}
                size="small"
                fullWidth
                helperText="Used in the Send Test WhatsApp step"
              />
              <TextField
                label="Default Template Language"
                value={whatsapp.templateLanguage}
                onChange={(e) => setWhatsApp({ templateLanguage: e.target.value })}
                size="small"
                fullWidth
                placeholder="en_US"
              />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </>
  );
}
