// Native test for the style builder. The runtime imports are stubbed so the
// rendered HTML can be inspected without a browser.
//
// Build and run through `tests/native/style.test.js` (gcc/cc/clang).

#include <stdio.h>
#include <string.h>

#ifdef __cplusplus
#include "bride.hpp"
#define BRIDE_TEST_LINKAGE extern "C"
#else
#include "bride.h"
#define BRIDE_TEST_LINKAGE
#endif

static int failures = 0;

static void check(int condition, const char* label, const char* actual) {
    if (condition) {
        printf("  ok   %s\n", label);
        return;
    }

    printf("  FAIL %s\n       got: %s\n", label, actual ? actual : "(null)");
    failures++;
}

static void check_equals(const char* actual, const char* expected, const char* label) {
    if (actual && strcmp(actual, expected) == 0) {
        printf("  ok   %s\n", label);
        return;
    }

    printf("  FAIL %s\n       got:      %s\n       expected: %s\n", label, actual ? actual : "(null)", expected);
    failures++;
}

// --- runtime stubs ---------------------------------------------------------

static char committed[1024];
static char appended_query[64];
static char appended[1024];

BRIDE_TEST_LINKAGE void __commit(const char* html, int length) {
    (void)length;
    snprintf(committed, sizeof(committed), "%s", html);
}

BRIDE_TEST_LINKAGE void __commit_at(const char* query, int query_length, const char* html, int length) {
    (void)query;
    (void)query_length;
    (void)length;
    snprintf(committed, sizeof(committed), "%s", html);
}

BRIDE_TEST_LINKAGE void __add_at(const char* query, int query_length, const char* html, int length) {
    (void)query_length;
    (void)length;
    snprintf(appended_query, sizeof(appended_query), "%s", query);
    snprintf(appended, sizeof(appended), "%s", html);
}

BRIDE_TEST_LINKAGE void __route(const char* path, int length, int handler) {
    (void)path;
    (void)length;
    (void)handler;
}

BRIDE_TEST_LINKAGE void __navigate(const char* path, int length) {
    (void)path;
    (void)length;
}

// --- tests -----------------------------------------------------------------

static const char* BUTTON_RULE =
    "<style>.bride-style-1{padding:12px;background:#1e1e2e;color:#cdd6f4;}</style>";

int main(void) {
    // A style becomes a class plus a rule appended to <head> with add_at.
    BrideStyle button_style = style(
        padding(12, "px"),
        background("#1e1e2e"),
        color("#cdd6f4")
    );

    check_equals(button_style.class_name, "bride-style-1", "the first style gets class bride-style-1");
    check_equals(button_style.body, "padding:12px;background:#1e1e2e;color:#cdd6f4;", "declarations are compiled in order");
    check_equals(appended_query, "head", "the rule is appended to head");
    check_equals(appended, BUTTON_RULE, "the rule is injected as a style element");

    // apply() stamps the class on an element.
    ui(button(text("Click me"), apply(button_style)));
    check_equals(committed, "<button class=\"bride-style-1\">Click me</button>", "apply() sets the class attribute");

    // Identical declarations reuse the class instead of piling up rules.
    BrideStyle again = style(
        padding(12, "px"),
        background("#1e1e2e"),
        color("#cdd6f4")
    );

    check_equals(again.class_name, "bride-style-1", "identical declarations reuse the class");
    check_equals(appended, BUTTON_RULE, "no second rule is injected for an identical style");

    // A different style gets its own class.
    BrideStyle danger = style(
        background("#f38ba8"),
        color("#1e1e2e")
    );

    check_equals(danger.class_name, "bride-style-2", "a new style gets the next class name");
    check_equals(appended, "<style>.bride-style-2{background:#f38ba8;color:#1e1e2e;}</style>", "the second rule is injected");

    // A class attribute and apply(...) are merged into one class attribute.
    // (`attr` is used instead of `class`/`class_` so this file compiles as both
    // C and C++.)
    ui(div_(attr("class", "card"), apply(button_style), text("Styled")));
    check_equals(committed, "<div class=\"card bride-style-1\">Styled</div>", "class attribute and apply() merge");

#ifndef __cplusplus
    // `class(...)` is the C spelling; C++ and C3 use `class_`.
    ui(div_(class("panel"), apply(danger), text("Panel")));
    check_equals(committed, "<div class=\"panel bride-style-2\">Panel</div>", "class() and apply() merge");
#endif

    // Several styles stack.
    ui(button(apply(button_style), apply(danger), text("Both")));
    check_equals(committed, "<button class=\"bride-style-1 bride-style-2\">Both</button>", "apply() twice stacks the classes");

    // Numeric helpers format their value, string helpers pass it through.
    BrideStyle typography = style(
        font_size(1.5, "rem"),
        letter_spacing(0.05, "em"),
        line_height("1.4"),
        font_weight("600")
    );

    check_equals(typography.body, "font-size:1.5rem;letter-spacing:0.05em;line-height:1.4;font-weight:600;", "numeric and string declarations format correctly");

    // Attribute helpers and css() work inside style().
    BrideStyle box = style(
        width("100%"),
        css("max-width", "40ch"),
        display("flex"),
        gap(8, "px"),
        attr("--brand", "#89b4fa")
    );

    check_equals(box.body, "width:100%;max-width:40ch;display:flex;gap:8px;--brand:#89b4fa;", "width(), css() and attr() are declarations inside style()");

    // raw_css() splices declarations verbatim; empty ones are dropped.
    BrideStyle raw = style(raw_css("padding:1rem;color:red"));
    check_equals(raw.body, "padding:1rem;color:red;", "raw_css() is spliced verbatim");

    BrideStyle empty = style(raw_css(""));
    check(empty.class_name == NULL, "a style with no declarations builds nothing", empty.class_name);

    // A bare string still sets the inline style attribute.
    ui(div_(style("padding: 1rem; color: red"), text("Inline")));
    check_equals(committed, "<div style=\"padding: 1rem; color: red\">Inline</div>", "style(\"...\") sets the inline style attribute");

    // apply() on an empty style is a no-op.
    ui(button(apply(empty), text("Plain")));
    check_equals(committed, "<button>Plain</button>", "apply() of an empty style renders nothing");

    // Declarations used outside style() are ignored (not rendered as attributes).
    ui(button(padding(12, "px"), text("Ignored")));
    check_equals(committed, "<button>Ignored</button>", "declarations outside style() are ignored");

#ifdef __cplusplus
    // C++ reaches the styling API through the bride:: namespace.
    bride::BrideStyle namespaced = bride::style(
        bride::padding(4, "px"),
        bride::css("color", "red")
    );

    check_equals(namespaced.body, "padding:4px;color:red;", "bride::style() builds a style");

    char expected[256];
    snprintf(expected, sizeof(expected), "<button class=\"%s\">Namespaced</button>", namespaced.class_name);

    ui(bride::button(bride::text("Namespaced"), bride::apply(namespaced)));
    check_equals(committed, expected, "bride::apply() sets the class");
#endif

    if (failures > 0) {
        printf("\n%d check(s) failed.\n", failures);
        return 1;
    }

    printf("\nAll style checks passed.\n");

    return 0;
}
