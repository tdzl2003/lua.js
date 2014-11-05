-- base lib

function assert(v, msg)
    if (not v) then
        error(msg or "Assertion failed!")
    end
end

function collectgarbage()
    -- do nothing.
end

local function notImplemented(fn)
    error("Not implemented")
end

dofile = notImplemented

error = __js [[ 
function(val){
    throw new Error(val);
}
]];

getmetatable = __js [[ 
function(val){
    return [val && val.metatable];
}
]]

function ipairs(t)
    return function(t, i)
        if (i >= #t) then
            return
        end
        return i+1, t[i+1]
    end, t, 0
end

loadString = __js [[
    function(str, env){
        return [l.__loadString(str, env)];
    }
]]

function load(ld,source,mod,env)
    if (type(ld) == 'function') then
        local chunks = {};
        for v in ld do
            table.insert(chunk, v)
        end
        ld = table.concat(chunks)
    end
    return loadString(ld, env)
end

loadfile = notImplemented
next = notImplemented
pairs = notImplemented

pcall = __js[[
    function (f){
        var args = Array.prototype.slice.call(arguments, 1);
        try{
            var ret = f.apply(null, args);
            ret.unshift(true);
            return ret;
        } catch(e){
            return [false, e];
        }
    }
]]

function print(...)
    local args = {...}
    for i = 1, #args do
        args[i] = tostring(args[i])
    end
    io.write(table.concat(args, " "))
    io.write("\n")
end

rawequal = __js[[
    function (a, b){
        return [a === b];
    }
]]

rawget = __js[[
    function (t, k){
        var tp = l.__type(t);
        if (tp != 'table') {
            throw Error("rawget called with type " + tp);
        }
        return [t.get(k)];
    }
]]

rawlen = __js[[
    function (t){
        var tp = l.__type(t);
        if (tp != 'table') {
            throw Error("rawlen called with type " + tp);
        }
        return [t.length()];
    }
]]

rawset = __js[[
    function (t, k, v){
        var tp = l.__type(t);
        if (tp != 'table') {
            throw Error("rawget called with type " + tp);
        }
        t.set(k, v);
        return [t];
    }
]]

select = __js[[
    function (index){
        if (index == '#') {
            return arguments.length
        }
        return arguments[index];
    }
]]

setmetatable = __js [[ 
function(val, mt){
    if (typeof(val) != "object") {
        throw new Error("Cannot set metatable to non-object values.");
    }
    val.metatable = mt;
    return []
}
]]

tonumber = __js[[
    function (v){
        return [l.__tonumber(v)];
    }
]]

tostring = __js[[
    function (v){
        return [l.__tostring(v)];
    }
]]

type = __js[[
    function (val){
        return [l.__type(val)];
    }
]]

xpcall = __js[[
    function (f, msgh){
        var args = Array.prototype.slice.call(arguments, 2);
        try{
            return f.apply(null, args);
        } catch(e){
            return msgh(e);
        }
    }
]]

package = {}

package.loaded = {}
package.preload = {}

function require(modname)
    local mod = package.loaded[modname]
    if (mod) then
        return mod
    end

    local func, extra
    for i,v in ipairs(package.searchers) do
        func, extra = v(modname)
        if (func) then
            break;
        end
    end
    local ret = func(modname, extra)
    package.loaded[modname] = package.loaded[modname] or ret
    return package.loaded[modname]
end

--string = {}
string.byte = __js [[
function (s, i, j){
    if (typeof(s) != 'string'){
        s = l.__tostring(s);
        if (s == l.ds){
            // Empty string.
            return [];
        }
    }
    i = i || 1;
    j = j || i;
    if (i < 0){
        i = s.length + i;
    } else {
        i--;
    }
    if (j < 0){
        j = s.length + j + 1;
    }
    var ret = []; 
    for (; i<j; ++i){
        var c = s.charCodeAt(i);
        if (c){
            ret.push(c);
        }
    }
}
]]

string.dump = __js [[
    function (f){
        return [l.__dump(f)];
    }
]]


string.find = __js[[
    function (s, pattern, init, plain){
        if (plain){
            return [s.indexOf(pattern, init && (init-1))+1]
        }
        throw new Error("Not implemented.")
    }
]]

string.len = __js[[
    function (s){
        if (typeof(s) != 'string' && s != l.ds){
            s = l.__tostring(s);
        }
        if (s == l.ds){
            // Empty string.
            return [0];
        }
        return [s.length];
    }
]]

string.lower = __js[[
    function (s){
        if (typeof(s) != 'string' && s != l.ds){
            s = l.__tostring(s);
        }
        if (s == l.ds){
            // Empty string.
            return [s];
        }
        return [s.toLowerCase()];
    }
]]

string.upper = __js[[
    function (s){
        if (typeof(s) != 'string' && s != l.ds){
            s = l.__tostring(s);
        }
        if (s == l.ds){
            // Empty string.
            return [s];
        }
        return [s.toUpperCase()];
    }
]]

string.rep = __js[[
    function (s, n, sep){
        if (sep){
            return new Array(n).join(s+sep) + s;
        } else {
            return new Array(n+1).join(s);
        }
    }
]]

string.reverse = __js[[
    function (s){
        if (typeof(s) != 'string' && s != l.ds){
            s = l.__tostring(s);
        }
        if (s == l.ds){
            // Empty string.
            return [s];
        }        
        return [s.split("").reverse().join("")]
    }
]]

string.sub = __js[[
function (s, i, j){
    if (typeof(s) != 'string' && s != l.ds){
        s = l.__tostring(s);
    }
    if (s == l.ds){
        // Empty string.
        return [s];
    }        
    j = j || s.length;
    if (i < 0){
        i = s.length + i;
    } else {
        i--;
    }
    if (j < 0){
        j = s.length + j + 1;
    }
    return s.substring(s, i, j);
}
]]

table = {}

table.concat = __js [[
function (list, sep, i, j){
    list = list.array;
    if (i){
        if (j){
            list = list.slice(i-1, j-1);
        } else {
            list = list.slice(i-1);
        }
    }
    return [list.join(sep || "")]
}
]]

table.insert = __js [[
function (t, pos, value){
    if (pos){
        t.array.splice(pos-1, 0, value);
    } else {
        t.array.push(value);
    }
    return [];
}
]]

table.pack = __js [[
    function (){
        return [Array.prototype.slice.call(arguments, 0)];
    }
]]
pack = table.pack

table.remove = __js[[
function (t, pos){
    if (pos){
        return t.array.splice(pos-1, 1);
    } else {
        return [t.array.pop()];
    }
}
]]

table.sort = __js[[
function (t, comp){
    if (comp){
        t.array.sort(function(){
            if (comp(a, b)[0]){
                return -1;
            } else if (comp(b, a)[0]){
                return 1;
            }
            return 0;
        })
    } else {
        t.array.sort(function(a, b){
            if (l.__lt(a, b)){
                return -1;
            } else if (l.__lt(b, a)){
                return 1;
            }
            return 0;
        });
    }
}
]]

table.unpack = __js[[
    function (t){
        return t.array;
    }
]]

math = {}

math.abs = __js [[
    function (v){
        return [Math.abs(v)];
    }
]]


math.acos = __js [[
    function (v){
        return [Math.acos(v)];
    }
]]


math.asin = __js [[
    function (v){
        return [Math.asin(v)];
    }
]]

math.atan = __js [[
    function (v){
        return [Math.atan(v)];
    }
]]

math.atan2 = __js [[
    function (y, x){
        return [Math.atan2(y, x)];
    }
]]

math.ceil = __js [[
    function (v){
        return [Math.ceil(v)];
    }
]]

math.cos = __js [[
    function (v){
        return [Math.cos(v)];
    }
]]

math.cosh = __js [[
    function (v){
        return [Math.cosh(v)];
    }
]]

math.deg = __js [[
    function (v){
        return [v*180/Math.PI];
    }
]]

math.exp = __js [[
    function (v){
        return [Math.exp(v)];
    }
]]

math.floor = __js [[
    function (v){
        return [Math.floor(v)];
    }
]]

math.log = __js [[
    function (v, base){
        return [base ? Math.log(v)/Math.log(base) : Math.log(v)];
    }
]]

math.max = __js [[
    function (){
        return [Math.max.apply(null, arguments)];
    }
]]

math.min = __js [[
    function (v){
        return [Math.min.apply(null, arguments)];
    }
]]

math.pi = __js [[Math.PI]]

math.pow = __js [[
    function (x, y){
        return [Math.pow(x, y)];
    }
]]

math.rad = __js [[
    function (v){
        return [v*Math.PI/180];
    }
]]

math.random = __js[[
    function  (m, n){
        if (m){
            if (!n){
                return [Math.floor(Math.random()*m)+1]
            }
            return [Math.floor(Math.random()*(n-m+1))+m]
        }
        return [Math.random()];
    }
]]

math.sin = __js [[
    function (v){
        return [Math.sin(v)];
    }
]]

math.sinh = __js [[
    function (v){
        return [Math.sinh(v)];
    }
]]

math.sqrt = __js [[
    function (v){
        return [Math.sqrt(v)];
    }
]]

math.tan = __js [[
    function (v){
        return [Math.tan(v)];
    }
]]

math.tanh = __js [[
    function (v){
        return [Math.tanh(v)];
    }
]]

bit32 = {}

bit32.arshift = __js[[
    function (x, disp){
        return [x<<disp];
    }
]]

bit32.band = __js[[
    function (x){
        for (var i= 1; i < arguments.length; i++){
            x &= arguments[i];
        }
        return [x];
    }
]]

bit32.bnot = __js[[
    function (x){
        return [~x];
    }
]]

bit32.bor = __js[[
    function (x){
        for (var i= 1; i < arguments.length; i++){
            x |= arguments[i];
        }
        return [x];
    }
]]

bit32.btest = __js[[
    function (x){
        for (var i= 1; i < arguments.length; i++){
            x &= arguments[i];
        }
        return [x != 0];
    }
]]

bit32.bxor = __js[[
    function (x){
        for (var i= 1; i < arguments.length; i++){
            x ^= arguments[i];
        }
        return [x != 0];
    }
]]


io = {}

io.write = __js[[
function (v){
    console.log(v)
}
]]

function io.flush()
end

os = {}

os.clock = __js[[
    (function(){
        var start = Date.now();
        return function(){
            return [(Date.now() - start)/1000];
        }
    })()
]]

function os.difftime(t2, t1)
    return t2 - t1;
end

os.time = __js [[
    function(){
        return [Date.now()/1000];
    }
]]
