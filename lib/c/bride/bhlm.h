#ifndef BRIDE_HIGH_LEVEL_MODULE_H
#define BRIDE_HIGH_LEVEL_MODULE_H

#include "./arg.h"

#define END ((BrideArg){ BRIDE_END, NULL })

BrideArg __p_impl(BrideArg first, ...);
#define p(...) __p_impl(__VA_ARGS__, END)

BrideArg text(char* value);

void __ui_impl(BrideArg first, ...);
#define ui(...) __ui_impl(__VA_ARGS__, END);

#endif // BRIDE_HIGH_LEVEL_MODULE_H