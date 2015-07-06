/**
 * Created by Yun on 2014/9/25.
 */

var fs = require("fs");
var path = require("path");
var code =  fs.readFileSync(path.join(path.dirname(module.filename), "test.lua"), {encoding:'utf-8'});

var L = require("../lib/index.js").newContext();

L.loadStdLib();
L._G.set("jsrequire", require);
var f = L.loadString(code);
f();