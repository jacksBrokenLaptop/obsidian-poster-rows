import { BasesAllOptions, BasesPropertyId, BasesViewConfig } from 'obsidian';

export type CoverShape = 'auto' | 'fill' | 'fit';
export type ClickAction = 'open' | 'details';

export interface PosterRowsConfig {
	imageProp: BasesPropertyId | null;
	titleProp: BasesPropertyId | null;
	subtitleProp: BasesPropertyId | null;
	ratingProp: BasesPropertyId | null;
	ratingScale: number;
	descriptionProp: BasesPropertyId | null;
	rowProp: BasesPropertyId | null;
	coverShape: CoverShape;
	cardSize: number;
	showFeatured: boolean;
	showRecent: boolean;
	showTopRated: boolean;
	clickAction: ClickAction;
}

const DEFAULTS = {
	image: 'note.image',
	title: '',
	subtitle: '',
	rating: 'note.personalRating',
	ratingScale: '10',
	description: 'note.plot',
	rowProp: 'note.type',
	coverShape: 'auto',
	cardSize: 150,
	showFeatured: true,
	showRecent: true,
	showTopRated: true,
	clickAction: 'open',
} as const;

export function viewOptions(): BasesAllOptions[] {
	return [
		{
			type: 'group',
			displayName: 'Cards',
			items: [
				{ type: 'property', key: 'image', displayName: 'Cover image', default: DEFAULTS.image, placeholder: 'Select property' },
				{ type: 'property', key: 'title', displayName: 'Title', placeholder: 'Note title or file name' },
				{ type: 'property', key: 'subtitle', displayName: 'Line under title', placeholder: 'Visible properties' },
				{
					type: 'dropdown',
					key: 'coverShape',
					displayName: 'Cover shape',
					default: DEFAULTS.coverShape,
					options: { auto: 'Detect from image', fill: 'Fill the card (crop)', fit: 'Fit inside (letterbox)' },
				},
				{ type: 'slider', key: 'cardSize', displayName: 'Card width', default: DEFAULTS.cardSize, min: 100, max: 260, step: 10 },
				{
					type: 'dropdown',
					key: 'clickAction',
					displayName: 'On select',
					default: DEFAULTS.clickAction,
					options: { open: 'Open note', details: 'Show details' },
				},
			],
		},
		{
			type: 'group',
			displayName: 'Rating',
			items: [
				{ type: 'property', key: 'rating', displayName: 'Rating', default: DEFAULTS.rating, placeholder: 'Select property' },
				{
					type: 'dropdown',
					key: 'ratingScale',
					displayName: 'Rating out of',
					default: DEFAULTS.ratingScale,
					options: { '5': '5', '10': '10', '100': '100' },
				},
			],
		},
		{
			type: 'group',
			displayName: 'Rows',
			items: [
				{ type: 'toggle', key: 'showFeatured', displayName: 'Featured banner', default: DEFAULTS.showFeatured },
				{ type: 'property', key: 'description', displayName: 'Banner text', default: DEFAULTS.description, placeholder: 'Select property' },
				{ type: 'toggle', key: 'showRecent', displayName: 'Recently modified row', default: DEFAULTS.showRecent },
				{ type: 'toggle', key: 'showTopRated', displayName: 'Top rated row', default: DEFAULTS.showTopRated },
				{ type: 'property', key: 'rowProp', displayName: 'Row per value of', default: DEFAULTS.rowProp, placeholder: 'None' },
			],
		},
	];
}

function prop(config: BasesViewConfig, key: string, fallback: string): BasesPropertyId | null {
	const raw = config.get(key);
	if (raw === undefined) return fallback ? (fallback as BasesPropertyId) : null;
	return config.getAsPropertyId(key);
}

function bool(config: BasesViewConfig, key: string, fallback: boolean): boolean {
	const raw = config.get(key);
	return typeof raw === 'boolean' ? raw : fallback;
}

function pick<T extends string>(config: BasesViewConfig, key: string, allowed: readonly T[], fallback: T): T {
	const raw = config.get(key);
	return allowed.includes(raw as T) ? (raw as T) : fallback;
}

export function readConfig(config: BasesViewConfig): PosterRowsConfig {
	const size = Number(config.get('cardSize'));
	const scale = Number(config.get('ratingScale') ?? DEFAULTS.ratingScale);
	return {
		imageProp: prop(config, 'image', DEFAULTS.image),
		titleProp: prop(config, 'title', DEFAULTS.title),
		subtitleProp: prop(config, 'subtitle', DEFAULTS.subtitle),
		ratingProp: prop(config, 'rating', DEFAULTS.rating),
		ratingScale: scale > 0 ? scale : 10,
		descriptionProp: prop(config, 'description', DEFAULTS.description),
		rowProp: prop(config, 'rowProp', DEFAULTS.rowProp),
		coverShape: pick(config, 'coverShape', ['auto', 'fill', 'fit'] as const, DEFAULTS.coverShape),
		cardSize: size >= 80 && size <= 400 ? size : DEFAULTS.cardSize,
		showFeatured: bool(config, 'showFeatured', DEFAULTS.showFeatured),
		showRecent: bool(config, 'showRecent', DEFAULTS.showRecent),
		showTopRated: bool(config, 'showTopRated', DEFAULTS.showTopRated),
		clickAction: pick(config, 'clickAction', ['open', 'details'] as const, DEFAULTS.clickAction),
	};
}
