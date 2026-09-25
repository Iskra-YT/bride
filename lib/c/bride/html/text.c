#include <stdlib.h>
#include <string.h>
#include "text.h"

HtmlTag* create_text_tag(const char* text) {
    char** attributes = (char**)malloc(sizeof(char*) * 2);

    if (!attributes) {
        return NULL;
    }

    attributes[0] = (char*)malloc(strlen(text) + 1);

    if (!attributes[0]) {
        free(attributes);
        return NULL;
    }

    strcpy(attributes[0], text);
    attributes[1] = NULL;

    return create_html_tag(HTML_TAG_TEXT, attributes, NULL);
}

char* repr_text_tag(HtmlTag* tag) {
    const char* text = tag->attributes && tag->attributes[0] ? tag->attributes[0] : "";

    char* result = (char*)malloc(strlen(text) + 1);

    if (!result) {
        return NULL;
    }

    strcpy(result, text);

    return result;
}