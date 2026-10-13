# API reference

Bride ships a small HTML DSL. Elements are callable macros or functions that
accept **children** and **fields** (attributes and events) in any order. The
same API shape is available in every supported language, with language-specific
namespacing.

| Language | Import | Namespacing | Class helper |
|----------|--------|-------------|--------------|
| C        | `#include "bride.h"` | Unqualified (`p`, `text`, `ui`, ...) | `class(...)` |
| C++      | `#include "bride.hpp"` | `bride::` prefix (`bride::p`, `bride::ui`, ...) | `bride::class_(...)` |
| C3       | `import bride;` | `bride::` prefix (`bride::p`, `bride::ui`, ...) | `bride::class_(...)` |

C, C++, and C3 share the same helper names with one exception: `class` is a
keyword in C++ and C3, so those languages use `class_`. In C use `class`.

Throughout this page, examples are shown in C. See
[Language mapping](#language-mapping) for the exact spelling of every symbol in
each language.

## Rendering

| Function | Description |
|----------|-------------|
| `ui(...)` | Renders the given children and commits them to the root element set in `Bride.start({ root })`. |
| `change(query, ...)` | Renders the given children and replaces the `innerHTML` of the first element matching the CSS `query`. |

Both take a list of children (plus any fields, though fields are pointless at the
top level). In C, C++, and C3 `ui` and `change` are macros.

```c
ui(
    h1(text("Hello")),
    p(text("Welcome to Bride."))
);

change("#counter", textf("Clicks: %d", count));
```

`ui` replaces the entire root element's `innerHTML`. `change` targets a specific
element by selector, which lets you update a fragment of the page without
re-rendering everything. If the selector matches nothing, `change` is a no-op.

## Text

| Function | Description |
|----------|-------------|
| `text(value)` | A text node containing `value`. |
| `textf(format, ...)` | A formatted text node. `printf`-style in C/C++; C3 string formatting in C3. |

```c
p(text("static string"))
p(textf("Count: %d, name: %s", count, name))
```

> Bride does **not** HTML-escape text nodes or attribute values — they are
> emitted verbatim. Escape untrusted input yourself before passing it to
> `text`, `textf`, or any attribute helper.

## Tags

Every tag below is a macro/function that returns a node. Tags accept children and
fields interchangeably.

### Basic

| Tag | Renders | Notes |
|-----|---------|-------|
| `p` | `<p>` | |
| `div_` | `<div>` | Trailing `_` avoids the `div` libc function. |
| `span` | `<span>` | |
| `a` | `<a>` | |
| `button` | `<button>` | |
| `fragment` | *(children only)* | Grouping node with no wrapper element. |

### Headings

`h1`, `h2`, `h3`, `h4`, `h5`, `h6` — each renders the matching `<hN>` element.

### Text semantics

| Tag | Renders | Notes |
|-----|---------|-------|
| `strong` | `<strong>` | |
| `em` | `<em>` | |
| `b` | `<b>` | |
| `i` | `<i>` | |
| `u` | `<u>` | |
| `s` | `<s>` | |
| `small` | `<small>` | |
| `mark` | `<mark>` | |
| `code` | `<code>` | |
| `pre` | `<pre>` | |
| `kbd` | `<kbd>` | |
| `samp` | `<samp>` | |
| `var` | `<var>` | In C3, `var` is a keyword: use `var_`. |
| `cite` | `<cite>` | |
| `abbr` | `<abbr>` | |
| `q` | `<q>` | |
| `sub` | `<sub>` | |
| `sup` | `<sup>` | |
| `blockquote` | `<blockquote>` | |
| `address` | `<address>` | |
| `time_` | `<time>` | Trailing `_` avoids a clash. |
| `del` | `<del>` | |
| `ins` | `<ins>` | |
| `br` | `<br>` | Void. |
| `hr` | `<hr>` | Void. |
| `wbr` | `<wbr>` | Void. |

### Sectioning and grouping

| Tag | Renders | Notes |
|-----|---------|-------|
| `header` | `<header>` | |
| `footer` | `<footer>` | |
| `main_` | `<main>` | Trailing `_`. |
| `nav` | `<nav>` | |
| `aside` | `<aside>` | |
| `section` | `<section>` | |
| `article` | `<article>` | |
| `figure` | `<figure>` | |
| `figcaption` | `<figcaption>` | |
| `ul` | `<ul>` | |
| `ol` | `<ol>` | |
| `li` | `<li>` | |
| `dl` | `<dl>` | |
| `dt` | `<dt>` | |
| `dd` | `<dd>` | |
| `details` | `<details>` | |
| `summary` | `<summary>` | |
| `dialog` | `<dialog>` | |

### Tables

`table`, `caption`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, `colgroup`,
and `col` (void).

### Embedded content

| Tag | Renders | Notes |
|-----|---------|-------|
| `img` | `<img>` | Void. |
| `picture` | `<picture>` | |
| `source` | `<source>` | Void. |
| `track` | `<track>` | Void. |
| `video` | `<video>` | |
| `audio` | `<audio>` | |
| `canvas` | `<canvas>` | |
| `iframe` | `<iframe>` | |
| `embed` | `<embed>` | Void. |
| `object` | `<object>` | |
| `map_` | `<map>` | Trailing `_`. |
| `area` | `<area>` | Void. |

### Forms

| Tag | Renders | Notes |
|-----|---------|-------|
| `form` | `<form>` | |
| `label` | `<label>` | |
| `input` | `<input>` | Void. |
| `textarea` | `<textarea>` | |
| `select_` | `<select>` | Trailing `_`. |
| `option` | `<option>` | |
| `optgroup` | `<optgroup>` | |
| `fieldset` | `<fieldset>` | |
| `legend` | `<legend>` | |
| `datalist` | `<datalist>` | |
| `output` | `<output>` | |
| `progress` | `<progress>` | |
| `meter` | `<meter>` | |

### Templates

`template_` → `<template>` (trailing `_`), and `slot` → `<slot>`.

### Void elements

Void elements take any attributes but **no children**, and render with no closing
tag:

`br`, `hr`, `wbr`, `col`, `img`, `source`, `track`, `embed`, `area`, `input`.

> **Names ending in `_`.** The trailing underscore avoids clashes with language
> keywords or libc symbols: `div_`, `main_`, `time_`, `select_`, `map_`,
> `template_` (and `var_` in C3).

## Fields — attributes

Attribute helpers take a single string value and map to the matching HTML
attribute:

| Helper | HTML attribute | Helper | HTML attribute |
|--------|----------------|--------|----------------|
| `href` | `href` | `tabindex` | `tabindex` |
| `src` | `src` | `autocomplete` | `autocomplete` |
| `alt` | `alt` | `accept` | `accept` |
| `title` | `title` | `min` | `min` |
| `type` | `type` | `max` | `max` |
| `name` | `name` | `step` | `step` |
| `value` | `value` | `pattern` | `pattern` |
| `placeholder` | `placeholder` | `rows` | `rows` |
| `for_` | `for` | `cols` | `cols` |
| `style` | `style` | `method` | `method` |
| `target` | `target` | `form_action` | `action` |
| `rel` | `rel` | `enctype` | `enctype` |
| `role` | `role` | `loading` | `loading` |
| `width` | `width` | `download` | `download` |
| `height` | `height` | | |

### Generic helpers

| Helper | Description |
|--------|-------------|
| `attr(name, value)` | Sets any attribute to any value. |
| `id(name)` | Shorthand for `attr("id", name)`. |
| `class(name)` / `class_(name)` | Shorthand for `attr("class", name)`. Use `class` in C and `class_` in C++ and C3. |

Use `attr` for attributes that have no dedicated helper:

```c
input(attr("data-role", "search"))
```

### Boolean attributes

Boolean helpers take no value. They render as `name=""`, which the browser treats
as *present*:

`disabled`, `checked`, `selected`, `required`, `readonly`, `multiple`,
`autofocus`, `hidden`.

```c
button(disabled(), text("Send"))
input(type("checkbox"), checked())
```

## Fields — events

Event helpers register a handler and render an inline attribute that calls
`Bride.dispatch(n)`:

| Helper | DOM event attribute |
|--------|---------------------|
| `on_click` | `onClick` |
| `on_input` | `onInput` |
| `on_change` | `onChange` |
| `on_submit` | `onSubmit` |
| `on_focus` | `onFocus` |
| `on_blur` | `onBlur` |
| `on_keydown` | `onKeydown` |
| `on_keyup` | `onKeyup` |
| `on_keypress` | `onKeypress` |
| `on_dblclick` | `onDblclick` |
| `on_mousedown` | `onMousedown` |
| `on_mouseup` | `onMouseup` |
| `on_mouseover` | `onMouseover` |
| `on_mouseout` | `onMouseout` |
| `on_mousemove` | `onMousemove` |
| `on_scroll` | `onScroll` |
| `on_load` | `onLoad` |
| `on_contextmenu` | `onContextmenu` |
| `on_wheel` | `onWheel` |

### Handlers

A handler is a plain function with no arguments and no return value — `void
(*)(void)` in C/C++, `fn void()` in C3. Each handler is registered in a dispatch
table and referenced by an integer key.

```c
void increment(void) {
    count++;
    change("#counter", textf("Clicks: %d", count));
}

button(text("Increment"), on_click(increment));
```

### Custom events

`action(name, fn)` is the generic form behind every `on_*` helper. The `name` is
the bare DOM event name; the rendered attribute is `on` followed by the
capitalized name. Use it for events without a dedicated helper:

```c
div_(action("pointerdown", handler))
```

You can also pass a handler under a non-standard name to your own JavaScript that
calls `Bride.dispatch(n)`.

> **Handlers do not receive the DOM event.** The runtime provides no way to read
> the event or the current DOM values. Keep state in the module and re-render.

## Mixing children and fields

Children and fields can be interleaved freely. This is valid:

```c
ui(
    form(
        method("post"),
        form_action("/subscribe"),
        label(for_("email"), text("Email")),
        input(type("email"), name("email"), placeholder("you@example.com"), required()),
        br(),
        button(type("submit"), on_click(handler), text("Send"))
    )
);
```

Fields are collected per element regardless of position, so `input(type("email"),
placeholder("x"))` and `input(placeholder("x"), type("email"))` both render
`<input type="email" placeholder="x">` (attributes are emitted in the order they
appear).

## Language mapping

The DSL surface is identical in every language; only namespacing and a few
keyword workarounds differ.

| Concept | C | C++ | C3 |
|---------|---|-----|----|
| Include / import | `#include "bride.h"` | `#include "bride.hpp"` | `import bride;` |
| Render to root | `ui(...)` | `bride::ui(...)` | `bride::ui(...)` |
| Render fragment | `change("#id", ...)` | `bride::change("#id", ...)` | `bride::change("#id", ...)` |
| Text | `text` / `textf` | `bride::text` / `bride::textf` | `bride::text` / `bride::textf` |
| Tags | `p(...)` | `bride::p(...)` | `bride::p(...)` |
| Class helper | `class(...)` | `bride::class_(...)` | `bride::class_(...)` |
| `var` tag | `var(...)` | `bride::var(...)` | `bride::var_(...)` |
| Handler type | `void (*)(void)` | `void (*)(void)` | `fn void()` |
| Entry point | `int main(void)` | `int main(void)` | `fn void main()` |

`div_`, `main_`, `time_`, `select_`, `map_`, and `template_` keep their trailing
underscore in every language. `var_` keeps it only in C3.

## JavaScript runtime API

The runtime is the `bride.js` module copied into `dist/` and imported by the
generated `main.js`:

```js
import { Bride } from "./bride.js";

await Bride.start({
    wasm: "./main.wasm",
    root: "#app"
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wasm` | `string` | — | URL/path of the WebAssembly module to load. |
| `root` | `string` | `"#app"` | CSS selector for the element that receives `commit` output. |

| Method | Description |
|--------|-------------|
| `Bride.start(options)` | Instantiates the module, wires the `commit`/`commit_at` imports, calls the WASI initializer, and runs the module's `_start`. Throws if `root` does not match an element or if the module exports no memory. |
| `Bride.dispatch(number)` | Calls the event handler registered under `number`. Used internally by generated `on*` attributes. |

See [Architecture](architecture.md) for the full lifecycle.

## Low-level primitives

The high-level DSL ultimately renders HTML strings and forwards them to two
imported functions. You can call them directly to build HTML yourself:

```c
// Imported from the runtime.
void commit(const char* html);
void commit_at(const char* query, const char* html);
```

| Function | Effect |
|----------|--------|
| `commit(html)` | Replaces the entire root element's `innerHTML`. |
| `commit_at(query, html)` | Replaces the `innerHTML` of the first element matching `query`. |

Both take NUL-terminated UTF-8 strings; the C wrappers pass `strlen(html)` as the
length. These are useful when generating dynamic HTML that is easier to build as
a string than as a macro tree:

```c
char html[256];
snprintf(html, sizeof(html), "<li>Item %d</li>", i);
commit_at("#list", html);
```

The C3 bindings expose the same two functions as `commit` / `commit_at`.
