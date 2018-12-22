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
