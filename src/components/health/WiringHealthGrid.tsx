import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
  Button,
  Collapse,
  IconButton,
  Stack,
  LinearProgress,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  ExpandMore,
  ExpandLess,
  PlayArrow,
  Refresh,
  Lightbulb,
} from "@mui/icons-material";
import { useHealthCheckStore } from "@/store/healthCheckStore";
import { useHealthCheck } from "@/hooks/useHealthCheck";
import type { EndpointCheck, EndpointCategory } from "@/types/api";
import ResponseInspector from "./ResponseInspector";

const CATEGORY_LABELS: Record<EndpointCategory, string> = {
  config: "Config / Auth",
  sms: "SMS",
  whatsapp: "WhatsApp",
  lists: "Lists",
  contacts: "Contacts",
};

const STATUS_COLORS: Record<string, "success" | "error" | "default" | "info"> = {
  pass: "success",
  fail: "error",
  untested: "default",
  running: "info",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "pass") return <CheckCircle color="success" fontSize="small" />;
  if (status === "fail") return <Cancel color="error" fontSize="small" />;
  if (status === "running") return <HourglassEmpty color="info" fontSize="small" />;
  return <HourglassEmpty sx={{ opacity: 0.3 }} fontSize="small" />;
}

function CheckRow({ check }: { check: EndpointCheck }) {
  const [open, setOpen] = useState(check.status === "fail");

  useEffect(() => {
    if (check.status === "fail") setOpen(true);
  }, [check.status]);

  return (
    <Box
      sx={{
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.5,
          cursor: "pointer",
          "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
        }}
        onClick={() => setOpen(!open)}
      >
        <StatusIcon status={check.status} />
        <Chip
          label={check.method}
          size="small"
          variant="outlined"
          sx={{ fontFamily: "monospace", fontSize: 11, minWidth: 50 }}
        />
        <Typography variant="body2" fontWeight={500} sx={{ minWidth: 180 }}>
          {check.name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flexGrow: 1, fontFamily: "monospace" }}
        >
          {check.path || "—"}
        </Typography>
        {check.httpCode && (
          <Chip
            label={check.httpCode}
            size="small"
            color={check.httpCode < 400 ? "success" : "error"}
            sx={{ fontFamily: "monospace", fontSize: 11 }}
          />
        )}
        {check.responseTimeMs != null && (
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, textAlign: "right" }}>
            {check.responseTimeMs}ms
          </Typography>
        )}
        <IconButton size="small">
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 3, pb: 2, bgcolor: "rgba(0,0,0,0.15)" }}>
          <Typography variant="caption" color="text.secondary">
            {check.description}
          </Typography>

          {check.validationErrors.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {check.validationErrors.map((err, i) => (
                <Typography
                  key={i}
                  variant="caption"
                  color="error"
                  display="block"
                >
                  {err}
                </Typography>
              ))}
            </Box>
          )}

          {check.error && (
            <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
              {check.error}
            </Typography>
          )}

          {check.hint && (
            <Alert
              severity="warning"
              icon={<Lightbulb fontSize="small" />}
              sx={{
                mt: 1.5,
                "& .MuiAlert-message": { whiteSpace: "pre-line", fontSize: 13 },
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
                How to fix
              </Typography>
              {check.hint}
            </Alert>
          )}

          <ResponseInspector label="Response" data={check.responseBody} />
        </Box>
      </Collapse>
    </Box>
  );
}

export default function WiringHealthGrid() {
  const checks = useHealthCheckStore((s) => s.checks);
  const isRunning = useHealthCheckStore((s) => s.isRunning);
  const lastRunAt = useHealthCheckStore((s) => s.lastRunAt);
  const total = checks.length;
  const pass = checks.filter((c) => c.status === "pass").length;
  const fail = checks.filter((c) => c.status === "fail").length;
  const untested = checks.filter((c) => c.status === "untested").length;
  const { runAll, runCategory, init } = useHealthCheck();

  useEffect(() => {
    if (checks.length === 0) init();
  }, [checks.length, init]);

  const categories = Object.keys(CATEGORY_LABELS) as EndpointCategory[];

  const failedConfig = checks.some(
    (c) => c.category === "config" && c.status === "fail",
  );

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={runAll}
          disabled={isRunning}
          size="large"
        >
          Run All Checks
        </Button>
        <Tooltip title="Reset all checks">
          <IconButton onClick={init}>
            <Refresh />
          </IconButton>
        </Tooltip>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1.5}>
          <Chip
            label={`${pass} passed`}
            color="success"
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${fail} failed`}
            color="error"
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${untested} untested`}
            size="small"
            variant="outlined"
          />
        </Stack>
        {lastRunAt && (
          <Typography variant="caption" color="text.secondary">
            Last run: {new Date(lastRunAt).toLocaleTimeString()}
          </Typography>
        )}
      </Stack>

      {isRunning && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {failedConfig && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Config / Auth checks failed
          </Typography>
          <Typography variant="body2">
            All other checks depend on a working Config and Auth connection. Fix
            these first by going to <strong>Configuration</strong> and verifying
            your Base URL, Account SID, and auth credentials. Then re-run.
          </Typography>
        </Alert>
      )}

      {categories.map((cat) => {
        const catChecks = checks.filter((c) => c.category === cat);
        if (catChecks.length === 0) return null;

        const catFail = catChecks.some((c) => c.status === "fail");

        return (
          <Card
            key={cat}
            sx={{
              mb: 2,
              border: catFail ? "1px solid rgba(225,112,85,0.3)" : undefined,
            }}
          >
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1.5,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  {CATEGORY_LABELS[cat]}
                </Typography>
                <Button
                  size="small"
                  startIcon={<PlayArrow />}
                  onClick={() => runCategory(cat)}
                  disabled={isRunning}
                >
                  Run
                </Button>
              </Box>
              {catChecks.map((check) => (
                <CheckRow key={check.id} check={check} />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
