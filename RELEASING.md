# Releasing

Poster Rows is listed in the [Obsidian Community directory](https://community.obsidian.md/plugins/poster-rows). Users get updates from GitHub releases, so shipping a fix or feature only needs a new release. There's nothing to resubmit.

## Ship a new version

1. Add a section for the new version at the top of `CHANGELOG.md`, headed `## x.y.z`. The release workflow copies it into the GitHub release description.
2. Check that it builds and lints: `npm run build && npm run lint`.
3. Bump the version: `npm version patch` (or `minor` / `major`). This updates `package.json`, `manifest.json` and `versions.json`, commits, and creates a tag with no leading `v`.
4. Push the commit and the tag: `git push && git push --tags`.
5. `.github/workflows/release.yml` builds the plugin and creates a **draft** release with `main.js`, `manifest.json` and `styles.css` attached, plus build attestations.
6. Open the draft on GitHub, check the notes and the three assets, and publish it.
7. On your [directory page](https://community.obsidian.md/account/plugins/poster-rows), select **Check for new releases** and read the automated review. Fix anything it flags in another release.

If you raise `minAppVersion` in `manifest.json`, do it before step 3 so `versions.json` records the new minimum for that version.

## Keep it anonymous

The repo commits as `jacksBrokenLaptop` with a GitHub noreply email (set in this repo's local git config), and pushes sign in as `jacksBrokenLaptop`. Don't change those, and don't put your real name or email in commits, files or release notes.

## Guidelines it already follows

- Built from obsidianmd/obsidian-sample-plugin (TypeScript, esbuild), linted with `eslint-plugin-obsidianmd`.
- No `innerHTML` and no inline styles (only a CSS variable for card width, set through `setCssProps`). Styling uses Obsidian CSS variables, UI text uses sentence case, and the timer is cleared on unload.
- No Node or Electron APIs (`isDesktopOnly: false`), no network requests and no console logging.
- The id and name don't contain "obsidian", and the description doesn't start with "This plugin".
