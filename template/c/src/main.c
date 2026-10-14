#include "bride.h"

int count = 0;

void increment(void) {
    count++;
    change("#counter", textf("Clicks: %d", count));
}

void main_page(void) {
    ui(
        p(
            id("counter"),
            textf("Clicks: %d", count)
        ),
        button(
            text("Increment"),
            on_click(increment)
        )
    );
}

int main(void) {
    route("/", main_page);
    return 0;
}