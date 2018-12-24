
function defaults(rules) {
    let result = {};
    rules.forEach(rule => {
        result[rule.name] = rule.default;
    });
    return result;
}

function parseOption(value) {
    if (value === 'off' || value === 'false') {
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
                        let [key, value] = part.split(':', 2);
                        options[key] = parseOption(value);
                    });
                }
                optionsStack[0] = options;
            }
        }

        if (options) {
            rules.forEach(rule => {
                if (options[rule.name]) {
                    let messages = [];
                    state[rule.name] = rule.invoke(
                        node,
                        messages,
                        options[rule.name],
                        state[rule.name]
                    );
                    if (messages.length) {
                        messages.map(message => {
                            return {
                                pos: node.pos,
                                rule: rule.name,
                                type: 'error',
                                text: message
                            };
                        }).forEach(result => results.push(result));
                    }
                }
            });
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
