export type TestStatus = "pending" | "running" | "passed" | "failed" | "skipped";

export interface TestCase {
  id: string;
  category: string;
  subCategory: string;
  priority: string;
  testType: string;
  preConditions: string;
  testSteps: string;
  expectedResult: string;
  actualResult: string;
  status: TestStatus;
  testedBy: string;
  testDate: string;
  comments: string;
  mappedJiraCards: string;
  channel?: string;
  campaignType?: string;
  templateId?: string;
  listIds?: string;
  variableMapping?: string;
  testNumbers?: string;
  expectedStatus?: string;
}

export interface TestResult {
  testCaseId: string;
  endpoint: string;
  method: string;
  path: string;
  status: TestStatus;
  httpCode: number | null;
  responseTimeMs: number;
  requestBody: unknown;
  responseBody: unknown;
  validationResult: string;
  errorMessage: string;
  timestamp: string;
}

export interface TestRun {
  id: string;
  name: string;
  startedAt: string;
  completedAt: string | null;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    avgResponseTimeMs: number;
  };
}
