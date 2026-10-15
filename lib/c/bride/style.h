#ifndef BRIDE_STYLE_H
#define BRIDE_STYLE_H

#include <stdarg.h>

#include "./arg.h"

#ifdef __cplusplus
extern "C" {
#endif

// Generic declarations.
// `css("padding", "1rem 2rem")` sets any property; `raw_css` splices raw
// declarations into the rule.
BrideArg css(const char* property, const char* value);
BrideArg raw_css(const char* declarations);

// Numeric declarations: a number and its unit, rendered as `<value><unit>`.
BrideArg padding(double value, const char* unit);
BrideArg margin(double value, const char* unit);
BrideArg gap(double value, const char* unit);
BrideArg row_gap(double value, const char* unit);
BrideArg column_gap(double value, const char* unit);
BrideArg font_size(double value, const char* unit);
BrideArg border_radius(double value, const char* unit);
BrideArg letter_spacing(double value, const char* unit);
BrideArg word_spacing(double value, const char* unit);
BrideArg min_width(double value, const char* unit);
BrideArg min_height(double value, const char* unit);
BrideArg max_width(double value, const char* unit);
BrideArg max_height(double value, const char* unit);
BrideArg top(double value, const char* unit);
BrideArg right(double value, const char* unit);
BrideArg bottom(double value, const char* unit);
BrideArg left(double value, const char* unit);

// String declarations.
BrideArg background(const char* value);
BrideArg color(const char* value);
BrideArg opacity(const char* value);
BrideArg display(const char* value);
BrideArg position(const char* value);
BrideArg overflow(const char* value);
BrideArg cursor(const char* value);
BrideArg z_index(const char* value);
BrideArg font_family(const char* value);
BrideArg font_style(const char* value);
BrideArg font_weight(const char* value);
BrideArg line_height(const char* value);
BrideArg text_align(const char* value);
BrideArg text_transform(const char* value);
BrideArg text_decoration(const char* value);
BrideArg text_shadow(const char* value);
BrideArg white_space(const char* value);
BrideArg word_break(const char* value);
BrideArg border(const char* value);
BrideArg outline(const char* value);
BrideArg box_sizing(const char* value);
BrideArg box_shadow(const char* value);
BrideArg flex(const char* value);
BrideArg flex_direction(const char* value);
BrideArg flex_wrap(const char* value);
BrideArg justify_content(const char* value);
BrideArg align_items(const char* value);
BrideArg align_content(const char* value);
BrideArg align_self(const char* value);
BrideArg grid_template_columns(const char* value);
BrideArg grid_template_rows(const char* value);
BrideArg transition(const char* value);
BrideArg transform(const char* value);
BrideArg filter(const char* value);
BrideArg animation(const char* value);

// Puts the style's generated class on an element.
BrideArg apply(BrideStyle style);

// Building blocks used by the `style` macro and by the C++/C3 bindings.
BrideStyle __style_build(BrideArg* args, int count);
BrideStyle __style_impl(BrideArg first, ...);
BrideArg __style_inline_impl(const char* value, ...);

#ifdef __cplusplus
} // extern "C"
#endif

// `style(...)` is overloaded on the type of its first argument:
//
//   style("padding: 1rem")             -> inline `style` attribute (BrideArg)
//   style(padding(12, "px"), ...)      -> reusable BrideStyle
//
// C has no overloading, so the first argument's type selects the
// implementation. C++ and C3 declare real overloads instead (see bhlm.hpp and
// lib/bride.c3).
#ifndef __cplusplus
#define BRIDE_STYLE_SELECT(first, ...) \
    _Generic((first), \
        char*: &__style_inline_impl, \
        const char*: &__style_inline_impl, \
        default: &__style_impl)

#define style(...) BRIDE_STYLE_SELECT(__VA_ARGS__)(__VA_ARGS__ __VA_OPT__(,) END)
#endif // __cplusplus

#endif // BRIDE_STYLE_H
