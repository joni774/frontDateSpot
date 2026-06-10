import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(mobileRoot, "../..");
const useLan = process.argv.includes("--lan");

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
    if (!process.env[key]) process.env[key] = value;
  }
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

  for (const interfaces of Object.values(nets)) {
    for (const net of interfaces ?? []) {
      if (net.family !== "IPv4" || net.internal) continue;
      if (net.address.startsWith("127.")) continue;
      if (net.address.startsWith("169.254.")) continue;
      candidates.push(net.address);
    }
  }

  return (
    candidates.find((ip) => ip.startsWith("172.20.10.")) ??
    candidates.find((ip) => ip.startsWith("192.168.")) ??
    candidates.find((ip) => ip.startsWith("10.")) ??
    candidates.find((ip) => !isVirtualAdapterIp(ip)) ??
    candidates[0] ??
    "127.0.0.1"
  );
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

loadEnvFile();

const host = process.env.REACT_NATIVE_PACKAGER_HOSTNAME ?? getLanIp();
const expoArgs = useLan
  ? ["start", "--port", "8081", "--host", "lan"]
  : ["start", "--tunnel", "--port", "8081"];

if (useLan) {
  console.log(`Starting Expo (LAN) with host: ${host}`);
  console.log(`API URL from .env: ${process.env.EXPO_PUBLIC_API_URL ?? "(not set)"}`);
} else {
  console.log("Starting Expo (tunnel) — works when LAN/firewall blocks the phone");
}

const expoBin = findExpoCli();
if (!expoBin) {
  console.error("Could not find expo CLI. Run: pnpm install");
  process.exit(1);
}

execFileSync(process.execPath, [expoBin, ...expoArgs], {
  stdio: "inherit",
  env: {
    ...process.env,
    REACT_NATIVE_PACKAGER_HOSTNAME: host,
  },
  cwd: mobileRoot,
});
