import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { theme } from "../theme.js";

export function InputArea({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  busy: boolean;
}): React.ReactElement {
  return (
    <Box borderStyle="round" borderColor={busy ? theme.textDim : theme.primary} paddingX={1}>
      <Text color={theme.primary} bold>
        ❯{" "}
      </Text>
      {busy ? (
        <Text color={theme.textDim}>working… (Ctrl+C to quit)</Text>
      ) : (
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder="ask jjcoder to build, fix, or run something…"
        />
      )}
    </Box>
  );
}
