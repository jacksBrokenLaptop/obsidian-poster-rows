# Submitting to the community plugin list

Nothing here has been published yet. Each step below is yours to approve.

## Before the first release

- [x] Author set to `jacksBrokenLaptop` in `manifest.json` and `LICENSE`. Optionally add `fundingUrl` to `manifest.json` later.
- [ ] Test in your vault on desktop and on your phone (sync `.obsidian/plugins/poster-rows/` or install from the release later). Try light and dark themes and a grouped view.
- [ ] Check the plugin id isn't taken: search for `"id": "poster-rows"` in [community-plugins.json](https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json). Rename the id now if it is; it can't change after release.
- [ ] Optional: add a screenshot to the README. Reviewers and users like seeing the view.

## Publish the repo and a release

- [ ] Create a public GitHub repo (for example `obsidian-poster-rows`) and push `main`. `main.js` is gitignored on purpose.
- [ ] Make sure `manifest.json` `version` (now `0.1.0`) matches the tag you're about to push, and that `versions.json` maps it to `minAppVersion` (`1.10.0`).
- [ ] Tag and push: `git tag 0.1.0 && git push origin 0.1.0` (no leading `v`). `.github/workflows/release.yml` builds and creates a **draft** release with `main.js`, `manifest.json` and `styles.css` attached.
- [ ] Open the draft on GitHub, check the three assets are attached, and publish it.

## Submit

- [ ] Fork [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) and add this entry at the end of `community-plugins.json`:

  ```json
  {
  	"id": "poster-rows",
  	"name": "Poster Rows",
  	"author": "jacksBrokenLaptop",
  	"description": "Adds a Bases view that shows notes as a featured banner and horizontally scrolling rows of cover images.",
  	"repo": "jacksBrokenLaptop/obsidian-poster-rows"
  }
  ```

- [ ] Open a pull request using the plugin template and tick its checklist. The automated validator compares this entry with the `manifest.json` in your repo's root and the latest release, so the id, name, author and description must match exactly.
- [ ] Respond to the review bot and the human reviewer. Fixes go out as a new release (bump the version with `npm version patch`, then push the tag).

## Already done

- Built from obsidianmd/obsidian-sample-plugin (TypeScript, esbuild). `npm run build` and `npm run lint` (with `eslint-plugin-obsidianmd`) pass.
- No `innerHTML`, no inline styles (only a CSS variable for card width, set through `setCssProps`), styling uses Obsidian CSS variables, UI text uses sentence case, no Node or Electron APIs (`isDesktopOnly: false`), no network requests, no console logging, and the timer is cleared on unload.
- The id and name don't contain "obsidian", and the description doesn't start with "This plugin".
