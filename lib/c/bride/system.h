#ifndef BRIDE_SYSTEM_H
#define BRIDE_SYSTEM_H

extern void __commit(const char* ptr, int len)
    __attribute__((import_module("env")))
    __attribute__((import_name("commit")));

extern void __commit_at(
    const char* query_ptr,
    int query_len,
    const char* html_ptr,
    int html_len
) __attribute__((import_module("env")))
  __attribute__((import_name("commit_at")));

#endif