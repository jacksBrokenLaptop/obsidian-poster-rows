import { Plugin } from 'obsidian';
import { viewOptions } from './options';
import { POSTER_ROWS_VIEW, PosterRowsView } from './view';

export default class PosterRowsPlugin extends Plugin {
	onload(): void {
		this.registerBasesView(POSTER_ROWS_VIEW, {
			name: 'Poster rows',
			icon: 'lucide-gallery-horizontal-end',
			factory: (controller, containerEl) => new PosterRowsView(controller, containerEl),
			options: viewOptions,
		});
	}
}
