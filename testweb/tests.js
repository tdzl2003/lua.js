/**
 * Created by Yun on 2014/9/26.
 */
testcodes = [
    'print "Hello, Lua.js!" ',

    '-- Variable Scope\n' +
        'do\n' +
        '  local a = "Hello"\n' +
        '  function test1()\n' +
        '    print(a)\n' +
        '  end\n' +
        'end\n' +
        'do\n' +
        '  local a = "Lua.JS"\n' +
        'end\n' +
        'test1()',

    '-- A+B\n' +
        'do\n' +
        '  local a = "Hello"\n' +
        '  function test1(a, b)\n' +
        '    return a+b\n' +
        '  end\n' +
        'end\n' +
        'print ((test1(1, 2)))',

    '-- Indexed function\n' +
        'local a = {}\n' +
        'function a.foo()\n' +
        '  print("Hello!");\n' +
        'end\n' +
        'a.foo();\n' +
        'function a:bar()\n' +
        '  print("Hello!");\n' +
        'end\n' +
        'a:bar();',

    '-- Call with return values\n' +
        'local function a(a, b)\n' +
        '   return a+b\n' +
        'end\n' +
        'local function b()\n' +
        '   return 1, 2\n' +
        'end\n' +
        'print(a(b()))\n' +
        'print(a(1, b()))',

    '-- Variable arguments\n' +
        'local function p(...)\n' +
        '   print(...)\n' +
        'end\n' +
        'local function values(...)\n' +
        '   return ...\n' +
        'end\n' +
        'local function add(...)\n' +
        '   local a, b = ...\n' +
        '   return a+b\n' +
        'end\n' +
        'p(values(1, 2))\n' +
        'p("sum=", add(values(1, 2)))',

    '-- If statement\n' +
        'local a, b = 5, 3\n' +
        'if (a > b) then\n' +
        '  a, b = b, a\n' +
        'end\n' +
        'print(a, b)',

    '-- Y Combinator\n' +
        'local function Y(f)\n' +
        '  local function _1(u)\n' +
        '    return u(u)\n' +
        '  end\n' +
        '  \n' +
        '  local function _2(x)\n' +
        '    return f(function(...)\n' +
        '      return x(x)(...)\n' +
        '    end)\n' +
        '  end\n' +
        '  \n' +
        '  return _1(_2)\n' +
        'end\n' +
        '\n' +
        'local function F(f)\n' +
        '  return function(x)\n' +
        '    if x == 0 then\n' +
        '      return 1\n' +
        '    end\n' +
        '    return x * f (x - 1)\n' +
        '  end\n' +
        'end\n' +
        '\n' +
        'local factorial = Y(F)\n' +
        'print(factorial(3))',

    '-- For statement\n' +
        'for i = 1, 10 do\n' +
        '  print(i)\n' +
        'end\n' +
        'for i = 10, 1, -1 do\n' +
        '  print(i)\n' +
        'end\n',

    '-- For-in statement\n' +
        'local function test(s, i)\n' +
        '  i = i + 1\n' +
        '  if (i > 10) then return end\n' +
        '  return i\n' +
        'end\n' +
        'for i in test, 1, 0 do\n' +
        '  print(i)\n' +
        'end\n',

    '-- While & Repeat\n' +
        'local i = 1\n' +
        'while i < 10 do\n' +
        '  print(i)\n' +
        '  i = i + 1\n' +
        'end\n' +
        'repeat\n' +
        '  i = i - 1\n' +
        '  print(i)\n' +
        'until i == 0',

    '-- Singleton\n' +
        'do\n' +
        '  local instance\n' +
        '  function getInstance()\n' +
        '    instance = instance or {}\n' +
        '    instance.x = instance.x or 1\n' +
        '    return instance\n' +
        '  end\n' +
        '  local instance = {x = 3}\n' +
        'end\n' +
        '\n' +
        'print(getInstance().x)\n' +
        'getInstance().x = 6\n' +
        'print(getInstance().x)\n'
]