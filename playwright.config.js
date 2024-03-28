/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: true
	},
	testDir: 'tests-e2e',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/
};

export default config;
