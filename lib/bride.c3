module bride;

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
    // Headings
    HTML_TAG_H1,
    HTML_TAG_H2,
    HTML_TAG_H3,
    HTML_TAG_H4,
    HTML_TAG_H5,
    HTML_TAG_H6,
    // Inline text
    HTML_TAG_SPAN,
    HTML_TAG_STRONG,
    HTML_TAG_EM,
    HTML_TAG_B,
    HTML_TAG_I,
    HTML_TAG_U,
    HTML_TAG_S,
    HTML_TAG_SMALL,
    HTML_TAG_MARK,
    HTML_TAG_CODE,
    HTML_TAG_PRE,
    HTML_TAG_KBD,
    HTML_TAG_SAMP,
    HTML_TAG_VAR,
    HTML_TAG_CITE,
    HTML_TAG_ABBR,
    HTML_TAG_Q,
    HTML_TAG_SUB,
    HTML_TAG_SUP,
    HTML_TAG_BLOCKQUOTE,
    HTML_TAG_ADDRESS,
    HTML_TAG_TIME,
    HTML_TAG_DEL,
    HTML_TAG_INS,
    HTML_TAG_BR,
    HTML_TAG_HR,
    HTML_TAG_WBR,
    // Sectioning and grouping
    HTML_TAG_SECTION,
    HTML_TAG_ARTICLE,
    HTML_TAG_HEADER,
    HTML_TAG_FOOTER,
    HTML_TAG_MAIN,
    HTML_TAG_NAV,
    HTML_TAG_ASIDE,
    HTML_TAG_FIGURE,
    HTML_TAG_FIGCAPTION,
    HTML_TAG_UL,
    HTML_TAG_OL,
    HTML_TAG_LI,
    HTML_TAG_DL,
    HTML_TAG_DT,
    HTML_TAG_DD,
    HTML_TAG_DETAILS,
    HTML_TAG_SUMMARY,
    HTML_TAG_DIALOG,
    // Tables
    HTML_TAG_TABLE,
    HTML_TAG_CAPTION,
    HTML_TAG_THEAD,
    HTML_TAG_TBODY,
    HTML_TAG_TFOOT,
    HTML_TAG_TR,
    HTML_TAG_TH,
    HTML_TAG_TD,
    HTML_TAG_COLGROUP,
    HTML_TAG_COL,
    // Embedded content
    HTML_TAG_IMG,
    HTML_TAG_PICTURE,
    HTML_TAG_SOURCE,
    HTML_TAG_TRACK,
    HTML_TAG_VIDEO,
    HTML_TAG_AUDIO,
    HTML_TAG_CANVAS,
    HTML_TAG_IFRAME,
    HTML_TAG_EMBED,
    HTML_TAG_OBJECT,
    HTML_TAG_MAP,
    HTML_TAG_AREA,
    // Forms
    HTML_TAG_FORM,
    HTML_TAG_LABEL,
    HTML_TAG_INPUT,
    HTML_TAG_TEXTAREA,
    HTML_TAG_SELECT,
    HTML_TAG_OPTION,
    HTML_TAG_OPTGROUP,
    HTML_TAG_FIELDSET,
    HTML_TAG_LEGEND,
    HTML_TAG_DATALIST,
    HTML_TAG_OUTPUT,
    HTML_TAG_PROGRESS,
    HTML_TAG_METER,
    // Templates
    HTML_TAG_TEMPLATE,
    HTML_TAG_SLOT,
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
extern fn void add_at(char* query, char* html);

// Routing
extern fn void route(char* path, Handler handler);
extern fn void navigate(char* path);

extern fn Arg attr(char* name, char* value);
extern fn Arg id(char* name);
extern fn Arg class_(char* name);
extern fn Arg action(char* name, Handler handler);
extern fn Arg on_click(Handler handler);
extern fn Arg on_input(Handler handler);
extern fn Arg text(char* value);

