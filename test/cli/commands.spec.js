let assert = require('assert');
let path = require('path');
let {main} = require('../../bin/_cli/commands');

let stubConsole = new Proxy({}, {
    get: (target, prop) => {
        if (prop === 'invocations') {
            return target;
        } else if (Array.isArray(target[prop])) {
            // This cannot be an arrow function as
            // 'arguments' is not a reference in them
            return function() {
                target[prop].push(Array.from(arguments));
            };
        } else {
            return undefined;
        }
    },
});

describe('cli/commands', () => {
    beforeEach(() => {
        stubConsole.invocations.log = [];
    });
    describe('#main()', () => {
        it('--help', () => {
            let exitCode = main(['--help'], stubConsole);
            assert.strictEqual(exitCode, 0);
        });
        it('bad argument', () => {
            let exitCode = main(['--badarg'], stubConsole);
            assert.strictEqual(exitCode, 1);
        });
        it('simple.conf', () => {
            let exitCode = main(['--include', path.resolve(__dirname, '..', 'examples', 'simple.conf')], stubConsole);
            assert.strictEqual(exitCode, 0);
            let message = stubConsole.invocations.log[stubConsole.invocations.log.length - 1];
            assert.ok(/Validation succeeded!.*Files: 1, Errors: 0$/.test(message), `Expected success summary, got '${message}'`);
        });
        it('if-is-evil.conf', () => {
            let exitCode = main(['--include', path.resolve(__dirname, '..', 'examples', 'if-is-evil.conf')], stubConsole);
            assert.strictEqual(exitCode, 1);
            let message = stubConsole.invocations.log[stubConsole.invocations.log.length - 1];
            assert.ok(/Validation failed!.*Files: 1, Errors: 3$/.test(message), `Expected success summary, got '${message}'`);
        });
    });
});
