# svelte-preprocess-import-css

[![JSR](https://jsr.io/badges/@ryoppippi/svelte-preprocess-import-css)](https://jsr.io/@ryoppippi/svelte-preprocess-import-css)
[![JSR](https://jsr.io/badges/@ryoppippi/svelte-preprocess-import-css/score)](https://jsr.io/@ryoppippi/svelte-preprocess-import-css)

This is a Svelte preprocessor that allows you to import scoped CSS files into your Svelte components.
Based on [this issue](https://github.com/sveltejs/svelte/issues/7125#issuecomment-1528965643)

## Usage

You can add it to your `svelte.config.js`, then add it to the preprocessor list:

```js
import { importCSSPreprocess } from '@ryoppippi/svelte-preprocess-import-css';
export default {
  preprocess: [
    importCSSPreprocess(), // <--
    svelteAutoPreprocess(),
  ],
};
```

Now you can use `@import "./whatever.css" scoped;`.

For example, the following CSS:

```svelte
<style>
@import "./a.css" scoped;
@import "./b.css" scoped;

.another-style { display: block }
</style>
```

will get converted into:

```svelte
<style>
contents of a.css will be here
contents of b.css will be here

.another-style { display: block }
</style>
```

### Select Style Rules by Query Selector

You can select style rules by query selector.

For example, the following CSS and Svelte:


```css
/* a.css */

div { color: red; }

.message { color: blue; }
```

```svelte
<div> hello </div>
<p class="message"> world </p>

<style>
@import "./a.css?.message" scoped;

div { color: green; }
</style>
```

will get converted into:

```svelte
<div> hello </div>
<p class="message"> world </p>

<style>
.message { color: blue; }

div { color: green; }
</style>
```

### Rename Style Rules by Query Selector

You can rename style rules by query selector.

For example, the following CSS and Svelte:

```css
/* a.css */

div { color: red; }

.m0 { color: blue; }
```

```svelte
<p class="m1"> world </p>

<style>
@import "./a.css?.m0=.m1" scoped;

div { color: green; }
</style>
```

will get converted into:

```svelte
<p class="m1"> world </p>

<style>
.m1 { color: blue; }

div { color: green; }
</style>
```

## License
[MIT](./LICENSE)