// Attribute helpers
extern fn Arg href(char* value);
extern fn Arg src(char* value);
extern fn Arg alt(char* value);
extern fn Arg title(char* value);
extern fn Arg type(char* value);
extern fn Arg name(char* value);
extern fn Arg value(char* value);
extern fn Arg placeholder(char* value);
extern fn Arg for_(char* value);
extern fn Arg style(char* value);
extern fn Arg target(char* value);
extern fn Arg rel(char* value);
extern fn Arg role(char* value);
extern fn Arg width(char* value);
extern fn Arg height(char* value);
extern fn Arg tabindex(char* value);
extern fn Arg autocomplete(char* value);
extern fn Arg accept(char* value);
extern fn Arg min(char* value);
extern fn Arg max(char* value);
extern fn Arg step(char* value);
extern fn Arg pattern(char* value);
extern fn Arg rows(char* value);
extern fn Arg cols(char* value);
extern fn Arg method(char* value);
extern fn Arg form_action(char* value);
extern fn Arg enctype(char* value);
extern fn Arg loading(char* value);
extern fn Arg download(char* value);

// Boolean attribute helpers
extern fn Arg disabled();
extern fn Arg checked();
extern fn Arg selected();
extern fn Arg required();
extern fn Arg readonly();
extern fn Arg multiple();
extern fn Arg autofocus();
extern fn Arg hidden();

// Event helpers
extern fn Arg on_change(Handler handler);
extern fn Arg on_submit(Handler handler);
extern fn Arg on_focus(Handler handler);
extern fn Arg on_blur(Handler handler);
extern fn Arg on_keydown(Handler handler);
extern fn Arg on_keyup(Handler handler);
extern fn Arg on_keypress(Handler handler);
extern fn Arg on_dblclick(Handler handler);
extern fn Arg on_mousedown(Handler handler);
extern fn Arg on_mouseup(Handler handler);
extern fn Arg on_mouseover(Handler handler);
extern fn Arg on_mouseout(Handler handler);
extern fn Arg on_mousemove(Handler handler);
extern fn Arg on_scroll(Handler handler);
extern fn Arg on_load(Handler handler);
extern fn Arg on_contextmenu(Handler handler);
extern fn Arg on_wheel(Handler handler);

extern fn Tag* create_text_tag(char* value);
extern fn char* repr_html_tag(Tag* tag);
extern fn void free_html_tag(Tag* tag);

extern fn void children_init(Children* children);
extern fn void children_push(Children* children, Tag* child);
extern fn void children_free(Children* children);

extern fn void attrs_init(Attrs* attributes);
extern fn void attrs_push(Attrs* attributes, Attribute* attribute);
extern fn void attrs_free(Attrs* attributes);

// Tag factories
extern fn Tag* tag_p(Tag** childrens, Attribute** attributes) @cname("create_p_tag");
extern fn Tag* tag_button(Tag** childrens, Attribute** attributes) @cname("create_button_tag");
extern fn Tag* tag_a(Tag** childrens, Attribute** attributes) @cname("create_a_tag");
extern fn Tag* tag_div(Tag** childrens, Attribute** attributes) @cname("create_div_tag");
extern fn Tag* tag_fragment(Tag** childrens, Attribute** attributes) @cname("create_fragment_tag");

// Headings
extern fn Tag* tag_h1(Tag** childrens, Attribute** attributes) @cname("create_h1_tag");
extern fn Tag* tag_h2(Tag** childrens, Attribute** attributes) @cname("create_h2_tag");
extern fn Tag* tag_h3(Tag** childrens, Attribute** attributes) @cname("create_h3_tag");
extern fn Tag* tag_h4(Tag** childrens, Attribute** attributes) @cname("create_h4_tag");
extern fn Tag* tag_h5(Tag** childrens, Attribute** attributes) @cname("create_h5_tag");
extern fn Tag* tag_h6(Tag** childrens, Attribute** attributes) @cname("create_h6_tag");

