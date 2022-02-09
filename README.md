[![NPM version][npm-image]][npm-url]
[![build status][github-actions-image]][github-actions-url]
[![Code coverage][coveralls-image]][coveralls-url]

# nginx-linter

A command line tool for validating nginx files for style and common pitfalls.

## Installation

### Requirements

* Node 12+

### Instructions

You can install nginx-linter globally using:

    npm install -g nginx-linter

## User Guide

You can run nginx-linter without any configurations like so:

    nginx-linter

This will by default validate the configuration files under `/etc/nginx/`.
For all the options, you can use the `--help`:

    nginx-linter --help

### Built-in rules

There are a number of built in rules in nginx-linter designed both keep
your nginx configuration style consist but also to find common pitfalls
which may cause bugs in production.

#### `if-is-evil`

The `if` directive has a number of [common pitfalls](https://www.nginx.com/resources/wiki/start/topics/depth/ifisevil/) due to nginx configuration
being a declarative language not a procedural one and as a result should
either be used sparingly or not at all. There are two modes for this rule
which can be used:

* **always** - Don't allow any uses of the `if` directive regardless if they are a safe to use
* **mostly** - Only allow uses of the `if` directive which are documented as safe to use

Default value: **mostly**

#### `indentation`

Enforces a consistent indentation for all directive blocks and lua blocks. If the configuration value
is a digit, it indicates the number of spaces to use for each level of indentation. Alternatively,
you can use `tab` as the value to use tabs for indentation.

Default value: **4**

#### `line-ending`

Enforce a consistent line ending within the file. The configuration value can either be `lf` for
Unix/Linux/MacOS style newlines or `crlf` for Windows style newlines.

Default value: **lf**

#### `location-order`

This rules enforces that locations are ordered in the same order in which they will would take
precedence when matching requests. A common pitfall is thinking that Nginx configuration is
matched sequentially which [isn't the case](https://nginx.org/en/docs/http/ngx_http_core_module.html#location). By
enforcing that locations are ordered in precedence order, this will lead to less surprising results in production.

#### `strict-location`

`location` directives have a number of modifiers which can be used change the way the location
matches. As these are special symbols it can be difficult for a novice to remember which modes
allow for regular expressions and which ones are regular string comparisons. `strict-location`
checks that prefix and exact matches don't use regular expressions in the location URI.

#### `trailing-whitespace`

Enforce that no line ends with whitespace. This rule is largely for cleanliness and style purposes.

[npm-image]: https://img.shields.io/npm/v/nginx-linter.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/nginx-linter
[github-actions-image]: https://github.com/jhinch/nginx-linter/actions/workflows/main.yml/badge.svg
[github-actions-url]: https://github.com/jhinch/nginx-linter/actions/workflows/main.yml
[coveralls-image]: https://img.shields.io/coveralls/jhinch/nginx-linter/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/jhinch/nginx-linter?branch=master
