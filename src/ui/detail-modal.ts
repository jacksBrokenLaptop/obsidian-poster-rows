import { App, BasesViewConfig, Modal } from 'obsidian';
import { PosterItem } from '../items';
import { CoverShape, PosterRowsConfig } from '../options';
import { readText } from '../values';
import { formatRating, renderCover } from './cover';

/** A details card for one note: cover, rating, description and the view's visible properties. */
export class PosterDetailModal extends Modal {
	constructor(
		app: App,
		private item: PosterItem,
		private cfg: PosterRowsConfig,
		private viewConfig: BasesViewConfig,
		private coverShape: CoverShape,
		private openNote: (newTab: boolean) => void,
	) {
		super(app);
	}

	onOpen(): void {
		const { item, cfg } = this;
		this.modalEl.addClass('poster-rows-modal');
		const content = this.contentEl;
		content.empty();

		const head = content.createDiv('poster-rows-detail-head');
		if (item.cover) {
			head.createDiv('poster-rows-backdrop').createEl('img', { attr: { src: item.cover, alt: '' } });
		}
		const headInner = head.createDiv('poster-rows-detail-head-inner');
		renderCover(headInner, item.cover, item.title, this.coverShape, 'poster-rows-detail-cover');
		const text = headInner.createDiv('poster-rows-detail-title');
		text.createEl('h2', { text: item.title });
		if (item.subtitle) text.createDiv({ cls: 'poster-rows-meta', text: item.subtitle });

		const body = content.createDiv('poster-rows-detail-body');
		if (item.rating !== null) renderMeter(body, item.rating, cfg.ratingScale);
		if (item.description) body.createEl('p', { cls: 'poster-rows-detail-description', text: item.description });

		const skip = new Set<string>([cfg.imageProp, cfg.titleProp, cfg.ratingProp, cfg.descriptionProp, 'file.name', 'note.title'].filter(Boolean) as string[]);
		const props = this.viewConfig.getOrder().filter(p => !skip.has(p));
		const list = createEl('dl', { cls: 'poster-rows-detail-props' });
		for (const prop of props) {
			const value = readText(item.entry, prop);
			if (!value) continue;
			list.createEl('dt', { text: this.viewConfig.getDisplayName(prop) });
			list.createEl('dd', { text: value });
		}
		if (list.childElementCount) body.appendChild(list);

		const actions = body.createDiv('poster-rows-detail-actions');
		const open = actions.createEl('button', { cls: 'mod-cta', text: 'Open note' });
		open.addEventListener('click', evt => {
			this.close();
			this.openNote(evt.ctrlKey || evt.metaKey);
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

function renderMeter(parent: HTMLElement, rating: number, scale: number): void {
	const meter = parent.createDiv('poster-rows-meter');
	const score = meter.createDiv('poster-rows-meter-score');
	score.createSpan({ text: formatRating(rating) });
	score.createSpan({ cls: 'poster-rows-meter-scale', text: `/${scale}` });
	const ticks = meter.createDiv({ cls: 'poster-rows-ticks', attr: { 'aria-hidden': 'true' } });
	const steps = scale <= 10 ? scale : 10;
	const filled = (rating / scale) * steps;
	for (let n = 0; n < steps; n++) {
		const tick = ticks.createSpan('poster-rows-tick');
		if (filled >= n + 1) tick.addClass('is-on');
		else if (filled > n) tick.addClass('is-half');
	}
}
