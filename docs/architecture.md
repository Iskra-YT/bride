# Architecture

This document explains how a Bride application works end to end: how the
WebAssembly module talks to the browser, how HTML is produced, how events flow
back into your code, and how the build is assembled.

## Big picture

```
┌───────────────────────────── browser ─────────────────────────────┐
│                                                                   │
│   index.html ──▶ main.js ──▶ runtime/bride.js (Bride)             │
│                                    │                              │
│                                    ▼                              │
│                          WebAssembly.instantiate                  │
│                                    │                              │
│         ┌──────────────────────────┴───────────────────────┐      │
│         │                 main.wasm                         │      │
│         │                                                   │      │
│         │   your code ──▶ Bride DSL ──▶ HTML string          │      │
│         │        ▲                                │          │      │
│         │        │                                ▼          │      │
│         │   dispatch(n)               commit / commit_at      │      │
│         └────────┬───────────────────────────────┬──────────┘      │
│                  │ imports (env)                 │ exports         │
│                  ▼                               ▼                  │
│           Bride.dispatch(n)          innerHTML assignment          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

The module never touches the DOM directly. It **produces HTML strings** and
hands them to the JavaScript runtime, which assigns them to the DOM. User
interaction travels back as a small integer into a dispatch table.

## The module interface

A Bride WebAssembly module is a normal Emscripten module with a small,
well-defined contract.

### Imports

| Module | Import | Signature | Provided by |
|--------|--------|-----------|-------------|
| `env` | `commit` | `(ptr: i32, len: i32) => void` | Bride runtime |
| `env` | `commit_at` | `(queryPtr: i32, queryLen: i32, htmlPtr: i32, htmlLen: i32) => void` | Bride runtime |
| `wasi_snapshot_preview1` | (many) | — | `@bjorn3/browser_wasi_shim` |

`commit` receives a pointer and length into the module's linear memory. The
runtime decodes that byte range as UTF-8 and assigns it to the root element's
`innerHTML`.

`commit_at` receives two such ranges: a CSS `query` and the `html` to insert.
It assigns the HTML to the `innerHTML` of the **first** element matching the
query, and does nothing if there is no match.

### Exports

| Export | Signature | Purpose |
|--------|-----------|---------|
| `memory` | `WebAssembly.Memory` | Required. The runtime refuses to start without it. |
| `_start` | `() => void` | The program entry point. Called once after instantiation. |
| `dispatch` | `(n: i32) => void` | Invokes the event handler registered under key `n`. |

`dispatch` is exported because the generated HTML calls back into it (see
[Event dispatch](#event-dispatch)).

## Runtime lifecycle

The runtime lives in [`runtime/`](../runtime). The generated `main.js` imports
it and starts the module:

```js
import { Bride } from "./bride.js";

