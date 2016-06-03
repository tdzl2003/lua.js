/**
 * Created by Yun on 2014/11/7.
 */

var luajs = require('./index');

window.luajs = luajs;

var L = luajs.newContext();

L.loadStdLib();

L._G.metatable = new luajs.types.LuaTable([[1, "__index", window]]);

function httpGet(url, cb){
    var request = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"); ;
    request.addEventListener("readystatechange", function(){
        if (request.readyState == 4){
            if (request.status != 200 && request.status != 0){
                throw new Error("HTTP " + request.status + ": " + url);
            }
            console.info("Loaded: ", url);
            cb(request.responseText);
        }
    });
    request.open("GET", url, true);// 异步处理返回
    request.send();
}

function execute(luas, i){
    i = i || 0;
    if (i>=luas.length){
        return;
    }
    var cur = luas[i];
    if (cur.code){
        L.loadString(cur.code)("embedded");
        execute(luas, i+1);
    } else {
        httpGet(cur.src, function(content){
            L.loadString(content)(cur.src);
            execute(luas, i+1);
        })
    }
}

function runScripts(){
    var scripts = window.document.getElementsByTagName("script");
    var luas = [];
    var works = 0;
    for (var i=0;i<scripts.length; i++){
        var sc = scripts[i];
        if (sc.type == "text/lua" || sc.type == "application/x-lua"){
            if (sc.src){
                luas.push({
                    src: sc.src
                });
            } else {
                luas.push({
                    code: sc.innerHTML
                })
            }
        }
    }
    execute(luas);
}

if (window.addEventListener){
    window.addEventListener("DOMContentLoaded", runScripts, false);
} else {
    window.attachEvent("onload", runScripts);
}
