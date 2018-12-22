[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]

# nginx-linter

A command line tool for validating nginx files for style and common pitfalls.

## Installation

### Requirements

* Node 11+

### Instructions

You can install nginx-linter globally using:

    npm install -g nginx-linter

## User Guide

You can run nginx-linter without any configurations like so:

    nginx-linter

This will by default validate the configuration files under `/etc/nginx/`.
For all the options, you can use the `--help`:

    nginx-linter --help


[npm-image]: https://img.shields.io/npm/v/nginx-linter.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/nginx-linter
[travis-image]: https://img.shields.io/travis/jhinch/nginx-linter/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/jhinch/nginx-linter
