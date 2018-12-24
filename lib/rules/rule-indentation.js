
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

module.exports = {
    name: 'indentation',
    default: 4,
    invoke: function(node, errors, indentation, state) {
        state = state || { whitespace: '', processed: false, level: 0 };
        switch(node.type) {
            case 'whitespace':
                state.whitespace += node.text;
                break;
            case 'newline':
                state.processed = false;
                state.whitespace = '';
                break;
            case 'directive':
                // fall through
            case 'comment':
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
                break;
            case 'punctuation':
                switch(node.text) {
                    case '{':
                        state.level++;
                        break;
                    case '}':
                        state.level--;
                        break;
                }
                break;
        }
        return state;
    },
};
