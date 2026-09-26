#ifndef BRIDE_BUTTON_HTML_H
#define BRIDE_BUTTON_HTML_H

#include "./tag.h"

HtmlTag* create_button_tag(HtmlTag** children, HtmlAttribute** attributes);
char* repr_button_tag(HtmlTag* tag);

#endif // BRIDE_BUTTON_HTML_H