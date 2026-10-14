module main;

import bride;

int count = 0;

fn void increment()
{
    count++;
    bride::change("#counter", bride::textf("Clicks: %d", count));
}

fn void home_page()
{
    bride::ui(
        bride::h1(
            bride::text("Home")
        ),
        bride::p(
            bride::id("counter"),
            bride::textf("Clicks: %d", count)
        ),
        bride::button(
            bride::text("Increment"),
            bride::on_click(&increment)
        ),
        bride::nav(
            bride::a(bride::href("/about"), bride::text("About"))
        )
    );
}

fn void about_page()
{
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

fn void main()
{
    bride::route("/", &home_page);
    bride::route("/about", &about_page);
}
