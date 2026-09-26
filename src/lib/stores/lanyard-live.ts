/**
 * Lanyard's payload types, and the one decision about them that is worth
 * testing: whether the Spotify track it last reported is still believable.
 * Kept out of lanyard.svelte.ts (like service-worker/policy.ts) so it can be
 * unit tested without runes or a WebSocket.
 */

export interface LanyardSpotify {
	track_id: string;
	timestamps: { start: number; end: number };
	song: string;
	artist: string;
	album: string;
	album_art_url: string;
}

export interface LanyardActivity {
	name: string;
	type: number;
	state?: string;
	details?: string;
	application_id?: string;
	emoji?: { name: string; id?: string };
	timestamps?: { start?: number; end?: number };
	assets?: {
		large_image?: string;
		large_text?: string;
		small_image?: string;
		small_text?: string;
	};
}

export interface LanyardData {
	discord_status: 'online' | 'idle' | 'dnd' | 'offline';
	discord_user: { id: string; username: string; global_name: string | null; avatar: string | null };
	activities: LanyardActivity[];
	active_on_discord_desktop: boolean;
	active_on_discord_mobile: boolean;
	active_on_discord_web: boolean;
	listening_to_spotify: boolean;
	spotify: LanyardSpotify | null;
}

/**
 * How long past a track's own end time it may still be shown. Discord
 * usually reports the next track within a couple of seconds; past this, the
 * presence it pushed has gone quiet (Discord closed, Spotify sharing dropped)
 * and the track on screen is a leftover, not what is playing.
 */
export const TRACK_END_GRACE_MS = 15_000;

/**
 * How long data may go unconfirmed while the WebSocket is down and the page
 * is falling back to REST polls (every 20s). Three missed polls in a row and
 * whatever it last said is no longer "now".
 */
export const UNCONFIRMED_STALE_MS = 60_000;

export interface Freshness {
	/** The live socket is open — every change is pushed, so silence is not staleness. */
	connected: boolean;
	/** When Lanyard last answered successfully, over either path (ms epoch). */
	confirmedAt: number;
}

/**
 * The Spotify track to show as playing right now, or null. Null when Lanyard
 * says nothing is playing, and also when what it said can no longer be
 * trusted: the track should have ended a while ago, or the connection has
 * been failing long enough that nothing it last said is current.
 */
export function liveSpotify(data: LanyardData | null, now: number, freshness: Freshness): LanyardSpotify | null {
	const spotify = data?.listening_to_spotify ? data.spotify : null;
	if (!spotify) return null;
	if (now > spotify.timestamps.end + TRACK_END_GRACE_MS) return null;
	if (!freshness.connected && now - freshness.confirmedAt > UNCONFIRMED_STALE_MS) return null;
	return spotify;
}
