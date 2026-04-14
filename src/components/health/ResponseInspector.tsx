import { Box, Typography } from "@mui/material";

interface ResponseInspectorProps {
  label: string;
  data: unknown;
}

export default function ResponseInspector({ label, data }: ResponseInspectorProps) {
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Box
        component="pre"
        sx={{
          mt: 0.5,
          p: 1.5,
          bgcolor: "rgba(0,0,0,0.3)",
          borderRadius: 1,
          fontSize: 12,
          overflow: "auto",
          maxHeight: 300,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {data != null ? JSON.stringify(data, null, 2) : "—"}
      </Box>
    </Box>
  );
}
