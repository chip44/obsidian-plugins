import { around } from 'monkey-around';
import { Plugin } from 'obsidian';

/* oxlint-disable typescript/no-unsafe-type-assertion eslint/require-unicode-regexp */

// opening $
const MATH_BEGIN = String.raw`^(\$)[^\s$]`;
const MATH_BEGIN_NEW = new RegExp(MATH_BEGIN.replace(String.raw`\s`, ''));

// closing $
const MATH_END = String.raw`^[^\s\\]\$([^0-9]|$)`;
const MATH_END_NEW = new RegExp(MATH_END.replace(String.raw`\s`, ''));

// Obsidian's hypermd mode (CM5) rejects inline math with spaces adjacent to $ via two regexes that include \s.
// this removes those guards.
const handleMathRegex = (pattern: RegExp): RegExp => {
  if (pattern.flags !== '') return pattern;

  const src = pattern.source;
  if (src === MATH_BEGIN) return MATH_BEGIN_NEW;
  if (src === MATH_END) return MATH_END_NEW;

  return pattern;
};

export default class BreathingRoomPlugin extends Plugin {
  private uninstallStringStreamMatch: () => void = () => {};
  private uninstallStringMatch: () => void = () => {};

  onload(): void {
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
}
