#ifndef BRIDE_P_HTML_H
#define BRIDE_P_HTML_H

#include "./tag.h"

HtmlTag* create_p_tag(HtmlTag** inside) {
    HtmlTagType tag = HTML_TAG_PARAGRAPH;
    char** attributes = NULL;
    HtmlTag** childrens = inside;

    *inside = create_html_tag(tag, attributes, childrens);
    return *inside;
}

char* repr_p_tag(HtmlTag* tag) {
    // <p>repr_childrens</p>
    // TODO: Implement the representation of the <p> tag with its children
}

#endif // BRIDE_P_HTML_H