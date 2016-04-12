
/**
 * Created by Yun on 2014/9/23.
 */
var lex = require('../lib/lex.js');
var parser = require('../lib/parser.js');

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var code =  fs.readFileSync(path.join(__dirname, 'test-cases', 'test.spec.lua'), 'utf-8');

describe('basic tests', function() {
    describe('lex', function() {
        it('should parse test.spec.lua correctly', function() {
            var f = lex.generator(code);
            var sym;
            var symbols = require('./results1.json'),
                expected;

            while (sym = f()){
                expected = symbols.shift();
                switch (typeof(sym)) {
                    case 'object':
                        assert.equal(expected[0], lex.tokens[sym.id]);
                        assert.equal(expected[1], sym.val);
                        break;
                    case 'number':
                        assert.equal(expected, lex.tokens[sym]);
                        break;
                    case 'string':
                        assert.equal(expected, sym);
                        break;
                }
            }
        });
    });
    
    describe('parser', function() {
        it('should parse test.spec.lua correctly', function() {
            var results = require('./results2.json');
            assert.deepEqual(JSON.parse(JSON.stringify(parser.parse(code))), results);
        });
    });

    describe('codegen', function() {
        var codegen = require('../lib/codegen.js');

        it('should generate code for test.spec.lua correctly', function() {
            var expected = fs.readFileSync(path.join(__dirname, 'results3.txt'), 'utf8');
            assert.equal(expected, codegen.run(parser.parse(code)));
        });
    });
});
