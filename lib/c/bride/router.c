#include "./router.h"
#include "./dispatch.h"
#include "./system.h"

#include <string.h>

void route(const char* path, void (*fn)(void)) {
    int handler = create_dispatch((void*)fn);

    __route(path, (int)strlen(path), handler);
}

void navigate(const char* path) {
    __navigate(path, (int)strlen(path));
}
