# Using Bride in C++

C++ support is a thin, header-only layer on top of the C library. Everything
lives in the `bride` namespace.

## Requirements

- Node.js 18+
- Emscripten SDK (`em++`, `emcc`, `emar`)

## Create a project

```sh
mkdir my-app
cd my-app
npm install bride-cli
npx bride new cpp
```

This copies `template/_common/` and `template/cpp/` into the current directory
and writes a `package.json` with `"language": "cpp"`.

## Include the header

```cpp
#include "bride.hpp"
```

`bride.hpp` includes the C header and re-exports its API in the `bride`
namespace. The build automatically adds both `lib/c` and `lib/cpp` to the
include path.

## Namespacing

Tag macros are prefixed with `bride::`:

```cpp
bride::p
bride::div_
bride::button
```

Functions and helpers are accessed the same way:

```cpp
bride::text
bride::textf
bride::id
bride::class_
bride::on_click
bride::ui
bride::change
```

Because C++ has a `class` keyword, the class helper is `class_` (not `class`).

## A complete example

`src/main.cpp`:

```cpp
#include "bride.hpp"

int count = 0;

void increment(void) {
    count++;
    bride::change("#counter", bride::textf("Clicks: %d", count));
}

int main(void) {
    bride::ui(
        bride::p(
            bride::id("counter"),
            bride::textf("Clicks: %d", count)
        ),
        bride::button(
            bride::text("Increment"),
            bride::on_click(increment)
        )
    );

    return 0;
}
```

Event handlers are plain `void (*)(void)` functions, exactly as in C.

## Routing

`bride::route(path, page)` registers a page handler that the runtime renders
when the URL matches:

```cpp
void home(void) {
    bride::ui(bride::h1(bride::text("Home")));
}

void about(void) {
    bride::ui(bride::h1(bride::text("About")));
}

int main(void) {
    bride::route("/", home);
    bride::route("/about", about);
    return 0;
}
```

Use `bride::navigate(path)` to change pages from code. See
[Routing](api-reference.md#routing) for matching rules and details.

## References

When an element must be updated later but you don't want to manage ids by hand,
use `bride::ref`. Declare a reference initialized to `EMPTY_REF` and pass its
address inside the tag:

```cpp
#include "bride.hpp"

int count = 0;

bride::BrideRef counter = EMPTY_REF;

void increment(void) {
    count++;
    bride::change(counter, bride::textf("Clicks: %d", count));
}

void main_page(void) {
    bride::ui(
        bride::p(
            bride::ref(&counter),     // renders <p id="1"> and sets counter to "#1"
            bride::textf("Clicks: %d", count)
        ),
        bride::button(
            bride::text("Increment"),
            bride::on_click(increment)
        )
    );
}
```

`bride::ref` writes a ready-made CSS selector (`"#1"`, `"#2"`, ...) into the
reference, so you can pass it straight to `bride::change`, `bride::append`, or
`bride::add_at`:

```cpp
bride::append(counter, bride::text("Extra text"));
```

- The element itself receives the bare id (`id="1"`); the reference holds the
  selector form (`"#1"`).
- Every call to `bride::ref` allocates a **new** id and updates the variable. A
  handler that re-renders with `bride::ref` again moves the element to a
  different id — the reference then points at the newest one, so read it after
  rendering.
- Generated ids are plain decimal numbers (`"1"`, `"2"`, ...). Use
  `bride::id("custom")` when you want a readable, hand-picked id.

## Styling

`bride::style(...)` builds a reusable class and `bride::apply(...)` puts it on an
element:

```cpp
bride::BrideStyle button_style = bride::style(
    bride::padding(12, "px"),
    bride::background("#1e1e2e"),
    bride::color("#cdd6f4")
);

bride::ui(
    bride::button(
        bride::text("Click me"),
        bride::apply(button_style)
    )
);
```

The declarations are compiled into a rule that is injected into `<head>` once,
and `apply` renders the matching class (`class="bride-style-1"`). Use
`bride::style("...")` for an inline `style` attribute and
`bride::style_file("css/style.css")` for a stylesheet link. See
[Styling](api-reference.md#styling) for the full list of declarations.

## Build and run

```sh
npx bride build   # build libbride.a, then compile src/*.cpp to dist/main.wasm
npx bride dev     # serve at http://localhost:9876
```

Only files with the `.cpp` extension in `src/` are compiled.

## Notes and conventions

- Names ending in `_` avoid clashes with keywords: `div_`, `main_`, `time_`,
  `select_`, `map_`, `template_`.
- Children and fields can appear in any order inside a tag.

See the [API reference](api-reference.md) for every tag, attribute, and event.
