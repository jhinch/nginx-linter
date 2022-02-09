
function checkLocation(currentLocation, previousLocation, errors) {
    if (previousLocation) {
        switch (currentLocation.mode) {
            case '=':
                if (previousLocation.mode === '=') {
                    if (!isLexographicalWithLongestPrefix(previousLocation.uri, currentLocation.uri)) {
                        errors.push('Expected \'=\' location directives to be in lexicographical order with longest prefix');
                    }
                } else {
                    errors.push(`Expected '=' location directives to be ordered before '${previousLocation.mode}'`);
                }
                break;
            case '^~':
                if (previousLocation.mode !== '=') {
                    if (previousLocation.mode === '^~') {
                        if (!isLexographicalWithLongestPrefix(previousLocation.uri, currentLocation.uri)) {
                            errors.push('Expected \'^~\' location directives to be in lexicographical order with longest prefix');
                        }
                    } else {
                        errors.push(`Expected '^~' location directives to be ordered before '${previousLocation.mode}'`);
                    }
                }
                break;
            case '~':
                // fall through
            case '~*':
                if (previousLocation.mode !== '=' && previousLocation.mode !== '^~') {
                    if (previousLocation.mode !== '~' && previousLocation.mode !== '~*') {
                        errors.push(`Expected '${currentLocation.mode}' location directives to be ordered before '${previousLocation.mode}'`);
                    }
                }
                break;
            case '':
                if (previousLocation.mode === '') {
                    if (!isLexographicalWithLongestPrefix(previousLocation.uri, currentLocation.uri)) {
                        errors.push('Expected prefix location directives to be in lexicographical order with longest prefix');
                    }
                }
        }
    }
}

function isLexographicalWithLongestPrefix(a, b) {
    if (a.startsWith(b)) {
        return true;
    } else if (b.startsWith(a)) {
        return false;
    } else {
        return a < b;
    }
}

function invoke(node, errors, ignored, stack) {
    stack = stack || [{}];
    let state = stack[0];
    switch (node.type) {
        case 'directive':
            if (node.name === 'location') {
                state.previous = state.current;
                state.current = {};
                state.location = true;
            }
            break;
        case 'parameter':
            if (state.location) {
                if (state.current.mode) {
                    state.current.uri = node.text;
                } else {
                    state.current.mode = node.text;
                }
            }
            break;
        case 'punctuation':
            if (node.text === '{') {
                if (state.location) {
                    if (state.current.uri == null) {
                        state.current.uri = state.current.mode;
                        state.current.mode = '';
                    }
                    state.location = false;
                    checkLocation(state.current, state.previous, errors);
                }
                stack.unshift({});
            } else if (node.text === '}') {
                stack.shift();
            }
            break;
    }
    return stack;
}

module.exports = {
    name: 'location-order',
    default: true,
    invoke,
};
