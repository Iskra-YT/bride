#ifndef BRIDE_ARG_H
#define BRIDE_ARG_H

typedef enum BrideArgType {
    BRIDE_HTML,
    BRIDE_ATTR,
    BRIDE_EVENT,
    BRIDE_STYLE,
    BRIDE_END
} BrideArgType;

typedef struct BrideArg {
    BrideArgType type;
    void* value;
} BrideArg;

// A single CSS declaration (`property: value`) produced by the helpers in
// style.h (`padding`, `background`, ...) or by `css`.
typedef struct BrideStyleDecl {
    char* property;
    char* value;
} BrideStyleDecl;

// A reusable set of CSS declarations. `style(...)` compiles the declarations
// into a `.<class_name>` rule (injected into `<head>`) and `apply` puts that
// class name on an element.
typedef struct BrideStyle {
    char* class_name;
    char* body;
} BrideStyle;

#endif // BRIDE_ARG_H