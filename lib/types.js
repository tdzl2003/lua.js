/**
 * Created by Yun on 2014/9/23.
 */

var dummy0 = {
    _hashKey: -1,
    valueOf:function(){return 0;},
    toString:function(){return "0";}
};
function dstype(){
    this._hashKey = -2;
    this.toString = function(){return "";}
}
dstype.prototype = String.prototype;
var dummyStr = new dstype();

exports.dummy0 = dummy0;
exports.dummyStr = dummyStr;

var _hashKeyId = 0;

function LuaTable(fields){
    this.stringMap = {};
    this.array = [];
    this.hashMap = {};
    this.metatable = null;

    this._hashKey = ++ _hashKeyId;

    if (fields){
        for (var i = 0 ;i < fields.length; i++){
            var v = fields[i];
            if (v[0] == 0){
                this.array.push(v[1]);
            } else if (v[0] == 1) {
                this.set(v[1],v[2]);
            } else {
                for (var j = 0; j < v[1].length; j++){
                    this.array.push(v[1][j]);
                }
            }
        }
    }
}
exports.LuaTable = LuaTable;

exports.newHashKey = function(){
    return ++ _hashKeyId;
}
LuaTable.prototype = {};

LuaTable.prototype.constructor = LuaTable;

LuaTable.prototype.get = function(k){
    switch(typeof(k)){
        case 'number':
            return this.array[k-1];
        case 'string':
            return this.stringMap[k];
        case 'object':
            if (k === dummy0){
                return this.array[-1];
            }
            if (k === dummyStr){
                return this.stringMap[k];
            }
            if (k === null){
                throw new Error("table index is nil");
            }
        case 'function':{
            if (!k._hashKey) {
                //throw new Error("get with a invalid object" + k);
                k._hashKey = ++ _hashKeyId;
            }
            var rec = this.hashMap[k._hashKey];
            return rec && rec[1];
        }
        default:{
            throw new Error("get with a invalid argument" + k);
        }
    }
}

LuaTable.prototype.set = function(k, v){
    if (k == null){
        throw new Error("table index is nil");
    }
    if (v == null){
        switch(typeof(k)){
            case 'number':
                if (k == this.array.length){
                    this.array.pop();
                } else {
                    delete this.array[k-1];
                }
                break;
            case 'string':
                delete this.stringMap[k];
                break;
            case 'object':case 'function':{
                if (!k._hashKey) {
                    // ignore object that is not a key.
                    return;
                }
                delete this.hashMap[k._hashKey];
                break;
            }
            default:{
                throw new Error("set with a invalid argument" + k);
            }
        }
        return;
    }
    switch(typeof(k)){
        case 'number':
            this.array[k-1] = v;
            break;
        case 'string':
            this.stringMap[k] = v;
            break;
        case 'object':case 'function':{
            if (!k._hashKey) {
                k._hashKey = ++ _hashKeyId;
                //throw new Error("set with a invalid object" + k);
            }
            this.hashMap[k._hashKey] = [k, v];
            break;
        }
        default:{
            throw new Error("set with a invalid argument" + k);
        }
    }
}

LuaTable.prototype.length = function(){
    var len = this.array.length;
    for (; len > 0 && this.array[len-1] == null; --len){}
    if (len != this.array.length){
        this.array.length = len;
    }

    return this.array.length;
}

LuaTable.prototype.toString = function(){
    return ("table " + this._hashKey);
}
