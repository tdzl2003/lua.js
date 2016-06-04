/**
 * Created by tdzl2003 on 6/3/16.
 */
var intercept = require('intercept-stdout');
var expect = require('chai').expect;

var fs = require('fs');
var path = require('path');

var luajs = require('../lib');

function enumDir(dir){
  var paths = fs.readdirSync(dir);
  for (var i = 0; i < paths.length; i++){
    var n = paths[i];
    var fn = path.join(dir, n);
    var st = fs.statSync(fn);
    if (st.isDirectory()){
      enumDir(fn);
    } else if (/\.lua$/.test(n)) {
      (function(fn) {
        var outfn = fn.replace(/\.lua$/, '.out');
        it(path.relative(__dirname, fn), function () {
          var scriptContent = fs.readFileSync(fn, 'utf-8');
          var outputContent = fs.readFileSync(outfn, 'utf-8');

          var captured = "";
          var unhook = intercept(function (txt) {
            captured += txt;
            return '';
          });

          try {
            var L = luajs.newContext();
            L.loadStdLib();
            L.loadString(scriptContent)();
          } finally{
            unhook();
          }
          expect(captured).to.equal(outputContent);
        });
      })(fn);
    }
  }
}

enumDir(__dirname);