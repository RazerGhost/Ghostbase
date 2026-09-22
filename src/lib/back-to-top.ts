/**
 * When "back to top" earns its cell in the dock.
 *
 * The rule is a judgement, so it lives here where it can be stated and tested
 * rather than inside a scroll handler where it can only be tweaked.
 *
 * It has now been wrong twice in opposite directions. A flat 480px threshold
 * meant a short page hit its own bottom before ever crossing it, so the button
 * never appeared. Scaling the threshold to the scrollable distance
 * (`maxScroll * 0.5`) fixed that page and broke the rest: measured at
 * 1440x900, /about showed the button after 39px of scroll and the home page
 * after 66px — the least useful pages were the quickest to offer it, because
 * a proportion of a small number is a smaller number.
 *
 * Both attempts were asking "how far down this page are you?". The question
 * that matters is "is getting back to the top actual work?", which needs the
 * page to be long in absolute terms, not relatively far travelled.
 */

/** A page has to hold at least one more screenful than it shows. */
export function canScrollFarEnough(viewportHeight: number, scrollHeight: number): boolean {
	return scrollHeight - viewportHeight > viewportHeight;
}

export function shouldShowBackToTop(
	scrollY: number,
	viewportHeight: number,
	scrollHeight: number
): boolean {
	// One screen down, on a page with at least one more screen to go. At
	// 1440x900 that means /listens, /watchlist and a devlog post get it and
	// /, /about, /gear, /projects and /devlog do not — which is the split you
	// would draw by hand.
	return canScrollFarEnough(viewportHeight, scrollHeight) && scrollY > viewportHeight;
}
