let assert = require('assert');
let parser = require('../../lib/parser');
let {runRules} = require('../../lib/rules/runner');
let ifIsEvilRule = require('../../lib/rules/rule-if-is-evil');
let fs = require('fs');

function testConfig(name, mode, contents, expectedErrors) {
    return { name, mode, contents, expectedErrors };
}

const TEST_CONFIGS = [
    testConfig('simple if with return', 'mostly', `
location / {
    if ($something) {
        return 418;
    }
    return 200;
}`, []),
    testConfig('simple if with return but with always', 'always', `
location / {
    if ($something) {
        return 418;
    }
    return 200;
}`, [
        {
            rule: 'if-is-evil',
            text: 'if is evil and not allowed',
            type: 'error',
            pos: {
                start: { column: 5, line: 3, offset: 18 },
                end: { column: 6, line: 5, offset: 61 }
            },
        }
    ]),
    testConfig('simple if with return with always with comment', 'always', `
location / {
    #nginxlinter if-is-evil:mostly
    if ($something) {
        return 418;
    }
    return 200;
}`, []),
    testConfig('if-is-evil.conf file', 'mostly', fs.readFileSync(__dirname + '/../examples/if-is-evil.conf', 'utf8'), [
        {
            rule: 'if-is-evil',
            type: 'error',
            text: 'if is evil and not allowed',
            pos: {
                start: { column: 13, line: 19, offset: 353 },
                end: { column: 14, line: 21, offset: 424 }
            }
        },
        {
            rule: 'if-is-evil',
            type: 'error',
            text: 'A \'rewrite\' within an \'if\' must use the \'last\' flag, found \'break\'',
            pos: {
                start: { column: 39, line: 46, offset: 1033 },
                end: { column: 44, line: 46, offset: 1038 }
            }
        },
        {
            rule: 'if-is-evil',
            type: 'error',
            text: 'Only a \'rewrite\' or \'return\' is allowed within an \'if\', found \'proxy_pass\'',
            pos: {
                start: { column: 17, line: 56, offset: 1218 },
                end: { column: 51, line: 56, offset: 1252 }
            }
        }
    ])
];

describe('rules/if-is-evil', () => {
    describe('#invoke()', () => {
        TEST_CONFIGS.forEach(({name, mode, contents, expectedErrors}) => {
            it(`should have ${expectedErrors.length ? 'errors' : 'no errors'} with ${name}`, () => {
                let parseTree = parser.parse(contents);
                let actualErrors = runRules(parseTree, [ifIsEvilRule], {'if-is-evil': mode});
                assert.deepStrictEqual(actualErrors, expectedErrors);
            });
        });
    });
});
