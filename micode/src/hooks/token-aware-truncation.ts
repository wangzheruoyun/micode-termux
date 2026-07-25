import type { PluginInput } from "@opencode-ai/plugin";
import { config } from "@/utils/config";

// Tools that benefit from truncation
const TRUNCATABLE_TOOLS = ["grep", "Grep", "glob", "Glob", "ast_grep_search"];

function estimateTokens(text: string): number {
  return Math.ceil(text.length / config.tokens.charsPerToken);
}

function truncateToTokenLimit(
  output: string,
  maxTokens: number,
  preserveLines: number = config.tokens.preserveHeaderLines,
): string {
  const tokens = estimateTokens(output);

  if (tokens <= maxTokens) {
    return output;
  }

  const lines = output.split("\n");

  // Preserve header lines
  const headerLines = lines.slice(0, preserveLines);
  const remainingLines = lines.slice(preserveLines);

  // Calculate available tokens for content
  const headerTokens = estimateTokens(headerLines.join("\n"));
  const truncationMsgTokens = 50; // Reserve for truncation message
  const availableTokens = maxTokens - headerTokens - truncationMsgTokens;

  if (availableTokens <= 0) {
    return `${headerLines.join("\n")}\n\n[Output truncated - context window limit reached]`;
  }

  // Accumulate lines until we hit the limit
  const resultLines: string[] = [];
  let usedTokens = 0;
  let truncatedCount = 0;

  for (const line of remainingLines) {
    const lineTokens = estimateTokens(line);
    if (usedTokens + lineTokens > availableTokens) {
      truncatedCount = remainingLines.length - resultLines.length;
      break;
    }
    resultLines.push(line);
    usedTokens += lineTokens;
  }

  if (truncatedCount === 0) {
    return output;
  }

  return [
    ...headerLines,
    ...resultLines,
    "",
    `[${truncatedCount} more lines truncated due to context window limit]`,
  ].join("\n");
}

interface TokenUsage {
  used: number;
  limit: number;
}

const DEFAULT_USAGE: TokenUsage = { used: 0, limit: config.tokens.defaultContextLimit };

function calculateMaxOutputTokens(used: number, limit: number): number {
  const remaining = limit - used;
  const available = Math.floor(remaining * config.tokens.safetyMargin);
  if (available <= 0) return 0;
  return Math.min(available, config.tokens.defaultMaxOutputTokens);
}

function extractUsageFromMessages(messages: unknown[]): TokenUsage {
  const lastAssistant = [...messages].reverse().find((m) => {
    const msg = m as Record<string, unknown>;
    const info = msg.info as Record<string, unknown> | undefined;
    return info?.role === "assistant";
  }) as Record<string, unknown> | undefined;

  if (!lastAssistant) return DEFAULT_USAGE;

  const info = lastAssistant.info as Record<string, unknown> | undefined;
  const usage = info?.usage as Record<string, unknown> | undefined;
  const inputTokens = (usage?.inputTokens as number) || 0;
  const cacheRead = (usage?.cacheReadInputTokens as number) || 0;
  return { used: inputTokens + cacheRead, limit: config.tokens.defaultContextLimit };
}

function applyTruncation(text: string, maxTokens: number): string {
  if (maxTokens <= 0) {
    return "[Output suppressed - context window exhausted. Consider compacting.]";
  }
  const tokens = estimateTokens(text);
  return tokens > maxTokens ? truncateToTokenLimit(text, maxTokens) : text;
}

async function fetchTokenUsage(
  ctx: PluginInput,
  sessionID: string,
  cache: Map<string, TokenUsage>,
): Promise<TokenUsage> {
  try {
    const resp = await ctx.client.session.messages({
      path: { id: sessionID },
      query: { directory: ctx.directory },
    });
    const messages = (resp as { data?: unknown[] }).data;
    if (!Array.isArray(messages) || messages.length === 0) return DEFAULT_USAGE;

    const tokenUsage = extractUsageFromMessages(messages);
    cache.set(sessionID, tokenUsage);
    return tokenUsage;
  } catch {
    return cache.get(sessionID) || DEFAULT_USAGE;
  }
}

interface TokenAwareTruncationHooks {
  event: (input: { event: { type: string; properties?: unknown } }) => Promise<void>;
  "tool.execute.after": (input: { name: string; sessionID: string }, output: { output?: string }) => Promise<void>;
}

export function createTokenAwareTruncationHook(ctx: PluginInput): TokenAwareTruncationHooks {
  const cache = new Map<string, TokenUsage>();

  return {
    event: async ({ event }: { event: { type: string; properties?: unknown } }) => {
      const props = event.properties as Record<string, unknown> | undefined;

      if (event.type === "session.deleted") {
        const sessionInfo = props?.info as { id?: string } | undefined;
        if (sessionInfo?.id) cache.delete(sessionInfo.id);
        return;
      }

      if (event.type === "message.updated") {
        const info = props?.info as Record<string, unknown> | undefined;
        const sessionID = info?.sessionID as string | undefined;
        if (sessionID && info?.role === "assistant") await fetchTokenUsage(ctx, sessionID, cache);
      }
    },

    "tool.execute.after": async (input: { name: string; sessionID: string }, output: { output?: string }) => {
      if (!TRUNCATABLE_TOOLS.includes(input.name)) return;
      if (!output.output || typeof output.output !== "string") return;

      try {
        const { used, limit } = await fetchTokenUsage(ctx, input.sessionID, cache);
        output.output = applyTruncation(output.output, calculateMaxOutputTokens(used, limit));
      } catch {
        output.output = applyTruncation(output.output, config.tokens.defaultMaxOutputTokens);
      }
    },
  };
}
