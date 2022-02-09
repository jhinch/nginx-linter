let assert = require('assert');
let path = require('path');
let {main} = require('../../bin/_cli/commands');

let stubConsole = new Proxy({}, {
    get: (target, prop) => {
        if (prop === 'invocations') {
            return target;
        } else if (Array.isArray(target[prop])) {
            // This cannot be an arrow function as
            // 'arguments' can not be referenced in them
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
        it('nested-includes.conf', () => {
            let exitCode = main(['--include', path.resolve(__dirname, '..', 'examples', 'nested-includes.conf')], stubConsole);
            assert.strictEqual(exitCode, 1);
            let message = stubConsole.invocations.log[stubConsole.invocations.log.length - 1];
            assert.ok(/Validation failed!.*Files: 1, Errors: 1$/.test(message), `Expected success summary, got '${message}'`);
        });
        it('nested-includes.conf with no follow', () => {
            let exitCode = main(['--include', path.resolve(__dirname, '..', 'examples', 'nested-includes.conf'), '--no-follow-includes'], stubConsole);
            assert.strictEqual(exitCode, 0);
            let message = stubConsole.invocations.log[stubConsole.invocations.log.length - 1];
            assert.ok(/Validation succeeded!.*Files: 1, Errors: 0$/.test(message), `Expected success summary, got '${message}'`);
        });
        it('nested-includes.conf with config override', () => {
            let exitCode = main([
                '--include',
                path.resolve(__dirname, '..', 'examples', 'nested-includes.conf'),
                '--config',
                path.resolve(__dirname, '..', 'examples', 'nginx-linter.config.json'),
            ], stubConsole);
            assert.strictEqual(exitCode, 0);
            let message = stubConsole.invocations.log[stubConsole.invocations.log.length - 1];
            assert.ok(/Validation succeeded!.*Files: 1, Errors: 0$/.test(message), `Expected success summary, got '${message}'`);
        });
        it('location-order-complicated.conf', () => {
            let exitCode = main(['--include', path.resolve(__dirname, '..', 'examples', 'location-order-complicated.conf')], stubConsole);
            assert.strictEqual(exitCode, 0);
            let message = stubConsole.invocations.log[stubConsole.invocations.log.length - 1];
            assert.ok(/Validation succeeded!.*Files: 1, Errors: 0$/.test(message), `Expected success summary, got '${message}'`);
        });
        it('location-order-with-includes.conf', () => {
            let exitCode = main(['--include', path.resolve(__dirname, '..', 'examples', 'location-order-with-includes.conf')], stubConsole);
            assert.strictEqual(exitCode, 0);
            let message = stubConsole.invocations.log[stubConsole.invocations.log.length - 1];
            assert.ok(/Validation succeeded!.*Files: 1, Errors: 0$/.test(message), `Expected success summary, got '${message}'`);
        });
    });
});
