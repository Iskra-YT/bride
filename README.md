# Bride

Bride is the runtime bridge between WebAssembly and the Web. 

**Main idea**: Any language can be a web language.

## Supported Languages

| Language | Supported |
|----------|-----------|
| Rust     | No        |
| C        | Yes       |
| C++      | Yes       |
| Rust     | No        |
| C3       | Yes       |
| Zig      | No        |

If you want to add language not listed above, please submit a pull request or create an issue.

## How to use

```js
import { Bride } from "bride";

await Bride.start({
    wasm: "./build/app.wasm",
    root: "#app"
});
```

WASM will be loaded and executed, and the HTML element with the id `app` will be used as the root for the application.

## Tags & fields

Bride ships a small HTML DSL. Elements are callable macros/functions that accept
children and fields (attributes/events) in any order:

```c
ui(
    form(
        method("post"),
        form_action("/subscribe"),
        label(for_("email"), text("Email")),
        input(type("email"), name("email"), placeholder("you@example.com"), required()),
        br(),
        button(type("submit"), on_click(handler), text("Send"))
    )
);
```

### Tags

`p`, `div_`, `span`, `a`, `button`, `fragment`, headings `h1`–`h6`,
text semantics `strong`, `em`, `b`, `i`, `u`, `s`, `small`, `mark`, `code`,
`pre`, `kbd`, `samp`, `var`, `cite`, `abbr`, `q`, `sub`, `sup`, `blockquote`,
`address`, `time_`, `del`, `ins`, `br`, `hr`, `wbr`,
sectioning `header`, `footer`, `main_`, `nav`, `aside`, `section`, `article`,
`figure`, `figcaption`, `ul`, `ol`, `li`, `dl`, `dt`, `dd`, `details`,
`summary`, `dialog`,
tables `table`, `caption`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`,
`colgroup`, `col`,
embedded `img`, `picture`, `source`, `track`, `video`, `audio`, `canvas`,
`iframe`, `embed`, `object`, `map_`, `area`,
forms `form`, `label`, `input`, `textarea`, `select_`, `option`, `optgroup`,
`fieldset`, `legend`, `datalist`, `output`, `progress`, `meter`,
and `template_`, `slot`.

### Fields

Attribute helpers: `href`, `src`, `alt`, `title`, `type`, `name`, `value`,
`placeholder`, `for_`, `style`, `target`, `rel`, `role`, `width`, `height`,
`tabindex`, `autocomplete`, `accept`, `min`, `max`, `step`, `pattern`, `rows`,
`cols`, `method`, `form_action`, `enctype`, `loading`, `download`, plus the
generic `attr(name, value)`.

Boolean helpers: `disabled`, `checked`, `selected`, `required`, `readonly`,
`multiple`, `autofocus`, `hidden`.

Event helpers: `on_click`, `on_input`, `on_change`, `on_submit`, `on_focus`,
`on_blur`, `on_keydown`, `on_keyup`, `on_keypress`, `on_dblclick`,
`on_mousedown`, `on_mouseup`, `on_mouseover`, `on_mouseout`, `on_mousemove`,
`on_scroll`, `on_load`, `on_contextmenu`, `on_wheel`.

> Names ending in `_` avoid clashes with language keywords or libc functions:
> `div_`, `main_`, `time_`, `select_`, `map_`, `template_` (and `var_` in C3).

---

> Let's Compile the Web.