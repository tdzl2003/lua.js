-- Variable arguments
local function p(...)
   print(...)
end
local function values(...)
   return ...
end
local function add(...)
   local a, b = ...
   return a+b
end
p(values(1, 2))
p("sum=", add(values(1, 2)))
