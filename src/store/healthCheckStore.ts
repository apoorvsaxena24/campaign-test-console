import { create } from "zustand";
import type { EndpointCheck, EndpointCategory } from "@/types/api";

interface HealthCheckState {
  checks: EndpointCheck[];
  isRunning: boolean;
  lastRunAt: string | null;
  setChecks: (checks: EndpointCheck[]) => void;
  updateCheck: (id: string, patch: Partial<EndpointCheck>) => void;
  setIsRunning: (running: boolean) => void;
  setLastRunAt: (date: string) => void;
  getChecksByCategory: (category: EndpointCategory) => EndpointCheck[];
  getSummary: () => { total: number; pass: number; fail: number; untested: number };
}

export const useHealthCheckStore = create<HealthCheckState>()((set, get) => ({
  checks: [],
  isRunning: false,
  lastRunAt: null,
  setChecks: (checks) => set({ checks }),
  updateCheck: (id, patch) =>
    set((s) => ({
      checks: s.checks.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  setIsRunning: (running) => set({ isRunning: running }),
  setLastRunAt: (date) => set({ lastRunAt: date }),
  getChecksByCategory: (category) =>
    get().checks.filter((c) => c.category === category),
  getSummary: () => {
    const checks = get().checks;
    return {
      total: checks.length,
      pass: checks.filter((c) => c.status === "pass").length,
      fail: checks.filter((c) => c.status === "fail").length,
      untested: checks.filter((c) => c.status === "untested").length,
    };
  },
}));
