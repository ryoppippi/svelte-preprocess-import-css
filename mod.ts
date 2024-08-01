import * as path from "pathe";
import * as fs from "node:fs/promises";
import MagicString, { Bundle } from "magic-string";
import type { PreprocessorGroup } from "svelte/compiler";
import type { Config as SvelteKitConfig } from "@sveltejs/kit";
import type { UserConfig as ViteConfig } from "vite";
import { loadConfig } from "unconfig";

async function loadAliases() {
  const { config: { alias } } = await loadConfig({
    merge: true,
    sources: [
      {
        files: "svelte.config",
        rewrite: (_config) => {
          const config = _config as SvelteKitConfig;
          return { alias: config?.kit?.alias };
        },
      },
      {
        files: "vite.config",
        rewrite: (_config) => {
          const config = _config as ViteConfig;
          return { alias: config?.resolve?.alias };
        },
      },
    ],
  });
  return alias;
}

/**
 * Make `@import "./whatever.css" scoped;` statements import CSS into the component's CSS scope
 */
function matchAllImports(str: string) {
  const globalRegex = /@import\s+(".*"|'.*')\s+scoped\s*;/g;
  const matches = [];
  let match: ReturnType<typeof globalRegex.exec>;
  // eslint-disable-next-line no-cond-assign
  while ((match = globalRegex.exec(str)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    matches.push({
      start,
      end,
      file: match[1].substring(1, match[1].length - 1),
    });
  }
  return matches;
}

/**
 * Make `@import "./whatever.css" scoped;` statements import CSS into the component's CSS scope
 * originally from https://github.com/sveltejs/svelte/issues/7125#issuecomment-1528965643
 */
export function importCSSPreprocess(): PreprocessorGroup {
  return {
    style: async function ({ content, filename }) {
      const imports = matchAllImports(content);
      if (imports.length > 0) {
        let lastStart: number | undefined = undefined;
        const state = new MagicString(content, { filename });
        const remove = (start: number, end: number) =>
          state.clone().remove(start, end);
        const out = [];
        const deps = [];
        for (const { start, end, file } of imports.reverse()) {
          // Right
          if (lastStart != null) {
            out.push(remove(lastStart, content.length).remove(0, end));
          } else {
            out.push(remove(0, end));
          }
          const absPath = path.join(path.dirname(filename ?? ""), file);
          deps.push(absPath);
          const text = (await fs.readFile(absPath)).toString();
          out.push(new MagicString(text, { filename: absPath }));
          lastStart = start;
        }

        // Left
        if (lastStart == null) throw new Error("lastStart should be null");
        const first = remove(lastStart, content.length);
        const bundle = new Bundle();
        bundle.addSource(first);
        for (let i = out.length - 1; i >= 0; i--) {
          bundle.addSource(out[i]);
        }

        return {
          code: bundle.toString(),
          map: bundle.generateMap(),
          dependencies: deps,
        };
      } else {
        return { code: content };
      }
    },
  };
}
