/**
 * Created by tdzl2003 on 6/3/16.
 */
var intercept = require('intercept-stdout');
var assert = require('chai').assert;

beforeEach(function() {
  this.capturedText = "";
  this.unhookIntercept = intercept((function (txt) {
    this.capturedText += txt;
  }).bind(this));
});

afterEach(function(){
  this.unhookIntercept();
  this.unhookIntercept = null;
  this.capturedText = null;
});

var fs = require('fs');
var path = require('path');

function enumDir(dir){
  var paths = fs.readdirSync(dir);
  for (var i = 0; i < paths.length; i++){
    var n = paths[i];
    var fn = path.join(dir, n);
    var st = fs.statSync(fn);
    if (st.isDirectory()){
      return enumDir(fn);
    } else if (/\.lua$/.test(n)) {
      var outfn = fn.replace(/\.lua$/, '.out');
      (function(fn) {
        it(fn, function () {
          var scriptContent = fs.readFileSync(fn, 'utf-8');
          var outputContent = fs.readFileSync(outfn, 'utf-8');

          var luajs = require('../lib');
          var L = luajs.newContext();
          L.loadStdLib();
          L.loadString(scriptContent)();
          assert.equal(this.capturedText, outputContent);
        });
      })(fn);
    }
  }
}

enumDir(__dirname);