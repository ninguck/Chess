import type { Config } from "jest";

const config: Config = {
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: ["<rootDir>/src/**/*.test.ts"],
	moduleFileExtensions: ["ts", "tsx", "js"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	clearMocks: true,
};

export default config;
