let assert = require('assert');
let fs = require('fs');
let path = require('path');
let parser = require('../../lib/parser');
let {runRules} = require('../../lib/validator');
let lineEndingRule = require('../../lib/rules/rule-line-ending');

function testConfig(name, lineEnding, contents, expectedErrors) {
    return { name, lineEnding, contents, expectedErrors };
}

const TEST_CONFIGS = [
    testConfig('simple lf', 'lf', 'location /no-content {\n    return 204;\n}\n', []),
    testConfig('simple lf with error', 'lf', 'location /no-content {\r\n    return 204;\n}\r\n', [
        {
            rule: 'line-ending',
            text: 'Expected lf, found crlf',
            type: 'error',
            pos: {
                start: { column: 23, line: 1, offset: 22 },
                end: { column: 1, line: 2, offset: 24 },
            },
        },
        {
            rule: 'line-ending',
            text: 'Expected lf, found crlf',
            type: 'error',
            pos: {
                start: { column: 2, line: 3, offset: 41 },
                end: { column: 1, line: 4, offset: 43 },
            },
        },
    ]),
    testConfig('simple crlf', 'crlf', 'location /no-content {\r\n    return 204;\r\n}\r\n', []),
    testConfig('simple crlf with error', 'crlf', 'location /no-content {\r\n    return 204;\n}\r\n', [
        {
            rule: 'line-ending',
            text: 'Expected crlf, found lf',
            type: 'error',
            pos: {
                start: { column: 16, line: 2, offset: 39 },
                end: { column: 1, line: 3, offset: 40 },
            },
        },
    ]),
    testConfig('newlines.conf', 'lf', fs.readFileSync(path.resolve(__dirname, '..', 'examples', 'newlines.conf'), 'utf8'), [
        {
            rule: 'line-ending',
            text: 'Expected lf, found crlf',
            type: 'error',
            pos: {
                start: { column: 2, line: 2, offset: 10 },
                end: { column: 1, line: 3, offset: 12 },
            },
        },
        {
            rule: 'line-ending',
            text: 'Expected lf, found crlf',
            type: 'error',
            pos: {
                start: { column: 13, line: 4, offset: 31 },
                end: { column: 1, line: 5, offset: 33 },
            },
        },
        {
            rule: 'line-ending',
            text: 'Expected lf, found crlf',
            type: 'error',
            pos: {
                start: { column: 24, line: 7, offset: 100 },
                end: { column: 1, line: 8, offset: 102 },
            },
        },
    ]),
];

describe('rules/line-ending', () => {
    describe('#invoke()', () => {
        TEST_CONFIGS.forEach(({name, lineEnding, contents, expectedErrors}) => {
            it(`should have ${expectedErrors.length ? 'errors' : 'no errors'} with ${name}`, () => {
                let parseTree = parser.parse(contents);
                let actualErrors = runRules(parseTree, [lineEndingRule], {'line-ending': lineEnding});
                assert.deepStrictEqual(actualErrors, expectedErrors);
            });
        });
    });
});
