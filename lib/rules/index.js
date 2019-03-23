let builtins = [
    require('./rule-if-is-evil'),
    require('./rule-indentation'),
    require('./rule-line-ending'),
    require('./rule-location-order'),
    require('./rule-strict-location'),
    require('./rule-trailing-whitespace'),
];

module.exports = {
    builtins,
};
