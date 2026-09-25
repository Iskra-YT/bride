#ifndef BRIDE_Attrs_H
#define BRIDE_Attrs_H

#include <stdlib.h>
#include "./html/tag.h"

typedef struct {
    HtmlAttribute** data;
    size_t size;
    size_t capacity;
} HtmlAttrs;

void attrs_init(HtmlAttrs* attrs);
void attrs_push(HtmlAttrs* attrs, HtmlAttribute* child);
void attrs_free(HtmlAttrs* attrs);

#endif