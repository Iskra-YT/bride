# API reference

Bride ships a small HTML DSL. Elements are callable macros or functions that
accept **children** and **fields** (attributes and events) in any order. The
same API shape is available in every supported language, with language-specific
namespacing:

| Language | Import | Namespacing |
|----------|--------|-------------|
| C        | `#include "bride.h"` | Unqualified (`p`, `text`, `ui`, ...) |
| C++      | `#include "bride.hpp"` | `bride::` prefix (`bride::p`, `bride::ui`, ...) |
| C3       | `import bride;` | `bride::` prefix (`bride::p`, `bride::ui`, ...) |

## Rendering

| Function | Description |
|----------|-------------|
| `ui(...)` | Renders the given tree and commits it to the root element set in `Bride.start({ root })`. |
| `change(query, ...)` | Renders the given tree and replaces the `innerHTML` of the first element matching the CSS `query`. |

In C and C++ these are macros (`ui(...)`, `change(query, ...)`); in C3 they are
macros as well (`bride::ui(...)`, `bride::change(query, ...)`).

```c
ui(
    h1(text("Hello")),
    p(text("Welcome to Bride."))
);

change("#counter", textf("Clicks: %d", count));
```

## Text

| Function | Description |
|----------|-------------|
| `text(value)` | A text node with the given string. |
| `textf(format, ...)` | A formatted text node (`printf`-style in C/C++; C3 string formatting in C3). |

## Tags

`p`, `div_`, `span`, `a`, `button`, `fragment`, headings `h1`–`h6`,
text semantics `strong`, `em`, `b`, `i`, `u`, `s`, `small`, `mark`, `code`,
`pre`, `kbd`, `samp`, `var`, `cite`, `abbr`, `q`, `sub`, `sup`, `blockquote`,
`address`, `time_`, `del`, `ins`, `br`, `hr`, `wbr`,
sectioning `header`, `footer`, `main_`, `nav`, `aside`, `section`, `article`,
`figure`, `figcaption`, `ul`, `ol`, `li`, `dl`, `dt`, `dd`, `details`,
`summary`, `dialog`,
tables `table`, `caption`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`,
`colgroup`, `col`,
embedded `img`, `picture`, `source`, `track`, `video`, `audio`, `canvas`,
`iframe`, `embed`, `object`, `map_`, `area`,
forms `form`, `label`, `input`, `textarea`, `select_`, `option`, `optgroup`,
`fieldset`, `legend`, `datalist`, `output`, `progress`, `meter`,
and `template_`, `slot`.

Void elements (`br`, `hr`, `wbr`, `col`, `img`, `source`, `track`, `embed`,
`area`, `input`) take no children.

> Names ending in `_` avoid clashes with language keywords or libc functions:
> `div_`, `main_`, `time_`, `select_`, `map_`, `template_`, and `var_` in C3.

## Fields — attributes

Attribute helpers take a value:

`href`, `src`, `alt`, `title`, `type`, `name`, `value`, `placeholder`, `for_`,
`style`, `target`, `rel`, `role`, `width`, `height`, `tabindex`,
`autocomplete`, `accept`, `min`, `max`, `step`, `pattern`, `rows`, `cols`,
`method`, `form_action`, `enctype`, `loading`, `download`.

Plus the generic helpers:

| Helper | Description |
|--------|-------------|
| `attr(name, value)` | Sets any attribute. |
| `id(name)` | Shorthand for `attr("id", name)`. |
| `class(name)` / `class_(name)` | Shorthand for `attr("class", name)`. In C++ and C3 use `class_`. |

Boolean helpers take no value:
`disabled`, `checked`, `selected`, `required`, `readonly`, `multiple`,
`autofocus`, `hidden`.

## Fields — events

Event helpers accept a handler and are dispatched through the JS runtime:

`on_click`, `on_input`, `on_change`, `on_submit`, `on_focus`, `on_blur`,
`on_keydown`, `on_keyup`, `on_keypress`, `on_dblclick`, `on_mousedown`,
`on_mouseup`, `on_mouseover`, `on_mouseout`, `on_mousemove`, `on_scroll`,
`on_load`, `on_contextmenu`, `on_wheel`.

A handler is a plain function with no arguments and no return value
(`void (*)(void)` in C/C++, `fn void()` in C3). Each handler is registered in a
dispatch table; the rendered attribute calls `Bride.dispatch(n)` in the browser.

```c
void increment(void) {
    count++;
    change("#counter", textf("Clicks: %d", count));
}

button(text("Increment"), on_click(increment));
```

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

## JavaScript runtime API

The runtime is imported by the generated `main.js`:

```js
import { Bride } from "./bride.js";

await Bride.start({
    wasm: "./main.wasm",
    root: "#app"
});
```

| Option | Default | Description |
|--------|---------|-------------|
| `wasm` | — | Path to the WASM module. |
| `root` | `"#app"` | CSS selector for the element that receives `commit` output. |

| Method | Description |
|--------|-------------|
| `Bride.start(options)` | Instantiates the module, wires the `commit`/`commit_at` imports, and runs the WASM start function. |
| `Bride.dispatch(number)` | Calls a registered event handler. Used internally by generated attributes. |

## Low-level primitives

The high-level DSL renders HTML strings and forwards them to two imported
functions. You can call them directly if you build trees manually:

```c
void commit(const char* html);
void commit_at(const char* query, const char* html);
```

- `commit(html)` replaces the entire root element's `innerHTML`.
- `commit_at(query, html)` replaces the `innerHTML` of the first element that
  matches `query`.
