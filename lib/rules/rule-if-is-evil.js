
function invoke(node, errors, mode, state) {
    switch (mode) {
        case 'always':
            return invokeWhenAlways(node, errors);
        case 'mostly':
            return invokeWhenMostly(node, errors, state);
        default:
            throw `Unknown if-is-evil mode ${mode}`;
    }
}

function invokeWhenAlways(node, errors) {
    if (node.type === 'directive' && node.name === 'if') {
        errors.push('if is evil and not allowed');
    }
}

function invokeWhenMostly(node, errors, stack) {
    stack = stack || [];
    switch (node.type) {
        case 'directive':
            if (stack.length) {
                stack[0] = checkDirective(node, errors, stack[0]);
            }
            if (node.name === 'if') {
                stack.unshift({ directiveCount: 0 });
            }
            break;
        case 'parameter':
            if (stack.length) {
                stack[0] = checkParameter(node, errors, stack[0]);
            }
            break;
        case 'punctuation':
            if (stack.length) {
                if (node.text === '}') {
                    stack.shift();
                } else if (node.text === ';') {
                    if (stack[0].inRewrite) {
                        stack[0].inRewrite = false;
                        stack[0].rewriteParameterCount = 0;
                    }
                }
            }
            break;
    }
    return stack;
}

function checkDirective(directiveNode, errors, state) {
    state.directiveCount++;
    if (state.directiveCount > 1) {
        errors.push('\'if\' must only contain a single directive');
    }
    if (directiveNode.name == 'rewrite') {
        state.inRewrite = true;
        state.rewriteParameterCount = 0;
    } else if (directiveNode.name !== 'return') {
        errors.push(`Only a 'rewrite' or 'return' is allowed within an 'if', found '${directiveNode.name}'`);
    }
    return state;
}

function checkParameter(parameterNode, errors, state) {
    if (state.inRewrite) {
        state.rewriteParameterCount++;
        if (state.rewriteParameterCount === 3) {
            if (parameterNode.text !== 'last') {
                errors.push(`A 'rewrite' within an 'if' must use the 'last' flag, found '${parameterNode.text}'`);
            }
        }
    }
    return state;
}

module.exports = {
    name: 'if-is-evil',
    default: 'mostly',
    invoke
};
