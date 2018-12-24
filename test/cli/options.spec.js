let assert = require('assert');
let options = require('../../bin/_cli/options');

function optionsWithFields(overrides) {
    return Object.assign({}, options.defaults, overrides);
}

describe('cli/options', () => {
    describe('#parse()', () => {
        it('no arguments', () => {
            assert.deepStrictEqual(options.parse([]), options.defaults);
        });
        it('bad argument', () => {
            assert.deepStrictEqual(options.parse(['--badarg']), 'Unknown option: --badarg');
        });
        it('--config without argument', () => {
            assert.deepStrictEqual(options.parse(['--config']), 'Expected argument after --config');
        });
        it('--config with argument', () => {
            let defaultConfig = options.defaults.config;
            assert.deepStrictEqual(options.parse(['--config', 'custom-config.json']), optionsWithFields({ config: 'custom-config.json' }));
            assert.deepStrictEqual(options.defaults.config, defaultConfig);
        });
        it('--config with multiple arguments', () => {
            let defaultConfig = options.defaults.config;
            assert.deepStrictEqual(options.parse(['--config', 'custom-config.json', '--config', 'custom-2.json']), optionsWithFields({ config: 'custom-2.json' }));
            assert.deepStrictEqual(options.defaults.config, defaultConfig);
        });
        it('--include without argument', () => {
            assert.deepStrictEqual(options.parse(['--include']), 'Expected argument after --include');
        });
        it('--include with argument', () => {
            let defaultIncludes = options.defaults.includes.slice(0);
            assert.deepStrictEqual(options.parse(['--include', 'nginx.conf']), optionsWithFields({ includes: ['nginx.conf'] }));
            assert.deepStrictEqual(options.defaults.includes, defaultIncludes);
        });
        it('--include with multiple arguments', () => {
            let defaultIncludes = options.defaults.includes.slice(0);
            assert.deepStrictEqual(options.parse(['--include', 'nginx.conf', '--include', 'other.conf']), optionsWithFields({ includes: ['nginx.conf', 'other.conf'] }));
            assert.deepStrictEqual(options.defaults.includes, defaultIncludes);
        });
        it('--exclude without argument', () => {
            assert.deepStrictEqual(options.parse(['--exclude']), 'Expected argument after --exclude');
        });
        it('--exclude with argument', () => {
            let defaultExcludes = options.defaults.excludes.slice(0);
            assert.deepStrictEqual(options.parse(['--exclude', 'nginx.conf']), optionsWithFields({ excludes: ['nginx.conf'] }));
            assert.deepStrictEqual(options.defaults.excludes, defaultExcludes);
        });
        it('--exclude with multiple arguments', () => {
            let defaultExcludes = options.defaults.excludes.slice(0);
            assert.deepStrictEqual(options.parse(['--exclude', 'nginx.conf', '--exclude', 'other.conf']), optionsWithFields({ excludes: ['nginx.conf', 'other.conf'] }));
            assert.deepStrictEqual(options.defaults.excludes, defaultExcludes);
        });
    });
});
