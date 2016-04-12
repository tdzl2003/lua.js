var luajs = require('../lib'),
    fs = require('fs'),
    path = require('path'),
    TEST_CASE_DIR = path.join(__dirname, 'test-cases'),
    cases = fs.readdirSync(TEST_CASE_DIR)
        .filter(name => name.indexOf('.spec.') > -1)
        .map(name => [name, fs.readFileSync(path.join(TEST_CASE_DIR, name), 'utf8')]);

var fssearcher = function(name) {
    name += '.lua';
    // Check for the file in TEST_CASE_DIR
    if (fs.existsSync(path.join(TEST_CASE_DIR, name))) {
        var txt = fs.readFileSync(path.join(TEST_CASE_DIR, name), 'utf8'),
            fn;

        fn = this.loadString(txt);
        return fn;
    }
};

describe('test cases', function() {
    var test = function(pair) {
        var cxt = luajs.newContext(),
            bin;

        cxt.loadStdLib();

        // Add fs searcher
        cxt._G.get('package').set('searchers', [fssearcher.bind(cxt)]);
        bin = cxt.loadString(pair[1]);

        bin();
    };
    cases.forEach(pair => it(`should pass ${pair[0]}`, test.bind(null, pair)));
});
