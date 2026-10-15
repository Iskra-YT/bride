#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "./style.h"
#include "./bhlm.h"
#include "./js.h"
#include "./html/tag.h"

// The style builder turns a list of declarations into a class-backed CSS rule:
//
//   .bride-style-1 { padding:12px;background:#1e1e2e;color:#cdd6f4 }
//
// The rule is appended to <head> with `add_at` and `apply` stamps the class
// name on an element. Identical declarations reuse the first class, so a style
// may be built on every render without piling up rules.

static BrideStyleDecl* style_decl_new(const char* property, const char* value) {
    if (!property || !value) {
        return NULL;
    }

    BrideStyleDecl* declaration = (BrideStyleDecl*)malloc(sizeof(BrideStyleDecl));

    if (!declaration) {
        return NULL;
    }

    declaration->property = strdup(property);
    declaration->value = strdup(value);

    if (!declaration->property || !declaration->value) {
        free(declaration->property);
        free(declaration->value);
        free(declaration);

        return NULL;
    }

    return declaration;
}

static BrideArg style_decl(const char* property, const char* value) {
    BrideArg result;
    result.type = BRIDE_STYLE;
    result.value = style_decl_new(property, value);

    return result;
}

static BrideArg style_decl_unit(const char* property, double value, const char* unit) {
    char buffer[64];

    snprintf(buffer, sizeof(buffer), "%.10g%s", value, unit ? unit : "");

    return style_decl(property, buffer);
}

BrideArg css(const char* property, const char* value) {
    return style_decl(property, value);
}

// Raw declarations are spliced in verbatim, e.g. raw_css("padding: 1rem;")
// renders `.bride-style-N{padding: 1rem;}`. Used for properties that have no
// dedicated helper.
BrideArg raw_css(const char* declarations) {
    return style_decl("", declarations ? declarations : "");
}

BrideArg padding(double value, const char* unit) { return style_decl_unit("padding", value, unit); }
BrideArg margin(double value, const char* unit) { return style_decl_unit("margin", value, unit); }
BrideArg gap(double value, const char* unit) { return style_decl_unit("gap", value, unit); }
BrideArg row_gap(double value, const char* unit) { return style_decl_unit("row-gap", value, unit); }
BrideArg column_gap(double value, const char* unit) { return style_decl_unit("column-gap", value, unit); }
BrideArg font_size(double value, const char* unit) { return style_decl_unit("font-size", value, unit); }
BrideArg border_radius(double value, const char* unit) { return style_decl_unit("border-radius", value, unit); }
BrideArg letter_spacing(double value, const char* unit) { return style_decl_unit("letter-spacing", value, unit); }
BrideArg word_spacing(double value, const char* unit) { return style_decl_unit("word-spacing", value, unit); }
BrideArg min_width(double value, const char* unit) { return style_decl_unit("min-width", value, unit); }
BrideArg min_height(double value, const char* unit) { return style_decl_unit("min-height", value, unit); }
BrideArg max_width(double value, const char* unit) { return style_decl_unit("max-width", value, unit); }
BrideArg max_height(double value, const char* unit) { return style_decl_unit("max-height", value, unit); }
BrideArg top(double value, const char* unit) { return style_decl_unit("top", value, unit); }
BrideArg right(double value, const char* unit) { return style_decl_unit("right", value, unit); }
BrideArg bottom(double value, const char* unit) { return style_decl_unit("bottom", value, unit); }
BrideArg left(double value, const char* unit) { return style_decl_unit("left", value, unit); }

