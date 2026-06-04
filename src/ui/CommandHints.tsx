import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";
import { matchCommands } from "../commands.js";

/** Shows matching slash commands while the user is typing a "/…" prefix. */
export function CommandHints({ input }: { input: string }): React.ReactElement | null {
  if (!input.startsWith("/")) return null;
  const matches = matchCommands(input);
  if (matches.length === 0) return null;

  return (
    <Box flexDirection="column" marginLeft={2}>
      {matches.map((c) => (
        <Box key={c.name}>
          <Text color={theme.command}>{c.name.padEnd(10)}</Text>
          <Text color={theme.textDim}>{c.desc}</Text>
        </Box>
      ))}
    </Box>
  );
}
