// Native checks for the Zig bindings of the style builder. The bindings delegate
// the real work to the C library, so this verifies the Zig-visible API, the
// struct layout it relies on, and the rendered/injected markup.
//
// Compiled together with `lib/zig/bride.zig` and linked against the native build
// of the C library (see tests/native/style.test.js).

const std = @import("std");
const bride = @import("bride");

var failures: usize = 0;

var committed: [1024]u8 = undefined;
var committed_len: usize = 0;

var appended_query: [64]u8 = undefined;
var appended_query_len: usize = 0;

var appended: [1024]u8 = undefined;
var appended_len: usize = 0;

var routed_path: [64]u8 = undefined;
var routed_path_len: usize = 0;
var routed_handler: ?bride.Handler = null;

var navigated_path: [64]u8 = undefined;
var navigated_path_len: usize = 0;

fn copyInto(dest: []u8, length: *usize, source: [*:0]const u8) void {
    const slice = std.mem.span(source);
    const n = @min(slice.len, dest.len);
    @memcpy(dest[0..n], slice[0..n]);
    length.* = n;
}

// The runtime imports the C library calls through these symbols; defining them
// here lets the test run without a browser.

export fn __commit(html: [*:0]const u8, length: c_int) void {
    _ = length;
    copyInto(&committed, &committed_len, html);
}

export fn __commit_at(query: [*:0]const u8, query_length: c_int, html: [*:0]const u8, length: c_int) void {
    _ = query;
    _ = query_length;
    _ = length;
    copyInto(&committed, &committed_len, html);
}

export fn __add_at(query: [*:0]const u8, query_length: c_int, html: [*:0]const u8, length: c_int) void {
    _ = query_length;
    _ = length;
    copyInto(&appended_query, &appended_query_len, query);
    copyInto(&appended, &appended_len, html);
}

export fn __route(path: [*:0]const u8, length: c_int, handler: c_int) void {
    _ = length;
    _ = handler;
    copyInto(&routed_path, &routed_path_len, path);
}

export fn __navigate(path: [*:0]const u8, length: c_int) void {
    _ = length;
    copyInto(&navigated_path, &navigated_path_len, path);
}

fn committedSlice() []const u8 {
    return committed[0..committed_len];
}

fn appendedSlice() []const u8 {
    return appended[0..appended_len];
}

fn routedPathSlice() []const u8 {
    return routed_path[0..routed_path_len];
}

fn navigatedPathSlice() []const u8 {
    return navigated_path[0..navigated_path_len];
}

fn checkEquals(actual: []const u8, expected: []const u8, label: []const u8) void {
    if (std.mem.eql(u8, actual, expected)) {
        std.debug.print("  ok   {s}\n", .{label});
        return;
    }

    failures += 1;
    std.debug.print("  FAIL {s}\n       got:      {s}\n       expected: {s}\n", .{ label, actual, expected });
}

fn check(condition: bool, label: []const u8) void {
    if (condition) {
        std.debug.print("  ok   {s}\n", .{label});
        return;
    }

    failures += 1;
    std.debug.print("  FAIL {s}\n", .{label});
}

var count: usize = 0;

fn increment() void {
    count += 1;
}

fn home() void {
    bride.ui(bride.h1(.{bride.text("Home")}));
}

fn about() void {
    bride.ui(bride.h1(.{bride.text("About")}));
}

