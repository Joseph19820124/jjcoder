// Checkpoint store for /rewind.
//
// Before the agent's first file-mutating tool in a turn, we snapshot the
// prior on-disk content of each touched file. /rewind restores a chosen
// checkpoint's files to that pre-turn state. Snapshots live in memory for the
// session (cleared on exit) — enough to undo within a run.

import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";

export interface Checkpoint {
  id: number;
  label: string;
  createdAt: number;
  /** path -> prior content, or null if the file did not exist before. */
  files: Map<string, string | null>;
}

const MUTATING_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

export class CheckpointStore {
  private checkpoints: Checkpoint[] = [];
  private current: Checkpoint | null = null;
  private seq = 0;

  /** Open a checkpoint for a new user turn. */
  begin(label: string): void {
    this.current = { id: ++this.seq, label, createdAt: Date.now(), files: new Map() };
  }

  /** Close the current turn's checkpoint, keeping it only if it touched files. */
  end(): void {
    if (this.current && this.current.files.size > 0) {
      this.checkpoints.push(this.current);
    }
    this.current = null;
  }

  /** Returns true if the tool touches files and a snapshot was taken. */
  snapshotForTool(toolName: string, input: Record<string, unknown>): void {
    if (!this.current || !MUTATING_TOOLS.has(toolName)) return;
    const path = (input.file_path ?? input.path ?? input.notebook_path) as string | undefined;
    if (!path || this.current.files.has(path)) return;
    const prior = existsSync(path) ? readFileSync(path, "utf8") : null;
    this.current.files.set(path, prior);
  }

  list(): Checkpoint[] {
    return [...this.checkpoints].reverse(); // newest first
  }

  /** Restore a checkpoint's files to their pre-turn content. */
  restore(id: number): { restored: number; removed: number } {
    const cp = this.checkpoints.find((c) => c.id === id);
    if (!cp) return { restored: 0, removed: 0 };
    let restored = 0;
    let removed = 0;
    for (const [path, prior] of cp.files) {
      if (prior === null) {
        if (existsSync(path)) {
          rmSync(path, { force: true });
          removed++;
        }
      } else {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, prior, "utf8");
        restored++;
      }
    }
    return { restored, removed };
  }
}