// Inline text
extern fn Tag* tag_span(Tag** childrens, Attribute** attributes) @cname("create_span_tag");
extern fn Tag* tag_strong(Tag** childrens, Attribute** attributes) @cname("create_strong_tag");
extern fn Tag* tag_em(Tag** childrens, Attribute** attributes) @cname("create_em_tag");
extern fn Tag* tag_b(Tag** childrens, Attribute** attributes) @cname("create_b_tag");
extern fn Tag* tag_i(Tag** childrens, Attribute** attributes) @cname("create_i_tag");
extern fn Tag* tag_u(Tag** childrens, Attribute** attributes) @cname("create_u_tag");
extern fn Tag* tag_s(Tag** childrens, Attribute** attributes) @cname("create_s_tag");
extern fn Tag* tag_small(Tag** childrens, Attribute** attributes) @cname("create_small_tag");
extern fn Tag* tag_mark(Tag** childrens, Attribute** attributes) @cname("create_mark_tag");
extern fn Tag* tag_code(Tag** childrens, Attribute** attributes) @cname("create_code_tag");
extern fn Tag* tag_pre(Tag** childrens, Attribute** attributes) @cname("create_pre_tag");
extern fn Tag* tag_kbd(Tag** childrens, Attribute** attributes) @cname("create_kbd_tag");
extern fn Tag* tag_samp(Tag** childrens, Attribute** attributes) @cname("create_samp_tag");
extern fn Tag* tag_var(Tag** childrens, Attribute** attributes) @cname("create_var_tag");
extern fn Tag* tag_cite(Tag** childrens, Attribute** attributes) @cname("create_cite_tag");
extern fn Tag* tag_abbr(Tag** childrens, Attribute** attributes) @cname("create_abbr_tag");
extern fn Tag* tag_q(Tag** childrens, Attribute** attributes) @cname("create_q_tag");
extern fn Tag* tag_sub(Tag** childrens, Attribute** attributes) @cname("create_sub_tag");
extern fn Tag* tag_sup(Tag** childrens, Attribute** attributes) @cname("create_sup_tag");
extern fn Tag* tag_blockquote(Tag** childrens, Attribute** attributes) @cname("create_blockquote_tag");
extern fn Tag* tag_address(Tag** childrens, Attribute** attributes) @cname("create_address_tag");
extern fn Tag* tag_time(Tag** childrens, Attribute** attributes) @cname("create_time_tag");
extern fn Tag* tag_del(Tag** childrens, Attribute** attributes) @cname("create_del_tag");
extern fn Tag* tag_ins(Tag** childrens, Attribute** attributes) @cname("create_ins_tag");
extern fn Tag* tag_br(Tag** childrens, Attribute** attributes) @cname("create_br_tag");
extern fn Tag* tag_hr(Tag** childrens, Attribute** attributes) @cname("create_hr_tag");
extern fn Tag* tag_wbr(Tag** childrens, Attribute** attributes) @cname("create_wbr_tag");

// Sectioning and grouping
extern fn Tag* tag_section(Tag** childrens, Attribute** attributes) @cname("create_section_tag");
extern fn Tag* tag_article(Tag** childrens, Attribute** attributes) @cname("create_article_tag");
extern fn Tag* tag_header(Tag** childrens, Attribute** attributes) @cname("create_header_tag");
extern fn Tag* tag_footer(Tag** childrens, Attribute** attributes) @cname("create_footer_tag");
extern fn Tag* tag_main(Tag** childrens, Attribute** attributes) @cname("create_main_tag");
extern fn Tag* tag_nav(Tag** childrens, Attribute** attributes) @cname("create_nav_tag");
extern fn Tag* tag_aside(Tag** childrens, Attribute** attributes) @cname("create_aside_tag");
extern fn Tag* tag_figure(Tag** childrens, Attribute** attributes) @cname("create_figure_tag");
extern fn Tag* tag_figcaption(Tag** childrens, Attribute** attributes) @cname("create_figcaption_tag");
extern fn Tag* tag_ul(Tag** childrens, Attribute** attributes) @cname("create_ul_tag");
extern fn Tag* tag_ol(Tag** childrens, Attribute** attributes) @cname("create_ol_tag");
extern fn Tag* tag_li(Tag** childrens, Attribute** attributes) @cname("create_li_tag");
extern fn Tag* tag_dl(Tag** childrens, Attribute** attributes) @cname("create_dl_tag");
extern fn Tag* tag_dt(Tag** childrens, Attribute** attributes) @cname("create_dt_tag");
extern fn Tag* tag_dd(Tag** childrens, Attribute** attributes) @cname("create_dd_tag");
extern fn Tag* tag_details(Tag** childrens, Attribute** attributes) @cname("create_details_tag");
extern fn Tag* tag_summary(Tag** childrens, Attribute** attributes) @cname("create_summary_tag");
extern fn Tag* tag_dialog(Tag** childrens, Attribute** attributes) @cname("create_dialog_tag");

