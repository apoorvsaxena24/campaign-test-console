import { useCallback, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import { UploadFile, Delete, FilterList } from "@mui/icons-material";
import PageHeader from "@/components/layout/PageHeader";
import { useTestCaseStore } from "@/store/testCaseStore";
import { parseFile } from "@/utils/csvParser";

const PRIORITY_COLORS: Record<string, "error" | "warning" | "info" | "default"> = {
  P0: "error",
  P1: "warning",
  P2: "info",
};

export default function TestCasesPage() {
  const { testCases, setTestCases, clearTestCases } = useTestCaseStore();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [uploadError, setUploadError] = useState("");

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadError("");
      try {
        const cases = await parseFile(file);
        setTestCases(cases);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Failed to parse file");
      }
      e.target.value = "";
    },
    [setTestCases],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      setUploadError("");
      try {
        const cases = await parseFile(file);
        setTestCases(cases);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Failed to parse file");
      }
    },
    [setTestCases],
  );

  const categories = [...new Set(testCases.map((tc) => tc.category))].filter(Boolean);
  const priorities = [...new Set(testCases.map((tc) => tc.priority))].filter(Boolean);

  const filtered = testCases.filter((tc) => {
    if (filterCategory !== "all" && tc.category !== filterCategory) return false;
    if (filterPriority !== "all" && tc.priority !== filterPriority) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Test Cases"
        subtitle="Upload and manage test cases from CSV/XLSX files"
        action={
          testCases.length > 0 ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={clearTestCases}
            >
              Clear All
            </Button>
          ) : undefined
        }
      />

      {testCases.length === 0 ? (
        <Card>
          <CardContent>
            <Box
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              sx={{
                border: "2px dashed rgba(108,92,231,0.4)",
                borderRadius: 2,
                p: 6,
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.2s",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <UploadFile sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drop CSV or XLSX file here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Supports the standard test case format with columns: Test_Case_ID,
                Category, Priority, Test_Steps, Expected_Result, etc.
              </Typography>
              <Button variant="contained" component="label">
                Browse Files
                <input
                  type="file"
                  hidden
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </Button>
            </Box>
            {uploadError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {uploadError}
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
            <FilterList color="action" />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                label="Category"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filterPriority}
                label="Priority"
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                {priorities.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              {filtered.length} of {testCases.length} test cases
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="contained" component="label" size="small" startIcon={<UploadFile />}>
              Upload New
              <input
                type="file"
                hidden
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
              />
            </Button>
          </Stack>

          <Card>
            <TableContainer sx={{ maxHeight: "calc(100vh - 260px)" }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Sub-Category</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Test Steps</TableCell>
                    <TableCell>Expected Result</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((tc) => (
                    <TableRow key={tc.id} hover>
                      <TableCell>
                        <Typography variant="caption" fontWeight={600}>
                          {tc.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{tc.category}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{tc.subCategory}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tc.priority || "—"}
                          size="small"
                          color={PRIORITY_COLORS[tc.priority] ?? "default"}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="caption" noWrap>
                          {tc.testSteps}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 250 }}>
                        <Typography variant="caption" noWrap>
                          {tc.expectedResult}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={tc.status} size="small" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}
    </>
  );
}
