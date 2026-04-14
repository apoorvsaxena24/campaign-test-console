import { create } from "zustand";
import type { TestCase, TestResult, TestRun } from "@/types/testCase";

interface TestCaseState {
  testCases: TestCase[];
  currentRun: TestRun | null;
  pastRuns: TestRun[];
  setTestCases: (cases: TestCase[]) => void;
  updateTestCase: (id: string, patch: Partial<TestCase>) => void;
  startRun: (name: string) => void;
  addResult: (result: TestResult) => void;
  completeRun: () => void;
  clearTestCases: () => void;
}

export const useTestCaseStore = create<TestCaseState>()((set, get) => ({
  testCases: [],
  currentRun: null,
  pastRuns: [],
  setTestCases: (cases) => set({ testCases: cases }),
  updateTestCase: (id, patch) =>
    set((s) => ({
      testCases: s.testCases.map((tc) =>
        tc.id === id ? { ...tc, ...patch } : tc,
      ),
    })),
  startRun: (name) =>
    set({
      currentRun: {
        id: crypto.randomUUID(),
        name,
        startedAt: new Date().toISOString(),
        completedAt: null,
        results: [],
        summary: { total: 0, passed: 0, failed: 0, skipped: 0, avgResponseTimeMs: 0 },
      },
    }),
  addResult: (result) =>
    set((s) => {
      if (!s.currentRun) return s;
      const results = [...s.currentRun.results, result];
      const passed = results.filter((r) => r.status === "passed").length;
      const failed = results.filter((r) => r.status === "failed").length;
      const skipped = results.filter((r) => r.status === "skipped").length;
      const totalTime = results.reduce((sum, r) => sum + r.responseTimeMs, 0);
      return {
        currentRun: {
          ...s.currentRun,
          results,
          summary: {
            total: results.length,
            passed,
            failed,
            skipped,
            avgResponseTimeMs: results.length ? totalTime / results.length : 0,
          },
        },
      };
    }),
  completeRun: () => {
    const run = get().currentRun;
    if (!run) return;
    const completed = { ...run, completedAt: new Date().toISOString() };
    set((s) => ({
      currentRun: null,
      pastRuns: [completed, ...s.pastRuns].slice(0, 50),
    }));
  },
  clearTestCases: () => set({ testCases: [] }),
}));
