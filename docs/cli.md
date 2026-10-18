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
| [`bride create`](#bride-create) | Scaffold a new project into a new directory. |
| [`bride build`](#bride-build) | Compile the project into `dist/`. |
| [`bride dev`](#bride-dev) | Build, serve, and live-reload while you edit (`--port`, `--host`). |

Running `bride` with no command (or an unknown command) prints the usage summary
and exits.

---

## `bride create`

```sh
bride create <name> [--lang <language>]
```

Creates a new directory `<name>`, copies the shared files from
`template/_common/` and the language files from `template/<language>/` into it,
then generates `package.json` (the `--lang` value, and a `bride-cli` range
pinned to the running CLI version) and writes the merged `.gitignore`. If
`--lang` is omitted it defaults to `c`. Both option spellings are accepted:
`--lang c` and `--lang=c`.

| Language | `--lang` value | Extra toolchain besides Emscripten |
|----------|----------------|------------------------------------|
| C        | `c`            | — |
| C++      | `cpp`          | — |
| C3       | `c3`           | `c3c` |
| Zig      | `zig`          | `zig` |

```sh
npx bride create my-app --lang c
cd my-app
```

The command fails when:

- `<name>` is missing;
- `--lang` is not one of the available templates (the error lists the available
  languages);
- the target directory already exists and is not empty;
- `--lang` is given without a value, or an unknown option is passed.

When in doubt, omit `--lang` to get C.

## `bride build`

```sh
bride build
```

Compiles the project in the current directory into `dist/`. The build is driven
entirely by `package.json`:

| Field | Required | Default | Meaning |
|-------|----------|---------|---------|
| `language` | **yes** | — | Which toolchain to use: `c`, `cpp`, `c3`, or `zig`. |
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
| `zig` | `zig`, `emcc` | `zig build-obj` compiles `src/**` together with a small generated Zig entry point into a wasm object, which is linked with `libbride.a` into `dist/main.wasm`. |

Source files are discovered **recursively**. Only the extension listed above is
picked up — headers are not compiled on their own, they are pulled in through
`#include`.

The build throws a clear error when:

- `package.json` has no `language` field.
- the required compiler is not on `PATH` (`emcc`, `em++`, `c3c`, or `zig`);
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
├── css/                   # copied from the project root (when present)
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

- Serves `dist/` at `http://<host>:<port>` (defaults: `localhost:9876`). `/`
  maps to `dist/index.html`.
- Serves `.html`, `.js`, `.mjs`, `.wasm`, `.css`, `.json`, `.map`,
  `.webmanifest`, `.txt`, `.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`,
  `.avif`, `.ico`, `.woff`, `.woff2`, `.ttf`, `.otf`, `.mp4`, `.webm`, `.mp3`,
  and `.ogg` with the correct `Content-Type`; anything else is sent as
  `application/octet-stream`.
- Injects a small live-reload `<script>` before `</body>` of every HTML
  response, connected to the server over a WebSocket.
- Watches `src/` **recursively**. When a `.c`, `.h`, `.cpp`, `.hpp`, `.c3`, or
  `.zig` file changes, it rebuilds and tells every connected browser to reload.

Rebuilds are serialized: if a change arrives while a build is running, one more
build is queued and run afterwards. A failed rebuild is logged and does not stop
the server.

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--port <port>` | `9876` | Port to listen on (1–65535). |
| `--host <host>` | `localhost` | Interface to bind to; use `0.0.0.0` to expose the server on the network. |

Both spellings are accepted: `--port 3000` and `--port=3000`. An invalid port or
an unknown option aborts with an error before anything is built.

---

## Typical workflow

```sh
npm install bride-cli
npx bride create my-app --lang c   # or cpp / c3 / zig
cd my-app
npx bride build          # one-off production build into dist/
npx bride dev            # local development on http://localhost:9876
```

`dist/` is a plain static bundle. Deploy it to any static host — no server-side
runtime is required.

## Smoke testing the package

`tests/smoke/` checks the package the way a user consumes it: `npm pack`, install
the tarball into an empty directory, `bride create app --lang <language>`,
`bride build`, and then run the result.

```sh
npm run smoke                  # C, executed in Node.js
npm run smoke -- --lang cpp    # a different language: c, cpp, c3 or zig
npm run smoke -- --browser     # also open the built app in Chromium
```

Everything happens in a throw-away directory, so the repository is left as it
was. Emscripten (and `c3c` for C3, `zig` for Zig) has to be on `PATH`.

| Step | What is verified |
|------|------------------|
| `npm pack` | the tarball is created, and the installed CLI is that tarball |
| `npm install <tarball>` | the published package pulls in its own dependencies |
| `bride create app --lang <language>` | every language template scaffolds a project |
| `bride build` | the build succeeds and produces the documented output |
| `run-app.mjs` | the built app renders, routes and handles clicks without errors |
| `browser.mjs` | the same in Chromium, with no console or page errors |

This runs in CI for every supported language
([`.github/workflows/smoke.yml`](../.github/workflows/smoke.yml)), and
[`.github/workflows/release.yml`](../.github/workflows/release.yml) publishes to
npm after a version tag.

## See also

- [Getting started](getting-started.md) — a guided walkthrough.
- [Architecture](architecture.md) — what happens under the hood.
- [Adding a language](adding-a-language.md) — wiring a new language into the CLI.
