import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The hero entrance may not be able to hide content.
 *
 * `animation-fill-mode: both` applies the `from` keyframe before the
 * animation starts, so an `opacity: 0` in there means "blank page" for any
 * browser that throttles, defers or drops the animation. That shipped once as
 * the scroll-reveal port and was removed; it then shipped again as the hero
 * stagger, where it took 94% of /about and 100% of /gear with it.
 *
 * A unit test rather than a comment because the rule is invisible in review:
 * adding `opacity: 0` back to that keyframe looks like a one-word change.
 */
const css = fs.readFileSync(path.resolve(process.cwd(), 'src/app.css'), 'utf-8');

function heroKeyframes(): string {
	const m = /@keyframes hero-in\s*\{([\s\S]*?)\n\}/.exec(css);
	if (!m) throw new Error('hero-in keyframes not found in app.css');
	return m[1];
}

describe('hero entrance', () => {
	it('exists', () => {
		expect(heroKeyframes()).toContain('transform');
	});

	it('never animates opacity, so a stalled animation cannot blank the page', () => {
		expect(heroKeyframes()).not.toMatch(/opacity/);
	});

	it('is still applied with a fill mode, so the stagger holds its start state', () => {
		expect(css).toMatch(/\[data-hero-reveal\]\s*\{[^}]*animation:[^;]*both/);
	});
});
