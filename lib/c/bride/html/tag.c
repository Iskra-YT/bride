#include <stdlib.h>
#include <string.h>

#include "./tag.h"

#define BRIDE_BUFFER_MIN_CAPACITY 32

void html_buffer_init(HtmlBuffer* buffer) {
    buffer->data = NULL;
    buffer->length = 0;
    buffer->capacity = 0;
}

void html_buffer_free(HtmlBuffer* buffer) {
    free(buffer->data);

    buffer->data = NULL;
    buffer->length = 0;
    buffer->capacity = 0;
}

static bool html_buffer_reserve(HtmlBuffer* buffer, size_t extra) {
    size_t required = buffer->length + extra + 1;
    size_t capacity = buffer->capacity;
    char* data;

    if (required <= capacity) {
        return true;
    }

    if (capacity < BRIDE_BUFFER_MIN_CAPACITY) {
        capacity = BRIDE_BUFFER_MIN_CAPACITY;
    }

    while (capacity < required) {
        capacity *= 2;
    }

    data = (char*)realloc(buffer->data, capacity);

    if (!data) {
        return false;
    }

    buffer->data = data;
    buffer->capacity = capacity;

    return true;
}

bool html_buffer_append_n(HtmlBuffer* buffer, const char* text, size_t length) {
    if (!text) {
        return true;
    }

    if (!html_buffer_reserve(buffer, length)) {
        return false;
    }

    memcpy(buffer->data + buffer->length, text, length);
    buffer->length += length;
    buffer->data[buffer->length] = '\0';

    return true;
}

bool html_buffer_append(HtmlBuffer* buffer, const char* text) {
    return html_buffer_append_n(buffer, text, text ? strlen(text) : 0);
}

bool html_buffer_append_char(HtmlBuffer* buffer, char character) {
    return html_buffer_append_n(buffer, &character, 1);
}

char* html_buffer_take(HtmlBuffer* buffer) {
    char* data = buffer->data;

    if (data && buffer->length == 0) {
        strcpy(data, "");
    }

    buffer->data = NULL;
    buffer->length = 0;
    buffer->capacity = 0;

    return data;
}

static char* repr_element(HtmlTag* tag, const char* html_name);
static char* repr_text(HtmlTag* tag);
static char* repr_fragment(HtmlTag* tag);

#define BRIDE_REPR_TEXT(id, name, html_name) \
    static char* repr_##name##_tag(HtmlTag* tag) { \
        return repr_text(tag); \
    }
#define BRIDE_REPR_ELEMENT(id, name, html_name) \
    static char* repr_##name##_tag(HtmlTag* tag) { \
        return repr_element(tag, html_name); \
    }
#define BRIDE_REPR_FRAGMENT(id, name, html_name) \
    static char* repr_##name##_tag(HtmlTag* tag) { \
        return repr_fragment(tag); \
    }

#define BRIDE_TAG(id, name, html_name, kind) BRIDE_REPR_##kind(id, name, html_name)
#include "./tags.def"
#undef BRIDE_TAG

static char* (*const repr_table[HTML_TAG_COUNT])(HtmlTag*) = {
#define BRIDE_TAG(id, name, html_name, kind) repr_##name##_tag,
#include "./tags.def"
#undef BRIDE_TAG
};

char* repr_html_tag(HtmlTag* tag) {
    if (!tag) {
        return NULL;
    }

    unsigned int type = (unsigned int)tag->tag;

    if (type >= (unsigned int)HTML_TAG_COUNT) {
        return NULL;
    }

    return repr_table[type](tag);
}

bool repr_html_attributes(HtmlTag* tag, HtmlBuffer* buffer) {
    if (!tag || !tag->attributes) {
        return true;
    }

    for (HtmlAttribute** attribute = tag->attributes; *attribute; attribute++) {
        if (!(*attribute)->name || !(*attribute)->value) {
            continue;
        }

        if (!html_buffer_append_char(buffer, ' ') ||!html_buffer_append(buffer, (*attribute)->name) || !html_buffer_append(buffer, "=\"") || !html_buffer_append(buffer, (*attribute)->value) || !html_buffer_append_char(buffer, '"')) {
            return false;
        }
    }

    return true;
}