// Tables
extern fn Tag* tag_table(Tag** childrens, Attribute** attributes) @cname("create_table_tag");
extern fn Tag* tag_caption(Tag** childrens, Attribute** attributes) @cname("create_caption_tag");
extern fn Tag* tag_thead(Tag** childrens, Attribute** attributes) @cname("create_thead_tag");
extern fn Tag* tag_tbody(Tag** childrens, Attribute** attributes) @cname("create_tbody_tag");
extern fn Tag* tag_tfoot(Tag** childrens, Attribute** attributes) @cname("create_tfoot_tag");
extern fn Tag* tag_tr(Tag** childrens, Attribute** attributes) @cname("create_tr_tag");
extern fn Tag* tag_th(Tag** childrens, Attribute** attributes) @cname("create_th_tag");
extern fn Tag* tag_td(Tag** childrens, Attribute** attributes) @cname("create_td_tag");
extern fn Tag* tag_colgroup(Tag** childrens, Attribute** attributes) @cname("create_colgroup_tag");
extern fn Tag* tag_col(Tag** childrens, Attribute** attributes) @cname("create_col_tag");

// Embedded content
extern fn Tag* tag_img(Tag** childrens, Attribute** attributes) @cname("create_img_tag");
extern fn Tag* tag_picture(Tag** childrens, Attribute** attributes) @cname("create_picture_tag");
extern fn Tag* tag_source(Tag** childrens, Attribute** attributes) @cname("create_source_tag");
extern fn Tag* tag_track(Tag** childrens, Attribute** attributes) @cname("create_track_tag");
extern fn Tag* tag_video(Tag** childrens, Attribute** attributes) @cname("create_video_tag");
extern fn Tag* tag_audio(Tag** childrens, Attribute** attributes) @cname("create_audio_tag");
extern fn Tag* tag_canvas(Tag** childrens, Attribute** attributes) @cname("create_canvas_tag");
extern fn Tag* tag_iframe(Tag** childrens, Attribute** attributes) @cname("create_iframe_tag");
extern fn Tag* tag_embed(Tag** childrens, Attribute** attributes) @cname("create_embed_tag");
extern fn Tag* tag_object(Tag** childrens, Attribute** attributes) @cname("create_object_tag");
extern fn Tag* tag_map(Tag** childrens, Attribute** attributes) @cname("create_map_tag");
extern fn Tag* tag_area(Tag** childrens, Attribute** attributes) @cname("create_area_tag");

// Forms
extern fn Tag* tag_form(Tag** childrens, Attribute** attributes) @cname("create_form_tag");
extern fn Tag* tag_label(Tag** childrens, Attribute** attributes) @cname("create_label_tag");
extern fn Tag* tag_input(Tag** childrens, Attribute** attributes) @cname("create_input_tag");
extern fn Tag* tag_textarea(Tag** childrens, Attribute** attributes) @cname("create_textarea_tag");
extern fn Tag* tag_select(Tag** childrens, Attribute** attributes) @cname("create_select_tag");
extern fn Tag* tag_option(Tag** childrens, Attribute** attributes) @cname("create_option_tag");
extern fn Tag* tag_optgroup(Tag** childrens, Attribute** attributes) @cname("create_optgroup_tag");
extern fn Tag* tag_fieldset(Tag** childrens, Attribute** attributes) @cname("create_fieldset_tag");
extern fn Tag* tag_legend(Tag** childrens, Attribute** attributes) @cname("create_legend_tag");
extern fn Tag* tag_datalist(Tag** childrens, Attribute** attributes) @cname("create_datalist_tag");
extern fn Tag* tag_output(Tag** childrens, Attribute** attributes) @cname("create_output_tag");
extern fn Tag* tag_progress(Tag** childrens, Attribute** attributes) @cname("create_progress_tag");
extern fn Tag* tag_meter(Tag** childrens, Attribute** attributes) @cname("create_meter_tag");

