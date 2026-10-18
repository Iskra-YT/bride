# Bride Documentation

Welcome to the Bride documentation. Bride is the runtime bridge between
WebAssembly and the Web. Its main idea is simple: **any language can be a web
language**.

This `docs/` directory explains how to use Bride in a given language.

## Contents

| Document | Description |
|----------|-------------|
| [Getting started](getting-started.md) | Install the toolchain, scaffold a project, build, and run it. |
| [CLI reference](cli.md) | The `bride create`, `bride build`, and `bride dev` commands, requirements, and output. |
| [Smoke testing](cli.md#smoke-testing-the-package) | How the packed package is tested end to end before it is published. |
| [API reference](api-reference.md) | The HTML DSL: tags, fields, events, routing, styling, references, `ui`, `change`, `text`, and `textf`. |
| [Architecture](architecture.md) | How the module talks to the browser: rendering, dispatch, the runtime, and the build. |
| [Tutorials](tutorials.md) | Complete, runnable example applications. |
| [C](c.md) | How to use Bride in C. |
| [C++](cpp.md) | How to use Bride in C++. |
| [C3](c3.md) | How to use Bride in C3. |
| [Zig](zig.md) | How to use Bride in Zig. |
| [Adding a language](adding-a-language.md) | Support criteria and how to port Bride to a new language. |

## What makes a language supported?

A language is listed as **supported** only when **all three** of the following
are true:

1. **It has basic documentation** — a guide exists for it in this `docs/`
   directory.
2. **It has a ported library** — binding sources exist for it under
   `lib/<language>/`.
3. **It has an active compiler** — a working toolchain integration exists in
   `bin/compile.js` and `bin/utils.js`.

If any of these is missing, the language is considered *in progress* or
*unsupported*. See [Adding a language](adding-a-language.md) for details.
