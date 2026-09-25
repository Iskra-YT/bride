#ifndef BRIDE_P_HTML_H
#define BRIDE_P_HTML_H

#include "./tag.h"

HtmlTag* create_p_tag(HtmlTag** children);
char* repr_p_tag(HtmlTag* tag);

#endif // BRIDE_P_HTML_H