// Templates
extern fn Tag* tag_template(Tag** childrens, Attribute** attributes) @cname("create_template_tag");
extern fn Tag* tag_slot(Tag** childrens, Attribute** attributes) @cname("create_slot_tag");

// CSS
extern fn void style_file(const char* filename) @cname("style_file");

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


// Tag macros
macro Arg p(Arg... args) => arg_html(collect(&tag_p, args));

macro Arg button(Arg... args) => arg_html(collect(&tag_button, args));

macro Arg a(Arg... args) => arg_html(collect(&tag_a, args));

macro Arg div_(Arg... args) => arg_html(collect(&tag_div, args));

macro Arg fragment(Arg... args) => arg_html(collect(&tag_fragment, args));

// Headings
macro Arg h1(Arg... args) => arg_html(collect(&tag_h1, args));

macro Arg h2(Arg... args) => arg_html(collect(&tag_h2, args));

macro Arg h3(Arg... args) => arg_html(collect(&tag_h3, args));

macro Arg h4(Arg... args) => arg_html(collect(&tag_h4, args));

macro Arg h5(Arg... args) => arg_html(collect(&tag_h5, args));

macro Arg h6(Arg... args) => arg_html(collect(&tag_h6, args));

// Inline text
macro Arg span(Arg... args) => arg_html(collect(&tag_span, args));

macro Arg strong(Arg... args) => arg_html(collect(&tag_strong, args));

macro Arg em(Arg... args) => arg_html(collect(&tag_em, args));

macro Arg b(Arg... args) => arg_html(collect(&tag_b, args));

macro Arg i(Arg... args) => arg_html(collect(&tag_i, args));

macro Arg u(Arg... args) => arg_html(collect(&tag_u, args));

macro Arg s(Arg... args) => arg_html(collect(&tag_s, args));

macro Arg small(Arg... args) => arg_html(collect(&tag_small, args));

macro Arg mark(Arg... args) => arg_html(collect(&tag_mark, args));

macro Arg code(Arg... args) => arg_html(collect(&tag_code, args));

macro Arg pre(Arg... args) => arg_html(collect(&tag_pre, args));

macro Arg kbd(Arg... args) => arg_html(collect(&tag_kbd, args));

macro Arg samp(Arg... args) => arg_html(collect(&tag_samp, args));

macro Arg var_(Arg... args) => arg_html(collect(&tag_var, args));

macro Arg cite(Arg... args) => arg_html(collect(&tag_cite, args));

macro Arg abbr(Arg... args) => arg_html(collect(&tag_abbr, args));

macro Arg q(Arg... args) => arg_html(collect(&tag_q, args));

macro Arg sub(Arg... args) => arg_html(collect(&tag_sub, args));

macro Arg sup(Arg... args) => arg_html(collect(&tag_sup, args));

macro Arg blockquote(Arg... args) => arg_html(collect(&tag_blockquote, args));

macro Arg address(Arg... args) => arg_html(collect(&tag_address, args));

macro Arg time_(Arg... args) => arg_html(collect(&tag_time, args));

macro Arg del(Arg... args) => arg_html(collect(&tag_del, args));

macro Arg ins(Arg... args) => arg_html(collect(&tag_ins, args));

macro Arg br(Arg... args) => arg_html(collect(&tag_br, args));

macro Arg hr(Arg... args) => arg_html(collect(&tag_hr, args));

macro Arg wbr(Arg... args) => arg_html(collect(&tag_wbr, args));

// Sectioning and grouping
macro Arg section(Arg... args) => arg_html(collect(&tag_section, args));

macro Arg article(Arg... args) => arg_html(collect(&tag_article, args));

macro Arg header(Arg... args) => arg_html(collect(&tag_header, args));

macro Arg footer(Arg... args) => arg_html(collect(&tag_footer, args));

macro Arg main_(Arg... args) => arg_html(collect(&tag_main, args));

macro Arg nav(Arg... args) => arg_html(collect(&tag_nav, args));

macro Arg aside(Arg... args) => arg_html(collect(&tag_aside, args));

macro Arg figure(Arg... args) => arg_html(collect(&tag_figure, args));

