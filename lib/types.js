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

    this._linkHead = null;
    this._linkTail = null;

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
            var rec = this.stringMap[k];
            return rec && rec[1];
        case 'object':
            if (k === dummy0){
                return this.array[-1];
            }
            if (k === dummyStr){
                var rec = this.stringMap[k];
                return rec && rec[1];
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

LuaTable.prototype.getRec = function(k) {
    if (typeof(k) === 'string' ){
        return this.stringMap[k];
    } else {
        return this.hashMap[k];
    }
}

LuaTable.prototype.addToLink = function(k, rec){
    if (this._linkHead === null) {
        this._linkHead = this._linkTail = k;
        rec[2] = rec[3] = null;
    } else {
        var last = this.getRec(this._linkTail);
        last[3] = k;
        rec[2] = this._linkTail;
        rec[3] = null;
        this._linkTail = k;
    }
}

LuaTable.prototype.removeFromLink = function(k, rec){
    if (!rec){
        return;
    }
    var prev = rec[2] && this.getRec(rec[2]);
    var next = rec[3] && this.getRec(rec[3]);

    if (prev) {
        prev[3] = rec[3];
    } else {
        this._linkHead = rec[3];
    }
    if (next){
        next[2] = rec[2];
    } else {
        this._linkTail = rec[2];
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
                this.removeFromLink(k, this.stringMap[k]);
                delete this.stringMap[k];
                break;
            case 'object':case 'function':{
                if (!k._hashKey) {
                    // ignore object that is not a key.
                    return;
                }
                this.removeFromLink(k._hashKey, this.hashMap[k._hashKey]);
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
            this.stringMap[k] = [k, v];
            this.addToLink(k, this.stringMap[k]);
            break;
        case 'object':case 'function':{
            if (!k._hashKey) {
                k._hashKey = ++ _hashKeyId;
                //throw new Error("set with a invalid object" + k);
            }
            this.hashMap[k._hashKey] = [k, v];
            this.addToLink(k._hashKey, this.hashMap[k._hashKey]);
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

LuaTable.prototype.toString = function() {
    return ("table " + this._hashKey);
}

LuaTable.prototype.nextKey = function(k) {
    if (k == null){
        k = 0;  //try from start.
    }
    switch (typeof(k)){
        case 'number':
            for (;k < this.array.length;++k){
                if (this.array[k] != null) {
                    return k+1;
                }
            }
            if (this._linkHead === null){
                return null;
            }
            return this.getRec(this._linkHead)[0];
        case 'string':
            var k = this.getRec(k)[3];
            if (k == null){
                return null;
            }
            return this.getRec(k)[0];
        case 'object': case 'function': {
            var k = this.getRec(k._hashKey)[3];
            if (k == null){
                return null;
            }
            return this.getRec(k)[0];
        };
        default: {
            return null;
        }
    }
}
