import { execFileSync, spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { printExpoQr, printQrForUrl } from "./print-expo-qr.mjs";

const SUBST_DRIVE = "X:";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(mobileRoot, "../..");
const useLan = process.argv.includes("--lan");
const useTunnel = process.argv.includes("--tunnel");

function loadEnvFile() {
  const envPath = path.join(mobileRoot, ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key] || key === "EXPO_PUBLIC_API_URL") process.env[key] = value;
  }
}

function isVirtualInterface(name) {
  const n = name.toLowerCase();
  return (
    n.includes("vethernet") ||
    n.includes("wsl") ||
    n.includes("hyper-v") ||
    n.includes("default switch") ||
    n.includes("docker") ||
    n.includes("vmware") ||
    n.includes("virtualbox") ||
    n.includes("loopback")
  );
}

function isVirtualAdapterIp(ip) {
  return (
    ip.startsWith("172.26.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.16.")
  );
}

function getLanIp() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const [name, interfaces] of Object.entries(nets)) {
    if (isVirtualInterface(name)) continue;
    for (const net of interfaces ?? []) {
      if (net.family !== "IPv4" && net.family !== 4) continue;
      if (net.internal) continue;
      if (net.address.startsWith("127.")) continue;
      if (net.address.startsWith("169.254.")) continue;
      if (isVirtualAdapterIp(net.address)) continue;
      candidates.push({ ip: net.address, name });
    }
  }

  const pick =
    candidates.find((c) => c.ip.startsWith("172.20.10.")) ??
    candidates.find((c) => c.ip.startsWith("192.168.")) ??
    candidates.find((c) => c.ip.startsWith("10.") && !c.ip.startsWith("10.0.")) ??
    candidates[0];

  if (pick) {
    console.log(`Using LAN IP: ${pick.ip} (${pick.name})`);
    if (pick.ip.startsWith("10.") && !pick.ip.startsWith("10.0.0.")) {
      console.warn("");
      console.warn("⚠️  Wi-Fi looks like public/hotspot (10.x). Phones often cannot reach this PC over LAN.");
      console.warn("   If Expo Go shows \"Could not connect to the server\", run:");
      console.warn("   pnpm --filter mobile dev:tunnel");
      console.warn("");
    }
    return pick.ip;
  }

  console.warn("No LAN IP found — falling back to 127.0.0.1");
  return "127.0.0.1";
}

function hasNonAscii(str) {
  return /[^\x00-\x7F]/.test(str);
}

/** Map workspace to X: when path has Hebrew — tunnel only (fixes HTTP headers). */
function resolveExpoCwd(projectRoot, workspaceRoot, useSubst) {
  if (!useSubst || !hasNonAscii(projectRoot)) return projectRoot;

  try {
    execFileSync("subst", [SUBST_DRIVE, "/d"], { stdio: "ignore" });
  } catch {
    // drive may not exist yet
  }

  execFileSync("subst", [SUBST_DRIVE, workspaceRoot], { stdio: "inherit" });
  const mobileRel = path.relative(workspaceRoot, projectRoot);
  const substMobile = path.join(`${SUBST_DRIVE}\\`, mobileRel);
  console.log(`Using ASCII path ${substMobile} (Hebrew folder workaround)`);

  const cleanup = () => {
    try {
      execFileSync("subst", [SUBST_DRIVE, "/d"], { stdio: "ignore" });
    } catch {
      // ignore
    }
  };
  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });

  return substMobile;
}

function findExpoCli() {
  for (const root of [mobileRoot, workspaceRoot]) {
    for (const name of ["cli.js", "cli"]) {
      const cli = path.join(root, "node_modules", "expo", "bin", name);
      if (existsSync(cli)) return cli;
    }
  }
  return null;
}

const METRO_PORT = 8081;

function getPidOnPort(port) {
  try {
    const out = execFileSync("netstat", ["-ano"], { encoding: "utf8" });
    for (const line of out.split("\n")) {
      if (!line.includes(`:${port}`) || !line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) return Number(pid);
    }
  } catch {
    // ignore
  }
  return null;
}

function freePort(port) {
  const pid = getPidOnPort(port);
  if (!pid) return;
  console.log(`Port ${port} in use by PID ${pid} — stopping old Expo server...`);
  try {
    execFileSync("taskkill", ["/PID", String(pid), "/F"], { stdio: "inherit" });
  } catch {
    console.error(`Could not free port ${port}. Close the other terminal running Expo.`);
    process.exit(1);
  }
}

