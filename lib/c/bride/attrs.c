#include "./attrs.h"

void attrs_init(HtmlAttrs* attrs) {
    attrs->size = 0;
    attrs->capacity = 2;

    attrs->data = malloc(
        sizeof(HtmlAttrs*) * attrs->capacity
    );

    attrs->data[0] = NULL;
}

void attrs_push(HtmlAttrs* attrs, HtmlAttribute* child) {
    if (attrs->size + 1 >= attrs->capacity) {
        attrs->capacity *= 2;

        attrs->data = realloc(
            attrs->data,
            sizeof(HtmlAttrs*) * attrs->capacity
        );
    }

    attrs->data[attrs->size++] = child;
    attrs->data[attrs->size] = NULL;
}

void attrs_free(HtmlAttrs* attrs) {
    free(attrs->data);

    attrs->data = NULL;
    attrs->size = 0;
    attrs->capacity = 0;
}