#ifndef BRIDE_JS_H
#define BRIDE_JS_H

#include <string.h>
#include "./system.h"

void commit(const char* html) {
    __commit(html, strlen(html) - 1); // Remove the null terminator from the length
}

void commit_at(const char* query, const char* html) {
    __commit_at(query, strlen(query) - 1, html, strlen(html) - 1); // Remove the null terminator from the length
}

#endif // BRIDE_JS_H