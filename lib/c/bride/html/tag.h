#ifndef BRIDE_TAG_HTML_H
#define BRIDE_TAG_HTML_H

#include <stdlib.h>
#include <string.h>

typedef enum HtmlTagType {
    HTML_TAG_PARAGRAPH,
    HTML_TAG_TEXT,
    HTML_TAG_CLICKABLE
} HtmlTagType;

typedef struct HtmlAttribute {
    char* name;
    char* value;
} HtmlAttribute;

typedef struct HtmlTag {
    HtmlTagType tag;
    HtmlAttribute* attributes;
    struct HtmlTag** childrens;

    void (*on_click)(void);
} HtmlTag;

HtmlTag* create_html_tag(HtmlTagType tag, HtmlAttribute* attributes, HtmlTag** childrens);
char* repr_html_tag(HtmlTag* tag);

#include "./p.h"
#include "./text.h"
#include "./clickable.h"

#endif // BRIDE_TAG_HTML_H