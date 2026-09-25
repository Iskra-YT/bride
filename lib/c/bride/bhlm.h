#ifndef BRIDE_HIGH_LEVEL_MODULE_H
#define BRIDE_HIGH_LEVEL_MODULE_H

#include "./arg.h"

#define END ((BrideArg){ BRIDE_END, NULL })

BrideArg __p_impl(BrideArg first, ...);
#define p(...) __p_impl(__VA_ARGS__, END)

BrideArg text(const char* value);

void __ui_impl(BrideArg first, ...);
#define ui(...) __ui_impl(__VA_ARGS__, END);

void __change_impl(char* query, BrideArg first, ...);
#define change(query, ...) __change_impl(query, __VA_ARGS__, END);

BrideArg __fragment_impl(BrideArg first, ...);
#define fragment(...) __fragment_impl(__VA_ARGS__, END);

BrideArg on_click(void (*fn)(void));

#endif // BRIDE_HIGH_LEVEL_MODULE_H