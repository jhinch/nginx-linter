const defaults = {
    onNode: function(node, state) {
        return state;
    },
    onFileStart: function(node, state) {
        return state;
    },
    onFileEnd: function(node, state) {
        return state;
    },
};

function walk(node, callbacks, state) {
    if (typeof callbacks === 'function') {
        callbacks = {onNode: callbacks};
    }
    callbacks = Object.assign({}, defaults, callbacks);
    return walkNode(node, callbacks, state);
}

function walkNode(node, callbacks, state) {
    if (Array.isArray(node)) {
        state = node.reduce((state, node) => walkNode(node, callbacks, state), state);
    } else if (node.type === 'file') {
        state = node.onFileStart(node, state);
        state = walkNode(node.contents, callbacks, state);
        state = node.onFileEnd(node, state);
    } else {
        state = callbacks.onNode(node, state);
        if (node.type === 'directive') {
            state = walkNode(node.parameters, callbacks, state);
            state = walkNode(node.body, callbacks, state);
            if (node.includeFiles) {
                state = walkNode(node.includeFiles, callbacks, state);
            }
        } else if (node.type === 'lua:block') {
            state = walkNode(node.body, callbacks, state);
        }
    }
    return state;
}

module.exports = {
    walk,
};
