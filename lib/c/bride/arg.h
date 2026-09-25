#ifndef BRIDE_ARG_H
#define BRIDE_ARG_H

typedef enum BrideArgType {
    BRIDE_HTML,
    BRIDE_ATTR,
    BRIDE_EVENT,
    BRIDE_END
} BrideArgType;

typedef struct BrideArg {
    BrideArgType type;
    void* value;
} BrideArg;

#endif // BRIDE_ARG_H