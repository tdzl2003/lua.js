/**
 * Created by Yun on 2014/9/23.
 */

var tokens = [
    "<eof>",
    "and", "break", "do", "else", "elseif",
    "end", "false", "for", "function", "goto", "if",
    "in", "local", "nil", "not", "or", "repeat",
    "return", "then", "true", "until", "while",
    "..", "...", "==", ">=", "<=", "~=", "::", "<--orgion-eof>",
    "<number>", "<name>", "<string>",
    "__javascript", "__jsreturn"
];
exports.tokens = tokens;

var reserved = {
    "and":1,
    "break":2, "do":3, "else":4, "elseif":5,
    "end":6, "false":7, "for":8, "function":9, "goto":10, "if":11,
    "in":12, "local":13, "nil":14, "not":15, "or":16, "repeat":17,
    "return":18, "then":19, "true":20, "until":21, "while":22,

    "__javascript":34,
    "__js": 34,
    "__jsreturn": 35
}

var TK = {
    TK_EOS: 0,

    /* terminal symbols denoted by reserved words */
    TK_AND : 1,
    TK_BREAK : 2,
    TK_DO : 3,
    TK_ELSE : 4,
    TK_ELSEIF : 5,
    TK_END : 6,
    TK_FALSE : 7,
    TK_FOR : 8,
    TK_FUNCTION : 9,
    TK_GOTO : 10,
    TK_IF : 11,
    TK_IN : 12,
    TK_LOCAL : 13,
    TK_NIL : 14,
    TK_NOT : 15,
    TK_OR : 16,
    TK_REPEAT : 17,
    TK_RETURN : 18,
    TK_THEN : 19,
    TK_TRUE : 20,
    TK_UNTIL : 21,
    TK_WHILE : 22,
    /* other terminal symbols */
    TK_CONCAT : 23,
    TK_DOTS: 24,
    TK_EQ: 25,
    TK_GE: 26,
    TK_LE: 27,
    TK_NE: 28,
    TK_DBCOLON:29,

    TK_NUMBER:31,
    TK_NAME: 32,
    TK_STRING: 33,

    TK_JAVASCRIPT: 34,
    TK_JSRETURN: 35
};

exports.TK = TK;

var lalphaExp = /^[A-Za-z\_]$/;
function lislalpha(ch){
    return lalphaExp.test(ch);
}

var digitExp = /^[0-9]$/;
function lisdigit(ch){
    return digitExp.test(ch);
}

var hexdigitExp = /^[0-9a-fA-F]$/
function lishexdigit(ch){
    return hexdigitExp.test(ch);
}

var lalnumExp = /^[0-9A-Za-z\_]$/;
function lislalnum(ch){
    return lalnumExp.test(ch);
}

function isNewLine(ch){
    return ch=='\n' || ch == '\r';
}

/*
 ** skip a sequence '[=*[' or ']=*]' and return its number of '='s or
 ** -1 if sequence is malformed
 */
function skip_sep(curr, next, save){
    var count = 0;
    var ch = curr();
    if (ch != '[' && ch != ']'){
        throw "Lexical internal error!";
    }
    if (save){
        save(ch);
    }
    next()
    while (curr() == '='){
        next();
        if (save){
            save(curr());
        }
        ++count;
    }
    return curr() == ch ? count : (-count - 1);
}

function inclinenumber(curr, next){
    var old = curr();
    next();
    if (isNewLine(curr()) && curr() != old){
        next();
    }
}

//TODO: avoid wasting space when read comments.
function read_long_string(curr, next, sep){
    var buff = [];
    function save(ch){
        buff.push(ch);
    }
    next();/* skip 2nd `[' */
    /* string starts with a newline? */
    if (isNewLine(curr())){
        inclinenumber(curr, next);
    }
    for (;;){
        var ch = curr();
        switch(ch){
            case null:
                throw "unfinished long string/comment";
            case ']':{
                if (skip_sep(curr, next, save) == sep){
                    /* skip 2nd `]' */
                    next();
                    buff.splice(-sep-1, sep+1);
                    return buff.join("");
                }
                break;
            }
            case '\n':case '\r':{
                inclinenumber(curr, next);
                save('\n');     /* avoid wasting space */
                break;
            }
            default:{
                save(ch);
                next();
            }
        }
    }
}

//TODO: support utf8 `\` escape.
function read_string(curr, next){
    var buff = [];
    var beginCh = curr();
    next();
    var currCh;
    while ((currCh = curr()) != beginCh){
        switch (currCh){
            case null:
                throw "unfinished string";
            case '\n':
            case '\r':
                throw "unfinished string";
            case '\\':{
                next();
                currCh = curr();
                switch (currCh){
//                    case 'a': buff.push('\a'); next(); break;
                    case 'b': buff.push('\b'); next(); break;
                    case 'f': buff.push('\f'); next(); break;
                    case 'n': buff.push('\n'); next(); break;
                    case 'r': buff.push('\r'); next(); break;
                    case 't': buff.push('\t'); next(); break;
                    case 'v': buff.push('\011'); next(); break;
                    case '\n': case '\r': {
                        buff.push('\n');
                        inclinenumber();
                        break;
                    }
                    case '\\': case '\"': case '\'':{
                        buff.push(currCh);
                        next();
                        break;
                    }
                    case null:
                        throw "unfinished string";

                    case 'z':{
                        next();
                        while (lisspace(curr())){
                            next();
                        }
                        break;
                    }

                    case 'x': throw "esacpe for char code not supported in lua.js yet.";
                    default:{
                        if (!lisdigit(currCh)){
                            throw "invalid escape sequence" + currCh;
                        }
                        throw "esacpe for char code not supported in lua.js yet.";
                    }
                }
                break;
            }
            default: {
                buff.push(currCh);
                next();
            }
        }
    }
    next();
    return buff.join("");
}

