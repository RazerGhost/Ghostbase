import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { site } from '$lib/config';

const FONT_DIR = path.resolve(process.cwd(), 'src/lib/server/fonts');

const WIDTH = 1200;
const HEIGHT = 630;

/* The card is the site's register at poster scale (design.md § Typography):
   Instrument Serif for the title, JetBrains Mono for the label row, hairline
   rules as the structure, and no glow behind any of it. Colours are the
   tokens from tokens.css, written out because satori has no stylesheet —
   keep them in step by hand if a token moves. */
const INK = '#f3f1ed'; // --white
const DIM = '#8d8a85'; // --dim
const ACCENT = '#22d3ee'; // --accent
const GROUND = '#0c0c0d'; // --bg
const RULE = '#232322'; // --border

const SERIF = 'Instrument Serif';
const MONO = 'JetBrains Mono';

// satori's TypeScript signature types its element tree as React's
// `ReactNode`, but this project doesn't depend on react — cast our own
// minimal, structurally-equivalent tree at the call site below rather than
// pull in @types/react just for a type satori never actually needs at runtime.
interface OgNode {
	type: 'div';
	props: {
		style?: Record<string, string | number>;
		children?: OgNode | OgNode[] | string;
	};
}

type LoadedFont = { name: string; data: Buffer; weight: 400; style: 'normal' };

let fontsCache: LoadedFont[] | null = null;

/**
 * The three faces, at weight 400 only — display type is never bolded here.
 *
 * satori reads ttf/otf/woff but not woff2, and @fontsource ships Archivo and
 * JetBrains Mono as variable woff2 alone, so those two are checked in as
 * static ttf instanced at wght 400 from those exact files. Instrument Serif
 * ships a plain .woff, which is copied as-is.
 */
function loadFonts(): LoadedFont[] {
	if (!fontsCache) {
		fontsCache = (
			[
				[SERIF, 'InstrumentSerif-Regular.woff'],
				['Archivo', 'Archivo-Regular.ttf'],
				[MONO, 'JetBrainsMono-Regular.ttf']
			] as const
		).map(([name, file]) => ({
			name,
			data: fs.readFileSync(path.join(FONT_DIR, file)),
			weight: 400 as const,
			style: 'normal' as const
		}));
	}
	return fontsCache;
}

export interface OgImageOptions {
	title: string;
	tags: string[];
	eyebrow?: string;
}

// satori + resvg cost real CPU per render, and crawlers re-fetch og.png
// liberally — cache finished PNGs keyed on the exact inputs, so a changed
// title/tags naturally becomes a new entry. Bounded FIFO: at a few posts
// per site this never evicts in practice, the cap just keeps a scraper
// probing bogus slugs from growing the map unboundedly (404s never render,
// so only real pages land here — the cap is pure belt-and-braces).
const MAX_CACHED_IMAGES = 100;
const imageCache = new Map<string, Buffer>();

export async function renderOgImage(options: OgImageOptions): Promise<Buffer> {
	const key = JSON.stringify(options);
	const cached = imageCache.get(key);
	if (cached) return cached;

	const png = await renderOgImageUncached(options);
	if (imageCache.size >= MAX_CACHED_IMAGES) {
		const oldest = imageCache.keys().next().value;
		if (oldest !== undefined) imageCache.delete(oldest);
	}
	imageCache.set(key, png);
	return png;
}

/** A mono label: uppercase and tracked, the one label register the site has. */
function label(text: string, color: string): OgNode {
	return {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				fontFamily: MONO,
				fontSize: '20px',
				letterSpacing: '3.2px', // 0.16em, --track-label
				textTransform: 'uppercase',
				color
			},
			children: text
		}
	};
}

/** One hairline. Rules are the structure here, at exactly one weight. */
function rule(): OgNode {
	return {
		type: 'div',
		props: { style: { display: 'flex', height: '1px', backgroundColor: RULE } }
	};
}

/**
 * Instrument Serif carries far more presence per pixel than a grotesque, so
 * the steps below are gentler than a sans would need — a 90-character title
 * still wants to read as one held breath, not as a paragraph.
 */
function titleSize(title: string): string {
	if (title.length > 78) return '52px';
	if (title.length > 44) return '64px';
	return '76px';
}

async function renderOgImageUncached({ title, tags, eyebrow }: OgImageOptions): Promise<Buffer> {
	const tree: OgNode = {
		type: 'div',
		props: {
			style: {
				display: 'flex',
				flexDirection: 'column',
				width: `${WIDTH}px`,
				height: `${HEIGHT}px`,
				padding: '60px 64px',
				backgroundColor: GROUND,
				fontFamily: 'Archivo'
			},
			children: [
				// Masthead: the mark, the wordmark, and which part of the site.
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							paddingBottom: '26px'
						},
						children: [
							{
								type: 'div',
								props: {
									style: { display: 'flex', alignItems: 'center', gap: '14px' },
									children: [
										{
											type: 'div',
											props: {
												style: {
													display: 'flex',
													width: '11px',
													height: '11px',
													borderRadius: '9999px',
													backgroundColor: ACCENT
												}
											}
										},
										label('RazerGhost', INK)
									]
								}
							},
							...(eyebrow ? [label(eyebrow, ACCENT)] : [])
						]
					}
				},
				rule(),

				/* The title hangs off the bottom rule rather than centring, so a
				   two-word post and a nine-word one both land on the same line
				   and the quiet field above reads as deliberate either way. */
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							flexGrow: 1,
							alignItems: 'flex-end',
							paddingTop: '40px',
							paddingBottom: '38px'
						},
						children: [
							{
								type: 'div',
								props: {
									style: {
										display: 'flex',
										fontFamily: SERIF,
										fontSize: titleSize(title),
										fontWeight: 400,
										color: INK,
										lineHeight: 1.12,
										letterSpacing: '-0.9px' // --track-display
									},
									children: title
								}
							}
						]
					}
				},

				rule(),
				{
					type: 'div',
					props: {
						style: {
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							paddingTop: '26px'
						},
						children: [
							{
								type: 'div',
								props: {
									style: { display: 'flex', gap: '20px' },
									children: tags.slice(0, 4).map((tag) => label(tag, DIM))
								}
							},
							label(new URL(site.url).host, DIM)
						]
					}
				}
			]
		}
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see OgNode comment above
	const svg = await satori(tree as any, { width: WIDTH, height: HEIGHT, fonts: loadFonts() });

	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
	return resvg.render().asPng();
}
