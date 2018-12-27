let assert = require('assert');
let fs = require('fs');
let parser = require('../../lib/parser');
let {runRules} = require('../../lib/rules/runner');
let trailingWhitespaceRule = require('../../lib/rules/rule-trailing-whitespace');

function testConfig(name, contents, expectedErrors) {
    return { name, contents, expectedErrors };
}

const TEST_CONFIGS = [
    testConfig('no trailing space', 'location / {\n  # OK\n  return 200;\n}', []),
    testConfig('trailing space', '  \nlocation / {\n  # OK  \n  return 200; \n}', [
        {
            rule: 'trailing-whitespace',
            text: 'Trailing whitespace found',
            type: 'error',
            pos: {
                start: { column: 3, line: 1, offset: 2 },
                end: { column: 1, line: 2, offset: 3 },
            },
        },
        {
            rule: 'trailing-whitespace',
            text: 'Trailing whitespace found',
            type: 'error',
            pos: {
                start: { column: 15, line: 4, offset: 39 },
                end: { column: 1, line: 5, offset: 40 },
            },
        },
    ]),
    testConfig('simple.conf', fs.readFileSync(__dirname + '/../examples/simple.conf', 'utf8'), []),
    testConfig('lua.conf', fs.readFileSync(__dirname + '/../examples/lua.conf', 'utf8'), []),
];

describe('rules/trailing-whitespace', () => {
    describe('#invoke()', () => {
        TEST_CONFIGS.forEach(({name, contents, expectedErrors}) => {
            it(`should have ${expectedErrors.length ? 'errors' : 'no errors'} with ${name}`, () => {
                let parseTree = parser.parse(contents);
                let actualErrors = runRules(parseTree, [trailingWhitespaceRule], {});
                assert.deepStrictEqual(actualErrors, expectedErrors);
            });
        });
    });
});
