import React from "react";
import { Box, Text } from "ink";
import { theme } from "../theme.js";

export function Footer({
  model,
  turns,
  costUsd,
}: {
  model?: string;
  turns?: number;
  costUsd?: number;
}): React.ReactElement {
  const parts: string[] = [];
  if (model) parts.push(model);
  if (turns != null) parts.push(`${turns} turns`);
  if (costUsd != null) parts.push(`~$${costUsd.toFixed(4)} equiv`);
  parts.push("subscription auth");
  return (
    <Box marginTop={1}>
      <Text color={theme.footer}>{parts.join("  ·  ")}</Text>
    </Box>
  );
}
