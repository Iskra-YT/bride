#include <stdlib.h>
#include <string.h>
#include "fragment.h"

HtmlTag* create_fragment_tag(HtmlTag** children, HtmlAttribute** attributes) {
    return create_html_tag(
        HTML_TAG_FRAGMENT,
        attributes,
        children
    );
}

char* repr_fragment_tag(HtmlTag* tag) {
    if (!tag) {
        return NULL;
    }

    size_t size = 1; // '\0'

    for (HtmlTag** child = tag->childrens; child && *child; child++) {
        char* child_repr = repr_html_tag(*child);

        if (!child_repr) {
            continue;
        }

        size += strlen(child_repr);
        free(child_repr);
    }

    char* result = (char*)malloc(size);

    if (!result) {
        return NULL;
    }

    result[0] = '\0';

    for (HtmlTag** child = tag->childrens; child && *child; child++) {
        char* child_repr = repr_html_tag(*child);

        if (!child_repr) {
            continue;
        }

        strcat(result, child_repr);
        free(child_repr);
    }

    return result;
}