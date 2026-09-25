#include "js.h"

void commit(const char* html) {
    __commit(html, strlen(html)); // Remove the null terminator from the length
}

void commit_at(const char* query, const char* html) {
    __commit_at(query, strlen(query), html, strlen(html)); // Remove the null terminator from the length
}