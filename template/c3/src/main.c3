module main;

import bride::c3;

int count = 0;

fn void increment()
{
    count++;
    c3::change("#counter", c3::textf("Clicks: %d", count));
}

fn void main()
{
    c3::ui(
        c3::p(
            c3::id("counter"),
            c3::textf("Clicks: %d", count)
        ),
        c3::button(
            c3::text("Increment"),
            c3::on_click(&increment)
        )
    );
}
