let assert = require('assert');
let fs = require('fs');
let path = require('path');
let parser = require('../../lib/parser');
let {runRules} = require('../../lib/rules/runner');
let indentationRule = require('../../lib/rules/rule-indentation');

function testConfig(name, setting, contents, expectedErrors) {
    return { name, setting, contents, expectedErrors };
}

const TEST_CONFIGS = [
    testConfig('simple indentation', 4, `
location / {
    error_page 418 = @other;
    recursive_error_pages on;
    
    # if is normally evil, but I know what I'm doing
    if ($something) {
        return 418;
    }
}`, []),
    testConfig('2 spaces', 2, 'location / {\n  # OK\n  return 200;\n}', []),
    testConfig('4 spaces instead of 2', 2, 'location / {\n    return 200;\n}', [
        {
            rule: 'indentation',
            text: 'Expected 2 spaces, found 4 spaces',
            type: 'error',
            pos: {
                start: { column: 5, line: 2, offset: 17 },
                end: { column: 16, line: 2, offset: 28 },
            },
        },
    ]),
    testConfig('4 spaces instead of 2 but with override', 2, 'location / {#nginxlinter indentation:4\n    return 200;\n}', []),
    testConfig('4 spaces', 4, 'location / {\n    # OK\n    return 200;\n}', []),
    testConfig('2 spaces instead of 4', 4, 'location / {\n  return 200;\n}', [
        {
            rule: 'indentation',
            text: 'Expected 4 spaces, found 2 spaces',
            type: 'error',
            pos: {
                start: { column: 3, line: 2, offset: 15 },
                end: { column: 14, line: 2, offset: 26 },
            },
        },
    ]),
    testConfig('tabs', 'tab', 'location / {\n\t# OK\n\treturn 200;\n}', []),
    testConfig('2 spaces instead of tabs', 'tab', 'location / {\n  return 200;\n}', [
        {
            rule: 'indentation',
            text: 'Expected 1 tab, found 2 spaces',
            type: 'error',
            pos: {
                start: { column: 3, line: 2, offset: 15 },
                end: { column: 14, line: 2, offset: 26 },
            },
        },
    ]),
    testConfig('2 spaces instead of tabs', 'tab', 'location / {\n \treturn 200;\n}', [
        {
            rule: 'indentation',
            text: 'Expected 1 tab, found mixed',
            type: 'error',
            pos: {
                start: { column: 3, line: 2, offset: 15 },
                end: { column: 14, line: 2, offset: 26 },
            },
        },
    ]),
    testConfig('simple.conf', 4, fs.readFileSync(path.resolve(__dirname, '..', 'examples', 'simple.conf'), 'utf8'), []),
    testConfig('lua.conf', 4, fs.readFileSync(path.resolve(__dirname, '..', 'examples', 'lua.conf'), 'utf8'), []),
];

describe('rules/indentation', () => {
    describe('#invoke()', () => {
        TEST_CONFIGS.forEach(({name, setting, contents, expectedErrors}) => {
            it(`should have ${expectedErrors.length ? 'errors' : 'no errors'} with ${name}`, () => {
                let parseTree = parser.parse(contents);
                let actualErrors = runRules(parseTree, [indentationRule], {'indentation': setting});
                assert.deepStrictEqual(actualErrors, expectedErrors);
            });
        });
    });
});
