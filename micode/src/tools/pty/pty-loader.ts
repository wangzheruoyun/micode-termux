// src/tools/pty/pty-loader.ts
// Loads node-pty-android-arm64 (Termux-compatible fork of node-pty) with graceful degradation.
//
// Uses npm alias: npm install node-pty@npm:node-pty-android-arm64
// This keeps require('node-pty') working in code while using the Android ARM64 build.

import { extractErrorMessage } from "@/utils/errors";
import { log } from "@/utils/logger";

const LOG_TAG = "pty.loader";

type NodePtyModule = typeof import("node-pty");

let ptyModule: NodePtyModule | null = null;
let loadAttempted = false;
let loadError: string | null = null;

/**
 * Dynamically load node-pty-android-arm64 with graceful degradation.
 * Returns null if node-pty cannot be loaded (native library missing, etc.)
 */
export async function loadNodePty(): Promise<NodePtyModule | null> {
  if (loadAttempted) return ptyModule;
  loadAttempted = true;

  try {
    ptyModule = await import("node-pty");
    log.info(LOG_TAG, "node-pty-android-arm64 loaded successfully");
    return ptyModule;
  } catch (error) {
    loadError = extractErrorMessage(error);
    const firstLine = loadError.split("\n")[0];
    log.warn(LOG_TAG, `node-pty-android-arm64 unavailable: ${firstLine}`);
    log.warn(LOG_TAG, "PTY tools will be disabled. Install with: npm install node-pty@npm:node-pty-android-arm64");
    ptyModule = null;
    return null;
  }
}

/**
 * Check if node-pty is available (must call loadNodePty first).
 */
export function isNodePtyAvailable(): boolean {
  return ptyModule !== null;
}

/**
 * Get the load error message, if any.
 */
export function getNodePtyLoadError(): string | null {
  return loadError;
}