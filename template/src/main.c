#include <stdlib.h>
#include <string.h>
#include "bride.h"

void changeText(void) {
    commit_at("p", "Clicked");
}

int main(void) {
    dispatch_init();

    HTML_TO_CHILDREN(children, create_text_tag("Hello, World from C!"));
    HtmlTag* paragraph = create_p_tag(children);

    HTML_TO_CHILDREN(children_clickable, paragraph);
    HtmlTag* clickable = create_clickable_tag(children_clickable, changeText);
    commit(repr_html_tag(clickable));

    return 0;
}