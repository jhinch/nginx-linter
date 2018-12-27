module.exports = {
    name: 'trailing-whitespace',
    default: true,
    invoke: function(node, errors, ignored, state) {
        state = state || { whitespace: '' };
        switch (node.type) {
            case 'newline':
                if (state.whitespace) {
                    errors.push('Trailing whitespace found');
                }
                break;
            case 'whitespace':
                state.whitespace = node.text;
                break;
            default:
                state.whitespace = '';
                break;
        }
        return state;
    },
};
