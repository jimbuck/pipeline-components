import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		include: ["src/**/*.test.tsx", "src/**/*.test.ts"],
		exclude: ["node_modules", "dist"]
	},
});
