#!/usr/bin/env node

let cli = require('./_cli');

process.exitCode = cli.main(process.argv.slice(2));
