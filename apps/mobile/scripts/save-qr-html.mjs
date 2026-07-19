import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

function isVirtualInterface(name) {
  const n = name.toLowerCase();
  return /vethernet|wsl|hyper-v|default switch|docker|vmware|virtualbox|loopback/.test(n);
}

function getLanIp() {
  const env = loadEnvFile();
  if (env.REACT_NATIVE_PACKAGER_HOSTNAME) return env.REACT_NATIVE_PACKAGER_HOSTNAME.trim();
  for (const [name, interfaces] of Object.entries(os.networkInterfaces())) {
    if (isVirtualInterface(name)) continue;
    for (const net of interfaces ?? []) {
      if (net.family !== "IPv4" && net.family !== 4) continue;
      if (net.internal || net.address.startsWith("127.") || net.address.startsWith("169.254.")) continue;
      if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(net.address)) continue;
      return net.address;
    }
  }
  return "127.0.0.1";
}

const mode = process.argv.includes("--tunnel") ? "tunnel" : "lan";
let url;

if (mode === "tunnel") {
  const res = await fetch("http://127.0.0.1:4040/api/tunnels");
  const data = await res.json();
  const tunnel = data.tunnels?.find((t) => t.public_url?.includes("exp.direct"));
  if (!tunnel) {
    console.error("Tunnel not ready. Run: pnpm dev:tunnel");
    process.exit(1);
  }
  url = `exp://${new URL(tunnel.public_url).host}`;
} else {
  url = `exp://${getLanIp()}:${port}`;
}

const encoded = encodeURIComponent(url);
const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DateSpot — QR לסריקה</title>
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 24px; background: #FAF6F3; }
    img { width: min(320px, 90vw); border: 8px solid white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,.12); }
    code { display: block; margin: 16px auto; padding: 12px; background: #fff; border-radius: 8px; font-size: 14px; word-break: break-all; max-width: 420px; }
    h1 { color: #B84A62; font-size: 1.4rem; }
    p { color: #444; line-height: 1.6; max-width: 420px; margin: 12px auto; }
  </style>
</head>
<body>
  <h1>DateSpot — סרוק עם Expo Go</h1>
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encoded}" alt="QR code" />
  <code>${url}</code>
  <p>אם הסריקה לא עובדת: פתח <strong>Expo Go</strong> → <strong>Enter URL manually</strong> → הדבק את הכתובת למעלה.</p>
  <p>הטלפון והמחשב חייבים להיות על <strong>אותה רשת Wi‑Fi</strong> (לא נתונים סלולריים).</p>
  <p><strong>זרימה:</strong> עמוד 1 ברוך הבא → עמוד 2 גילוי האפליקציה → עמוד 3 התחברות</p>
  <p>בעמודים 1–2: <strong>דלג</strong> או <strong>המשך</strong> למטה</p>
  <p><strong>התחברות:</strong> admin@datespot.co.il / admin123</p>
  <p>אם נפתח ישר באפליקציה — לחץ <strong>התנתק</strong> בפרופיל, ואז Reload JS.</p>
</body>
</html>`;

const outPath = path.join(mobileRoot, "expo-qr.html");
writeFileSync(outPath, html, "utf8");
console.log(`Saved: ${outPath}`);
console.log(`URL: ${url}`);
