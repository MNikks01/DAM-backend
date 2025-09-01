/** @type {import('ts-jest').JestConfigWithTsJest} */
// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
//   testMatch: ['**/tests/**/*.test.ts'],
//   moduleFileExtensions: ['ts', 'js', 'json'],
//   transform: {
//     '^.+\\.ts$': 'ts-jest',
//   },
//   globals: {
//     'ts-jest': {
//       tsconfig: 'tsconfig.json',
//     },
//   },
//   verbose: true,
// };

// module.exports = {
//   preset: "ts-jest",
//   testEnvironment: "node",
//   testMatch: ["**/tests/**/*.test.ts"],
//   moduleFileExtensions: ["ts", "js", "json"],
//   // transform: {
//   //   '^.+\\.ts$': ['ts-jest', {
//   //     useESM: true,  // important for ESM support
//   //   }],
//   // },
//   globals: {
//     "ts-jest": {
//       useESM: true,
//     },
//   },
//   transform: {
//     "^.+\\.tsx?$": "babel-jest",
//   },
//   extensionsToTreatAsEsm: [".ts"],
//   verbose: true,
//   testTimeout: 30000,
//   setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
// };

// jest.config.ts
import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  preset: "ts-jest/presets/default-esm", // ESM + TS support
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {},
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      useESM: true,
      tsconfig: "./tsconfig.test.json",
    },
  },
  verbose: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
};

export default config;
