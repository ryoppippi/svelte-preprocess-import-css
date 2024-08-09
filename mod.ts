import process from "node:process";
import * as path from "pathe";
import * as fs from "node:fs/promises";
import MagicString, { Bundle } from "magic-string";
import queryString from "query-string";
import cssSelectorExtract from "css-selector-extract";
import type { PreprocessorGroup } from "svelte/compiler";
import type { Config as SvelteKitConfig } from "@sveltejs/kit";
import type { UserConfig as ViteConfig } from "vite";
import { loadConfig } from "unconfig";

async function loadAliases() {
  const { config } = await loadConfig({
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
  return config?.alias ?? {};
}

/**
 * Resolve paths
 */
async function getAbsPath(
  { filename, file }: { filename?: string; file: string },
) {
  const aliases = await loadAliases();
  const dirname = filename ? path.dirname(filename) : process.cwd();

  if (path.isAbsolute(file)) {
    return file;
  }

  if (file.startsWith("./") || file.startsWith("../")) {
    return path.resolve(dirname, file);
  }

  for (const [alias, aliasPath] of Object.entries(aliases)) {
    const addSlash = (str: string) => (str.endsWith("/") ? str : `${str}/`);
    if (file.startsWith(addSlash(alias)) || file === alias) {
      const s = new MagicString(file);
      s.overwrite(0, alias.length, addSlash(aliasPath));
      return path.resolve(s.toString());
    }
  }

  return file;
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
    const {
      url: file,
      query,
    } = queryString.parseUrl(match[1].substring(1, match[1].length - 1));
    matches.push({
      start,
      end,
      file,
      query,
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
    name: "import-css-scoped",
    style: async function ({ content, filename }) {
      const imports = matchAllImports(content);
      if (imports.length > 0) {
        let lastStart: number | undefined = undefined;
        const state = new MagicString(content, { filename });
        const remove = (start: number, end: number) =>
          state.clone().remove(start, end);
        const out = [];
        const deps = [];
        for (const { start, end, file, query } of imports.reverse()) {
          // Right
          if (lastStart != null) {
            out.push(remove(lastStart, content.length).remove(0, end));
          } else {
            out.push(remove(0, end));
          }
          const absPath = await getAbsPath({ filename, file });
          deps.push(absPath);

          const cssText = (await fs.readFile(absPath)).toString();

          let replaceText: string | undefined = undefined;

          if (Object.keys(query).length > 0) {
            const filters = Object.entries(query).map(([key, value]) => ({
              selector: key,
              replacement: value ?? undefined,
            }));

            const selectedCss: string = await cssSelectorExtract.process({
              css: cssText,
              filters,
            });

            replaceText = selectedCss;
          } else {
            replaceText = cssText;
          }

          out.push(new MagicString(replaceText, { filename: absPath }));
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
