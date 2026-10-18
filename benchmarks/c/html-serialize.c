// Benchmark harness for the C HTML serializer (repr_html_tag from
// lib/c/bride/html/tag.c).
//
// Builds a deterministic tree of a requested node count, then serializes it
// repeatedly. One process runs one case and prints machine-readable lines:
//
//   META,<case>,<nodes>,<html bytes>,<checksum>,<iterations>,<warmup>
//   SAMPLE,<case>,<nanoseconds per serialization>
//
// Reliability measures:
//   * a golden tree is compared against the exact expected HTML before
//     anything is measured, so the serializer itself is verified;
//   * every iteration re-hashes the produced HTML and compares it with the
//     reference hash, so a broken render fails the run instead of silently
//     producing numbers;
//   * the hash is folded into a volatile sink, so the compiler can never
//     remove the measured work;
//   * timing wraps only the repr_html_tag() call; hashing and free() stay
//     outside the measured region.
//
// Build and run through benchmarks/run.mjs.

#include <inttypes.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#if defined(_WIN32)
#include <windows.h>
#else
#include <time.h>
#endif

#include "bride/html/tag.h"

#define FNV1A_OFFSET 1469598103934665603ull
#define FNV1A_PRIME 1099511628211ull

// A "row" unit of the benchmark tree: <section> + <h2> + text + <p> + text +
// a text separator = 6 nodes.
#define UNIT_NODES 6

static uint64_t now_ns(void) {
#if defined(_WIN32)
    LARGE_INTEGER frequency;
    LARGE_INTEGER counter;

    QueryPerformanceFrequency(&frequency);
    QueryPerformanceCounter(&counter);

    return (uint64_t)((counter.QuadPart * 1000000000.0) / frequency.QuadPart);
#else
    struct timespec ts;

    clock_gettime(CLOCK_MONOTONIC, &ts);

    return (uint64_t)ts.tv_sec * 1000000000ull + (uint64_t)ts.tv_nsec;
#endif
}

static uint64_t fnv1a(const char* text, size_t length) {
    uint64_t hash = FNV1A_OFFSET;

    for (size_t i = 0; i < length; i++) {
        hash ^= (unsigned char)text[i];
        hash *= FNV1A_PRIME;
    }

    return hash;
}

// Folded into after every serialization so the optimizer must keep the work.
static volatile uint64_t sink = 0;

static void fail(const char* format, ...) {
    va_list args;

    va_start(args, format);
    vfprintf(stderr, format, args);
    va_end(args);

    fputc('\n', stderr);
    exit(1);
}

static void fail_alloc(void) {
    fail("allocation failed");
}

// --- deterministic tree builder --------------------------------------------

// Heap-allocated NULL-terminated children array; NULL children fail loudly.
static HtmlTag** children_of(int count, ...) {
    HtmlTag** list = (HtmlTag**)malloc(sizeof(HtmlTag*) * (size_t)(count + 1));

    if (!list) {
        fail_alloc();
    }

    va_list args;

    va_start(args, count);

    for (int i = 0; i < count; i++) {
        list[i] = va_arg(args, HtmlTag*);

        if (!list[i]) {
            fail_alloc();
        }
    }

    va_end(args);

    list[count] = NULL;

    return list;
}

static HtmlAttribute* attr_new(const char* name, const char* value) {
    HtmlAttribute* attribute = (HtmlAttribute*)malloc(sizeof(HtmlAttribute));

    if (!attribute) {
        fail_alloc();
    }

    // free_html_tag() frees both strings, so both must be heap copies.
    attribute->name = strdup(name);
    attribute->value = strdup(value);

    if (!attribute->name || !attribute->value) {
        fail_alloc();
    }

    return attribute;
}

// NULL-terminated attribute list of up to two entries (second may be NULL).
static HtmlAttribute** attr_pair(HtmlAttribute* first, HtmlAttribute* second) {
    HtmlAttribute** list = (HtmlAttribute**)malloc(sizeof(HtmlAttribute*) * 3);

    if (!list) {
        fail_alloc();
    }

    list[0] = first;
    list[1] = second;
    list[2] = NULL;

    return list;
}

