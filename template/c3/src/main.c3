module main;

import bride;

int count = 0;

fn void increment()
{
    count++;
    bride::change("#counter", bride::textf("Clicks: %d", count));
}

fn void main()
{
    bride::ui(
        bride::p(
            bride::id("counter"),
            bride::textf("Clicks: %d", count)
        ),
        bride::button(
            bride::text("Increment"),
            bride::on_click(&increment)
        )
    );
}
