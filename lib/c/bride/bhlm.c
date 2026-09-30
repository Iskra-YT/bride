#include "./html/tag.h"
#include "./bhlm.h"
#include "./children.h"
#include "./js.h"
#include "./dispach.h"
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
                children_push(children, arg.value);
                break;

            case BRIDE_ATTR:
                attrs_push(attributes, arg.value);
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

BrideArg class_(const char* name) {
    return attr("class", name);
}

BrideArg class(const char* name) {
    return class_(name);
}
