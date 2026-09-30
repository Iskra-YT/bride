#ifndef BRIDE_HIGH_LEVEL_MODULE_H
#define BRIDE_HIGH_LEVEL_MODULE_H

#include "./arg.h"

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

#define BRIDE_TAG(id, name, html_name, kind) BRIDE_BUILDER_##kind(id, name)
#include "./html/tags.def"
#undef BRIDE_TAG
#undef BRIDE_BUILDER_TEXT
#undef BRIDE_BUILDER_ELEMENT
#undef BRIDE_BUILDER_FRAGMENT

#define p(...) __p_impl(__VA_ARGS__, END)
#define button(...) __button_impl(__VA_ARGS__, END)
#define fragment(...) __fragment_impl(__VA_ARGS__, END)
#define a(...) __a_impl(__VA_ARGS__, END)
#define div_(...) __div_impl(__VA_ARGS__, END)

BrideArg text(const char* value);
BrideArg textf(const char* format, ...);

void __ui_impl(BrideArg first, ...);
#define ui(...) __ui_impl(__VA_ARGS__, END)

void __change_impl(const char* query, BrideArg first, ...);
#define change(query, ...) __change_impl(query, __VA_ARGS__, END)

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

#ifdef __cplusplus
} // extern "C"
#endif

#endif // BRIDE_HIGH_LEVEL_MODULE_H
