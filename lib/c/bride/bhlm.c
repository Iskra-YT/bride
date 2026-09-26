#include "./html/tag.h"
#include "./bhlm.h"
#include "./children.h"
#include "./js.h"
#include "./dispach.h"
#include "./attrs.h"

#include <stdarg.h>
#include <stdio.h>
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

#define HTML_TO_CHILDREN(name, child) HtmlTag* name[2] = { (child), NULL }

BrideArg text(const char* value) {
    BrideArg return_value;
    return_value.type = BRIDE_HTML;

    return_value.value = (void*)create_text_tag(value);

    return return_value;
}

BrideArg textf(const char* format, ...) {
    BrideArg result;
    result.type = BRIDE_HTML;
    result.value = NULL;

    if (!format) {
        return result;
    }

    va_list args;
    va_start(args, format);

    va_list measure;
    va_copy(measure, args);

    int length = vsnprintf(NULL, 0, format, measure);

    va_end(measure);

    if (length < 0) {
        va_end(args);
        return result;
    }

    char* buffer = malloc((size_t)length + 1);

    if (!buffer) {
        va_end(args);
        return result;
    }

    vsnprintf(buffer, (size_t)length + 1, format, args);

    va_end(args);

    result.value = (void*)create_text_tag(buffer);

    free(buffer);

    return result;
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

BrideArg attr(char* name, char* value) {
    BrideArg result;

    result.type = BRIDE_ATTR;
    result.value = NULL;

    HtmlAttribute* attr = (HtmlAttribute*)malloc(sizeof(HtmlAttribute));
    if (!attr) return result;

    attr->name = strdup(name);
    if (!attr->name) {
        free(attr);
        return result;
    }

    attr->value = strdup(value);
    if (!attr->value) {
        free(attr);
        free(attr->name);
        return result;
    }

    result.value = attr;
    return result;
}

char* to_event_name(const char* name) {
    size_t len = strlen(name);

    char* result = malloc(len + 3);

    result[0] = 'o';
    result[1] = 'n';

    result[2] = toupper((unsigned char)name[0]);

    strcpy(result + 3, name + 1);

    return result;
}

BrideArg action(char* action, void (*fn)(void)) {
    BrideArg result;

    result.type = BRIDE_ATTR;
    result.value = NULL;

    HtmlAttribute* attr = (HtmlAttribute*)malloc(sizeof(HtmlAttribute));

    if (!attr) {
        return result;
    }

    attr->name = to_event_name(action);

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

BrideArg on_click(void (*fn)(void)) {
    return action("click", fn);
}

BrideArg on_input(void (*fn)(void)) {
    return action("input", fn);
}

BrideArg id(char* name) {
    return attr("id", name);
}

BrideArg __button_impl(BrideArg first, ...) {
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

    result.value = create_button_tag(children.data, attr.data);

    return result;
}