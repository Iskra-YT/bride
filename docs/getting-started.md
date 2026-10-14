# Getting started

This guide walks you through creating, building, and running a Bride project.
The workflow is the same for every supported language — you only change the
`language` value and the source files.

## Prerequisites

- **Node.js 18 or newer** — required for the Bride CLI and runtime.
- **Emscripten SDK** — provides `emcc`, `em++`, and `emar`. Required for C,
  C++, and C3 projects.

Language-specific requirements:

| Language | Extra toolchain |
|----------|-----------------|
| C        | Emscripten only |
| C++      | Emscripten only |
| C3       | Emscripten **and** the C3 compiler (`c3c`) |

## Create a project

Install Bride, then scaffold a project into the current directory with
`bride new <language>`:

```sh
mkdir my-app
cd my-app

npm install bride-cli

npx bride new c
```

Replace `c` with `cpp` or `c3` for those languages. If you omit the language,
C is used by default.

`bride new` copies the matching template from `template/<language>/` into the
current directory.

## Project layout

A freshly scaffolded project looks like this:

```
my-app/
├── index.html        # Page that hosts the app (contains <main id="app">)
├── main.js           # Loads the WASM module through the Bride runtime
├── css/
│   └── style.css     # Default stylesheet
├── src/
│   └── main.c        # Your application source (main.cpp / main.c3 also possible)
├── package.json      # Must contain the "language" field
└── dist/             # Build output (generated)
```

The `language` field in `package.json` tells the CLI which toolchain to use:

```json
{
  "name": "bride-app",
  "language": "c",
  "dependencies": {
    "bride-cli": "^1.0.0"
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
`http://localhost:9876`, and watches `src/` for changes. When a `.c`, `.h`, or
`.c3` file changes, Bride rebuilds and reloads the browser automatically.

If your app uses the [router](api-reference.md#routing), the dev server also
serves `index.html` for unknown paths, so deep links like `/about` work on a
full refresh.

## Deploy

`dist/` is a plain static bundle. Upload its contents to any static host or
serve it behind any web server. No server-side runtime is required.

## Next steps

- Read the [API reference](api-reference.md) for the full DSL.
- Pick your language guide: [C](c.md), [C++](cpp.md), or [C3](c3.md).
