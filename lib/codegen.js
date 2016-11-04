/**
 * Created by Yun on 2014/9/24.
 */

var PRETTY = true;

var gens = {};

var indent, pushIndent, popIndent;

if (PRETTY) {
    indent = "\n";

    pushIndent = function () {
        indent = indent + "    ";
    }
    popIndent= function (){
        indent = indent.substr(0, indent.length - 4);
    }
} else {
    indent = "";
    pushIndent = function (){}
    popIndent = function (){}
}

gens["function"] = function(ast){
    return "l._f(function(" + ast.args.join(',')+")" + codegen(ast.block)+")";
}

gens["jsfunction"] = function(ast){
    return "(function(" + ast.args.join(',')+")" + codegen(ast.block)+")";
}

gens["block"] = function(ast){
    var codes = [];
    pushIndent();
    for (var i = 0; i < ast.stats.length; i++){
        codes.push(codegen(ast.stats[i]));
    }
    popIndent();
    return indent + "{" +  codes.join("") +  indent + "}";
}

gens["stat.getvaargs"] = function(ast){
    return indent + "var __VA_ARG = Array.prototype.slice.call(arguments, " + ast.argCount +");";
}

gens["stat.expr"] = function(ast){
    return indent + codegen(ast.expr) + ";";
}

gens["stat.local"] = function(ast){
    if (!ast.right){
        return indent + "var " + ast.names.join(',') + ";"
    } else if (ast.names.length == 1){
        // a = exp
        return indent + "var " + ast.names[0] + " = " + codegenSimpleVar(ast.right[0]) + ";";
    } else {
        // var list = explist
        var names = [];
        for (var i = 0; i < ast.names.length; i++){
            names.push(ast.names[i] + " = t[" + i + "]");
        }
        //TODO: use a generated template varaiable name.
        return indent + "var t =" + codegenVarList(ast.right)+ "," +
            indent + names.join(",") + ";";
    }
}

gens["stat.if"] = function(ast){
    var base = indent + "if (" + codegenSimpleVar(ast.cond) + ")" + codegen(ast.tblock);

    if (ast.fblock && ast.fblock.stats.length > 0){
        if (ast.fblock.stats.length == 1 && ast.fblock.stats[0].type == "stat.if") {
            //try generate better code for elseif.
            return base + "else" + codegen(ast.fblock.stats[0]);
        } else {
            return base + "else" + codegen(ast.fblock);
        }
    }
    return base;
}

function codegenChecknumber(ast){
    if (ast.type == "const.number"){
        return codegen(ast);
    }
    return "l.__checknumber("+codegenSimpleVar(ast)+")";
}

gens["stat.fornum"] = function(ast){
    if (!ast.step){
        return indent + "for (var "+ast.varname+", " +
            ast.$var + " = " + codegenChecknumber(ast.from) + ", " +
            ast.$limit + " = " + codegenChecknumber(ast.to) + ";" +
            "("+ast.varname+"="+ast.$var+")<="+ast.$limit+";++" + ast.$var +")" +
            codegen(ast.block);
    } else {
        pushIndent();
        var block =
            indent + ast.varname + " = " + ast.$var + ";" +
            codegen(ast.block) +
            indent + ast.$var + " += " + ast.$step;
        popIndent();
        return indent + "var " +
            ast.$var + " = " + codegenChecknumber(ast.from) + ", " +
            ast.$limit + " = " + codegenChecknumber(ast.to) + ", " +
            ast.$step + " = " + codegenChecknumber(ast.step) + "," +
            ast.varname + ";" +
            indent + "while ((" + ast.$step + ">0 && " + ast.$var + "<=" + ast.$limit + ") || " +
            "(" + ast.$step + "<0 && " + ast.$var + ">=" + ast.$limit + ")){" +
            block +
            indent + "}";
    }
}

gens["stat.forlist"] = function(ast){
    pushIndent();
    var st = ast.$st;

    var ret = [];

    ret.push(indent + "var t = " + st+"[0]("+st+"[1],"+st+"[2]);");
    for (var i = 0; i < ast.varnames.length; ++i){
        ret.push(indent + "var " +ast.varnames[i] + " = t[" + i + "];");
    }
    ret.push(indent + "if ("+ ast.varnames[0]+" == null) break;");
    ret.push(indent + st+ "[2] = " + ast.varnames[0] + ";");
    ret.push(codegen(ast.block));
    popIndent();

    return indent + "var " + st + " = " + codegenVarList(ast.explist)+";" +
        indent + "for (;;)" +
        indent + "{" +
        ret.join("") +
        indent + "}"
}

