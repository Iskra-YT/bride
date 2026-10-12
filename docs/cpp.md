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
npm install bride
npx bride new cpp
```

This copies `template/cpp/` into the current directory. `package.json` must
contain `"language": "cpp"`.

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
