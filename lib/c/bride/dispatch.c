#include "./dispach.h"
#include "./map.h"

#include <emscripten/emscripten.h>

Map dispatch_map;
int last_key = -1;

void dispatch_init() {
    map_init(&dispatch_map);
    last_key = -1;
}

EMSCRIPTEN_KEEPALIVE
void dispatch(int num) {
    void* fn = map_get(&dispatch_map, num);
    ((void (*)(void))fn)();
}

int create_dispatch(void* fn) {
    map_insert(&dispatch_map, ++last_key, fn);
    return last_key;
}