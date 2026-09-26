#include "bride.h"
#include <string.h>

int count = 0;

void increment(void) {
    count++;
    change("#counter", textf("%d", count));
}

int main(void) {
    ui(
        text("Clicks:"),
        p(
            id("counter"),
            text("0")
        ),
        button(
            text("Increment"),
            on_click(increment)
        )
    );
}