#ifndef BRIDE_MAP_H
#define BRIDE_MAP_H

#include <stdlib.h>

typedef struct {
    int key;
    void *value;
} MapEntry;

typedef struct {
    MapEntry *entries;
    size_t size;
    size_t capacity;
} Map;

void map_init(Map *map);
void map_insert(Map *map, int key, void *value);
void *map_get(Map *map, int key);
void map_free(Map *map);

#endif