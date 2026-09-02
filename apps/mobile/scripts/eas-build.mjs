#!/usr/bin/env node
/**
 * Wrapper around `eas build` that sets EAS_SKIP_AUTO_FINGERPRINT=1.
 * Local fingerprint computation currently fails with balanced-match on Windows.
 */
import { spawnSync } from "node:child_process";

process.env.EAS_SKIP_AUTO_FINGERPRINT = "1";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "Usage: node scripts/eas-build.mjs --profile <name> --platform <android|ios> [...eas flags]"
  );
  process.exit(1);
}

const result = spawnSync("eas", ["build", ...args], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
