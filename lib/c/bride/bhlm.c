#include "./html/tag.h"
#include "./bhlm.h"
#include "./children.h"
#include "./js.h"
#include "./dispatch.h"
#include "./attrs.h"

#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

void bride_parse_args(BrideArg first, va_list args, HtmlChildren* children, HtmlAttrs* attributes) {
    BrideArg arg = first;

    while (arg.type != BRIDE_END) {
        switch (arg.type) {
            case BRIDE_HTML:
                if (arg.value) {
                    children_push(children, arg.value);
                }
                break;

            case BRIDE_ATTR:
                if (arg.value) {
                    attrs_push(attributes, arg.value);
                }
                break;

            default:
                break;
        }

        arg = va_arg(args, BrideArg);
    }
}

static BrideArg bride_html(HtmlTag* tag) {
    BrideArg result;
    result.type = BRIDE_HTML;
    result.value = tag;
    return result;
}

static HtmlTag* bride_collect(
    HtmlTag* (*create)(HtmlTag** childrens, HtmlAttribute** attributes),
    BrideArg first,
    va_list args
) {
    HtmlChildren children;
    children_init(&children);

    HtmlAttrs attributes;
    attrs_init(&attributes);

    bride_parse_args(first, args, &children, &attributes);

    return create(children.data, attributes.data);
}

#define BRIDE_BUILDER_TEXT(id, name)
#define BRIDE_BUILDER_ELEMENT(id, name) \
    BrideArg __##name##_impl(BrideArg first, ...) { \
        va_list args; \
        va_start(args, first); \
        HtmlTag* tag = bride_collect(create_##name##_tag, first, args); \
        va_end(args); \
        return bride_html(tag); \
    }
#define BRIDE_BUILDER_FRAGMENT(id, name) BRIDE_BUILDER_ELEMENT(id, name)
#define BRIDE_BUILDER_VOID(id, name) BRIDE_BUILDER_ELEMENT(id, name)

#define BRIDE_TAG(id, name, html_name, kind) BRIDE_BUILDER_##kind(id, name)
#include "./html/tags.def"
#undef BRIDE_TAG

static char* bride_render(BrideArg first, va_list args) {
    HtmlTag* tree = bride_collect(create_fragment_tag, first, args);
    char* html = repr_html_tag(tree);

    free_html_tag(tree);

    return html;
}

void __ui_impl(BrideArg first, ...) {
    va_list args;
    va_start(args, first);

    char* html = bride_render(first, args);

    va_end(args);

    if (html) {
        commit(html);
        free(html);
    }
}

void __change_impl(const char* query, BrideArg first, ...) {
    va_list args;
    va_start(args, first);

    char* html = bride_render(first, args);

    va_end(args);

    if (html) {
        commit_at(query, html);
        free(html);
    }
}

void __append_impl(const char* query, BrideArg first, ...) {
    va_list args;
    va_start(args, first);

    char* html = bride_render(first, args);

    va_end(args);

    if (html) {
        add_at(query, html);
        free(html);
    }
}

void style_file(const char* filename) {
    if (filename == NULL) {
        return;
    }

    const char* prefix = "<link rel=\"stylesheet\" href=\"";
    const char* suffix = "\">";

    size_t size = strlen(prefix) + strlen(filename) + strlen(suffix) + 1;
    char* html = malloc(size);

    if (html == NULL) {
        return;
    }

    snprintf(html, size, "%s%s%s", prefix, filename, suffix);

    add_at("head", html);
    free(html);
}
BrideArg text(const char* value) {
    return bride_html(create_text_tag(value));
}

BrideArg textf(const char* format, ...) {
    if (!format) {
        return bride_html(NULL);
    }

    va_list args;
    va_start(args, format);

    va_list measure;
    va_copy(measure, args);

    int length = vsnprintf(NULL, 0, format, measure);

    va_end(measure);

    if (length < 0) {
        va_end(args);
        return bride_html(NULL);
    }

    char* buffer = (char*)malloc((size_t)length + 1);

    if (!buffer) {
        va_end(args);
        return bride_html(NULL);
    }

    vsnprintf(buffer, (size_t)length + 1, format, args);

    va_end(args);

    BrideArg result = bride_html(create_text_tag(buffer));

    free(buffer);

    return result;
}

BrideArg attr(const char* name, const char* value) {
    BrideArg result;
    result.type = BRIDE_ATTR;
    result.value = NULL;

    HtmlAttribute* attribute = (HtmlAttribute*)malloc(sizeof(HtmlAttribute));
    if (!attribute) return result;

    attribute->name = strdup(name);
    if (!attribute->name) {
        free(attribute);
        return result;
    }

    attribute->value = strdup(value);
    if (!attribute->value) {
        free(attribute->name);
        free(attribute);
        return result;
    }

    result.value = attribute;
    return result;
}

char* to_event_name(const char* name) {
    size_t len = strlen(name);

    char* result = (char*)malloc(len + 3);

    result[0] = 'o';
    result[1] = 'n';

    result[2] = toupper((unsigned char)name[0]);

    strcpy(result + 3, name + 1);

    return result;
}

