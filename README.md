# jjcoder

A terminal coding agent with a **ggcoder-style UI**, but a single, simple backend:

```
 jjcoder UI (Ink/React)  ->  Claude Agent SDK  ->  Claude Code CLI
```

Auth is your **Claude Pro/Max subscription** — no API key, no per-token billing,
no endpoint to configure. The Claude Code CLI handles auth (it reads
`~/.claude/.credentials.json`) and the model connection; jjcoder just drives it.

> UI design is modelled on [KenKai's ggcoder](https://github.com/KenKaiii/gg-framework)
> (MIT). The interface here is reimplemented from scratch — see [`NOTICE`](./NOTICE).

## Prerequisites

1. **Node.js 20+**
2. **Claude Code CLI** installed and logged into a subscription
   (`claude` on your `PATH`, or at `~/.local/bin/claude`).
   Verify: `claude --version` works and `~/.claude/.credentials.json` exists.
3. **`ANTHROPIC_API_KEY` unset** (jjcoder refuses to run with it set, so it can
   never silently fall back to API billing). Override the CLI location with
   `JJCODER_CLAUDE_PATH` if needed.

## Run

```bash
npm install
npm run dev          # hot path, via tsx
# or
npm run build && npm start
```

Type a request at the prompt. `/quit` or `Ctrl+C` to exit.

### Slash commands

Slash commands are handled locally — they never get forwarded to the agent.
Type `/` to see live suggestions.

| Command | Does |
| --- | --- |
| `/help`, `/?` | list available commands |
| `/status` | session info — model, tools, turns, cost |
| `/model` | show the active model |
| `/tools` | list the tools the agent can use |
| `/cwd` | show the working directory |
| `/clear` | clear the transcript |
| `/reset` | clear the transcript and reset session stats |
| `/quit`, `/exit` | exit jjcoder |

## What it does

- Streams Claude's replies, tool calls (Read/Write/Edit/Bash/Glob/Grep), and
  tool results into a scrolling transcript.
- Shows a live activity spinner while the agent works.
- Footer reports model, turn count, and the SDK's equivalent-cost figure
  (informational only under subscription auth).

## Architecture notes

`src/agent.ts` is the whole integration: it calls `query()` from
`@anthropic-ai/claude-agent-sdk`, which spawns the `claude` CLI as a subprocess
and speaks a streaming-JSON protocol over stdio. jjcoder never talks to the
model API directly — that is by design, and it is why your subscription works
out of the box.

## License

MIT — see [`LICENSE`](./LICENSE) and [`NOTICE`](./NOTICE).
