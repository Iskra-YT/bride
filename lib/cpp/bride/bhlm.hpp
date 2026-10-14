#ifndef BRIDE_HIGH_LEVEL_MODULE_HPP
#define BRIDE_HIGH_LEVEL_MODULE_HPP

#include "../../c/bride/bhlm.h"

namespace bride {
    using ::BrideArg;
    using ::BrideArgType;

    // Helpers
    using ::action;
    using ::attr;
    using ::class_;
    using ::id;
    using ::text;
    using ::textf;

    // Routing
    using ::route;
    using ::navigate;

    // Attribute helpers
    using ::href;
    using ::src;
    using ::alt;
    using ::title;
    using ::type;
    using ::name;
    using ::value;
    using ::placeholder;
    using ::for_;
    using ::style;
    using ::target;
    using ::rel;
    using ::role;
    using ::width;
    using ::height;
    using ::tabindex;
    using ::autocomplete;
    using ::accept;
    using ::min;
    using ::max;
    using ::step;
    using ::pattern;
    using ::rows;
    using ::cols;
    using ::method;
    using ::form_action;
    using ::enctype;
    using ::loading;
    using ::download;

    // Boolean attribute helpers
    using ::disabled;
    using ::checked;
    using ::selected;
    using ::required;
    using ::readonly;
    using ::multiple;
    using ::autofocus;
    using ::hidden;

    // Event helpers
    using ::on_click;
    using ::on_input;
    using ::on_change;
    using ::on_submit;
    using ::on_focus;
    using ::on_blur;
    using ::on_keydown;
    using ::on_keyup;
    using ::on_keypress;
    using ::on_dblclick;
    using ::on_mousedown;
    using ::on_mouseup;
    using ::on_mouseover;
    using ::on_mouseout;
    using ::on_mousemove;
    using ::on_scroll;
    using ::on_load;
    using ::on_contextmenu;
    using ::on_wheel;

    // Render helpers
    using ::__ui_impl;
    using ::__change_impl;
    using ::__append_impl;

    // Elements
    using ::__p_impl;
    using ::__button_impl;
    using ::__fragment_impl;
    using ::__a_impl;
    using ::__div_impl;

    // Headings
    using ::__h1_impl;
    using ::__h2_impl;
    using ::__h3_impl;
    using ::__h4_impl;
    using ::__h5_impl;
    using ::__h6_impl;

    // Inline text
    using ::__span_impl;
    using ::__strong_impl;
    using ::__em_impl;
    using ::__b_impl;
    using ::__i_impl;
    using ::__u_impl;
    using ::__s_impl;
    using ::__small_impl;
    using ::__mark_impl;
    using ::__code_impl;
    using ::__pre_impl;
    using ::__kbd_impl;
    using ::__samp_impl;
    using ::__var_impl;
    using ::__cite_impl;
    using ::__abbr_impl;
    using ::__q_impl;
    using ::__sub_impl;
    using ::__sup_impl;
    using ::__blockquote_impl;
    using ::__address_impl;
    using ::__time_impl;
    using ::__del_impl;
    using ::__ins_impl;
    using ::__br_impl;
    using ::__hr_impl;
    using ::__wbr_impl;

    // Sectioning and grouping
    using ::__section_impl;
    using ::__article_impl;
    using ::__header_impl;
    using ::__footer_impl;
    using ::__main_impl;
    using ::__nav_impl;
    using ::__aside_impl;
    using ::__figure_impl;
    using ::__figcaption_impl;
    using ::__ul_impl;
    using ::__ol_impl;
    using ::__li_impl;
    using ::__dl_impl;
    using ::__dt_impl;
    using ::__dd_impl;
    using ::__details_impl;
    using ::__summary_impl;
    using ::__dialog_impl;

    // Tables
    using ::__table_impl;
    using ::__caption_impl;
    using ::__thead_impl;
    using ::__tbody_impl;
    using ::__tfoot_impl;
    using ::__tr_impl;
    using ::__th_impl;
    using ::__td_impl;
    using ::__colgroup_impl;
    using ::__col_impl;

    // Embedded content
    using ::__img_impl;
    using ::__picture_impl;
    using ::__source_impl;
    using ::__track_impl;
    using ::__video_impl;
    using ::__audio_impl;
    using ::__canvas_impl;
    using ::__iframe_impl;
    using ::__embed_impl;
    using ::__object_impl;
    using ::__map_impl;
    using ::__area_impl;

    // Forms
    using ::__form_impl;
    using ::__label_impl;
    using ::__input_impl;
    using ::__textarea_impl;
    using ::__select_impl;
    using ::__option_impl;
    using ::__optgroup_impl;
    using ::__fieldset_impl;
    using ::__legend_impl;
    using ::__datalist_impl;
    using ::__output_impl;
    using ::__progress_impl;
    using ::__meter_impl;

    // Templates
    using ::__template_impl;
    using ::__slot_impl;

    // CSS
    using ::style_file;
}

#endif // BRIDE_HIGH_LEVEL_MODULE_HPP
