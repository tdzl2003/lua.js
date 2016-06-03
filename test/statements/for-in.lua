-- For-in statement
local function test(s, i)
  i = i + 1
  if (i > 10) then return end
  return i
end
for i in test, 1, 0 do
  print(i)
end
