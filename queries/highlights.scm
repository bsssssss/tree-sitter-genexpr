(identifier) @variable

; Function parameters in function declarations
(function_declaration_parameter
  (identifier) @variable.parameter)

; Function call arguments
(call_member_expression
  arguments: (identifier) @variable.argument)

; ((identifier) @constant
;  (#match? @constant "^[_a-zA-Z][_a-zA-Z0-9]*$"))

(["(" ")"]) @punctuation.bracket
(["{" "}"]) @punctuation.bracket
(["[" "]"]) @punctuation.bracket
([";" "," "."]) @punctuation.delimiter

"break" @keyword.break
"continue" @keyword.continue
"return" @keyword.return
"require" @keyword.require

(["if" "else"]) @keyword.conditional
(["for" "while"]) @keyword.repeat

(assignment_operator) @operator
(binary_expression) @operator
(string_literal) @string
(number_literal) @number
(type_specifier) @keyword.type
(inlet_outlet) @constant.builtin

(postfix_expression
  object: (identifier) @function)

(function_declaration
  name: (identifier) @function)

(comment) @comment
