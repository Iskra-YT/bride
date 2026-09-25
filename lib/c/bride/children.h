#ifndef BRIDE_CHILDREN_H
#define BRIDE_CHILDREN_H

#include <stdlib.h>
#include "./html/tag.h"

typedef struct {
    HtmlTag** data;
    size_t size;
    size_t capacity;
} HtmlChildren;

void children_init(HtmlChildren* children);
void children_push(HtmlChildren* children, HtmlTag* child);
void children_free(HtmlChildren* children);

#endif