import { useState, useCallback } from "react";
import {
  Box,
  Button,
  Stack,
  LinearProgress,
  Chip,
  Divider,
  Tooltip,
  Card,
  CardContent,
  Typography,
  Alert,
} from "@mui/material";
import { PlayArrow } from "@mui/icons-material";
import PageHeader from "@/components/layout/PageHeader";
import FlowStepCard, {
  type FlowStep,
} from "@/components/execution/FlowStepCard";
import PreflightCard from "@/components/execution/PreflightCard";
import AudienceCard from "@/components/execution/AudienceCard";
import {
  type AudienceMode,
  type PreflightItem,
  buildCommonPreflight,
  buildAudienceSteps,
  isPreflightReady,
  makeStep,
  runApiStep,
  runAudienceSetup,
  markRemainingSkipped,
} from "@/components/execution/shared";
import { useConfigStore } from "@/store/configStore";
import {
  wabasPath,
  wabaNumbersPath,
  whatsappTemplatesPath,
  whatsappMessageSendPath,
  messageCampaignsPath,
  listsPath,
} from "@/api/paths";

export default function WhatsAppTestPage() {
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("contacts");
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const config = useConfigStore();

  const [manualContacts, setManualContacts] = useState<string[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const wabaId = config.whatsapp.wabaId;

  const preflight: PreflightItem[] = [
    ...buildCommonPreflight(config.app),
    {
      label: "WABA ID",
      ok: !!wabaId,
      detail: wabaId || "(empty — set in Configuration)",
      required: true,
    },
    {
      label: "WA Sender Number",
      ok: !!config.whatsapp.whatsappNumber,
      detail: config.whatsapp.whatsappNumber || "(empty — set in Configuration)",
      required: true,
    },
    {
      label: "WA Template Name",
      ok: !!config.whatsapp.templateName,
      detail: config.whatsapp.templateName || "(empty — set in Configuration)",
      required: true,
    },
    {
      label: "Audience",
      ok:
        audienceMode === "contacts"
          ? manualContacts.length > 0
          : csvFile !== null,
      detail:
        audienceMode === "contacts"
          ? manualContacts.length > 0
            ? `${manualContacts.length} contact(s)`
            : "No contacts entered"
          : csvFile
            ? csvFile.name
            : "No CSV selected",
      required: true,
    },
  ];

  const allPreflightOk = isPreflightReady(preflight);

  const addContact = (phone: string) => {
    if (phone && !manualContacts.includes(phone)) {
      setManualContacts((prev) => [...prev, phone]);
    }
  };

  const removeContact = (phone: string) => {
    setManualContacts((prev) => prev.filter((p) => p !== phone));
  };

  const runE2E = useCallback(async () => {
    setRunError(null);
    const testPhone =
      manualContacts[0] ||
      config.app.testPhoneNumbers[0] ||
      "+910000000000";
    const wId = wabaId || "test";

    const audienceSteps = buildAudienceSteps(
      audienceMode,
      manualContacts.length,
      listsPath(),
    );

    const channelSteps: FlowStep[] = [
      makeStep("w1", "Fetch WABAs", "GET", wabasPath()),
      makeStep("w2", "Fetch WA Numbers", "GET", `${wabaNumbersPath()}?wabaId=${wId}`),
      makeStep("w3", "Fetch WA Templates", "GET", `${whatsappTemplatesPath()}?wabaId=${wId}`),
      makeStep("w4", "Fetch Lists", "GET", `${listsPath()}?limit=10&offset=0`),
      makeStep("w5", "Send Test WhatsApp", "POST", whatsappMessageSendPath()),
      makeStep("w6", "List WA Campaigns", "GET", `${messageCampaignsPath()}?channel=whatsapp&limit=5&offset=0`),
    ];

    const allSteps = [...audienceSteps, ...channelSteps];
    setSteps(allSteps);
    setRunning(true);

    const { setupStepCount, success: audienceOk } = await runAudienceSetup(
      audienceMode,
      manualContacts,
      csvFile,
      allSteps,
      setSteps,
    );

    if (!audienceOk) {
      markRemainingSkipped(
        allSteps,
        setupStepCount,
        "Skipped — audience setup failed. Fix the audience steps above and re-run.",
        setSteps,
      );
      setRunError("Audience setup failed. Channel API steps were skipped. Expand the failed steps above to see the error details.");
      setRunning(false);
      return;
    }

    for (let i = setupStepCount; i < allSteps.length; i++) {
      allSteps[i] = { ...allSteps[i], status: "running" };
      setSteps([...allSteps]);

      let opts: RequestInit | undefined;
      if (allSteps[i].id === "w5") {
        const body = {
          to: testPhone,
          from: config.whatsapp.whatsappNumber || testPhone,
          content: {
            type: "template",
            template: {
              name: config.whatsapp.templateName || "hello_world",
              language: {
                policy: "deterministic",
                code: config.whatsapp.templateLanguage || "en_US",
              },
            },
          },
        };
        opts = { method: "POST", body: JSON.stringify(body) };
        allSteps[i] = { ...allSteps[i], requestBody: body };
        setSteps([...allSteps]);
      }

      const result = await runApiStep(allSteps[i], opts);
      allSteps[i] = result;
      setSteps([...allSteps]);
    }

    setRunning(false);
  }, [config, manualContacts, audienceMode, csvFile, wabaId]);

  const passCount = steps.filter((s) => s.status === "pass").length;
  const failCount = steps.filter((s) => s.status === "fail").length;
  const skipCount = steps.filter((s) => s.status === "skipped").length;

  return (
    <>
      <PageHeader
        title="WhatsApp E2E Testing"
        subtitle="End-to-end WhatsApp campaign wiring verification"
      />

      <Stack spacing={2.5} sx={{ mb: 3 }}>
        <PreflightCard items={preflight} />
        <AudienceCard
          audienceMode={audienceMode}
          onAudienceModeChange={setAudienceMode}
          manualContacts={manualContacts}
          onAddContact={addContact}
          onRemoveContact={removeContact}
          csvFile={csvFile}
          onCsvFileChange={setCsvFile}
        />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Tooltip
          title={
            allPreflightOk
              ? "Run the full WhatsApp E2E flow"
              : "Fix all required pre-flight items before running"
          }
        >
          <span>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={runE2E}
              disabled={running || !allPreflightOk}
              size="large"
              color="success"
            >
              Run WhatsApp E2E Flow
            </Button>
          </span>
        </Tooltip>
        {steps.length > 0 && (
          <>
            <Chip label={`${passCount} passed`} color="success" size="small" variant="outlined" />
            <Chip label={`${failCount} failed`} color="error" size="small" variant="outlined" />
            {skipCount > 0 && (
              <Chip label={`${skipCount} skipped`} color="warning" size="small" variant="outlined" />
            )}
          </>
        )}
      </Stack>

      {running && <LinearProgress color="success" sx={{ mb: 2, borderRadius: 1 }} />}

      {runError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {runError}
        </Alert>
      )}

      {steps.length === 0 && !running && (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              {allPreflightOk
                ? 'Click "Run WhatsApp E2E Flow" to execute the full WhatsApp test sequence.'
                : "Complete the pre-flight checklist and add your audience above to enable the run."}
            </Typography>
          </CardContent>
        </Card>
      )}

      {steps.length > 0 && (
        <Box>
          {steps.map((step) => (
            <FlowStepCard key={step.id} step={step} />
          ))}
        </Box>
      )}
    </>
  );
}
