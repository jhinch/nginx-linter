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
    error_page 418 = @other;
    recursive_error_pages on;

    if ($something) {
        return 418;
    }

    # some configuration
}

location @other {
    # some other configuration
}
    `, []),
    testConfig('if-is-evil.conf file', 'mostly', fs.readFileSync(__dirname + '/../examples/if-is-evil.conf', 'utf8'), [
        {
            errors: ['if is evil and must only contain rewrite directives using last flag, found break'],
            pos: {
                start: { column: 39, line: 39, offset: 863 },
                end: { column: 44, line: 39, offset: 868 }
            }
        },
        {
            errors: ['if is evil and must only contain rewrite directives using last flag, found break'],
            pos: {
                start: { column: 39, line: 46, offset: 1033 },
                end: { column: 44, line: 46, offset: 1038 }
            }
        },
        {
            errors: ['if is evil and must only contain rewrite or return directive, found proxy_pass'],
            pos: {
                start: { column: 17, line: 56, offset: 1218 },
                end: { column: 51, line: 56, offset: 1252 }
            }
        }
    ])
];

describe('rules = if-is-evil', () => {
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
