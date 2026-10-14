#ifndef BRIDE_ROUTER_H
#define BRIDE_ROUTER_H

#ifdef __cplusplus
extern "C" {
#endif

void route(const char* path, void (*fn)(void));
void navigate(const char* path);

#ifdef __cplusplus
} // extern "C"
#endif

#endif // BRIDE_ROUTER_H
