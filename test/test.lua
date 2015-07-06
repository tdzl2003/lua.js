local t = {}
for i = 1, 10 do
    local j = 0
    t[i] = function()
       j = j + 1
       print(j)
    end
end

for i = 1, 10 do
    t[i]()
end