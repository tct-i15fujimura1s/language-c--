const _repch = (...elements) => repeat(choice(...elements));
const _repsq = (...elements) => repeat(seq(...elements));
const _optsq = (...elements) => optional(seq(...elements));
const _list = (...elements) => seq(...elements, _repsq(',', ...elements));
const _s_List = (sep, e) => seq(e, _repsq(sep, e));
const _s_Rist = (sep, e) => seq(_repsq(e, sep), e);
const _grp = $ => seq('(', $.expr, ')');

const PREC = {
  ASSIGN: 1,
  LOGOR: 2,
  LOGAND: 3,
  OR: 4,
  XOR: 5,
  AND: 6,
  EQ: 7,
  COMP: 8,
  SHIFT: 9,
  ADD: 10,
  MULTIPLY: 11
};

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

    declare_local_var: $ => seq($.type, _list($.name, _optsq('=', $.e_binary))),

    statement: $ => choice($.st_if, $.st_while, $.st_do_while, $.st_for, $.st_return, $.st_break, $.st_continue, $.block, seq($.expr, ';'), ';'),

    st_if: $ => prec.left(seq('if', _grp($), $.statement, _optsq('else', $.statement))),

    _while: $ => seq('while', _grp($)),

    st_while: $ => seq($._while, $.statement),

    st_do_while: $ => seq('do', $.statement, $._while, ';'),

    st_for: $ => seq('for', '(', optional(seq($.expr, $.declare_local_var)), ';', optional($.expr), ';', optional($.expr), ')', $.statement),

    st_return: $ => seq('return', $.expr, ';'),

    st_break: $ => seq('break', ';'),

    st_continue: $ => seq('continue', ';'),

    expr: $ => _list($.e_binary),

    e_binary: $ => choice(
      ...[
        ['=', PREC.ASSIGN],
        ['||', PREC.LOGOR],
        ['&&', PREC.LOGAND],
        ['|', PREC.OR],
        ['^', PREC.XOR],
        ['&', PREC.AND],
        ['==', PREC.EQ],
        ['!=', PREC.EQ],
        ['<', PREC.COMP],
        ['<=', PREC.COMP],
        ['>', PREC.COMP],
        ['>=', PREC.COMP],
        ['<<', PREC.SHIFT],
        ['<<', PREC.SHIFT],
        ['+', PREC.ADD],
        ['-', PREC.ADD],
        ['*', PREC.MULTIPLY],
        ['/', PREC.MULTIPLY],
        ['%', PREC.MULTIPLY]
      ].map(([op, prc]) => prec.left(prc, seq($.e_unary, op, $.e_unary)))
    ),

    e_unary: $ => seq(_repch('+', '-', '!', '~'), $.e_factor),

    e_factor: $ => prec.right(16, choice($.name, $.const, $.funcall, _grp($), seq($.e_factor, '[', $.e_binary, ']'),
      seq($.e_factor, '.', $.name), seq('sizeof', _grp($)), seq('addrof', _grp($)),
      seq('chr', _grp($)), seq('ord', _grp($)), seq('bool', _grp($)))),

    funcall: $ => seq($.name, '(', optional(_list($.e_binary)), ')'),

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