BrideArg background(const char* value) { return style_decl("background", value); }
BrideArg color(const char* value) { return style_decl("color", value); }
BrideArg opacity(const char* value) { return style_decl("opacity", value); }
BrideArg display(const char* value) { return style_decl("display", value); }
BrideArg position(const char* value) { return style_decl("position", value); }
BrideArg overflow(const char* value) { return style_decl("overflow", value); }
BrideArg cursor(const char* value) { return style_decl("cursor", value); }
BrideArg z_index(const char* value) { return style_decl("z-index", value); }
BrideArg font_family(const char* value) { return style_decl("font-family", value); }
BrideArg font_style(const char* value) { return style_decl("font-style", value); }
BrideArg font_weight(const char* value) { return style_decl("font-weight", value); }
BrideArg line_height(const char* value) { return style_decl("line-height", value); }
BrideArg text_align(const char* value) { return style_decl("text-align", value); }
BrideArg text_transform(const char* value) { return style_decl("text-transform", value); }
BrideArg text_decoration(const char* value) { return style_decl("text-decoration", value); }
BrideArg text_shadow(const char* value) { return style_decl("text-shadow", value); }
BrideArg white_space(const char* value) { return style_decl("white-space", value); }
BrideArg word_break(const char* value) { return style_decl("word-break", value); }
BrideArg border(const char* value) { return style_decl("border", value); }
BrideArg outline(const char* value) { return style_decl("outline", value); }
BrideArg box_sizing(const char* value) { return style_decl("box-sizing", value); }
BrideArg box_shadow(const char* value) { return style_decl("box-shadow", value); }
BrideArg flex(const char* value) { return style_decl("flex", value); }
BrideArg flex_direction(const char* value) { return style_decl("flex-direction", value); }
BrideArg flex_wrap(const char* value) { return style_decl("flex-wrap", value); }
BrideArg justify_content(const char* value) { return style_decl("justify-content", value); }
BrideArg align_items(const char* value) { return style_decl("align-items", value); }
BrideArg align_content(const char* value) { return style_decl("align-content", value); }
BrideArg align_self(const char* value) { return style_decl("align-self", value); }
BrideArg grid_template_columns(const char* value) { return style_decl("grid-template-columns", value); }
BrideArg grid_template_rows(const char* value) { return style_decl("grid-template-rows", value); }
BrideArg transition(const char* value) { return style_decl("transition", value); }
BrideArg transform(const char* value) { return style_decl("transform", value); }
BrideArg filter(const char* value) { return style_decl("filter", value); }
BrideArg animation(const char* value) { return style_decl("animation", value); }

// Both declaration args (BRIDE_STYLE) and plain attribute args (BRIDE_ATTR)
// work inside `style(...)`, so `width("100%")` and `attr("max-width", "40ch")`
// are valid declarations too.
static bool style_arg_declaration(BrideArg arg, const char** property, const char** value) {
    switch (arg.type) {
        case BRIDE_STYLE: {
            BrideStyleDecl* declaration = (BrideStyleDecl*)arg.value;

            if (!declaration || !declaration->property || !declaration->value) {
                return false;
            }

            *property = declaration->property;
            *value = declaration->value;

            return true;
        }

        case BRIDE_ATTR: {
            HtmlAttribute* attribute = (HtmlAttribute*)arg.value;

            if (!attribute || !attribute->name || !attribute->value) {
                return false;
            }

            *property = attribute->name;
            *value = attribute->value;

            return true;
        }

        default:
            return false;
    }
}

static void style_arg_free(BrideArg arg) {
    if (arg.type == BRIDE_STYLE) {
        BrideStyleDecl* declaration = (BrideStyleDecl*)arg.value;

        if (declaration) {
            free(declaration->property);
            free(declaration->value);
            free(declaration);
        }

        return;
    }

    if (arg.type == BRIDE_ATTR) {
        HtmlAttribute* attribute = (HtmlAttribute*)arg.value;

        if (attribute) {
            free(attribute->name);
            free(attribute->value);
            free(attribute);
        }
    }
}

