#ifndef BRIDE_HIGH_LEVEL_MODULE_H
#define BRIDE_HIGH_LEVEL_MODULE_H

#include "./arg.h"
#include "./router.h"
#include "./style.h"

#ifdef __cplusplus
extern "C" {
#endif

#ifdef __cplusplus
#define END ((::BrideArg){ ::BRIDE_END, nullptr })
#else
#define END ((BrideArg){ BRIDE_END, NULL })
#endif // __cplusplus

#define BRIDE_BUILDER_TEXT(id, name)
#define BRIDE_BUILDER_ELEMENT(id, name) BrideArg __##name##_impl(BrideArg first, ...);
#define BRIDE_BUILDER_FRAGMENT(id, name) BRIDE_BUILDER_ELEMENT(id, name)
#define BRIDE_BUILDER_VOID(id, name) BRIDE_BUILDER_ELEMENT(id, name)

#define BRIDE_TAG(id, name, html_name, kind) BRIDE_BUILDER_##kind(id, name)
#include "./html/tags.def"
#undef BRIDE_TAG
#undef BRIDE_BUILDER_TEXT
#undef BRIDE_BUILDER_ELEMENT
#undef BRIDE_BUILDER_FRAGMENT
#undef BRIDE_BUILDER_VOID

#define p(...) __p_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define button(...) __button_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define fragment(...) __fragment_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define a(...) __a_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define div_(...) __div_impl(__VA_ARGS__ __VA_OPT__(,) END)

// Headings
#define h1(...) __h1_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define h2(...) __h2_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define h3(...) __h3_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define h4(...) __h4_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define h5(...) __h5_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define h6(...) __h6_impl(__VA_ARGS__ __VA_OPT__(,) END)

// Inline text
#define span(...) __span_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define strong(...) __strong_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define em(...) __em_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define b(...) __b_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define i(...) __i_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define u(...) __u_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define s(...) __s_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define small(...) __small_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define mark(...) __mark_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define code(...) __code_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define pre(...) __pre_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define kbd(...) __kbd_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define samp(...) __samp_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define var(...) __var_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define cite(...) __cite_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define abbr(...) __abbr_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define q(...) __q_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define sub(...) __sub_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define sup(...) __sup_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define blockquote(...) __blockquote_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define address(...) __address_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define time_(...) __time_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define del(...) __del_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define ins(...) __ins_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define br(...) __br_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define hr(...) __hr_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define wbr(...) __wbr_impl(__VA_ARGS__ __VA_OPT__(,) END)

// Sectioning and grouping
#define section(...) __section_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define article(...) __article_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define header(...) __header_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define footer(...) __footer_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define main_(...) __main_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define nav(...) __nav_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define aside(...) __aside_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define figure(...) __figure_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define figcaption(...) __figcaption_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define ul(...) __ul_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define ol(...) __ol_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define li(...) __li_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define dl(...) __dl_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define dt(...) __dt_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define dd(...) __dd_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define details(...) __details_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define summary(...) __summary_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define dialog(...) __dialog_impl(__VA_ARGS__ __VA_OPT__(,) END)

// Tables
#define table(...) __table_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define caption(...) __caption_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define thead(...) __thead_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define tbody(...) __tbody_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define tfoot(...) __tfoot_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define tr(...) __tr_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define th(...) __th_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define td(...) __td_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define colgroup(...) __colgroup_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define col(...) __col_impl(__VA_ARGS__ __VA_OPT__(,) END)

// Embedded content
#define img(...) __img_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define picture(...) __picture_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define source(...) __source_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define track(...) __track_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define video(...) __video_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define audio(...) __audio_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define canvas(...) __canvas_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define iframe(...) __iframe_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define embed(...) __embed_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define object(...) __object_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define map_(...) __map_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define area(...) __area_impl(__VA_ARGS__ __VA_OPT__(,) END)

// Forms
#define form(...) __form_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define label(...) __label_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define input(...) __input_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define textarea(...) __textarea_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define select_(...) __select_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define option(...) __option_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define optgroup(...) __optgroup_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define fieldset(...) __fieldset_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define legend(...) __legend_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define datalist(...) __datalist_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define output(...) __output_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define progress(...) __progress_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define meter(...) __meter_impl(__VA_ARGS__ __VA_OPT__(,) END)

// Templates
#define template_(...) __template_impl(__VA_ARGS__ __VA_OPT__(,) END)
#define slot(...) __slot_impl(__VA_ARGS__ __VA_OPT__(,) END)

BrideArg text(const char* value);
BrideArg textf(const char* format, ...);

void __ui_impl(BrideArg first, ...);
#define ui(...) __ui_impl(__VA_ARGS__ __VA_OPT__(,) END)

void __change_impl(const char* query, BrideArg first, ...);
#define change(query, ...) __change_impl(query, __VA_ARGS__ __VA_OPT__(,) END)

void __append_impl(const char* query, BrideArg first, ...);
#define append(query, ...) __append_impl(query, __VA_ARGS__ __VA_OPT__(,) END)

BrideArg attr(const char* name, const char* value);
BrideArg action(const char* name, void (*fn)(void));

BrideArg on_click(void (*fn)(void));
BrideArg on_input(void (*fn)(void));

BrideArg id(const char* name);
#ifdef __cplusplus
BrideArg class_(const char* name);
#else
BrideArg class(const char* name);
#endif // __cplusplus

// Attribute helpers
BrideArg href(const char* value);
BrideArg src(const char* value);
BrideArg alt(const char* value);
BrideArg title(const char* value);
BrideArg type(const char* value);
BrideArg name(const char* value);
BrideArg value(const char* value);
BrideArg placeholder(const char* value);
BrideArg for_(const char* value);
BrideArg target(const char* value);
BrideArg rel(const char* value);
BrideArg role(const char* value);
BrideArg width(const char* value);
BrideArg height(const char* value);
BrideArg tabindex(const char* value);
BrideArg autocomplete(const char* value);
BrideArg accept(const char* value);
BrideArg min(const char* value);
BrideArg max(const char* value);
BrideArg step(const char* value);
BrideArg pattern(const char* value);
BrideArg rows(const char* value);
BrideArg cols(const char* value);
BrideArg method(const char* value);
BrideArg form_action(const char* value);
BrideArg enctype(const char* value);
BrideArg loading(const char* value);
BrideArg download(const char* value);

// Boolean attribute helpers
BrideArg disabled(void);
BrideArg checked(void);
BrideArg selected(void);
BrideArg required(void);
BrideArg readonly(void);
BrideArg multiple(void);
BrideArg autofocus(void);
BrideArg hidden(void);

// Event helpers
BrideArg on_change(void (*fn)(void));
BrideArg on_submit(void (*fn)(void));
BrideArg on_focus(void (*fn)(void));
BrideArg on_blur(void (*fn)(void));
BrideArg on_keydown(void (*fn)(void));
BrideArg on_keyup(void (*fn)(void));
BrideArg on_keypress(void (*fn)(void));
BrideArg on_dblclick(void (*fn)(void));
BrideArg on_mousedown(void (*fn)(void));
BrideArg on_mouseup(void (*fn)(void));
BrideArg on_mouseover(void (*fn)(void));
BrideArg on_mouseout(void (*fn)(void));
BrideArg on_mousemove(void (*fn)(void));
BrideArg on_scroll(void (*fn)(void));
BrideArg on_load(void (*fn)(void));
BrideArg on_contextmenu(void (*fn)(void));
BrideArg on_wheel(void (*fn)(void));

// CSS
void style_file(const char* filename);

// References
#ifndef __cplusplus
#define EMPTY_REF ((BrideRef)(NULL))
#else
#define EMPTY_REF ((BrideRef)(nullptr))
#endif

typedef char* BrideRef;
BrideArg ref(BrideRef* reference);

#ifdef __cplusplus
} // extern "C"

// `style` is overloaded instead of dispatched by a macro: a bare string sets
// the inline `style` attribute, while declarations build a reusable BrideStyle
// (see style.h).
inline BrideArg style(const char* value) {
    return __style_inline_impl(value);
}

template <typename... Rest>
inline BrideStyle style(BrideArg first, Rest... rest) {
    BrideArg args[sizeof...(Rest) + 1] = { first, rest... };

    return __style_build(args, (int)(sizeof...(Rest) + 1));
}
#endif // __cplusplus

#endif // BRIDE_HIGH_LEVEL_MODULE_H
