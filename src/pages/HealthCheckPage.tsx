import PageHeader from "@/components/layout/PageHeader";
import WiringHealthGrid from "@/components/health/WiringHealthGrid";

export default function HealthCheckPage() {
  return (
    <>
      <PageHeader
        title="Wiring Health Check"
        subtitle="Verify all backend API endpoints are correctly wired and responding"
      />
      <WiringHealthGrid />
    </>
  );
}
