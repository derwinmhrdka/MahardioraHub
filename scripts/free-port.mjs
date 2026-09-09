import { execSync } from "node:child_process";

const port = process.argv[2] || "13000";

function freePort() {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
      });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        if (!/LISTENING/i.test(line)) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        } catch {
          // already gone
        }
      }
      return;
    }

    try {
      execSync(`fuser -k ${port}/tcp`, { stdio: "ignore" });
    } catch {
      // nothing listening
    }
  } catch {
    // port already free
  }
}

freePort();
