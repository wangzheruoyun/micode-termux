import type { PluginInput } from "@opencode-ai/plugin";

import { config } from "@/utils/config";
import { getContextLimit } from "@/utils/model-limits";

const PERCENT_MULTIPLIER = 100;
const TOKENS_PER_KILOTOKEN = 1000;

export interface ContextWindowMonitorConfig {
  /** Model context limits loaded from opencode.json */
  modelContextLimits?: Map<string, number>;
}

interface MonitorState {
  lastWarningTime: Map<string, number>;
  lastUsageRatio: Map<string, number>;
}

interface ContextWindowMonitorHooks {
  "chat.params": (
    input: { sessionID: string },
    output: { system?: string; options?: Record<string, unknown> },
  ) => Promise<void>;
  event: (input: { event: { type: string; properties?: unknown } }) => Promise<void>;
}

export function createContextWindowMonitorHook(
  ctx: PluginInput,
  hookConfig?: ContextWindowMonitorConfig,
): ContextWindowMonitorHooks {
  const modelLimits = hookConfig?.modelContextLimits;
  const state: MonitorState = {
    lastWarningTime: new Map(),
    lastUsageRatio: new Map(),
  };

  return {
    "chat.params": async (input, output) => {
      const usageRatio = state.lastUsageRatio.get(input.sessionID);
      if (!usageRatio || usageRatio < config.contextWindow.warningThreshold) return;
      const message = getEncouragementMessage(usageRatio);
      if (message && output.system) {
        output.system = `${output.system}\n\n<context-status>${message}</context-status>`;
      }
    },

    event: async ({ event }) => {
      const props = event.properties as Record<string, unknown> | undefined;

      if (event.type === "session.deleted") {
        handleSessionDeleted(state, props);
        return;
      }

      if (event.type === "message.updated") {
        await handleMessageUpdated(ctx, state, modelLimits, props);
      }
    },
  };
}

// --- Private helpers ---

function getEncouragementMessage(usageRatio: number): string {
  const remaining = Math.round((1 - usageRatio) * PERCENT_MULTIPLIER);

  if (usageRatio < config.contextWindow.warningThreshold) {
    return "";
  }

  if (usageRatio < config.contextWindow.criticalThreshold) {
    return `Context: ${remaining}% remaining. Plenty of room - don't rush.`;
  }

  return `Context: ${remaining}% remaining. Consider wrapping up or compacting soon.`;
}

function handleSessionDeleted(state: MonitorState, props: Record<string, unknown> | undefined): void {
  const sessionInfo = props?.info as { id?: string } | undefined;
  if (!sessionInfo?.id) return;
  state.lastWarningTime.delete(sessionInfo.id);
  state.lastUsageRatio.delete(sessionInfo.id);
}

async function handleMessageUpdated(
  ctx: PluginInput,
  state: MonitorState,
  modelLimits: Map<string, number> | undefined,
  props: Record<string, unknown> | undefined,
): Promise<void> {
  const info = props?.info as Record<string, unknown> | undefined;
  const sessionID = info?.sessionID as string | undefined;
  if (!sessionID || info?.role !== "assistant") return;

  const tokens = info.tokens as { input?: number; cache?: { read?: number } } | undefined;
  const inputTokens = tokens?.input || 0;
  const cacheRead = tokens?.cache?.read || 0;
  const totalUsed = inputTokens + cacheRead;

  const modelID = (info.modelID as string) || "";
  const providerID = (info.providerID as string) || "";
  const contextLimit = getContextLimit(modelID, providerID, modelLimits);
  const usageRatio = totalUsed / contextLimit;

  state.lastUsageRatio.set(sessionID, usageRatio);

  if (usageRatio < config.contextWindow.warningThreshold) return;
  await maybeShowToast(ctx, state, sessionID, usageRatio, totalUsed, contextLimit);
}

async function maybeShowToast(
  ctx: PluginInput,
  state: MonitorState,
  sessionID: string,
  usageRatio: number,
  totalUsed: number,
  contextLimit: number,
): Promise<void> {
  const lastWarning = state.lastWarningTime.get(sessionID) || 0;
  if (Date.now() - lastWarning <= config.contextWindow.warningCooldownMs) return;

  state.lastWarningTime.set(sessionID, Date.now());

  const remaining = Math.round((1 - usageRatio) * PERCENT_MULTIPLIER);
  const variant = usageRatio >= config.contextWindow.criticalThreshold ? "warning" : "info";

  await ctx.client.tui
    .showToast({
      body: {
        title: "Context Window",
        message: `${remaining}% remaining (${Math.round(totalUsed / TOKENS_PER_KILOTOKEN)}K / ${Math.round(contextLimit / TOKENS_PER_KILOTOKEN)}K tokens)`,
        variant,
        duration: config.timeouts.toastWarningMs,
      },
    })
    .catch((_e: unknown) => {
      /* fire-and-forget */
    });
}
