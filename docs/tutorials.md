# Tutorials

This page builds a few complete, runnable Bride applications. Each tutorial
assumes you have scaffolded a project and can run `bride dev` — see
[Getting started](getting-started.md) if you have not.

Examples are written in C. The same programs translate directly to C++ and C3;
see [Language mapping](api-reference.md#language-mapping) and the individual
language guides ([C](c.md), [C++](cpp.md), [C3](c3.md)).

---

## 1. Counter with reset

The scaffolded project ships a counter. This version splits rendering into a
helper and adds a reset button.

`src/main.c`:

```c
#include "bride.h"

int count = 0;

void render(void) {
    change("#counter", textf("Clicks: %d", count));
}

void increment(void) {
    count++;
    render();
}

void reset(void) {
    count = 0;
    render();
}

int main(void) {
    ui(
        h1(text("Counter")),
        p(id("counter"), textf("Clicks: %d", count)),
        button(on_click(increment), text("Increment")),
        button(on_click(reset), text("Reset"))
    );
}
```

What to notice:

- `render` updates only `#counter` with `change`, instead of re-rendering the
  whole page with `ui`.
- `increment` and `reset` are plain `void (*)(void)` handlers; the module owns
  `count` as its single source of truth.
- `id("counter")` is just an attribute, so it can appear anywhere in the
  argument list.

Build and run:

```sh
npx bride dev
```

Open http://localhost:9876 and click the buttons.

---

## 2. A static page (profile card)

Rendering is string building, so laying out a static page is just nesting tags.
This example uses grouping, text semantics, attributes, and a fragment.

`src/main.c`:

```c
#include "bride.h"

int main(void) {
    ui(
        header(
            h1(text("Bride")),
            p(em(text("Any language can be a web language.")))
        ),
        article(
            class("card"),
            h2(text("Ada Lovelace")),
            img(
                src("./avatar.png"),
                alt("Portrait"),
                width("96"),
                height("96")
            ),
            p(text("Wrote the first algorithm intended for a machine.")),
            footer(
                a(
                    href("https://example.com"),
                    target("_blank"),
                    rel("noopener"),
                    text("Website")
                )
            )
        )
    );
}
```

Grouping helpers keep repeated markup readable:

```c
BrideArg section_title(const char* title) {
    return fragment(
        h2(text(title)),
        hr()
    );
}

/* ... */
ui(
    section_title("Overview"),
    p(text("..."))
);
```

`fragment(...)` renders its children with no wrapper element, which is handy for
returning several nodes from a helper.

> Remember that text and attribute values are **not** escaped. If `title` could
> contain `<`, `>`, or `&`, escape it before passing it to `text`.

---

## 3. Conditional rendering (show / hide)

Because Bride has no way to read the DOM back, interactivity means updating
module state and re-rendering from it. This example toggles a panel.

`src/main.c`:

```c
#include "bride.h"

int show_details = 0;

void render_panel(void) {
    if (show_details) {
        change(
            "#panel",
            p(text("Bride compiles your program to WebAssembly.")),
            p(text("Rendering is just string concatenation."))
        );
    } else {
        change("#panel", p(em(text("Details hidden."))));
    }
}

void toggle(void) {
    show_details = !show_details;
    render_panel();
}

int main(void) {
    ui(
        h1(text("Show / hide")),
        button(on_click(toggle), text("Toggle details")),
        div_(id("panel"), p(em(text("Details hidden."))))
    );
}
```

`change` accepts any number of children, so a branch can replace an element's
contents with several nodes at once.

---

## 4. Dynamic lists with the low-level API

The macro DSL is best for a fixed shape. When the number of nodes depends on
runtime data — for example a list of unknown length — build the HTML string
yourself and commit it with the low-level `commit_at` primitive.

`src/main.c`:

```c
#include "bride.h"
#include <stdio.h>

#define MAX_ITEMS 16

int item_count = 0;

void render_list(void) {
    char html[1024];
    size_t used = 0;

    if (item_count == 0) {
        used += snprintf(html + used, sizeof(html) - used, "<li>(empty)</li>");
    } else {
        for (int i = 0; i < item_count; i++) {
            used += snprintf(
                html + used,
                sizeof(html) - used,
                "<li>Item %d</li>",
                i + 1
            );
        }
    }

    commit_at("#list", html);
}

void add_item(void) {
    if (item_count < MAX_ITEMS) {
        item_count++;
        render_list();
    }
}

int main(void) {
    ui(
        h1(text("Items")),
        button(on_click(add_item), text("Add item")),
        ul(id("list"), li(text("(empty)")))
    );
}
```

Why `commit_at` and not `change`? `change` takes DSL nodes, while `commit_at`
takes a raw HTML string — exactly what a loop produces. `commit_at` replaces the
`innerHTML` of the matched element, so we always render the whole list.

Because this HTML is built by hand, escaping any interpolated data is entirely up
to you.

---

## 5. Multi-page app with routing

Bride includes a small client-side router. Register page handlers with
`route(path, fn)`; the runtime renders the handler whose path matches the
current URL and intercepts same-origin links so navigation does not reload the
page.

`src/main.c`:

```c
#include "bride.h"

void home(void) {
    ui(
        h1(text("Home")),
        p(text("Welcome to Bride.")),
        a(href("/about"), text("About"))
    );
}

void about(void) {
    ui(
        h1(text("About")),
        p(text("A tiny client-side router.")),
        a(href("/"), text("Back home"))
    );
}

void not_found(void) {
    ui(
        h1(text("404")),
        p(text("No such page.")),
        a(href("/"), text("Back home"))
    );
}

int main(void) {
    route("/", home);
    route("/about", about);
    route("*", not_found);
}
```

What to notice:

- `route(path, fn)` takes the same `void (*)(void)` handlers as events, so a
  page handler is just a function that renders with `ui`.
- Plain `<a href>` links to same-origin paths are intercepted by the runtime, so
  clicking them swaps the page without a reload. The browser back/forward
  buttons work too.
- `route("*", not_found)` is an optional catch-all for unknown paths.
- Registering a route does not render anything; the runtime renders the matching
  route after `main` returns.

You can also navigate from code, for example after an action:

```c
void save(void) {
    /* ...persist... */
    navigate("/");
}
```

> Deep links need server support. `bride dev` serves `index.html` for unknown
> paths automatically; on a production static host, configure an equivalent
> rewrite.

---

## Where to go next

- [API reference](api-reference.md) — every tag, attribute, and event.
- [Architecture](architecture.md) — how rendering and dispatch work under the hood.
- [CLI reference](cli.md) — build and dev-server details.
- Language guides: [C](c.md), [C++](cpp.md), [C3](c3.md).
