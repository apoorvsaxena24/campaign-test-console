import {
  Box,
  Typography,
  Chip,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  ExpandMore,
  ExpandLess,
  PlayCircle,
  Block,
} from "@mui/icons-material";
import { useState } from "react";
import ResponseInspector from "@/components/health/ResponseInspector";

export type StepStatus = "pending" | "running" | "pass" | "fail" | "skipped";

export interface FlowStep {
  id: string;
  name: string;
  method: string;
  path: string;
  status: StepStatus;
  httpCode: number | null;
  responseTimeMs: number | null;
  requestBody: unknown;
  responseBody: unknown;
  error: string | null;
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "pass") return <CheckCircle color="success" fontSize="small" />;
  if (status === "fail") return <Cancel color="error" fontSize="small" />;
  if (status === "running") return <PlayCircle color="info" fontSize="small" />;
  if (status === "skipped") return <Block sx={{ color: "warning.main" }} fontSize="small" />;
  return <HourglassEmpty sx={{ opacity: 0.3 }} fontSize="small" />;
}

export default function FlowStepCard({ step }: { step: FlowStep }) {
  const [open, setOpen] = useState(step.status === "fail");

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor:
          step.status === "fail"
            ? "rgba(225,112,85,0.3)"
            : step.status === "skipped"
              ? "rgba(253,203,110,0.2)"
              : "rgba(255,255,255,0.06)",
        borderRadius: 1.5,
        mb: 1,
        overflow: "hidden",
        opacity: step.status === "skipped" ? 0.6 : 1,
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
        <StatusIcon status={step.status} />
        <Chip
          label={step.method}
          size="small"
          variant="outlined"
          sx={{ fontFamily: "monospace", fontSize: 11, minWidth: 50 }}
        />
        <Typography variant="body2" fontWeight={500}>
          {step.name}
        </Typography>
        {step.status === "skipped" && (
          <Chip label="SKIPPED" size="small" color="warning" sx={{ fontSize: 10, height: 20 }} />
        )}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flexGrow: 1, fontFamily: "monospace" }}
        >
          {step.path}
        </Typography>
        {step.httpCode != null && step.httpCode > 0 && (
          <Chip
            label={step.httpCode}
            size="small"
            color={step.httpCode < 400 ? "success" : "error"}
          />
        )}
        {step.responseTimeMs != null && step.responseTimeMs > 0 && (
          <Typography variant="caption" color="text.secondary">
            {step.responseTimeMs}ms
          </Typography>
        )}
        <IconButton size="small">
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 2, bgcolor: "rgba(0,0,0,0.15)" }}>
          {step.error && (
            <Typography
              variant="caption"
              color={step.status === "skipped" ? "warning.main" : "error"}
              display="block"
              sx={{ mb: 1, whiteSpace: "pre-line" }}
            >
              {step.error}
            </Typography>
          )}
          {step.requestBody != null ? (
            <ResponseInspector label="Request" data={step.requestBody} />
          ) : null}
          {step.responseBody != null ? (
            <ResponseInspector label="Response" data={step.responseBody} />
          ) : null}
        </Box>
      </Collapse>
    </Box>
  );
}
