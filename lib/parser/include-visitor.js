let {walk} = require('../walker');

function visitIncludes(node, callback) {
    walk(node, (node, state) => {
        if (node.type === 'directive' && node.name === 'include') {
            state = {node: node, includeGlob: null};
        } else if (node.type === 'parameter' && state && state.includeGlob == null) {
            state.includeGlob = node.text;
        } else if (node.type !== 'whitespace' && node.type !== 'comment') {
            if (node.type === 'punctuation' && node.text === ';' && state && state.includeGlob != null) {
                callback(state.node, state.includeGlob);
            }
            state = null;
        }
        return state;
    }, null);
}

module.exports = {
    visitIncludes,
};
