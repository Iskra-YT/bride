#include "bride.h"

int count = 0;

void increment(void) {
    count++;
    change("#counter", textf("Clicks: %d", count));
}

void main_page(void) {
    // Building a reusable style on every render is cheap: identical
    // declarations reuse the same class and inject the rule into <head> once.
    BrideStyle style_counter = style(
        background("#1e1e2e"),
        color("#cdd6f4"),
        padding(12, "px"),
        border_radius(8, "px")
    );

    ui(
        h1(text("Home")),
        p(
            id("counter"),
            apply(style_counter),
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