#include <stdlib.h>
#include "tag.h"
#include "p.h"
#include "text.h"

HtmlTag* create_html_tag(HtmlTagType tag, HtmlAttribute* attributes, HtmlTag** childrens) {
    HtmlTag* new_tag = (HtmlTag*)malloc(sizeof(HtmlTag));
    new_tag->tag = tag;
    new_tag->attributes = attributes;
    new_tag->childrens = childrens;
    return new_tag;
}

char* repr_html_tag(HtmlTag* tag) {
    switch (tag->tag) {
        case HTML_TAG_PARAGRAPH:
            return repr_p_tag(tag);

        case HTML_TAG_TEXT:
            return repr_text_tag(tag);

        case HTML_TAG_CLICKABLE:
            return repr_clickable_tag(tag);

        case HTML_TAG_FRAGMENT:
            return repr_fragment_tag(tag);

        default:
            return NULL;
    }
}

void free_html_tag(HtmlTag* tag) {
    if (!tag) {
        return;
    }

    if (tag->attributes) {
        for (int i = 0; tag->attributes != NULL; i++) {
            free((void*)tag->attributes);
        }
        free(tag->attributes);
    }

    if (tag->childrens) {
        for (int i = 0; tag->childrens[i] != NULL; i++) {
            free_html_tag(tag->childrens[i]);
        }
        free(tag->childrens);
    }

    free(tag);
}