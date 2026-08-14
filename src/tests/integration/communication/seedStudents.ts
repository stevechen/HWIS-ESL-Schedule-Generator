import { expect, type Page } from '@playwright/test';

interface SeedStudent {
	id: string;
	english: string;
	chinese: string;
	cClass: string;
}

/**
 * Seeds students by writing a saved communication record into localStorage,
 * reloading, and loading it through the Saved Records UI. This exercises the
 * genuine persistence seam (no dev hook like the old `window.setStudentsText`).
 */
export async function seedStudents(page: Page, text: string) {
	const students = text
		.trim()
		.split('\n')
		.map((line) => {
			const [id, cClass, chinese, english] = line.split('\t');
			return { id, english, chinese, cClass };
		});

	await page.goto('/communication');
	await page.evaluate((list: SeedStudent[]) => {
		const record = {
			grade: 'G7',
			level: 'Basic',
			classType: 'Comm',
			classNum: '1',
			assignment: 'passport',
			dates: { assigned: '09/01', due: '09/10', late: '09/11' },
			studentsParsed: list.map((s) => ({
				id: s.id,
				name: { english: s.english, chinese: s.chinese },
				cClass: s.cClass,
				status: 0,
				selected: true
			}))
		};
		localStorage.setItem('comm_PrintLayoutSeed', JSON.stringify(record));
		localStorage.setItem('comm_index', JSON.stringify(['PrintLayoutSeed']));
	}, students);

	await page.reload();
	await page.locator('summary:has-text("Saved Records")').click();
	await page.locator('.record:has-text("PrintLayoutSeed")').click();

	await expect(page.locator('td.student-checkbox input[type="checkbox"]')).toHaveCount(
		students.length
	);
}
