#include <stdlib.h>
#include <string.h>
#include "fragment.h"

HtmlTag* create_fragment_tag(HtmlTag** children) {
    return create_html_tag(
        HTML_TAG_FRAGMENT,
        NULL,
        children
    );
}

char* repr_fragment_tag(HtmlTag* tag) {
    size_t size = 1; // '\0'

    for (HtmlTag** child = tag->childrens; child && *child; child++) {
        char* child_repr = repr_html_tag(*child);

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

        strcat(result, child_repr);
        free(child_repr);
    }

    return result;
}