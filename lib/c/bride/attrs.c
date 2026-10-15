#include "./attrs.h"
#include <string.h>

void attrs_init(HtmlAttrs* attrs) {
    attrs->size = 0;
    attrs->capacity = 2;

    attrs->data = malloc(
        sizeof(HtmlAttrs*) * attrs->capacity
    );

    attrs->data[0] = NULL;
}

void attrs_push(HtmlAttrs* attrs, HtmlAttribute* child) {
    if (!attrs || !child) {
        return;
    }

    // Several helpers may set `class` on one element (`class("card")` plus
    // `apply(style)`). HTML would drop all but the first, so merge them into a
    // single space separated attribute.
    if (child->name && child->value && strcmp(child->name, "class") == 0) {
        for (size_t i = 0; i < attrs->size; i++) {
            HtmlAttribute* existing = attrs->data[i];

            if (!existing || !existing->name || !existing->value) {
                continue;
            }

            if (strcmp(existing->name, "class") != 0) {
                continue;
            }

            size_t first = strlen(existing->value);
            size_t second = strlen(child->value);

            char* merged = malloc(first + second + 2);

            if (!merged) {
                break;
            }

            if (first > 0) {
                memcpy(merged, existing->value, first);
                merged[first] = ' ';
                memcpy(merged + first + 1, child->value, second + 1);
            } else {
                memcpy(merged, child->value, second + 1);
            }

            free(existing->value);
            existing->value = merged;

            free(child->name);
            free(child->value);
            free(child);

            return;
        }
    }

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