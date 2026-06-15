// Renders a representative jjcoder frame to stdout (ANSI colors) for the
// README screenshot. Mirrors the real UI's layout and palette.
import chalk from "chalk";
import { theme } from "../src/theme.js";

const c = {
  primary: chalk.hex(theme.primary),
  accent: chalk.hex(theme.accent),
  claude: chalk.hex(theme.claude),
  text: chalk.hex(theme.text),
  dim: chalk.hex(theme.textDim),
  muted: chalk.hex(theme.textMuted),
  tool: chalk.hex(theme.toolName),
  footer: chalk.hex(theme.footer),
};

const ART = [
  "   _  _                  _         ",
  "  (_)(_)                | |        ",
  "   _  _  ___ ___    __ _| | ___ _ _",
  "  | || |/ __/ _ \\  / _` | |/ _ \\ '_|",
  "  | || | (_| (_) || (_| | |  __/ |  ",
  "  |__/| |\\___\\___/  \\__,_|_|\\___|_|  ",
];

const W = 62;
const out: string[] = [];

ART.forEach((l, i) => out.push((i % 2 ? c.accent : c.primary)(l)));
out.push("");
out.push(c.muted("  coding agent · powered by ") + c.claude("Claude") + c.muted(" (subscription) · ~/project"));
out.push("");
out.push(c.primary.bold("❯ ") + c.text("build a fibonacci script and run it"));
out.push("");
out.push(c.claude.bold("● jj"));
out.push("  " + c.text("I'll write it and run it."));
out.push("  " + c.tool("⚙ Write") + c.dim(' {"file_path":"fib.py"}'));
out.push("  " + c.tool("⚙ Bash") + c.dim(' {"command":"python3 fib.py"}'));
out.push("    " + c.dim("[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]  sum=88"));
out.push("");
out.push(c.claude.bold("● jj"));
out.push("  " + c.text("Done — the first 10 Fibonacci numbers sum to 88."));
out.push("");

const inner = " ❯ ask jjcoder to build, fix, or run something…";
const pad = " ".repeat(Math.max(0, W - inner.length));
out.push(c.primary("╭" + "─".repeat(W) + "╮"));
out.push(c.primary("│") + c.primary.bold(" ❯ ") + c.dim("ask jjcoder to build, fix, or run something…") + pad.slice(3) + c.primary("│"));
out.push(c.primary("╰" + "─".repeat(W) + "╯"));
out.push("");
out.push(c.footer("claude-opus-4-8  ·  3 turns  ·  ~$0.0918 equiv  ·  subscription auth"));

process.stdout.write(out.join("\n") + "\n");
