local t = {
    1, 2, 3,
    foo=20, bar=40,
    [next] = 1
}

for k,v in pairs(t) do
    print(type(k), v)
end
