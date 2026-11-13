"use strict";

const { spawn } = require("node:child_process");
const { existsSync } = require("node:fs");
const { join } = require("node:path");

const root = join(__dirname, "..");
const frontendModules = join(root, "frontend", "node_modules");

if (!existsSync(frontendModules)) {
  console.error("Faltan las dependencias del frontend. Ejecutá: npm --prefix frontend install");
  process.exit(1);
}

const children = [
  spawn(process.execPath, [join(root, "backend", "local-server.js")], {
    cwd: root,
    stdio: "inherit"
  }),
  spawn("npm", ["run", "start", "--prefix", "frontend"], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32"
  })
];

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill("SIGTERM");
  }
  process.exitCode = code;
}

for (const child of children) {
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code || 0);
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
