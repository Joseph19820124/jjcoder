import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

export type Entry =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; text: string }
  | { id: number; role: "tool"; name: string; input: string }
  | { id: number; role: "tool-result"; text: string }
  | { id: number; role: "system"; text: string }
  | { id: number; role: "error"; text: string };

function clip(s: string, n: number): string {
  const t = s.replace(/\s+$/g, "");
  return t.length <= n ? t : t.slice(0, n) + `…(+${t.length - n})`;
}

export function Message({ entry }: { entry: Entry }): React.ReactElement {
  switch (entry.role) {
    case "user":
      return (
        <Box>
          <Text color={theme.primary} bold>
            ❯{" "}
          </Text>
          <Text color={theme.text}>{entry.text}</Text>
        </Box>
      );
    case "assistant":
      return (
        <Box flexDirection="column" marginY={0}>
          <Text color={theme.claude} bold>
            ● jj
          </Text>
          <Box marginLeft={2}>
            <Text color={theme.text}>{entry.text}</Text>
          </Box>
        </Box>
      );
    case "tool":
      return (
        <Box marginLeft={2}>
          <Text color={theme.toolName}>⚙ {entry.name}</Text>
          <Text color={theme.textDim}> {clip(entry.input, 80)}</Text>
        </Box>
      );
    case "tool-result":
      return (
        <Box marginLeft={4}>
          <Text color={theme.textDim}>{clip(entry.text, 320)}</Text>
        </Box>
      );
    case "system":
      return (
        <Text color={theme.textMuted}>· {entry.text}</Text>
      );
    case "error":
      return (
        <Text color={theme.error}>✗ {entry.text}</Text>
      );
  }
}
