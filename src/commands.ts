// Local slash-command handling.
//
// Slash commands are intercepted in the UI *before* anything is sent to the
// agent. Without this, "/status" and friends get forwarded to Claude, which
// has no idea what they mean and replies "isn't available in this environment".

import { ALLOWED_TOOLS } from "./agent.js";

export type CommandAction = "clear" | "reset" | "quit" | "model" | "rewind" | null;

export interface CommandContext {
  cwd: string;
  model?: string;
  turns?: number;
  costUsd?: number;
  tools?: number;
  entryCount: number;
}

export interface CommandOutput {
  /** Title line shown at the top of the command panel. */
  title: string;
  /** Body lines rendered inside the panel. */
  lines: string[];
  /** Side effect for the UI to perform. */
  action: CommandAction;
}

export interface CommandSpec {
  name: string;
  aliases?: string[];
  desc: string;
}

export const COMMANDS: CommandSpec[] = [
  { name: "/help", aliases: ["/?"], desc: "list available commands" },
  { name: "/status", desc: "session info — model, tools, turns, cost" },
  { name: "/model", desc: "switch the Claude model for new turns" },
  { name: "/rewind", desc: "restore files to an earlier checkpoint" },
  { name: "/tools", desc: "list the tools the agent can use" },
  { name: "/cwd", desc: "show the working directory" },
  { name: "/clear", desc: "clear the transcript" },
  { name: "/reset", desc: "clear the transcript and reset session stats" },
  { name: "/quit", aliases: ["/exit"], desc: "exit jjcoder" },
];

/** A trimmed value that should be handled locally rather than sent to the agent. */
export function isCommand(text: string): boolean {
  return text.startsWith("/");
}

/** Commands whose name or aliases start with the typed prefix (for hints). */
export function matchCommands(prefix: string): CommandSpec[] {
  const p = prefix.toLowerCase();
  return COMMANDS.filter(
    (c) => c.name.startsWith(p) || c.aliases?.some((a) => a.startsWith(p)),
  );
}

function resolve(token: string): string {
  const cmd = "/" + token.toLowerCase();
  const match = COMMANDS.find((c) => c.name === cmd || c.aliases?.includes(cmd));
  return match?.name ?? cmd;
}

export function handleCommand(text: string, ctx: CommandContext): CommandOutput {
  const [token = ""] = text.trim().slice(1).split(/\s+/);
  const name = resolve(token);

  switch (name) {
    case "/help":
      return {
        title: "/help",
        lines: COMMANDS.map((c) => {
          const names = [c.name, ...(c.aliases ?? [])].join(", ");
          return `${names.padEnd(18)}${c.desc}`;
        }),
        action: null,
      };

    case "/status":
      return {
        title: "/status",
        lines: [
          `model   ${ctx.model ?? "(not started — send a message first)"}`,
          `tools   ${ctx.tools != null ? String(ctx.tools) : "—"}`,
          `turns   ${ctx.turns ?? 0}`,
          `cost    ${ctx.costUsd != null ? `~$${ctx.costUsd.toFixed(4)} equiv` : "—"}`,
          `cwd     ${ctx.cwd}`,
          `auth    Claude subscription (no API key)`,
        ],
        action: null,
      };

    case "/model":
      // Opens the model selector overlay (handled in the UI).
      return { title: "/model", lines: [], action: "model" };

    case "/rewind":
      // Opens the checkpoint selector overlay (handled in the UI).
      return { title: "/rewind", lines: [], action: "rewind" };

    case "/tools":
      return {
        title: "/tools",
        lines: [
          `granted (${ALLOWED_TOOLS.length}): ${ALLOWED_TOOLS.join(", ")}`,
          ...(ctx.tools != null && ctx.tools > ALLOWED_TOOLS.length
            ? [`session exposes ${ctx.tools} tools total (incl. SDK built-ins)`]
            : []),
        ],
        action: null,
      };

    case "/cwd":
      return { title: "/cwd", lines: [ctx.cwd], action: null };

    case "/clear":
      return { title: "/clear", lines: [], action: "clear" };

    case "/reset":
      return { title: "/reset", lines: [], action: "reset" };

    case "/quit":
      return { title: "/quit", lines: [], action: "quit" };

    default:
      return {
        title: name,
        lines: [`unknown command. type /help for the list.`],
        action: null,
      };
  }
}