static char* style_body(BrideArg* args, int count) {
    size_t length = 0;

    for (int i = 0; i < count; i++) {
        const char* property;
        const char* value;

        if (!style_arg_declaration(args[i], &property, &value)) {
            continue;
        }

        if (value[0] == '\0') {
            continue;
        }

        length += strlen(property) + strlen(value) + 2;
    }

    if (length == 0) {
        return NULL;
    }

    char* body = (char*)malloc(length + 1);

    if (!body) {
        return NULL;
    }

    body[0] = '\0';

    for (int i = 0; i < count; i++) {
        const char* property;
        const char* value;

        if (!style_arg_declaration(args[i], &property, &value)) {
            continue;
        }

        if (value[0] == '\0') {
            continue;
        }

        if (property[0] != '\0') {
            strcat(body, property);
            strcat(body, ":");
        }

        strcat(body, value);
        strcat(body, ";");
    }

    return body;
}

typedef struct BrideStyleEntry {
    char* class_name;
    char* body;
    struct BrideStyleEntry* next;
} BrideStyleEntry;

static BrideStyleEntry* style_registry = NULL;
static unsigned long style_sequence = 0;

static void style_inject(const char* class_name, const char* body) {
    const char* prefix = "<style>.";
    const char* separator = "{";
    const char* suffix = "}</style>";

    size_t size = strlen(prefix) + strlen(class_name) + strlen(separator) + strlen(body) + strlen(suffix) + 1;
    char* html = (char*)malloc(size);

    if (!html) {
        return;
    }

    snprintf(html, size, "%s%s%s%s%s", prefix, class_name, separator, body, suffix);

    add_at("head", html);
    free(html);
}

BrideStyle __style_build(BrideArg* args, int count) {
    BrideStyle result;
    result.class_name = NULL;
    result.body = NULL;

    if (!args || count <= 0) {
        return result;
    }

    char* body = style_body(args, count);

    for (int i = 0; i < count; i++) {
        style_arg_free(args[i]);
    }

    if (!body) {
        return result;
    }

    for (BrideStyleEntry* entry = style_registry; entry; entry = entry->next) {
        if (strcmp(entry->body, body) == 0) {
            free(body);

            result.class_name = entry->class_name;
            result.body = entry->body;

            return result;
        }
    }

    char class_name[32];
    snprintf(class_name, sizeof(class_name), "bride-style-%lu", ++style_sequence);

    BrideStyleEntry* entry = (BrideStyleEntry*)malloc(sizeof(BrideStyleEntry));

    if (!entry) {
        free(body);
        return result;
    }

    entry->class_name = strdup(class_name);
    entry->body = body;

    if (!entry->class_name) {
        free(entry);
        free(body);

        return result;
    }

    entry->next = style_registry;
    style_registry = entry;

    style_inject(entry->class_name, entry->body);

    result.class_name = entry->class_name;
    result.body = entry->body;

    return result;
}

BrideStyle __style_impl(BrideArg first, ...) {
    BrideArg inline_args[16];
    BrideArg* args = inline_args;
    size_t capacity = 16;
    size_t count = 0;

    va_list list;
    va_start(list, first);

    for (BrideArg arg = first; arg.type != BRIDE_END; arg = va_arg(list, BrideArg)) {
        if (count == capacity) {
            size_t grown_capacity = capacity * 2;
            BrideArg* grown = (BrideArg*)malloc(sizeof(BrideArg) * grown_capacity);

            if (!grown) {
                break;
            }

            memcpy(grown, args, sizeof(BrideArg) * count);

            if (args != inline_args) {
                free(args);
            }

            args = grown;
            capacity = grown_capacity;
        }

        args[count++] = arg;
    }

    va_end(list);

    BrideStyle result = __style_build(args, (int)count);

    if (args != inline_args) {
        free(args);
    }

    return result;
}

BrideArg __style_inline_impl(const char* value, ...) {
    return attr("style", value ? value : "");
}

BrideArg apply(BrideStyle style) {
    if (!style.class_name) {
        BrideArg ignored;
        ignored.type = BRIDE_STYLE;
        ignored.value = NULL;

        return ignored;
    }

    return attr("class", style.class_name);
}
