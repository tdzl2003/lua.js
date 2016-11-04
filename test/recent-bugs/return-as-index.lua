function fn(num)
    return num
end
local o = {}
o[fn(1)] = 10
print(o[1])

local n = fn(1)
o[n]=10
print(o[1])