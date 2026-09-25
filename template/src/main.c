#include <stdlib.h>
#include <string.h>
#include "bride.h"
#include "bride/html/tag.h"

int main(void) {
    HtmlTag* children[2];
    children[0] = create_text_tag("Hello from C!");
    children[1] = NULL;

    HtmlTag* paragraph = create_p_tag(children);
    commit(repr_html_tag(paragraph));

    free_html_tag(paragraph);

    return 0;
}