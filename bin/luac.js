var luajs = require('../lib');

var fs = require('fs');
var fn = process.argv[2];
var scriptContent = fs.readFileSync(fn, 'utf-8');

console.log(luajs.compile(scriptContent));