function syncEnvFile(host, apiPort, apiUrl) {
  const envPath = path.join(mobileRoot, ".env");
  const lines = existsSync(envPath) ? readFileSync(envPath, "utf8").split("\n") : [];
  const keys = {
    REACT_NATIVE_PACKAGER_HOSTNAME: host,
    EXPO_PUBLIC_API_URL: apiUrl,
  };

  const updated = new Set();
  const result = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return line;
    const key = trimmed.slice(0, idx).trim();
    if (key in keys) {
      updated.add(key);
      return `${key}=${keys[key]}`;
    }
    return line;
  });

  for (const [key, value] of Object.entries(keys)) {
    if (!updated.has(key)) result.push(`${key}=${value}`);
  }

  writeFileSync(envPath, `${result.filter((l, i, arr) => l !== "" || i < arr.length - 1).join("\n").trim()}\n`, "utf8");
}

loadEnvFile();

const lanIp = getLanIp();
const host = lanIp;
const apiPort = process.env.EXPO_PUBLIC_API_PORT ?? "3000";
const existingApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";
// Keep tunnels / remote APIs (https://…); only default to LAN IP when unset or already LAN http.
const keepRemoteApi =
  /^https:\/\//i.test(existingApiUrl) ||
  (existingApiUrl.startsWith("http://") && !existingApiUrl.includes(lanIp) && !/localhost|127\.0\.0\.1/.test(existingApiUrl));
const apiUrl = keepRemoteApi ? existingApiUrl : `http://${host}:${apiPort}`;

process.env.EXPO_PUBLIC_API_URL = apiUrl;

if (useLan) {
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = host;
  syncEnvFile(host, apiPort, apiUrl);
}

freePort(METRO_PORT);

const expoArgs = useTunnel
  ? ["start", "--tunnel", "--port", String(METRO_PORT)]
  : useLan
    ? ["start", "--port", String(METRO_PORT), "--host", "lan"]
    : ["start", "--tunnel", "--port", String(METRO_PORT)];

if (keepRemoteApi) {
  expoArgs.push("--clear");
  console.log("Remote API detected — clearing Metro cache so EXPO_PUBLIC_API_URL is picked up.");
}

if (useLan) {
  console.log("");
  console.log("📱 Expo Go (same Wi-Fi as this PC):");
  console.log(`   exp://${host}:${METRO_PORT}`);
  console.log(`🔗 API URL for phone: ${apiUrl}`);
  console.log("");
  console.log("   If connection fails, try: pnpm --filter mobile dev:tunnel");
  console.log("");
  printQrForUrl(`exp://${host}:${METRO_PORT}`);
} else {
  console.log("Starting Expo (tunnel) — works across networks / firewalls");
  console.log(`🔗 API URL for phone: ${apiUrl}`);
  console.log("   QR code will appear when tunnel is ready (~30s)");
  console.log("");
}

const expoBin = findExpoCli();
if (!expoBin) {
  console.error("Could not find expo CLI. Run: pnpm install");
  process.exit(1);
}

const expoCwd = resolveExpoCwd(mobileRoot, workspaceRoot, useTunnel);
const expoEnv = { ...process.env };
delete expoEnv.CI;
expoEnv.EXPO_NO_TELEMETRY = "1";
// LAN hostname overrides break Expo's public tunnel URL — only set it for LAN mode.
if (useLan) {
  expoEnv.REACT_NATIVE_PACKAGER_HOSTNAME = host;
} else {
  delete expoEnv.REACT_NATIVE_PACKAGER_HOSTNAME;
}
expoEnv.EXPO_PUBLIC_API_URL = apiUrl;

const child = spawn(process.execPath, [expoBin, ...expoArgs], {
  stdio: ["inherit", "pipe", "pipe"],
  env: expoEnv,
  cwd: expoCwd,
});

let tunnelQrPrinted = false;

function forwardAndWatchTunnelReady(source, isStderr = false) {
  source.on("data", (chunk) => {
    const text = chunk.toString();
    process[isStderr ? "stderr" : "stdout"].write(chunk);

    if (useTunnel && !tunnelQrPrinted && /tunnel ready/i.test(text)) {
      tunnelQrPrinted = true;
      setTimeout(() => {
        printExpoQr({ mode: "tunnel", waitForTunnel: false }).catch((err) => {
          console.warn("Could not print tunnel QR:", err?.message ?? err);
        });
        try {
          execFileSync(process.execPath, [path.join(__dirname, "save-qr-html.mjs"), "--tunnel"], {
            cwd: mobileRoot,
            stdio: "inherit",
          });
        } catch (err) {
          console.warn("Could not save expo-qr.html:", err?.message ?? err);
        }
      }, 2000);
    }
  });
}

forwardAndWatchTunnelReady(child.stdout, false);
forwardAndWatchTunnelReady(child.stderr, true);

child.on("close", (code) => {
  process.exit(code ?? 0);
});
