/**
 * Created by Yun on 2014/9/23.
 */

// Compile
var parser = require("./parser.js");
exports.parser = parser;
var codegen = require("./codegen.js");
exports.codegen = codegen;
var sign = codegen.sign;

function compile(s){
    if (s.substr(0, sign.length) != sign) {
        return codegen.run(parser.parse(s));
    } else {
        return s;
    }
}
exports.compile = compile;

var types = require("./types.js");
exports.types = types;

var dummy0 = types.dummy0;
var dummyStr = types.dummyStr;

function LuaContext(){
    if (!(this instanceof  LuaContext)){
        return new LuaContext();
    }
    // Globals for lua usage.
    var _G = new types.LuaTable();
    this._G = _G;
    _G.set("_G", _G);
    _G.set("_VERSION", "Lua 5.2");
    _G.set("_LUAJS", "Lua.js 0.1");

    var helpers = {};

    helpers.d0 = dummy0;
    helpers.ds = dummyStr;

    helpers.__getmetatable = function(t){
        if (!t){
            return null;
        }
        switch(typeof(t)){
            case 'object':
                return t.metatable || ((t instanceof types.LuaTable) ? null : helpers.jsObjMT);
            case 'string':
                return helpers.stringMT;
            case 'function':
                if (!f.__lua_function){
                    return helpers.jsFuncMT;
                }
            default:
                return null;
        }
    }

    helpers._f = function(f){
        f.__lua_function = true;
        return f;
    }

    function getMTMethod(t, e){
        var mt = helpers.__getmetatable(t);
        return mt && mt.stringMap && mt.stringMap[e];
    }

    //getter & setter
    helpers.__get = function(s, k){
        var h;
        if (s instanceof types.LuaTable){
            var v = s.get(k);
            if (v){
                return v;
            }
            h = getMTMethod(s, "__index")
            if (!h){
                return null;
            }
        } else if (typeof(s) == 'object' || (typeof(s) == 'function' && !s.__lua_function)) {
            if (typeof(s) == 'function' && s.__beforeBind){
                s = s.__beforeBind;
            }
            var ret = typeof(k)=='number'?s[k-1]:s[k];
            if (typeof(ret) == 'function'){
                var ret1 = ret.bind(s);
                ret1.__beforeBind = ret;
                return ret1;
            } else if (!ret && k == "new") {
                var dummy = function(){}
                dummy.prototype = s.prototype;
                return function(){
                    var ret = new dummy();
                    t.apply(ret, arguments);
                    return ret;
                }
            }
            return ret;
        } else {
            h = getMTMethod(s, "__index")
            if (!h){
                throw new Error("attempt to index a "+helpers.__type(s)+" value.");
            }
        }
        if (typeof(h) == "function"){
            return helpers.__call(h, [s, k])[0];
        }
        return helpers.__get(h, k);
    }
    helpers.__set = function(s, k, v){
        var h;
        if (s instanceof types.LuaTable){
            var oldv = s.get(k);
            if (oldv){
                s.set(k, v);
                return;
            }
            h = getMTMethod(s, "__newindex");
            if (!h){
                s.set(k, v);
                return
            }
        } else if (typeof(s) == 'object' || (typeof(s) == 'function' && !s.__lua_function)) {
            s[k] = v;
            return;
        } else {
            h = getMTMethod(s, "__newindex")
            if (!h){
                throw new Error("attempt to index a "+helpers.__type(s)+" value.");
            }
        }
        if (typeof(h) == "function"){
            helpers.__call(h, [s,k,v]);
        } else {
            helpers.__set(h, k, v);
        }
    };

    // operators:
//    function defineNumberOper(name, opf){
//        helpers[name] = function(a, b){
//            if (typeof(a) == 'number' && typeof(b) == 'number'){
//                return opf(a, b)||dummy0;
//            }
//            var o1 = helpers.__tonumber(a), o2 = helpers.__tonumber(b);
//            if (o1 && o2) {
//                return opf(o1, o2)||dummy0;
//            }
//            var h = getMTMethod(a, name) || getMTMethod(b, name)
//            if (h){
//                return helpers.__call(h, [a, b])[0];
//            }
//            throw new Error("attempt to perform arithmetic on a " + helpers.__type(a)+" value");
//        }
//    }
    helpers.__add = function(a, b){
        if (typeof(a) == 'number' && typeof(b) == 'number'){
            return (a+b)||dummy0;
        }
        var o1 = helpers.__tonumber(a), o2 = helpers.__tonumber(b);
        if (o1 && o2) {
            return (a+b)||dummy0;
        }
        var h = getMTMethod(a, "__add") || getMTMethod(b, "__add")
        if (h){
            return helpers.__call(h, [a, b])[0];
        }
        throw new Error("attempt to perform arithmetic on a " + helpers.__type(a)+" value");
    }
    helpers.__sub = function(a, b){
        if (typeof(a) == 'number' && typeof(b) == 'number'){
            return (a-b)||dummy0;
        }
        var o1 = helpers.__tonumber(a), o2 = helpers.__tonumber(b);
        if (o1 && o2) {
            return (a-b)||dummy0;
        }
        var h = getMTMethod(a, "__sub") || getMTMethod(b, "__sub")
        if (h){
            return helpers.__call(h, [a, b])[0];
        }
        throw new Error("attempt to perform arithmetic on a " + helpers.__type(a)+" value");
    }
    helpers.__mul = function(a, b){
        if (typeof(a) == 'number' && typeof(b) == 'number'){
            return (a*b)||dummy0;
        }
        var o1 = helpers.__tonumber(a), o2 = helpers.__tonumber(b);
        if (o1 && o2) {
            return (a*b)||dummy0;
        }
        var h = getMTMethod(a, "__mul") || getMTMethod(b, "__mul")
        if (h){
            return helpers.__call(h, [a, b])[0];
        }
        throw new Error("attempt to perform arithmetic on a " + helpers.__type(a)+" value");
    }
    helpers.__div = function(a, b){
        if (typeof(a) == 'number' && typeof(b) == 'number'){
            return (a/b)||dummy0;
        }
        var o1 = helpers.__tonumber(a), o2 = helpers.__tonumber(b);
        if (o1 && o2) {
            return (a/b)||dummy0;
        }
        var h = getMTMethod(a, "__div") || getMTMethod(b, "__div")
        if (h){
            return helpers.__call(h, [a, b])[0];
        }
        throw new Error("attempt to perform arithmetic on a " + helpers.__type(a)+" value");
    }
    helpers.__mod = function(a, b){
        if (typeof(a) == 'number' && typeof(b) == 'number'){
            return (a%b)||dummy0;
        }
        var o1 = helpers.__tonumber(a), o2 = helpers.__tonumber(b);
        if (o1 && o2) {
            return (a%b)||dummy0;
        }
        var h = getMTMethod(a, "__mod") || getMTMethod(b, "__mod")
        if (h){
            return helpers.__call(h, [a, b])[0];
        }
        throw new Error("attempt to perform arithmetic on a " + helpers.__type(a)+" value");
    }
    helpers.__pow = function(a, b){
        if (typeof(a) == 'number' && typeof(b) == 'number'){
            return (Math.pow(a,b))||dummy0;
        }
        var o1 = helpers.__tonumber(a), o2 = helpers.__tonumber(b);
        if (o1 && o2) {
            return (Math.pow(a,b))||dummy0;
        }
        var h = getMTMethod(a, "__pow") || getMTMethod(b, "__pow")
        if (h){
            return helpers.__call(h, [a, b])[0];
        }
        throw new Error("attempt to perform arithmetic on a " + helpers.__type(a)+" value");
    }


//
//    defineNumberOper("__add", function(a,b){return a+b;});
//    defineNumberOper("__mul", function(a,b){return a*b;});
//    defineNumberOper("__sub", function(a,b){return a-b;});
//    defineNumberOper("__div", function(a,b){return a/b;});
//    defineNumberOper("__mod", function(a,b){return a%b;});
//    defineNumberOper("__pow", function(a,b){return Math.pow(a,b);});

    helpers.__unm = function(a){
        var o = helpers.__tonumber(a);
        if (o) {
            return -o;
        }
        var h = getMTMethod(a).__unm
        if (h) {
            return helpers.__call(h, [a])[0];
        }
        throw new Error("attempt to perform arithmetic on a " + helpers.__type(a)+" value");
    }

    helpers.__eq = function(a, b){
        return !helpers.__neq(a, b);
    }

    helpers.__neq = function(a,b){
        if (a===b){
            return false
        }
        var ta = helpers.__type(a);
        var tb = helpers.__type(b);
        if (ta != tb || (ta != 'table' && ta !="userdata")){
            return true;
        }
        var h1 = getMTMethod(a, "__eq");
        var h2 = getMTMethod(b, "__eq");
        if (!h1 || h1 != h2){
            return true;
        }
        return !(helpers.__call(h1, [a, b])[0]);
    }

    helpers.__gt = function(a, b){
        return helpers.__lt(b, a);
    }

    helpers.__ge = function(a, b){
        return helpers.__le(b, a);
    }

    helpers.__lt = function(a, b){
        var ta = helpers.__type(a);
        var tb = helpers.__type(b);
        if ((ta=="number" && tb == "number") ||
            (ta == "string" && tb == "string"))  {
            return a < b;
        } else {
            var h = getMTMethod(a, "__lt") || getMTMethod(a, "__lt");
            if (h){
                return !!(helpers.__call(h1, [a, b])[0]);
            }
            throw new Error("attempt to compare " + helpers.__type(a)+" with " + helpers.__type(b));
        }
    }

    helpers.__le = function(a, b){
        var ta = helpers.__type(a);
        var tb = helpers.__type(b);
        if ((ta=="number" && tb == "number") ||
            (ta == "string" && tb == "string"))  {
            return a <= b;
        } else {
            var h = getMTMethod(a, "__le") || getMTMethod(a, "__le");
            if (h){
                return !!(helpers.__call(h1, [a, b])[0]);
            }
            h = getMTMethod(a, "__lt") || getMTMethod(a, "__lt");
            if (h){
                return !(helpers.__call(h1, [a, b])[0]);
            }
            throw new Error("attempt to compare " + helpers.__type(a)+" with " + helpers.__type(b));
        }
    }

    helpers.__concat = function(a, b){
        var ta = helpers.__type(a);
        var tb = helpers.__type(b);
        if ((ta == 'number' || ta == 'string') &&
            (tb == 'number' || tb == 'string')){
            return (""+a+b) || dummyStr;
        }
        var h = getMTMethod(a, "__concat") || getMTMethod(b, "__concat")
        if (h){
            return helpers.__call(h1, [a, b])[0];
        }
        throw new Error("attempt to concatenate a " + helpers.__type(a)+" value");
    }

    // other functions
    helpers.__newTable = function(fields){
        var ret = new types.LuaTable(fields);
        return ret;
    }

    helpers.__len = function(c){
        switch(typeof(c)){
            case 'string':
                return c.length;
        }
        var h = getMTMethod(c, "__len");
        if (h){
            return helpers.__call(h, [a])[0];
        }
        if (c instanceof types.LuaTable) {
            return c.length();
        }
        if (typeof(c) ==  'object' && c.length){
            return c.length;
        }
        throw new Error("attempt to get length of a " + helpers.__type(c)+" value");
    }

    helpers.__tonumber = function(c){
        switch(typeof(c)){
            case 'number':
                return c;
            case 'string':
                return parseInt(s) || dummy0;
            default:
                if (c == dummy0){
                    return c;
                }
        }

        return null;
    }

    helpers.__checknumber = function(c){
        switch(typeof(c)){
            case 'number':
                return c;
            case 'string':
                return parseInt(s);
        }
        if (c == dummy0){
            return c;
        }
        throw new Error("Not a number.");
    }

    helpers.__tostring = function(c){
        if (c == null){
            return "nil";
        }
        switch(typeof(c)){
            case 'number':case 'boolean':
                return c.toString();
            case 'string':
                return c;
            case 'function':
                c._hashKey = c._hashKey || types.newHashKey();
                return 'function('+ c._hashKey+")";
            case 'object':
                if (c == dummy0){
                    return "0";
                }
                if (c == dummyStr){
                    return dummyStr;
                }
                var h = getMTMethod(c, "__tostring");
                if (h){
                    return helpers.__call(h, [c])[0];
                }

                if (c.toString) {
                    return c.toString();
                }
            default:
                return "userdata("+ c + ")";
        }
    }

    helpers.__type = function(c){
        if (c == null){
            return "nil";
        }
        var t = typeof(c);
        switch(t){
            case 'number':case 'boolean':case 'string':case 'function':
                return t;
            case 'object':
                if (c == dummy0){
                    return "number";
                }
                if (c == dummyStr){
                    return dummyStr;
                }
                if (c instanceof types.LuaTable) {
                    return "table";
                }
            default:
                return "userdata";
        }
    }

    helpers.__call = function(f, args){
        if (typeof(f) == 'function'){
            if (f.__lua_function) {
                return f.apply(null, args);
            } else {
                return [f.apply(null, args)];
            }
        }
        var h = getMTMethod(f, "__call");
        if (h){
            args.unshift(h);
            return helpers.__call(h, args);
        }
        throw new Error("attempt to call a " + helpers.__type(f)+" value");
    }

    helpers.__callMethod = function(s, k, args){
        args.unshift(s);
        //helpers.__get(s, k).apply(null, args);
        return helpers.__call(helpers.__get(s, k), args);
    }

    helpers.__dump = function(f){
        if (typeof(f) != "function"){
            throw new Error("bad argument #1 to `dump` (function expected, got " + helpers.__type(f) + ")");
        }
        return codegen.sign + "return "+ f.toString()+";"
    }

    this.loadString = helpers.__loadString = function(s, env){
        s = compile(s);
        //TODO; add extra info for s
        return new Function('_ENV', 'l', s)(env || _G, helpers);
    }

    this.loadStdLib = function(){
        if (!exports.stdlib){
            var fs = require("fs");
            var path = require("path");
            var code = fs.readFileSync(path.join(path.dirname(module.filename), "./stdlib.lua"), {encoding:'utf-8'});
            exports.stdlib = new Function('_ENV', 'l', exports.compile(code));
        }
        exports.stdlib(_G, helpers)();
    }

    this.__helpers = helpers;
}

LuaContext.prototype = {}

exports.LuaContext = exports.newContext = LuaContext;