gens["stat.while"] = function(ast){
    return indent + "while ("+ codegenSimpleVar(ast.cond)+")" + codegen(ast.block);
}

gens["stat.repeat"] = function(ast){
    return indent + "do " + codegen(ast.block) + "while (!(" + codegenSimpleVar(ast.until)+"));";
}

gens["stat.break"] = function(ast){
    return indent + "break;"
}

function isVarExpr(exp){
    if (exp.type == "vararg" || exp.type == "expr.call" || exp.type == "expr.callMethod") {
        return true;
    }
}

function isVarlist(explist){
    if (!explist.length){
        return false;
    }
    return isVarExpr(explist[explist.length - 1]);
}

function codegenSimpleVar(exp){
    if (isVarExpr(exp)) {
        return ('('+codegen(exp)+')' + "[0]");
    } else {
        return (codegen(exp));
    }
}

function codegenVarList(explist){
    if (isVarlist(explist)){
        if (explist.length == 1){
            return codegen(explist[0]);
        }
        var pres = [];
        for (var i = 0; i < explist.length-1; i++){
            pres.push(codegenSimpleVar(explist[i]));
        }
        return "[" + pres.join(',')+"].concat(" + codegen(explist[explist.length - 1]) + ")";
    } else {
        var pres = [];
        for (var i = 0; i < explist.length; i++){
            pres.push(codegenSimpleVar(explist[i]));
        }
        return "[" + pres.join(',')+"]";
    }
}

gens["vararg"] = function(ast){
    //TODO: throw a error when use __VA_ARG not in a va_arg function.
    return "__VA_ARG";
}

gens["stat.return"] = function(ast){
    if (isVarlist(ast.nret)){
        return indent + "return " + codegenVarList(ast.nret);
    } else {
        var nrets = [];
        for (var i = 0; i < ast.nret.length; i++){
            nrets.push(codegenSimpleVar(ast.nret[i]));
        }
        return indent + "return [" + nrets + "];";
    }
}

gens["stat.jsreturn"] = function(ast){
    return indent + "return " + codegenSimpleVar(ast.nret);
}

gens["stat.assignment"] = function(ast){
    if (ast.lefts.length == 1){
        //variable = explist
        var right = ast.right.length == 1 ? codegenSimpleVar(ast.right[0]) : (codegenVarList(ast.right) + "[0]");
        // single assignment
        if (ast.lefts[0].type == "expr.index") {
            //a[key] = value
            var tar = ast.lefts[0];
            return indent + "l.__set(" + codegenSimpleVar(tar.self)+", " +codegenSimpleVar(tar.key) + ", " + right + ");";
        }
        return indent + codegen(ast.lefts[0]) + " = " + right + ";";
    } else {
        // list = explist
        var ret = [];

        ret.push(indent + "var t = " + codegenVarList(ast.right) +";");
        for (var i = 0; i < ast.lefts.length; ++i){
            if (ast.lefts[i].type == "expr.index") {
                var tar = ast.lefts[i];
                ret.push(indent + "l.__set(" + codegenSimpleVar(tar.self) + "," + codegenSimpleVar(tar.key) + ",t[" +i+"]);");
            } else {
                ret.push(indent + codegen(ast.lefts[i]) + " = t[" + i + "];");
            }
        }
        return ret.join("");
    }
}

gens["expr.index"] = function(ast){
    return "l.__get(" + codegenSimpleVar(ast.self) + "," + codegenSimpleVar(ast.key)+")";
}

gens["expr.op"] = function(ast){
    var func;
    var op;
    switch(ast.op){
        case "op.add":
            func = "l.__add";
            break;
        case "op.minus":
            func = "l.__sub";
            break;
        case "op.mul":
            func = "l.__mul";
            break;
        case "op.div":
            func = "l.__div";
            break;
        case "op.mod":
            func = "l.__mod";
            break;
        case "op.pow":
            func = "l.__pow";
            break;
        case "op.concat":
            func = "l.__concat";
            break;
        case "op.equal":
            func = "l.__eq";
            break;
        case "op.less":
            func = "l.__lt";
            break;
        case "op.lessequal":
            func = "l.__le";
            break;
        case "op.notequal":
            func = "l.__neq";
            break;
        case "op.great":
            func = "l.__gt";
            break;
        case "op.greatequal":
            func = "l.__ge";
            break;
        case "op.and":
            op = "&&";
            break;
        case "op.or":
            op = "||";
            break;
        default:
            throw new Error(ast.op + " is not implemented yet.");
    }

    if (op){
        return codegenSimpleVar(ast.left) + op + codegenSimpleVar(ast.right);
    } else if (func){
        return func +"(" + codegenSimpleVar(ast.left) + "," + codegenSimpleVar(ast.right) + ")";
    }
}

