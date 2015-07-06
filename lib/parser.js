/**
 * Created by Yun on 2014/9/23.
 */

var liblex = require("./lex.js");
var lex = liblex.lex;
var TK = liblex.TK;
var tokenNames = liblex.tokens;

function tokentype(sym){
    switch (typeof(sym)) {
        case 'string':
        case 'number':
            return sym;
        case 'object':
            return sym.id;
    }
}

function tokenName(sym){
    if (typeof(sym) == 'number'){
        return tokenNames[sym];
    } else if (typeof(sym) == 'object') {
        return tokenNames[sym.id];
    } else {
        return sym;
    }
}

function singlevar(s){
    check(s, TK.TK_NAME);
    var ret = s.curr().val;
    s.next();
    return {
        type: "variable",
        val: ret
    };
}

function primaryexp(s){
    var t = tokentype(s.curr())
    switch(t){
        case '(':{
            s.next();
            var exp = expr(s);
            checknext(s, ')');
            return {
                type: "expr.brackets",
                "expr": exp
            };
        }
        case TK.TK_NAME:{
            return singlevar(s);
        }
        case TK.TK_JAVASCRIPT:{
            s.next();
            return {
                type: "expr.javascript",
                "args": funcargs(s)
            }
        }
        default:{
            throw new Error("unexpected symbol " + (tokenNames[t] || t));
        }
    }
}

function testnext(s, expected){
    if (tokentype(s.curr()) == expected){
        s.next();
        return true;
    }
    //return false;
}

function check(s, expected){
    if (tokentype(s.curr()) != expected){
        throw new Error("symbol "+tokenName(expected)+" expected!");
    }
}

function checknext(s, val){
    check(s, val);
    s.next();
}

function str_checkname(s){
    check(s, TK.TK_NAME);
    var ret = s.curr().val;
    s.next();
    return ret;
}

function checkname(s){
    return {
        type: "const.string",
        val: str_checkname(s)
    };
}

function codestring(s){
    check(s, TK.TK_STRING);
    var ret = s.curr().val;
    s.next();
    return {
        type: "const.string",
        val: ret
    };
}

function yindex(s){
    s.next(); /* skip the '[' */
    var exp = expr(s);
    checknext(s, ']');
    return exp;
}

function funcargs(s){
    switch (tokentype(s.curr())){
        case '(':{
            s.next();
            if (s.curr() == ')') {  /* arg list is empty? */
                s.next();
                return [];
            } else {
                var args = explist(s);
                checknext(s, ')');
                return args;
            }
        }
        case '{':{
            return [constructor(s)];
        }
        case TK.TK_STRING:{
            return [codestring(s)];
        }
        default:{
            throw new Error("function arguments expected, got "+ tokenName(s.curr()));
        }
    }
}

function suffixedexp(s){
    var primary = primaryexp(s);
    for (;;) {
        switch(tokentype(s.curr())){
            case '.':{
                s.next();
                var key = checkname(s);
                primary = {
                    "type": "expr.index",
                    "self": primary,
                    "key": key
                };
                break;
            }
            case '[':{
                var key = yindex(s);
                primary = {
                    "type": "expr.index",
                    "self": primary,
                    "key": key
                };
                break;
            }
            case ':':{
                s.next();
                var key = checkname(s);
                var args = funcargs(s);
                primary = {
                    "type": "expr.callMethod",
                    "self": primary,
                    "key": key,
                    "args": args
                }
                break;
            }
            case '(': case '{':case TK.TK_STRING:{
                var args = funcargs(s);
                primary =  {
                    "type": "expr.call",
                    "func": primary,
                    "args": args
                }
                break;
            }
            default:
                return primary;
        }
    }
}

function getunopr(s){
    switch (s.curr()){
        case TK.TK_NOT: return "uop.not";
        case '-': return "uop.minus";
        case '#': return "uop.len";
//        default: return null;
    }
}

function getbinopr(s){
    switch (s.curr()){
        case '+': return 1;
        case '-': return 2;
        case '*': return 3;
        case '/': return 4;
        case '%': return 5;
        case '^': return 6;
        case TK.TK_CONCAT: return 7;
        case TK.TK_EQ: return 8;
        case '<': return 9;
        case TK.TK_LE: return 10;
        case TK.TK_NE: return 11;
        case '>': return 12;
        case TK.TK_GE: return 13;
        case TK.TK_AND: return 14;
        case TK.TK_OR: return 15;
//        default: return null;
    }
}

function simpleexp(s){
    switch (tokentype(s.curr())){
        case TK.TK_NUMBER:{
            var val = s.curr().val;
            s.next();
            return {
                type: "const.number",
                val: val
            }
        }
        case TK.TK_STRING:{
            return codestring(s);
        }
        case TK.TK_NIL: {
            s.next();
            return {
                type: "const.nil"
            }
        }
        case TK.TK_TRUE:{
            s.next();
            return {
                type: "const.boolean",
                val: true
            }
        }
        case TK.TK_FALSE:{
            s.next();
            return {
                type: "const.boolean",
                val: false
            }
        }
        case TK.TK_DOTS: { /* vararg */
            s.next();
            return {
                type: "vararg"
            }
        }
        case '{': {
            return constructor(s);
        }
        case TK.TK_FUNCTION:{
            s.next();
            return body(s);
        }
        default: {
            return suffixedexp(s);
        }
    }
}

