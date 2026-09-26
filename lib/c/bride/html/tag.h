#ifndef BRIDE_TAG_HTML_H
#define BRIDE_TAG_HTML_H

#include <stdlib.h>
#include <string.h>

typedef enum HtmlTagType {
    HTML_TAG_PARAGRAPH,
    HTML_TAG_TEXT,
    HTML_TAG_FRAGMENT,
    HTML_TAG_BUTTON
} HtmlTagType;

typedef struct HtmlAttribute {
    char* name;
    char* value;
} HtmlAttribute;

typedef struct HtmlTag {
    HtmlTagType tag;
    HtmlAttribute** attributes;
    struct HtmlTag** childrens;
} HtmlTag;

HtmlTag* create_html_tag(HtmlTagType tag, HtmlAttribute** attributes, HtmlTag** childrens);
char* repr_html_tag(HtmlTag* tag);
void free_html_tag(HtmlTag* tag);
size_t repr_html_attributes_length(HtmlTag* tag);
void repr_html_attributes(HtmlTag* tag, char* str);

#include "./p.h"
#include "./text.h"
#include "./fragment.h"
#include "./button.h"

#endif // BRIDE_TAG_HTML_H