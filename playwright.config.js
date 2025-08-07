/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
	webServer: {
		command: 'pnpm run dev',
		port: 5173,
		reuseExistingServer: true
	},
	testDir: 'src/tests/integration',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/
};

export default config;
