import { describe, expect, it } from 'vitest';
import { liveSpotify, TRACK_END_GRACE_MS, UNCONFIRMED_STALE_MS, type LanyardData } from './lanyard-live';

const START = 1_000_000;
const END = START + 180_000;

function presence(overrides: Partial<LanyardData> = {}): LanyardData {
	return {
		discord_status: 'online',
		discord_user: { id: '1', username: 'u', global_name: null, avatar: null },
		activities: [],
		active_on_discord_desktop: true,
		active_on_discord_mobile: false,
		active_on_discord_web: false,
		listening_to_spotify: true,
		spotify: {
			track_id: 't',
			timestamps: { start: START, end: END },
			song: 'Song',
			artist: 'Artist',
			album: 'Album',
			album_art_url: ''
		},
		...overrides
	};
}

const live = { connected: true, confirmedAt: 0 };

describe('liveSpotify', () => {
	it('returns the track mid-play', () => {
		expect(liveSpotify(presence(), START + 60_000, live)?.song).toBe('Song');
	});

	it('returns null when nothing is playing', () => {
		expect(liveSpotify(null, START, live)).toBeNull();
		expect(liveSpotify(presence({ listening_to_spotify: false }), START, live)).toBeNull();
	});

	it('keeps a track just past its end, for the next one to arrive', () => {
		expect(liveSpotify(presence(), END + TRACK_END_GRACE_MS, live)).not.toBeNull();
	});

	it('drops a track long past its end, even while connected', () => {
		expect(liveSpotify(presence(), END + TRACK_END_GRACE_MS + 1, live)).toBeNull();
	});

	it('trusts a quiet connected socket, however long since the last push', () => {
		const now = START + 60_000;
		expect(liveSpotify(presence(), now, { connected: true, confirmedAt: now - 10 * UNCONFIRMED_STALE_MS })).not.toBeNull();
	});

	it('drops the track when disconnected and unconfirmed for too long', () => {
		const now = START + 120_000;
		expect(liveSpotify(presence(), now, { connected: false, confirmedAt: now - UNCONFIRMED_STALE_MS })).not.toBeNull();
		expect(liveSpotify(presence(), now, { connected: false, confirmedAt: now - UNCONFIRMED_STALE_MS - 1 })).toBeNull();
	});
});
