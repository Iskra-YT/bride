# Bride

Bride is the runtime bridge between WebAssembly and the Web. 

**Main idea**: Any language can be a web language.

## Supported Languages

| Language | Supported | Documentation            |
|----------|-----------|--------------------------|
| C        | Yes       | [docs/c.md](docs/c.md)   |
| C++      | Yes       | [docs/cpp.md](docs/cpp.md) |
| C3       | Yes       | [docs/c3.md](docs/c3.md) |
| Zig      | Yes       | [docs/zig.md](docs/zig.md) |
| Go       | No        | —                        |
| Kotlin   | No        | —                        |
| Rust     | No        | —                        |

A language is **supported only if** all three of the following are true:

1. **It has basic documentation** — a guide for it lives in `docs/`.
2. **It has a ported library** — bindings exist under `lib/<language>/`.
3. **It has an active compiler** — a working toolchain integration exists in the CLI.

If any of these is missing, the language is considered *in progress* or
*unsupported*. See [Adding a language](docs/adding-a-language.md) for the full
criteria and how to port Bride to a new language.

If you want to add a language not listed above, please submit a pull request or
create an issue.

## Documentation

Full documentation lives in [`docs/`](docs/README.md):

- [Getting started](docs/getting-started.md)
- [CLI reference](docs/cli.md)
- [API reference](docs/api-reference.md)
- [Architecture](docs/architecture.md)
- [Tutorials](docs/tutorials.md)
- [Styling with CSS](docs/api-reference.md#styling)
- Language guides: [C](docs/c.md), [C++](docs/cpp.md), [C3](docs/c3.md), [Zig](docs/zig.md)
- [Adding a language](docs/adding-a-language.md)

## How to use

Create a project and build it with the Bride CLI:

```sh
mkdir my-app && cd my-app
npm install bride-cli
npx bride new c       # c | cpp | c3 | zig
npx bride build       # output goes to dist/
npx bride dev         # serve at http://localhost:9876 with live reload
```

At runtime, load the compiled module from JavaScript:

```js
import { Bride } from "./bride.js";

await Bride.start({
    wasm: "./main.wasm",
    root: "#app",
    onError: error => console.error(error)
});
```

The WASM module is loaded and executed, and the HTML element matching `root`
(default `#app`) becomes the application root. When startup fails (missing
`root`, a failed module load, no exported memory, or an already-initialized
runtime), `onError` is called with the `Error` and startup stops; it defaults to
`console.error`.

## Tags & fields

Bride ships a small HTML DSL. Elements are callable macros/functions that accept
children and fields (attributes/events) in any order:

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

### Tags

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

### Fields

Attribute helpers: `href`, `src`, `alt`, `title`, `type`, `name`, `value`,
`placeholder`, `for_`, `target`, `rel`, `role`, `width`, `height`,
`tabindex`, `autocomplete`, `accept`, `min`, `max`, `step`, `pattern`, `rows`,
`cols`, `method`, `form_action`, `enctype`, `loading`, `download`, plus the
generic `attr(name, value)`.

Styling: `style(declaration, ...)` builds a reusable style, `apply(style)` puts
its class on an element, `style("...")` sets an inline `style` attribute (in C3
and Zig: `style_attr("...")`), and `class(...)` / `class_("...")` sets classes.

Boolean helpers: `disabled`, `checked`, `selected`, `required`, `readonly`,
`multiple`, `autofocus`, `hidden`.

> Bride renders plain HTML, so styling is done with ordinary CSS — see
> [Styling](docs/api-reference.md#styling) for reusable styles, inline styles,
> class helpers, and `style_file` stylesheet links.

Event helpers: `on_click`, `on_input`, `on_change`, `on_submit`, `on_focus`,
`on_blur`, `on_keydown`, `on_keyup`, `on_keypress`, `on_dblclick`,
`on_mousedown`, `on_mouseup`, `on_mouseover`, `on_mouseout`, `on_mousemove`,
`on_scroll`, `on_load`, `on_contextmenu`, `on_wheel`.

> Names ending in `_` avoid clashes with language keywords or libc functions:
> `div_`, `main_`, `time_`, `select_`, `map_`, `template_` (and `var_` in C3
> and Zig; the attribute `type` is `type_` in Zig).

## Routing

Bride includes an optional client-side router. Register page handlers with
`route(path, fn)`; the runtime renders the handler whose path matches the
current URL and intercepts same-origin `<a href>` links for instant navigation.

```c
#include "bride.h"

void home(void) {
    ui(
        h1(text("Home")),
        a(href("/about"), text("About"))
    );
}

void about(void) {
    ui(h1(text("About")));
}

int main(void) {
    route("/", home);
    route("/about", about);
    route("*", not_found);   // optional catch-all
}
```

Call `navigate("/about")` to change pages from code. Matching ignores the query
string and trailing slashes, and exact routes win over wildcards. The router is
History-API based, so `bride dev` serves `index.html` for unknown paths to make
deep links work.

---

> Let's Compile the Web.