function parseFloat1(str, radix)
{
    var parts = str.split(".");
    if ( parts.length > 1 )
    {
        return parseInt(parts[0], radix) + parseInt(parts[1], radix) / Math.pow(radix, parts[1].length);
    }
    return parseInt(parts[0], radix);
}

function read_numeral(curr, next){
    var first = curr();
    next();
    var hex = true;
    if (first == '0' && (curr() == 'x' || curr() == 'X')){   /* hexadecimal? */
        next();
        var buff=[first];
        var ch = curr();
        var prev = first;
        while (lishexdigit(ch) || ch == '.' || ch == 'e' || (prev == 'e' && ch == '-')){
            buff.push(ch);
            next();
            prev = ch;
            ch = curr();
        }
        return parseFloat1(buff.join(""), 16);
        //throw new Error("Hexadecimal numeric not supported in lua.js yet.");
    } else {
        var buff = [first];
        var ch = curr();
        var prev = first;
        while (lisdigit(ch) || ch == '.' || ch == 'e' || (prev == 'e' && ch == '-')){
            buff.push(ch);
            next();
            prev = ch;
            ch = curr();
        }

        //not TODO: use locale decimal point.
        return parseFloat(buff.join(""));
    }
}

function read_identifier_name(curr, next){
    var buff = [];
    while (lislalnum(curr())){
        buff.push(curr());
        next();
    }
    return buff.join("");
}

function is_reserved(name){
    return typeof(reserved[name]) == 'number' && reserved[name];
}

function llex(curr, next){
    for (;;){
        switch(curr()){
            case '\n': case '\r':
            case ' ': case '\f': case '\t': case '\011':next();break;
            case '-':{
                /* '-' or '--' (comment) */
                next();
                if (curr() != '-') {
                    return '-';
                }
                /* else is a comment */
                next();
                var ch = curr();
                if (ch == '[') {        /* long comment? */
                    var sep = skip_sep(curr, next);
                    if (sep >= 0){
                        read_long_string(curr, next, sep);    /* skip long comment */
                        break;
                    }
                }

                /* else short comment */
                while (ch && ch != "\n" && ch != "\r"){
                    /* skip until end of line (or end of file) */
                    next();
                    ch = curr();
                }
                break;
            }
            case '[':{
                /* long string or simply '[' */
                var sep = skip_sep(curr, next);
                if (sep >= 0){
                    return {
                        id: TK.TK_STRING,
                        val: read_long_string(curr, next, sep)
                    };
                } else if (sep == -1){
                    return '[';
                } else {
                    throw "invalid long string delimiter";
                }
            }
            case '=':{
                next();
                if (curr()!= '=') {
                    return '=';
                } else {
                    next();
                    return TK.TK_EQ;
                }
            }
            case '<':{
                next();
                if (curr()!= '=') {
                    return '<';
                } else {
                    next();
                    return TK.TK_LE;
                }
            }
            case '>':{
                next();
                if (curr()!= '=') {
                    return '>';
                } else {
                    next();
                    return TK.TK_GE;
                }
            }
            case '~':{
                next();
                if (curr()!= '=') {
                    return '~';
                } else {
                    next();
                    return TK.TK_NE;
                }
            }
            case ':': {
                next();
                if (curr() != ':'){
                    return ':';
                } else {
                    next(ls);
                    return TK.TK_DBCOLON;
                }
            }
            case '"': case '\'': {  /* short literal strings */
                return {
                    id: TK.TK_STRING,
                    val: read_string(curr, next)
                };
            }
            case '.': {  /* '.', '..', '...', or number */
                next();
                if (curr() == ".") {
                    next();
                    if (curr() ==  ".")
                    {
                        next();
                        return TK.TK_DOTS;/* '...' */
                    }
                    else return TK.TK_CONCAT;   /* '..' */
                }
                else if (!lisdigit(curr())) return '.';
                /* else go through */
            }
            case '0': case '1': case '2': case '3': case '4':
            case '5': case '6': case '7': case '8': case '9':
            {
                return {
                    id: TK.TK_NUMBER,
                    val: read_numeral(curr, next)
                };
            }
            case null:{
                return TK.TK_EOS;
            }
            default:{
                if (lislalpha(curr())){
                    var str = read_identifier_name(curr, next);
                    var reserved = is_reserved(str);
                    if (reserved){
                        return reserved;
                    }
                    return {
                        id: TK.TK_NAME,
                        val: str
                    };
                } else {
                    /* single-char tokens (+ - / ...) */
                    var ret = curr();
                    next();
                    return ret;
                }
            }
        }
    }
}

function generator(s){
    var cur = 0;
    function curr(){
        if (cur < s.length){
            return s.charAt(cur);
        }
        return null;
    }
    function next(){
        if (cur < s.length){
            ++cur;
        }
    }

    return function(){
        return llex(curr, next);
    }
}
exports.generator = generator;

function lex(s){
    var gen = generator(s);
    var curr = gen();
    var next = gen();
    return {
        curr: function(){
            return curr;
        },
        lookAhead: function(){
            return next;
        },
        next: function(){
            curr = next;
            next = gen();
        }
    }
}
exports.lex = lex;
