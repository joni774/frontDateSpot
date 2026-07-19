import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const qrcode = require("qrcode-terminal");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, "..");
const port = process.env.EXPO_DEV_SERVER_PORT ?? "8081";

function loadEnvFile() {
  const envPath = path.join(mobileRoot, ".env");
  if (!existsSync(envPath)) return {};

  const env = {};
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
    env[key] = value;
  }
  return env;
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

  return pick?.ip ?? "127.0.0.1";
}

function getLanExpUrl() {
  const env = loadEnvFile();
  const host =
    process.env.REACT_NATIVE_PACKAGER_HOSTNAME?.trim() ||
    env.REACT_NATIVE_PACKAGER_HOSTNAME?.trim() ||
    getLanIp();
  return `exp://${host}:${port}`;
}

async function fetchTunnelExpUrl(timeoutMs = 90_000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch("http://127.0.0.1:4040/api/tunnels");
      if (res.ok) {
        const data = await res.json();
        const tunnel =
          data.tunnels?.find((t) => t.public_url?.includes("exp.direct")) ??
          data.tunnels?.find((t) => t.public_url?.startsWith("https://"));
        if (tunnel?.public_url) {
          const host = new URL(tunnel.public_url).host;
          return `exp://${host}`;
        }
      }
    } catch {
      // ngrok not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return null;
}

export function printQrForUrl(url) {
  console.log("");
  console.log("📱 סרוק עם Expo Go:");
  console.log(`   ${url}`);
  console.log("");
  qrcode.generate(url, { small: true }, (code) => console.log(code));
  console.log("");
  console.log("   או הקלד את הכתובת ידנית ב-Expo Go → Enter URL");
  console.log("");
}

export async function printExpoQr({ mode = "auto", waitForTunnel = false } = {}) {
  const useTunnel = mode === "tunnel" || (mode === "auto" && process.argv.includes("--tunnel"));
  const useLan = mode === "lan" || process.argv.includes("--lan");

  let url;
  if (useTunnel) {
    if (waitForTunnel) {
      process.stdout.write("Waiting for tunnel URL");
    }
    url = await fetchTunnelExpUrl();
    if (!url) {
      console.error("Could not find tunnel URL. Is Expo running with --tunnel?");
      process.exit(1);
    }
  } else if (useLan || mode === "auto") {
    url = getLanExpUrl();
  } else {
    url = getLanExpUrl();
  }

  printQrForUrl(url);
  return url;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const waitForTunnel = process.argv.includes("--wait");
  printExpoQr({
    mode: process.argv.includes("--tunnel") ? "tunnel" : process.argv.includes("--lan") ? "lan" : "auto",
    waitForTunnel,
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
