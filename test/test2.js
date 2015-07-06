/**
 * Created by Yun on 2014/9/24.
 */

var parser = require("../lib/parser.js");

var fs = require("fs");
var path = require("path");
var code =  fs.readFileSync(path.join(path.dirname(module.filename), "test.lua"), {encoding:'utf-8'});


console.log(require("jsonf")(JSON.stringify(parser.parse(code))));
