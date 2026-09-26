/**
 * Streaming the slow part of a page's data (design.md § Loading).
 *
 * A load that returns a promise lets SvelteKit send the rest of the page
 * first and fill that part in when it resolves, so a navigation to the
 * watchlist shows the page at once with its shelves pending rather than
 * holding the previous page until Simkl answers.
 *
 * Only on client-side navigation, though. On a full page load the same
 * promise would render its pending state into the HTML — a crawler, a link
 * preview or a phone on a slow connection would get a page of skeletons with
 * the content arriving in a script tag at the end. A first load has nothing
 * on screen to keep responsive anyway, so there it is awaited and rendered
 * as ordinary HTML. The page's `{#await}` takes either shape.
 */

/**
 * Runs `compute` on a later turn of the event loop.
 *
 * The listening-history aggregates are synchronous SQLite, and cold they
 * take over a second (they are memoized, but every scrobble clears the memo).
 * Called inline, a promise wrapped around them would still run to completion
 * before SvelteKit could write the first byte, so nothing would stream.
 * Pushed to a later macrotask, the first chunk is out first: measured on
 * /listens/__data.json against 200k plays, the header's data arrived at
 * 249ms and the history at 1.6s, where before it all arrived together.
 */
export function deferred<T>(compute: () => T | Promise<T>): Promise<T> {
	const promise = new Promise<T>((resolve, reject) => {
		setTimeout(() => {
			try {
				resolve(compute());
			} catch (err) {
				reject(err);
			}
		}, 0);
	});
	// SvelteKit handles the rejection when the promise is streamed, and the
	// awaited path throws it to the caller. Neither attaches a handler before
	// a sync throw in the load between here and its return would, so this
	// keeps that case from becoming an unhandled rejection that takes the
	// process down.
	promise.catch(() => {});
	return promise;
}

type Parts = Record<string, Promise<unknown>>;

/**
 * Streams `parts` on client-side navigation, awaits them on a full page load.
 * Spread the result into the load's return value.
 */
export async function streamOnNavigation<T extends Parts>(
	isDataRequest: boolean,
	parts: T
): Promise<{ [K in keyof T]: T[K] | Awaited<T[K]> }> {
	if (isDataRequest) return parts;
	const keys = Object.keys(parts) as (keyof T)[];
	const values = await Promise.all(keys.map((k) => parts[k]));
	return Object.fromEntries(keys.map((k, i) => [k, values[i]])) as { [K in keyof T]: Awaited<T[K]> };
}
