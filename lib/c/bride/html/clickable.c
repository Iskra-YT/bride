#include "./clickable.h"
#include "../dispach.h"

#include <stdio.h>

HtmlTag* create_clickable_tag(HtmlTag** children, void (*fn)(void)) {
    HtmlTag* tag = create_html_tag(
        HTML_TAG_CLICKABLE,
        NULL,
        children
    );

    tag->on_click = fn;

    return tag;
}

char* repr_clickable_tag(HtmlTag* tag) {
    size_t size = 48; // "<div onClick="Bride.dispatch({num})"> + {childs} + </div>"

    for (HtmlTag** child = tag->childrens; child && *child; child++) {
        char* child_repr = repr_html_tag(*child);

        size += strlen(child_repr);
        free(child_repr);
    }

    char* result = (char*)malloc(size);

    if (!result) {
        return NULL;
    }

    strcpy(result, "<div onClick=\"Bride.dispatch(");

    int num = create_dispatch((void*)tag->on_click);
    char buffer[32];
    snprintf(buffer, sizeof(buffer), "%d", num);

    strcat(result, buffer);
    strcat(result, ")\">");

    for (HtmlTag** child = tag->childrens; child && *child; child++) {
        char* child_repr = repr_html_tag(*child);

        strcat(result, child_repr);
        free(child_repr);
    }

    strcat(result, "</div>");

    return result;
}