import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/auth/LoginPage";
import ProtectedRoute from "@/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppLayout from "@/components/layout/AppLayout";
import HealthCheckPage from "@/pages/HealthCheckPage";
import ConfigPage from "@/pages/ConfigPage";
import TestCasesPage from "@/pages/TestCasesPage";
import SmsTestPage from "@/pages/SmsTestPage";
import WhatsAppTestPage from "@/pages/WhatsAppTestPage";
import ResultsPage from "@/pages/ResultsPage";

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <AppLayout />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<HealthCheckPage />} />
        <Route path="config" element={<ConfigPage />} />
        <Route path="test-cases" element={<TestCasesPage />} />
        <Route path="sms" element={<SmsTestPage />} />
        <Route path="whatsapp" element={<WhatsAppTestPage />} />
        <Route path="results" element={<ResultsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
