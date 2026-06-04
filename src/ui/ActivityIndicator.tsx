import React, { useEffect, useState } from "react";
import { Text } from "ink";
import { theme } from "../theme.js";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function ActivityIndicator({ label }: { label: string }): React.ReactElement {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 80);
    return () => clearInterval(id);
  }, []);
  return (
    <Text color={theme.primary}>
      {FRAMES[frame]} <Text color={theme.textMuted}>{label}</Text>
    </Text>
  );
}