pub fn main() void {
    std.debug.print("Zig style checks\n", .{});

    // A style becomes a class plus a rule appended to <head> with add_at.
    const button_style = bride.style(.{
        bride.padding(12, "px"),
        bride.background("#1e1e2e"),
        bride.color("#cdd6f4"),
    });

    checkEquals(
        std.mem.span(button_style.class_name orelse ""),
        "bride-style-1",
        "style() assigns a class",
    );
    checkEquals(
        std.mem.span(button_style.body orelse ""),
        "padding:12px;background:#1e1e2e;color:#cdd6f4;",
        "style() builds the rule body",
    );
    checkEquals(
        appended_query[0..appended_query_len],
        "head",
        "the rule is injected into <head>",
    );
    checkEquals(
        appendedSlice(),
        "<style>.bride-style-1{padding:12px;background:#1e1e2e;color:#cdd6f4;}</style>",
        "the rule markup is injected",
    );

    // apply() stamps the class on an element.
    bride.ui(.{ bride.button(.{ bride.text("Click me"), bride.apply(button_style) }) });
    checkEquals(
        committedSlice(),
        "<button class=\"bride-style-1\">Click me</button>",
        "apply() puts the class on the element",
    );

    // Identical declarations reuse the class instead of piling up rules.
    const again = bride.style(.{
        bride.padding(12, "px"),
        bride.background("#1e1e2e"),
        bride.color("#cdd6f4"),
    });
    checkEquals(
        std.mem.span(again.class_name orelse ""),
        "bride-style-1",
        "identical declarations reuse a class",
    );

    // A different style gets its own class and rule.
    const danger = bride.style(.{
        bride.background("#f38ba8"),
        bride.color("#1e1e2e"),
    });
    checkEquals(std.mem.span(danger.class_name orelse ""), "bride-style-2", "a different style gets a new class");
    checkEquals(
        appendedSlice(),
        "<style>.bride-style-2{background:#f38ba8;color:#1e1e2e;}</style>",
        "each style injects its own rule",
    );

    // class attribute and apply() merge into one class attribute.
    bride.ui(.{bride.div_(
        .{ bride.attr("class", "card"), bride.apply(button_style), bride.text("Styled") },
    )});
    checkEquals(
        committedSlice(),
        "<div class=\"card bride-style-1\">Styled</div>",
        "apply() merges with a plain class attribute",
    );

    // class_() merges with apply() too.
    bride.ui(.{bride.div_(
        .{ bride.class_("panel"), bride.apply(danger), bride.text("Panel") },
    )});
    checkEquals(
        committedSlice(),
        "<div class=\"panel bride-style-2\">Panel</div>",
        "class_() and apply() merge",
    );

    // Numeric helpers format their value; string helpers pass it through.
    const typography = bride.style(.{
        bride.font_size(1.5, "rem"),
        bride.letter_spacing(0.05, "em"),
        bride.line_height("1.4"),
        bride.font_weight("600"),
    });
    checkEquals(
        std.mem.span(typography.body orelse ""),
        "font-size:1.5rem;letter-spacing:0.05em;line-height:1.4;font-weight:600;",
        "numeric and string declarations format correctly",
    );

    // Attribute helpers and css() work inside style().
    const box = bride.style(.{
        bride.width("100%"),
        bride.css("max-width", "40ch"),
        bride.display("flex"),
        bride.gap(8, "px"),
        bride.attr("--brand", "#89b4fa"),
    });
    checkEquals(
        std.mem.span(box.body orelse ""),
        "width:100%;max-width:40ch;display:flex;gap:8px;--brand:#89b4fa;",
        "width(), css() and attr() are declarations inside style()",
    );

    // raw_css() splices declarations verbatim; empty ones are dropped.
    const raw = bride.style(.{bride.raw_css("padding:1rem;color:red")});
    checkEquals(std.mem.span(raw.body orelse ""), "padding:1rem;color:red;", "raw_css() is spliced verbatim");

    const empty = bride.style(.{bride.raw_css("")});
    check(empty.class_name == null, "a style with no declarations builds nothing");

    // An inline style attribute has its own name in Zig.
    bride.ui(.{bride.div_(.{
        bride.style_attr("padding: 1rem; color: red"),
        bride.text("Inline"),
    })});
    checkEquals(
        committedSlice(),
        "<div style=\"padding: 1rem; color: red\">Inline</div>",
        "style_attr() renders an inline style attribute",
    );

    // apply() of an empty style renders nothing.
    bride.ui(.{bride.button(.{ bride.apply(empty), bride.text("Plain") })});
    checkEquals(committedSlice(), "<button>Plain</button>", "apply() of an empty style renders nothing");

    // textf() formats with Zig's std.fmt.
    count = 3;
    bride.ui(.{bride.p(.{ bride.id("counter"), bride.textf("Clicks: {d}", .{count}) })});
    checkEquals(committedSlice(), "<p id=\"counter\">Clicks: 3</p>", "textf() builds a formatted text node");

    // An event handler registers with the dispatch table.
    bride.ui(.{bride.button(.{ bride.text("Increment"), bride.on_click(increment) })});
    check(
        std.mem.indexOf(u8, committedSlice(), "Bride.dispatch(") != null,
        "on_click() registers a dispatch handler",
    );

    // A lone argument may be passed unwrapped.
    bride.ui(bride.h1(bride.text("Lone")));
    checkEquals(committedSlice(), "<h1>Lone</h1>", "a tag accepts a single unwrapped argument");

    // Routing registers a path and handler.
    var counter: bride.Ref = bride.EMPTY_REF;
    bride.route("/", home);
    bride.route("/about", about);
    checkEquals(routedPathSlice(), "/about", "route() forwards the path to the runtime");

    // navigate() forwards the path.
    bride.navigate("/about");
    checkEquals(navigatedPathSlice(), "/about", "navigate() forwards the path to the runtime");

    // ref() assigns a selector.
    bride.ui(.{bride.p(.{
        bride.ref(&counter),
        bride.text("Ref"),
    })});
    if (counter) |selector| check(selector[0] == '#', "ref() writes a #id selector");
    checkEquals(committedSlice(), "<p id=\"1\">Ref</p>", "ref() sets the bare id on the element");

    if (failures > 0) {
        std.debug.print("\n{d} Zig style check(s) failed.\n", .{failures});
        std.process.exit(1);
    }

    std.debug.print("\nAll Zig style checks passed.\n", .{});
}
