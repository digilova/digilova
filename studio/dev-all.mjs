import { spawn } from "node:child_process";

const processes = [
  spawn("npm", ["run", "dev"], { stdio: "inherit", shell: false }),
  spawn(process.execPath, ["studio/server.mjs"], {
    stdio: "inherit",
    shell: false,
  }),
];

function stop(signal = "SIGTERM") {
  for (const child of processes) {
    if (!child.killed) child.kill(signal);
  }
}

for (const child of processes) {
  child.on("exit", (code) => {
    if (code && code !== 0) process.exitCode = code;
    stop();
  });
}

process.on("SIGINT", () => {
  stop("SIGINT");
  process.exit(0);
});
process.on("SIGTERM", () => {
  stop("SIGTERM");
  process.exit(0);
});
