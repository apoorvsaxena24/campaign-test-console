import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { Download, Assessment } from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import PageHeader from "@/components/layout/PageHeader";
import { useHealthCheckStore } from "@/store/healthCheckStore";
import { useTestCaseStore } from "@/store/testCaseStore";

const COLORS = { pass: "#00B894", fail: "#E17055", untested: "#636E72" };

function exportToCsv(
  checks: Array<{ name: string; method: string; path: string; status: string; httpCode: number | null; responseTimeMs: number | null }>,
) {
  const header = "Endpoint,Method,Path,Status,HTTP_Code,Response_Time_ms\n";
  const rows = checks
    .map(
      (c) =>
        `"${c.name}","${c.method}","${c.path}","${c.status}",${c.httpCode ?? ""},${c.responseTimeMs ?? ""}`,
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ctc-results-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsPage() {
  const checks = useHealthCheckStore((s) => s.checks);
  const lastRunAt = useHealthCheckStore((s) => s.lastRunAt);
  const pastRuns = useTestCaseStore((s) => s.pastRuns);

  const total = checks.length;
  const pass = checks.filter((c) => c.status === "pass").length;
  const fail = checks.filter((c) => c.status === "fail").length;
  const untested = checks.filter((c) => c.status === "untested").length;

  const pieData = [
    { name: "Passed", value: pass },
    { name: "Failed", value: fail },
    { name: "Untested", value: untested },
  ].filter((d) => d.value > 0);

  const barData = checks
    .filter((c) => c.responseTimeMs != null)
    .map((c) => ({
      name: c.name,
      time: c.responseTimeMs!,
      fill: c.status === "pass" ? COLORS.pass : COLORS.fail,
    }));

  return (
    <>
      <PageHeader
        title="Results Dashboard"
        subtitle={lastRunAt ? `Last run: ${new Date(lastRunAt).toLocaleString()}` : "No results yet"}
        action={
          checks.length > 0 ? (
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => exportToCsv(checks)}
            >
              Export CSV
            </Button>
          ) : undefined
        }
      />

      {checks.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Assessment sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Run a health check or E2E test to see results here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {/* Summary Cards */}
          <Stack direction="row" spacing={2}>
            {[
              { label: "Total", value: total, color: "text.primary" },
              { label: "Passed", value: pass, color: COLORS.pass },
              { label: "Failed", value: fail, color: COLORS.fail },
              { label: "Untested", value: untested, color: COLORS.untested },
            ].map((card) => (
              <Card key={card.label} sx={{ flex: 1 }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h3" sx={{ color: card.color }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.label}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>

          {/* Charts */}
          <Stack direction="row" spacing={2}>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Pass / Fail Distribution
                </Typography>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              entry.name === "Passed"
                                ? COLORS.pass
                                : entry.name === "Failed"
                                  ? COLORS.fail
                                  : COLORS.untested
                            }
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ flex: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Response Times (ms)
                </Typography>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1A1A2E",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="time" radius={[4, 4, 0, 0]}>
                        {barData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Stack>

          {/* Endpoint Details Table */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Endpoint Results
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Endpoint</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>HTTP Code</TableCell>
                      <TableCell>Response Time</TableCell>
                      <TableCell>Errors</TableCell>
                      <TableCell>How to Fix</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {checks.map((c) => (
                      <TableRow key={c.id} sx={c.status === "fail" ? { bgcolor: "rgba(225,112,85,0.06)" } : undefined}>
                        <TableCell>
                          <Typography variant="caption" fontWeight={600}>
                            {c.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={c.method} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={c.status}
                            size="small"
                            color={c.status === "pass" ? "success" : c.status === "fail" ? "error" : "default"}
                          />
                        </TableCell>
                        <TableCell>{c.httpCode ?? "—"}</TableCell>
                        <TableCell>{c.responseTimeMs != null ? `${c.responseTimeMs}ms` : "—"}</TableCell>
                        <TableCell>
                          <Typography variant="caption" color="error">
                            {c.error || c.validationErrors.join(", ") || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 320 }}>
                          {c.hint ? (
                            <Typography variant="caption" sx={{ whiteSpace: "pre-line", color: "warning.main" }}>
                              {c.hint}
                            </Typography>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Stack>
      )}
    </>
  );
}
