-- Complex

local Complex
Complex = {
    __add = function(a, b)
        return Complex.new(a.r+b.r, a.i+b.i)
    end,
    __mul = function(a, b)
        return Complex.new(a.r*b.r-a.i*b.i, a.r*b.i+a.i*b.r)
    end,
    __eq = function(a, b)
        return a.r == b.r and a.i == b.i
    end,
    __tostring = function(a)
        return "<"..a.r..","..a.i..">"
    end
}

Complex.new = function(r, i)
    local ret = {r=r, i=i}
    setmetatable(ret, Complex);
    return ret
end

local a = Complex.new(1, 0)
local b = Complex.new(0, 1)

print(a+b)
print(a*b)
print(a*b == b)
