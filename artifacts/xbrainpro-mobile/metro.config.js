const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Bundle 3D model files as assets.
config.resolver.assetExts = [...config.resolver.assetExts, "glb", "gltf"];

module.exports = config;
