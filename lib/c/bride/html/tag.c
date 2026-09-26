#include <stdlib.h>
#include "tag.h"
#include "p.h"
#include "text.h"

HtmlTag* create_html_tag(HtmlTagType tag, HtmlAttribute** attributes, HtmlTag** childrens) {
    HtmlTag* new_tag = (HtmlTag*)malloc(sizeof(HtmlTag));
    new_tag->tag = tag;
    new_tag->attributes = attributes;
    new_tag->childrens = childrens;
    return new_tag;
}

char* repr_html_tag(HtmlTag* tag) {
    if (!tag) {
        return NULL;
    }

    switch (tag->tag) {
        case HTML_TAG_PARAGRAPH:
            return repr_p_tag(tag);

        case HTML_TAG_TEXT:
            return repr_text_tag(tag);

        case HTML_TAG_FRAGMENT:
            return repr_fragment_tag(tag);

        case HTML_TAG_BUTTON:
            return repr_button_tag(tag);

        default:
            return NULL;
    }
}

void free_html_tag(HtmlTag* tag) {
    if (!tag) {
        return;
    }

    if (tag->attributes) {
        for (size_t i = 0; tag->attributes[i] != NULL; i++) {
            free(tag->attributes[i]->name);
            free(tag->attributes[i]->value);
            free(tag->attributes[i]);
        }

        free(tag->attributes);
    }

    if (tag->childrens) {
        for (size_t i = 0; tag->childrens[i] != NULL; i++) {
            free_html_tag(tag->childrens[i]);
        }

        free(tag->childrens);
    }

    free(tag);
}

size_t repr_html_attributes_length(HtmlTag* tag) {
    size_t size = 0;

    if (!tag || !tag->attributes) {
        return 0;
    }

    for (HtmlAttribute** attr = tag->attributes; *attr; attr++) {
        if (!(*attr)->name || !(*attr)->value) {
            continue;
        }

        // " name=\"value\""
        size += 1 + strlen((*attr)->name) + 2 + strlen((*attr)->value) + 1;
    }

    return size;
}

void repr_html_attributes(HtmlTag* tag, char* str) {
    if (!tag || !tag->attributes || !str) {
        return;
    }

    for (HtmlAttribute** attr = tag->attributes; *attr; attr++) {
        if (!(*attr)->name || !(*attr)->value) {
            continue;
        }

        strcat(str, " ");
        strcat(str, (*attr)->name);
        strcat(str, "=\"");
        strcat(str, (*attr)->value);
        strcat(str, "\"");
    }
}