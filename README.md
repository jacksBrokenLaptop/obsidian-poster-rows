# Poster Rows

A view for [Obsidian Bases](https://help.obsidian.md/bases) that shows your notes like a streaming service: a featured banner at the top, then rows of cover images you scroll sideways.

It works with any base whose notes have a cover image property. It was built for notes made by the [Media DB](https://github.com/mProjectsCode/obsidian-media-db-plugin) plugin (movies, series, games, books, music), which store `image`, `personalRating`, `type`, `year` and `genres`, so those are the defaults.

The view is live: edit a note and the rows update. It works on desktop and mobile, in light and dark themes, and uses your theme's colors.

## Use it

1. Open a base (or create one with **New base**).
2. In the view menu at the top left, select **Add view**, then pick **Poster rows** as the layout.
3. Open the view options to set the properties it reads.

You can also add it in the `.base` file directly:

```yaml
views:
  - type: poster-rows
    name: Poster rows
    image: note.image
    rating: note.personalRating
```

## How rows are chosen

- **Grouped view.** If you set **Group by** in the base toolbar, each group becomes a row, in the base's sort order.
- **Ungrouped view.** You get the built-in rows:
  - **Recently modified**: the 20 most recently edited notes.
  - **Top rated**: the 20 highest-rated notes.
  - **One row per value** of the **Row per value of** property (default `type`). For a list property such as `genres`, only values shared by at least two notes get a row.

The **featured banner** cycles through the five highest-rated notes that have covers. If nothing is rated, it shows the most recently modified ones. It pauses while you hover over it, and it doesn't rotate if your system asks for reduced motion.

## Options

| Option | Default | What it does |
| --- | --- | --- |
| Cover image | `image` | Property that holds the cover. Accepts a web URL, a `[[wikilink]]` or `![[embed]]` to an image in your vault, markdown image syntax, or a vault path. |
| Title | note `title`, else file name | Property shown as the card title. |
| Line under title | first two visible properties | Property shown under the title. If you leave it empty, the card uses the properties you've chosen in the base's **Properties** menu. |
| Cover shape | Detect from image | **Detect** letterboxes square or wide art (such as album covers) and fills the card with portrait art. **Fill** always crops to fill. **Fit** always letterboxes. |
| Card width | 150 px | Width of each card. |
| On select | Open note | **Open note** opens it. **Show details** opens a card with the cover, rating, description and visible properties first. Ctrl/Cmd-select always opens the note in a new tab. |
| Rating | `personalRating` | Numeric property used for the badge, the **Top rated** row and the banner. |
| Rating out of | 10 | The scale for your ratings: 5, 10 or 100. |
| Featured banner | On | Show or hide the banner. |
| Banner text | `plot` | Property shown as the banner's description. |
| Recently modified row / Top rated row | On | Turn the built-in rows on or off. |
| Row per value of | `type` | Property that splits notes into rows when the view isn't grouped. Clear it to show a single **All** row. |

Hover over a card while holding Ctrl/Cmd to preview the note.

## Privacy

The plugin makes no network requests of its own. Covers that are web URLs are loaded by Obsidian from wherever the URL points, the same way an embedded image in a note is.

## Install manually

Copy `main.js`, `manifest.json` and `styles.css` from a release into `<your vault>/.obsidian/plugins/poster-rows/`, reload Obsidian, then turn on **Poster Rows** in **Settings → Community plugins**.

Requires Obsidian 1.10.0 or newer.

## Develop

```bash
npm install
npm run dev     # rebuild main.js on change
npm run build   # type-check and production build
npm run lint
```

## License

MIT
