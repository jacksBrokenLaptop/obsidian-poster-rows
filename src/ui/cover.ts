import { CoverShape } from '../options';

// Images wider than this (width / height) are treated as square or landscape art and letterboxed.
const LETTERBOX_RATIO = 0.85;

/**
 * Render a cover into `parent`. Portrait art fills the frame; square art (album covers)
 * is shown whole over a blurred copy of itself so nothing is cropped.
 */
export function renderCover(parent: HTMLElement, src: string, title: string, shape: CoverShape, cls: string): HTMLElement {
	const frame = parent.createDiv({ cls: ['poster-rows-cover', cls] });
	if (!src) {
		frame.addClass('is-blank');
		frame.createDiv({ cls: 'poster-rows-cover-blank', text: title });
		return frame;
	}

	const letterbox = () => {
		if (frame.hasClass('is-fit')) return;
		frame.addClass('is-fit');
		frame.prepend(createEl('img', { cls: 'poster-rows-cover-bg', attr: { src, alt: '', loading: 'lazy', draggable: 'false' } }));
	};

	const img = frame.createEl('img', { cls: 'poster-rows-cover-img', attr: { src, alt: '', loading: 'lazy', draggable: 'false' } });
	if (shape === 'fit') letterbox();
	else if (shape === 'auto') {
		const check = () => {
			if (img.naturalHeight && img.naturalWidth / img.naturalHeight > LETTERBOX_RATIO) letterbox();
		};
		if (img.complete) check();
		else img.addEventListener('load', check, { once: true });
	}
	img.addEventListener(
		'error',
		() => {
			frame.empty();
			frame.removeClass('is-fit');
			frame.addClass('is-blank');
			frame.createDiv({ cls: 'poster-rows-cover-blank', text: title });
		},
		{ once: true },
	);
	return frame;
}

export function formatRating(rating: number): string {
	return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
}