macro Arg figcaption(Arg... args) => arg_html(collect(&tag_figcaption, args));

macro Arg ul(Arg... args) => arg_html(collect(&tag_ul, args));

macro Arg ol(Arg... args) => arg_html(collect(&tag_ol, args));

macro Arg li(Arg... args) => arg_html(collect(&tag_li, args));

macro Arg dl(Arg... args) => arg_html(collect(&tag_dl, args));

macro Arg dt(Arg... args) => arg_html(collect(&tag_dt, args));

macro Arg dd(Arg... args) => arg_html(collect(&tag_dd, args));

macro Arg details(Arg... args) => arg_html(collect(&tag_details, args));

macro Arg summary(Arg... args) => arg_html(collect(&tag_summary, args));

macro Arg dialog(Arg... args) => arg_html(collect(&tag_dialog, args));

// Tables
macro Arg table(Arg... args) => arg_html(collect(&tag_table, args));

macro Arg caption(Arg... args) => arg_html(collect(&tag_caption, args));

macro Arg thead(Arg... args) => arg_html(collect(&tag_thead, args));

macro Arg tbody(Arg... args) => arg_html(collect(&tag_tbody, args));

macro Arg tfoot(Arg... args) => arg_html(collect(&tag_tfoot, args));

macro Arg tr(Arg... args) => arg_html(collect(&tag_tr, args));

macro Arg th(Arg... args) => arg_html(collect(&tag_th, args));

macro Arg td(Arg... args) => arg_html(collect(&tag_td, args));

macro Arg colgroup(Arg... args) => arg_html(collect(&tag_colgroup, args));

macro Arg col(Arg... args) => arg_html(collect(&tag_col, args));

// Embedded content
macro Arg img(Arg... args) => arg_html(collect(&tag_img, args));

macro Arg picture(Arg... args) => arg_html(collect(&tag_picture, args));

macro Arg source(Arg... args) => arg_html(collect(&tag_source, args));

macro Arg track(Arg... args) => arg_html(collect(&tag_track, args));

macro Arg video(Arg... args) => arg_html(collect(&tag_video, args));

macro Arg audio(Arg... args) => arg_html(collect(&tag_audio, args));

macro Arg canvas(Arg... args) => arg_html(collect(&tag_canvas, args));

macro Arg iframe(Arg... args) => arg_html(collect(&tag_iframe, args));

macro Arg embed(Arg... args) => arg_html(collect(&tag_embed, args));

macro Arg object(Arg... args) => arg_html(collect(&tag_object, args));

macro Arg map_(Arg... args) => arg_html(collect(&tag_map, args));

macro Arg area(Arg... args) => arg_html(collect(&tag_area, args));

// Forms
macro Arg form(Arg... args) => arg_html(collect(&tag_form, args));

macro Arg label(Arg... args) => arg_html(collect(&tag_label, args));

macro Arg input(Arg... args) => arg_html(collect(&tag_input, args));

macro Arg textarea(Arg... args) => arg_html(collect(&tag_textarea, args));

macro Arg select_(Arg... args) => arg_html(collect(&tag_select, args));

macro Arg option(Arg... args) => arg_html(collect(&tag_option, args));

macro Arg optgroup(Arg... args) => arg_html(collect(&tag_optgroup, args));

macro Arg fieldset(Arg... args) => arg_html(collect(&tag_fieldset, args));

macro Arg legend(Arg... args) => arg_html(collect(&tag_legend, args));

macro Arg datalist(Arg... args) => arg_html(collect(&tag_datalist, args));

macro Arg output(Arg... args) => arg_html(collect(&tag_output, args));

macro Arg progress(Arg... args) => arg_html(collect(&tag_progress, args));

macro Arg meter(Arg... args) => arg_html(collect(&tag_meter, args));

// Templates
macro Arg template_(Arg... args) => arg_html(collect(&tag_template, args));

macro Arg slot(Arg... args) => arg_html(collect(&tag_slot, args));

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

fn void append_tree_at(char* query, Tag* tree)
{
    char* html = repr_html_tag(tree);
    if (html == null) return;

    add_at(query, html);

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

macro void append(char* query, Arg... args) {
	append_tree_at(query, collect((&tag_fragment, args)));
}