static HtmlTag* text_tagf(const char* format, ...) {
    char buffer[128];
    va_list args;

    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);

    HtmlTag* tag = create_text_tag(buffer);

    if (!tag) {
        fail_alloc();
    }

    return tag;
}

// A growable child collector for the root, which holds many units.
typedef struct ChildList {
    HtmlTag** data;
    size_t size;
    size_t capacity;
} ChildList;

static void child_list_init(ChildList* list) {
    list->capacity = 8;
    list->size = 0;
    list->data = (HtmlTag**)malloc(sizeof(HtmlTag*) * list->capacity);

    if (!list->data) {
        fail_alloc();
    }
}

static void child_list_add(ChildList* list, HtmlTag* child) {
    if (!child) {
        fail_alloc();
    }

    if (list->size + 1 >= list->capacity) {
        list->capacity *= 2;
        list->data = (HtmlTag**)realloc(list->data, sizeof(HtmlTag*) * list->capacity);

        if (!list->data) {
            fail_alloc();
        }
    }

    list->data[list->size++] = child;
    list->data[list->size] = NULL;
}

// Hands the NULL-terminated array over to the tree (the tree frees it).
static HtmlTag** child_list_finish(ChildList* list) {
    HtmlTag** data = list->data;

    list->data = NULL;
    list->size = 0;
    list->capacity = 0;

    return data;
}

// <section class="row" data-index="i"><h2>Title i</h2><p class="body"
// data-index="i">Body i</p>\n</section> — 6 nodes.
static HtmlTag* build_unit(size_t index) {
    char index_buffer[32];

    snprintf(index_buffer, sizeof(index_buffer), "%zu", index);

    HtmlTag* title = create_h2_tag(
        children_of(1, text_tagf("Title %zu", index)),
        NULL
    );

    HtmlTag* body = create_p_tag(
        children_of(1, text_tagf("Body %zu", index)),
        attr_pair(attr_new("class", "body"), attr_new("data-index", index_buffer))
    );

    HtmlTag* unit = create_section_tag(
        children_of(3, title, body, text_tagf("\n")),
        attr_pair(attr_new("class", "row"), attr_new("data-index", index_buffer))
    );

    if (!unit) {
        fail_alloc();
    }

    return unit;
}

// A root <div> holding repeatable units until the exact node budget is spent;
// an incomplete unit is filled with single text nodes so the tree has exactly
// `target_nodes` nodes.
static HtmlTag* build_tree(size_t target_nodes, size_t* out_nodes) {
    if (target_nodes < 1) {
        fail("a tree needs at least one node");
    }

    ChildList children;

    child_list_init(&children);

    size_t built = 1;
    size_t remaining = target_nodes - 1;
    size_t index = 0;

    while (remaining > 0) {
        if (remaining >= UNIT_NODES) {
            child_list_add(&children, build_unit(index++));
            remaining -= UNIT_NODES;
            built += UNIT_NODES;
        } else {
            child_list_add(&children, create_text_tag("x"));

            remaining -= 1;
            built += 1;
        }
    }

    char nodes_buffer[32];

    snprintf(nodes_buffer, sizeof(nodes_buffer), "%zu", target_nodes);

    HtmlTag* root = create_div_tag(
        child_list_finish(&children),
        attr_pair(attr_new("class", "page"), attr_new("data-nodes", nodes_buffer))
    );

    if (!root) {
        fail_alloc();
    }

    *out_nodes = built;

    return root;
}

// --- golden check -----------------------------------------------------------

// A tiny fixed tree with known markup: it fails loudly if the serializer ever
// changes its output format, so timings are never collected for a broken
// serializer.
static bool golden_check(void) {
    HtmlTag* tree = create_div_tag(
        children_of(2,
            create_h2_tag(children_of(1, create_text_tag("Title 0")), NULL),
            create_p_tag(children_of(1, create_text_tag("Body 0")), NULL)
        ),
        attr_pair(attr_new("class", "page"), attr_new("data-bench", "1"))
    );

    const char* expected =
        "<div class=\"page\" data-bench=\"1\">"
        "<h2>Title 0</h2>"
        "<p>Body 0</p>"
        "</div>";

    char* html = repr_html_tag(tree);
    bool ok = html && strcmp(html, expected) == 0;

    if (!ok) {
        fprintf(stderr, "golden check failed:\n  got:      %s\n  expected: %s\n",
            html ? html : "(null)", expected);
    }

    free(html);
    free_html_tag(tree);

    return ok;
}

