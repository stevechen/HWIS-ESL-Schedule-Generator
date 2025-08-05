/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
	webServer: {
		command: 'pnpm run dev',
		port: 5173,
		reuseExistingServer: true
	},
	testDir: 'tests-e2e',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/
};

export default config;
