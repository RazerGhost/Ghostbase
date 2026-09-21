// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: { username: string };
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	/** ISO timestamp of this build, replaced by Vite (see vite.config.ts). */
	const __BUILD_TIME__: string;
}

export {};
