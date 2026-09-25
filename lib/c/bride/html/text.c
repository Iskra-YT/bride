#include <stdlib.h>
#include <string.h>
#include "text.h"

HtmlTag* create_text_tag(const char* text) {
    HtmlAttribute* attributes =
        malloc(sizeof(HtmlAttribute) * 2);

    if (!attributes) {
        return NULL;
    }

    attributes[0].name = NULL;
    attributes[0].value = malloc(strlen(text) + 1);

    if (!attributes[0].value) {
        free(attributes);
        return NULL;
    }

    strcpy(attributes[0].value, text);

    attributes[1].name = NULL;
    attributes[1].value = NULL;

    return create_html_tag(
        HTML_TAG_TEXT,
        attributes,
        NULL
    );
}

char* repr_text_tag(HtmlTag* tag) {
    const char* text = "";

    if (tag &&
        tag->attributes &&
        tag->attributes[0].value) {
        text = tag->attributes[0].value;
    }

    char* result = malloc(strlen(text) + 1);

    if (!result) {
        return NULL;
    }

    strcpy(result, text);

    return result;
}
