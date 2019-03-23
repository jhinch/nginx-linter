
let {walk} = require('./walker');

function defaults(rules) {
    let result = {severity:{}};
    rules.forEach(rule => {
        result[rule.name] = rule.default;
        result.severity[rule.name] = rule.severity;
    });
    return result;
}

function parseOption(value) {
    if (value === 'off' || value === 'false') {
        return false;
    } else if (value === 'on' || value === 'true') {
        return true;
    } else if (value.match(/^[a-zA-Z]+$/)) {
        return value;
    } else {
        return JSON.parse(value);
    }
}

function runRules(root, rules, options) {
    let defaultOptions = Object.assign({}, defaults(rules), options || {});
    options = Object.assign({}, defaultOptions);
    let {resultsStack} = walk(root, {
        onFileStart: runRulesOnFileStart,
        onNode: runRulesOnNode,
        onFileEnd: runRulesOnFileEnd,
    }, {
        rules,
        resultsStack: [[]],
        defaultOptions: defaultOptions,
        optionsStack: [options],
        state: {},
    });
    let results = resultsStack[0];
    if (root.type === 'file' && results.length === 1) {
        results = results[0].nested.results;
    }
    return results;
}

function runRulesOnFileStart(node, {rules, resultsStack, defaultOptions, optionsStack, state}) {
    resultsStack.unshift([]);
    optionsStack.unshift(Object.assign({}, defaultOptions));
    rules.forEach(rule => {
        if (rule.onFileStart) {
            state[rule.name] = rule.onFileStart(state[rule.name]);
        }
    });
    return {rules, resultsStack, defaultOptions, optionsStack, state};
}

function runRulesOnFileEnd(node, {rules, resultsStack, defaultOptions, optionsStack, state}) {
    rules.forEach(rule => {
        if (rule.onFileStart) {
            state[rule.name] = rule.onFileEnd(state[rule.name]);
        }
    });
    optionsStack.shift();
    let results = resultsStack.shift();
    if (results.length) {
        resultsStack[0].push({
            nested: {
                fileName: node.name,
                results,
            },
        });
    }
    return {rules, resultsStack, defaultOptions, optionsStack, state};
}

function runRulesOnNode(node, {rules, resultsStack, defaultOptions, optionsStack, state}) {
    let results = resultsStack[0];
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
                let severity = options.severity[rule.name] || 'error';
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
                            type: severity,
                            text: message,
                        };
                    }).forEach(result => results.push(result));
                }
            }
        });
    }

    return {rules, resultsStack, defaultOptions, optionsStack, state};
}

module.exports = {
    defaults,
    runRules,
};
