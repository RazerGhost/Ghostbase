import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `.plot__scale` may not set its own width.
 *
 * It is a block-level flex container, so it already fills its parent. Setting
 * `width: 100%` on top of that is not redundant, it is wrong: the habits
 * grid's axis carries `ml-11` to clear its day labels, and 100% *plus* a 44px
 * margin ran 5px past the page. That put a horizontal scrollbar on /listens
 * at every width, which is the kind of thing nobody reports and everybody
 * feels.
 *
 * It survived the pass that introduced it because the two plots' own scales
 * have no margin, so they looked right while the third one did not.
 */
const roles = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/styles/roles.css'), 'utf-8');

function rule(selector: string): string {
	const m = new RegExp(`\\${selector}\\s*\\{([\\s\\S]*?)\\n\\t\\}`).exec(roles);
	if (!m) throw new Error(`${selector} not found in roles.css`);
	return m[1];
}

describe('.plot__scale', () => {
	it('exists and lays its ticks out across the row', () => {
		expect(rule('.plot__scale')).toMatch(/justify-content:\s*space-between/);
	});

	it('does not set a width, so a margin on it still fits', () => {
		expect(rule('.plot__scale')).not.toMatch(/^\s*width:/m);
	});
});

/**
 * A plot may not have a minimum width per point.
 *
 * `.plot__col` had `min-width: 2px` inside a `.plot` with a fixed 2px gap, so
 * each month cost 4px however narrow the screen. The all-time series on
 * /listens has 129 months, which is 514px — wider than a phone's column, so
 * the page scrolled sideways and the dock went out of reach. The series only
 * grows, so any per-point floor comes back as the same bug eventually.
 */
describe('.plot', () => {
	it('lets its columns shrink to nothing', () => {
		expect(rule('.plot__col')).toMatch(/min-width:\s*0\s*;/);
	});

	it('caps its gap as a share of the width, not a fixed length', () => {
		expect(rule('.plot')).toMatch(/gap:\s*min\(\s*2px\s*,\s*calc\(\s*50%\s*\/\s*var\(--plot-cols/);
	});
});
