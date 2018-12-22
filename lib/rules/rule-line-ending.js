function lineEnding(text) {
    switch (text) {
        case '\n':
            return 'lf';
        case '\r\n':
            return 'crlf';
    }
}

module.exports = {
    name: 'line-ending',
    default: 'lf',
    invoke: function(node, errors, expectedType) {
        if (node.type === 'newline') {
            let actualType = lineEnding(node.text);
            if (expectedType !== actualType) {
                errors.push(`Expected ${expectedType}, found ${actualType}`);
            }
        }
    }
};
