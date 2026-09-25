#include <stdlib.h>
#include <string.h>
#include "p.h"

HtmlTag* create_p_tag(HtmlTag** children) {
    return create_html_tag(
        HTML_TAG_PARAGRAPH,
        NULL,
        children
    );
}

char* repr_p_tag(HtmlTag* tag) {
    size_t size = 8; // "<p>" + "</p>" + '\0'

    for (HtmlTag** child = tag->childrens; child && *child; child++) {
        char* child_repr = repr_html_tag(*child);

        size += strlen(child_repr);
        free(child_repr);
    }

    char* result = (char*)malloc(size);

    if (!result) {
        return NULL;
    }

    strcpy(result, "<p>");

    for (HtmlTag** child = tag->childrens; child && *child; child++) {
        char* child_repr = repr_html_tag(*child);

        strcat(result, child_repr);
        free(child_repr);
    }

    strcat(result, "</p>");

    return result;
}