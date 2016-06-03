-- Variable Scope
do
  local a = "Hello"
  function test1()
    print(a)
  end
end
do
  local a = "Lua.JS"
end
test1()
