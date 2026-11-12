import { App, BasesEntry, BasesPropertyId, ListValue, TFile, Value } from 'obsidian';

/** Read a property as a Value, treating missing, null and empty values alike. */
export function readValue(entry: BasesEntry, prop: BasesPropertyId | null): Value | null {
	if (!prop) return null;
	let value: Value | null;
	try {
		value = entry.getValue(prop);
	} catch {
		return null;
	}
	return value && value.isTruthy() ? value : null;
}

/** Flatten a value into its string parts, so lists become several strings. */
export function readStrings(entry: BasesEntry, prop: BasesPropertyId | null): string[] {
	const value = readValue(entry, prop);
	if (!value) return [];
	if (value instanceof ListValue) {
		const out: string[] = [];
		for (let i = 0; i < value.length(); i++) {
			const item = value.get(i);
			if (item && item.isTruthy()) out.push(cleanLink(item.toString()));
		}
		return out.filter(Boolean);
	}
	const text = cleanLink(value.toString());
	return text ? [text] : [];
}

export function readText(entry: BasesEntry, prop: BasesPropertyId | null): string {
	return readStrings(entry, prop).join(', ');
}

export function readNumber(entry: BasesEntry, prop: BasesPropertyId | null): number | null {
	const value = readValue(entry, prop);
	if (!value) return null;
	const n = Number(value.toString());
	return Number.isFinite(n) ? n : null;
}

function safeDecode(text: string): string {
	try {
		return decodeURI(text);
	} catch {
		return text;
	}
}

/** Turn "[[Note|Alias]]" into "Alias" for display. */
function cleanLink(text: string): string {
	const m = text.trim().match(/^!?\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
	if (m) return (m[2] ?? m[1] ?? '').trim();
	return text.trim();
}

/**
 * Resolve a cover property to a URL the browser can load. Accepts web URLs,
 * wikilinks or embeds to vault images, markdown image syntax and plain vault paths.
 */
export function resolveImage(app: App, entry: BasesEntry, prop: BasesPropertyId | null): string {
	const value = readValue(entry, prop);
	if (!value) return '';
	const raw = (value instanceof ListValue ? value.get(0)?.toString() ?? '' : value.toString()).trim();
	if (!raw) return '';

	const md = raw.match(/^!?\[[^\]]*\]\(([^)\s]+)[^)]*\)$/);
	const wiki = raw.match(/^!?\[\[([^\]|#]+)[^\]]*\]\]$/);
	const target = (md?.[1] ?? wiki?.[1] ?? raw).trim();

	if (/^(https?:|data:image\/|app:|capacitor:)/i.test(target)) return target;

	const file =
		app.metadataCache.getFirstLinkpathDest(safeDecode(target), entry.file.path) ??
		app.vault.getFileByPath(target);
	return file instanceof TFile ? app.vault.getResourcePath(file) : '';
}
