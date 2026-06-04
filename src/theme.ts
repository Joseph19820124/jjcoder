// jjcoder color palette.
// Visual identity is modelled on KenKai's ggcoder (MIT) so the two feel
// familiar; all rendering code here is an independent implementation.

export const theme = {
  primary: "#60a5fa",
  secondary: "#a78bfa",
  accent: "#818cf8",
  success: "#4ade80",
  error: "#f87171",
  warning: "#fbbf24",
  text: "#e5e7eb",
  textDim: "#6b7280",
  textMuted: "#9ca3af",
  border: "#374151",
  claude: "#d77757",
  toolName: "#60a5fa",
  footer: "#6b7280",
  command: "#818cf8",
  code: "#e2b553",
} as const;

export type Theme = typeof theme;
