# CLI reference

The Bride CLI is the `bride` executable shipped with the
[`bride-cli`](https://www.npmjs.com/package/bride-cli) npm package. It scaffolds
projects, compiles them to WebAssembly, and serves them during development.

## Synopsis

```sh
bride <command> [arguments]
```

| Command | Purpose |
|---------|---------|
| [`bride new`](#bride-new) | Scaffold a new project from a template. |
| [`bride build`](#bride-build) | Compile the project into `dist/`. |
| [`bride dev`](#bride-dev) | Build, serve, and live-reload while you edit. |

Running `bride` with no command (or an unknown command) prints the usage summary
and exits.

---

## `bride new`

```sh
bride new [language]
```

Copies the matching template from `template/<language>/` into the **current
directory**. If `language` is omitted it defaults to `c`.

| Language | `language` value | Extra toolchain besides Emscripten |
|----------|------------------|------------------------------------|
| C        | `c`              | — |
| C++      | `cpp`            | — |
| C3       | `c3`             | `c3c` |

`bride new` copies into the current working directory, so create and enter the
target directory first:

```sh
mkdir my-app
cd my-app
npx bride new c
```

If the language has no template directory, the command fails with a file-system
error. When in doubt, scaffold without a language to get C.

## `bride build`

```sh
bride build
```

Compiles the project in the current directory into `dist/`. The build is driven
entirely by `package.json`:

| Field | Required | Default | Meaning |
|-------|----------|---------|---------|
| `language` | **yes** | — | Which toolchain to use: `c`, `cpp`, or `c3`. |
| `src` | no | `src` | Directory scanned for project sources. |

The build performs the following steps:

1. **Create `dist/`.**
2. **Build the shared library** — every `.c` file under `lib/c/` is compiled
   with `emcc -c` into `dist/lib/*.o`, then archived with `emar` into
   `dist/lib/libbride.a`.
3. **Compile the project sources** for the selected language (see below).
4. **Copy assets into `dist/`** — the JavaScript runtime (`runtime/`), the WASI
   shim, the license files, `index.html`, `main.js`, and `css/` (each only when
   present). A generated `THIRD-PARTY-LICENSES` file is also written.
5. **Clean up** — `dist/lib/` is removed so the output contains only what the
   browser needs.

### Language-specific compile steps

| Language | Toolchain | What happens |
|----------|-----------|--------------|
| `c`   | `emcc`, `emar` | Every `.c` file under `src/` is compiled and linked with `libbride.a` into `dist/main.wasm`. `lib/c` is added to the include path. |
| `cpp` | `em++`, `emcc`, `emar` | Every `.cpp` file under `src/` is compiled and linked with `libbride.a` into `dist/main.wasm`. Both `lib/c` and `lib/cpp` are added to the include path. |
| `c3`  | `c3c`, `emcc` | `c3c build` compiles `src/**` to object files under `dist/lib/obj/`, a small generated C entry shim is compiled with `emcc`, and everything is linked with `libbride.a` into `dist/main.wasm`. |

Source files are discovered **recursively**. Only the extension listed above is
picked up — headers are not compiled on their own, they are pulled in through
`#include`.

The build throws a clear error when:

- `package.json` has no `language` field.
- the required compiler is not on `PATH` (`emcc`, `em++`, or `c3c`);
- no matching source files are found under `src/`;
- (C3) `c3c` produced no object files, usually because `project.json` is not
  targeting `emscripten`.

### Output

A successful build produces:

```
dist/
├── main.wasm              # your compiled application
├── bride.js               # Bride runtime (imported by main.js)
├── wasm.js                # WebAssembly loader
├── wasi/                  # @bjorn3/browser_wasi_shim
├── index.html             # copied from the project root
├── main.js                # copied from the project root
├── css/                   # copied from the project root
└── license/
    ├── BRIDE-LICENSE
    ├── WASI-MIT
    └── WASI-APACHE
```

## `bride dev`

```sh
bride dev
```

Runs `bride build`, then starts a development server:

- Serves `dist/` at **http://localhost:9876**. `/` maps to `dist/index.html`.
- Serves `.html`, `.js`, `.wasm`, `.css`, `.json`, `.svg`, and `.png` with the
  correct `Content-Type`; anything else is sent as
  `application/octet-stream`.
- Injects a small live-reload `<script>` before `</body>` of every HTML
  response, connected to the server over a WebSocket.
- Watches `src/` **recursively**. When a `.c`, `.h`, or `.c3` file changes, it
  rebuilds and tells every connected browser to reload.

Rebuilds are serialized: if a change arrives while a build is running, one more
build is queued and run afterwards. A failed rebuild is logged and does not stop
the server.

There is no CLI flag to change the port; it is always `9876`.

---

## Typical workflow

```sh
mkdir my-app && cd my-app
npm install bride-cli
npx bride new c          # or cpp / c3
npx bride build          # one-off production build into dist/
npx bride dev            # local development on http://localhost:9876
```

`dist/` is a plain static bundle. Deploy it to any static host — no server-side
runtime is required.

## See also

- [Getting started](getting-started.md) — a guided walkthrough.
- [Architecture](architecture.md) — what happens under the hood.
- [Adding a language](adding-a-language.md) — wiring a new language into the CLI.