await Bride.start({
    wasm: "./main.wasm",   // path to the module
    root: "#app"           // CSS selector for the commit target (default "#app")
});
```

`Bride.start(options)` then:

1. Stores itself as `window.Bride`, refusing to initialize twice.
2. Resolves `root` with `document.querySelector`. It throws if the element is
   missing.
3. Fetches and instantiates the module via
   `WebAssembly.instantiateStreaming`, wiring the `env` imports to small
   callbacks (`runtime/wasm.js`). A fresh WASI context is created and its
   `wasi_snapshot_preview1` imports are exposed; it is initialized with the
   instance so memory-based calls work.
4. Captures `instance.exports.memory` and throws if it is absent.
5. Calls `instance.exports._start()` if present, treating the Emscripten
   `"exit with exit code 0"` error as a normal exit.

`Bride.dispatch(number)` forwards to `instance.exports.dispatch(number)`. It is
what the generated `on*` attributes call.

### Passing strings

WebAssembly and JavaScript share only linear memory. Strings cross the boundary
as a **pointer plus a byte length**; the runtime decodes them with
`wasmString(memory, ptr, len)` using a UTF-8 `TextDecoder`. The C side supplies
the length with `strlen`, so Bride strings are UTF-8 with no embedded NUL bytes.

## HTML rendering

The high-level DSL is implemented in C under [`lib/c/`](../lib/c). Rendering
proceeds in three stages:

1. **Build a tree.** Each tag macro (`p(...)`, `button(...)`, ...) collects its
   arguments into an `HtmlTag` node. Every argument is a `BrideArg` tagged as
   either `BRIDE_HTML` (a child node), `BRIDE_ATTR` (an attribute), or
   `BRIDE_END` (the terminator appended by the macro). Children and attributes
   are pushed into separate dynamic arrays, which is why they may be interleaved
   in any order.
2. **Serialize.** `repr_html_tag` walks the tree with a per-tag dispatch table
   and produces a single HTML string in a growable buffer.
3. **Commit.** `ui(...)` renders a fragment and calls `commit`; `change(query,
   ...)` renders a fragment and calls `commit_at`. The rendered string is freed
   immediately afterwards.

Because the whole tree is rebuilt and serialized on every render, each `ui` or
`change` call replaces the affected DOM subtree wholesale. There is no diffing.

### Tag kinds

The single source of truth for tags is
[`lib/c/bride/html/tags.def`](../lib/c/bride/html/tags.def). Each entry has a
kind that determines how it renders:

| Kind | Renders as | Examples |
|------|-----------|----------|
| `ELEMENT` | `<name ...>children</name>` | `p`, `div_`, `ul` |
| `VOID` | `<name ...>` (no children, no closing tag) | `br`, `img`, `input` |
| `FRAGMENT` | children only, no wrapper element | `fragment`, and the implicit root of `ui`/`change` |
| `TEXT` | a raw text node | `text`, `textf` |

`tags.def` is preprocessed to generate the tag builders, the C++ re-exports, and
the C3 bindings, so adding a tag is a one-line change there.

> **Escaping.** Bride emits text and attribute values verbatim — it does **not**
> HTML-escape them. Escape untrusted input yourself, or avoid interpolating
> strings that can contain `<`, `>`, `&`, or quotes.

## Event dispatch

Event helpers such as `on_click(fn)` register a handler and bake a call into the
rendered attribute:

1. `action(name, fn)` (the generic helper behind every `on_*`) calls
   `create_dispatch(fn)`, which stores the function pointer in a global map and
   returns an increasing integer key.
2. The attribute is rendered as, for example,
   `onClick="Bride.dispatch(3)"`. The event name is derived from the argument
   (`on_click` → `click` → `onClick`).
3. When the event fires, the browser evaluates the inline attribute, which calls
   `Bride.dispatch(3)`.
4. The runtime calls `instance.exports.dispatch(3)`, which looks up the handler
   in the map and invokes it.

Handlers are plain `void (*)(void)` functions with no arguments and no return
value. They cannot receive the DOM event. The dispatch table is initialized once
on first use and lives for the lifetime of the module.

> **No DOM reads.** The runtime only provides `commit` and `commit_at`; there is
> no import that reads values back out of the DOM. Handlers observe an event but
> cannot, for example, read the current text of an `<input>`. Keep the source of
> truth in the module's own state and re-render from it. Native form submission
> still works because the browser handles it.

## Build pipeline

`bride build` ([`bin/build.js`](../bin/build.js)) orchestrates the toolchain:

```
package.json (language, src)
        │
        ▼
compileDotA()  ──▶  dist/lib/libbride.a        (shared Bride runtime, C)
        │
        ▼
compile<Lang>() ──▶ dist/main.wasm             (your code + libbride.a)
        │
        ▼
copyData()      ──▶  dist/                     (runtime, WASI, assets, licenses)
        │
        ▼
rm dist/lib                                    (leave only browser-ready files)
```

The language-specific compile steps are described in the
[CLI reference](cli.md#language-specific-compile-steps). Notably, C3 sources are
compiled by `c3c` to object files and then linked by `emcc` together with a
small generated entry shim that maps Emscripten's `__main_argc_argv` onto the C3
`main`.

## Source layout

| Path | Role |
|------|------|
| `bin/bride.js` | CLI entry point and dev server. |
| `bin/new.js` | Template copy for `bride new`. |
| `bin/build.js` | Build orchestration and asset copying. |
| `bin/compile.js` | Per-language compile steps and `libbride.a`. |
| `bin/utils.js` | Toolchain detection and file helpers. |
| `node_modules/@bjorn3/browser_wasi_shim` | WASI implementation copied into `dist/wasi/`. |
| `runtime/bride.js` | The `Bride` object: `start` and `dispatch`. |
| `runtime/wasm.js` | Module loading and string decoding. |
| `lib/c/bride/js.*` | `commit` / `commit_at` wrappers over the imports. |
| `lib/c/bride/dispatch.c` | The dispatch table. |
| `lib/c/bride/html/` | Tag model, `tags.def`, and the serializer. |
| `lib/c/bride/bhlm.*` | The high-level DSL macros and helpers. |
| `lib/cpp/` | Header-only C++ re-export of the C API in `namespace bride`. |
| `lib/bride.c3` | Native C3 bindings. |
| `template/<language>/` | Starter projects copied by `bride new`. |

## See also

- [CLI reference](cli.md) — commands and build details.
- [API reference](api-reference.md) — the full DSL surface.
- [Tutorials](tutorials.md) — complete, runnable examples.
