let parser = require('./parser');
let {visitIncludes} = require('./include-visitor');
let fs = require('fs');
let glob = require('glob');
let path = require('path');

function parse(contents) {
    return parser.parse(contents);
}

function parseFile(name) {
    let contents = fs.readFileSync(name, 'utf8');
    try {
        let root = parse(contents);
        let node = {
            type: 'file',
            name,
            root,
        };
        return node;
    } catch (e) {
        throw new Error(`Failed to parse: ${name}\nCaused by:\n${e}`);
    }
}

function parseFiles({includes, excludes, maxDepth}) {
    includes = includes || [];
    excludes = excludes || [];
    maxDepth = maxDepth || 0;
    let files = findFiles(includes, excludes);
    let nodes = files.map(parseFile);
    if (maxDepth > 0) {
        nodes.forEach(node => {
            let file = node.name;
            let effects = [];
            visitIncludes(node, (node, includeGlob) => {
                includeGlob = path.resolve(path.dirname(file), includeGlob);
                effects.push(() => {
                    node.includedFiles = parseFiles({
                        includes: [includeGlob],
                        excludes: excludes,
                        maxDepth: maxDepth - 1,
                    });
                });
            });
            effects.forEach(effect => effect());
        });
    }
    return nodes;
}

function findFiles(includes, excludes) {
    let includedFiles = findMatchingFiles(includes);
    let excludedFiles = findMatchingFiles(excludes);
    return includedFiles.filter(f => excludedFiles.indexOf(f) === -1);
}

function findMatchingFiles(globs) {
    let files = [];
    globs.forEach(globString => glob.sync(globString).forEach(file => files.push(file)));
    return files;
}

module.exports = {
    parse,
    parseFile,
    parseFiles,
};
