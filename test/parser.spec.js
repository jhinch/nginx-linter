//let assert = require('assert');
let parser = require('../lib/parser');
let fs = require('fs');

describe('parser', () => {
    describe('#parse()', () => {
        it('should handle simple config file', () => {
            parser.parse(fs.readFileSync(__dirname + '/examples/simple-config.conf', 'utf8'));
        });
    });
});

