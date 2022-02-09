
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

function invoke(node, errors, ignored, state) {
    state = state || {container: {}};
    switch (node.type) {
        case 'directive':
            // clear previous locations in new server
            if (node.name === 'server') {
                state = {container: {}};
            }
            if (node.name === 'location') {
                state.container.previous = state.container.current;
                state.container.current = {};
                state = {
                    location: true,
                    state: state,
                };
            }
            break;
        case 'parameter':
            if (state.location) {
                if (state.state.container.current.mode) {
                    state.state.container.current.uri = node.text;
                } else {
                    state.state.container.current.mode = node.text;
                }
            }
            break;
        case 'punctuation':
            if (node.text === '{') {
                if (state.location) {
                    if (state.state.container.current.uri == null) {
                        state.state.container.current.uri = state.state.container.current.mode;
                        state.state.container.current.mode = '';
                    }
                    state = state.state;
                    checkLocation(state.container.current, state.container.previous, errors);
                }
                state = {
                    container: state,
                };
            } else if (node.text === '}') {
                state = state.container;
            }
            break;
    }
    return state;
}

module.exports = {
    name: 'location-order',
    default: true,
    invoke,
};
