/**
 * @file GenExpr grammar for tree-sitter
 * @author sadguitarius
 * with a hefty amount of inspiration from the
 * C grammar by Max Brunsfeld Amaan Qureshi
 * @license MIT
 */

// TODO: handle single line expressions

module.exports = grammar({
  name: 'genexpr',

  extras: $ => [/\s|\r?\n/, $.comment],

  // inline: $ => [$._statement],

  precedences: $ => [
    [
      // $.type_specifier,
      // $.inlet_outlet,
      // $.identifier,
      $.function_declaration,
      $.declaration,
      // 'call',
      $.jump_statement,
      $.function_declaration_parameter,
      $._primary_expression,
      $.postfix_expression,
      $.unary_expression,
      $._simple_expression,
      $._true_expression,
      $.binary_expression,
      'binary_times',
      'binary_plus',
      'binary_shift',
      'binary_compare',
      'bitwise_and',
      'bitwise_xor',
      'bitwise_or',
      'logical_and',
      'logical_xor',
      'logical_or',
      'ternary',
      $.single_assignment,
      $.multiple_assignment,
      $._expression
    ]
  ],

  // conflicts: $ => [
  //   [$._primary_expression, $.function_declaration],
  //   [$._primary_expression, $.function_declaration_parameter]
  // ],

  // word: $ => $.identifier,

  supertypes: $ => [
    $._expression,
    $.iteration_statement,
    $.jump_statement
    // $.postfix_expression
  ],

  rules: {
    translation_unit: $ =>
      //program: $ =>
      seq(
        optional(repeat($.compiler_command)),
        optional(repeat($.function_declaration)),
        optional(repeat($.declaration)),
        repeat($._statement)
      ),

    // Main Grammar

    _error_missing_semicolon: _ => token.immediate(prec(-1, '')),
    error_missing_semicolon: _ => prec(-1, seq()),

    _compiler_command: $ =>
      seq(
        'require',
        choice(seq('(', $.string_literal, ')'), $.string_literal),
      ),

    compiler_command: $ =>
      choice(
        seq($._compiler_command, ';'),
        seq(
          $._compiler_command,
          alias($._error_missing_semicolon, $.error_missing_semicolon)
        )
      ),

    function_declaration: $ =>
      seq(
        field('name', $.identifier),
        '(', commaSep($.function_declaration_parameter), ')',
        $.function_declaration_body
      ),

    function_declaration_body: $ =>
      seq(
        '{',
        optional(repeat(seq($.declaration))),
        $._expr_statement_list,
        '}',
      ),


    function_declaration_parameter: $ =>
      choice(
        seq(
          field('key', $.identifier),
          '=',
          field('value', $._true_expression)
        ),
        choice(field('value', $.identifier), $.inlet_outlet)
      ),

    // Not using prec.left() here ?
    _declaration: $ =>
      seq(
        $.type_specifier,
        commaSep1(seq($.identifier, optional($.call_member_expression))),
      ),

    declaration: $ =>
      choice(
        seq($._declaration, ';'),
        seq($._declaration, alias($._error_missing_semicolon, $.error_missing_semicolon))
      ),


    // Statements

    //statement: $ => choice($.compound_statement, $._simple_statement),
    _statement: $ => choice($.compound_statement, $._simple_statement),

    _simple_statement: $ =>
      choice(
        $.jump_statement,
        $.expression_statement,
        $.selection_statement,
        $.iteration_statement
      ),

    compound_statement: $ => seq('{', $._expr_statement_list, '}'),

    _expr_statement_list: $ =>
      choice(
        seq(
          repeat1(
            choice(
              $.compound_statement,
              $.expression_statement,
              $.selection_statement,
              $.iteration_statement
            )
          ),
          optional($.jump_statement)
        ),
        $.return_statement
      ),

    _expression_statement_content: $ => $._expression,

    // Bit weird but seems to work
    expression_statement: $ =>
      choice(
        choice(
          seq($._expression_statement_content, ';'),
          seq($._expression_statement_content, alias($._error_missing_semicolon, $.error_missing_semicolon))
        ),
        ';'
      ),

    selection_statement: $ =>
      prec.right(
        seq(
          'if',
          '(',
          field('condition', $._expression),
          ')',
          field('consequence', $._statement),
          optional(field('alternative', $.else_clause))
        )
      ),

    else_clause: $ => seq('else', $._statement),

    iteration_statement: $ =>
      choice($.while_statement, $.do_statement, $.for_statement),

    while_statement: $ =>
      seq(
        'while',
        '(',
        field('condition', $._expression),
        ')',
        field('body', $._statement)
      ),

    _do_statement: $ =>
      seq(
        'do',
        field('body', $._statement),
        'while',
        '(',
        field('condition', $._expression),
        ')',
      ),

    do_statement: $ =>
      choice(
        seq($._do_statement, ';'),
        seq($._do_statement, alias($._error_missing_semicolon, $.error_missing_semicolon)),
      ),

    for_statement: $ =>
      seq(
        'for',
        '(',
        field('initializer', $.multi_declaration_expression),
        choice(';', alias($._error_missing_semicolon, $.error_missing_semicolon)),
        field('condition', $._expression),
        choice(';', alias($._error_missing_semicolon, $.error_missing_semicolon)),
        field('update', optional($._expression)),
        ')',
        field('body', $._statement)
      ),

    jump_statement: $ =>
      choice($.continue_statement, $.break_statement, $.return_statement),

    continue_statement: $ =>
      choice(
        seq('continue', ';'),
        seq('continue', alias($._error_missing_semicolon, $.error_missing_semicolon))
      ),

    break_statement: $ =>
      choice(
        seq('break', ';'),
        seq('break', alias($._error_missing_semicolon, $.error_missing_semicolon)),
      ),

    return_statement: $ =>
      choice(
        seq('return', commaSep($._true_expression), ';'),
        seq('return', commaSep($._true_expression), alias($._error_missing_semicolon, $.error_missing_semicolon)),
      ),

    //jump_statement: $ =>
    //  choice($.continue_statement, $.break_statement, $.return_statement),
    //
    //continue_statement: _ => seq('continue', ';'),
    //break_statement: _ => seq('break', ';'),
    //return_statement: $ => seq('return', commaSep($._true_expression), ';'),

    // Expressions
    _expression: $ => choice($._assignment_expression, $._true_expression),

    _assignment_expression: $ =>
      choice($.single_assignment, $.multiple_assignment),

    multiple_assignment: $ =>
      choice(
        prec.right(
          // 'assign',
          seq(
            field('left', commaSep1($._simple_expression)),
            field('operator', $.assignment_operator),
            field('right', commaSep1($._true_expression))
          )
        )
      ),

    single_assignment: $ =>
      prec.right(
        // 'assign',
        seq(
          field('left', $._simple_expression),
          field('operator', $.assignment_operator),
          field('right', $._true_expression)
        )
      ),

    _simple_expression: $ =>
      choice($.unary_expression, $.postfix_expression, $._primary_expression),

    assignment_operator: _ => choice('=', '*=', '/=', '%=', '+=', '-='),

    single_declaration_expression: $ =>
      prec.right(
        // 'assign',
        seq(
          field('left', choice($.identifier, $.inlet_outlet)),
          field('operator', '='),
          field('right', $._true_expression)
        )
      ),

    multi_declaration_expression: $ =>
      prec.right(
        // 'assign',
        seq(
          field('left', commaSep1(choice($.identifier, $.inlet_outlet))),
          field('operator', '='),
          field('right', commaSep1($._true_expression))
        )
      ),

    _true_expression: $ =>
      prec.right(
        choice(
          $.conditional_expression,
          $.binary_expression,
          $.unary_expression,
          $.postfix_expression,
          $._primary_expression,
          $.parenthesized_expression,
          //$._literal
        )
      ),

    conditional_expression: $ =>
      prec.right(
        'ternary',
        seq(
          field('condition', choice($.binary_expression, $.identifier)),
          '?',
          optional(field('consequence', $._expression)),
          ':',
          field('alternative', $._expression)
        )
      ),

    binary_expression: $ => {
      const table = [
        ['+', 'binary_plus'],
        ['-', 'binary_plus'],
        ['*', 'binary_times'],
        ['/', 'binary_times'],
        ['%', 'binary_times'],
        ['<=p', 'binary_compare'],
        ['>=p', 'binary_compare'],
        ['<p', 'binary_compare'],
        ['>p', 'binary_compare'],
        ['<=', 'binary_compare'],
        ['>=', 'binary_compare'],
        ['<', 'binary_compare'],
        ['>', 'binary_compare'],
        ['==', 'binary_compare'],
        ['!=', 'binary_compare'],
        ['&&', 'logical_and'],
        ['||', 'logical_or'],
        ['^^', 'logical_xor']
        // ['<<', 'bitshift'],
        // ['>>', 'bitshift'],
        // ['&', 'bitwise_and'],
        // ['|', 'bitwise_or'],
        // ['^', 'bitwise_xor'],
      ];

      return choice(
        choice(
          ...table.map(([operator, precedence]) => {
            return prec.left(
              precedence,
              seq(
                field(
                  'left',
                  choice(
                    $._simple_expression,
                    $.parenthesized_expression,
                    $.binary_expression
                  )
                ),
                field('operator', operator),
                field(
                  'right',
                  choice(
                    $._simple_expression,
                    $.parenthesized_expression,
                    $.binary_expression
                  )
                )
              )
            );
          })
        )
      );
    },

    unary_expression: $ =>
      prec.left(
        // 'unary',
        seq(
          field('operator', choice('-', '!', '~')),
          field(
            'argument',
            choice($._simple_expression, $.parenthesized_expression)
          )
        )
      ),

    postfix_expression: $ =>
      prec.left(
        seq(
          field('object', $._primary_expression),
          field(
            'field',
            choice(
              $.computed_member_expression,
              $.literal_member_expression,
              $.call_member_expression
            )
          )
        )
      ),

    computed_member_expression: $ =>
      seq('[', field('field', $._true_expression), ']'),

    literal_member_expression: $ =>
      seq(
        '.',
        field('field', $.identifier),
        optional(field('parameters', $.call_member_expression))
      ),

    call_member_expression: $ =>
      seq(
        '(',
        field(
          'argument',
          commaSep(
            choice(
              $._true_expression,
              //seq($.identifier, '=', $._true_expression)
              // is in fact an attribute
              $.named_argument
            )
          )
        ),
        ')'
      ),

    named_argument: $ =>
      seq(
        field('key', $.identifier),
        '=',
        field('value', $._true_expression)
      ),

    // call_expression_arguments: $ => $.arguments,

    // arguments: $ => commaSep1($.argument),

    // argument: $ => seq($.identifier, '=', $._true_expression),

    _primary_expression: $ => choice($.identifier, $._literal, $.inlet_outlet),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    type_specifier: _ =>
      prec(
        2,
        // Modified this to be case sensitive
        token(choice(/Param/, /History/, /Buffer/, /Data/, /Delay/))
      ),

    inlet_outlet: _ => prec(2, token(seq('', /(in|out)[0-9]+/i))),

    // TODO: exclude reserved words pegjs line 705
    identifier: _ => prec(1, /[_a-z][_a-z0-9]*/i),

    _literal: $ => choice($.number_literal, $.string_literal),

    number_literal: _ => {
      const decimal = /[0-9]/;
      const decimalDigits = seq(repeat1(decimal));
      return token(
        seq(
          optional(/[-\+]/),
          choice(
            seq(decimalDigits, optional(seq('.', optional(decimalDigits)))),
            seq('.', decimalDigits)
          ),
          optional(seq('e', decimalDigits))
        )
      );
    },

    _string: $ => prec.left($.string_literal),

    // TODO: figure out valid string in genexpr -- pegjs line 806
    string_literal: $ =>
      seq(
        '"',
        repeat(
          choice(alias(token.immediate(prec(1, /[^\\"\n]+/)), $.string_content))
        ),
        '"'
      ),

    // TODO: boolean and null literals -- pegjs line 777

    comment: _ =>
      token(
        choice(
          seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
          seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
        )
      )
  }
});

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 *
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
