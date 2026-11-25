import { BasesView, HoverParent, HoverPopover, Keymap, PaneType, QueryController } from 'obsidian';
import { builtInRows, featuredItems, PosterItem, PosterRow, toItem } from './items';
import { PosterRowsConfig, readConfig } from './options';
import { formatRating, renderCover } from './ui/cover';
import { PosterDetailModal } from './ui/detail-modal';

export const POSTER_ROWS_VIEW = 'poster-rows';

const ROTATE_MS = 9000;

export class PosterRowsView extends BasesView implements HoverParent {
	readonly type = POSTER_ROWS_VIEW;
	hoverPopover: HoverPopover | null = null;

	private rootEl: HTMLElement;
	private heroEl: HTMLElement | null = null;
	private cfg!: PosterRowsConfig;
	private featured: PosterItem[] = [];
	private heroIndex = 0;
	private rotateTimer: number | null = null;
	// Horizontal scroll per row, kept across re-renders so editing a note doesn't jump rows back to the start.
	private railScroll = new Map<string, number>();

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller);
		this.rootEl = parentEl.createDiv('poster-rows');
	}

	onunload(): void {
		this.stopRotation();
		this.rootEl.empty();
	}

	onDataUpdated(): void {
		this.saveRailScroll();
		this.stopRotation();
		this.cfg = readConfig(this.config);
		const cfg = this.cfg;

		const root = this.rootEl;
		root.empty();
		root.setCssProps({ '--poster-rows-card-width': `${cfg.cardSize}px` });

		const items = this.data.data.map(entry => toItem(this.app, entry, cfg, this.config));
		if (!items.length) {
			root.createDiv({ cls: 'poster-rows-empty', text: 'No notes match this view.' });
			return;
		}

		this.heroEl = null;
		if (cfg.showFeatured) {
			const featured = featuredItems(items);
			if (featured.length) {
				// Keep showing the same title if it is still featured after an update.
				const current = this.featured[this.heroIndex]?.entry.file.path;
				const keep = featured.findIndex(i => i.entry.file.path === current);
				this.featured = featured;
				this.heroIndex = keep >= 0 ? keep : 0;
				this.heroEl = root.createEl('section', { cls: 'poster-rows-hero', attr: { 'aria-label': 'Featured' } });
				this.renderHero();
				this.startRotation();
			}
		}

		const rowsEl = root.createDiv('poster-rows-rows');
		for (const row of this.rows(items)) this.renderRow(rowsEl, row);
	}

	private rows(items: PosterItem[]): PosterRow[] {
		const groups = this.data.groupedData;
		const grouped = groups.length > 1 || groups.some(g => g.hasKey());
		if (!grouped) return builtInRows(items, this.cfg, this.config);

		const byPath = new Map(items.map(i => [i.entry.file.path, i]));
		return groups
			.map((group, n) => {
				const label = group.hasKey() ? group.key?.toString() ?? '' : '';
				return {
					key: `group:${n}:${label}`,
					label: label || 'No value',
					items: group.entries.map(e => byPath.get(e.file.path)).filter((i): i is PosterItem => !!i),
				};
			})
			.filter(row => row.items.length);
	}

	private renderHero(): void {
		const hero = this.heroEl;
		const item = this.featured[this.heroIndex];
		if (!hero || !item) return;
		hero.empty();

		if (item.cover) hero.createDiv('poster-rows-backdrop').createEl('img', { attr: { src: item.cover, alt: '' } });
		const inner = hero.createDiv('poster-rows-hero-inner');
		const text = inner.createDiv('poster-rows-hero-text');
		text.createDiv({ cls: 'poster-rows-eyebrow', text: item.rating !== null ? 'Top rated' : 'Recently modified' });
		text.createEl('h2', { cls: 'poster-rows-hero-title', text: item.title });

		const meta = text.createDiv('poster-rows-meta');
		if (item.rating !== null) meta.createSpan({ cls: 'poster-rows-score', text: `${formatRating(item.rating)}/${this.cfg.ratingScale}` });
		if (item.subtitle) meta.createSpan({ text: item.subtitle });
		if (item.description) text.createEl('p', { cls: 'poster-rows-hero-description', text: item.description });

		const actions = text.createDiv('poster-rows-hero-actions');
		const open = actions.createEl('button', { cls: 'mod-cta', text: 'Open' });
		open.addEventListener('click', evt => this.openNote(item, Keymap.isModEvent(evt)));
		const details = actions.createEl('button', { text: 'Details' });
		details.addEventListener('click', () => this.showDetails(item));

		if (this.featured.length > 1) {
			const dots = actions.createDiv('poster-rows-dots');
			this.featured.forEach((pick, n) => {
				const dot = dots.createEl('button', {
					cls: 'poster-rows-dot',
					attr: { 'aria-label': `Show ${pick.title}`, 'aria-current': String(n === this.heroIndex) },
				});
				dot.addEventListener('click', () => {
					this.heroIndex = n;
					this.renderHero();
					this.startRotation();
				});
			});
		}

		const poster = inner.createDiv('poster-rows-hero-poster');
		renderCover(poster, item.cover, item.title, this.cfg.coverShape, 'poster-rows-hero-cover');
		poster.addEventListener('click', () => this.showDetails(item));
	}

	private startRotation(): void {
		this.stopRotation();
		if (this.featured.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		this.rotateTimer = window.setInterval(() => {
			if (!this.rootEl.isConnected) return this.stopRotation();
			// Don't swap the banner while it is off screen, in a background tab, or being read.
			if (this.rootEl.doc.hidden || !this.rootEl.offsetParent || this.heroEl?.matches(':hover, :focus-within')) return;
			this.heroIndex = (this.heroIndex + 1) % this.featured.length;
			this.renderHero();
		}, ROTATE_MS);
	}

	private stopRotation(): void {
		if (this.rotateTimer !== null) window.clearInterval(this.rotateTimer);
		this.rotateTimer = null;
	}

	private renderRow(parent: HTMLElement, row: PosterRow): void {
		const section = parent.createEl('section', { cls: 'poster-rows-row', attr: { 'data-row': row.key } });
		const heading = section.createDiv('poster-rows-row-heading');
		heading.createEl('h3', { text: row.label });
		heading.createSpan({ cls: 'poster-rows-row-count', text: String(row.items.length) });

		const wrap = section.createDiv('poster-rows-rail-wrap');
		const prev = wrap.createEl('button', { cls: 'poster-rows-nudge is-prev clickable-icon', attr: { 'aria-label': 'Scroll left' } });
		const rail = wrap.createDiv({ cls: 'poster-rows-rail', attr: { role: 'list' } });
		const next = wrap.createEl('button', { cls: 'poster-rows-nudge is-next clickable-icon', attr: { 'aria-label': 'Scroll right' } });
		prev.setText('‹');
		next.setText('›');

		for (const item of row.items) this.renderCard(rail, item);

		const sync = () => {
			prev.toggleClass('is-hidden', rail.scrollLeft < 4);
			next.toggleClass('is-hidden', rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4);
		};
		prev.addEventListener('click', () => rail.scrollBy({ left: -rail.clientWidth * 0.85, behavior: 'smooth' }));
		next.addEventListener('click', () => rail.scrollBy({ left: rail.clientWidth * 0.85, behavior: 'smooth' }));
		rail.addEventListener('scroll', sync, { passive: true });

		const saved = this.railScroll.get(row.key);
		window.requestAnimationFrame(() => {
			if (saved) rail.scrollLeft = saved;
			sync();
		});
	}

	private renderCard(rail: HTMLElement, item: PosterItem): void {
		const label = item.rating !== null ? `${item.title}, rated ${formatRating(item.rating)} out of ${this.cfg.ratingScale}` : item.title;
		const card = rail.createDiv({ cls: 'poster-rows-card', attr: { role: 'listitem', tabindex: '0', 'aria-label': label } });
		const cover = renderCover(card, item.cover, item.title, this.cfg.coverShape, 'poster-rows-card-cover');

		if (item.rating !== null) {
			const share = item.rating / this.cfg.ratingScale;
			const badge = cover.createSpan({ cls: 'poster-rows-badge', text: formatRating(item.rating) });
			if (share >= 0.9) badge.addClass('is-top');
			else if (share < 0.6) badge.addClass('is-low');
		}
		card.createDiv({ cls: 'poster-rows-card-title', text: item.title });
		if (item.subtitle) card.createDiv({ cls: 'poster-rows-card-subtitle', text: item.subtitle });

		card.addEventListener('click', evt => this.activate(item, evt));
		card.addEventListener('auxclick', evt => {
			if (evt.button === 1) this.openNote(item, true);
		});
		card.addEventListener('keydown', evt => {
			if (evt.key === 'Enter' || evt.key === ' ') {
				evt.preventDefault();
				this.activate(item, evt);
			}
		});
		card.addEventListener('mouseover', evt => {
			this.app.workspace.trigger('hover-link', {
				event: evt,
				source: 'bases',
				hoverParent: this,
				targetEl: card,
				linktext: item.entry.file.path,
			});
		});
	}

	private activate(item: PosterItem, evt: MouseEvent | KeyboardEvent): void {
		const mod = Keymap.isModEvent(evt);
		if (this.cfg.clickAction === 'details' && !mod) this.showDetails(item);
		else this.openNote(item, mod);
	}

	private showDetails(item: PosterItem): void {
		new PosterDetailModal(this.app, item, this.cfg, this.config, this.cfg.coverShape, newTab => this.openNote(item, newTab)).open();
	}

	private openNote(item: PosterItem, newLeaf: PaneType | boolean): void {
		void this.app.workspace.openLinkText(item.entry.file.path, '', newLeaf);
	}

	private saveRailScroll(): void {
		this.rootEl.querySelectorAll<HTMLElement>('.poster-rows-row').forEach(section => {
			const rail = section.querySelector<HTMLElement>('.poster-rows-rail');
			const key = section.dataset.row;
			if (rail && key) this.railScroll.set(key, rail.scrollLeft);
		});
	}
}
