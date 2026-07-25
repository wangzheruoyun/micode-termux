// src/tools/pty/buffer.ts
import type { SearchMatch } from "./types";

const FALLBACK_MAX_BUFFER_LINES = 50_000;
const parsed = parseInt(process.env.PTY_MAX_BUFFER_LINES || String(FALLBACK_MAX_BUFFER_LINES), 10);
const DEFAULT_MAX_LINES = Number.isNaN(parsed) ? FALLBACK_MAX_BUFFER_LINES : parsed;

export interface RingBuffer {
  append(data: string): void;
  read(offset?: number, limit?: number): string[];
  search(pattern: RegExp): SearchMatch[];
  readonly length: number;
  clear(): void;
}

export function createRingBuffer(maxLines: number = DEFAULT_MAX_LINES): RingBuffer {
  let lines: string[] = [];

  return {
    append(data: string): void {
      const newLines = data.split("\n");
      for (const line of newLines) {
        lines.push(line);
        if (lines.length > maxLines) {
          lines.shift();
        }
      }
    },

    read(offset: number = 0, limit?: number): string[] {
      const start = Math.max(0, offset);
      const end = limit !== undefined ? start + limit : lines.length;
      return lines.slice(start, end);
    },

    search(pattern: RegExp): SearchMatch[] {
      const matches: SearchMatch[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line !== undefined && pattern.test(line)) {
          matches.push({ lineNumber: i + 1, text: line });
        }
      }
      return matches;
    },

    get length(): number {
      return lines.length;
    },

    clear(): void {
      lines = [];
    },
  };
}
