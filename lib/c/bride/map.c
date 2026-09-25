#include "./map.h"

void map_init(Map *map) {
    map->size = 0;
    map->capacity = 8;
    map->entries = (MapEntry*)malloc(sizeof(MapEntry) * map->capacity);
}

void map_insert(Map *map, int key, void *value) {
    for (size_t i = 0; i < map->size; i++) {
        if (map->entries[i].key == key) {
            map->entries[i].value = value;
            return;
        }
    }

    if (map->size >= map->capacity) {
        map->capacity *= 2;
        map->entries = realloc(
            map->entries,
            sizeof(MapEntry) * map->capacity
        );
    }

    map->entries[map->size].key = key;
    map->entries[map->size].value = value;
    map->size++;
}

void *map_get(Map *map, int key) {
    for (size_t i = 0; i < map->size; i++) {
        if (map->entries[i].key == key) {
            return map->entries[i].value;
        }
    }

    return NULL;
}

void map_free(Map *map) {
    free(map->entries);
    map->entries = NULL;
    map->size = 0;
    map->capacity = 0;
}
