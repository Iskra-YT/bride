# Adding a language

Bride's goal is that **any language can be a web language**. A language is only
considered **supported** once it satisfies all three criteria below. Until then
it should be listed as *in progress* or *unsupported*.

## Support criteria

A language is **supported** only when:

1. **It has basic documentation** — a guide exists for it in this `docs/`
   directory and is linked from `docs/README.md` and `README.md`.
2. **It has a ported library** — binding sources exist for it under
   `lib/<language>/`, exposing the Bride DSL for that language.
3. **It has an active compiler** — a working toolchain integration exists in
   `bin/compile.js` and `bin/utils.js`, and it is wired into `bin/build.js`.

If any one of these is missing, the language is not supported yet.

## 1. Basic documentation

Add `docs/<language>.md` following the structure of the existing guides:

- Requirements (Node.js, Emscripten, any extra compiler).
- How to create a project (`bride create <name> --lang <language>`).
- How to import the library.
- A complete, copy-pasteable example.
- Build and run instructions.
- Language-specific conventions (keyword clashes, namespacing).

Then link it from the documentation index and the main `README.md`.

## 2. Ported library

Add bindings under `lib/<language>/`. They should expose the same DSL surface as
the C library:

- `ui(...)`, `change(query, ...)`, and `append(query, ...)` for committing
  HTML.
- `text(value)` and `textf(format, ...)` for text nodes.
- `route(path, page)` and `navigate(path)` for client-side routing.
- Tag builders for every entry in `lib/c/bride/html/tags.def`.
- Attribute, boolean, and event helpers (`attr`, `id`, `class_`, `on_click`,
  ...).

Simple languages can be built directly on top of the C header
`lib/c/bride/bhlm.h`. The C++ port (`lib/cpp/bride/bhlm.hpp`) is a good, minimal
example of a wrapper: it re-exports the C API inside a namespace.

Whatever the approach, the port must produce the same rendered HTML and route
events through the same `Bride.dispatch(n)` mechanism used by the runtime.

## 3. Active compiler

Wire the language into the CLI:

1. **Template** — add `template/<language>/` with only what differs from the
   shared base: a `src/` folder containing a runnable example, plus any extra
   toolchain files (`project.json` for C3) or extra ignore lines in a plain
   `gitignore` file. `bride create <name> --lang <language>` copies `template/_common/` first
   (shared `index.html`, `main.js`, `gitignore`, `src/.gitkeep`), then this
   folder on top of it, and generates `package.json` with `"language"` set to
   the CLI value and `"bride-cli"` pinned to the running CLI version. A
   `package.json` shipped by the language folder is reused, with only
   `"language"` filled in.

2. **Compiler detection** — add a `hasX()` helper in `bin/utils.js` that probes
   the compiler (see `hasEmcc`, `hasEmpp`, `hasC3c`, `hasZig`).

3. **Compile step** — add a `compileX(src, archive)` function in
   `bin/compile.js` that compiles the project sources and links them with the
   shared Bride archive produced by `compileDotA()`. Throw a clear error when the
   toolchain is missing.

4. **Build dispatch** — branch on the `language` field in `bin/build.js`:

   ```js
   } else if (projectLanguage === "x") {
       await compileX(src, archive);
   }
   ```

5. **Watch support** — add the new source extension to the dev watcher in
   `bin/bride.js` so `bride dev` rebuilds on change.

## Checklist

- [ ] `docs/<language>.md` exists and is linked from the indexes.
- [ ] `lib/<language>/` contains working bindings.
- [ ] `template/<language>/` adds a runnable example on top of `template/_common/`.
- [ ] `bin/utils.js` can detect the compiler.
- [ ] `bin/compile.js` can build the project.
- [ ] `bin/build.js` dispatches to the new compiler.
- [ ] `bin/bride.js` watches the new source extension.
- [ ] The support table in `README.md` is updated.
