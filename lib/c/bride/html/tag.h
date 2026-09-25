#ifndef BRIDE_TAG_HTML_H
#define BRIDE_TAG_HTML_H

#include <stdlib.h>
#include <string.h>

typedef enum HtmlTagType {
    HTML_TAG_PARAGRAPH,
    HTML_TAG_TEXT
} HtmlTagType;

typedef struct HtmlTag {
    HtmlTagType tag;
    char** attributes;
    struct HtmlTag** childrens;
} HtmlTag;

HtmlTag* create_html_tag(HtmlTagType tag, char** attributes, HtmlTag** childrens);
char* repr_html_tag(HtmlTag* tag);

#include "./p.h"
#include "./text.h"

#endif // BRIDE_TAG_HTML_H