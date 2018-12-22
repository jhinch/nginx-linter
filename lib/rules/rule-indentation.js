
function expectedWhitespace(indentation, level) {
    let whitespace = indentation === 'tab' ? '\t' : ' '.repeat(indentation);
    return whitespace.repeat(level);
}

module.exports = {
    name: 'indentation',
    default: 4,
    invoke: function(node, errors, indentation, state) {
        state = state || { whitespace: '', level: 0 };
        switch(node.type) {
            case 'whitespace':
                state.whitespace += node.text;
                break;
            case 'newline':
                state.whitespace = '';
                break;
            case 'directive':
                if (state.whitespace !== expectedWhitespace(indentation, state.level)) {
                    errors.push('unexpected whitespace');
                }
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
    }
};
