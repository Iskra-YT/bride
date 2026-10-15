// Native checks for the C3 bindings of the style builder. The bindings delegate
// the real work to the C library, so this verifies the C3-visible API, the
// struct layout it relies on, and the injected markup.
//
// Compiled together with lib/bride.c3 (module `bride`) and linked against the
// native build of the C library.
module style_test;

import bride;
import libc;

int failures;

// The runtime imports the C library calls through these symbols, so defining
// them here lets the test run without a browser.
char* committed;
char* appended_query;
char* appended;

// The templates keep their styles in a module-level variable assigned in main,
// so the test does the same.
bride::BrideStyle button_style;

fn void capture(char** target, char* value)
{
	if (value == null) return;

	usz length = cstr_len(value);
	char* copy = (char*)libc::malloc((usz)(length + 1));

	if (copy == null) return;

	libc::memcpy((void*)copy, (void*)value, length + 1);

	if (*target != null) libc::free((void*)*target);

	*target = copy;
}

// `ZString` is distinct from `char*`, so the C string helpers need a cast.
fn usz cstr_len(char* value) => libc::strlen((ZString)value);

fn int cstr_cmp(char* left, char* right) => libc::strcmp((ZString)left, (ZString)right);

fn void __commit(char* html, int length) @export("__commit")
{
	(void)length;
	capture(&committed, html);
}

fn void __commit_at(char* query, int query_length, char* html, int length) @export("__commit_at")
{
	(void)query;
	(void)query_length;
	(void)length;
	capture(&committed, html);
}

fn void __add_at(char* query, int query_length, char* html, int length) @export("__add_at")
{
	(void)query_length;
	(void)length;
	capture(&appended_query, query);
	capture(&appended, html);
}

fn void __route(char* path, int length, int handler) @export("__route")
{
	(void)path;
	(void)length;
	(void)handler;
}

fn void __navigate(char* path, int length) @export("__navigate")
{
	(void)path;
	(void)length;
}

fn void check(bool ok, char* label, char* details)
{
	if (ok)
	{
		libc::printf("  ok   %s\n", label);
		return;
	}

	failures++;
	libc::printf("  FAIL %s\n", label);

	if (details != null) libc::printf("       got: %s\n", details);
}

fn void check_equals(char* actual, char* expected, char* label)
{
	bool equal = actual != null && cstr_cmp(actual, expected) == 0;

	check(equal, label, actual);

	if (!equal) libc::printf("       expected: %s\n", expected);
}

fn void main()
{
	libc::printf("C3 style checks\n");

	button_style = bride::style(
		bride::padding(12, "px"),
		bride::background("#1e1e2e"),
		bride::color("#cdd6f4")
	);
	check_equals(button_style.class_name, "bride-style-1", "style() assigns a class");
	check_equals(
		button_style.body,
		"padding:12px;background:#1e1e2e;color:#cdd6f4;",
		"style() builds the rule body"
	);
	check_equals(appended_query, "head", "the rule is injected into <head>");
	check_equals(
		appended,
		"<style>.bride-style-1{padding:12px;background:#1e1e2e;color:#cdd6f4;}</style>",
		"the rule markup is injected"
	);

	// The same declarations are deduplicated, so no new rule is injected.
	bride::BrideStyle again = bride::style(
		bride::padding(12, "px"),
		bride::background("#1e1e2e"),
		bride::color("#cdd6f4")
	);

	check_equals(again.class_name, "bride-style-1", "identical declarations reuse a class");

	bride::ui(bride::button(bride::text("Click me"), bride::apply(button_style)));
	check_equals(
		committed,
		"<button class=\"bride-style-1\">Click me</button>",
		"apply() puts the class on the element"
	);

	bride::BrideStyle danger = bride::style(
		bride::padding(8, "px"),
		bride::border_radius(4, "px"),
		bride::raw_css("cursor:pointer"),
		bride::css("letter-spacing", "0.02em")
	);

	check_equals(danger.class_name, "bride-style-2", "a different style gets a new class");
	check_equals(
		danger.body,
		"padding:8px;border-radius:4px;cursor:pointer;letter-spacing:0.02em;",
		"raw_css() and css() are accepted"
	);
	check_equals(
		appended,
		"<style>.bride-style-2{padding:8px;border-radius:4px;cursor:pointer;letter-spacing:0.02em;}</style>",
		"each style injects its own rule"
	);

	bride::ui(bride::button(
		bride::text("Click me"),
		bride::apply(button_style),
		bride::attr("class", "card")
	));
	check_equals(
		committed,
		"<button class=\"bride-style-1 card\">Click me</button>",
		"apply() merges with a plain class attribute"
	);

	// Inline styles keep their own name in C3 (no overloading).
	bride::ui(bride::div_(bride::style_attr("padding: 1rem"), bride::text("Inline")));
	check_equals(
		committed,
		"<div style=\"padding: 1rem\">Inline</div>",
		"style_attr() renders an inline style attribute"
	);

	if (failures > 0)
	{
		libc::printf("%d C3 style check(s) failed.\n", failures);
		libc::exit(1);
	}

	libc::printf("All C3 style checks passed.\n");
}
