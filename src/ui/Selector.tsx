import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { theme } from "../theme.js";

export interface SelectItem {
  label: string;
  value: string;
  hint?: string;
}

export function Selector({
  title,
  items,
  onSelect,
  onCancel,
}: {
  title: string;
  items: SelectItem[];
  onSelect: (value: string) => void;
  onCancel: () => void;
}): React.ReactElement {
  // ink-select-input doesn't expose hints, so render label+hint in the label.
  const decorated = items.map((it) => ({
    label: it.hint ? `${it.label}  —  ${it.hint}` : it.label,
    value: it.value,
    key: it.value,
  }));

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.accent} paddingX={1}>
      <Text color={theme.accent} bold>
        {title}
      </Text>
      <Box marginTop={1}>
        <SelectInput
          items={decorated}
          onSelect={(item: { value: string }) => onSelect(item.value)}
          onHighlight={() => {}}
        />
      </Box>
      <Box marginTop={1}>
        <Text color={theme.textDim}>↑↓ select · enter confirm · esc cancel</Text>
      </Box>
      <CancelOnEsc onCancel={onCancel} />
    </Box>
  );
}

// Small helper so esc cancels the overlay.
import { useInput } from "ink";
function CancelOnEsc({ onCancel }: { onCancel: () => void }): null {
  useInput((_in, key) => {
    if (key.escape) onCancel();
  });
  return null;
}
