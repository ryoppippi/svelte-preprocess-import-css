import { join } from "node:path";
import { assertSnapshot } from "@std/testing/snapshot";
import { preprocess } from "svelte/compiler";
import { importCSSPreprocess } from "./mod.ts";

async function load(_filename: string) {
  const filename = join(
    import.meta.dirname as string,
    _filename,
  );

  const source = Deno.readTextFileSync(filename);
  const { code } = await preprocess(
    source,
    [importCSSPreprocess()],
    { filename },
  );

  return code;
}

Deno.test(
  "example svelte main",
  async function (t) {
    const code = await load("./test_project/Main.svelte");
    await assertSnapshot(t, code);
  },
);

Deno.test(
  "example svelte partial",
  async function (t) {
    const code = await load("./test_project/Partial.svelte");
    await assertSnapshot(t, code);
  },
);

Deno.test(
  "example svelte rename",
  async function (t) {
    const code = await load("./test_project/Rename.svelte");
    await assertSnapshot(t, code);
  },
);
