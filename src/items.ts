import { App, BasesEntry, BasesPropertyId, BasesViewConfig, parsePropertyId } from 'obsidian';
import { PosterRowsConfig } from './options';
import { readNumber, readStrings, readText, resolveImage } from './values';

export interface PosterItem {
	entry: BasesEntry;
	title: string;
	subtitle: string;
	cover: string;
	rating: number | null;
	description: string;
	mtime: number;
}

export interface PosterRow {
	key: string;
	label: string;
	items: PosterItem[];
	note?: string;
}

const RECENT_LIMIT = 20;
const TOP_LIMIT = 20;
const VALUE_ROW_LIMIT = 24;
const FEATURED_LIMIT = 5;

export function toItem(app: App, entry: BasesEntry, cfg: PosterRowsConfig, viewConfig: BasesViewConfig): PosterItem {
	const title =
		readText(entry, cfg.titleProp) ||
		(cfg.titleProp ? '' : readText(entry, 'note.title')) ||
		entry.file.basename;
	return {
		entry,
		title,
		subtitle: subtitle(entry, cfg, viewConfig),
		cover: resolveImage(app, entry, cfg.imageProp),
		rating: readNumber(entry, cfg.ratingProp),
		description: readText(entry, cfg.descriptionProp),
		mtime: entry.file.stat.mtime,
	};
}

/** The chosen subtitle property, or else the first couple of visible properties. */
function subtitle(entry: BasesEntry, cfg: PosterRowsConfig, viewConfig: BasesViewConfig): string {
	if (cfg.subtitleProp) return readStrings(entry, cfg.subtitleProp).slice(0, 3).join(', ');
	const skip = new Set<string>([cfg.imageProp, cfg.titleProp, cfg.ratingProp, cfg.descriptionProp, 'file.name', 'note.title'].filter(Boolean) as string[]);
	const parts: string[] = [];
	for (const prop of viewConfig.getOrder()) {
		if (skip.has(prop)) continue;
		const text = readStrings(entry, prop).slice(0, 2).join(', ');
		if (text) parts.push(text);
		if (parts.length === 2) break;
	}
	return parts.join(' · ');
}

const byRating = (a: PosterItem, b: PosterItem) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity) || b.mtime - a.mtime;
const byRecent = (a: PosterItem, b: PosterItem) => b.mtime - a.mtime;

/** Rows for an ungrouped view: recent, top rated, then one row per value of a property. */
export function builtInRows(items: PosterItem[], cfg: PosterRowsConfig, viewConfig: BasesViewConfig): PosterRow[] {
	const rows: PosterRow[] = [];
	if (cfg.showRecent && items.length) {
		rows.push({ key: 'recent', label: 'Recently modified', items: [...items].sort(byRecent).slice(0, RECENT_LIMIT) });
	}
	if (cfg.showTopRated) {
		const rated = items.filter(i => i.rating !== null).sort(byRating).slice(0, TOP_LIMIT);
		if (rated.length) rows.push({ key: 'top', label: 'Top rated', items: rated });
	}

	const valueRows = cfg.rowProp ? rowsByValue(items, cfg.rowProp, viewConfig) : [];
	rows.push(...valueRows);
	if (!valueRows.length && items.length) rows.push({ key: 'all', label: 'All', items });
	return rows;
}

function rowsByValue(items: PosterItem[], prop: BasesPropertyId, viewConfig: BasesViewConfig): PosterRow[] {
	const groups = new Map<string, { label: string; items: PosterItem[] }>();
	let isList = false;
	for (const item of items) {
		const values = readStrings(item.entry, prop);
		if (values.length > 1) isList = true;
		for (const label of new Set(values.map(v => v.trim()).filter(Boolean))) {
			const key = label.toLowerCase();
			const group = groups.get(key) ?? { label, items: [] };
			group.items.push(item);
			groups.set(key, group);
		}
	}
	const name = viewConfig.getDisplayName(prop) || parsePropertyId(prop).name;
	return [...groups.entries()]
		// A tag-like list makes many one-off rows, so only keep values shared by two or more notes.
		.filter(([, g]) => !isList || g.items.length > 1)
		.sort((a, b) => b[1].items.length - a[1].items.length || a[1].label.localeCompare(b[1].label))
		.slice(0, VALUE_ROW_LIMIT)
		.map(([key, g]) => ({ key: `value:${key}`, label: capitalize(g.label), items: g.items, note: name }));
}

/** The best-rated notes with covers, falling back to the most recent ones. */
export function featuredItems(items: PosterItem[]): PosterItem[] {
	const withCover = items.filter(i => i.cover);
	const pool = withCover.length ? withCover : items;
	const rated = pool.filter(i => i.rating !== null);
	return (rated.length ? rated.sort(byRating) : [...pool].sort(byRecent)).slice(0, FEATURED_LIMIT);
}

function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}
