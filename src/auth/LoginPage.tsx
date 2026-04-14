import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Tooltip,
  Divider,
} from "@mui/material";
import { Lock, Login } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "./authStore";
import { SSO_ENABLED } from "./iamixAuth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = login(username, password);
    if (success) {
      navigate("/", { replace: true });
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Card sx={{ width: 420, p: 1 }}>
        <CardContent>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Lock sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
            <Typography variant="h5">Campaign Test Console</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Backend Wiring Verification
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Username"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              startIcon={<Login />}
            >
              Sign In
            </Button>
          </form>

          <Divider sx={{ my: 2.5 }}>
            <Typography variant="caption" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Tooltip title="SSO integration coming in v2 (iamix/Auth0)" arrow>
            <span>
              <Button
                variant="outlined"
                fullWidth
                disabled={!SSO_ENABLED}
                sx={{ opacity: 0.5 }}
              >
                Sign in with SSO (Coming Soon)
              </Button>
            </span>
          </Tooltip>
        </CardContent>
      </Card>
    </Box>
  );
}
