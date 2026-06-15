import React, { useMemo, useState } from "react";
import { Box, Static, useApp, useInput } from "ink";
import { Banner } from "./Banner.js";
import { Message, type Entry } from "./Message.js";
import { InputArea } from "./InputArea.js";
import { Footer } from "./Footer.js";
import { ActivityIndicator } from "./ActivityIndicator.js";
import { CommandHints } from "./CommandHints.js";
import { Selector, type SelectItem } from "./Selector.js";
import { runTurn } from "../agent.js";
import { CheckpointStore } from "../checkpoints.js";
import { isCommand, handleCommand } from "../commands.js";

const MODELS: SelectItem[] = [
  { label: "claude-opus-4-8", value: "claude-opus-4-8", hint: "most capable" },
  { label: "claude-sonnet-4-6", value: "claude-sonnet-4-6", hint: "balanced" },
  { label: "claude-haiku-4-5-20251001", value: "claude-haiku-4-5-20251001", hint: "fastest" },
];

type Mode = "chat" | "model" | "rewind";

export function App({ cwd }: { cwd: string }): React.ReactElement {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState("thinking");
  const [mode, setMode] = useState<Mode>("chat");
  const [model, setModel] = useState<string | undefined>();
  const [tools, setTools] = useState<number | undefined>();
  const [turns, setTurns] = useState<number | undefined>();
  const [cost, setCost] = useState<number | undefined>();
  const { exit } = useApp();

  const checkpoints = useMemo(() => new CheckpointStore(), []);

  const nextId = (() => {
    let n = 0;
    return () => ++n + Date.now();
  })();

  // Distributive omit so each union member keeps its own keys.
  type NewEntry = Entry extends infer E ? (E extends { id: number } ? Omit<E, "id"> : never) : never;
  const push = (e: NewEntry) =>
    setEntries((prev) => [...prev, { ...(e as object), id: nextId() } as Entry]);

  useInput((_in, key) => {
    if (key.ctrl && _in === "c") exit();
  });

  async function submit(value: string) {
    const text = value.trim();
    if (!text || busy) return;

    // Slash commands are handled locally — never forwarded to the agent.
    if (isCommand(text)) {
      setInput("");
      const out = handleCommand(text, { cwd, model, turns, costUsd: cost, tools, entryCount: entries.length });
      switch (out.action) {
        case "quit":
          exit();
          return;
        case "clear":
          setEntries([]);
          return;
        case "reset":
          setEntries([]);
          setModel(undefined);
          setTools(undefined);
          setTurns(undefined);
          setCost(undefined);
          return;
        case "model":
          setMode("model");
          return;
        case "rewind":
          if (checkpoints.list().length === 0) {
            push({ role: "user", text });
            push({
              role: "command",
              title: "/rewind",
              lines: ["no checkpoints yet — created when the agent edits files"],
            });
          } else {
            setMode("rewind");
          }
          return;
        default:
          push({ role: "user", text });
          push({ role: "command", title: out.title, lines: out.lines });
          return;
      }
    }

    setInput("");
    push({ role: "user", text });
    setBusy(true);
    setActivity("thinking");
    checkpoints.begin(text.length > 48 ? text.slice(0, 48) + "…" : text);

    for await (const ev of runTurn(text, cwd, {
      model,
      onBeforeTool: (name, toolInput) => checkpoints.snapshotForTool(name, toolInput),
    })) {
      switch (ev.kind) {
        case "system":
          if (ev.model && !model) setModel(ev.model);
          if (ev.tools != null) setTools(ev.tools);
          push({ role: "system", text: `session · model=${ev.model} · tools=${ev.tools} · ${ev.cwd}` });
          break;
        case "assistant":
          push({ role: "assistant", text: ev.text });
          break;
        case "tool":
          setActivity(`running ${ev.name}`);
          push({ role: "tool", name: ev.name, input: ev.input });
          break;
        case "tool-result":
          push({ role: "tool-result", text: ev.text });
          break;
        case "result":
          if (ev.turns != null) setTurns(ev.turns);
          if (ev.costUsd != null) setCost(ev.costUsd);
          break;
        case "error":
          push({ role: "error", text: ev.message });
          break;
      }
    }
    checkpoints.end();
    setBusy(false);
  }

  function onPickModel(value: string) {
    setModel(value);
    setMode("chat");
    push({ role: "command", title: "/model", lines: [`model → ${value} (applies to new turns)`] });
  }

  function onPickCheckpoint(value: string) {
    setMode("chat");
    const id = Number(value);
    const r = checkpoints.restore(id);
    push({
      role: "command",
      title: "/rewind",
      lines: [
        `checkpoint #${id} restored · ${r.restored} file(s) reverted` + (r.removed ? `, ${r.removed} removed` : ""),
      ],
    });
  }

  const checkpointItems: SelectItem[] = checkpoints.list().map((cp) => ({
    label: `#${cp.id}  ${cp.label}`,
    value: String(cp.id),
    hint: `${cp.files.size} file(s)`,
  }));

  return (
    <Box flexDirection="column">
      <Static items={entries}>
        {(entry) => (
          <Box key={entry.id} marginBottom={entry.role === "assistant" ? 1 : 0}>
            <Message entry={entry} />
          </Box>
        )}
      </Static>

      {entries.length === 0 && <Banner cwd={cwd} />}

      <Box flexDirection="column" marginTop={1}>
        {mode === "model" && (
          <Selector title="select model" items={MODELS} onSelect={onPickModel} onCancel={() => setMode("chat")} />
        )}
        {mode === "rewind" && (
          <Selector
            title="rewind to checkpoint"
            items={checkpointItems}
            onSelect={onPickCheckpoint}
            onCancel={() => setMode("chat")}
          />
        )}

        {mode === "chat" && (
          <>
            {busy && (
              <Box marginBottom={1}>
                <ActivityIndicator label={activity} />
              </Box>
            )}
            <InputArea value={input} onChange={setInput} onSubmit={submit} busy={busy} />
            {!busy && <CommandHints input={input} />}
            <Footer model={model} turns={turns} costUsd={cost} />
          </>
        )}
      </Box>
    </Box>
  );
}
