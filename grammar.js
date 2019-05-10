const _repch = (...elements) => repeat(choice(...elements));
const _repsq = (...elements) => repeat(seq(...elements));
const _optsq = (...elements) => optional(seq(...elements));
const _list = (...elements) => seq(...elements, _repsq(',', ...elements));
const _s_List = (sep, e) => seq(e, _repsq(sep, e));
const _s_Rist = (sep, e) => seq(_repsq(e, sep), e);
const _grp = $ => seq('(', $.expr, ')');

module.exports = grammar({
  name: "cmm",

  rules: {
    source_file: $ => _repch($.declare_struct, $.declare_global_var, $.define_function, $.declare_function, $.preprocessor),

    declare_struct: $ => seq("struct", $.type, $.name, "{", repeat($._declare_field), "}", ";"),

    _declare_field: $ => seq($.type, _list($.name), ';'),

    declare_deceiving_type: $ => seq("typedef", $.name, ';'),

    declare_global_var: $ => seq($._declare_public_opt, $._var_init_list, ';'),

    _declare_public_opt: $ => seq(optional("public"), $.type),

    _var_init_list: $ => _list($._var_init_opt),

    _var_init_opt: $ => seq($.name, _optsq('=', $.initialize)),

    define_function: $ => seq($._declare_public_opt, $.name, '(', optional($.arg_list), ')', $.block),

    declare_function: $ => seq($._declare_public_opt, $.name, '(', optional($.arg_list), ')', ';'),

    initialize: $ => choice($.const, seq('{', _list($.initialize), '}'), seq("array", "(", _list($.number), ")")),

    arg_list: $ => choice(seq(_list($.type, $.name), _optsq(',', '...')), '...'),

    block: $ => seq('{', _repch($.declare_local_var, $.statement), '}'),

    declare_local_var: $ => seq($.type, _list($.name, _optsq('=', $.e_assign))),

    statement: $ => choice($.st_if, $.st_while, $.st_do_while, $.st_for, $.st_return, $.st_break, $.st_continue, $.block, seq($.expr, ';'), ';'),

    st_if: $ => prec.left(seq('if', _grp($), $.statement, _optsq('else', $.statement))),

    _while: $ => seq('while', _grp($)),

    st_while: $ => seq($._while, $.statement),

    st_do_while: $ => seq('do', $.statement, $._while, ';'),

    st_for: $ => seq('for', '(', optional(seq($.expr, $.declare_local_var)), ';', optional($.expr), ';', optional($.expr), ')', $.statement),

    st_return: $ => seq('return', $.expr, ';'),

    st_break: $ => seq('break', ';'),

    st_continue: $ => seq('continue', ';'),

    expr: $ => _list($.e_assign),

    e_assign: $ => _s_List('=', $.e_logical_or),

    e_logical_or: $ => _s_List('||', $.e_logical_and),

    e_logical_and: $ => _s_List('&&', $.e_or),

    e_or: $ => _s_List('|', $.e_xor),

    e_xor: $ => _s_List('^', $.e_and),

    e_and: $ => _s_List('&', $.e_eq),

    e_eq: $ => _s_List(choice('==', '!='), $.e_comp),

    e_comp: $ => _s_List(choice('<', '<=', '>', '>='), $.e_shift),

    e_shift: $ => _s_List(choice('<<', '>>'), $.e_add),

    e_add: $ => prec.left(_s_List(choice('+', '-'), $.e_multiply)),

    e_multiply: $ => _s_List(choice('*', '/', '%'), $.e_uniterm),

    e_uniterm: $ => seq(_repch('+', '-', '!', '~'), $.e_factor),

    e_factor: $ => prec.right(16, choice($.name, $.const, $.funcall, _grp($), seq($.e_factor, '[', $.e_assign, ']'),
      seq($.e_factor, '.', $.name), seq('sizeof', _grp($)), seq('addrof', _grp($)),
      seq('chr', _grp($)), seq('ord', _grp($)), seq('bool', _grp($)))),

    funcall: $ => seq($.name, '(', optional(_list($.e_assign)), ')'),

    type: $ => prec.right(8, choice('int', 'char', 'boolean', 'void', 'interrupt', $.name, seq($.type, '[', ']'))),

    const: $ => choice($.number, $.char, $.string, 'null', 'true', 'false'),

    name: $ => /[_A-Za-z][_0-9A-Za-z]*/,

    number: $ => /[1-9][0-9]*|0x[0-9a-f]+|0[0-7]*|0b[01]+/i,

    char: $ => seq('\'', choice(/[^'\\]/, $._escape), '\''),

    string: $ => seq('"', _repch(/[^"\\]/, $._escape), '"'),

    _escape: $ => /\\(x[0-9a-f]|.)/i,

    comments: $ => /\/\/[^\n]*|\/\*([^*]|\*[^\/])*\*\//,

    preprocessor: $ => /#.+/
  }
})