gens["expr.uop"] = function(ast){
    switch (ast.op){
        case "uop.minus":
            return "l.__unm(" + codegenSimpleVar(ast.operand)+")";
        case "uop.not":
            return "!("+codegenSimpleVar(ast.operand)+")";
        case "uop.len":
            return "l.__len("+codegenSimpleVar(ast.operand) +")";
        default:
            throw new Error(ast.op + " is not implemented yet.");
    }
}

gens["expr.call"] = function(ast){
    var func = codegenSimpleVar(ast.func);
    return "l.__call("+func+","+ codegenVarList(ast.args) +")";
}

gens["expr.jscall"] = function(ast) {
    var func = codegenSimpleVar(ast.func);
    return func+".call(null, "+ codegenVarList(ast.args) +")";
}

gens["expr.callMethod"] = function(ast){
    return "l.__callMethod(" + codegenSimpleVar(ast.self) + "," + codegenSimpleVar(ast.key) + "," + codegenVarList(ast.args) +")";
}

gens["expr.brackets"] = function(ast){
    if (isVarExpr(ast.expr)) {
        return codegenSimpleVar(ast.expr);
    } else {
        return '(' + codegen(ast.expr)+ ")";
    }
}

gens["expr.constructor"] = function(ast){
    if (!ast.fields.length){
        return "l.__newTable()";
    }
    var fields = [];
    for (var i = 0; i < ast.fields.length; i++){
        var f = ast.fields[i];
        if (f.type == "field.list"){
            if (isVarExpr(f.val) && i == ast.fields.length - 1){
                fields.push("[2, " + codegen(f.val) + "]");
            } else {
                fields.push("[0, " + codegenSimpleVar(f.val) + "]");
            }
        } else if (f.type == "field.rec"){
            fields.push("[1, " + codegen(f.key) + "," + codegenSimpleVar(f.val) + "]");
        } else {
            throw new Error("Invalid field type "+ f.type);
        }
    }
    return "l.__newTable([" + fields.join(",")+ "])";
}

gens["variable"] = function(ast){
    return ast.val;
}

gens["const.string"] = function(ast){
    return ast.val ? JSON.stringify(ast.val) : "l.ds";
}
gens["const.number"] = function(ast){
    return ast.val ? JSON.stringify(ast.val) : "l.d0";
}
gens["const.boolean"] = function(ast){
    return JSON.stringify(ast.val);
}

gens["const.nil"] = function(ast){
    return "null";
}

gens["expr.javascript"] = function(ast){
    if (ast.args.length != 1){
        throw new Error("__javascript should have exactly one arguments.");
    }
    if (ast.args[0].type == "const.string") {
        return '(' + ast.args[0].val + ")";
    } else {
        return 'eval(' + codegenSimpleVar(ast.args[0]) +")";
    }
}

function codegen(ast){
    if (gens[ast.type]){
        return gens[ast.type](ast);
    }
    throw new Error("Unsupported ast type " + ast.type);
}

var childfields = {
    "expr.uop": ["operand"],
    "expr.op": ["left", "right"],
    "stat.assignment":["lefts", "right"],
    "stat.expr": ["expr"],
    "field.list": ["val"],
    "field.rec": ["key", "val"],
    "expr.constructor": ["fields", "recs", "list"],
    "stat.if": ["cond", "tblock", "fblock"],
    "stat.fornum": ["from", "to", "step", "block"],
    "stat.forlist": ["explist", "block"],
    "stat.while": ["cond", "block"],
    "stat.repeat": ["until", "block"],
    "expr.index": ["self", "key"],
    "expr.callMethod": ["self", "key", "args"],
    "expr.call": ["func", "args"],
    "expr.brackets": ["expr"],
    "stat.method": ["self", "key", "func"],
    "stat.function": ["left", "func"],
    "stat.localfunction": ["func"],
    "stat.local": ["right"],
    "stat.return": ["nret"],
    "function": ["block"],
    "block": ["stats"]
}

function traverse(func, out){
    return function (ast) {
        function work(curr, parent) {
            if (curr && curr.constructor == Array) {
                for (var i = 0; i < curr.length; i++) {
                    curr[i] = work(curr[i], parent);
                }
                return curr;
            } else if (curr && curr.type) {
                var ret = func(curr, parent) || curr;
                var fields = childfields[ret.type];
                if (fields) {
                    for (var i = 0; i < fields.length; i++) {
                        ret[fields[i]] = work(ret[fields[i]], ret);
                    }
                }

                if (out){
                    ret = out(ret, parent) || ret;
                }

                return ret;
            }
        }
        return work(ast);
    }
}
exports.traverse = traverse;

