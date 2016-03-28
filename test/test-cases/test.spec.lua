local t = {}
for i = 1, 10 do
    local j = 0
    t[i] = function()
       j = j + 1
       assert(j == 1)
    end
end

for i = 1, 10 do
    t[i]()
end
