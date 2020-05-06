let parser = require('../../lib/parser');
let {runRules} = require('../../lib/validator');
let builtinRules = require('../../lib/rules').builtins;
let optionsParser = require('./options');
let {table, getBorderCharacters} = require('table');
let chalk = require('chalk');
let path = require('path');
let fs = require('fs');
let os = require('os');

const TABLE_CONFIG = {
    border: getBorderCharacters('void'),
    drawHorizontalLine: () => false,
    columns: {
        0: { // Line number
            alignment: 'right',
            paddingLeft: 2,
            paddingRight: 0,
        },
        1: { // :
            alignment: 'center',
            paddingLeft: 0,
            paddingRight: 0,
        },
        2: { // Column number
            alignment: 'left',
            paddingLeft: 0,
            paddingRight: 1,
        },
        3: { // messageType
            alignment: 'left',
            paddingLeft: 0,
            paddingRight: 1,
        },
        4: { // message
            alignment: 'left',
            paddingLeft: 0,
            paddingRight: 1,
        },
        5: { // rule
            alignment: 'left',
            paddingLeft: 0,
            paddingRight: 0,
        },
    },
};

function execute(options, output) {
    switch (options.command) {
        case 'validate':
            return validate(options, output);
        default:
            throw `Unknown command: ${options.command}`;
    }
}

function help(options, output) {
    let error = typeof options === 'string' ? options : null;
    if (error) {
        output.log(error);
    }
    output.log('Usage: nginx-linter [arguments]');
    output.log('');
    output.log('Arguments:');
    output.log('--help                 Print this help message and exit');
    output.log(`--config <file>        Specify the configuration file to use. Default (${optionsParser.defaults.config})`);
    output.log(`--include <file|glob>  Include the file or glob in nginx files to validate. Can be specified multiple times. Default (${optionsParser.defaults.includes.join(', ')})`);
    output.log('--exclude <file|glob>  Exclude a file or glob in the nginx files to validate. Can be specieid multiple times. Excludes take precedence over includes');
    output.log('--no-follow-includes   Disable the default behaviour of following include directives found in the nginx configuration');
    return error ? 1 : 0;
}

function validate(options, output) {
    let config = loadConfig(options.config);
    let fileNodes = parser.parseFiles({
        includes: options.includes,
        excludes: options.excludes,
        maxDepth: options.followIncludes ? options.maxIncludeDepth : 0,
    });
    let errorCount = fileNodes.map(fileNode => {
        let results = runValidationWithBuiltins(fileNode, config);
        if (results.length) {
            outputResults(fileNode.name, results, output);
        }
        return countErrors(results);
    }).reduce((a, b) => a + b, 0);
    outputSummary({ fileCount: fileNodes.length, errorCount }, output);
    return errorCount ? 1 : 0;
}

function countErrors(results) {
    return results.reduce((total, result) => {
        if (result.type === 'error') {
            return total + 1;
        } else if (result.nested) {
            return total + countErrors(result.nested.results);
        } else {
            return total;
        }
    }, 0);
}

function runValidationWithBuiltins(parseTree, config) {
    return runRules(parseTree, builtinRules, config);
}

function loadConfig(configFile) {
    let fileName = configFile;
    if (fileName[0] === '~') {
        fileName = path.join(os.homedir(), fileName.slice(1));
    }
    let contents = null;
    try {
        contents = fs.readFileSync(fileName, 'utf8');
    } catch (e) {
        if (configFile === optionsParser.defaults.config) {
            return {};
        }
        throw e;
    }
    return JSON.parse(contents);
}

function outputResults(fileName, results, output) {
    output.log('');
    output.log(chalk.underline(fileName));
    outputInnerResults(' ', fileName, results, output);
}

function outputInnerResults(indent, fileName, results, output) {
    let tableData = [];
    let nestedResults = [];
    results.forEach(({pos, type, text, nested, rule}) => {
        if (nested) {
            nestedResults.push(nested);
        } else {
            tableData.push([
                chalk.dim(pos.start.line),
                chalk.dim(':'),
                chalk.dim(pos.start.column),
                type === 'error' ? chalk.red(type) : chalk.yellow(type),
                text,
                chalk.dim(rule),
            ]);
        }
    });
    if (tableData.length) {
        output.log(table(tableData, TABLE_CONFIG));
    }
    nestedResults.forEach(nested => {
        let includeFileName = path.relative(path.dirname(path.resolve(fileName)), nested.fileName);
        output.log(chalk.bold(indent + 'within'), chalk.underline(includeFileName));
        outputInnerResults(indent + ' ', nested.fileName, nested.results, output);
    });
}

function outputSummary({fileCount, errorCount}, output) {
    output.log('');
    output.log(`${errorCount ? chalk.red('Validation failed!') : chalk.green('Validation succeeded!')} Files: ${fileCount}, Errors: ${errorCount}`);
}

function main(args, output) {
    try {
        let options = optionsParser.parse(args);
        if (typeof options === 'string' || options.command === 'help') {
            return help(options, output);
        }
        return execute(options, output);
    } catch (e) {
        output.error('Unexpected error:', e);
        return 1;
    }
}

module.exports = {
    main,
};
