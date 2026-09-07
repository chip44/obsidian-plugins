import { noop, type Uninstaller } from '@shared/utils';
import { around } from 'monkey-around';
import { Plugin } from 'obsidian';

import { DEFAULT_CONFIG, BreathingRoomPluginSettingTab, type PluginConfig } from './settings';

/* oxlint-disable typescript/no-unsafe-type-assertion require-unicode-regexp */

// opening $
const MATH_BEGIN = String.raw`^(\$)[^\s$]`;
const MATH_BEGIN_NEW = new RegExp(String.raw`^(\$)[^$]`);

// closing $
const MATH_END = String.raw`^[^\s\\]\$([^0-9]|$)`;
const MATH_END_NEW = new RegExp(String.raw`^[^\\]\$([^0-9]|$)`);
const MATH_END_NEW_NO_BACKSLASH = new RegExp(String.raw`^\$([^0-9]|$)`);
const MATH_END2 = String.raw`[^\\]\$(.|$)`;
const MATH_END2_NEW_NO_BACKSLASH = new RegExp(String.raw`\$(.|$)`);

export default class BreathingRoomPlugin extends Plugin {
  settings: PluginConfig = DEFAULT_CONFIG;
  private uninstallStringStreamMatch: Uninstaller = noop;
  private uninstallStringMatch: Uninstaller = noop;

  // oxlint-disable-next-line max-lines-per-function
  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new BreathingRoomPluginSettingTab(this));

    // Obsidian's hypermd mode (CM5) rejects inline math with spaces adjacent to $ via two regexes that include \s.
    // this removes those guards.
    const handleMathRegex = (pattern: RegExp): RegExp => {
      if (pattern.flags !== '') return pattern;

      const src = pattern.source;
      if (src === MATH_BEGIN) return MATH_BEGIN_NEW;
      if (src === MATH_END)
        return this.settings.allowBackslash ? MATH_END_NEW_NO_BACKSLASH : MATH_END_NEW;
      if (src === MATH_END2)
        return this.settings.allowBackslash ? MATH_END2_NEW_NO_BACKSLASH : pattern;

      return pattern;
    };

    // the hypermd token function calls t.match() via CM5's StringStream (why does Obsidian still use CM5? idk).
    // we can't patch the mode directly (it's a closure on an internal CM5 instance, window.CodeMirrorAdapter, separate
    // from the public window.CodeMirror), so we intercept here instead.
    this.uninstallStringStreamMatch = around(CodeMirrorAdapter.StringStream.prototype, {
      match(oldMatch) {
        return function (
          this: InstanceType<typeof CodeMirrorAdapter.StringStream>,
          ...args: Parameters<typeof oldMatch>
        ) {
          const pattern = args[0];
          if (pattern instanceof RegExp) {
            args[0] = handleMathRegex(pattern);
          }
          return oldMatch.apply(this, args);
        } as typeof oldMatch;
      },
    });

    // the closing delimiter check uses String.prototype.match directly on a raw line slice, so it needs a separate intercept.
    this.uninstallStringMatch = around(
      String.prototype as { match: typeof String.prototype.match },
      {
        match(oldMatch) {
          return function (
            this: InstanceType<typeof String>,
            ...args: Parameters<typeof oldMatch>
          ) {
            const pattern = args[0];
            if (pattern instanceof RegExp) {
              args[0] = handleMathRegex(pattern);
            }
            return oldMatch.apply(this, args);
          } as typeof oldMatch;
        },
      },
    );
  }

  onunload(): void {
    this.uninstallStringMatch();
    this.uninstallStringStreamMatch();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_CONFIG, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
