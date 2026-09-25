#ifndef BRIDE_CLICKABLE_H
#define BRIDE_CLICKABLE_H

#include "./tag.h"

HtmlTag* create_clickable_tag(HtmlTag** children, void (*fn)(void));
char* repr_clickable_tag(HtmlTag* tag);

#endif // BRIDE_CLICKABLE_H