var priority = [
    null,
    [6, 6], [6, 6], [7, 7], [7, 7], [7, 7],  /* `+' `-' `*' `/' `%' */
    [10, 9], [5, 4],                 /* ^, .. (right associative) */
    [3, 3], [3, 3], [3, 3],          /* ==, <, <= */
    [3, 3], [3, 3], [3, 3],          /* ~=, >, >= */
    [2, 2], [1, 1]                   /* and, or */
];

var opname = [
    null,
    "op.add", "op.minus", "op.mul", "op.div", "op.mod",
    "op.pow", "op.concat",
    "op.equal", "op.less", "op.lessequal",
    "op.notequal", "op.great", "op.greatequal",
    "op.and", "op.or"
]

exports.opname = opname;

var UNARY_PRIORITY = 8;

function subexpr(s, limit){
    var ret;
    var uop = getunopr(s);
    if (uop) {
        s.next();
        ret = subexpr(s, UNARY_PRIORITY);
        ret = {
            type: 'expr.uop',
            op: uop,
            operand: ret
        }
    } else {
        ret = simpleexp(s);
    }
    var op = getbinopr(s);
    while (op && priority[op][0] > limit){
        s.next();
        var e2 = subexpr(s, priority[op][1]);
        ret = {
            type: 'expr.op',
            op: opname[op],
            left: ret,
            right: e2
        }

        op = getbinopr(s);
    }
    return ret;
}

function expr(s){
    return subexpr(s, 0);
}

function explist(s){
    var exps = [];
    exps.push(expr(s));
    while (testnext(s, ',')){
        exps.push(expr(s));
    }
    return exps;
}

function assignment(s, lefts){
    while (testnext(s, ',')){
        lefts.push(suffixedexp(s));
    }
    checknext(s, '=');
    return {
        type: "stat.assignment",
        lefts: lefts,
        right: explist(s)
    }
}

function exprstat(s){
    var exp1 = suffixedexp(s);
    if (s.curr() == '=' || s.curr() == ',') {
        return assignment(s, [exp1]);
    } else {
        if (exp1.type != "expr.call" && exp1.type != "expr.callMethod" && exp1.type != "expr.javascript"){
            throw new Error("syntax error, unexpected expr type "+exp1.type);
        }
        return {
            "type": "stat.expr",
            "expr": exp1
        };
    }
}

function listfield(s){
    return {
        "type": "field.list",
        "val": expr(s)
    }
}

function recfield(s){
    var key;
    if (tokentype(s.curr()) == TK.TK_NAME){
        key = checkname(s);
    } else {
        key = yindex(s);
    }

    checknext(s, '=');
    return {
        "type": "field.rec",
        "key": key,
        "val": expr(s)
    }
}

function field(s){
    var curr = s.curr();
    switch (tokentype(curr)){
        case TK.TK_NAME:{
            if (s.lookAhead() != '=') {
                return listfield(s);
            } else {
                return recfield(s);
            }
        }
        case '[': {
            return recfield(s);
        }
        default: {
            return listfield(s);
        }
    }
}

function constructor(s){
    checknext(s, '{');

    var fields = [];

    do {
        if (s.curr() == '}') break;
        var fi = field(s);
        if (fi){
            fields.push(fi);
        }
    } while (testnext(s, ',') || testnext(s, ';'));

    checknext(s, '}');

    return {
        "type": "expr.constructor",
        "fields": fields
    }
}

function test_then_block(s, target){
    target.cond = expr(s);
    checknext(s, TK.TK_THEN);
    target.tblock = block(s);
}

function ifstat(s){
    var root = {
        type: "stat.if"
    }
    var current = root;

    s.next(); //skip if
    test_then_block(s, current);
    while (testnext(s, TK.TK_ELSEIF)) {     /*elseif */
        current.fblock = {
            type: "block",
            stats: [
                {
                    type: "stat.if"
                }
            ]
        }
        current = current.fblock.stats[0];
        test_then_block(s, current);
    }
    if (testnext(s, TK.TK_ELSE)){
        current.fblock = block(s);
    }
    checknext(s, TK.TK_END);
    return root;
}

function whilestat(s){
    s.next(); // skip while
    var cond = expr(s);
    checknext(s, TK.TK_DO);
    var blk = block(s);
    checknext(s, TK.TK_END);
    return {
        type: "stat.while",
        cond: cond,
        block: blk
    }
}

function fornum(s, varname){
    s.next(); //skip '='
    var from = expr(s);
    checknext(s, ',');
    var to = expr(s);
    var step;
    if (testnext(s, ',')) {
        step = expr(s);
    }

    return {
        type: "stat.fornum",
        varname: varname,
        from: from,
        to: to,
        step: step
    }
}

function forlist(s, varnames){
    while (testnext(s, ',')){
        varnames.push(str_checkname(s));
    }
    checknext(s, TK.TK_IN);
    return {
        type: "stat.forlist",
        varnames: varnames,
        explist: explist(s)
    }
}

