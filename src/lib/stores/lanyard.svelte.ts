import { site } from '$lib/config';
import { liveSpotify, type LanyardData } from './lanyard-live';

export type { LanyardActivity, LanyardData, LanyardSpotify } from './lanyard-live';

// Single shared Lanyard connection, used by DiscordPresence, SpotifyWidget,
// and ListeningNowCard. Previously each of those hit Spotify's own API
// through our server (via /api/spotify), and since that route shares one
// refresh token across every visitor, three independent polling loops per
// page load (plus one per browser tab left open) was enough to trip Spotify's
// rate limit and land the account in a cooldown. Lanyard already tracks
// Spotify listening as part of Discord Rich Presence (pushed from Discord's
// gateway, not polled from Spotify), so reading it from there removes
// Spotify's API from this path entirely — at the cost of only working while
// the account is online in Discord with Spotify activity sharing enabled.
//
// Lanyard's WebSocket pushes each presence change as Discord reports it, so
// a track change shows within a second or two instead of waiting out a poll
// interval. REST polling is only the fallback for while the socket is down
// (blocked by a network, Lanyard restarting), and stops once it reconnects.

const SOCKET_URL = 'wss://api.lanyard.rest/socket';
const REST_URL = `https://api.lanyard.rest/v1/users/${site.discordUserId}`;
const POLL_MS = 20_000;
// If the socket has not delivered its initial state by then, start polling
// rather than leave the page empty while it keeps trying.
const SOCKET_GRACE_MS = 5_000;
const RECONNECT_MIN_MS = 1_000;
const RECONNECT_MAX_MS = 60_000;

// Lanyard's socket opcodes.
const OP_EVENT = 0;
const OP_HELLO = 1;
const OP_INITIALIZE = 2;
const OP_HEARTBEAT = 3;

let data = $state<LanyardData | null>(null);
let status = $state<'loading' | 'ready' | 'error'>('loading');
let connected = $state(false);
let confirmedAt = $state(0);

let subscribers = 0;
let socket: WebSocket | undefined;
let heartbeat: ReturnType<typeof setInterval> | undefined;
let pollInterval: ReturnType<typeof setInterval> | undefined;
let graceTimer: ReturnType<typeof setTimeout> | undefined;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let reconnectDelay = RECONNECT_MIN_MS;
let onVisible: (() => void) | undefined;

function apply(next: LanyardData) {
	data = next;
	status = 'ready';
	confirmedAt = Date.now();
}

async function poll() {
	try {
		const res = await fetch(REST_URL);
		if (!res.ok) throw new Error(`Lanyard returned ${res.status}`);
		const json = await res.json();
		if (!json.success) throw new Error('Lanyard: user not found in cache');
		// A slow poll can land after the socket has come back; the socket's
		// data is newer by construction, so don't let the poll overwrite it.
		if (!connected) apply(json.data);
	} catch {
		if (!connected) status = 'error';
	}
}

function startPolling() {
	if (pollInterval || subscribers === 0) return;
	poll();
	pollInterval = setInterval(poll, POLL_MS);
}

function stopPolling() {
	clearInterval(pollInterval);
	pollInterval = undefined;
}

function connect() {
	if (socket || subscribers === 0 || typeof WebSocket === 'undefined') return;
	clearTimeout(reconnectTimer);
	reconnectTimer = undefined;

	let ws: WebSocket;
	try {
		ws = new WebSocket(SOCKET_URL);
	} catch {
		startPolling();
		scheduleReconnect();
		return;
	}
	socket = ws;

	ws.onmessage = (event) => {
		let msg: { op: number; t?: string; d?: unknown };
		try {
			msg = JSON.parse(event.data);
		} catch {
			return;
		}
		if (msg.op === OP_HELLO) {
			const interval = (msg.d as { heartbeat_interval?: number })?.heartbeat_interval ?? 30_000;
			ws.send(JSON.stringify({ op: OP_INITIALIZE, d: { subscribe_to_id: site.discordUserId } }));
			clearInterval(heartbeat);
			heartbeat = setInterval(() => {
				if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: OP_HEARTBEAT }));
			}, interval);
		} else if (msg.op === OP_EVENT && (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE')) {
			connected = true;
			reconnectDelay = RECONNECT_MIN_MS;
			clearTimeout(graceTimer);
			stopPolling();
			apply(msg.d as LanyardData);
		}
	};

	ws.onerror = () => ws.close();

	ws.onclose = () => {
		if (socket !== ws) return;
		socket = undefined;
		connected = false;
		clearInterval(heartbeat);
		heartbeat = undefined;
		if (subscribers === 0) return;
		// Keep the page current while the socket is away.
		startPolling();
		scheduleReconnect();
	};
}

function scheduleReconnect() {
	if (reconnectTimer || subscribers === 0) return;
	reconnectTimer = setTimeout(() => {
		reconnectTimer = undefined;
		connect();
	}, reconnectDelay);
	reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
}

function disconnect() {
	const ws = socket;
	socket = undefined;
	connected = false;
	clearInterval(heartbeat);
	heartbeat = undefined;
	clearTimeout(reconnectTimer);
	reconnectTimer = undefined;
	clearTimeout(graceTimer);
	graceTimer = undefined;
	stopPolling();
	ws?.close();
}

// Reference-counted so the connection only exists while at least one
// component on the page cares, and opens immediately the moment the first
// one mounts.
function start() {
	if (subscribers++ > 0) return;

	connect();
	graceTimer = setTimeout(() => {
		if (!connected) startPolling();
	}, SOCKET_GRACE_MS);

	// Background tabs get their timers throttled, which can starve the
	// heartbeat and get the socket dropped. When the tab comes back, don't
	// sit out the reconnect backoff: reconnect now, and fill the gap with one
	// REST read in case the socket takes a moment.
	onVisible = () => {
		if (document.visibilityState !== 'visible' || connected) return;
		reconnectDelay = RECONNECT_MIN_MS;
		clearTimeout(reconnectTimer);
		reconnectTimer = undefined;
		connect();
		poll();
	};
	document.addEventListener('visibilitychange', onVisible);
	window.addEventListener('focus', onVisible);
}

function stop() {
	if (subscribers === 0) return;
	if (--subscribers > 0) return;
	disconnect();
	if (onVisible) {
		document.removeEventListener('visibilitychange', onVisible);
		window.removeEventListener('focus', onVisible);
		onVisible = undefined;
	}
}

export function useLanyard() {
	return {
		get data() {
			return data;
		},
		get status() {
			return status;
		},
		/**
		 * The track to show as playing at `now`, or null — see liveSpotify in
		 * lanyard-live.ts for when a reported track counts as stale. Pass a
		 * ticking `now` so a track that stops being believable disappears on
		 * its own, without waiting for Lanyard to say anything.
		 */
		spotifyAt(now: number) {
			return liveSpotify(data, now, { connected, confirmedAt });
		},
		start,
		stop
	};
}
