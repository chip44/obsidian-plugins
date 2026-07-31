# Obsidian Plugins

A collection of personal plugins for [Obsidian](https://obsidian.md/).

Not published on the community store and I don't plan to (unless there's enough demand).

## Installation

Currently, you'll need to build plugins manually.

Clone the repository, run `pnpm i`, then build a plugin with `PLUGIN=foo pnpm run build`.

See [Development](#development) for more info.

## Available Plugins

### Autopair

Customize auto-pairing characters.

The plugin uses [CodeMirror](https://codemirror.net/)'s native auto-pairing feature and exposes the configuration.

> [!IMPORTANT]
> Enable `Auto-pair brackets` and `Auto-pair Markdown syntax` options in Obsidian settings, otherwise the functionality might become inconsistent.

> [!NOTE]
> If you plan on using this only for `$`, you're probably better off binding Obsidian's built-in `Toggle inline math` command to a hotkey (e.g. `Ctrl+M`).

### Breathing Room

Allow spaces before and after `$` in inline math.

This is a better alternative to [No more flickering inline math](https://community.obsidian.md/plugins/inline-math) since it doesn't rely on custom text processing and transactions, and instead allows a seamless experience without modifying the source text.

### Glovebox

Automatically expand snippets while typing.

The plugin uses [CodeMirror](https://codemirror.net/)'s native snippets feature and exposes the configuration.

### Keystone

Force QWERTY layout inside math and code blocks, regardless of system layout.

This fixes an annoying issue for people who use a non-English keyboard layout (Cyrillic, Hebrew, Arabic, etc.) and frequently write math or code, forcing them to constantly switch layouts when entering or leaving math and code blocks.

> [!TIP]
> Works best alongside [Breathing Room](#breathing-room), which keeps inline math in math mode (something this plugin relies on for proper context detection).

> [!IMPORTANT]
> If you're using [LaTeX Suite](https://community.obsidian.md/plugins/obsidian-latex-suite), [Autopair](#autopair), or other similar plugins that transform input text, make sure to enable `Compatibility mode` in settings to allow other input handlers to run (without it, they might not work at all in math/code contexts).\
> Otherwise, it's best to leave it disabled for stability and performance reasons.

### Match Brackets

Enable and customize highlighting of matching brackets.

Use the `.cm-editor.cm-focused .cm-matchingBracket` and `.cm-editor.cm-focused .cm-nonmatchingBracket` CSS selectors to change their appearance.

The plugin uses [CodeMirror](https://codemirror.net/)'s native bracket matching feature and exposes the configuration.

### Plumb

Format notes using [dprint](https://dprint.dev/plugins/markdown/).

dprint strictly follows the [CommonMark specification](https://spec.commonmark.org/) so unfortunately it's not very customizable, but hey at least it's fast and consistent!

> [!NOTE]
> The bundle size is quite large (~2 MB) due to WASM (which may impact Sync users), but the plugin loads it at runtime, so startup time is unaffected.

## Development

Use `PLUGIN=foo pnpm run dev` to start the development server which automatically rebuilds the specified plugin as you make changes.
Alternatively, you can run `pnpm run dev:all` to watch all plugins at once.

To create a release build, use `PLUGIN=foo pnpm run build` or `pnpm run build:all`.

If the `VAULT` environment variable is set, the built plugin files are automatically copied to `<VAULT>/.obsidian/plugins/<plugin-id>/` after each built.

`.env` files are also supported.