function forstat(s){
    s.next(); // skip for;
    var varname = str_checkname(s);

    var ret;

    switch (s.curr()){
        case '=':
            ret = fornum(s, varname);
            break;
        case ',':
        case TK.TK_IN:
            ret = forlist(s, [varname]);
            break;
        default:
            throw "`=` or `in` expected"
    }
    checknext(s, TK.TK_DO);  // skip do
    ret.block = block(s);
    checknext(s, TK.TK_END);
    return ret;
}

function repeatstat(s){
    s.next();
    var b = block(s);
    checknext(s, TK.TK_UNTIL);
    return {
        type: "stat.repeat",
        until: expr(s),
        block: b
    }
}

function funcname(s){
    var ret = singlevar(s);
    while (testnext(s, '.')){
        var key = checkname(s);
        ret = {
            type: "expr.index",
            self: ret,
            key: key
        }
    }
    if (testnext(s, ':')) {
        var key = checkname(s);
        return {
            type: "stat.method",
            self: ret,
            key: key
        }
    } else {
        return {
            type: "stat.function",
            left: ret
        }
    }
}

function funcstat(s){
    s.next();
    var f = funcname(s);
    f.func = body(s);
    return f;
}

function localfunc(s){
    var name = str_checkname(s);
    return {
        type: "stat.localfunction",
        name: name,
        func: body(s)
    }
}

function localstat(s){
    var names = [];
    do{
        names.push(str_checkname(s));
    } while (testnext(s, ','));

    var right;
    if (testnext(s, '=')){
        right = explist(s);
    }
    return {
        type: "stat.local",
        names: names,
        right: right
    }
}

function retstat(s, isJSReturn){
    var ret = {
        type: isJSReturn ? 'stat.jsreturn' : "stat.return",
        nret: []
    };
    s.next();
    if (block_follow(s) || s.curr() == ';'){
    } else {
        ret.nret = explist(s);
    }

    //skip all ';' after return
    while (testnext(s, ';')){
    }

    return ret;
}

function statement(s){
    var curr = s.curr();
    switch(curr){
        case ';': { /* stat -> ';' (empty statement) */
            s.next();   /* skip ';' */
            break;
        }
        //TODO:
        case TK.TK_IF:
            return ifstat(s);
        case TK.TK_WHILE:
            return whilestat(s);
        case TK.TK_DO:{
            s.next();
            var ret = block(s);
            checknext(s, TK.TK_END);
            return ret;
        }
        case TK.TK_FOR:
            return forstat(s);
        case TK.TK_REPEAT:
            return repeatstat(s);
        case TK.TK_FUNCTION:
            return funcstat(s);
        case TK.TK_LOCAL:{
            s.next();
            if (testnext(s, TK.TK_FUNCTION)){
                return localfunc(s);
            } else {
                return localstat(s);
            }
        }
        case TK.TK_RETURN: {
            return retstat(s);
        }
        case TK.TK_JSRETURN:{
            return retstat(s, true);
        }
        case TK.TK_BREAK: {
            s.next()
            return {
                type:"stat.break"
            }
        }

//        case TK.TK_DBCOLON:
//        case TK.TK_GOTO:

        default:{
            return exprstat(s);
        }
    }
}

function block_follow(s){
    switch (s.curr()){
        case TK.TK_ELSE:
        case TK.TK_ELSEIF:
        case TK.TK_END:
        case TK.TK_EOS:
        case TK.TK_UNTIL:
            return true;
        default:
            return 0;
    }
}

function statlist(s){
    var ret = [];
    while (!block_follow(s)){
        if (s.curr() == TK.TK_RETURN || s.curr() == TK.TK_JSRETURN){
            ret.push(statement(s));
            break;
        }
        var stat = statement(s);
        if (stat) {
            ret.push(stat);
        }
    }
    return ret;
}

function block(s){
    return {
        type: 'block',
        stats: statlist(s)
    }
}

function parlist(s){
    var ret = [];
    if (s.curr() != ')'){
        do {
            switch (tokentype(s.curr())){
                case TK.TK_NAME:{
                    ret.push(str_checkname(s));
                    break;
                }
                case TK.TK_DOTS:{
                    ret.push(TK.TK_DOTS);
                    s.next();
                    break;
                }
                default:
                    throw "<name> or `...` expected";
            }
        } while(testnext(s ,','));
    }
    return ret;
}

function body(s){
    checknext(s, '(');
    var args = parlist(s);
    var varargs = false;
    if (args.length > 0 && args[args.length - 1] == TK.TK_DOTS) {
        args.pop();
        varargs = true;
    }
    checknext(s, ')');
    var body = block(s);
    checknext(s, TK.TK_END);
    return {
        type: 'function',
        args: args,
        varargs: varargs,
        block: body
    }
}

function main(s){
    var ret = {
        type: "function",
        args: [],
        varargs: true,
        block: block(s)
    };
    check(s, TK.TK_EOS);
    return ret;
}
exports.main = main;

function parse(s){
    return exports.main(lex(s));
}
exports.parse = parse;
