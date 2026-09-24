#ifndef BRIDE_TAG_HTML_H
#define BRIDE_TAG_HTML_H

#include <stdlib.h>
#include <string.h>

enum HtmlTagType {
    HTML_TAG_PARAGRAPH,
    HTML_TAG_TEXT
};

struct HtmlTag {
    HtmlTagType tag;
    char** attributes;
    HtmlTag** childrens;
};

HtmlTag* create_html_tag(const HtmlTagType tag, char** attributes, HtmlTag** childrens) {
    HtmlTag* new_tag = (HtmlTag*)malloc(sizeof(HtmlTag));
    new_tag->tag = tag;
    new_tag->attributes = attributes;
    new_tag->childrens = childrens;
    return new_tag;
}

#endif // BRIDE_TAG_HTML_H