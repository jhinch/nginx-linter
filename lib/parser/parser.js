let peg = require('pegjs');

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
  = nodes:_ directives:Directive_* {
    directives.forEach(d => d.forEach(_ => nodes.push(_)));
    return nodes;
  }

Directive_
  = directive:(Directive) nodes:_ {
    nodes.unshift(directive);
    return nodes;
  }

Directive
  = LuaDirective
  / StandardDirective

LuaDirective
  = name:$(lua_directive_name) parameters:_ ob:OpenBrace body:LuaBlock cb:CloseBrace {
      return parseNode('directive', location(), node => {
        node.name = name;
        node.parameters = parameters;
        node.body = [ob, body, cb];
      });
  }

LuaBlock
  = body:Lua {
      return parseNode('lua:block', location(), node => {
          node.body = body;
      });
  }

Lua
  = outerNodes:((Whitespace / Newline / LuaComment / LuaCode)+ / LuaObject)* {
      let nodes = [];
      outerNodes.forEach(innerNodes => innerNodes.forEach(node => nodes.push(node)));
      return nodes;
  }

LuaObject
 = ob:OpenBrace nodes:Lua cb:CloseBrace {
     nodes.unshift(ob);
     nodes.push(cb);
     return nodes;
 }

LuaCode
  = (single_quoted_string / double_quoted_string / raw_lua_code) {
      return textNode('lua:code', location(), text());
  }

LuaComment
  = '--' (!newline .)* { return textNode('lua:comment', location(), text()); }

StandardDirective
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
    parameters.forEach(p => p.forEach(_ => nodes.push(_)));
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

lua_directive_name
  = 'access_by_lua_block'
  / 'balancer_by_lua_block'
  / 'body_filter_by_lua_block'
  / 'content_by_lua_block'
  / 'header_filter_by_lua_block'
  / 'init_by_lua_block'
  / 'init_worker_by_lua_block'
  / 'log_by_lua_block'
  / 'rewrite_by_lua_block'
  / 'set_by_lua_block'
  / 'ssl_certificate_by_lua_block'
  / 'ssl_session_fetch_by_lua_block'
  / 'ssl_session_store_by_lua_block'

directive_name
  = raw_identifier

raw_identifier
  = (!(whitespace / newline / semicolon / open_brace / close_brace) .) (!(whitespace / newline / semicolon / open_brace) .)*

raw_lua_code
  = (!(whitespace / newline / open_brace / close_brace / "'" / '"') .)+

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
