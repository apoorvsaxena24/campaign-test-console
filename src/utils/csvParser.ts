import * as XLSX from "xlsx";
import type { TestCase } from "@/types/testCase";

const HEADER_MAP: Record<string, keyof TestCase> = {
  test_case_id: "id",
  testcaseid: "id",
  category: "category",
  sub_category: "subCategory",
  subcategory: "subCategory",
  priority: "priority",
  test_type: "testType",
  testtype: "testType",
  pre_conditions: "preConditions",
  preconditions: "preConditions",
  test_steps: "testSteps",
  teststeps: "testSteps",
  expected_result: "expectedResult",
  expectedresult: "expectedResult",
  actual_result: "actualResult",
  actualresult: "actualResult",
  status: "status",
  tested_by: "testedBy",
  testedby: "testedBy",
  test_date: "testDate",
  testdate: "testDate",
  comments: "comments",
  mapped_jira_cards: "mappedJiraCards",
  mappedjracards: "mappedJiraCards",
  channel: "channel",
  campaign_type: "campaignType",
  campaigntype: "campaignType",
  template_id: "templateId",
  templateid: "templateId",
  list_ids: "listIds",
  listids: "listIds",
  variable_mapping: "variableMapping",
  variablemapping: "variableMapping",
  test_numbers: "testNumbers",
  testnumbers: "testNumbers",
  expected_status: "expectedStatus",
  expectedstatus: "expectedStatus",
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function parseFile(file: File): Promise<TestCase[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
          defval: "",
        });

        const cases: TestCase[] = rows.map((row, idx) => {
          const tc: Record<string, string> = {};
          for (const [key, value] of Object.entries(row)) {
            const norm = normalizeHeader(key);
            for (const [pattern, field] of Object.entries(HEADER_MAP)) {
              if (normalizeHeader(pattern) === norm) {
                tc[field] = String(value);
                break;
              }
            }
          }

          return {
            id: tc.id || `TC-${idx + 1}`,
            category: tc.category || "",
            subCategory: tc.subCategory || "",
            priority: tc.priority || "",
            testType: tc.testType || "",
            preConditions: tc.preConditions || "",
            testSteps: tc.testSteps || "",
            expectedResult: tc.expectedResult || "",
            actualResult: tc.actualResult || "",
            status: "pending" as const,
            testedBy: tc.testedBy || "",
            testDate: tc.testDate || "",
            comments: tc.comments || "",
            mappedJiraCards: tc.mappedJiraCards || "",
            channel: tc.channel || "",
            campaignType: tc.campaignType || "",
            templateId: tc.templateId || "",
            listIds: tc.listIds || "",
            variableMapping: tc.variableMapping || "",
            testNumbers: tc.testNumbers || "",
            expectedStatus: tc.expectedStatus || "",
          };
        });

        resolve(cases);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
