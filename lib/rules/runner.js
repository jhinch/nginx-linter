
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

function runRulesForNode(node, rules, errors, optionsStack, state) {
    if (Array.isArray(node)) {
        node.forEach(_ => runRulesForNode(_, rules, errors, optionsStack, state));
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
            let nodeErrors = [];
            rules.forEach(rule => {
                if (options[rule.name]) {
                    state[rule.name] = rule.invoke(
                        node,
                        nodeErrors,
                        options[rule.name],
                        state[rule.name]
                    );
                }
            });
            if (nodeErrors.length) {
                errors.push({ pos: node.pos, errors: nodeErrors });
            }
        }

        if (node.type === 'directive') {
            runRulesForNode(node.parameters, rules, errors, optionsStack, state);
            runRulesForNode(node.body, rules, errors, optionsStack, state);
        }
    }
}

module.exports = {
    defaults,
    runRules
};
