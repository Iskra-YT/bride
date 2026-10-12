module bride::c3;

import libc;
import std::core::string;

enum ArgType : int
{
    BRIDE_HTML,
    BRIDE_ATTR,
    BRIDE_EVENT,
    BRIDE_END
}

enum HtmlTagType : int
{
    HTML_TAG_PARAGRAPH,
    HTML_TAG_TEXT,
    HTML_TAG_FRAGMENT,
    HTML_TAG_BUTTON,
    HTML_TAG_ANCHOR,
    HTML_TAG_DIV,
    HTML_TAG_COUNT
}

struct Attribute
{
    char* name;
    char* value;
}

struct Tag
{
    HtmlTagType tag;
    Attribute** attributes;
    Tag** childrens;
}

struct Children
{
    Tag** data;
    usz size;
    usz capacity;
}

struct Attrs
{
    Attribute** data;
    usz size;
    usz capacity;
}

struct Arg
{
    ArgType type;
    void* value;
}

alias Handler = fn void();
alias TagFactory = fn Tag*(Tag** childrens, Attribute** attributes);


extern fn void commit(char* html);
extern fn void commit_at(char* query, char* html);

extern fn Arg attr(char* name, char* value);
extern fn Arg id(char* name);
extern fn Arg class_(char* name);
extern fn Arg action(char* name, Handler handler);
extern fn Arg on_click(Handler handler);
extern fn Arg on_input(Handler handler);
extern fn Arg text(char* value);

extern fn Tag* create_text_tag(char* value);
extern fn char* repr_html_tag(Tag* tag);
extern fn void free_html_tag(Tag* tag);

extern fn void children_init(Children* children);
extern fn void children_push(Children* children, Tag* child);
extern fn void children_free(Children* children);

extern fn void attrs_init(Attrs* attributes);
extern fn void attrs_push(Attrs* attributes, Attribute* attribute);
extern fn void attrs_free(Attrs* attributes);

extern fn Tag* tag_p(Tag** childrens, Attribute** attributes) @cname("create_p_tag");
extern fn Tag* tag_button(Tag** childrens, Attribute** attributes) @cname("create_button_tag");
extern fn Tag* tag_a(Tag** childrens, Attribute** attributes) @cname("create_a_tag");
extern fn Tag* tag_div(Tag** childrens, Attribute** attributes) @cname("create_div_tag");
extern fn Tag* tag_fragment(Tag** childrens, Attribute** attributes) @cname("create_fragment_tag");

fn Arg arg_html(Tag* tag) => { .type = BRIDE_HTML, .value = tag };

macro Arg textf(String format, ...)
{
    String formatted = string::tformat(format, ...$vaarg);

    usz length = formatted.len;
    char* buffer = (char*)libc::malloc((usz)(length + 1));

    if (buffer == null) return arg_html(create_text_tag(null));

    libc::memcpy((void*)buffer, (void*)formatted.ptr, length);
    buffer[length] = '\0';

    Arg arg = arg_html(create_text_tag(buffer));

    libc::free(buffer);

    return arg;
}

fn void parse_args(Arg[] args, Children* children, Attrs* attributes)
{
    foreach (arg : args)
    {
        switch (arg.type)
        {
            case BRIDE_HTML: children_push(children, (Tag*)arg.value);
            case BRIDE_ATTR: attrs_push(attributes, (Attribute*)arg.value);
            default: break;
        }
    }
}

fn Tag* collect(TagFactory factory, Arg[] args)
{
    Children children;
    children_init(&children);

    Attrs attributes;
    attrs_init(&attributes);

    parse_args(args, &children, &attributes);

    return factory(children.data, attributes.data);
}


macro Arg p(Arg... args) => arg_html(collect(&tag_p, args));

macro Arg button(Arg... args) => arg_html(collect(&tag_button, args));

macro Arg a(Arg... args) => arg_html(collect(&tag_a, args));

macro Arg div_(Arg... args) => arg_html(collect(&tag_div, args));

macro Arg fragment(Arg... args) => arg_html(collect(&tag_fragment, args));

fn void commit_tree(Tag* tree)
{
    char* html = repr_html_tag(tree);
    if (html == null) return;

    commit(html);

    libc::free(html);
    free_html_tag(tree);
}

fn void commit_tree_at(char* query, Tag* tree)
{
    char* html = repr_html_tag(tree);
    if (html == null) return;

    commit_at(query, html);

    libc::free(html);
    free_html_tag(tree);
}

macro void ui(Arg... args)
{
    commit_tree(collect(&tag_fragment, args));
}

macro void change(char* query, Arg... args)
{
    commit_tree_at(query, collect(&tag_fragment, args));
}
