-- If statement
local a, b = 5, 3
if (a > b) then
  a, b = b, a
end
print(a, b)