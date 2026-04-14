import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Settings,
  HealthAndSafety,
  UploadFile,
  Assessment,
  Sms,
  WhatsApp,
  Phone,
  DialerSip,
  Chat,
  Logout,
  BugReport,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/auth/authStore";

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  disabled?: boolean;
  badge?: string;
}

const mainNav: NavItem[] = [
  { label: "Health Check", path: "/", icon: <HealthAndSafety /> },
  { label: "Configuration", path: "/config", icon: <Settings /> },
  { label: "Test Cases", path: "/test-cases", icon: <UploadFile /> },
  { label: "Results", path: "/results", icon: <Assessment /> },
];

const channelNav: NavItem[] = [
  { label: "SMS Testing", path: "/sms", icon: <Sms /> },
  { label: "WhatsApp Testing", path: "/whatsapp", icon: <WhatsApp /> },
  { label: "Call Testing", path: "/call", icon: <Phone />, disabled: true, badge: "Soon" },
  { label: "OB Dialer Testing", path: "/dialer", icon: <DialerSip />, disabled: true, badge: "Soon" },
  { label: "RCS Testing", path: "/rcs", icon: <Chat />, disabled: true, badge: "Soon" },
];

function isSelected(currentPath: string, navPath: string): boolean {
  if (navPath === "/") return currentPath === "/";
  return currentPath.startsWith(navPath);
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          bgcolor: "background.paper",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        },
      }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <BugReport sx={{ color: "primary.main", fontSize: 32 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            CTC
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Campaign Test Console
          </Typography>
        </Box>
      </Box>

      <Divider />

      <List sx={{ px: 1, py: 1 }}>
        {mainNav.map((item) => (
          <ListItemButton
            key={item.path}
            selected={isSelected(location.pathname, item.path)}
            onClick={() => navigate(item.path)}
            sx={{ borderRadius: 1.5, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ mx: 2 }} />

      <Typography
        variant="overline"
        sx={{ px: 2.5, pt: 1.5, pb: 0.5, color: "text.secondary" }}
      >
        Channel E2E Tests
      </Typography>

      <List sx={{ px: 1 }}>
        {channelNav.map((item) => (
          <Tooltip
            key={item.path}
            title={item.disabled ? "Coming Soon" : item.label}
            placement="right"
          >
            <span>
              <ListItemButton
                disabled={item.disabled}
                selected={!item.disabled && isSelected(location.pathname, item.path)}
                onClick={() => !item.disabled && navigate(item.path)}
                sx={{ borderRadius: 1.5, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: 10, height: 20, opacity: 0.6 }}
                  />
                )}
              </ListItemButton>
            </span>
          </Tooltip>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider />
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {user?.username ?? "Guest"}
        </Typography>
        <Tooltip title="Logout">
          <IconButton
            size="small"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <Logout fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
