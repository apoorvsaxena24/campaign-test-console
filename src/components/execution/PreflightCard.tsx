import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";
import type { PreflightItem } from "./shared";

export default function PreflightCard({ items }: { items: PreflightItem[] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Pre-flight Checklist
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 2, display: "block" }}
        >
          All items must be green before you can run. Configure missing items on
          the Configuration page.
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.label}>
                  <TableCell sx={{ width: 32, pr: 0 }}>
                    {item.ok ? (
                      <CheckCircle color="success" fontSize="small" />
                    ) : (
                      <Cancel color="error" fontSize="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {item.label}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      color={item.ok ? "text.secondary" : "error"}
                      sx={{ fontFamily: "monospace" }}
                    >
                      {item.detail}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
