let {runRules} = require('./runner');

let builtins = [
    require('./rule-if-is-evil'),
    require('./rule-indentation'),
    require('./rule-line-ending'),
    require('./rule-strict-location'),
    require('./rule-trailing-whitespace'),
];

function run(root, options) {
    return runRules(root, builtins, options);
}

module.exports = {
    builtins,
    run,
};
