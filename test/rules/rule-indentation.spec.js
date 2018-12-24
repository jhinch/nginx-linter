let assert = require('assert');
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

    if ($something) {
        return 418;
    }
}

location @other {
    # some other configuration
}
    `, []),
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
