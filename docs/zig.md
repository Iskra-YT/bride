# Using Bride in Zig

Zig support uses a native Zig binding module that wraps the C library. It needs
the Zig compiler in addition to Emscripten.

## Requirements

- Node.js 18+
- Emscripten SDK (`emcc`, `emar`)
- The Zig compiler (`zig`) on your `PATH`

Both `emcc` and `zig` are required: `bride build` first compiles the Zig sources
to a WebAssembly object with `zig build-obj`, then links it with Emscripten.

## Create a project

```sh
npm install bride-cli
npx bride create my-app --lang zig
cd my-app
```

This copies `template/_common/` and `template/zig/` into `my-app/`
and writes a `package.json` with `"language": "zig"`.

## Import the module

```zig
const bride = @import("bride");
```

Everything is accessed through the `bride.` prefix:

```zig
bride.ui
bride.change
bride.text
bride.textf
bride.p
bride.div_
bride.button
bride.on_click
```

## A complete example

`src/main.zig`:

```zig
const bride = @import("bride");

var count: usize = 0;

fn increment() void {
    count += 1;
    bride.change("#counter", bride.textf("Clicks: {d}", .{count}));
}

pub fn main() void {
    bride.ui(.{
        bride.p(.{
            bride.id("counter"),
            bride.textf("Clicks: {d}", .{count}),
        }),
        bride.button(.{
            bride.text("Increment"),
            bride.on_click(increment),
        }),
    });
}
```

Notes:

- The entry point is `pub fn main()`. It may return `void`, `!void`, or an
  integer; `bride build` generates the actual entry point that Emscripten calls
  and wires it to your `main`.
- Children and fields are passed in a tuple: `.({ ... })`. A single argument may
  also be passed without the tuple, e.g. `bride.h1(bride.text("Hi"))`.
- Event handlers are `fn () void` values and are passed directly, e.g.
  `increment`.
- `bride.textf` uses Zig's standard formatting (`{d}`, `{s}`, `{}`).
- In Zig, `var` is a keyword, so the tag is `bride.var_`. The `type` attribute is
  `bride.type_`.

## Routing

`bride.route(path, page)` registers a page handler that the runtime renders when
the URL matches. Handlers are `fn () void` values:

```zig
fn home() void {
    bride.ui(.{bride.h1(.{bride.text("Home")})});
}

fn about() void {
    bride.ui(.{bride.h1(.{bride.text("About")})});
}

pub fn main() void {
    bride.route("/", home);
    bride.route("/about", about);
}
```

Use `bride.navigate(path)` to change pages from code. See
[Routing](api-reference.md#routing) for matching rules and details.

## References

When an element must be updated later but you don't want to manage ids by hand,
use `bride.ref`. Declare a reference and pass its address inside the tag:

```zig
const bride = @import("bride");

var count: usize = 0;
var counter: bride.Ref = bride.EMPTY_REF;

fn increment() void {
    count += 1;
    bride.change(counter, bride.textf("Clicks: {d}", .{count}));
}

fn home_page() void {
    bride.ui(.{
        bride.p(.{
            bride.ref(&counter), // assigns a unique id and stores the selector
            bride.textf("Clicks: {d}", .{count}),
        }),
        bride.button(.{
            bride.text("Increment"),
            bride.on_click(increment),
        }),
    });
}
```

`bride.ref` writes a ready-made CSS selector (`"#1"`, `"#2"`, ...) into the
reference, so you can pass it straight to `bride.change` or `bride.append`:

```zig
bride.append(counter, bride.text("Extra text"));
```

`change` and `append` accept either a reference or a string selector.

- The element itself receives the bare id (`id="1"`); the reference holds the
  selector form (`"#1"`).
- Every call to `bride.ref` allocates a **new** id and updates the variable. A
  handler that re-renders with `bride.ref` again moves the element to a
  different id — the reference then points at the newest one, so read it after
  rendering.
- `bride.EMPTY_REF` marks a reference that has not been assigned yet.
- Generated ids are plain decimal numbers (`"1"`, `"2"`, ...). Use
  `bride.id("custom")` when you want a readable, hand-picked id.

## Styling

`bride.style(...)` builds a reusable class and `bride.apply(...)` puts it on an
element:

```zig
fn home_page() void {
    const counter_style = bride.style(.{
        bride.padding(12, "px"),
        bride.background("#1e1e2e"),
        bride.color("#cdd6f4"),
    });

    bride.ui(.{
        bride.button(.{
            bride.text("Click me"),
            bride.apply(counter_style),
        }),
    });
}
```

The declarations are compiled into a rule that is injected into `<head>` once,
and `apply` renders the matching class (`class="bride-style-1"`). Use
`bride.style_attr("...")` for an inline `style` attribute and
`bride.style_file("css/style.css")` for a stylesheet link. See
[Styling](api-reference.md#styling) for the full list of declarations.

## Build and run

```sh
npx bride build   # zig build-obj -> wasm object -> emcc link -> dist/main.wasm
npx bride dev     # serve at http://localhost:9876 with live reload
```

## Notes and conventions

- Names ending in `_` avoid Zig keywords or libc clashes: `div_`, `main_`,
  `time_`, `select_`, `map_`, `template_`, `var_`. The attribute `type` becomes
  `type_`.
- Children and fields can appear in any order inside a tag.
- Zig compiles the project entry file as a non-root `app` module and links it
  through a small generated Zig entry point, so `pub fn main()` never clashes
  with Emscripten's own `main` handling.

See the [API reference](api-reference.md) for every tag, attribute, and event.
