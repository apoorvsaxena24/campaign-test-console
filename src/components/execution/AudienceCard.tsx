import { useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from "@mui/material";
import {
  PersonAdd,
  UploadFile,
  Delete,
  Info,
  Add,
  CloudUpload,
} from "@mui/icons-material";
import type { AudienceMode } from "./shared";
import { CSV_FORMAT_GUIDE, CSV_FORMAT_HELP } from "./shared";

interface AudienceCardProps {
  audienceMode: AudienceMode;
  onAudienceModeChange: (mode: AudienceMode) => void;
  manualContacts: string[];
  onAddContact: (phone: string) => void;
  onRemoveContact: (phone: string) => void;
  csvFile: File | null;
  onCsvFileChange: (file: File | null) => void;
}

export default function AudienceCard({
  audienceMode,
  onAudienceModeChange,
  manualContacts,
  onAddContact,
  onRemoveContact,
  csvFile,
  onCsvFileChange,
}: AudienceCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const handleAddPhone = () => {
    const val = phoneInputRef.current?.value?.trim();
    if (val) {
      onAddContact(val);
      if (phoneInputRef.current) phoneInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Audience
          </Typography>
          <ToggleButtonGroup
            value={audienceMode}
            exclusive
            onChange={(_, v) => {
              if (v) onAudienceModeChange(v);
            }}
            size="small"
          >
            <ToggleButton value="contacts">
              <PersonAdd sx={{ mr: 0.5, fontSize: 18 }} /> Enter Contacts
            </ToggleButton>
            <ToggleButton value="csv">
              <UploadFile sx={{ mr: 0.5, fontSize: 18 }} /> Upload CSV
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {audienceMode === "contacts" && (
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1.5 }}
            >
              Enter phone numbers with country code. The console will create a
              list and add these contacts before running the test flow.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                inputRef={phoneInputRef}
                size="small"
                placeholder="+91XXXXXXXXXX"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddPhone();
                }}
                sx={{ minWidth: 220 }}
              />
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddPhone}
              >
                Add
              </Button>
            </Stack>
            {manualContacts.length > 0 && (
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                {manualContacts.map((phone) => (
                  <Chip
                    key={phone}
                    label={phone}
                    onDelete={() => onRemoveContact(phone)}
                    deleteIcon={<Delete />}
                    variant="outlined"
                  />
                ))}
              </Stack>
            )}
            {manualContacts.length === 0 && (
              <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                Add at least one contact number to proceed.
              </Alert>
            )}
          </Box>
        )}

        {audienceMode === "csv" && (
          <Box>
            <Alert severity="info" icon={<Info />} sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                CSV Format
              </Typography>
              <Typography
                variant="caption"
                sx={{ whiteSpace: "pre-line", display: "block", mb: 1 }}
              >
                {CSV_FORMAT_HELP}
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: "rgba(0,0,0,0.2)",
                  p: 1.5,
                  borderRadius: 1,
                  fontSize: 12,
                  overflow: "auto",
                  mt: 1,
                }}
              >
                {CSV_FORMAT_GUIDE}
              </Box>
            </Alert>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onCsvFileChange(f);
              }}
            />

            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
              >
                {csvFile ? "Change File" : "Select CSV File"}
              </Button>
              {csvFile && (
                <Chip
                  label={`${csvFile.name} (${(csvFile.size / 1024).toFixed(1)} KB)`}
                  onDelete={() => {
                    onCsvFileChange(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Stack>

            {!csvFile && (
              <Alert severity="warning" variant="outlined" sx={{ mt: 2 }}>
                Select a CSV file to proceed.
              </Alert>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
