/**
 * Created by Yun on 2014/9/24.
 */

var fs = require("fs");
var path = require("path");
var code =  fs.readFileSync(path.join(path.dirname(module.filename), "test.lua"), {encoding:'utf-8'});



var parser = require("../lib/parser.js");
var codegen = require("../lib/codegen.js");

console.log("------Lua Code");
console.log(code);
console.log("------JS Code")
console.log(codegen.run(parser.parse(code)));