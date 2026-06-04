#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { App } from "./ui/App.js";

// Swallow expected abort rejections during Ctrl+C cancellation.
process.on("unhandledRejection", (reason) => {
  if (reason instanceof Error) {
    const m = reason.message.toLowerCase();
    if (reason.name === "AbortError" || m.includes("abort")) return;
  }
  throw reason;
});

const cwd = process.cwd();
render(<App cwd={cwd} />);