exports.phases = [];

exports.postphases = [];

exports.run = function(ast){
//    console.log("\n");
    for (var i= 0; i < exports.phases.length; i++){
//        console.log(require("jsonf")(JSON.stringify(ast)));
        ast = exports.phases[i](ast);
//        console.log("\n");
    }
    //console.log(require("jsonf")(JSON.stringify(ast)));
    var ret =  codegen(ast);
//    var ret = "";
    for (var i= 0; i < exports.postphases.length; i++){
//        console.log(ret);
        ret = exports.postphases[i](ret);
    }
//    console.log(ret);
    return ret;
};

// process stat.localfunc & stat.local
(function(){
    exports.phases.push(traverse(function(ast){
        switch (ast.type ) {
            case 'function':{
                if (ast.varargs){
                    ast.block.stats.unshift({
                        type: "stat.getvaargs",
                        argCount: ast.args.length
                    });
                }

                // add return for function that does not return a value.
                var stats = ast.block.stats;
                if (stats.length == 0 || stats[stats.length-1].type != "stat.return"){
                    stats.push({
                        type: 'stat.return',
                        nret: []
                    });
                }
                break;
            }
            case "block":{
                var out = [];
                for (var i= 0; i < ast.stats.length; i++){
                    var curr = ast.stats[i];
                    switch (curr.type){
                        case 'stat.localfunction':{
                            // local function a  -> local a = function()
                            out.push({
                                type: 'stat.local',
                                names: [curr.name]
                            });
                            out.push({
                                type: 'stat.assignment',
                                lefts: [{
                                    type: "variable",
                                    val: curr.name
                                }],
                                right: [curr.func]
                            })
                            break;
                        }

                        case 'stat.function':{
                            out.push({
                                type: 'stat.assignment',
                                lefts: [curr.left],
                                right: [curr.func]
                            });
                            break;
                        }

                        case 'stat.method':{
                            curr.func.args.unshift("self");
                            out.push({
                                type: 'stat.assignment',
                                lefts: [{
                                    type: "expr.index",
                                    self: curr.self,
                                    key: curr.key
                                }],
                                right: [curr.func]
                            });
                            break;
                        }

                        default:
                            out.push(ast.stats[i]);
                    }
                }
                ast.stats = out;
            }
        }
    }));
})();

//phase: check global variable;
(function(){
    exports.phases.push(function(ast){
        var blocklevel = [];
        var top;
        var varNames = {};
        var varId = 0;
        ast = traverse(function(curr){
            var names;
            switch(curr.type){
                case 'block':{
                    names = [];
                    break;
                }
                case 'function':{
                    names = curr.args;
                    break;
                }
                case 'stat.fornum':{
                    names = [curr.varname, "$var", "$limit", "$step"];
                    break;
                }
                case 'stat.forlist':{
                    names = curr.varnames;
                    names.push("$st");
                    break;
                }
                case 'variable':{
                    if (varNames[curr.val]) {
                        var ref;
                        var stack = varNames[curr.val];
                        if (top.curr.type == "fornum" || top.curr.type == "forlist"){
                            // defining for head.
                            // body will in another block;

                            //check whether there's another define.
                            if (stack[stack.length-1] != top.curr){
                                ref = stack[stack.length - 1];
                            } else if (stack.length > 1){
                                ref = stack[stack.length - 2];
                            }
                        } else {
                            ref = stack[stack.length - 1];
                        }
                        if (ref){
                            curr.val = curr.val + "$" + ref.id;
                            return ;
                        }
                    }
                    if (curr.val == '_ENV'){
                        return ;
                    }
                    // global variable. use _ENV[name]
                    return {
                        "type": "expr.index",
                        "self": {
                            "type": "variable",
                            "val": "_ENV"
                        },
                        "key": {
                            "type": "const.string",
                            "val": curr.val
                        }
                    }
                }
            }
            if (names){
                if (top) {
                    blocklevel.push(top);
                }
                top = {
                    curr: curr,
                    names: names.slice(0)
                };
                for (var i= 0; i < names.length; i++){
                    var name = names[i];
                    varNames[name] = varNames[name] || [];
                    var id = ++varId;
                    names[i] = name + "$" + id;
                    varNames[name].push({
                        id: id,
                        curr: curr
                    });
                }

                if (curr.type == 'stat.fornum'){
                    curr.varname = names[0];
                    curr.$var = names[1];
                    curr.$limit = names[2];
                    curr.$step = names[3];
                } else if (curr.type == "stat.forlist") {
                    curr.$st = names.pop();
                }
            }
        }, function(curr){
            if (top && top.curr == curr) {
                for (var i = 0; i < top.names.length; i++){
                    var name = top.names[i];
                    varNames[name].pop();//assert == blocklevel
                    if (varNames[name].length == 0){
                        delete varNames[name];
                    }
                }
                top = blocklevel.pop();
            } else if (curr.type == 'stat.local') {
                //Define local variables in current block.
                // define when out of this statement to avoid effecting initialize list.
                //add to current block;
                for (var i= 0; i < curr.names.length; i++){
                    var name = curr.names[i];
                    varNames[name] = varNames[name] || [];
                    var stack = varNames[name];
                    if (stack.length > 0 && stack[stack.length-1] === top){
                        // variable redefined.
                        var id = stack[stack.length - 1].id = ++varId;
                        curr.names[i] = name + "$" + id;
                        continue;
                    }
                    var id = ++varId;
                    curr.names[i] = name + "$" + id;
                    stack.push({
                        id: id,
                        curr: top.curr
                    });
                    top.names.push(name);
                }
            }
        })(ast);
        return ast;
    });
})();

