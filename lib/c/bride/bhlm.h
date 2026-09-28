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

BrideArg __p_impl(BrideArg first, ...);
#define p(...) __p_impl(__VA_ARGS__, END)

BrideArg text(const char* value);
BrideArg textf(const char* format, ...);

void __ui_impl(BrideArg first, ...);
#define ui(...) __ui_impl(__VA_ARGS__, END)

void __change_impl(const char* query, BrideArg first, ...);
#define change(query, ...) __change_impl(query, __VA_ARGS__, END)

BrideArg __fragment_impl(BrideArg first, ...);
#define fragment(...) __fragment_impl(__VA_ARGS__, END)

BrideArg attr(const char* name, const char* value);
BrideArg action(const char* name, void (*fn)(void));

BrideArg on_click(void (*fn)(void));
BrideArg on_input(void (*fn)(void));

BrideArg id(const char* name);
BrideArg class_(const char* name);

#ifndef __cplusplus
BrideArg class(const char* name);
#endif // __cplusplus

BrideArg __button_impl(BrideArg first, ...);
#define button(...) __button_impl(__VA_ARGS__, END)

#ifdef __cplusplus
} // extern "C"
#endif

#endif // BRIDE_HIGH_LEVEL_MODULE_H