bool repr_html_children(HtmlTag* tag, HtmlBuffer* buffer) {
    if (!tag || !tag->childrens) {
        return true;
    }

    for (HtmlTag** child = tag->childrens; *child; child++) {
        char* child_repr = repr_html_tag(*child);

        if (!child_repr) {
            continue;
        }

        bool ok = html_buffer_append(buffer, child_repr);
        free(child_repr);

        if (!ok) {
            return false;
        }
    }

    return true;
}

static char* repr_element(HtmlTag* tag, const char* html_name) {
    HtmlBuffer buffer;
    html_buffer_init(&buffer);

    if (!html_buffer_append_char(&buffer, '<') ||
        !html_buffer_append(&buffer, html_name) ||
        !repr_html_attributes(tag, &buffer) ||
        !html_buffer_append_char(&buffer, '>') ||
        !repr_html_children(tag, &buffer) ||
        !html_buffer_append(&buffer, "</") ||
        !html_buffer_append(&buffer, html_name) ||
        !html_buffer_append_char(&buffer, '>')) {
        html_buffer_free(&buffer);
        return NULL;
    }

    return html_buffer_take(&buffer);
}

static char* repr_fragment(HtmlTag* tag) {
    HtmlBuffer buffer;
    html_buffer_init(&buffer);

    if (!repr_html_children(tag, &buffer)) {
        html_buffer_free(&buffer);
        return NULL;
    }

    return html_buffer_take(&buffer);
}

static char* repr_text(HtmlTag* tag) {
    const char* text = "";

    if (tag &&
        tag->attributes &&
        tag->attributes[0] &&
        tag->attributes[0]->value) {
        text = tag->attributes[0]->value;
    }

    size_t length = strlen(text);
    char* result = (char*)malloc(length + 1);

    if (!result) {
        return NULL;
    }

    memcpy(result, text, length + 1);

    return result;
}

#define BRIDE_CREATE_TEXT(id, name)
#define BRIDE_CREATE_ELEMENT(id, name) \
    HtmlTag* create_##name##_tag(HtmlTag** childrens, HtmlAttribute** attributes) { \
        return create_html_tag(HTML_TAG_##id, attributes, childrens); \
    }
#define BRIDE_CREATE_FRAGMENT(id, name) BRIDE_CREATE_ELEMENT(id, name)

#define BRIDE_TAG(id, name, html_name, kind) BRIDE_CREATE_##kind(id, name)
#include "./tags.def"
#undef BRIDE_TAG

HtmlTag* create_html_tag(HtmlTagType tag, HtmlAttribute** attributes, HtmlTag** childrens) {
    HtmlTag* new_tag = (HtmlTag*)malloc(sizeof(HtmlTag));

    if (!new_tag) {
        return NULL;
    }

    new_tag->tag = tag;
    new_tag->attributes = attributes;
    new_tag->childrens = childrens;

    return new_tag;
}

HtmlTag* create_text_tag(const char* text) {
    if (!text) {
        text = "";
    }

    HtmlAttribute* attribute = (HtmlAttribute*)malloc(sizeof(HtmlAttribute));

    if (!attribute) {
        return NULL;
    }

    attribute->name = NULL;
    attribute->value = strdup(text);

    if (!attribute->value) {
        free(attribute);
        return NULL;
    }

    HtmlAttribute** attributes = (HtmlAttribute**)malloc(sizeof(HtmlAttribute*) * 2);

    if (!attributes) {
        free(attribute->value);
        free(attribute);
        return NULL;
    }

    attributes[0] = attribute;
    attributes[1] = NULL;

    return create_html_tag(HTML_TAG_TEXT, attributes, NULL);
}

void free_html_tag(HtmlTag* tag) {
    if (!tag) {
        return;
    }

    if (tag->attributes) {
        for (size_t i = 0; tag->attributes[i] != NULL; i++) {
            free(tag->attributes[i]->name);
            free(tag->attributes[i]->value);
            free(tag->attributes[i]);
        }

        free(tag->attributes);
    }

    if (tag->childrens) {
        for (size_t i = 0; tag->childrens[i] != NULL; i++) {
            free_html_tag(tag->childrens[i]);
        }

        free(tag->childrens);
    }

    free(tag);
}
