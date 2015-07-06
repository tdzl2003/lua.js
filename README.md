#Lua.js#

Lua.js is a great project that can convert lua code to javascript.

lua.js is fully written by javascript, so both lua.js self and all generated code can be run on web.

Try it on: [Live Demo](http://luajs.org)

Contact me with:

QQ: 402740419

E-mail: tdzl2003@gmail.com

# Usage #

## Build web version ##

Get [Google Closure Compiler](https://developers.google.com/closure/compiler/), copy compiler to lua.js directory. You need to install java(JRE).

Run buildweb.cmd on windows or write your own buildweb.sh for linux/mac

## Use on html ##

```html
<script type="application/x-lua">
	-- lua code here
</script>
```

## Create other contexts ##

In javascript:

```js
var L = luajs.newContext();
L.loadStdLib();
var f = L.loadString('print "Hello, Lua.js!"');
f();
```

In lua:

```lua
local L = luajs.newContext();
L.loadStdLib();
local f = L.loadString(js);
f();
```

# Limitation #

Coroutine will never be supported by lua.js

__mode and __gc in metatable was not supported by lua.js.

String pattern support is still on working.

# Support #

Thanks for support me by: 

### 支付宝：###

![支付宝](alipay_qrcode.png)

