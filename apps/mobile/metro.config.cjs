const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const fs = require("fs");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// Real paths — fixes module resolution with Hebrew folders / subst drives
const realProjectRoot = fs.realpathSync.native(projectRoot);
const realWorkspaceRoot = fs.realpathSync.native(workspaceRoot);

const config = getDefaultConfig(realProjectRoot);

config.watchFolders = [realWorkspaceRoot];
config.resolver.nodeModulesPaths = [
  path.join(realProjectRoot, "node_modules"),
  path.join(realWorkspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: "./global.css" });