// --- cases ------------------------------------------------------------------

static const struct {
    const char* name;
    size_t nodes;
} CASES[] = {
    { "nodes-100", 100 },
    { "nodes-1000", 1000 },
    { "nodes-10000", 10000 },
};

static const size_t CASE_COUNT = sizeof(CASES) / sizeof(CASES[0]);

static long parse_positive(const char* text, const char* what) {
    char* end = NULL;
    long value = strtol(text, &end, 10);

    if (!end || *end != '\0' || value < 1) {
        fail("invalid %s: %s", what, text);
    }

    return value;
}

int main(int argc, char** argv) {
    const char* case_name = NULL;
    long iterations = 30;
    long warmup = 5;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--iterations") == 0 && i + 1 < argc) {
            iterations = parse_positive(argv[++i], "iteration count");
        } else if (strcmp(argv[i], "--warmup") == 0 && i + 1 < argc) {
            warmup = parse_positive(argv[++i], "warmup count");
        } else if (!case_name) {
            case_name = argv[i];
        } else {
            fail("usage: html-serialize <case> [--iterations N] [--warmup N]");
        }
    }

    if (!case_name) {
        fprintf(stderr, "cases:");

        for (size_t i = 0; i < CASE_COUNT; i++) {
            fprintf(stderr, " %s", CASES[i].name);
        }

        fputc('\n', stderr);

        return 1;
    }

    const size_t* case_nodes = NULL;

    for (size_t i = 0; i < CASE_COUNT; i++) {
        if (strcmp(case_name, CASES[i].name) == 0) {
            case_nodes = &CASES[i].nodes;
            break;
        }
    }

    if (!case_nodes) {
        fail("unknown case: %s", case_name);
    }

    if (!golden_check()) {
        return 2;
    }

    size_t nodes = 0;
    HtmlTag* tree = build_tree(*case_nodes, &nodes);

    // Reference serialization: the correctness baseline for every iteration.
    char* reference = repr_html_tag(tree);

    if (!reference) {
        fail("repr_html_tag() returned NULL for case %s", case_name);
    }

    const size_t bytes = strlen(reference);
    const uint64_t reference_hash = fnv1a(reference, bytes);

    sink ^= reference_hash;
    free(reference);

    printf("META,%s,%zu,%zu,%" PRIx64 ",%ld,%ld\n",
        case_name, nodes, bytes, reference_hash, iterations, warmup);

    for (long i = 0; i < warmup; i++) {
        char* html = repr_html_tag(tree);

        if (!html) {
            fail("repr_html_tag() returned NULL during warmup");
        }

        if (strlen(html) != bytes || fnv1a(html, bytes) != reference_hash) {
            fail("warmup serialization #%ld did not match the reference", i);
        }

        sink ^= fnv1a(html, bytes);
        free(html);
    }

    for (long i = 0; i < iterations; i++) {
        const uint64_t started = now_ns();
        char* html = repr_html_tag(tree);
        const uint64_t elapsed = now_ns() - started;

        if (!html) {
            fail("repr_html_tag() returned NULL in iteration %ld", i);
        }

        const size_t length = strlen(html);
        const uint64_t hash = fnv1a(html, length);

        if (length != bytes || hash != reference_hash) {
            fail("serialization #%ld diverged from the reference "
                "(length %zu vs %zu, hash %" PRIx64 " vs %" PRIx64 ")",
                i, length, bytes, hash, reference_hash);
        }

        sink ^= hash;
        free(html);

        printf("SAMPLE,%s,%" PRIu64 "\n", case_name, elapsed);
    }

    free_html_tag(tree);

    return 0;
}
