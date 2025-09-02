// jest.config.ts
import type { JestConfigWithTsJest } from "ts-jest";
import { resolve } from "path";

const config: JestConfigWithTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "./tsconfig.test.json",
        useESM: true,
      }
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(mongoose|mongodb-memory-server)/)",
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^src/configs/configs$': '<rootDir>/tests/mocks/configs.mock.ts',
    '^src/configs/minio$': '<rootDir>/tests/mocks/minio.mock.ts',
    '^src/models/asset.model$': '<rootDir>/tests/mocks/asset.model.mock.ts',
    '^src/queue/queue$': '<rootDir>/tests/mocks/queue.mock.ts',
  },
  verbose: true,
  testTimeout: 30000,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
};

export default config;