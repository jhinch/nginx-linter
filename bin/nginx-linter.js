#!/usr/bin/env node

let cli = require('./_cli');

/*jshint noconsole:off */
process.exitCode = cli.main(process.argv.slice(2), console);