BrideArg action(const char* action, void (*fn)(void)) {
    BrideArg result;

    result.type = BRIDE_ATTR;
    result.value = NULL;

    HtmlAttribute* attribute = (HtmlAttribute*)malloc(sizeof(HtmlAttribute));

    if (!attribute) {
        return result;
    }

    attribute->name = to_event_name(action);

    if (!attribute->name) {
        free(attribute);
        return result;
    }

    int num = create_dispatch((void*)fn);

    attribute->value = (char*)malloc(sizeof(char) * 32);
    snprintf(attribute->value, 32, "Bride.dispatch(%d)", num);

    result.value = attribute;

    return result;
}

BrideArg on_click(void (*fn)(void)) {
    return action("click", fn);
}

BrideArg on_input(void (*fn)(void)) {
    return action("input", fn);
}

BrideArg id(const char* name) {
    return attr("id", name);
}

long ref_id = 0; 
BrideArg ref(BrideRef* reference) {
    char* idv = (char*)calloc(32, sizeof(char));
    sprintf(idv, "%ld", ++ref_id);

    char* ref_idv = (char*)calloc(32, sizeof(char));
    sprintf(ref_idv, "#%s", idv);
    
    *reference = ref_idv;
    return id(idv);
}

BrideArg class_(const char* name) {
    return attr("class", name);
}

BrideArg class(const char* name) {
    return class_(name);
}

BrideArg href(const char* value) { return attr("href", value); }
BrideArg src(const char* value) { return attr("src", value); }
BrideArg alt(const char* value) { return attr("alt", value); }
BrideArg title(const char* value) { return attr("title", value); }
BrideArg type(const char* value) { return attr("type", value); }
BrideArg name(const char* value) { return attr("name", value); }
BrideArg value(const char* value) { return attr("value", value); }
BrideArg placeholder(const char* value) { return attr("placeholder", value); }
BrideArg for_(const char* value) { return attr("for", value); }
BrideArg target(const char* value) { return attr("target", value); }
BrideArg rel(const char* value) { return attr("rel", value); }
BrideArg role(const char* value) { return attr("role", value); }
BrideArg width(const char* value) { return attr("width", value); }
BrideArg height(const char* value) { return attr("height", value); }
BrideArg tabindex(const char* value) { return attr("tabindex", value); }
BrideArg autocomplete(const char* value) { return attr("autocomplete", value); }
BrideArg accept(const char* value) { return attr("accept", value); }
BrideArg min(const char* value) { return attr("min", value); }
BrideArg max(const char* value) { return attr("max", value); }
BrideArg step(const char* value) { return attr("step", value); }
BrideArg pattern(const char* value) { return attr("pattern", value); }
BrideArg rows(const char* value) { return attr("rows", value); }
BrideArg cols(const char* value) { return attr("cols", value); }
BrideArg method(const char* value) { return attr("method", value); }
BrideArg form_action(const char* value) { return attr("action", value); }
BrideArg enctype(const char* value) { return attr("enctype", value); }
BrideArg loading(const char* value) { return attr("loading", value); }
BrideArg download(const char* value) { return attr("download", value); }

BrideArg disabled(void) { return attr("disabled", ""); }
BrideArg checked(void) { return attr("checked", ""); }
BrideArg selected(void) { return attr("selected", ""); }
BrideArg required(void) { return attr("required", ""); }
BrideArg readonly(void) { return attr("readonly", ""); }
BrideArg multiple(void) { return attr("multiple", ""); }
BrideArg autofocus(void) { return attr("autofocus", ""); }
BrideArg hidden(void) { return attr("hidden", ""); }

BrideArg on_change(void (*fn)(void)) { return action("change", fn); }
BrideArg on_submit(void (*fn)(void)) { return action("submit", fn); }
BrideArg on_focus(void (*fn)(void)) { return action("focus", fn); }
BrideArg on_blur(void (*fn)(void)) { return action("blur", fn); }
BrideArg on_keydown(void (*fn)(void)) { return action("keydown", fn); }
BrideArg on_keyup(void (*fn)(void)) { return action("keyup", fn); }
BrideArg on_keypress(void (*fn)(void)) { return action("keypress", fn); }
BrideArg on_dblclick(void (*fn)(void)) { return action("dblclick", fn); }
BrideArg on_mousedown(void (*fn)(void)) { return action("mousedown", fn); }
BrideArg on_mouseup(void (*fn)(void)) { return action("mouseup", fn); }
BrideArg on_mouseover(void (*fn)(void)) { return action("mouseover", fn); }
BrideArg on_mouseout(void (*fn)(void)) { return action("mouseout", fn); }
BrideArg on_mousemove(void (*fn)(void)) { return action("mousemove", fn); }
BrideArg on_scroll(void (*fn)(void)) { return action("scroll", fn); }
BrideArg on_load(void (*fn)(void)) { return action("load", fn); }
BrideArg on_contextmenu(void (*fn)(void)) { return action("contextmenu", fn); }
BrideArg on_wheel(void (*fn)(void)) { return action("wheel", fn); }
