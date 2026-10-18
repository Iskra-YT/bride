#include "bride.hpp"

int count = 0;

void increment(void) {
    count++;
    bride::change("#counter", bride::textf("Clicks: %d", count));
}

void home_page(void) {
    const auto counter_style = bride::style(
        bride::background("#1e1e2e"),
        bride::color("#cdd6f4"),
        bride::padding(12, "px"),
        bride::border_radius(8, "px")
    );

    bride::ui(
        bride::h1(
            bride::text("Home")
        ),
        bride::p(
            bride::id("counter"),
            bride::apply(counter_style),
            bride::textf("Clicks: %d", count)
        ),
        bride::button(
            bride::text("Increment"),
            bride::on_click(increment)
        ),
        bride::nav(
            bride::a(bride::href("/about"), bride::text("About"))
        )
    );
}

void about_page(void) {
    bride::ui(
        bride::h1(
            bride::text("About")
        ),
        bride::p(
            bride::text("Bride example app.")
        ),
        bride::nav(
            bride::a(bride::href("/"), bride::text("Home"))
        )
    );
}

int main(void) {
    bride::route("/", home_page);
    bride::route("/about", about_page);
    return 0;
}