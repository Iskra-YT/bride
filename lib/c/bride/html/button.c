#include <stdlib.h>
#include <string.h>
#include "./button.h"

HtmlTag* create_button_tag(HtmlTag** children, HtmlAttribute** attributes) {
    return create_html_tag(
        HTML_TAG_BUTTON,
        attributes,
        children
    );
}

char* repr_button_tag(HtmlTag* tag) {
    if (!tag) {
        return NULL;
    }

    size_t size = 18; // "<button" + ">" + "</button>" + '\0'
    size += repr_html_attributes_length(tag);

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

    strcpy(result, "<button");
    repr_html_attributes(tag, result);
    strcat(result, ">");

    for (HtmlTag** child = tag->childrens; child && *child; child++) {
        char* child_repr = repr_html_tag(*child);

        if (!child_repr) {
            continue;
        }

        strcat(result, child_repr);
        free(child_repr);
    }

    strcat(result, "</button>");

    return result;
}