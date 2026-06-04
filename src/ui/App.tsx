import React, { useState } from "react";
import { Box, Static, useApp, useInput } from "ink";
import { Banner } from "./Banner.js";
import { Message, type Entry } from "./Message.js";
import { InputArea } from "./InputArea.js";
import { Footer } from "./Footer.js";
import { ActivityIndicator } from "./ActivityIndicator.js";
import { runTurn } from "../agent.js";

export function App({ cwd }: { cwd: string }): React.ReactElement {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState("thinking");
  const [model, setModel] = useState<string | undefined>();
  const [turns, setTurns] = useState<number | undefined>();
  const [cost, setCost] = useState<number | undefined>();
  const { exit } = useApp();

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
    if (text === "/quit" || text === "/exit") {
      exit();
      return;
    }
    setInput("");
    push({ role: "user", text });
    setBusy(true);
    setActivity("thinking");

    for await (const ev of runTurn(text, cwd)) {
      switch (ev.kind) {
        case "system":
          if (ev.model) setModel(ev.model);
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
    setBusy(false);
  }

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
        {busy && (
          <Box marginBottom={1}>
            <ActivityIndicator label={activity} />
          </Box>
        )}
        <InputArea value={input} onChange={setInput} onSubmit={submit} busy={busy} />
        <Footer model={model} turns={turns} costUsd={cost} />
      </Box>
    </Box>
  );
}
