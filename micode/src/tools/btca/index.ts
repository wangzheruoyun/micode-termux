// src/tools/btca/index.ts
import { spawn, spawnSync } from "node:child_process";

import { tool } from "@opencode-ai/plugin/tool";
import { config } from "@/utils/config";
import { log } from "@/utils/logger";
import { extractErrorMessage } from "@/utils/errors";

const BTCA_COMMAND = "btca";

export interface BtcaStatus {
  readonly available: boolean;
  readonly message?: string;
}

export async function checkBtcaAvailable(): Promise<BtcaStatus> {
  try {
    const result = spawnSync("command", ["-v", BTCA_COMMAND], { encoding: "utf8" });
    if (result.status === 0 && result.stdout.trim()) {
      return { available: true };
    }
  } catch {
    // command -v not available, try which as fallback
    try {
      const result = spawnSync("which", [BTCA_COMMAND], { encoding: "utf8" });
      if (result.status === 0 && result.stdout.trim()) {
        return { available: true };
      }
    } catch {
      // which not available either
    }
  }
  const message = `btca CLI not found. Library source code search will not work.\nInstall with:\n  npm install -g btca\n  # or\n  bun add -g btca\n\nNote: btca requires Bun runtime. On Node.js/Termux, install Bun first.`;
  return { available: false, message };
}

async function runBtca(args: string[]): Promise<{ stdout: string; stderr: string; error?: string }> {
  try {
    const { spawn } = await import("node:child_process");
    const proc = spawn(BTCA_COMMAND, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const [stdout, stderr] = await Promise.all([
      new Promise<string>((resolve) => {
        let output = "";
        proc.stdout?.on("data", (chunk: Buffer) => (output += chunk.toString()));
        proc.stdout?.on("end", () => resolve(output));
      }),
      new Promise<string>((resolve) => {
        let output = "";
        proc.stderr?.on("data", (chunk: Buffer) => (output += chunk.toString()));
        proc.stderr?.on("end", () => resolve(output));
      }),
    ]);

    const exitCode = await new Promise<number>((resolve) => proc.on("close", resolve));

    if (exitCode !== 0 && !stdout.trim()) {
      return { stdout: "", stderr, error: stderr.trim() || `Exit code ${exitCode}` };
    }

    return { stdout, stderr };
  } catch (e) {
    const err = e as Error;
    if (err.message?.includes("ENOENT")) {
      return {
        stdout: "",
        stderr: "",
        error:
          "btca CLI not found. Install from: https://github.com/davis7dotsh/better-context\n  bun add -g btca",
      };
    }
    return { stdout: "", stderr: "", error: err.message };
  }
}

export const btca_ask = tool({
  description:
    "Query library source code and documentation using the btca CLI. " +
    "Useful for finding function signatures, examples, and usage patterns in popular libraries. " +
    "Example: btca_ask({ query: \"how to use React useEffect\", libraries: [\"react\"] })",
  args: {
    query: tool.schema.string().describe("The question or search query"),
    libraries: tool.schema.array(tool.schema.string()).optional().describe("Specific libraries to search (e.g., ['react', 'lodash'])"),
    limit: tool.schema.number().optional().describe("Maximum number of results (default: 10)"),
  },
  execute: async (args) => {
    const btcaArgs = ["ask", args.query];
    if (args.libraries?.length) {
      btcaArgs.push("-l", args.libraries.join(","));
    }
    if (args.limit) {
      btcaArgs.push("--limit", String(args.limit));
    }
    btcaArgs.push("--json");

    const result = await runBtca(btcaArgs);
    if (result.error) return `Error: ${result.error}`;
    if (!result.stdout.trim()) return "No results found.";
    return result.stdout;
  },
});
