import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The bottom bar may not end at pixel zero.
 *
 * 44px cells running into the edge of the glass put most of a tap target
 * inside whatever the device owns down there — the home indicator on iOS, the
 * gesture bar on Android, the browser's own bottom chrome. The inset and its
 * floor are easy to delete as "redundant padding" in a later tidy-up, and the
 * cost only shows up on a phone, which is where nobody is testing.
 *
 * Paired with the viewport meta: env(safe-area-inset-*) reports 0 unless the
 * page has opted into the full viewport, so removing viewport-fit=cover would
 * silently reduce this to the floor.
 */
const roles = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/styles/roles.css'), 'utf-8');
const appHtml = fs.readFileSync(path.resolve(process.cwd(), 'src/app.html'), 'utf-8');

function rule(selector: string): string {
	const m = new RegExp(`\\${selector}\\s*\\{([\\s\\S]*?)\\n\\t\\}`).exec(roles);
	if (!m) throw new Error(`${selector} not found in roles.css`);
	return m[1];
}

describe('dock bottom edge', () => {
	it('keeps the bar off the screen edge, with a floor for devices reporting no inset', () => {
		const dock = rule('.dock');
		expect(dock).toMatch(/padding-bottom:\s*max\(\s*env\(safe-area-inset-bottom\)/);
	});

	it('gives the page back the height the taller bar takes, or the footer hides under it', () => {
		expect(rule('.dock-clear')).toMatch(/env\(safe-area-inset-bottom\)/);
	});

	it('opts into the full viewport, which is what makes the inset non-zero', () => {
		expect(appHtml).toContain('viewport-fit=cover');
	});

	it('guards the horizontal insets too, since cover lets content under a landscape notch', () => {
		expect(rule('.page')).toMatch(/env\(safe-area-inset-left\)/);
		expect(rule('.shell')).toMatch(/env\(safe-area-inset-left\)/);
	});
});
