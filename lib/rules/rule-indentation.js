
function configToDescription(indentation, level) {
    if (level === 0) {
        return { type: 'nothing', count: 0 };
    }
    if (indentation === 'tab') {
        return { type: 'tab', count: level };
    } else {
        return { type: 'space', count: level * indentation };
    }
}

function whitespaceToDescription(whitespace) {
    if (whitespace.length === 0) {
        return { type: 'nothing', count: 0 };
    } else {
        let hasSpace = whitespace.indexOf(' ') !== -1;
        let hasTab = whitespace.indexOf('\t') !== -1;
        let type = hasSpace ? (hasTab ? 'mixed' : 'space') : (hasTab ? 'tab' : 'unknown');
        let count = hasSpace !== hasTab ? whitespace.length : 0;
        return { type, count };
    }
}

function initialState() {
    return { whitespace: '', processed: false, level: 0 };
}

function increaseLevel(state) {
    state.level++;
}

function decreaseLevel(state) {
    state.level--;
}

function trackIndentation(state, whitespace) {
    if (!state.processed) {
        state.whitespace += whitespace;
    }
}

function validateIndentation(errors, indentation, state) {
    if (!state.processed) {
        let expected = configToDescription(indentation, state.level);
        let actual = whitespaceToDescription(state.whitespace);
        if (expected.type !== actual.type || expected.count !== actual.count) {
            let expectedDescription = `${expected.count} ${expected.type}${expected.count > 1 ? 's' : ''}`;
            let actualDescription = `${actual.count === 0 ? '' : actual.count + ' '}${actual.type}${actual.count > 1 ? 's' : ''}`;
            errors.push(`Expected ${expectedDescription}, found ${actualDescription}`);
        }
        state.processed = true;
    }
    state.processed = true;
}

function resetIndentation(state) {
    state.processed = false;
    state.whitespace = '';
}

function invoke(node, errors, indentation, stack) {
    stack = stack || [initialState()];
    let state = stack[0];
    switch (node.type) {
        case 'whitespace':
            trackIndentation(state, node.text);
            break;
        case 'newline':
            resetIndentation(state);
            break;
        case 'comment':
            // fall through
        case 'directive':
            validateIndentation(errors, indentation, state);
            break;
        case 'punctuation':
            switch (node.text) {
                case '{':
                    validateIndentation(errors, indentation, state);
                    increaseLevel(state);
                    break;
                case '}':
                    decreaseLevel(state);
                    validateIndentation(errors, indentation, state);
                    break;
            }
            break;
        case 'lua:code':
            switch (node.text) {
                case 'function':
                    // fall through
                case 'do':
                    // fall through
                case 'then':
                    // fall through
                case 'repeat':
                    validateIndentation(errors, indentation, state);
                    increaseLevel(state);
                    break;
                case 'else':
                    decreaseLevel(state);
                    validateIndentation(errors, indentation, state);
                    increaseLevel(state);
                    break;
                case 'until':
                    // fall through
                case 'end':
                    // fall through
                case 'elseif':
                    decreaseLevel(state);
                    validateIndentation(errors, indentation, state);
                    break;
                default:
                    validateIndentation(errors, indentation, state);
                    break;
            }
            break;
    }
    return stack;
}

function onFileStart(stack) {
    stack = stack || [];
    stack.unshift(initialState());
    return stack;
}

function onFileEnd(stack) {
    stack.shift();
    return stack;
}

module.exports = {
    name: 'indentation',
    default: 4,
    invoke,
    onFileStart,
    onFileEnd,
};
