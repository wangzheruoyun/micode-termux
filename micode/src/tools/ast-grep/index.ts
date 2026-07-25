import { tool } from "@opencode-ai/plugin/tool";
import { spawn, spawnSync } from "node:child_process";

import { config } from "@/utils/config";
import { log } from "@/utils/logger";
import { extractErrorMessage } from "@/utils/errors";

const SG_COMMAND = "sg";

export interface AstGrepStatus {
  readonly available: boolean;
  readonly message?: string;
}

export async function checkAstGrepAvailable(): Promise<AstGrepStatus> {
  try {
    const result = spawnSync("command", ["-v", SG_COMMAND], { encoding: "utf8" });
    if (result.status === 0 && result.stdout.trim()) {
      return { available: true };
    }
  } catch {
    // command -v not available, try which as fallback
    try {
      const result = spawnSync("which", [SG_COMMAND], { encoding: "utf8" });
      if (result.status === 0 && result.stdout.trim()) {
        return { available: true };
      }
    } catch {
      // which not available either
    }
  }
  const message = `ast-grep (sg) not found in PATH. Install with:\n  cargo install ast-grep --locked\n  npm install -g @ast-grep/cli`;
  return { available: false, message };
}

const LANGUAGES = [
  "c",
  "cpp",
  "csharp",
  "css",
  "dart",
  "elixir",
  "go",
  "haskell",
  "html",
  "java",
  "javascript",
  "json",
  "kotlin",
  "lua",
  "php",
  "python",
  "ruby",
  "rust",
  "scala",
  "sql",
  "swift",
  "tsx",
  "typescript",
  "yaml",
] as const;

interface Match {
  file: string;
  range: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  text: string;
  replacement?: string;
}

async function runSg(args: string[]): Promise<{ matches: Match[]; error?: string }> {
  return new Promise((resolve) => {
    const proc = spawn(SG_COMMAND, args, { cwd: process.cwd() });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("error", (err) => {
      if (err.message.includes("ENOENT")) {
        resolve({
          matches: [],
          error:
            "ast-grep CLI not found. Install with:\n" +
            "  npm install -g @ast-grep/cli\n" +
            "  cargo install ast-grep --locked\n" +
            "  brew install ast-grep",
        });
      } else {
        resolve({ matches: [], error: err.message });
      }
    });

    proc.on("close", (exitCode) => {
      const isNoFilesFound = exitCode !== 0 && !stdout.trim() && stderr.includes("No files found");
      if (isNoFilesFound) {
        resolve({ matches: [] });
        return;
      }
      if (exitCode !== 0 && !stdout.trim()) {
        resolve({ matches: [], error: stderr.trim() || `Exit code ${exitCode}` });
        return;
      }

      if (!stdout.trim()) {
        resolve({ matches: [] });
        return;
      }

      try {
        const matches = JSON.parse(stdout) as Match[];
        resolve({ matches });
      } catch {
        resolve({ matches: [], error: "Failed to parse output" });
      }
    });
  });
}

const MAX_DISPLAY_MATCHES = 100;
const MAX_MATCH_TEXT_LENGTH = 100;

function formatMatches(matches: Match[], isDryRun = false): string {
  if (matches.length === 0) return "No matches found";

  const truncated = matches.length > MAX_DISPLAY_MATCHES;
  const shown = matches.slice(0, MAX_DISPLAY_MATCHES);

  const lines = shown.map((m) => {
    const loc = `${m.file}:${m.range.start.line}:${m.range.start.column}`;
    const text = m.text.length > MAX_MATCH_TEXT_LENGTH ? `${m.text.slice(0, MAX_MATCH_TEXT_LENGTH)}...` : m.text;
    if (isDryRun && m.replacement) {
      return `${loc}\n  - ${text}\n  + ${m.replacement}`;
    }
    return `${loc}: ${text}`;
  });

  if (truncated) {
    lines.unshift(`Found ${matches.length} matches (showing first ${MAX_DISPLAY_MATCHES}):`);
  }

  return lines.join("\n");
}

export const ast_grep_search = tool({
  description:
    "Search code patterns using AST-aware matching. " +
    "Use meta-variables: $VAR (single node), $$$ (multiple nodes). " +
    "Patterns must be complete AST nodes. " +
    "Examples: 'console.log($MSG)', 'def $FUNC($$$):', 'async function $NAME($$$)'",
  args: {
    pattern: tool.schema.string().describe("AST pattern with meta-variables"),
    lang: tool.schema.enum(LANGUAGES).describe("Target language"),
    paths: tool.schema.array(tool.schema.string()).optional().describe("Paths to search"),
  },
  execute: async (args) => {
    const sgArgs = ["run", "-p", args.pattern, "--lang", args.lang, "--json=compact"];
    if (args.paths?.length) {
      sgArgs.push(...args.paths);
    } else {
      sgArgs.push(".");
    }

    const sgOutput = await runSg(sgArgs);
    if (sgOutput.error) return `Error: ${sgOutput.error}`;
    return formatMatches(sgOutput.matches);
  },
});

export const ast_grep_replace = tool({
  description:
    "Replace code patterns with AST-aware rewriting. " +
    "Dry-run by default. Use meta-variables in rewrite to preserve matched content. " +
    "Example: pattern='console.log($MSG)' rewrite='logger.info($MSG)'",
  args: {
    pattern: tool.schema.string().describe("AST pattern to match"),
    rewrite: tool.schema.string().describe("Replacement pattern"),
    lang: tool.schema.enum(LANGUAGES).describe("Target language"),
    paths: tool.schema.array(tool.schema.string()).optional().describe("Paths to search"),
    apply: tool.schema.boolean().optional().describe("Apply changes (default: false, dry-run)"),
  },
  execute: async (args) => {
    const sgArgs = ["run", "-p", args.pattern, "-r", args.rewrite, "--lang", args.lang, "--json=compact"];

    if (args.apply) {
      sgArgs.push("--update-all");
    }

    if (args.paths?.length) {
      sgArgs.push(...args.paths);
    } else {
      sgArgs.push(".");
    }

    const sgOutput = await runSg(sgArgs);
    if (sgOutput.error) return `Error: ${sgOutput.error}`;

    const isDryRun = !args.apply;
    const output = formatMatches(sgOutput.matches, isDryRun);

    if (isDryRun && sgOutput.matches.length > 0) {
      return `${output}\n\n(Dry run - use apply=true to apply changes)`;
    }
    if (args.apply && sgOutput.matches.length > 0) {
      return `Applied ${sgOutput.matches.length} replacements:\n${output}`;
    }
    return output;
  },
});
