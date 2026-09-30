#ifndef BRIDE_TAG_HTML_H
#define BRIDE_TAG_HTML_H

#include <stdbool.h>
#include <stddef.h>

typedef enum HtmlTagType {
#define BRIDE_TAG(id, name, html_name, kind) HTML_TAG_##id,
#include "./tags.def"
#undef BRIDE_TAG

    HTML_TAG_COUNT
} HtmlTagType;

typedef struct HtmlAttribute {
    char* name;
    char* value;
} HtmlAttribute;

typedef struct HtmlTag {
    HtmlTagType tag;
    HtmlAttribute** attributes;
    struct HtmlTag** childrens;
} HtmlTag;

typedef struct HtmlBuffer {
    char* data;
    size_t length;
    size_t capacity;
} HtmlBuffer;

void html_buffer_init(HtmlBuffer* buffer);
void html_buffer_free(HtmlBuffer* buffer);
bool html_buffer_append(HtmlBuffer* buffer, const char* text);
bool html_buffer_append_n(HtmlBuffer* buffer, const char* text, size_t length);
bool html_buffer_append_char(HtmlBuffer* buffer, char character);

char* html_buffer_take(HtmlBuffer* buffer);

bool repr_html_attributes(HtmlTag* tag, HtmlBuffer* buffer);
bool repr_html_children(HtmlTag* tag, HtmlBuffer* buffer);

HtmlTag* create_html_tag(HtmlTagType tag, HtmlAttribute** attributes, HtmlTag** childrens);
char* repr_html_tag(HtmlTag* tag);
void free_html_tag(HtmlTag* tag);

#define BRIDE_CREATE_TEXT(id, name)
#define BRIDE_CREATE_ELEMENT(id, name) \
    HtmlTag* create_##name##_tag(HtmlTag** childrens, HtmlAttribute** attributes);
#define BRIDE_CREATE_FRAGMENT(id, name) BRIDE_CREATE_ELEMENT(id, name)

#define BRIDE_TAG(id, name, html_name, kind) BRIDE_CREATE_##kind(id, name)
#include "./tags.def"
#undef BRIDE_TAG

#undef BRIDE_CREATE_TEXT
#undef BRIDE_CREATE_ELEMENT
#undef BRIDE_CREATE_FRAGMENT

HtmlTag* create_text_tag(const char* text);

#endif // BRIDE_TAG_HTML_H
