//! Zig bindings for Bride.
//!
//! This is a thin, idiomatic port of the C high-level module
//! (`lib/c/bride/bhlm.h`): the HTML DSL builds a tag tree that the C library
//! renders, and `ui`/`change`/`append` commit it to the browser. Routing,
//! references, dispatch and the style builder all reuse the same C code the
//! other ports use, so the rendered output is identical.
//!
//! ```zig
//! const bride = @import("bride.zig");
//!
//! fn increment() void {
//!     count += 1;
//!     bride.change("#counter", bride.textf("Clicks: {d}", .{count}));
//! }
//!
//! pub fn main() void {
//!     bride.route("/", home);
//!     bride.route("/about", about);
//! }
//! ```
//!
//! Zig has no variadic user functions, so a tag with more than one argument
//! takes a tuple:
//!
//! ```zig
//! bride.ui(.{
//!     bride.h1(.{bride.text("Home")}),
//!     bride.button(.{
//!         bride.text("Increment"),
//!         bride.on_click(increment),
//!     }),
//! });
//! ```
//!
//! A single argument may be passed unwrapped: `bride.h1(bride.text("Home"))`.

const std = @import("std");

// ---------------------------------------------------------------------------
// C ABI
// ---------------------------------------------------------------------------

/// What an `Arg` carries. Matches the C `BrideArgType`.
pub const ArgType = enum(c_int) {
    html = 0,
    attr,
    event,
    style,
    end,
};

/// A single DSL argument. Matches the C `BrideArg`.
pub const Arg = extern struct {
    type: ArgType = .end,
    value: ?*anyopaque = null,
};

/// Matches the C `HtmlAttribute`.
pub const HtmlAttribute = extern struct {
    name: ?[*:0]u8,
    value: ?[*:0]u8,
};

/// A reusable set of CSS declarations. Matches the C `BrideStyle`.
pub const BrideStyle = extern struct {
    class_name: ?[*:0]u8 = null,
    body: ?[*:0]u8 = null,
};

/// A reference to an element, written by `ref`. Matches the C `BrideRef`.
pub const Ref = ?[*:0]u8;

/// The value a `Ref` holds before `ref` has assigned it.
pub const EMPTY_REF: Ref = null;

/// An event or page handler.
pub const Handler = *const fn () callconv(.c) void;

/// Matches the C `HtmlTag`.
pub const HtmlTag = extern struct {
    tag: HtmlTagType,
    attributes: ?[*]?*HtmlAttribute,
    childrens: ?[*]?*HtmlTag,
};

/// Matches the C `HtmlChildren`; owns the children array handed to a tag.
const Children = extern struct {
    data: ?[*]?*HtmlTag,
    size: usize,
    capacity: usize,
};

/// Matches the C `HtmlAttrs`; owns the attributes array handed to a tag.
const Attrs = extern struct {
    data: ?[*]?*HtmlAttribute,
    size: usize,
    capacity: usize,
};

// ---------------------------------------------------------------------------
// Core C library
// ---------------------------------------------------------------------------

extern fn create_html_tag(
    tag: HtmlTagType,
    attributes: ?[*]?*HtmlAttribute,
    childrens: ?[*]?*HtmlTag,
) ?*HtmlTag;
extern fn repr_html_tag(tag: ?*HtmlTag) ?[*:0]u8;
extern fn free_html_tag(tag: ?*HtmlTag) void;

extern fn children_init(children: *Children) void;
extern fn children_push(children: *Children, child: ?*HtmlTag) void;

extern fn attrs_init(attrs: *Attrs) void;
extern fn attrs_push(attrs: *Attrs, attribute: ?*HtmlAttribute) void;

extern fn commit(html: [*:0]const u8) void;
extern fn commit_at(query: [*:0]const u8, html: [*:0]const u8) void;
extern fn add_at(query: [*:0]const u8, html: [*:0]const u8) void;

