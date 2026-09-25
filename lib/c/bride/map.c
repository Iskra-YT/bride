#include "./map.h"

#define MAP_INITIAL_CAPACITY 8

void map_init(Map *map) {
    map->size = 0;
    map->capacity = MAP_INITIAL_CAPACITY;
    map->entries = (MapEntry*)malloc(sizeof(MapEntry) * map->capacity);

    if (!map->entries) {
        map->capacity = 0;
    }
}

void map_insert(Map *map, int key, void *value) {
    for (size_t i = 0; i < map->size; i++) {
        if (map->entries[i].key == key) {
            map->entries[i].value = value;
            return;
        }
    }

    if (map->size >= map->capacity) {
        size_t capacity = map->capacity ? map->capacity * 2 : MAP_INITIAL_CAPACITY;

        MapEntry* entries = (MapEntry*)realloc(
            map->entries,
            sizeof(MapEntry) * capacity
        );

        if (!entries) {
            return;
        }

        map->entries = entries;
        map->capacity = capacity;
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
