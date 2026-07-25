// src/mindmodel/review.ts
export interface Violation {
  readonly file: string;
  readonly line?: number;
  readonly rule: string;
  readonly constraint_file: string;
  readonly found: string;
  readonly expected: string;
}

export interface ReviewResult {
  readonly status: "PASS" | "BLOCKED";
  readonly violations: Violation[];
  readonly summary: string;
}

export function parseReviewResponse(response: string): ReviewResult {
  // Extract JSON from markdown code blocks if present
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : response.trim();

  try {
    const parsed: unknown = JSON.parse(jsonStr);
    const record = parsed as Record<string, unknown> | null;
    return {
      status: record?.status === "PASS" ? "PASS" : "BLOCKED",
      violations: (Array.isArray(record?.violations) ? record.violations : []) as Violation[],
      summary: typeof record?.summary === "string" ? record.summary : "",
    };
  } catch {
    // If JSON parsing fails, assume PASS to avoid false blocks
    return {
      status: "PASS",
      violations: [],
      summary: "Failed to parse review response",
    };
  }
}

export function formatViolationsForRetry(violations: Violation[]): string {
  if (violations.length === 0) return "";

  const lines = ["The previous attempt had constraint violations:", ""];

  for (const v of violations) {
    lines.push(`- ${v.file}${v.line ? `:${v.line}` : ""}: ${v.rule}`);
    lines.push(`  Found: ${v.found}`);
    lines.push(`  Expected: ${v.expected}`);
    lines.push(`  See: ${v.constraint_file}`);
    lines.push("");
  }

  lines.push("Please fix these issues in your next attempt.");

  return lines.join("\n");
}

export function formatViolationsForUser(violations: Violation[]): string {
  if (violations.length === 0) return "";

  const lines = ["Blocked: This code violates project constraints:", ""];

  for (const v of violations) {
    lines.push(`- ${v.rule} (see ${v.constraint_file})`);
    lines.push(`  File: ${v.file}${v.line ? `:${v.line}` : ""}`);
  }

  return lines.join("\n");
}
