let assert = require('assert');
let parser = require('../../lib/parser');
let {runRules} = require('../../lib/validator');
let locationOrderRule = require('../../lib/rules/rule-location-order');

function testConfig(name, locations, expectedErrorMessages) {
    let locationPrefix = 'location ';
    let locationSuffix = ' {\n    return 200;\n}';
    let contents = locations.map(loc => locationPrefix + loc + locationSuffix).join('\n');
    let expectedErrors = expectedErrorMessages.map(errorMessage => {
        return {
            rule: 'location-order',
            text: errorMessage,
            type: 'error',
            pos: {
                start: {
                    column: locationPrefix.length + locations[locations.length - 1].length + 2,
                    line: locations.length * 3 - 2,
                    offset: contents.length - locationSuffix.length + 1,
                },
                end: {
                    column: locationPrefix.length + locations[locations.length - 1].length + 3,
                    line: locations.length * 3 - 2,
                    offset: contents.length - locationSuffix.length + 2,
                },
            },
        };
    });
    return { name, contents, expectedErrors };
}

const TEST_CONFIGS = [
    testConfig('= lexigraphical', ['= /a', '= /b'], []),
    testConfig('= lexigraphical out of order', ['= /b', '= /a'], ['Expected \'=\' location directives to be in lexicographical order with longest prefix']),
    testConfig('= lexigraphical with same prefix', ['= /a/b', '= /a'], []),
    testConfig('= lexigraphical with same prefix out of order', ['= /a', '= /a/b'], ['Expected \'=\' location directives to be in lexicographical order with longest prefix']),
    testConfig('= before ~^', ['= /a', '~^ /b'], []),
    testConfig('~^ before =', ['~^ /a', '= /b'], ['Expected \'=\' location directives to be ordered before \'~^\'']),
    testConfig('= before ~', ['= /a', '~ /b'], []),
    testConfig('~ before =', ['~ /a', '= /b'], ['Expected \'=\' location directives to be ordered before \'~\'']),
    testConfig('= before ~*', ['= /a', '~* /b'], []),
    testConfig('~* before =', ['~* /a', '= /b'], ['Expected \'=\' location directives to be ordered before \'~*\'']),
    testConfig('= before prefix', ['= /a', '/b'], []),
    testConfig('prefix before =', ['/a', '= /b'], ['Expected \'=\' location directives to be ordered before \'\'']),
    testConfig('~^ lexigraphical', ['~^ /a', '~^ /b'], []),
    testConfig('~^ lexigraphical out of order', ['~^ /b', '~^ /a'], ['Expected \'~^\' location directives to be in lexicographical order with longest prefix']),
    testConfig('~^ lexigraphical with same prefix', ['~^ /a/b', '~^ /a'], []),
    testConfig('~^ lexigraphical with same prefix out of order', ['~^ /a', '~^ /a/b'], ['Expected \'~^\' location directives to be in lexicographical order with longest prefix']),
    testConfig('~^ before ~', ['~^ /a', '~ /b'], []),
    testConfig('~ before ~^', ['~ /a', '~^ /b'], ['Expected \'~^\' location directives to be ordered before \'~\'']),
    testConfig('~^ before ~*', ['~^ /a', '~* /b'], []),
    testConfig('~* before ~^', ['~* /a', '~^ /b'], ['Expected \'~^\' location directives to be ordered before \'~*\'']),
    testConfig('~^ before prefix', ['~^ /a', '/b'], []),
    testConfig('prefix before ~^', ['/a', '~^ /b'], ['Expected \'~^\' location directives to be ordered before \'\'']),
    testConfig('~ lexigraphical', ['~ /a', '~ /b'], []),
    testConfig('~ lexigraphical out of order', ['~ /b', '~ /a'], []),
    testConfig('~ before ~*', ['~ /a', '~* /b'], []),
    testConfig('~* before ~', ['~* /a', '~ /b'], []),
    testConfig('~ before prefix', ['~ /a', '/b'], []),
    testConfig('prefix before ~', ['/a', '~ /b'], ['Expected \'~\' location directives to be ordered before \'\'']),
    testConfig('~* lexigraphical', ['~* /a', '~* /b'], []),
    testConfig('~* lexigraphical out of order', ['~* /b', '~* /a'], []),
    testConfig('~* before prefix', ['~* /a', '/b'], []),
    testConfig('prefix before ~*', ['/a', '~* /b'], ['Expected \'~*\' location directives to be ordered before \'\'']),
    testConfig('prefix lexigraphical', ['/a', '/b'], []),
    testConfig('prefix lexigraphical out of order', ['/b', '/a'], ['Expected prefix location directives to be in lexicographical order with longest prefix']),
    testConfig('prefix lexigraphical with same prefix', ['/a/b', '/a'], []),
    testConfig('prefix lexigraphical with same prefix out of order', ['/a', '/a/b'], ['Expected prefix location directives to be in lexicographical order with longest prefix']),
];

describe('rules/location-order', () => {
    describe('#invoke()', () => {
        TEST_CONFIGS.forEach(({name, contents, expectedErrors}) => {
            it(`should have ${expectedErrors.length ? 'errors' : 'no errors'} with ${name}`, () => {
                let parseTree = parser.parse(contents);
                let actualErrors = runRules(parseTree, [locationOrderRule], {});
                assert.deepStrictEqual(actualErrors, expectedErrors);
            });
        });
    });
});
