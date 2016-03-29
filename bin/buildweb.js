/**
 * Created by Yun on 2014/9/25.
 */

var fs= require("fs");

var template = fs.readFileSync("lua.js.template", {encoding:'utf8'});

var reg = /\/\*\@include ([a-z\.\/]*)\*\//g;

var regLua = /\.lua$/;
template = template.replace(reg, function(a, b){
    var script = fs.readFileSync(b, {encoding: 'utf8'});

    if (regLua.test(b)){
        var luajs = require("../lib/index.js");
        return luajs.compile(script);
    }
    return script;
})

fs.writeFileSync("lua.js", template, {encoding: 'utf8'});
