# svelte-preprocess-import-css

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

```html
<style>
@import "./a.css" scoped;
@import "./b.css" scoped;

.another-style { display: block }
</style>
```

will get converted into:

```html
<style>
contents of a.css will be here
contents of b.css will be here

.another-style { display: block }
</style>
```

## License
[MIT](./LICENSE)
