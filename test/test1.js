/**
 * Created by Yun on 2014/9/23.
 */
var lex = require("../lib/lex.js");

var fs = require("fs");
var path = require("path");
var code =  fs.readFileSync(path.join(path.dirname(module.filename), "test.lua"), {encoding:'utf-8'});

var f = lex.generator(code);

var sym;

while (sym = f()){
//    console.log(typeof(sym), sym);
    switch (typeof(sym)) {
        case 'object':
            console.log(lex.tokens[sym.id], sym.val)
            break;
        case 'number':
            console.log(lex.tokens[sym]);
            break;
        case 'string':
            console.log(sym);
            break;
    }
}
