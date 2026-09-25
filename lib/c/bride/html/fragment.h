#ifndef BRIDE_FRAGMENT_H
#define BRIDE_FRAGMENT_H

#include "../html/tag.h"

HtmlTag* create_fragment_tag(HtmlTag** children);
char* repr_fragment_tag(HtmlTag* tag);

#endif // BRIDE_FRAGMENT_H