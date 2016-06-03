-- Call with return values
local function a(a, b)
    return a+b
end
local function b()
    return 1, 2
end
print(a(b()))
print(a(1, b()))
