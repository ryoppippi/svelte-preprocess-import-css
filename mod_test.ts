import { join } from "node:path";
import { assertSnapshot } from "@std/testing/snapshot";
import { preprocess } from "svelte/compiler";
import { importCSSPreprocess } from "./mod.ts";

Deno.test(
  "example svelte main",
  async function (t) {
    const filename = join(
      import.meta.dirname as string,
      "./test_project/Main.svelte",
    );
    const source = Deno.readTextFileSync(filename);
    const { code } = await preprocess(
      source,
      [importCSSPreprocess()],
      { filename },
    );

    await assertSnapshot(t, code);
  },
);
Deno.test(
  "example svelte partial",
  async function (t) {
    const filename = join(
      import.meta.dirname as string,
      "./test_project/Partial.svelte",
    );
    const source = Deno.readTextFileSync(filename);
    const { code } = await preprocess(
      source,
      [importCSSPreprocess()],
      { filename },
    );

    await assertSnapshot(t, code);
  },
);
