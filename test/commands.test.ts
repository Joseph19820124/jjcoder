import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMMANDS,
  isCommand,
  matchCommands,
  handleCommand,
  type CommandContext,
} from "../src/commands.js";
import { ALLOWED_TOOLS } from "../src/agent.js";

const ctx: CommandContext = {
  cwd: "/work/jjcoder",
  model: "claude-haiku-4-5-20251001",
  tools: 30,
  turns: 3,
  costUsd: 0.0123,
  entryCount: 5,
};

test("isCommand: only '/'-prefixed strings are commands", () => {
  assert.equal(isCommand("/status"), true);
  assert.equal(isCommand("/"), true);
  assert.equal(isCommand("hello"), false);
  assert.equal(isCommand(" /status"), false); // caller trims first
});

test("matchCommands: prefix matches names and aliases", () => {
  assert.deepEqual(matchCommands("/s").map((c) => c.name), ["/status"]);
  assert.deepEqual(matchCommands("/t").map((c) => c.name), ["/tools"]);
  // bare slash lists everything
  assert.equal(matchCommands("/").length, COMMANDS.length);
  // alias prefix resolves to its command
  assert.deepEqual(matchCommands("/ex").map((c) => c.name), ["/quit"]);
  assert.deepEqual(matchCommands("/zzz"), []);
});

test("/status reports model, tools, turns, cost, cwd, auth", () => {
  const out = handleCommand("/status", ctx);
  assert.equal(out.action, null);
  const body = out.lines.join("\n");
  assert.match(body, /claude-haiku-4-5-20251001/);
  assert.match(body, /tools\s+30/);
  assert.match(body, /turns\s+3/);
  assert.match(body, /~\$0\.0123 equiv/);
  assert.match(body, /\/work\/jjcoder/);
  assert.match(body, /subscription/);
});

test("/status degrades gracefully before the agent has started", () => {
  const out = handleCommand("/status", { cwd: "/x", entryCount: 0 });
  const body = out.lines.join("\n");
  assert.match(body, /not started/);
  assert.match(body, /tools\s+—/);
  assert.match(body, /turns\s+0/);
});

test("/tools lists the granted tools from the single source of truth", () => {
  const out = handleCommand("/tools", ctx);
  assert.equal(out.action, null);
  const body = out.lines.join("\n");
  assert.match(body, new RegExp(`granted \\(${ALLOWED_TOOLS.length}\\)`));
  for (const t of ALLOWED_TOOLS) assert.match(body, new RegExp(t));
  // session-total note appears when more tools are exposed than granted
  assert.match(body, /30 tools total/);
});

test("/tools omits the session-total note when counts match", () => {
  const out = handleCommand("/tools", { cwd: "/x", tools: ALLOWED_TOOLS.length, entryCount: 0 });
  assert.equal(out.lines.length, 1);
  assert.doesNotMatch(out.lines.join("\n"), /total/);
});

test("/model shows the active model or a hint", () => {
  assert.deepEqual(handleCommand("/model", ctx).lines, ["claude-haiku-4-5-20251001"]);
  assert.match(handleCommand("/model", { cwd: "/x", entryCount: 0 }).lines[0]!, /not resolved/);
});

test("/cwd returns the working directory", () => {
  assert.deepEqual(handleCommand("/cwd", ctx).lines, ["/work/jjcoder"]);
});

test("/help lists every command and its aliases", () => {
  const body = handleCommand("/help", ctx).lines.join("\n");
  for (const c of COMMANDS) {
    assert.match(body, new RegExp(c.name.replace("?", "\\?")));
    assert.match(body, new RegExp(c.desc.slice(0, 8)));
  }
});

test("action commands return the right side effect", () => {
  assert.equal(handleCommand("/clear", ctx).action, "clear");
  assert.equal(handleCommand("/reset", ctx).action, "reset");
  assert.equal(handleCommand("/quit", ctx).action, "quit");
  assert.equal(handleCommand("/exit", ctx).action, "quit"); // alias
});

test("commands are case-insensitive", () => {
  assert.equal(handleCommand("/STATUS", ctx).title, "/status");
  assert.equal(handleCommand("/Quit", ctx).action, "quit");
});

test("extra args after the command are ignored", () => {
  assert.equal(handleCommand("/status now please", ctx).title, "/status");
});

test("unknown commands return a help hint, no action", () => {
  const out = handleCommand("/bogus", ctx);
  assert.equal(out.action, null);
  assert.match(out.lines.join("\n"), /type \/help/);
});
