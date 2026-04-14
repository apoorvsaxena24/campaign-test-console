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
  smsSenderIdMapsPath,
  smsDltEntitiesPath,
  smsTemplatesPath,
  smsTestSendPath,
  messageCampaignsPath,
  listsPath,
} from "@/api/paths";

export default function SmsTestPage() {
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("contacts");
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const config = useConfigStore();

  const [manualContacts, setManualContacts] = useState<string[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const preflight: PreflightItem[] = [
    ...buildCommonPreflight(config.app),
    {
      label: "SMS Sender ID",
      ok: !!config.sms.senderId,
      detail: config.sms.senderId || "(empty — set in Configuration)",
      required: true,
    },
    {
      label: "DLT Entity ID",
      ok: !!config.sms.entityId,
      detail: config.sms.entityId || "(optional for international)",
      required: false,
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

    const audienceSteps = buildAudienceSteps(
      audienceMode,
      manualContacts.length,
      listsPath(),
    );

    const channelSteps: FlowStep[] = [
      makeStep("s1", "Fetch Sender IDs", "GET", smsSenderIdMapsPath()),
      makeStep("s2", "Fetch DLT Entities", "GET", smsDltEntitiesPath()),
      makeStep("s3", "Fetch Lists", "GET", `${listsPath()}?limit=10&offset=0`),
      makeStep("s4", "Fetch SMS Templates", "GET", smsTemplatesPath()),
      makeStep("s5", "Send Test SMS", "POST", smsTestSendPath()),
      makeStep("s6", "List SMS Campaigns", "GET", `${messageCampaignsPath()}?channel=sms&limit=5&offset=0`),
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
      if (allSteps[i].id === "s5") {
        const body = {
          to: testPhone,
          message: "CTC health check test message",
          from: config.sms.senderId || undefined,
          DltEntityId: config.sms.entityId || undefined,
          DltTemplateId: config.sms.dltTemplateIds[0] || undefined,
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
  }, [config, manualContacts, audienceMode, csvFile]);

  const passCount = steps.filter((s) => s.status === "pass").length;
  const failCount = steps.filter((s) => s.status === "fail").length;
  const skipCount = steps.filter((s) => s.status === "skipped").length;

  return (
    <>
      <PageHeader
        title="SMS E2E Testing"
        subtitle="End-to-end SMS campaign wiring verification"
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
              ? "Run the full SMS E2E flow"
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
            >
              Run SMS E2E Flow
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

      {running && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

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
                ? 'Click "Run SMS E2E Flow" to execute the full SMS test sequence.'
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
