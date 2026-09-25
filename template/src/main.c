#include <stdlib.h>
#include <string.h>
#include "bride.h"

void change_text(void) {
    change("p", text("You clicked me!"));
}

int main(void) {
    ui(
        p(
            text("Hello, World!"),
            on_click(change_text)
        )
    );

    return 0;
}