// `route` would collide with the wrapper below, so the C symbol is bound here
// under a private name.
const c_route = @extern(
    *const fn ([*:0]const u8, Handler) callconv(.c) void,
    .{ .name = "route" },
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn isTuple(comptime T: type) bool {
    const info = @typeInfo(T);
    return info == .@"struct" and info.@"struct".is_tuple;
}

fn pushArg(children: *Children, attributes: *Attrs, arg: Arg) void {
    switch (arg.type) {
        .html => if (arg.value) |node| children_push(children, @ptrCast(@alignCast(node))),
        .attr => if (arg.value) |attribute| attrs_push(attributes, @ptrCast(@alignCast(attribute))),
        else => {},
    }
}

/// Collects `args` into a new element of `tag`. Accepts either a single `Arg`
/// or a tuple of them.
fn collect(comptime tag: HtmlTagType, args: anytype) ?*HtmlTag {
    var children: Children = undefined;
    children_init(&children);

    var attributes: Attrs = undefined;
    attrs_init(&attributes);

    if (comptime isTuple(@TypeOf(args))) {
        inline for (args) |arg| pushArg(&children, &attributes, arg);
    } else {
        pushArg(&children, &attributes, args);
    }

    return create_html_tag(tag, attributes.data, children.data);
}

fn argHtml(tag: ?*HtmlTag) Arg {
    return .{ .type = .html, .value = if (tag) |node| @ptrCast(node) else null };
}

fn commitTree(tree: ?*HtmlTag) void {
    const html = repr_html_tag(tree);
    if (html == null) return;

    commit(html.?);
    std.c.free(@ptrCast(html));
    free_html_tag(tree);
}

fn commitTreeAt(query: [*:0]const u8, tree: ?*HtmlTag) void {
    const html = repr_html_tag(tree);
    if (html == null) return;

    commit_at(query, html.?);
    std.c.free(@ptrCast(html));
    free_html_tag(tree);
}

fn appendTreeAt(query: [*:0]const u8, tree: ?*HtmlTag) void {
    const html = repr_html_tag(tree);
    if (html == null) return;

    add_at(query, html.?);
    std.c.free(@ptrCast(html));
    free_html_tag(tree);
}

/// Casts a handler to the C ABI. Accepts `fn () void` (plain Zig functions) and
/// `*const fn () void`.
fn toHandler(handler: anytype) Handler {
    return switch (@typeInfo(@TypeOf(handler))) {
        .@"fn" => @ptrCast(&handler),
        .pointer => @ptrCast(handler),
        else => @compileError("handler must be a function or a function pointer"),
    };
}

// ---------------------------------------------------------------------------
// Committing HTML
// ---------------------------------------------------------------------------

/// A query is either a string literal or a `Ref`; a null `Ref` matches nothing.
/// Unwrapping here lets `change(counter, ...)` work exactly as it does in C.
fn normalizeQuery(query: anytype) [*:0]const u8 {
    return switch (@typeInfo(@TypeOf(query))) {
        .optional => query orelse "",
        else => query,
    };
}

/// Renders `args` and replaces the application root.
pub fn ui(args: anytype) void {
    commitTree(collect(.fragment, args));
}

/// Renders `args` into the element matching `query`.
pub fn change(query: anytype, args: anytype) void {
    commitTreeAt(normalizeQuery(query), collect(.fragment, args));
}

/// Appends `args` to the element matching `query`.
pub fn append(query: anytype, args: anytype) void {
    appendTreeAt(normalizeQuery(query), collect(.fragment, args));
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

/// A text node.
pub extern fn text(value: [*:0]const u8) Arg;

/// A text node built from a format string, e.g.
/// `textf("Clicks: {d}", .{count})`.
pub fn textf(comptime format: []const u8, args: anytype) Arg {
    const formatted = std.heap.c_allocator.printSentinel(format, args, 0) catch
        return text("");

    defer std.heap.c_allocator.free(formatted);

    return text(formatted.ptr);
}

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

pub extern fn attr(name: [*:0]const u8, value: [*:0]const u8) Arg;
pub extern fn id(name: [*:0]const u8) Arg;
pub extern fn class_(name: [*:0]const u8) Arg;

pub extern fn href(value: [*:0]const u8) Arg;
pub extern fn src(value: [*:0]const u8) Arg;
pub extern fn alt(value: [*:0]const u8) Arg;
pub extern fn title(value: [*:0]const u8) Arg;
pub extern fn name(value: [*:0]const u8) Arg;
pub extern fn value(value: [*:0]const u8) Arg;
pub extern fn placeholder(value: [*:0]const u8) Arg;
pub extern fn for_(value: [*:0]const u8) Arg;
pub extern fn target(value: [*:0]const u8) Arg;
pub extern fn rel(value: [*:0]const u8) Arg;
pub extern fn role(value: [*:0]const u8) Arg;
pub extern fn width(value: [*:0]const u8) Arg;
pub extern fn height(value: [*:0]const u8) Arg;
pub extern fn tabindex(value: [*:0]const u8) Arg;
pub extern fn autocomplete(value: [*:0]const u8) Arg;
pub extern fn accept(value: [*:0]const u8) Arg;
pub extern fn min(value: [*:0]const u8) Arg;
pub extern fn max(value: [*:0]const u8) Arg;
pub extern fn step(value: [*:0]const u8) Arg;
pub extern fn pattern(value: [*:0]const u8) Arg;
pub extern fn rows(value: [*:0]const u8) Arg;
pub extern fn cols(value: [*:0]const u8) Arg;
pub extern fn method(value: [*:0]const u8) Arg;
pub extern fn form_action(value: [*:0]const u8) Arg;
pub extern fn enctype(value: [*:0]const u8) Arg;
pub extern fn loading(value: [*:0]const u8) Arg;
pub extern fn download(value: [*:0]const u8) Arg;

/// `type` is a Zig keyword, so the helper is spelled `type_`.
pub fn type_(attribute_value: [*:0]const u8) Arg {
    return attr("type", attribute_value);
}

// Boolean attribute helpers.
pub extern fn disabled() Arg;
pub extern fn checked() Arg;
pub extern fn selected() Arg;
pub extern fn required() Arg;
pub extern fn readonly() Arg;
pub extern fn multiple() Arg;
pub extern fn autofocus() Arg;
pub extern fn hidden() Arg;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

extern fn action(name: [*:0]const u8, handler: Handler) Arg;

pub fn on_click(handler: anytype) Arg {
    return action("click", toHandler(handler));
}
pub fn on_input(handler: anytype) Arg {
    return action("input", toHandler(handler));
}
pub fn on_change(handler: anytype) Arg {
    return action("change", toHandler(handler));
}
pub fn on_submit(handler: anytype) Arg {
    return action("submit", toHandler(handler));
}
pub fn on_focus(handler: anytype) Arg {
    return action("focus", toHandler(handler));
}
pub fn on_blur(handler: anytype) Arg {
    return action("blur", toHandler(handler));
}
pub fn on_keydown(handler: anytype) Arg {
    return action("keydown", toHandler(handler));
}
pub fn on_keyup(handler: anytype) Arg {
    return action("keyup", toHandler(handler));
}
pub fn on_keypress(handler: anytype) Arg {
    return action("keypress", toHandler(handler));
}
pub fn on_dblclick(handler: anytype) Arg {
    return action("dblclick", toHandler(handler));
}
pub fn on_mousedown(handler: anytype) Arg {
    return action("mousedown", toHandler(handler));
}
pub fn on_mouseup(handler: anytype) Arg {
    return action("mouseup", toHandler(handler));
}
pub fn on_mouseover(handler: anytype) Arg {
    return action("mouseover", toHandler(handler));
}
pub fn on_mouseout(handler: anytype) Arg {
    return action("mouseout", toHandler(handler));
}
pub fn on_mousemove(handler: anytype) Arg {
    return action("mousemove", toHandler(handler));
}
pub fn on_scroll(handler: anytype) Arg {
    return action("scroll", toHandler(handler));
}
pub fn on_load(handler: anytype) Arg {
    return action("load", toHandler(handler));
}
pub fn on_contextmenu(handler: anytype) Arg {
    return action("contextmenu", toHandler(handler));
}
pub fn on_wheel(handler: anytype) Arg {
    return action("wheel", toHandler(handler));
}

// ---------------------------------------------------------------------------
// Routing and references
// ---------------------------------------------------------------------------

/// Registers `handler` for `path`. See `docs/api-reference.md#routing`.
pub fn route(path: [*:0]const u8, handler: anytype) void {
    c_route(path, toHandler(handler));
}

/// Changes the current page from code.
pub extern fn navigate(path: [*:0]const u8) void;

/// Assigns a generated id to an element and stores its `#id` selector in
/// `reference`.
pub extern fn ref(reference: *Ref) Arg;

// ---------------------------------------------------------------------------
// Styling
// ---------------------------------------------------------------------------

/// Links an external stylesheet.
pub extern fn style_file(filename: [*:0]const u8) void;

// Generic declarations.
pub extern fn css(property: [*:0]const u8, value: [*:0]const u8) Arg;
pub extern fn raw_css(declarations: [*:0]const u8) Arg;

// Numeric declarations: rendered as `<value><unit>`.
pub extern fn padding(value: f64, unit: [*:0]const u8) Arg;
pub extern fn margin(value: f64, unit: [*:0]const u8) Arg;
pub extern fn gap(value: f64, unit: [*:0]const u8) Arg;
pub extern fn row_gap(value: f64, unit: [*:0]const u8) Arg;
pub extern fn column_gap(value: f64, unit: [*:0]const u8) Arg;
pub extern fn font_size(value: f64, unit: [*:0]const u8) Arg;
pub extern fn border_radius(value: f64, unit: [*:0]const u8) Arg;
pub extern fn letter_spacing(value: f64, unit: [*:0]const u8) Arg;
pub extern fn word_spacing(value: f64, unit: [*:0]const u8) Arg;
pub extern fn min_width(value: f64, unit: [*:0]const u8) Arg;
pub extern fn min_height(value: f64, unit: [*:0]const u8) Arg;
pub extern fn max_width(value: f64, unit: [*:0]const u8) Arg;
pub extern fn max_height(value: f64, unit: [*:0]const u8) Arg;
pub extern fn top(value: f64, unit: [*:0]const u8) Arg;
pub extern fn right(value: f64, unit: [*:0]const u8) Arg;
pub extern fn bottom(value: f64, unit: [*:0]const u8) Arg;
pub extern fn left(value: f64, unit: [*:0]const u8) Arg;

// String declarations.
pub extern fn background(value: [*:0]const u8) Arg;
pub extern fn color(value: [*:0]const u8) Arg;
pub extern fn opacity(value: [*:0]const u8) Arg;
pub extern fn display(value: [*:0]const u8) Arg;
pub extern fn position(value: [*:0]const u8) Arg;
pub extern fn overflow(value: [*:0]const u8) Arg;
pub extern fn cursor(value: [*:0]const u8) Arg;
pub extern fn z_index(value: [*:0]const u8) Arg;
pub extern fn font_family(value: [*:0]const u8) Arg;
pub extern fn font_style(value: [*:0]const u8) Arg;
pub extern fn font_weight(value: [*:0]const u8) Arg;
pub extern fn line_height(value: [*:0]const u8) Arg;
pub extern fn text_align(value: [*:0]const u8) Arg;
pub extern fn text_transform(value: [*:0]const u8) Arg;
pub extern fn text_decoration(value: [*:0]const u8) Arg;
pub extern fn text_shadow(value: [*:0]const u8) Arg;
pub extern fn white_space(value: [*:0]const u8) Arg;
pub extern fn word_break(value: [*:0]const u8) Arg;
pub extern fn border(value: [*:0]const u8) Arg;
pub extern fn outline(value: [*:0]const u8) Arg;
pub extern fn box_sizing(value: [*:0]const u8) Arg;
pub extern fn box_shadow(value: [*:0]const u8) Arg;
pub extern fn flex(value: [*:0]const u8) Arg;
pub extern fn flex_direction(value: [*:0]const u8) Arg;
pub extern fn flex_wrap(value: [*:0]const u8) Arg;
pub extern fn justify_content(value: [*:0]const u8) Arg;
pub extern fn align_items(value: [*:0]const u8) Arg;
pub extern fn align_content(value: [*:0]const u8) Arg;
pub extern fn align_self(value: [*:0]const u8) Arg;
pub extern fn grid_template_columns(value: [*:0]const u8) Arg;
pub extern fn grid_template_rows(value: [*:0]const u8) Arg;
pub extern fn transition(value: [*:0]const u8) Arg;
pub extern fn transform(value: [*:0]const u8) Arg;
pub extern fn filter(value: [*:0]const u8) Arg;
pub extern fn animation(value: [*:0]const u8) Arg;

extern fn __style_build(args: [*]Arg, count: c_int) BrideStyle;

/// Builds a reusable style from declarations, e.g.
/// `style(.{ padding(12, "px"), background("#1e1e2e") })`. The rule is injected
/// into `<head>` once and `apply` puts the generated class on an element.
pub fn style(args: anytype) BrideStyle {
    if (comptime isTuple(@TypeOf(args))) {
        var array: [args.len]Arg = undefined;
        inline for (args, 0..) |arg, index| array[index] = arg;

        return __style_build(&array, @intCast(array.len));
    } else {
        var array: [1]Arg = .{args};

        return __style_build(&array, 1);
    }
}

/// Puts a style's generated class on an element.
pub extern fn apply(style: BrideStyle) Arg;

/// Sets an inline `style` attribute. (The reusable builder is `style`.)
pub fn style_attr(declarations: [*:0]const u8) Arg {
    return attr("style", declarations);
}

/// The tag kinds, in the same order as `lib/c/bride/html/tags.def`.
pub const HtmlTagType = enum(c_int) {
    p = 0,
    text,
    fragment,
    button,
    a,
    div,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    span,
    strong,
    em,
    b,
    i,
    u,
    s,
    small,
    mark,
    code,
    pre,
    kbd,
    samp,
    @"var",
    cite,
    abbr,
    q,
    sub,
    sup,
    blockquote,
    address,
    time,
    del,
    ins,
    br,
    hr,
    wbr,
    section,
    article,
    header,
    footer,
    main,
    nav,
    aside,
    figure,
    figcaption,
    ul,
    ol,
    li,
    dl,
    dt,
    dd,
    details,
    summary,
    dialog,
    table,
    caption,
    thead,
    tbody,
    tfoot,
    tr,
    th,
    td,
    colgroup,
    col,
    img,
    picture,
    source,
    track,
    video,
    audio,
    canvas,
    iframe,
    embed,
    object,
    map,
    area,
    form,
    label,
    input,
    textarea,
    select,
    option,
    optgroup,
    fieldset,
    legend,
    datalist,
    output,
    progress,
    meter,
    template,
    slot,
};

// Tag builders. Each collects its arguments into an element. `text` is a
// text node and has its own definition above, so it is not generated here.

pub fn p(args: anytype) Arg {
    return argHtml(collect(.p, args));
}

pub fn fragment(args: anytype) Arg {
    return argHtml(collect(.fragment, args));
}

pub fn button(args: anytype) Arg {
    return argHtml(collect(.button, args));
}

pub fn a(args: anytype) Arg {
    return argHtml(collect(.a, args));
}

pub fn div_(args: anytype) Arg {
    return argHtml(collect(.div, args));
}

pub fn h1(args: anytype) Arg {
    return argHtml(collect(.h1, args));
}

pub fn h2(args: anytype) Arg {
    return argHtml(collect(.h2, args));
}

pub fn h3(args: anytype) Arg {
    return argHtml(collect(.h3, args));
}

pub fn h4(args: anytype) Arg {
    return argHtml(collect(.h4, args));
}

pub fn h5(args: anytype) Arg {
    return argHtml(collect(.h5, args));
}

pub fn h6(args: anytype) Arg {
    return argHtml(collect(.h6, args));
}

pub fn span(args: anytype) Arg {
    return argHtml(collect(.span, args));
}

pub fn strong(args: anytype) Arg {
    return argHtml(collect(.strong, args));
}

pub fn em(args: anytype) Arg {
    return argHtml(collect(.em, args));
}

pub fn b(args: anytype) Arg {
    return argHtml(collect(.b, args));
}

pub fn i(args: anytype) Arg {
    return argHtml(collect(.i, args));
}

pub fn u(args: anytype) Arg {
    return argHtml(collect(.u, args));
}

pub fn s(args: anytype) Arg {
    return argHtml(collect(.s, args));
}

pub fn small(args: anytype) Arg {
    return argHtml(collect(.small, args));
}

pub fn mark(args: anytype) Arg {
    return argHtml(collect(.mark, args));
}

pub fn code(args: anytype) Arg {
    return argHtml(collect(.code, args));
}

pub fn pre(args: anytype) Arg {
    return argHtml(collect(.pre, args));
}

pub fn kbd(args: anytype) Arg {
    return argHtml(collect(.kbd, args));
}

pub fn samp(args: anytype) Arg {
    return argHtml(collect(.samp, args));
}

pub fn var_(args: anytype) Arg {
    return argHtml(collect(.@"var", args));
}

pub fn cite(args: anytype) Arg {
    return argHtml(collect(.cite, args));
}

pub fn abbr(args: anytype) Arg {
    return argHtml(collect(.abbr, args));
}

pub fn q(args: anytype) Arg {
    return argHtml(collect(.q, args));
}

pub fn sub(args: anytype) Arg {
    return argHtml(collect(.sub, args));
}

pub fn sup(args: anytype) Arg {
    return argHtml(collect(.sup, args));
}

pub fn blockquote(args: anytype) Arg {
    return argHtml(collect(.blockquote, args));
}

pub fn address(args: anytype) Arg {
    return argHtml(collect(.address, args));
}

pub fn time_(args: anytype) Arg {
    return argHtml(collect(.time, args));
}

pub fn del(args: anytype) Arg {
    return argHtml(collect(.del, args));
}

pub fn ins(args: anytype) Arg {
    return argHtml(collect(.ins, args));
}

pub fn br(args: anytype) Arg {
    return argHtml(collect(.br, args));
}

pub fn hr(args: anytype) Arg {
    return argHtml(collect(.hr, args));
}

pub fn wbr(args: anytype) Arg {
    return argHtml(collect(.wbr, args));
}

pub fn section(args: anytype) Arg {
    return argHtml(collect(.section, args));
}

pub fn article(args: anytype) Arg {
    return argHtml(collect(.article, args));
}

pub fn header(args: anytype) Arg {
    return argHtml(collect(.header, args));
}

pub fn footer(args: anytype) Arg {
    return argHtml(collect(.footer, args));
}

pub fn main_(args: anytype) Arg {
    return argHtml(collect(.main, args));
}

pub fn nav(args: anytype) Arg {
    return argHtml(collect(.nav, args));
}

pub fn aside(args: anytype) Arg {
    return argHtml(collect(.aside, args));
}

pub fn figure(args: anytype) Arg {
    return argHtml(collect(.figure, args));
}

pub fn figcaption(args: anytype) Arg {
    return argHtml(collect(.figcaption, args));
}

pub fn ul(args: anytype) Arg {
    return argHtml(collect(.ul, args));
}

pub fn ol(args: anytype) Arg {
    return argHtml(collect(.ol, args));
}

pub fn li(args: anytype) Arg {
    return argHtml(collect(.li, args));
}

pub fn dl(args: anytype) Arg {
    return argHtml(collect(.dl, args));
}

pub fn dt(args: anytype) Arg {
    return argHtml(collect(.dt, args));
}

pub fn dd(args: anytype) Arg {
    return argHtml(collect(.dd, args));
}

pub fn details(args: anytype) Arg {
    return argHtml(collect(.details, args));
}

pub fn summary(args: anytype) Arg {
    return argHtml(collect(.summary, args));
}

pub fn dialog(args: anytype) Arg {
    return argHtml(collect(.dialog, args));
}

pub fn table(args: anytype) Arg {
    return argHtml(collect(.table, args));
}

pub fn caption(args: anytype) Arg {
    return argHtml(collect(.caption, args));
}

pub fn thead(args: anytype) Arg {
    return argHtml(collect(.thead, args));
}

pub fn tbody(args: anytype) Arg {
    return argHtml(collect(.tbody, args));
}

pub fn tfoot(args: anytype) Arg {
    return argHtml(collect(.tfoot, args));
}

pub fn tr(args: anytype) Arg {
    return argHtml(collect(.tr, args));
}

pub fn th(args: anytype) Arg {
    return argHtml(collect(.th, args));
}

pub fn td(args: anytype) Arg {
    return argHtml(collect(.td, args));
}

pub fn colgroup(args: anytype) Arg {
    return argHtml(collect(.colgroup, args));
}

pub fn col(args: anytype) Arg {
    return argHtml(collect(.col, args));
}

pub fn img(args: anytype) Arg {
    return argHtml(collect(.img, args));
}

pub fn picture(args: anytype) Arg {
    return argHtml(collect(.picture, args));
}

pub fn source(args: anytype) Arg {
    return argHtml(collect(.source, args));
}

pub fn track(args: anytype) Arg {
    return argHtml(collect(.track, args));
}

pub fn video(args: anytype) Arg {
    return argHtml(collect(.video, args));
}

pub fn audio(args: anytype) Arg {
    return argHtml(collect(.audio, args));
}

pub fn canvas(args: anytype) Arg {
    return argHtml(collect(.canvas, args));
}

pub fn iframe(args: anytype) Arg {
    return argHtml(collect(.iframe, args));
}

pub fn embed(args: anytype) Arg {
    return argHtml(collect(.embed, args));
}

pub fn object(args: anytype) Arg {
    return argHtml(collect(.object, args));
}

pub fn map_(args: anytype) Arg {
    return argHtml(collect(.map, args));
}

pub fn area(args: anytype) Arg {
    return argHtml(collect(.area, args));
}

pub fn form(args: anytype) Arg {
    return argHtml(collect(.form, args));
}

pub fn label(args: anytype) Arg {
    return argHtml(collect(.label, args));
}

pub fn input(args: anytype) Arg {
    return argHtml(collect(.input, args));
}

pub fn textarea(args: anytype) Arg {
    return argHtml(collect(.textarea, args));
}

pub fn select_(args: anytype) Arg {
    return argHtml(collect(.select, args));
}

pub fn option(args: anytype) Arg {
    return argHtml(collect(.option, args));
}

pub fn optgroup(args: anytype) Arg {
    return argHtml(collect(.optgroup, args));
}

pub fn fieldset(args: anytype) Arg {
    return argHtml(collect(.fieldset, args));
}

pub fn legend(args: anytype) Arg {
    return argHtml(collect(.legend, args));
}

pub fn datalist(args: anytype) Arg {
    return argHtml(collect(.datalist, args));
}

pub fn output(args: anytype) Arg {
    return argHtml(collect(.output, args));
}

pub fn progress(args: anytype) Arg {
    return argHtml(collect(.progress, args));
}

pub fn meter(args: anytype) Arg {
    return argHtml(collect(.meter, args));
}

pub fn template_(args: anytype) Arg {
    return argHtml(collect(.template, args));
}

pub fn slot(args: anytype) Arg {
    return argHtml(collect(.slot, args));
}
