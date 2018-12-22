let peg = require('pegjs');
let fs = require('fs');

module.exports = peg.generate(`
{
  function parseNode(type, pos, customizer) {
    let node = { type: type, pos: pos };
    customizer(node);
    return node;
  }

  function textNode(type, pos, text) {
    return parseNode(type, pos, node => node.text = text);
  }

  function punctuationNode(pos, text) {
    return textNode('punctuation', pos, text);
  }
}

start
  = Directives

Directives
  = nodes:_ directives:(Directive_)* {
    directives.forEach(_ => nodes.push(_));
    return nodes;
  }

Directive_
 = directive:Directive nodes:_ {
   nodes.unshift(directive);
   return nodes;
 }

Directive
  = name:$(directive_name) parameters:Parameters body:DirectiveBody {
    return parseNode('directive', location(), node => {
      node.name = name;
      node.parameters = parameters;
      node.body = body;
    });
  }

Parameters
  = parameters:__Parameter* tail:_ {
    let nodes = [];
    parameters.forEach(_ => nodes.push(_));
    tail.forEach(_ => nodes.push(_));
    return nodes;
  }

__Parameter
  = nodes:__ parameter:Parameter {
    nodes.push(parameter);
    return nodes;
  }

Parameter
  = (single_quoted_string / double_quoted_string / raw_identifier)
  { return textNode('parameter', location(), text()); }

DirectiveBody
  = DirectiveBodyBlock / DirectiveBodyEmpty

DirectiveBodyEmpty
  = semicolon:Semicolon { return [semicolon]; }

DirectiveBodyBlock
  = openBrace:OpenBrace directives:Directives closeBrace:CloseBrace {
    directives.unshift(openBrace);
    directives.push(closeBrace);
    return directives;
  }

Semicolon
  = semicolon { return punctuationNode(location(), text()); }

OpenBrace
  = open_brace { return punctuationNode(location(), text()); }

CloseBrace
  = close_brace { return punctuationNode(location(), text()); }

Newline
  = newline { return textNode('newline', location(), text()); }

Whitespace
  = (whitespace)+ { return textNode('whitespace', location(), text()); }

Comment
  = '#' (!newline .)* { return textNode('comment', location(), text()); }

directive_name
  = raw_identifier

raw_identifier
  = (!(whitespace / semicolon / open_brace / close_brace) .) (!(whitespace / semicolon / open_brace) .)*

single_quoted_string
  = "'" ('\\\\' . / !"'" .)* "'"

double_quoted_string
  = '"' ('\\\\' . / !'"' .)* '"'

newline
  = '\\n'
  / '\\r' '\\n'

whitespace
  = ' '
  / '\\t'

semicolon
  = ';'

open_brace
  = '{'

close_brace
  = '}'

_
  = (Whitespace / Newline / Comment)*

__
  = (Whitespace / Newline / Comment)+

`);
