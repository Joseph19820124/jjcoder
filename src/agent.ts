// Agent wiring: jjcoder UI  ->  Claude Agent SDK  ->  Claude Code CLI.
//
// The only path. Auth is your Claude subscription: with ANTHROPIC_API_KEY
// unset, the spawned `claude` CLI reads ~/.claude/.credentials.json and uses
// your Pro/Max plan (no per-token API billing). We never set an API key or an
// endpoint — the CLI owns both.

import { query, type Options } from "@anthropic-ai/claude-agent-sdk";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type AgentEvent =
  | { kind: "system"; model?: string; tools?: number; cwd?: string }
  | { kind: "assistant"; text: string }
  | { kind: "tool"; name: string; input: string }
  | { kind: "tool-result"; text: string }
  | { kind: "result"; ok: boolean; turns?: number; durationMs?: number; costUsd?: number }
  | { kind: "error"; message: string };

const SYSTEM_PROMPT = `You are jjcoder, a concise terminal coding assistant.
Do the work directly with your tools (Read/Write/Edit/Bash/Glob/Grep). No
preamble. When you run code, report the captured output. Keep replies tight.`;

/** Tools the agent is permitted to use. Single source of truth for /tools too. */
export const ALLOWED_TOOLS = ["Read", "Write", "Edit", "Bash", "Glob", "Grep"] as const;

export interface TurnOptions {
  /** Claude model id, e.g. "claude-opus-4-8". Omit to use the CLI default. */
  model?: string;
  /** Called before each tool runs — used to snapshot files for /rewind. */
  onBeforeTool?: (toolName: string, input: Record<string, unknown>) => void;
}

function resolveClaudeCli(): string | undefined {
  const candidates = [
    process.env.JJCODER_CLAUDE_PATH,
    join(homedir(), ".local/bin/claude"),
    "/usr/local/bin/claude",
    join(homedir(), ".claude/local/claude"),
  ].filter(Boolean) as string[];
  for (const c of candidates) if (existsSync(c)) return c;
  return undefined; // fall back to SDK auto-discovery on PATH
}

function blockText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => (c && typeof c === "object" && (c as any).type === "text" ? (c as any).text : ""))
      .join("");
  }
  return "";
}

/** Run one user turn, yielding normalized events the UI can render. */
export async function* runTurn(
  prompt: string,
  cwd: string,
  turnOpts: TurnOptions = {},
): AsyncGenerator<AgentEvent> {
  if (process.env.ANTHROPIC_API_KEY) {
    yield {
      kind: "error",
      message:
        "ANTHROPIC_API_KEY is set — that forces per-token API billing. Unset it to use your Claude subscription.",
    };
    return;
  }

  const options: Options = {
    systemPrompt: SYSTEM_PROMPT,
    allowedTools: [...ALLOWED_TOOLS],
    permissionMode: "bypassPermissions",
    cwd,
    maxTurns: 16,
    pathToClaudeCodeExecutable: resolveClaudeCli(),
    ...(turnOpts.model ? { model: turnOpts.model } : {}),
    // PreToolUse fires for every tool regardless of permission mode, so it is
    // the reliable place to snapshot files before they are mutated (/rewind).
    hooks: {
      PreToolUse: [
        {
          hooks: [
            async (input) => {
              const i = input as { tool_name?: string; tool_input?: unknown };
              try {
                if (i.tool_name) {
                  turnOpts.onBeforeTool?.(i.tool_name, (i.tool_input ?? {}) as Record<string, unknown>);
                }
              } catch {
                // snapshotting must never block the tool
              }
              return { continue: true };
            },
          ],
        },
      ],
    },
  };

  try {
    for await (const msg of query({ prompt, options })) {
      switch (msg.type) {
        case "system":
          if ((msg as any).subtype === "init") {
            const m = msg as any;
            yield { kind: "system", model: m.model, tools: m.tools?.length, cwd: m.cwd };
          }
          break;
        case "assistant":
          for (const block of (msg as any).message.content ?? []) {
            if (block.type === "text" && block.text?.trim()) {
              yield { kind: "assistant", text: block.text };
            } else if (block.type === "tool_use") {
              yield { kind: "tool", name: block.name, input: JSON.stringify(block.input) };
            }
          }
          break;
        case "user":
          for (const block of (msg as any).message?.content ?? []) {
            if (block && typeof block === "object" && block.type === "tool_result") {
              const text = blockText(block.content);
              if (text) yield { kind: "tool-result", text };
            }
          }
          break;
        case "result": {
          const r = msg as any;
          yield {
            kind: "result",
            ok: r.subtype === "success",
            turns: r.num_turns,
            durationMs: r.duration_ms,
            costUsd: r.total_cost_usd,
          };
          break;
        }
      }
    }
  } catch (e: any) {
    yield { kind: "error", message: e?.message ?? String(e) };
  }
}
