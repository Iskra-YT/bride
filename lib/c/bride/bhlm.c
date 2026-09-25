#include "./html/tag.h"
#include "./bhlm.h"
#include "./children.h"
#include "./js.h"
#include "./dispach.h"
#include "./attrs.h"

#include <stdarg.h>
#include <stdio.h>

static char* bride_strdup(const char* src) {
    size_t size = strlen(src) + 1;
    char* copy = (char*)malloc(size);

    if (!copy) {
        return NULL;
    }

    memcpy(copy, src, size);

    return copy;
}

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

            case BRIDE_EVENT:
                // ...
                break;

            default:
                break;
        }

        arg = va_arg(args, BrideArg);
    }
}

#define HTML_TO_CHILDREN(name, child) HtmlTag* name[2] = { (child), NULL }

BrideArg text(const char* value) {
    BrideArg return_value;
    return_value.type = BRIDE_HTML;

    return_value.value = (void*)create_text_tag(value);

    return return_value;
}

BrideArg __p_impl(BrideArg first, ...) {
    BrideArg result;
    result.type = BRIDE_HTML;

    HtmlChildren children;
    children_init(&children);

    HtmlAttrs attr;
    attrs_init(&attr);

    va_list args;
    va_start(args, first);

    bride_parse_args(first, args, &children, &attr);

    va_end(args);

    result.value = create_p_tag(children.data, attr.data);

    return result;
}

void __ui_impl(BrideArg first, ...) {
    HtmlChildren children;
    children_init(&children);

    HtmlAttrs attr;
    attrs_init(&attr);

    va_list args;
    va_start(args, first);

    bride_parse_args(first, args, &children, &attr);

    va_end(args);

    commit(repr_html_tag(create_fragment_tag(children.data, attr.data)));
}

void __change_impl(char* query, BrideArg first, ...) {
    HtmlChildren children;
    children_init(&children);

    HtmlAttrs attr;
    attrs_init(&attr);

    va_list args;
    va_start(args, first);

    bride_parse_args(first, args, &children, &attr);

    va_end(args);

    commit_at(query, repr_html_tag(create_fragment_tag(children.data, attr.data)));
}

BrideArg __fragment_impl(BrideArg first, ...) {
    BrideArg result;
    result.type = BRIDE_HTML;

    HtmlChildren children;
    children_init(&children);

    HtmlAttrs attr;
    attrs_init(&attr);

    va_list args;
    va_start(args, first);

    bride_parse_args(first, args, &children, &attr);

    va_end(args);

    result.value = create_fragment_tag(children.data, attr.data);
    return result;
}

BrideArg on_click(void (*fn)(void)) {
    BrideArg result;

    result.type = BRIDE_ATTR;
    result.value = NULL;

    HtmlAttribute* attr = (HtmlAttribute*)malloc(sizeof(HtmlAttribute));

    if (!attr) {
        return result;
    }

    attr->name = bride_strdup("onClick");

    if (!attr->name) {
        free(attr);
        return result;
    }

    int num = create_dispatch((void*)fn);

    attr->value = (char*)malloc(sizeof(char) * 32);
    snprintf(attr->value, 32, "Bride.dispatch(%d)", num);

    result.value = attr;

    return result;
}