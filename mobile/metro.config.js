const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so changes to packages/shared trigger reloads
config.watchFolders = [workspaceRoot];

// Resolve modules from both mobile/node_modules and the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Let Metro follow symlinks (npm workspaces use them)
config.resolver.unstable_enableSymlinks = true;

module.exports = config;