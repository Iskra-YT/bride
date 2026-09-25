#include "./dispach.h"
#include "./map.h"

#include <emscripten/emscripten.h>

Map dispatch_map;
int last_key = -1;
int dispatch_ready = 0;

void dispatch_init() {
    if (dispatch_ready) {
        map_free(&dispatch_map);
    }

    map_init(&dispatch_map);
    last_key = -1;
    dispatch_ready = 1;
}

EMSCRIPTEN_KEEPALIVE
void dispatch(int num) {
    void* fn = map_get(&dispatch_map, num);

    if (!fn) {
        return;
    }

    ((void (*)(void))fn)();
}

int create_dispatch(void* fn) {
    if (!dispatch_ready) {
        dispatch_init();
    }

    map_insert(&dispatch_map, ++last_key, fn);

    return last_key;
}