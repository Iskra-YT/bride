#include "bride.hpp"

int count = 0;

void increment(void) {
    count++;
    bride::change("#counter", bride::textf("Clicks: %d", count));
}

int main(void) {
    bride::ui(
        bride::p(
            bride::id("counter"),
            bride::textf("Clicks: %d", count)
        ),
        bride::button(
            bride::text("Increment"),
            bride::on_click(increment)
        )
    );
}