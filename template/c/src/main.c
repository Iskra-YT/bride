#include "bride.h"

int count = 0;

void increment(void) {
    count++;
    change("#counter", textf("Clicks: %d", count));
}

void main_page(void) {
    ui(
        h1(text("Home")),
        p(
            id("counter"),
            textf("Clicks: %d", count)
        ),
        button(
            text("Increment"),
            on_click(increment)
        ),
        nav(
            a(href("/about"), text("About"))
        )
    );
}

void about_page(void) {
    ui(
        h1(text("About")),
        p(text("Bride example app.")),
        nav(
            a(href("/"), text("Home"))
        )
    );
}

int main(void) {
    route("/", main_page);
    route("/about", about_page);
    return 0;
}