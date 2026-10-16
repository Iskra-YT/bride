# Using Bride in C

C is the reference language for Bride. The high-level DSL is implemented in C
and the C header is what C++, C3, and Zig build on top of.

## Requirements

- Node.js 18+
- Emscripten SDK (`emcc`, `emar`)

## Create a project

```sh
mkdir my-app
cd my-app
npm install bride-cli
npx bride new c
```

This copies `template/c/` into the current directory. `package.json` must
contain `"language": "c"`.

## Include the header

```c
#include "bride.h"
```

`bride.h` pulls in the imported WASM functions (`commit`, `commit_at`,
`add_at`), the low-level types (`BrideArg`), and the high-level DSL (`ui`,
`change`, `append`, `text`, `textf`, tag and field helpers).

You do not need to configure include paths manually: `bride build` adds the
Bride `lib/c` directory to the compiler include path and links the compiled
library for you.

## A complete example

`src/main.c`:

```c
#include "bride.h"

int count = 0;

void increment(void) {
    count++;
    change("#counter", textf("Clicks: %d", count));
}

int main(void) {
    ui(
        p(
            id("counter"),
            textf("Clicks: %d", count)
        ),
        button(
            text("Increment"),
            on_click(increment)
        )
    );

    return 0;
}
```

What happens:

1. `#include "bride.h"` brings in the DSL.
2. `increment` is a plain `void (*)(void)` handler.
3. `ui(...)` renders the tree and commits it to the root element.
4. Clicking the button calls `Bride.dispatch(n)`, which invokes `increment`.
5. `change("#counter", ...)` re-renders only the `#counter` element.

## Routing

`route(path, fn)` registers a page handler that the runtime renders when the URL
matches. Handlers are ordinary `void (*)(void)` functions:

```c
void main_page(void) {
    ui(h1(text("Home")));
}

void about_page(void) {
    ui(h1(text("About")));
}

int main(void) {
    route("/", main_page);
    route("/about", about_page);
    return 0;
}
```

Use `navigate(path)` to change pages from code. Same-origin `<a href>` links are
intercepted automatically, so navigation never reloads the page. See
[Routing](api-reference.md#routing) for matching rules and details.

## References

When an element must be updated later but you don't want to manage ids by hand,
use `ref`. Declare a reference initialized to `EMPTY_REF` and pass its address
inside the tag:

```c
#include "bride.h"

int count = 0;

BrideRef counter = EMPTY_REF;

void increment(void) {
    count++;
    change(counter, textf("Clicks: %d", count));
}

void main_page(void) {
    ui(
        p(
            ref(&counter),      // renders <p id="1"> and sets counter to "#1"
            textf("Clicks: %d", count)
        ),
        button(
            text("Increment"),
            on_click(increment)
        )
    );
}
```

`ref` writes a ready-made CSS selector (`"#1"`, `"#2"`, ...) into the reference,
so you can pass it straight to `change`, `append`, or `add_at`:

```c
append(counter, text("Extra text"));
```

- The element itself receives the bare id (`id="1"`); the reference holds the
  selector form (`"#1"`).
- Every call to `ref` allocates a **new** id and updates the variable. A handler
  that re-renders with `ref` again moves the element to a different id — the
  reference then points at the newest one, so read it after rendering.
- Generated ids are plain decimal numbers (`"1"`, `"2"`, ...). Use
  `id("custom")` when you want a readable, hand-picked id.

## Styling

`style(...)` builds a reusable class and `apply(...)` puts it on an element:

```c
BrideStyle button_style = style(
    padding(12, "px"),
    background("#1e1e2e"),
    color("#cdd6f4")
);

ui(
    button(
        text("Click me"),
        apply(button_style)
    )
);
```

The declarations are compiled into a rule that is injected into `<head>` once,
and `apply` renders the matching class (`class="bride-style-1"`). Use
`style("...")` for an inline `style` attribute and `style_file("css/style.css")`
for a stylesheet link. See [Styling](api-reference.md#styling) for the full list
of declarations.

## Build and run

```sh
npx bride build   # produce dist/
npx bride dev     # serve at http://localhost:9876 with live reload
```

## Notes and conventions

- `class` is available as `class(...)` in C (and as `class_` in C++/C3). It maps
  to the HTML `class` attribute.
- Names ending in `_` avoid clashes with keywords or libc: `div_`, `main_`,
  `time_`, `select_`, `map_`, `template_`.
- Children and fields can appear in any order inside a tag.

See the [API reference](api-reference.md) for every tag, attribute, and event.