function transformBreak(block) {
    function work(curr, parent) {
        if (curr && curr.constructor == Array) {
            for (var i = 0; i < curr.length; i++) {
                curr[i] = work(curr[i], parent);
            }
            return curr;
        } else if (curr && curr.type) {
            if (curr.type === 'function') {
                return curr;
            }
            var ret = curr;
            if (curr.type === 'stat.break') {
                return  {
                    "type": "stat.jsreturn",
                    "nret": {
                        type: "const.boolean",
                        val: true
                    }
                };
            }
            var fields = childfields[ret.type];
            if (fields) {
                for (var i = 0; i < fields.length; i++) {
                    ret[fields[i]] = work(ret[fields[i]], ret);
                }
            }

            return ret;
        }
    }
    return work(block);
}

// Fix issue #2
(function(){
    exports.phases.push(function(ast) {
        var stack = [];
        ast = traverse(function(curr){
            switch(curr.type){
                case 'function':
                {
                    if (stack.length > 0){
                        var top = stack[stack.length-1];
                        for (var i= 0; i < top.length; i++){
                            top[i].has_closure = true;
                        }
                    }
                    stack.push([]);
                    break;
                }
                case 'stat.fornum':
                case 'stat.forlist':
                case 'stat.repeat':
                case 'stat.while':
                {
                    stack[stack.length-1].push(curr);
                }
                break;
            }
        }, function(curr){
            switch(curr.type){
                case 'function':
                {
                    stack.pop();
                    break;
                }
                case 'stat.fornum':
                case 'stat.forlist':
                {
                    if (curr.has_closure){
                        var block = curr.block;

                        /*
                            for (var i= 0; i < 100; i++){
                                if (function(i){
                                }(i)) break;
                            }
                        */

                        var newBlock = {
                            "type": "block",
                            "stats": [
                                {
                                    "type": "stat.if",
                                    "cond": {
                                        "type": "expr.jscall",
                                        "func": {
                                            "type": "jsfunction",
                                            "args": [
                                                curr.varname
                                            ],
                                            "varargs": false,
                                            block: transformBreak(block),
                                        },
                                        "args": [
                                            {
                                                "type" : "variable",
                                                "val": curr.varname
                                            }
                                        ]
                                    },
                                    "tblock" : [
                                        {
                                            "type": "stat.break"
                                        }
                                    ]
                                }
                            ]
                        }
                        curr.block = newBlock;
                    }
                    break;
                }
                case 'stat.repeat':
                case 'stat.while':
                {
                    var block = curr.block;

                    /*
                     for (var i= 0; i < 100; i++){
                     function(i){
                     }(i)
                     }
                     */

                    var newBlock = {
                        "type": "block",
                        "stats": [
                            {
                                "type": "stat.if",
                                "cond": {
                                    "type": "expr.jscall",
                                    "func": {
                                        "type": "jsfunction",
                                        "args": [
                                        ],
                                        "varargs": false,
                                        block: transformBreak(block),
                                    },
                                    "args": [
                                    ]
                                },
                                "tblock" : {
                                    "type": "block",
                                    "stats": [
                                        {
                                            "type": "stat.break"
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                    curr.block = newBlock;
                    break;
                }
            }
        })(ast);
        return ast;
    });
})();

var sign = "/*lua.js generated code*/";
exports.sign = sign;
//Post-Phase: add _ENV upvalue for whole scope.
(function() {
    exports.postphases.push(function(code){
        code = sign + 'return '+code+';';
        return code;
    });
})();
