let assert = require('assert');
let {main} = require('../../bin/_cli/commands');

describe('cli/commands', () => {
    describe('#main()', () => {
        it('--help', () => {
            let exitCode = main(['--help']);
            assert.strictEqual(exitCode, 0);
        });
        it('bad argument', () => {
            let exitCode = main(['--badarg']);
            assert.strictEqual(exitCode, 1);
        });
        it('simple.conf', () => {
            let exitCode = main(['--include', __dirname + '/../examples/simple.conf']);
            assert.strictEqual(exitCode, 0);
        });
        it('if-is-evil.conf', () => {
            let exitCode = main(['--include', __dirname + '/../examples/if-is-evil.conf']);
            assert.strictEqual(exitCode, 1);
        });
    });
});
