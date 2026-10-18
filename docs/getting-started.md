# Getting started

This guide walks you through creating, building, and running a Bride project.
The workflow is the same for every supported language — you only change the
`language` value and the source files.

## Prerequisites

- **Node.js 18 or newer** — required for the Bride CLI and runtime.
- **Emscripten SDK** — provides `emcc`, `em++`, and `emar`. Required for every
  language.

Language-specific requirements:

| Language | Extra toolchain |
|----------|-----------------|
| C        | Emscripten only |
| C++      | Emscripten only |
| C3       | Emscripten **and** the C3 compiler (`c3c`) |
| Zig      | Emscripten **and** the Zig compiler (`zig`) |

## Create a project

Install Bride, then scaffold a project into the current directory with
`bride new <language>`:

```sh
mkdir my-app
cd my-app

npm install bride-cli

npx bride new c
```

Replace `c` with `cpp`, `c3`, or `zig` for those languages. If you omit the
language, C is used by default.

`bride new` copies the shared base from `template/_common/` (`index.html`,
`main.js`, `src/.gitkeep`) plus the language files from `template/<language>/`
into the current directory, then generates `package.json` and the merged
`.gitignore`.

## Project layout

A freshly scaffolded project looks like this:

```
my-app/
├── .gitignore         # Ignores the build output
├── index.html         # Page that hosts the app (contains <main id="app">)
├── main.js            # Loads the WASM module through the Bride runtime
├── src/
│   └── main.c         # Your app source (main.cpp / main.c3 / main.zig also possible)
├── package.json       # Filled in by `bride new`, must contain the "language" field
└── dist/              # Build output (created by `bride build`)
```

The `language` field in `package.json` tells the CLI which toolchain to use.
`bride new` generates the file, so the `bride-cli` range always matches the
version that scaffolded the project:

```json
{
  "name": "bride-app",
  "version": "0.1.0",
  "language": "c",
  "private": true,
  "dependencies": {
    "bride-cli": "^1.2.0"
  }
}
```

## Build

```sh
npx bride build
```

The build:

1. Compiles the shared Bride library (`libbride.a`).
2. Compiles your sources from `src/` into `dist/main.wasm`.
3. Copies the runtime, WASI shim, `index.html`, `main.js`, and `css/` into
   `dist/`.

Everything the browser needs ends up in `dist/`.

## Develop

```sh
npx bride dev
```

This builds the project, starts a static server at
`http://localhost:9876`, and watches `src/` for changes. When a `.c`, `.h`,
`.c3`, or `.zig` file changes, Bride rebuilds and reloads the browser
automatically.

If your app uses the [router](api-reference.md#routing), the dev server also
serves `index.html` for unknown paths, so deep links like `/about` work on a
full refresh.

## Deploy

`dist/` is a plain static bundle. Upload its contents to any static host or
serve it behind any web server. No server-side runtime is required.

## Next steps

- Read the [API reference](api-reference.md) for the full DSL.
- Pick your language guide: [C](c.md), [C++](cpp.md), [C3](c3.md), or
  [Zig](zig.md).
