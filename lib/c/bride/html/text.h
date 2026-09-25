#ifndef BRIDE_TEXT_HTML_H
#define BRIDE_TEXT_HTML_H

#include "./tag.h"

HtmlTag* create_text_tag(const char* text);
char* repr_text_tag(HtmlTag* tag);

#endif // BRIDE_TEXT_HTML_H