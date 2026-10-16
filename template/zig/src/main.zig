const bride = @import("bride");

var count: usize = 0;

fn increment() void {
    count += 1;
    bride.change("#counter", bride.textf("Clicks: {d}", .{count}));
}

fn home_page() void {
    // Building a reusable style on every render is cheap: identical
    // declarations reuse the same class and inject the rule into <head> once.
    const counter_style = bride.style(.{
        bride.background("#1e1e2e"),
        bride.color("#cdd6f4"),
        bride.padding(12, "px"),
        bride.border_radius(8, "px"),
    });

    bride.ui(.{
        bride.h1(.{bride.text("Home")}),
        bride.p(.{
            bride.id("counter"),
            bride.apply(counter_style),
            bride.textf("Clicks: {d}", .{count}),
        }),
        bride.button(.{
            bride.text("Increment"),
            bride.on_click(increment),
        }),
        bride.nav(.{
            bride.a(.{ bride.href("/about"), bride.text("About") }),
        }),
    });
}

fn about_page() void {
    bride.ui(.{
        bride.h1(.{bride.text("About")}),
        bride.p(.{bride.text("Bride example app.")}),
        bride.nav(.{
            bride.a(.{ bride.href("/"), bride.text("Home") }),
        }),
    });
}

pub fn main() void {
    bride.route("/", home_page);
    bride.route("/about", about_page);
}
