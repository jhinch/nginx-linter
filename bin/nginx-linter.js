#!/usr/bin/env node

let fs = require('fs');
let parser = require('../lib/parser');
let runRules = require('../lib/rules').run;
let {table, getBorderCharacters} = require('table');
let chalk = require('chalk');
let glob = require('glob');

const TABLE_CONFIG = {
    border: getBorderCharacters('void'),
    drawHorizontalLine: () => false,
    columns: {
        0: { // Line number
            alignment: 'right',
            paddingLeft: 2,
            paddingRight: 0
        },
        1: { // :
            alignment: 'center',
            paddingLeft: 0,
            paddingRight: 0
        },
        2: { // Column number
            alignment: 'left',
            paddingLeft: 0,
            paddingRight: 1
        },
        3: { // messageType
            alignment: 'left',
            paddingLeft: 0,
            paddingRight: 1
        },
        4: { // message
            alignment: 'left',
            paddingLeft: 0,
            paddingRight: 1
        },
        5: { // rule
            alignment: 'left',
            paddingLeft: 0,
            paddingRight: 0
        }
    }
};

const DEFAULTS = {
    command: 'validate',
    config: './.nginx-linter.json',
    includes: ['/etc/nginx/*.conf', '/etc/nginx/**/*.conf'],
    excludes: []
};

function parseOptions(args) {
    let options = Object.assign({}, DEFAULTS);
    let argsRemaining = args.slice(0);
    let customizedIncludes = false;
    let customizedExcludes = false;
    while (argsRemaining.length) {
        let headArg = argsRemaining.shift();
        switch (headArg) {
            case '--config':
                if (!argsRemaining.length) {
                    return 'Expected argument after --config';
                }
                options.config = argsRemaining.shift();
                break;
            case '--include':
                if (!argsRemaining.length) {
                    return 'Expected argument after --include';
                }
                if (customizedIncludes) {
                    options.includes.push(argsRemaining.shift());
                } else {
                    options.includes = [argsRemaining.shift()];
                    customizedIncludes = true;
                }
                break;
            case '--exclude':
                if (!argsRemaining.length) {
                    return 'Expected argument after --exclude';
                }
                if (customizedExcludes) {
                    options.excludes.push(argsRemaining.shift());
                } else {
                    options.excludes = [argsRemaining.shift()];
                    customizedExcludes = true;
                }
                break;
            case '--help':
                options.command = 'help';
                break;
            default:
                return `Unknown option: ${headArg}`;
        }
    }
    return options;
}

function execute(options) {
    switch (options.command) {
        case 'validate':
            return validate(options);
        default:
            throw `Unknown command: ${options.command}`;
    }
}

function help(options) {
    let error = typeof options === 'string' ? options : null;
    if (error) {
        console.log(error);
    }
    console.log('Usage: nginx-linter [arguments]');
    console.log('');
    console.log('Arguments:');
    console.log('--help                 Print this help message and exit');
    console.log(`--config <file>        Specify the configuration file to use. Default (${DEFAULTS.config})`);
    console.log(`--include <file|glob>  Include the file or glob in nginx files to validate. Can be specified multiple times. Default (${DEFAULTS.includes.join(', ')})`);
    console.log('--exclude <file|glob>  Exclue a file or glob in the nginx files to validate. Can be specieid multiple times. Excludes take precedence over includes');
    return error ? 1 : 0;
}

function validate(options) {
    let files = findFiles(options.includes, options.excludes);
    let errorCount = files.map(file => {
        let fileContents = fs.readFileSync(file, 'utf8');
        let parseTree = parser.parse(fileContents);
        let results = runRules(parseTree);
        if (results.length) {
            outputResults(file, results);
        }
        return results.filter(result => result.type === 'error').length;
    }).reduce((a, b) => a + b, 0);
    outputSummary({ fileCount: files.length, errorCount });
    return errorCount ? 1 : 0;
}

function findFiles(includes, excludes) {
    let includedFiles = findMatchingFiles(includes);
    let excludedFiles = findMatchingFiles(excludes);
    return includedFiles.filter(f => excludedFiles.indexOf(f) === -1);
}

function findMatchingFiles(globs) {
    let files = [];
    globs.forEach(globString => glob.sync(globString).forEach(file => files.push(file)));
    return files;
}

function outputResults(fileName, results) {
    console.log('');
    console.log(chalk.underline(fileName));
    let tableData = [];
    results.forEach(({pos, type, text, rule}) => {
        tableData.push([
            chalk.dim(pos.start.line),
            chalk.dim(':'),
            chalk.dim(pos.start.column),
            chalk.red(type),
            text,
            chalk.dim(rule)
        ]);
    });
    console.log(table(tableData, TABLE_CONFIG));
}

function outputSummary({fileCount, errorCount}) {
    console.log('');
    console.log(`${errorCount ? chalk.red('Validation failed!') : chalk.green('Validation succeeded!')} Files: ${fileCount}, Errors: ${errorCount}`);
}

function main(args) {
    try {
        let options = parseOptions(args);
        if (typeof options === 'string' || options.command === 'help') {
            return help(options);
        }
        return execute(options);
    } catch(e) {
        console.error('Unexpected error:', e);
        return 1;
    }
}

process.exitCode = main(process.argv.slice(2));
