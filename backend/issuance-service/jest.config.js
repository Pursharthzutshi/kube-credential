const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  testMatch: ["**/src/_tests_/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  clearMocks: true,
};
