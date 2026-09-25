#include "./html/tag.h"
#include "./bhlm.h"
#include "./children.h"
#include "./js.h"
#include "./dispach.h"

#include <stdarg.h>

void bride_parse_args(BrideArg first, va_list args, HtmlChildren* children) {
    BrideArg arg = first;

    while (arg.type != BRIDE_END) {
        switch (arg.type) {
            case BRIDE_HTML:
                children_push(children, arg.value);
                break;

            case BRIDE_ATTR:
                // ...
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

BrideArg text(char* value) {
    BrideArg return_value;
    return_value.type = BRIDE_HTML;

    HtmlTag* text = create_text_tag(value);

    return_value.value = (void*)text;

    return return_value;
}

BrideArg __p_impl(BrideArg first, ...) {
    BrideArg result;
    result.type = BRIDE_HTML;

    HtmlChildren children;
    children_init(&children);

    va_list args;
    va_start(args, first);

    bride_parse_args(first, args, &children);

    va_end(args);

    result.value = create_p_tag(children.data);

    return result;
}

void __ui_impl(BrideArg first, ...) {
    dispatch_init();

    HtmlChildren children;
    children_init(&children);

    va_list args;
    va_start(args, first);

    bride_parse_args(first, args, &children);

    va_end(args);

    commit(repr_html_tag(create_fragment_tag(children.data)));
}