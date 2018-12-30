let assert = require('assert');
let fs = require('fs');
let path = require('path');
let parser = require('../../lib/parser');
let {runRules} = require('../../lib/validator');
let strictLocationRule = require('../../lib/rules/rule-strict-location');

function testConfig(name, contents, expectedErrors) {
    return { name, contents, expectedErrors };
}

const TEST_CONFIGS = [
    testConfig('prefix location', `
location / {
    return 204;
}
    `, []),
    testConfig('prefix location with off', `
#nginxlinter off
location /books/([^/]+) {
    return 204;
}
    `, []),
    testConfig('prefix location with true', `
#nginxlinter strict-location:true
location / {
    return 204;
}
    `, []),
    testConfig('strict-location.conf', fs.readFileSync(path.resolve(__dirname, '..', 'examples', 'strict-location.conf'), 'utf8'), [
        {
            rule: 'strict-location',
            type: 'error',
            text: 'Expected string when using \'location\', got regular expression',
            pos: {
                start: { column: 44, line: 7, offset: 144 },
                end: { column: 45, line: 7, offset: 145 },
            },
        },
        {
            rule: 'strict-location',
            type: 'error',
            text: 'Expected string when using \'=\' modifier in \'location\', got regular expression',
            pos: {
                start: { column: 20, line: 11, offset: 249 },
                end: { column: 36, line: 11, offset: 265 },
            },
        },
    ]),
];

describe('rules/if-is-evil', () => {
    describe('#invoke()', () => {
        TEST_CONFIGS.forEach(({name, contents, expectedErrors}) => {
            it(`should have ${expectedErrors.length ? 'errors' : 'no errors'} with ${name}`, () => {
                let parseTree = parser.parse(contents);
                let actualErrors = runRules(parseTree, [strictLocationRule]);
                assert.deepStrictEqual(actualErrors, expectedErrors);
            });
        });
    });
});
