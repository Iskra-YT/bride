#include "./children.h"

void children_init(HtmlChildren* children) {
    children->size = 0;
    children->capacity = 2;

    children->data = malloc(
        sizeof(HtmlTag*) * children->capacity
    );

    children->data[0] = NULL;
}

void children_push(HtmlChildren* children, HtmlTag* child) {
    if (children->size + 1 >= children->capacity) {
        children->capacity *= 2;

        children->data = realloc(
            children->data,
            sizeof(HtmlTag*) * children->capacity
        );
    }

    children->data[children->size++] = child;
    children->data[children->size] = NULL;
}

void children_free(HtmlChildren* children) {
    free(children->data);

    children->data = NULL;
    children->size = 0;
    children->capacity = 0;
}