
function defaults(rules) {
    let result = {};
    rules.forEach(rule => {
        result[rule.name] = rule.default;
    });
    return result;
}

function parseOption(value) {
    if (value === 'off') {
        return false;
    } else if (value.match(/^[a-zA-Z]+$/)) {
        return value;
    } else {
        return JSON.parse(value);
    }
}

function runRules(root, rules, options) {
    let errors = [];
    options = Object.assign({}, defaults(rules), options || {});
    runRulesForNode(root, rules, errors, [options], {});
    return errors;
}

function runRulesForNode(node, rules, results, optionsStack, state) {
    if (Array.isArray(node)) {
        node.forEach(_ => runRulesForNode(_, rules, results, optionsStack, state));
    } else {
        if (node.type === 'punctuation') {
            if (node.text === '{') {
                optionsStack.unshift(Object.assign({}, optionsStack[0]));
            } else if (node.text === '}') {
                optionsStack.shift();
            }
        }
        let options = optionsStack[0];
        if (node.type === 'comment') {
            if (node.text.startsWith('#nginxlinter ')) {
                if (node.text === '#nginxlinter off') {
                    options = null;
                } else {
                    node.text.split(' ').slice(1).forEach(part => {
                        part.split(':', 2).forEach(([key, value]) => {
                            options[key] = parseOption(value);
                        });
                    });
                }
                optionsStack[0] = options;
            }
        }

        if (options) {
            let nodeResults = {pos: node.pos, errors:[], warnings: [], info: []};
            rules.forEach(rule => {
                if (options[rule.name]) {
                    let errors = [];
                    state[rule.name] = rule.invoke(
                        node,
                        errors,
                        options[rule.name],
                        state[rule.name]
                    );
                    if (errors.length) {
                        errors.map(error => {
                            return { rule: rule.name, text: error };
                        }).forEach(error => nodeResults.errors.push(error));
                    }
                }
            });
            if (nodeResults.errors.length || nodeResults.warnings.length || nodeResults.info.length) {
                results.push(nodeResults);
            }
        }

        if (node.type === 'directive') {
            runRulesForNode(node.parameters, rules, results, optionsStack, state);
            runRulesForNode(node.body, rules, results, optionsStack, state);
        }
    }
}

module.exports = {
    defaults,
    runRules
};
