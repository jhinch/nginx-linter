let assert = require('assert');
let parser = require('../lib/parser');
let fs = require('fs');

function punctuation(value) {
    return { type: 'punctuation', text: value };
}

function parameter(value) {
    return { type: 'parameter', text: value };
}

function directive(name, parameters, body) {
    if (body == null) {
        body = [punctuation(';')];
    } else {
        body.unshift(punctuation('{'));
        body.push(punctuation('}'));
    }
    parameters = parameters || [];
    parameters = parameters.map(parameter);
    return {
        type: 'directive',
        name: name,
        parameters: parameters,
        body: body
    };
}

function sanitizeParseTree(node) {
    if (Array.isArray(node)) {
        return node.filter(subNode => ['whitespace', 'newline', 'comment'].indexOf(subNode.type) === -1).map(sanitizeParseTree);
    } else {
        let sanitizeNode = Object.assign({}, node);
        delete sanitizeNode['pos'];
        if (sanitizeNode.type === 'directive') {
            sanitizeNode.parameters = sanitizeParseTree(sanitizeNode.parameters);
            sanitizeNode.body = sanitizeParseTree(sanitizeNode.body);
        }
        return sanitizeNode;
    }
}

const TEST_CONFIGS = {
    'simple.conf' : [
        directive('events', null, []),
        directive('http', null, [
            directive('server', null, [
                directive('listen', ['80']),
                directive('location', ['=', '/ok'], [
                    directive('return', ['200'])
                ])
            ])
        ])
    ],
    'single-quotes.conf' : [
        directive('events', null, []),
        directive('http', null, [
            directive('server', null, [
                directive('listen', ['80']),
                directive('location', ['=', '\'/o\\\'k\''], [
                    directive('return', ['200'])
                ])
            ])
        ])
    ]
};

describe('parser', () => {
    describe('#parse()', () => {
        for (let configFileName in TEST_CONFIGS) {
            let expectedParseTree = TEST_CONFIGS[configFileName];
            it(`should handle ${configFileName} file`, () => {
                let actualParseTree = parser.parse(fs.readFileSync(__dirname + '/examples/' + configFileName, 'utf8'));
                assert.deepStrictEqual(sanitizeParseTree(actualParseTree), expectedParseTree);
            });
        }
    });
});

