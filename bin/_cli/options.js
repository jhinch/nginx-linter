const defaults = {
    command: 'validate',
    config: '~/.nginx-linter.json',
    includes: ['/etc/nginx/*.conf', '/etc/nginx/**/*.conf'],
    followIncludes: true,
    maxIncludeDepth: 5,
    excludes: [],
};

function parse(args) {
    let options = JSON.parse(JSON.stringify(defaults));
    let argsRemaining = args.slice(0);
    let customizedIncludes = false;
    let customizedExcludes = false;
    while (argsRemaining.length) {
        let headArg = argsRemaining.shift();
        switch (headArg) {
            case '--config':
                if (!argsRemaining.length) {
                    return 'Expected argument after --config';
                }
                options.config = argsRemaining.shift();
                break;
            case '--include':
                if (!argsRemaining.length) {
                    return 'Expected argument after --include';
                }
                if (customizedIncludes) {
                    options.includes.push(argsRemaining.shift());
                } else {
                    options.includes = [argsRemaining.shift()];
                    customizedIncludes = true;
                }
                break;
            case '--exclude':
                if (!argsRemaining.length) {
                    return 'Expected argument after --exclude';
                }
                if (customizedExcludes) {
                    options.excludes.push(argsRemaining.shift());
                } else {
                    options.excludes = [argsRemaining.shift()];
                    customizedExcludes = true;
                }
                break;
            case '--no-follow-includes':
                options.followIncludes = false;
                break;
            case '--help':
                options.command = 'help';
                break;
            default:
                return `Unknown option: ${headArg}`;
        }
    }
    return options;
}

module.exports = {
    defaults,
    parse,
};
