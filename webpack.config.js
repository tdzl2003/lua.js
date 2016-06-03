/**
 * Created by tdzl2003 on 6/3/16.
 */

module.exports = {
  context: __dirname + "/lib",
  entry: "./browser",
  output: {
    path: __dirname + "/dist",
    filename: "luajs.js"
  }
};
