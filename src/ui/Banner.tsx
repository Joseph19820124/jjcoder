import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

const ART = [
  "   _  _                  _         ",
  "  (_)(_)                | |        ",
  "   _  _  ___ ___    __ _| | ___ _ _",
  "  | || |/ __/ _ \\  / _` | |/ _ \\ '_|",
  "  | || | (_| (_) || (_| | |  __/ |  ",
  "  |__/| |\\___\\___/  \\__,_|_|\\___|_|  ",
  "   __/ |                            ",
  "  |___/                             ",
];

export function Banner({ cwd }: { cwd: string }): React.ReactElement {
  return (
    <Box flexDirection="column" marginBottom={1}>
      {ART.map((line, i) => (
        <Text key={i} color={i % 2 === 0 ? theme.primary : theme.accent}>
          {line}
        </Text>
      ))}
      <Box marginTop={1}>
        <Text color={theme.textMuted}>
          coding agent · powered by <Text color={theme.claude}>Claude</Text> (subscription) · {cwd}
        </Text>
      </Box>
    </Box>
  );
}
